import * as THREE from 'three'
import { palette } from '../config'
import type { TimeOfDay } from '../ui/settings'
import { box, material } from './props'

/** How the pagoda looks at each time of day: glow is the HDR brightness that feeds the bloom. */
const looks: Record<TimeOfDay, { glow: number, warmth: number, candles: boolean }> = {
  morning: { glow: 1.3, warmth: 0.3, candles: false },
  evening: { glow: 2.6, warmth: 0.5, candles: true },
  night: { glow: 3.2, warmth: 0.6, candles: true },
}

/**
 * Warm metallic gold. Its emissive keeps the hue gold even on the shadow side, so the dither
 * shader snaps it to the gold colours rather than a nearby green.
 */
const goldMaterial = (color: string) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, metalness: 0.45, roughness: 0.35, flatShading: true })

const at = <T extends THREE.Object3D>(object: T, y: number) => {
  object.position.y = y
  return object
}
/** A turned shape from [radius, height] pairs, bottom to top. */
const lathe = (profile: [number, number][], surface: THREE.Material) =>
  new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 12), surface)
const cylinder = (top: number, bottom: number, height: number, sides: number, surface: THREE.Material) =>
  new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), surface)

/**
 * A Burmese-style golden pagoda (စေတီ) on a raised white base: stepped square terraces, an
 * octagonal drum, a bell-shaped dome, a lotus band and banana bud, then a thin spire with a hti
 * (umbrella) and a glowing orb on top. About 4.3 units tall at scale 1.
 */
export function buildPagoda(scale = 1, withCandles = false) {
  const pagoda = new THREE.Group()
  pagoda.scale.setScalar(scale)
  // Everything the river reflects; the candles stay out of the reflection.
  const structure = new THREE.Group()
  pagoda.add(structure)
  const dark = goldMaterial(palette.darkGold), gold = goldMaterial(palette.gold), bright = goldMaterial(palette.brightGold)
  // Colours above 1.0 (HDR) are the only things bright enough to pass the bloom threshold, so the
  // glow comes from the pagoda's crown and candles alone.
  const glow = new THREE.MeshBasicMaterial({ color: palette.paleGold })
  const golds = [dark, gold, bright]

  structure.add(box([2.6, 0.3, 2.6], [0, 0.15, 0], palette.haze))
  const terrace = (width: number, height: number, y: number, surface: THREE.Material) => {
    const step = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), surface)
    return at(step, y)
  }
  structure.add(terrace(1.9, 0.28, 0.44, dark), terrace(1.55, 0.26, 0.71, gold), terrace(1.2, 0.24, 0.96, dark))
  structure.add(at(cylinder(0.55, 0.6, 0.16, 8, gold), 1.16), at(cylinder(0.5, 0.53, 0.12, 8, bright), 1.3))
  // The bell: flares at the bottom, swells, then narrows to the neck.
  structure.add(at(lathe([[0.53, 0], [0.54, 0.12], [0.5, 0.35], [0.42, 0.6], [0.3, 0.82], [0.18, 0.95], [0.12, 1.0], [0, 1.0]], gold), 1.36))
  structure.add(at(cylinder(0.14, 0.16, 0.08, 10, bright), 2.4), at(cylinder(0.12, 0.14, 0.08, 10, gold), 2.48))
  // Lotus band, then the banana bud tapering up to the spire.
  structure.add(at(cylinder(0.17, 0.11, 0.12, 10, bright), 2.58))
  structure.add(at(lathe([[0.1, 0], [0.15, 0.15], [0.14, 0.35], [0.08, 0.55], [0.03, 0.65], [0, 0.68]], bright), 2.64))
  structure.add(at(cylinder(0.012, 0.035, 0.9, 6, bright), 3.75))
  // The hti: tiered umbrella rings round the spire, then a vane and an orb that catch the light.
  for (let tier = 0; tier < 4; tier++) structure.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.11 - tier * 0.02, 0.07, 10), glow), 3.6 + tier * 0.12))
  structure.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.01), glow), 4.14), at(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glow), 4.25))

  // Candles all round the white base for the evening and Thadingyut night.
  const candles = new THREE.Group()
  candles.visible = false
  if (withCandles) {
    for (let i = 0; i < 20; i++) {
      const t = (i / 20) * 4, side = Math.floor(t), along = (t % 1) * 2.4 - 1.2
      const [x, z] = [[along, 1.22], [1.22, -along], [-along, -1.22], [-1.22, along]][side]
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 5), material(palette.cream))
      candle.position.set(x, 0.34, z)
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 5), glow)
      flame.position.set(x, 0.405, z)
      candles.add(candle, flame)
    }
    const candleLight = new THREE.PointLight(palette.brightGold, 2.5, 5, 2)
    candleLight.position.y = 0.8
    candles.add(candleLight)
  }
  pagoda.add(candles)

  return {
    group: pagoda,
    structure,
    /** Glow, warmth and candles for the time of day. */
    setTime(time: TimeOfDay) {
      const look = looks[time]
      glow.color.set(palette.paleGold).multiplyScalar(look.glow)
      for (const surface of golds) surface.emissiveIntensity = look.warmth
      candles.visible = withCandles && look.candles
    },
  }
}

/**
 * The pagoda's upside-down reflection, mirrored under the water line. It draws only where the river
 * marked the stencil buffer (see waterMaterial), so it shows on the water and nowhere else.
 */
export function buildReflection(pagoda: ReturnType<typeof buildPagoda>, waterLevel: number) {
  const reflection = pagoda.structure.clone()
  const tints = new Map<string, THREE.MeshBasicMaterial>()
  reflection.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const color = (object.material as THREE.MeshBasicMaterial).color.clone()
    // The glowing crown's HDR colour is too bright for a reflection; tone it back to plain gold.
    if (color.r > 1) color.set(palette.paleGold)
    const key = color.getHexString()
    if (!tints.has(key)) {
      tints.set(key, new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.4, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc,
      }))
    }
    object.material = tints.get(key)!
    // After the water (renderOrder 10), so the stencil is already marked.
    object.renderOrder = 11
  })
  const mirror = new THREE.Group()
  mirror.add(reflection)
  // y → 2·waterLevel − y: flipped about the water surface.
  mirror.position.set(pagoda.group.position.x, waterLevel * 2, pagoda.group.position.z)
  mirror.scale.set(pagoda.group.scale.x, -pagoda.group.scale.y, pagoda.group.scale.z)
  mirror.userData.ripple = mirror.scale.x
  mirror.visible = false
  return {
    object: mirror,
    /** The river only mirrors it in the low evening and night light. */
    setTime(time: TimeOfDay) {
      mirror.visible = time !== 'morning'
      for (const tint of tints.values()) tint.opacity = time === 'night' ? 0.5 : 0.4
    },
  }
}
