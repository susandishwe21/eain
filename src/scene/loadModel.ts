import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/**
 * Put your exported model at public/models/room.glb.
 * Name clickable Blender objects PhotoFrame, Lamp, Bookshelf, or Window;
 * the picker maps those names to the stories in src/data/objects.ts.
 */
export async function loadRoomModel(): Promise<THREE.Group | null> {
  try {
    const gltf = await new GLTFLoader().loadAsync('/models/room.glb')
    return gltf.scene
  } catch {
    // A missing optional model is expected during early prototyping.
    return null
  }
}
