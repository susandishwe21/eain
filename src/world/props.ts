import * as THREE from 'three'
import { palette } from '../config'
import type { Colliders } from './colliders'

/** A rectangle on the ground: [west x, east x, north z, south z]. */
export type Area = readonly [x0: number, x1: number, z0: number, z1: number]

export const material = (color: string, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true })
export const box = (size: [number, number, number], position: [number, number, number], color: string) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color))
  mesh.position.set(...position)
  return mesh
}
/** Deterministic 0–1 noise, so the jittered layout is identical on every load. */
export const rand = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return n - Math.floor(n)
}
export const inside = (x: number, z: number, [x0, x1, z0, z1]: Area) => x > x0 && x < x1 && z > z0 && z < z1
export const toBox = ([x0, x1, z0, z1]: Area) => ({ x0, x1, z0, z1 })
/** A flat plot inset from its area, so the bund-coloured ground shows between plots. */
export const plot = ([x0, x1, z0, z1]: Area, color: string, height = 0.08) =>
  box([x1 - x0 - 0.14, height, z1 - z0 - 0.14], [(x0 + x1) / 2, height / 2 - 0.075, (z0 + z1) / 2], color)

/** Instanced low-poly trees; with `colliders`, each trunk also blocks walking and the camera. */
export function addInstancedTrees(parent: THREE.Object3D, positions: THREE.Vector3[], color: string, scale = 1, colliders?: Colliders) {
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 1.2, 5), material(palette.wood), positions.length)
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.75, 0), material(color), positions.length)
  const matrix = new THREE.Matrix4()
  const turn = new THREE.Quaternion()
  positions.forEach((position, index) => {
    // Small size and rotation changes stop the canopy reading as a copy-paste grid.
    const size = scale * (0.85 + rand(position.x * 13 + position.z) * 0.3)
    const scaled = new THREE.Vector3(size, size, size)
    matrix.compose(new THREE.Vector3(position.x, position.y + 0.6 * size, position.z), new THREE.Quaternion(), scaled)
    trunk.setMatrixAt(index, matrix)
    turn.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rand(index + position.z) * Math.PI)
    matrix.compose(new THREE.Vector3(position.x, position.y + 1.5 * size, position.z), turn, scaled)
    crown.setMatrixAt(index, matrix)
    colliders?.addCircle(position.x, position.z, 0.4 * size, 2.25 * size)
  })
  parent.add(trunk, crown)
}

// Palm-like silhouettes are deliberately separate so their fronds can sway around their own base.
export function addPalm(parent: THREE.Object3D, x: number, z: number, colliders?: Colliders) {
  const palm = new THREE.Group()
  palm.position.set(x, 0, z)
  palm.add(box([0.18, 2.6, 0.18], [0, 1.3, 0], palette.wood))
  for (let i = 0; i < 6; i++) {
    // Each frond hangs off a pivot at the crown: droop first, then turn to face outward.
    const pivot = new THREE.Group()
    pivot.position.y = 2.6
    pivot.rotation.set(0, (i / 6) * Math.PI * 2, -0.45)
    pivot.add(box([1.1, 0.06, 0.28], [0.5, 0, 0], palette.leaf))
    palm.add(pivot)
  }
  palm.userData.sway = true
  parent.add(palm)
  colliders?.addCircle(x, z, 0.16, 3)
}
