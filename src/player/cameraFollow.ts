import * as THREE from 'three'
import type { Colliders } from '../world/colliders'
import { angleDelta } from './character'

interface View { distance: number, height: number, turn: number }

/**
 * A third-person camera behind and above a target. It swings round behind her as she turns,
 * and pulls in closer when a tree or wall would come between them.
 */
export function createCameraFollow(camera: THREE.PerspectiveCamera, colliders: Colliders) {
  let yaw = 0
  const goal = new THREE.Vector3()
  const head = new THREE.Vector3()
  const probe = new THREE.Vector3()
  const look = new THREE.Vector3()
  const lookGoal = new THREE.Vector3()

  const place = (target: THREE.Vector3, view: View) => {
    // Probe from just above her head, so knee-high things like the tree rows never pull the camera in.
    head.set(target.x, target.y + 1.1, target.z)
    goal.set(target.x - Math.sin(yaw) * view.distance, target.y + view.height, target.z - Math.cos(yaw) * view.distance)
    // Step from there towards the camera spot; stop just short of the first tree or wall.
    for (let i = 1; i <= 16; i++) {
      probe.lerpVectors(head, goal, i / 16)
      if (!colliders.blocksCamera(probe.x, probe.y, probe.z)) continue
      goal.lerpVectors(head, goal, Math.max(0.15, (i - 1.5) / 16))
      break
    }
    lookGoal.set(target.x, target.y + 0.7, target.z)
  }

  return {
    get yaw() { return yaw },
    /** Jumps straight to the right spot, e.g. after stepping out of the house. */
    snap(target: THREE.Vector3, heading: number, view: View) {
      yaw = heading
      place(target, view)
      camera.position.copy(goal)
      look.copy(lookGoal)
      camera.lookAt(look)
    },
    /** `follow` swings the camera round behind her; leave it off while she stands still. */
    update(dt: number, target: THREE.Vector3, heading: number, view: View, follow: boolean) {
      if (follow) yaw += angleDelta(heading - yaw) * Math.min(1, view.turn * dt)
      place(target, view)
      camera.position.lerp(goal, 1 - Math.exp(-6 * dt))
      look.lerp(lookGoal, 1 - Math.exp(-10 * dt))
      camera.lookAt(look)
    },
  }
}
