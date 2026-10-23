import * as THREE from 'three'
import { palette } from '../config'
import { createColliders } from './colliders'
import { buildHome, homeArea } from './home'
import { buildPagoda } from './pagoda'
import { buildPort, portArea } from './port'
import { addInstancedTrees, box, material, plot, rand, type Area } from './props'
import { buildRiver, isDeepWater, riverAt, riverSamples, waterMaterial } from './river'

/** The whole map, for the mini-map: x from west to east, z from north to south. */
export const worldBounds = { x0: -25, x1: 25, z0: -17, z1: 67 }
/** A smaller pagoda in the fields west of home, seen in the distance from the homestead. */
const distantPagodaArea: Area = [-16.5, -12.5, -0.5, 3.5]

/** Rice fields and the odd tree clump along both banks between the port and home (instanced: hundreds of plots). */
function buildFields(excluded: Area[]) {
  const fields = new THREE.Group()
  const plots: { x: number, z: number, color: string }[] = []
  const clumps: THREE.Vector3[] = []
  const width = 2.0, depth = 1.6
  for (let x = worldBounds.x0; x < worldBounds.x1; x += width) for (let z = worldBounds.z0; z < worldBounds.z1; z += depth) {
    if (excluded.some(([x0, x1, z0, z1]) => x < x1 && x + width > x0 && z < z1 && z + depth > z0)) continue
    const cx = x + width / 2, cz = z + depth / 2
    const corners = [[x, z], [x + width, z], [x, z + depth], [x + width, z + depth], [cx, cz]]
    if (corners.some(([px, pz]) => { const river = riverAt(px, pz); return river.distance < river.halfWidth + 0.5 })) continue
    if (rand(cx * 3.1 + cz) < 0.08) {
      for (let i = 0; i < 3; i++) clumps.push(new THREE.Vector3(cx + (rand(cx + i) - 0.5) * 1.4, 0, cz + (rand(cz + i * 3) - 0.5) * 1.0))
      continue
    }
    plots.push({ x: cx, z: cz, color: rand(cx + cz * 7) < 0.35 ? palette.youngRice : palette.rice })
  }

  const plotMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.08, 1), material('#ffffff'), plots.length)
  const matrix = new THREE.Matrix4()
  const color = new THREE.Color()
  plots.forEach((plot, index) => {
    matrix.makeScale(width - 0.14, 1, depth - 0.14).setPosition(plot.x, -0.035, plot.z)
    plotMesh.setMatrixAt(index, matrix)
    plotMesh.setColorAt(index, color.set(plot.color))
  })
  fields.add(plotMesh)

  // Rice blades, paler than the water under them: one instanced mesh per blade colour.
  for (const [plotColor, bladeColor] of [[palette.rice, palette.youngRice], [palette.youngRice, palette.highlight]]) {
    const blades: [number, number][] = []
    for (const plot of plots) {
      if (plot.color !== plotColor) continue
      for (let bx = -0.75; bx <= 0.75; bx += 0.42) for (let bz = -0.55; bz <= 0.55; bz += 0.42) blades.push([plot.x + bx, plot.z + bz])
    }
    const rice = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.5, 3), material(bladeColor), blades.length)
    blades.forEach(([bx, bz], index) => rice.setMatrixAt(index, matrix.makeTranslation(bx, 0.2, bz)))
    fields.add(rice)
  }
  addInstancedTrees(fields, clumps, palette.canopy, 1.0)
  return fields
}

/** Builds the playable world: port village in the south, the river, the fields, and home in the north. */
export function buildWorld() {
  const group = new THREE.Group()
  group.name = 'World'
  const colliders = createColliders(isDeepWater)
  // The base is bund-coloured; inset plots on top leave raised-looking bunds between them.
  const { x0, x1, z0, z1 } = worldBounds
  group.add(box([x1 - x0, 0.35, z1 - z0], [(x0 + x1) / 2, -0.25, (z0 + z1) / 2], palette.wood))
  // A sun from high in the south-east lights the faces the camera usually sees, so wood stays brown
  // instead of darkening into the nearest green. Time of day sets its intensity.
  const sun = new THREE.DirectionalLight(palette.haze, 1.4)
  sun.name = 'Sun'
  sun.position.set(6, 10, 8)
  group.add(sun)

  const home = buildHome(colliders)
  const port = buildPort(colliders)
  const distantPagoda = buildPagoda(0.6)
  distantPagoda.group.position.set(-14.5, 0, 1.5)
  const excluded = [homeArea, portArea, distantPagodaArea]
  group.add(home.group, port.group, buildRiver(excluded), buildFields(excluded), plot(distantPagodaArea, palette.leaf), distantPagoda.group)
  return {
    group, colliders, home, port, riverSamples,
    stories: [...home.stories, ...port.stories],
    docks: [port.dock, home.dock],
    pagodas: [port.pagoda, distantPagoda],
    reflections: [port.reflection],
  }
}

export type World = ReturnType<typeof buildWorld>

export function animateWorld(world: THREE.Group, elapsed: number) {
  waterMaterial.uniforms.time.value = elapsed
  world.traverse((object) => {
    if (object.userData.sway) object.rotation.z = Math.sin(elapsed * 1.2 + object.id) * 0.025
    if (object.userData.rock) object.rotation.z = Math.sin(elapsed * 1.5 + object.id) * 0.03
    // A slow sideways wobble makes a reflection look like it sits on moving water.
    if (object.userData.ripple) object.scale.x = object.userData.ripple * (1 + Math.sin(elapsed * 2.2) * 0.04)
  })
}
