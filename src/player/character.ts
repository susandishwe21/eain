import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { palette, playerConfig } from '../config'
import type { Colliders } from '../world/colliders'
import { material } from '../world/props'
import type { InputState } from './controls'

type Pose = 'idle' | 'walk' | 'run' | 'sit'
const poses: Pose[] = ['idle', 'walk', 'run', 'sit']
interface GirlAsset { model: THREE.Object3D, clips: THREE.AnimationClip[] }

/** The signed smallest turn from one heading to another, in -π..π. */
export const angleDelta = (angle: number) => angle - Math.PI * 2 * Math.floor((angle + Math.PI) / (Math.PI * 2))

/**
 * A village girl from simple shapes, facing +z: htamein (wrap skirt), eingyi (blouse), hair in a
 * bun and thanaka on her cheeks. Named groups (Hips, Torso, Head, ArmL…) are what the clips animate.
 * This is also the source of public/models/girl.glb.
 */
export function buildGirl(): GirlAsset {
  const model = new THREE.Group()
  model.name = 'Girl'
  const part = (name: string, parent: THREE.Object3D, position: [number, number, number]) => {
    const group = new THREE.Group()
    group.name = name
    group.position.set(...position)
    parent.add(group)
    return group
  }
  const shape = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string, position: [number, number, number]) => {
    const mesh = new THREE.Mesh(geometry, material(color))
    mesh.position.set(...position)
    parent.add(mesh)
  }

  const hips = part('Hips', model, [0, 0.42, 0])
  // Htamein: a long wrap skirt to the ankles, with a darker hem.
  shape(hips, new THREE.CylinderGeometry(0.12, 0.165, 0.38, 8), palette.leaf, [0, -0.17, 0])
  shape(hips, new THREE.CylinderGeometry(0.166, 0.17, 0.05, 8), palette.forest, [0, -0.36, 0])
  // Legs stay hidden under the skirt; only her sandalled feet show as they swing.
  for (const [name, x] of [['LegL', 0.06], ['LegR', -0.06]] as const) {
    shape(part(name, hips, [x, -0.02, 0]), new THREE.BoxGeometry(0.07, 0.05, 0.13), palette.wood, [0, -0.375, 0.025])
  }

  const torso = part('Torso', hips, [0, 0, 0])
  // Eingyi: a short fitted blouse.
  shape(torso, new THREE.CylinderGeometry(0.1, 0.125, 0.3, 8), palette.haze, [0, 0.15, 0])
  for (const [name, x] of [['ArmL', 0.135], ['ArmR', -0.135]] as const) {
    const arm = part(name, torso, [x, 0.27, 0])
    shape(arm, new THREE.CylinderGeometry(0.04, 0.035, 0.1, 6), palette.haze, [0, -0.04, 0])
    shape(arm, new THREE.CylinderGeometry(0.028, 0.025, 0.22, 6), palette.wood, [0, -0.15, 0])
    shape(arm, new THREE.SphereGeometry(0.03, 6, 4), palette.wood, [0, -0.27, 0])
  }

  const head = part('Head', torso, [0, 0.33, 0])
  shape(head, new THREE.CylinderGeometry(0.035, 0.04, 0.06, 6), palette.wood, [0, 0, 0])
  shape(head, new THREE.SphereGeometry(0.1, 10, 8), palette.wood, [0, 0.1, 0])
  // Hair: a cap over the crown and down the back, gathered into a bun.
  shape(head, new THREE.SphereGeometry(0.106, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.35), palette.forest, [0, 0.105, -0.005])
  shape(head, new THREE.SphereGeometry(0.106, 10, 8, Math.PI, Math.PI, 0, Math.PI * 0.7), palette.forest, [0, 0.1, -0.01])
  shape(head, new THREE.SphereGeometry(0.055, 8, 6), palette.forest, [0, 0.17, -0.085])
  for (const x of [0.035, -0.035]) shape(head, new THREE.SphereGeometry(0.014, 5, 4), palette.forest, [x, 0.115, 0.092])
  // Thanaka: pale circles on both cheeks.
  for (const x of [0.052, -0.052]) shape(head, new THREE.SphereGeometry(0.026, 6, 4), palette.cream, [x, 0.075, 0.078])

  return { model, clips: buildClips() }
}

