import * as THREE from 'three'
import type { StoryObjectId } from '../data/objects'

const mat = (color: string, roughness = 0.9) =>
  new THREE.MeshStandardMaterial({ color, roughness, flatShading: true })

function box(name: string, size: [number, number, number], position: [number, number, number], color: string) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat(color))
  mesh.name = name
  mesh.position.set(...position)
  return mesh
}

function clickable(mesh: THREE.Object3D, id: StoryObjectId) {
  mesh.userData.objectId = id
  return mesh
}

/** Builds simple primitives so this room remains easy to replace with a GLB later. */
export function buildRoom(): THREE.Group {
  const room = new THREE.Group()
  room.name = 'BoxRoom'
  room.add(box('Floor', [12, 0.2, 9], [0, -0.1, 0], '#6b4140'))
  room.add(box('BackWall', [12, 6, 0.2], [0, 3, -4], '#9a5b58'))
  room.add(box('LeftWall', [0.2, 6, 9], [-6, 3, 0], '#7d4b52'))

  // The dark window recess and its glowing sky pane.
  const windowFrame = new THREE.Group()
  windowFrame.name = 'Window'
  windowFrame.position.set(1.5, 3.6, -3.82)
  windowFrame.add(box('WindowSky', [4.4, 2.5, 0.08], [0, 0, 0], '#e98279'))
  for (const [x, y, w, h] of [[0, 1.2, 4.8, 0.16], [0, -1.2, 4.8, 0.16], [-2.3, 0, 0.16, 2.5], [2.3, 0, 0.16, 2.5]] as const) {
    windowFrame.add(box('WindowFrame', [w, h, 0.16], [x, y, 0.02], '#4a2939'))
  }
  clickable(windowFrame, 'window')
  room.add(windowFrame)

  // A simple pagoda silhouette outside the window.
  const pagoda = new THREE.Group()
  pagoda.position.set(1.7, 2.2, -3.65)
  pagoda.add(box('PagodaBody', [0.65, 1.25, 0.35], [0, 0.5, 0], '#4e3045'))
  for (let i = 0; i < 3; i++) {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2 - i * 0.25, 0.35, 4), mat('#38263c'))
    roof.scale.z = 0.55
    roof.position.set(0, 1.1 + i * 0.55, 0)
    pagoda.add(roof)
  }
  room.add(pagoda)

  // Lantern string: tiny emissive spheres are readable even at pixel resolution.
  const lanternMat = new THREE.MeshBasicMaterial({ color: '#ffd16a' })
  for (let i = 0; i < 7; i++) {
    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), lanternMat)
    lantern.position.set(-3.5 + i * 1.05, 5.1 - Math.abs(i - 3) * 0.13, -3.55)
    room.add(lantern)
  }

  // Table, books, lamp, and a sleeping mat.
  const table = new THREE.Group()
  table.position.set(-2.1, 0, 0.3)
  table.add(box('TableTop', [3, 0.25, 1.55], [0, 2.0, 0], '#8b5039'))
  for (const x of [-1.2, 1.2]) for (const z of [-0.55, 0.55]) table.add(box('TableLeg', [0.18, 2, 0.18], [x, 1, z], '#5e3834'))
  room.add(table)

  const shelf = new THREE.Group()
  shelf.name = 'Bookshelf'
  shelf.position.set(-4.7, 0, -2.8)
  shelf.add(box('ShelfBody', [1.4, 3.3, 0.55], [0, 1.65, 0], '#633b38'))
  for (let y = 0.65; y < 3.2; y += 0.8) shelf.add(box('Shelf', [1.55, 0.12, 0.7], [0, y, 0], '#b36a4f'))
  for (let i = 0; i < 4; i++) shelf.add(box('Book', [0.2 + i * 0.04, 0.55, 0.45], [-0.48 + i * 0.3, 2.55, -0.05], ['#e09268', '#d8b463', '#7eb0a3', '#d86c6c'][i]))
  clickable(shelf, 'books')
  room.add(shelf)

  const lamp = new THREE.Group()
  lamp.name = 'Lamp'
  lamp.position.set(-2.1, 2.2, 0.3)
  lamp.add(box('LampStem', [0.1, 0.75, 0.1], [0, 0.45, 0], '#e0b878'))
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.65, 4, 1, true), mat('#edb15d'))
  shade.position.y = 0.95
  lamp.add(shade)
  clickable(lamp, 'lamp')
  room.add(lamp)

  const matGroup = box('SleepingMat', [3.6, 0.18, 2.2], [2.6, 0.12, 1.55], '#b87562')
  room.add(matGroup)

  const photo = new THREE.Group()
  photo.name = 'PhotoFrame'
  photo.position.set(3.8, 3.0, -3.8)
  photo.add(box('Frame', [1.4, 1.1, 0.12], [0, 0, 0], '#d3a259'))
  photo.add(box('Photo', [1.05, 0.75, 0.14], [0, 0, 0.08], '#6b8e94'))
  clickable(photo, 'photo')
  room.add(photo)
  return room
}
