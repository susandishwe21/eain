import * as THREE from 'three'

/** Fresh rainy-season greens of the Ayeyarwady delta. Every colour in the scene and UI comes from here. */
export const palette = {
  forest: '#1F3D2B', // deep forest green: shadows, dense trees
  canopy: '#2E5E3A', // dark green: tree canopy
  leaf: '#3F7D4A', // green: palm leaves, river-bank trees
  rice: '#5FA052', // fresh green: rice fields
  youngRice: '#8BC56A', // light green: young rice, grass park
  highlight: '#BFE3A0', // pale green: highlights, sunlight on leaves
  haze: '#E8F5D8', // very light green-white: sky haze, light
  water: '#6FA8A0', // soft teal: river water
  reflection: '#A8D5CC', // light teal: water reflections
  wood: '#8A6A4A', // warm brown: house wood, earth bunds (use sparingly)
  cream: '#F4E9C8', // cream: UI text, small lights
  darkGold: '#7A5A1E', // dark gold: shadows on the pagoda
  gold: '#C9962E', // gold: main pagoda body
  brightGold: '#F2C94C', // bright gold: lit side, spire
  paleGold: '#FFF1B8', // pale gold: shine, highlights, glow
}

/** UI colours, applied as CSS custom properties (--panel, --text, …) on startup. */
export const uiColors = {
  panel: palette.forest,
  text: palette.highlight,
  accent: palette.youngRice,
  heading: palette.cream,
}

/** The small set of values you are most likely to tweak while learning. */
export const pixelConfig = {
  width: 320,
  height: 180,
  // The dither shader snaps every pixel to the nearest of these colours.
  palette: Object.values(palette),
  // How far (0–1, per colour channel) the ordered dither nudges a pixel before snapping.
  ditherStrength: 0.12,
}

/** How the girl walks. */
export const playerConfig = {
  walkSpeed: 1.1,
  runSpeed: 2.4,
  radius: 0.22, // her collision circle
  height: 0.95, // a replacement public/models/girl.glb is scaled to this height
}

/** How the boat drives. */
export const boatConfig = {
  maxSpeed: 3.0, // at full throttle; half the joystick gives half the speed
  reverseSpeed: 0.8,
  acceleration: 1.2,
  drag: 0.6, // how quickly it coasts to a stop with no throttle
  turnSpeed: 0.9, // radians per second at full rudder
  halfWidth: 0.35, // kept this far inside the riverbanks
  boardDistance: 1.8, // how close she must be to board
  dockDistance: 2.4, // how close the boat must be to a landing to get off
}

/** The third-person camera: how far behind and above, and how fast it swings round behind her. */
export const followConfig = {
  walking: { distance: 4.2, height: 2.4, turn: 1.2 },
  boating: { distance: 6.0, height: 3.4, turn: 2.0 },
}

/** The indoor room camera. */
export const cameraConfig = {
  position: new THREE.Vector3(7.5, 5.2, 8.5),
  target: new THREE.Vector3(0, 2.1, 0),
  minDistance: 7,
  maxDistance: 12,
  minPolarAngle: Math.PI * 0.28,
  maxPolarAngle: Math.PI * 0.48,
  minAzimuthAngle: -Math.PI * 0.2,
  maxAzimuthAngle: Math.PI * 0.2,
}
