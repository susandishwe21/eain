import type * as THREE from 'three'

/** An axis-aligned rectangle on the ground. */
export interface Box { x0: number, x1: number, z0: number, z1: number }
/** A raised walkable surface (jetty, landing) that also counts as land over water. */
export interface Walkway extends Box { height: number }
/** What a solid blocks: the girl walking (and the camera), and/or the boat. */
interface Blocks { walk: boolean, boat: boolean }
type Solid = Blocks & { top: number } & ({ kind: 'circle', x: number, z: number, r: number } | ({ kind: 'box' } & Box))

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const insideBox = (x: number, z: number, box: Box) => x > box.x0 && x < box.x1 && z > box.z0 && z < box.z1

/**
 * A tiny 2D collision system: circles and boxes push the walker or boat out, walkable regions
 * fence in where she may go, and `isWater` keeps her out of the river unless she is on a walkway.
 */
export function createColliders(isWater: (x: number, z: number) => boolean) {
  const solids: Solid[] = []
  const walkways: Walkway[] = []
  const regions: Box[] = []

  /** Pushes a circle at (x, z) out of every solid on this layer that it overlaps. */
  function pushOut(x: number, z: number, radius: number, layer: keyof Blocks): [number, number] {
    for (const solid of solids) {
      if (!solid[layer]) continue
      if (solid.kind === 'circle') {
        const dx = x - solid.x, dz = z - solid.z, distance = Math.hypot(dx, dz), min = solid.r + radius
        if (distance < min && distance > 1e-6) {
          x = solid.x + (dx / distance) * min
          z = solid.z + (dz / distance) * min
        }
        continue
      }
      const cx = clamp(x, solid.x0, solid.x1), cz = clamp(z, solid.z0, solid.z1)
      const dx = x - cx, dz = z - cz, distance = Math.hypot(dx, dz)
      if (distance > 1e-6) {
        if (distance < radius) {
          x = cx + (dx / distance) * radius
          z = cz + (dz / distance) * radius
        }
        continue
      }
      // The centre is inside the box: leave by the nearest side.
      const exits = [x - solid.x0, solid.x1 - x, z - solid.z0, solid.z1 - z]
      const side = exits.indexOf(Math.min(...exits))
      if (side === 0) x = solid.x0 - radius
      else if (side === 1) x = solid.x1 + radius
      else if (side === 2) z = solid.z0 - radius
      else z = solid.z1 + radius
    }
    return [x, z]
  }

  const walkwayAt = (x: number, z: number) => walkways.find((walkway) => insideBox(x, z, walkway))
  const canStand = (x: number, z: number) => regions.some((region) => insideBox(x, z, region)) && (!!walkwayAt(x, z) || !isWater(x, z))

  return {
    addCircle(x: number, z: number, r: number, top: number, blocks: Blocks = { walk: true, boat: false }) {
      solids.push({ kind: 'circle', x, z, r, top, ...blocks })
    },
    addBox(box: Box, top: number, blocks: Blocks = { walk: true, boat: false }) {
      solids.push({ kind: 'box', ...box, top, ...blocks })
    },
    addWalkway(walkway: Walkway) {
      walkways.push(walkway)
    },
    /** Marks an area where she may walk; everywhere else is fenced off. */
    addRegion(region: Box) {
      regions.push(region)
    },
    /** Moves a walker by (dx, dz), sliding along whatever is in the way, and sets her height. */
    moveWalker(position: THREE.Vector3, dx: number, dz: number, radius: number) {
      for (const [mx, mz] of [[dx, dz], [dx, 0], [0, dz]]) {
        const [x, z] = pushOut(position.x + mx, position.z + mz, radius, 'walk')
        if (!canStand(x, z)) continue
        position.x = x
        position.z = z
        break
      }
      position.y = walkwayAt(position.x, position.z)?.height ?? 0
    },
    /** Pushes the boat out of jetties and moored boats. Returns true if it hit something. */
    pushBoat(position: THREE.Vector3, radius: number) {
      const [x, z] = pushOut(position.x, position.z, radius, 'boat')
      const hit = x !== position.x || z !== position.z
      position.x = x
      position.z = z
      return hit
    },
    /** True if a point is inside something the camera should not pass through. */
    blocksCamera(x: number, y: number, z: number) {
      return solids.some((solid) => solid.walk && y < solid.top && (solid.kind === 'circle' ? Math.hypot(x - solid.x, z - solid.z) < solid.r : insideBox(x, z, solid)))
    },
  }
}

export type Colliders = ReturnType<typeof createColliders>
