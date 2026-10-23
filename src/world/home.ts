import * as THREE from 'three'
import { palette } from '../config'
import type { PlaceId } from '../data/places'
import type { Colliders } from './colliders'
import { addInstancedTrees, addPalm, box, inside, material, plot, rand, toBox, type Area } from './props'
import { riverAt } from './river'

// The layout is traced from the satellite view of the home: north is -z, east is +x.
// Bunds run along these grid lines; every cell is a paddy unless a landmark claims it.
const gridX = [-6.5, -5.0, -3.5, -2.0, -0.2, 2.2, 3.6, 5.0, 6.5]
const gridZ = [-5.5, -3.6, -1.3, 0.6, 2.8, 4.3, 5.5]
const areas = {
  hutYard: [-6.5, -5.0, -3.6, -1.3],
  park: [-5.0, -2.0, -3.6, 0.6],
  shed: [-5.0, -3.5, 0.6, 2.8],
  grove: [-2.0, 2.2, -5.5, -1.3],
  treeRows: [-2.0, 2.2, -1.3, 2.8],
  treeBelt: [2.2, 5.0, -5.5, -3.6],
  riverBanks: [2.2, 5.0, -3.6, 5.5],
} satisfies Record<string, Area>
/** The whole homestead tile, which the countryside fields and riverbank trees leave alone. */
export const homeArea: Area = [-6.5, 6.5, -5.5, 5.5]
const housePosition = new THREE.Vector3(-0.8, 0, -3.0)
const landing: Area = [1.4, 2.6, -2.5, -1.5]

function addPaddies(parent: THREE.Group) {
  const paddies = new THREE.Group()
  const riceGeometry = new THREE.ConeGeometry(0.045, 0.5, 3)
  const riceMaterials = { [palette.rice]: material(palette.youngRice), [palette.youngRice]: material(palette.highlight) }
  const matrix = new THREE.Matrix4()
  const claimed = Object.values(areas)
  gridX.slice(1).forEach((x1, i) => gridZ.slice(1).forEach((z1, j) => {
    const x0 = gridX[i], z0 = gridZ[j]
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    if (claimed.some((area) => inside(cx, cz, area))) return
    // Rainy season: every plot is growing, with more of the paler young rice to the east.
    const color = rand(i * 7 + j) < (cx > 2 ? 0.6 : 0.3) ? palette.youngRice : palette.rice
    paddies.add(plot([x0, x1, z0, z1], color))
    const positions: [number, number][] = []
    for (let x = x0 + 0.2; x < x1 - 0.15; x += 0.28) for (let z = z0 + 0.2; z < z1 - 0.15; z += 0.28) positions.push([x - cx, z - cz])
    // One instanced mesh per plot, centred on it, so the sway tilts each plot around its own middle.
    const rice = new THREE.InstancedMesh(riceGeometry, riceMaterials[color], positions.length)
    positions.forEach(([x, z], index) => rice.setMatrixAt(index, matrix.makeTranslation(x, 0.2, z)))
    rice.position.set(cx, 0, cz)
    rice.userData.sway = true
    paddies.add(rice)
  }))
  parent.add(paddies)
}

