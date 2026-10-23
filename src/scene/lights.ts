import * as THREE from 'three'
import { palette } from '../config'

export function addLights(scene: THREE.Scene) {
  const ambient = new THREE.HemisphereLight(palette.haze, palette.forest, 1.7)
  scene.add(ambient)
  const windowLight = new THREE.DirectionalLight(palette.reflection, 2.2)
  windowLight.position.set(2, 4, -5)
  scene.add(windowLight)
  const lampLight = new THREE.PointLight(palette.cream, 3.5, 6, 2)
  lampLight.position.set(-2.1, 3.2, 0.3)
  lampLight.name = 'LampLight'
  scene.add(lampLight)
  return { ambient, lampLight }
}
