import * as THREE from 'three'
import { buildBoatModel } from '../boat/boat'
import { palette } from '../config'
import type { Colliders } from './colliders'
import type { StorySpot } from './home'
import { buildPagoda, buildReflection } from './pagoda'
import { addInstancedTrees, addPalm, box, material, plot, toBox, type Area } from './props'

/** The neighbouring village on the river's west bank at the south end, which fields and riverbank trees leave alone. */
export const portArea: Area = [-15.5, -3.6, 39.5, 58.5]
const jetty: Area = [-4.4, -1.5, 47.5, 48.5]

/** A village house raised on stilts, with steps up to a door that faces `facing` (+1 south, -1 north). */
function stiltHouse(parent: THREE.Object3D, colliders: Colliders, x: number, z: number, facing: 1 | -1, roofColor: string) {
  const house = new THREE.Group()
  house.position.set(x, 0, z)
  house.rotation.y = facing === 1 ? 0 : Math.PI
  for (const px of [-0.7, 0.7]) for (const pz of [-0.55, 0.55]) house.add(box([0.1, 0.8, 0.1], [px, 0.4, pz], palette.wood))
  house.add(box([1.7, 0.1, 1.4], [0, 0.8, 0], palette.wood))
  house.add(box([1.5, 0.9, 1.2], [0, 1.3, 0], palette.wood))
  house.add(box([0.35, 0.6, 0.05], [0, 1.15, 0.62], palette.forest))
  house.add(box([0.45, 0.08, 0.25], [0, 0.55, 0.85], palette.wood), box([0.45, 0.08, 0.25], [0, 0.28, 1.05], palette.wood))
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.8, 4), material(roofColor))
  roof.rotation.y = Math.PI / 4
  roof.position.y = 2.15
  house.add(roof)
  parent.add(house)
  colliders.addBox(toBox([x - 0.9, x + 0.9, z - 1.2, z + 1.2]), 2.6)
}

/** Fishing nets drying on a rack: two poles and a lattice of cords. */
function dryingNets(parent: THREE.Object3D, colliders: Colliders, x: number, z0: number, z1: number) {
  const length = z1 - z0, mid = (z0 + z1) / 2
  parent.add(box([0.06, 1.2, 0.06], [x, 0.6, z0], palette.wood), box([0.06, 1.2, 0.06], [x, 0.6, z1], palette.wood))
  for (let y = 0.4; y <= 1.15; y += 0.2) parent.add(box([0.02, 0.02, length], [x, y, mid], palette.highlight))
  for (let z = z0 + 0.3; z < z1; z += 0.3) parent.add(box([0.02, 0.75, 0.02], [x, 0.78, z], palette.highlight))
  colliders.addBox(toBox([x - 0.1, x + 0.1, z0 - 0.05, z1 + 0.05]), 1.2)
}

/** The tea shop by the path: a thatched roof on posts over a low table and stools, kettle on the table. */
function teaShop(parent: THREE.Object3D, colliders: Colliders, x: number, z: number) {
  const shop = new THREE.Group()
  shop.position.set(x, 0, z)
  shop.add(box([2.2, 0.1, 1.7], [0, 1.45, 0], palette.highlight))
  for (const [px, pz] of [[-1.0, -0.75], [1.0, -0.75], [-1.0, 0.75], [1.0, 0.75]]) {
    shop.add(box([0.08, 1.45, 0.08], [px, 0.72, pz], palette.wood))
    colliders.addCircle(x + px, z + pz, 0.08, 1.5)
  }
  shop.add(box([1.0, 0.3, 0.55], [0, 0.28, 0], palette.wood))
  for (const [px, pz] of [[-0.75, 0], [0.75, 0], [0, -0.5], [0, 0.5]]) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), material(palette.wood))
    stool.position.set(px, 0.11, pz)
    shop.add(stool)
  }
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), material(palette.cream))
  kettle.position.set(0.2, 0.5, 0)
  shop.add(kettle)
  for (const px of [-0.25, -0.05]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.05, 6), material(palette.cream))
    cup.position.set(px, 0.46, 0.1)
    shop.add(cup)
  }
  shop.add(box([0.8, 0.25, 0.05], [0, 1.2, 0.86], palette.cream))
  parent.add(shop)
  colliders.addBox(toBox([x - 0.95, x + 0.95, z - 0.65, z + 0.65]), 0.45)
}

