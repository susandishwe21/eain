import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import './style.css'
import { onAudioReady, setMuted } from './audio/sound'
import { createPlayerBoat } from './boat/boat'
import { boatConfig, cameraConfig, followConfig, palette, playerConfig, uiColors } from './config'
import { placeStories } from './data/places'
import { createPixelEffect } from './effects/pixelDither'
import { createGameState } from './game/state'
import { createCameraFollow } from './player/cameraFollow'
import { createCharacter, loadGirl } from './player/character'
import { createControls } from './player/controls'
import { addLights } from './scene/lights'
import { buildRoom } from './scene/room'
import { createPanel } from './ui/panel'
import { createMiniMap, createPrompts } from './ui/prompts'
import { createSettings, type TimeOfDay } from './ui/settings'
import type { StorySpot } from './world/home'
import { animateWorld, buildWorld, worldBounds, type World } from './world/world'

for (const [name, color] of Object.entries(uiColors)) document.documentElement.style.setProperty(`--${name}`, color)
const app = document.querySelector<HTMLDivElement>('#app')!
const canvas = document.createElement('canvas')
app.append(canvas)
const title = document.createElement('div')
title.className = 'world-title'
title.innerHTML = '<strong>အိမ်</strong><span>eain · our home</span>'
app.append(title)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false })
renderer.outputColorSpace = THREE.SRGBColorSpace
const scene = new THREE.Scene()
const outdoorFov = 50
const camera = new THREE.PerspectiveCamera(outdoorFov, 16 / 9, 0.1, 100)
// Orbit controls only look around the indoor room; outdoors the follow camera drives.
const controls = new OrbitControls(camera, canvas)
controls.enabled = false
controls.enablePan = false
controls.minDistance = cameraConfig.minDistance
controls.maxDistance = cameraConfig.maxDistance
controls.minPolarAngle = cameraConfig.minPolarAngle
controls.maxPolarAngle = cameraConfig.maxPolarAngle
controls.minAzimuthAngle = cameraConfig.minAzimuthAngle
controls.maxAzimuthAngle = cameraConfig.maxAzimuthAngle

const world = buildWorld()
const indoor = buildRoom()
scene.add(world.group)
const { ambient: ambientLight, lampLight } = addLights(scene)
const effect = createPixelEffect(renderer)
effect.scenePass.scene = scene
effect.scenePass.camera = camera

const boat = createPlayerBoat(world.group, world.colliders, world.port.mooring)
const girl = createCharacter(await loadGirl())
world.group.add(girl.object)
girl.object.position.set(world.port.spawn.x, 0, world.port.spawn.z)
girl.heading = world.port.spawn.heading

const input = createControls()
const follow = createCameraFollow(camera, world.colliders)
follow.snap(girl.object.position, girl.heading, followConfig.walking)
const state = createGameState('walking')
const prompts = createPrompts(() => input.press())
const panel = createPanel()
const miniMap = createMiniMap(worldBounds, world.riverSamples, { port: world.port.dock.land, home: world.home.door })
createSettings(
  effect.setEnabled,
  (width, height) => effect.setSize(width, height),
  (time) => setTimeOfDay(time),
  setMuted,
)
const backButton = document.createElement('button')
backButton.className = 'back-outside'
backButton.textContent = '← BACK OUTSIDE'
backButton.hidden = true
backButton.addEventListener('click', leaveHouse)
app.append(backButton)

state.onChange((next) => {
  input.setTouchVisible(next === 'walking' || next === 'boating')
  miniMap.visible = next !== 'indoor'
})

type Interaction = { text: string, run: () => void } | null
const flat = (a: { x: number, z: number }, b: { x: number, z: number }) => Math.hypot(a.x - b.x, a.z - b.z)
// Fog is outdoor-only; it is kept here while she is inside.
let outdoorFog: THREE.Fog | null = null
let openStory: StorySpot | null = null
// The door only welcomes her home once she has stepped away from it, so walking out doesn't send her straight back in.
let doorArmed = true
let welcomeTime = 0
const lookAt = new THREE.Vector3()

