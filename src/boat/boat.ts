import * as THREE from 'three'
import { onAudioReady } from '../audio/sound'
import { boatConfig, palette } from '../config'
import type { InputState } from '../player/controls'
import type { Colliders } from '../world/colliders'
import { box, material } from '../world/props'
import { clampToRiver } from '../world/river'

/** A long, narrow delta boat facing +z: the player's has a longtail engine, moored ones a woven canopy. */
export function buildBoatModel(kind: 'engine' | 'canopy') {
  const model = new THREE.Group()
  model.add(box([0.55, 0.22, 1.4], [0, 0.05, 0], palette.wood))
  for (const end of [1, -1]) {
    // A four-sided cone laid on its side makes a pointed bow and stern.
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.39, 0.6, 4).rotateY(Math.PI / 4).rotateX((end * Math.PI) / 2), material(palette.wood))
    tip.scale.y = 0.4
    tip.position.set(0, 0.05, end * 1.0)
    model.add(tip)
  }
  model.add(box([0.45, 0.02, 1.3], [0, 0.165, 0], palette.forest))
  model.add(box([0.55, 0.04, 0.12], [0, 0.2, -0.45], palette.wood))
  if (kind === 'engine') {
    model.add(box([0.18, 0.16, 0.2], [0, 0.27, -0.78], palette.forest))
    const shaft = box([0.04, 0.04, 0.9], [0, 0.18, -1.2], palette.forest)
    shaft.rotation.x = -0.2
    model.add(shaft)
  } else {
    const woven = material(palette.highlight)
    woven.side = THREE.DoubleSide
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), woven)
    canopy.position.set(0, 0.17, 0.1)
    model.add(canopy)
  }
  return model
}

/** Ripple rings left behind the stern while the boat is moving. */
function createWake(parent: THREE.Object3D) {
  const rings = Array.from({ length: 16 }, () => {
    const fade = new THREE.MeshBasicMaterial({ color: palette.reflection, transparent: true, opacity: 0, depthWrite: false })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.24, 14).rotateX(-Math.PI / 2), fade)
    ring.visible = false
    parent.add(ring)
    return { ring, fade, age: Infinity }
  })
  let timer = 0
  let next = 0
  return {
    update(dt: number, boat: THREE.Object3D, speed: number) {
      timer += dt
      if (Math.abs(speed) > 0.5 && timer > 0.2) {
        timer = 0
        const slot = rings[next++ % rings.length]
        const back = -Math.sign(speed) * 1.1
        slot.ring.position.set(boat.position.x + Math.sin(boat.rotation.y) * back, 0.04, boat.position.z + Math.cos(boat.rotation.y) * back)
        slot.ring.visible = true
        slot.age = 0
      }
      for (const slot of rings) {
        if (!slot.ring.visible) continue
        slot.age += dt
        slot.ring.visible = slot.age < 1.6
        slot.ring.scale.setScalar(1 + slot.age * 2.5)
        slot.fade.opacity = 0.7 * (1 - slot.age / 1.6)
      }
    },
  }
}

/** A small longtail engine: a filtered sawtooth with a putt-putt tremolo, louder and higher with speed. */
function createEngineSound() {
  let engine: { context: AudioContext, oscillator: OscillatorNode, level: GainNode } | null = null
  onAudioReady((context, master) => {
    const oscillator = context.createOscillator()
    oscillator.type = 'sawtooth'
    oscillator.frequency.value = 40
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500
    const tremolo = context.createGain()
    tremolo.gain.value = 0.6
    const putt = context.createOscillator()
    putt.frequency.value = 9
    const puttDepth = context.createGain()
    puttDepth.gain.value = 0.4
    putt.connect(puttDepth).connect(tremolo.gain)
    const level = context.createGain()
    level.gain.value = 0
    oscillator.connect(filter).connect(tremolo).connect(level).connect(master)
    oscillator.start()
    putt.start()
    engine = { context, oscillator, level }
  })
  return {
    update(running: boolean, throttle: number, speed: number) {
      if (!engine) return
      const now = engine.context.currentTime
      engine.level.gain.setTargetAtTime(running ? 0.03 + Math.abs(throttle) * 0.035 : 0, now, 0.15)
      engine.oscillator.frequency.setTargetAtTime(38 + Math.abs(speed) * 12, now, 0.2)
    },
  }
}

/** The boat she drives: smooth throttle and steering, kept between the banks and off the jetties. */
export function createPlayerBoat(parent: THREE.Object3D, colliders: Colliders, mooring: { x: number, z: number, heading: number }) {
  const object = new THREE.Group()
  const model = buildBoatModel('engine')
  object.add(model)
  // Where she sits: on the back plank, facing forward, beside the engine's tiller.
  const seat = new THREE.Object3D()
  seat.position.set(0, 0.2, -0.45)
  model.add(seat)
  object.position.set(mooring.x, 0.03, mooring.z)
  parent.add(object)
  const wake = createWake(parent)
  const engine = createEngineSound()
  let heading = mooring.heading
  let speed = 0

  return {
    object,
    seat,
    get heading() { return heading },
    get speed() { return speed },
    stop() { speed = 0 },
    /** With `input` she is driving; with null the boat just drifts to a stop and rocks. */
    update(dt: number, input: InputState | null, elapsed: number) {
      const throttle = input?.y ?? 0, rudder = input?.x ?? 0
      // How far forward you push sets the cruising speed (a little = slow, W or the joystick's edge =
      // full); pulling back slows down and then backs up gently. Let go and the boat coasts to a stop.
      const target = throttle >= 0 ? throttle * boatConfig.maxSpeed : throttle * boatConfig.reverseSpeed
      const rate = throttle === 0 ? boatConfig.drag : speed > target ? boatConfig.acceleration * 1.5 : boatConfig.acceleration
      speed += Math.sign(target - speed) * Math.min(Math.abs(target - speed), rate * dt)
      // It steers better under way, keeps a little steerage at rest, and steers the other way in reverse.
      const steerage = 0.35 + 0.65 * Math.min(1, Math.abs(speed) / 2)
      heading -= rudder * boatConfig.turnSpeed * steerage * dt * (speed < -0.05 ? -1 : 1)

      object.position.x += Math.sin(heading) * speed * dt
      object.position.z += Math.cos(heading) * speed * dt
      const hitBank = clampToRiver(object.position, boatConfig.halfWidth)
      const hitSolid = colliders.pushBoat(object.position, 0.5)
      // Scraping the bank or a jetty bleeds off speed.
      if (hitBank || hitSolid) speed *= 1 - Math.min(1, 2.5 * dt)
      object.rotation.y = heading

      // Gentle rocking, a lean into turns, and the bow lifting with speed.
      model.rotation.z = Math.sin(elapsed * 1.7) * 0.035 + rudder * speed * 0.02
      model.rotation.x = Math.sin(elapsed * 1.3) * 0.02 - speed * 0.012
      model.position.y = Math.sin(elapsed * 2.1) * 0.012
      wake.update(dt, object, speed)
      engine.update(input !== null, throttle, speed)
    },
  }
}

export type PlayerBoat = ReturnType<typeof createPlayerBoat>