/** The neighbouring village's river port at the south end, where the journey starts. */
export function buildPort(colliders: Colliders) {
  const port = new THREE.Group()
  port.name = 'Port'
  colliders.addRegion(toBox([-15.4, -2.4, 39.6, 58.4]))
  port.add(plot(portArea, palette.leaf))
  // Dirt paths: one from the jetty through the village, one crossing it north–south.
  port.add(box([11.6, 0.1, 0.9], [-9.8, -0.025, 48], palette.wood), box([0.9, 0.1, 17], [-9.2, -0.025, 49], palette.wood))

  // The jetty reaching into the river: walkable for her, solid for the boat.
  port.add(box([2.9, 0.08, 1.0], [-2.95, 0.21, 48], palette.wood))
  for (const x of [-3.6, -2.8, -2.0, -1.55]) for (const z of [47.55, 48.45]) port.add(box([0.08, 0.5, 0.08], [x, 0, z], palette.wood))
  colliders.addRegion(toBox(jetty))
  colliders.addWalkway({ ...toBox(jetty), height: 0.25 })
  colliders.addBox(toBox(jetty), 0.25, { walk: false, boat: true })

  // Two moored boats with woven canopies; each blocks the player's boat with two circles along its hull.
  for (const [x, z, heading] of [[-3.0, 46.2, Math.PI + 0.25], [-2.8, 50.6, Math.PI - 0.2]]) {
    const moored = new THREE.Group()
    moored.position.set(x, 0.03, z)
    moored.rotation.y = heading
    moored.add(buildBoatModel('canopy'))
    moored.userData.rock = true
    port.add(moored)
    for (const along of [-0.55, 0.55]) colliders.addCircle(x + Math.sin(heading) * along, z + Math.cos(heading) * along, 0.4, 0.5, { walk: false, boat: true })
  }

  stiltHouse(port, colliders, -7.0, 45.2, 1, palette.forest)
  stiltHouse(port, colliders, -12.0, 45.0, 1, palette.highlight)
  stiltHouse(port, colliders, -12.2, 51.0, -1, palette.forest)
  stiltHouse(port, colliders, -6.6, 53.6, -1, palette.highlight)
  teaShop(port, colliders, -6.5, 50.3)
  // The golden pagoda on its raised white base by the river, just upstream of the jetty, so it is
  // ahead on the left as the boat sets off.
  const pagoda = buildPagoda(1, true)
  pagoda.group.position.set(-5.2, 0, 42.2)
  port.add(pagoda.group)
  const reflection = buildReflection(pagoda, 0.03)
  port.add(reflection.object)
  colliders.addBox(toBox([-6.5, -3.9, 40.9, 43.5]), 4.3)
  dryingNets(port, colliders, -13.0, 55.0, 56.8)

  // Baskets and water pots by the houses and the jetty.
  for (const [x, z] of [[-4.9, 46.9], [-5.3, 47.1], [-4.6, 49.2]]) {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.18, 8), material(palette.highlight))
    basket.position.set(x, 0.09, z)
    port.add(basket)
    colliders.addCircle(x, z, 0.16, 0.2)
  }
  for (const [x, z] of [[-8.1, 46.75], [-8.45, 46.55]]) {
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), material(palette.wood))
    pot.position.set(x, 0.17, z)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.08, 8), material(palette.wood))
    neck.position.set(x, 0.36, z)
    port.add(pot, neck)
    colliders.addCircle(x, z, 0.18, 0.4)
  }

  for (const [x, z] of [[-4.8, 44.8], [-10.6, 49.6], [-13.8, 47.2], [-8.0, 56.3], [-4.7, 55.6], [-11.0, 56.4], [-14.3, 53.8], [-5.2, 51.8]]) addPalm(port, x, z, colliders)
  addInstancedTrees(port, [new THREE.Vector3(-14.6, 0, 41.0), new THREE.Vector3(-13.4, 0, 40.6), new THREE.Vector3(-15.0, 0, 57.5), new THREE.Vector3(-4.6, 0, 57.6)], palette.canopy, 1.2, colliders)

  return {
    group: port,
    /** She starts on the path, facing the jetty. */
    spawn: { x: -7.5, z: 48.0, heading: Math.PI / 2 },
    /** Where her boat is tied up at the start: beside the end of the jetty, bow pointing north up the river. */
    mooring: { x: -0.9, z: 48.6, heading: Math.PI },
    dock: { boat: { x: -0.9, z: 48.6 }, land: { x: -1.9, z: 48.0 }, landHeading: -Math.PI / 2 },
    pagoda,
    reflection,
    stories: [{ id: 'pagoda', x: -7.3, z: 42.2, radius: 1.7 }] satisfies StorySpot[],
  }
}