function walkingInteraction(): Interaction {
  const here = girl.object.position
  if (flat(here, boat.object.position) < boatConfig.boardDistance) return { text: 'လှေစီးမယ် (Board the boat)', run: board }
  const spot = world.stories.find((story) => flat(here, story) < story.radius)
  if (!spot) return null
  const story = placeStories[spot.id]
  return { text: `${story.titleMyanmar} · ${story.title}`, run: () => { panel.show(spot.id); openStory = spot } }
}

function boatingInteraction(): Interaction {
  const dock = world.docks.find((candidate) => flat(boat.object.position, candidate.boat) < boatConfig.dockDistance)
  if (!dock || Math.abs(boat.speed) > 1.5) return null
  return { text: 'ကမ်းပေါ်တက်မယ် (Get off)', run: () => getOff(dock) }
}

function board() {
  panel.hide()
  boat.seat.add(girl.object)
  girl.object.position.set(0, 0, 0)
  girl.heading = 0
  girl.play('sit')
  state.set('boating')
}

function getOff(dock: World['docks'][number]) {
  world.group.add(girl.object)
  girl.object.position.set(dock.land.x, 0, dock.land.z)
  // A zero-length move settles her at the landing's height.
  world.colliders.moveWalker(girl.object.position, 0, 0, playerConfig.radius)
  girl.heading = dock.landHeading
  boat.stop()
  state.set('walking')
}

function arriveHome() {
  panel.hide()
  girl.play('idle')
  prompts.message('အိမ်ရောက်ပြီ · Welcome home')
  welcomeTime = 0
  lookAt.set(girl.object.position.x, 0.7, girl.object.position.z)
  state.set('home')
}

function enterHouse() {
  state.set('indoor')
  scene.remove(world.group)
  scene.add(indoor)
  outdoorFog = scene.fog as THREE.Fog | null
  scene.fog = null
  camera.fov = 38
  camera.updateProjectionMatrix()
  camera.position.copy(cameraConfig.position)
  controls.target.copy(cameraConfig.target)
  controls.enabled = true
  controls.update()
  backButton.hidden = false
  title.classList.add('indoor-title')
}

function leaveHouse() {
  scene.remove(indoor)
  scene.add(world.group)
  scene.fog = outdoorFog
  camera.fov = outdoorFov
  camera.updateProjectionMatrix()
  controls.enabled = false
  backButton.hidden = true
  title.classList.remove('indoor-title')
  // She steps out of the door and turns east along the yard towards the landing, camera behind her.
  girl.object.position.set(world.home.door.x, 0, world.home.door.z + 0.25)
  girl.heading = Math.PI / 2
  doorArmed = false
  follow.snap(girl.object.position, girl.heading, followConfig.walking)
  state.set('walking')
}