/** Looping keyframe clips for the shape-built girl: each joint swings as a sine over one cycle. */
function buildClips() {
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1)
  const steps = 12
  const turn = (joint: string, axis: THREE.Vector3, period: number, angle: (phase: number) => number) => {
    const times: number[] = [], values: number[] = []
    const q = new THREE.Quaternion()
    for (let i = 0; i <= steps; i++) {
      times.push((i / steps) * period)
      values.push(...q.setFromAxisAngle(axis, angle((i / steps) * Math.PI * 2)).toArray())
    }
    return new THREE.QuaternionKeyframeTrack(`${joint}.quaternion`, times, values)
  }
  const height = (period: number, y: (phase: number) => number) => {
    const times: number[] = [], values: number[] = []
    for (let i = 0; i <= steps; i++) {
      times.push((i / steps) * period)
      values.push(0, y((i / steps) * Math.PI * 2), 0)
    }
    return new THREE.VectorKeyframeTrack('Hips.position', times, values)
  }
  // A negative swing about X brings a leg or arm forward.
  const stride = (period: number, legs: number, arms: number, lean: number, bounce: number) => [
    turn('LegL', X, period, (p) => -legs * Math.sin(p)),
    turn('LegR', X, period, (p) => legs * Math.sin(p)),
    turn('ArmL', X, period, (p) => arms * Math.sin(p)),
    turn('ArmR', X, period, (p) => -arms * Math.sin(p)),
    turn('Torso', X, period, () => lean),
    height(period, (p) => 0.42 - bounce * Math.abs(Math.cos(p))),
  ]
  return [
    new THREE.AnimationClip('idle', 3, [
      height(3, (p) => 0.42 + 0.004 * Math.sin(p)),
      turn('Torso', X, 3, (p) => 0.015 * Math.sin(p)),
      turn('Head', Y, 3, (p) => 0.15 * Math.sin(p)),
      turn('ArmL', Z, 3, (p) => 0.06 + 0.02 * Math.sin(p)),
      turn('ArmR', Z, 3, (p) => -0.06 - 0.02 * Math.sin(p)),
    ]),
    new THREE.AnimationClip('walk', 0.8, stride(0.8, 0.45, 0.35, 0.03, 0.012)),
    new THREE.AnimationClip('run', 0.5, stride(0.5, 0.85, 0.75, 0.22, 0.035)),
    // Sitting in the boat: knees forward, hands resting forward on the tiller.
    new THREE.AnimationClip('sit', 1, [
      height(1, () => 0.2),
      turn('LegL', X, 1, () => -1.35),
      turn('LegR', X, 1, () => -1.35),
      turn('ArmL', X, 1, () => -0.5),
      turn('ArmR', X, 1, () => -0.5),
      turn('Torso', X, 1, () => 0.05),
    ]),
  ]
}

/** Loads public/models/girl.glb (scaled to her height); if it is missing, builds her from shapes. */
export async function loadGirl(): Promise<GirlAsset> {
  try {
    const gltf = await new GLTFLoader().loadAsync('/models/girl.glb')
    const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3())
    gltf.scene.scale.multiplyScalar(playerConfig.height / size.y)
    return { model: gltf.scene, clips: gltf.animations }
  } catch {
    return buildGirl()
  }
}

/**
 * Plays her animations and walks her around. A replacement model's clips are matched by name
 * (any clip containing "idle", "walk", "run" or "sit"); a missing one falls back to idle.
 */
export function createCharacter({ model, clips }: GirlAsset) {
  const object = new THREE.Group()
  object.add(model)
  const mixer = new THREE.AnimationMixer(model)
  const clipFor = (pose: Pose) => clips.find((clip) => clip.name.toLowerCase().includes(pose)) ?? clips.find((clip) => clip.name.toLowerCase().includes('idle'))
  const actions = new Map(poses.flatMap((pose) => {
    const clip = clipFor(pose)
    return clip ? [[pose, mixer.clipAction(clip)] as const] : []
  }))
  let current: THREE.AnimationAction | undefined
  let heading = 0
  let speed = 0

  const play = (pose: Pose) => {
    const next = actions.get(pose)
    if (!next || next === current) return
    next.reset().fadeIn(0.2).play()
    current?.fadeOut(0.2)
    current = next
  }
  play('idle')

  return {
    object,
    play,
    get heading() { return heading },
    set heading(value: number) {
      heading = value
      object.rotation.y = value
    },
    get moving() { return speed > 0.15 },
    /** Walks on land: input is relative to the camera, she turns smoothly, and colliders stop her. */
    walk(dt: number, input: InputState, cameraYaw: number, colliders: Colliders) {
      const forwardX = Math.sin(cameraYaw), forwardZ = Math.cos(cameraYaw)
      const moveX = forwardX * input.y - forwardZ * input.x
      const moveZ = forwardZ * input.y + forwardX * input.x
      const amount = Math.min(1, Math.hypot(input.x, input.y))
      speed = THREE.MathUtils.damp(speed, amount * (input.run ? playerConfig.runSpeed : playerConfig.walkSpeed), 10, dt)
      if (amount > 0.05) heading += angleDelta(Math.atan2(moveX, moveZ) - heading) * Math.min(1, dt * 12)
      colliders.moveWalker(object.position, Math.sin(heading) * speed * dt, Math.cos(heading) * speed * dt, playerConfig.radius)
      object.rotation.y = heading
      play(speed > playerConfig.walkSpeed * 1.2 ? 'run' : speed > 0.15 ? 'walk' : 'idle')
      const walk = actions.get('walk')
      if (walk) walk.timeScale = THREE.MathUtils.clamp(speed / playerConfig.walkSpeed, 0.6, 1.4)
    },
    update(dt: number) {
      mixer.update(dt)
    },
  }
}

export type Character = ReturnType<typeof createCharacter>