/** My homestead at the north end of the river, with the landing where the boat stops. */
export function buildHome(colliders: Colliders) {
  const home = new THREE.Group()
  home.name = 'Home'
  colliders.addRegion(toBox([-6.4, 6.4, -5.4, 5.4]))
  addPaddies(home)
  for (const [area, color] of [[areas.grove, palette.forest], [areas.treeBelt, palette.forest], [areas.riverBanks, palette.canopy], [areas.shed, palette.canopy]] as const) {
    home.add(plot(area, color))
  }

  const house = new THREE.Group()
  house.position.copy(housePosition)
  house.add(box([3.1, 1.8, 2.1], [0, 1.0, 0], palette.wood))
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 4), material(palette.forest))
  roof.rotation.y = Math.PI / 4
  roof.position.y = 2.5
  house.add(roof, box([0.7, 1.2, 0.08], [0, 0.65, 1.08], palette.forest))
  home.add(house)
  colliders.addBox(toBox([housePosition.x - 1.55, housePosition.x + 1.55, housePosition.z - 1.05, housePosition.z + 1.05]), 3.1)

  // The grove wraps the house from the north and east; the yard in front stays open as the path
  // from the landing to the door.
  const grove: THREE.Vector3[] = []
  for (let x = -1.7; x < 2.1; x += 0.7) for (let z = -5.2; z < -1.4; z += 0.7) {
    const jx = x + (rand(x * 3 + z) - 0.5) * 0.3, jz = z + (rand(x + z * 5) - 0.5) * 0.3
    if ((jx < 1.5 && jz > -4.2) || jz > -2.6) continue
    grove.push(new THREE.Vector3(jx, 0, jz))
  }
  addInstancedTrees(home, grove, palette.canopy, 1.1, colliders)
  addPalm(home, -1.9, -4.4, colliders)
  addPalm(home, 0.6, -4.5, colliders)
  addPalm(home, 1.1, -3.3, colliders)

  // Planted trees in long north–south strips, like the striped block south of the house.
  // The strips are too close together to walk between, so one box blocks the whole block.
  const rows = new THREE.Group()
  rows.add(plot(areas.treeRows, palette.canopy))
  const rowTrees: THREE.Vector3[] = []
  for (let strip = 0; strip < 5; strip++) for (let z = -0.95; z < 2.5; z += 0.38) rowTrees.push(new THREE.Vector3(-1.55 + strip * 0.85, 0, z))
  addInstancedTrees(rows, rowTrees, palette.leaf, 0.45)
  home.add(rows)
  colliders.addBox(toBox([-2.0, 2.2, -1.15, 2.75]), 1.0)

  // The bright green field west of the grove, split into two plots.
  home.add(plot([-5.0, -2.0, -3.6, -1.3], palette.youngRice, 0.1), plot([-5.0, -2.0, -1.3, 0.6], palette.youngRice, 0.1))

  // The neighbouring hut and its straw stack, west of the field.
  home.add(plot(areas.hutYard, palette.canopy))
  home.add(box([1.2, 1.0, 1.1], [-5.75, 0.5, -2.9], palette.wood))
  const hutRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.65, 4), material(palette.forest))
  hutRoof.rotation.y = Math.PI / 4
  hutRoof.position.set(-5.75, 1.32, -2.9)
  const straw = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 8), material(palette.highlight))
  straw.position.set(-5.65, 0.45, -1.85)
  home.add(hutRoof, straw)
  colliders.addBox(toBox([-6.35, -5.15, -3.45, -2.35]), 1.7)
  colliders.addCircle(-5.65, -1.85, 0.5, 0.9)
  addInstancedTrees(home, [new THREE.Vector3(-6.2, 0, -3.4), new THREE.Vector3(-5.2, 0, -3.35)], palette.canopy, 0.8, colliders)

  // The small shed tucked under trees at the field's south-west corner.
  home.add(box([1.1, 0.8, 1.0], [-4.25, 0.4, 1.5], palette.wood))
  home.add(box([1.35, 0.18, 1.25], [-4.25, 0.9, 1.5], palette.forest))
  colliders.addBox(toBox([-4.85, -3.65, 0.95, 2.05]), 1.0)
  addInstancedTrees(home, [new THREE.Vector3(-4.7, 0, 2.4), new THREE.Vector3(-3.8, 0, 2.45)], palette.canopy, 0.85, colliders)

  // The tree belt in the north-east, on both banks where the river leaves the homestead.
  const belt: THREE.Vector3[] = []
  for (let x = 2.4; x < 5.0; x += 0.65) for (let z = -5.2; z < -3.7; z += 0.6) {
    const jx = x + (rand(x * 5 + z) - 0.5) * 0.3, jz = z + (rand(x + z * 3) - 0.5) * 0.3
    const river = riverAt(jx, jz)
    if (river.distance > river.halfWidth + 0.35) belt.push(new THREE.Vector3(jx, 0, jz))
  }
  addInstancedTrees(home, belt, palette.forest, 1.0, colliders)

  // The wooden landing on the west bank, where the boat ties up.
  home.add(box([1.2, 0.08, 1.0], [2.0, 0.08, -2.0], palette.wood))
  for (const [x, z] of [[2.5, -2.42], [2.5, -1.58], [1.5, -2.42], [1.5, -1.58]]) home.add(box([0.08, 0.4, 0.08], [x, 0, z], palette.wood))
  colliders.addWalkway({ ...toBox(landing), height: 0.12 })
  colliders.addBox(toBox(landing), 0.12, { walk: false, boat: true })

  const lanterns = new THREE.Group()
  lanterns.name = 'Lanterns'
  for (let i = 0; i < 8; i++) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), new THREE.MeshBasicMaterial({ color: palette.cream }))
    const angle = (i / 8) * Math.PI * 2
    lantern.position.set(housePosition.x + Math.cos(angle) * 2.1, 2.3 + Math.sin(i) * 0.15, housePosition.z + Math.sin(angle) * 1.6)
    lanterns.add(lantern)
  }
  lanterns.visible = false
  home.add(lanterns)

  return {
    group: home,
    /** Standing here, just in front of the door, means she is home. */
    door: { x: housePosition.x, z: housePosition.z + 1.35 },
    dock: { boat: { x: 3.1, z: -2.0 }, land: { x: 1.9, z: -2.0 }, landHeading: -Math.PI / 2 },
    stories: [
      { id: 'treeRows', x: 0.1, z: 0.8, radius: 2.4 },
      { id: 'park', x: -3.5, z: -1.45, radius: 1.6 },
      { id: 'hut', x: -5.3, z: -1.8, radius: 1.2 },
      { id: 'riceFields', x: -1.1, z: 3.6, radius: 1.0 },
      { id: 'river', x: 1.9, z: 4.2, radius: 1.0 },
    ] satisfies StorySpot[],
  }
}

/** A place where she can stop and read one of the stories in data/places.ts. */
export interface StorySpot { id: PlaceId, x: number, z: number, radius: number }
