import * as THREE from 'three'
import { palette } from '../config'
import { riverPath } from '../data/riverPath'
import { addInstancedTrees, inside, rand, type Area } from './props'

// Smooth the control points into a dense centreline; each sample keeps its interpolated width.
const curve = new THREE.CatmullRomCurve3(riverPath.map(([x, z]) => new THREE.Vector3(x, 0, z)))
export const riverSamples = Array.from({ length: 241 }, (_, i) => {
  const t = i / 240
  const point = curve.getPoint(t)
  // getPoint spreads t evenly over the control segments, so the width can be read the same way.
  const p = t * (riverPath.length - 1)
  const k = Math.min(Math.floor(p), riverPath.length - 2)
  return { x: point.x, z: point.z, width: THREE.MathUtils.lerp(riverPath[k][2], riverPath[k + 1][2], p - k) }
})

/** The nearest point on the river's centreline to (x, z), and the river's half-width there. */
export function riverAt(x: number, z: number) {
  let best = { distance: Infinity, cx: 0, cz: 0, halfWidth: 0 }
  for (let i = 0; i < riverSamples.length - 1; i++) {
    const a = riverSamples[i], b = riverSamples[i + 1]
    const abx = b.x - a.x, abz = b.z - a.z
    const t = THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.z) * abz) / (abx * abx + abz * abz), 0, 1)
    const cx = a.x + abx * t, cz = a.z + abz * t
    const distance = Math.hypot(x - cx, z - cz)
    if (distance < best.distance) best = { distance, cx, cz, halfWidth: THREE.MathUtils.lerp(a.width, b.width, t) / 2 }
  }
  return best
}

/** Water too deep to walk into; the last 0.1 by each bank is shallow enough to stand at. */
export function isDeepWater(x: number, z: number) {
  const river = riverAt(x, z)
  return river.distance < river.halfWidth - 0.1
}

/** Keeps a point at least `margin` inside the riverbanks. Returns true if it had to move it. */
export function clampToRiver(position: THREE.Vector3, margin: number) {
  const river = riverAt(position.x, position.z)
  const limit = river.halfWidth - margin
  if (river.distance <= limit) return false
  position.x = river.cx + ((position.x - river.cx) / river.distance) * limit
  position.z = river.cz + ((position.z - river.cz) / river.distance) * limit
  return true
}

/** Teal water whose ripple crests catch the light-teal reflection colour; it fades into the fog like everything else. */
export const waterMaterial = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    time: { value: 0 }, water: { value: new THREE.Color(palette.water) }, reflection: { value: new THREE.Color(palette.reflection) },
  }]),
  fog: true,
  side: THREE.DoubleSide,
  // Marks every visible water pixel in the stencil buffer, so reflections draw on the water only.
  stencilWrite: true,
  stencilRef: 1,
  stencilFunc: THREE.AlwaysStencilFunc,
  stencilZPass: THREE.ReplaceStencilOp,
  vertexShader: `#include <fog_pars_vertex>
    varying vec2 vUv;
    void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `#include <fog_pars_fragment>
    uniform float time; uniform vec3 water; uniform vec3 reflection; varying vec2 vUv;
    void main() { float wave = sin((vUv.x + vUv.y) * 9.0 + time * 2.0) * sin(vUv.y * 2.3 - time * 0.7);
      gl_FragColor = vec4(mix(water, reflection, smoothstep(0.55, 0.95, wave)), 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
    }`,
})

/** The water ribbon along the whole river, plus tree-lined banks outside the village and the homestead. */
export function buildRiver(excluded: Area[]) {
  const river = new THREE.Group()
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  riverSamples.forEach(({ x, z, width }, i) => {
    const a = riverSamples[Math.max(0, i - 1)], b = riverSamples[Math.min(riverSamples.length - 1, i + 1)]
    const length = Math.hypot(b.x - a.x, b.z - a.z)
    const nx = -(b.z - a.z) / length, nz = (b.x - a.x) / length
    for (const side of [-1, 1]) {
      const px = x + nx * side * width / 2, pz = z + nz * side * width / 2
      positions.push(px, 0, pz)
      uvs.push(px, pz)
    }
    if (i > 0) indices.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2)
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const water = new THREE.Mesh(geometry, waterMaterial)
  water.position.y = 0.03
  // Drawn after everything else that is solid, so anything in front of the water (the boat, bank
  // trees) has already hidden it there and the stencil is only marked where water really shows.
  water.renderOrder = 10
  river.add(water)

  const trees: THREE.Vector3[] = []
  riverSamples.forEach(({ x, z, width }, i) => {
    if (i % 4 !== 0) return
    const a = riverSamples[Math.max(0, i - 1)], b = riverSamples[Math.min(riverSamples.length - 1, i + 1)]
    const length = Math.hypot(b.x - a.x, b.z - a.z)
    for (const side of [-1, 1]) {
      if (rand(i * 2 + side) < 0.45) continue
      const offset = width / 2 + 0.8 + rand(i + side * 7) * 0.5
      const tx = x - ((b.z - a.z) / length) * side * offset, tz = z + ((b.x - a.x) / length) * side * offset
      if (!excluded.some((area) => inside(tx, tz, area))) trees.push(new THREE.Vector3(tx, 0, tz))
    }
  })
  addInstancedTrees(river, trees, palette.leaf, 0.9)
  return river
}