/** A vertical gradient from `top` down to `horizon`, drawn behind the scene. */
function skyGradient(top: string, horizon: string) {
  const sky = document.createElement('canvas')
  sky.width = 1
  sky.height = 256
  const context = sky.getContext('2d')!
  const gradient = context.createLinearGradient(0, 0, 0, sky.height)
  gradient.addColorStop(0, top)
  gradient.addColorStop(1, horizon)
  context.fillStyle = gradient
  context.fillRect(0, 0, 1, sky.height)
  const texture = new THREE.CanvasTexture(sky)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function setTimeOfDay(time: TimeOfDay) {
  const settings = {
    morning: { sky: [palette.reflection, palette.haze], sun: 1.4, ambient: 2.0, lamp: 0.8, lanterns: false, bloom: 0.35 },
    evening: { sky: [palette.water, palette.highlight], sun: 0.9, ambient: 1.5, lamp: 2.3, lanterns: false, bloom: 0.9 },
    night: { sky: [palette.forest, palette.canopy], sun: 0.15, ambient: 0.7, lamp: 3.5, lanterns: true, bloom: 1.1 },
  }[time]
  if (scene.background instanceof THREE.Texture) scene.background.dispose()
  scene.background = skyGradient(settings.sky[0], settings.sky[1])
  // Fog fades the far fields into the sky's horizon colour.
  const fog = new THREE.Fog(settings.sky[1], 18, 55)
  if (state.current === 'indoor') outdoorFog = fog
  else scene.fog = fog
  ambientLight.intensity = settings.ambient
  const sun = world.group.getObjectByName('Sun') as THREE.DirectionalLight
  sun.intensity = settings.sun
  lampLight.intensity = settings.lamp
  world.group.getObjectByName('Lanterns')!.visible = settings.lanterns
  // The pagodas glow more, light their candles, and show in the river as the light falls.
  effect.bloomPass.strength = settings.bloom
  for (const pagoda of world.pagodas) pagoda.setTime(time)
  for (const reflection of world.reflections) reflection.setTime(time)
}

// Clicking (or tapping) either pagoda opens its story.
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const pagodaUnder = (event: PointerEvent | MouseEvent) => {
  if (state.current !== 'walking' && state.current !== 'boating') return false
  const rect = canvas.getBoundingClientRect()
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  return raycaster.intersectObjects(world.pagodas.map((pagoda) => pagoda.structure)).length > 0
}
canvas.addEventListener('pointermove', (event) => { canvas.style.cursor = pagodaUnder(event) ? 'pointer' : '' })
canvas.addEventListener('click', (event) => {
  if (!pagodaUnder(event)) return
  openStory = null
  panel.show('pagoda')
})

function resize() {
  const width = Math.max(1, app.clientWidth)
  const height = Math.max(1, app.clientHeight)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()
setTimeOfDay('morning')

// A quiet ambient hum under everything; the sound button mutes it with the boat engine.
onAudioReady((context, master) => {
  const gain = context.createGain()
  gain.gain.value = 0.018
  gain.connect(master)
  const oscillator = context.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.value = 165
  oscillator.connect(gain)
  oscillator.start()
})

// Frame time comes straight from requestAnimationFrame. THREE.Timer is not used because it reports
// zero time whenever document.hidden is true, which some embedded browsers report even while showing
// the page, freezing her in place. The 0.05 s cap keeps her from jumping after a pause.
let lastTime = 0
let elapsed = 0
const doorLook = new THREE.Vector3()
const doorView = new THREE.Vector3()
renderer.setAnimationLoop((time) => {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0
  lastTime = time
  elapsed += dt
  const move = input.read()
  let interaction: Interaction = null

  if (state.current === 'walking') {
    girl.walk(dt, move, follow.yaw, world.colliders)
    boat.update(dt, null, elapsed)
    follow.update(dt, girl.object.position, girl.heading, followConfig.walking, girl.moving)
    const toDoor = flat(girl.object.position, world.home.door)
    if (toDoor > 1.0) doorArmed = true
    if (doorArmed && toDoor < 0.6) arriveHome()
    else interaction = walkingInteraction()
    if (openStory && flat(girl.object.position, openStory) > openStory.radius + 0.5) {
      panel.hide()
      openStory = null
    }
  } else if (state.current === 'boating') {
    boat.update(dt, move, elapsed)
    follow.update(dt, boat.object.position, boat.heading, followConfig.boating, true)
    interaction = boatingInteraction()
  } else if (state.current === 'home') {
    // The camera glides up to the door, then the room takes over.
    welcomeTime += dt
    const door = world.home.door
    doorView.set(door.x, 1.1, door.z + 1.6)
    doorLook.set(door.x, 0.9, door.z - 0.4)
    camera.position.lerp(doorView, 1 - Math.exp(-2.5 * dt))
    lookAt.lerp(doorLook, 1 - Math.exp(-3 * dt))
    camera.lookAt(lookAt)
    boat.update(dt, null, elapsed)
    if (welcomeTime > 2.2) enterHouse()
  } else {
    controls.update()
  }

  if (input.consumeAction() && interaction) {
    interaction.run()
    interaction = null
  }
  prompts.show(panel.open ? null : interaction?.text ?? null, input.touchScreen)
  prompts.hint(input.touchScreen || (state.current !== 'walking' && state.current !== 'boating') ? null : state.current)
  girl.update(dt)
  if (state.current !== 'indoor') {
    animateWorld(world.group, elapsed)
    if (state.current === 'boating') miniMap.update(boat.object.position, boat.heading)
    else miniMap.update(girl.object.position, girl.heading)
  }
  effect.composer.render()
})
