import { palette } from '../config'

/** Keys for whatever she is doing now, shown along the bottom on keyboard screens. */
const keyHints = {
  walking: 'JOYSTICK / WASD walk · edge or SHIFT run · ACTION / E',
  boating: 'JOYSTICK / WASD: up faster · down slower · sideways steer · ACTION / E get off',
}

/**
 * The "E · …" interaction prompt (also clickable, for anyone who doesn't know the key), the big
 * centred messages, and the key hints.
 */
export function createPrompts(onPromptClick: () => void) {
  const prompt = document.createElement('button')
  prompt.className = 'action-prompt'
  prompt.hidden = true
  // Keep focus on the page, so the keyboard keeps working after a click.
  prompt.addEventListener('pointerdown', (event) => event.preventDefault())
  prompt.addEventListener('click', onPromptClick)
  const banner = document.createElement('div')
  banner.className = 'banner'
  banner.hidden = true
  const hints = document.createElement('div')
  hints.className = 'key-hints'
  hints.hidden = true
  document.body.append(prompt, banner, hints)
  let shown = ''
  let bannerTimer = 0
  return {
    /** Shows "E · text" ("ACTION · text" on touch screens); null hides it. */
    show(text: string | null, touchScreen: boolean) {
      const next = text ? `${touchScreen ? 'ACTION' : 'E'} · ${text}` : ''
      if (next === shown) return
      shown = next
      prompt.textContent = next
      prompt.hidden = !text
    },
    /** Shows the keys for walking or boating; null hides them (indoors, or on touch screens). */
    hint(mode: keyof typeof keyHints | null) {
      hints.hidden = !mode
      if (mode) hints.textContent = keyHints[mode]
    },
    message(text: string, duration = 2600) {
      banner.textContent = text
      banner.hidden = false
      window.clearTimeout(bannerTimer)
      bannerTimer = window.setTimeout(() => { banner.hidden = true }, duration)
    },
  }
}

interface MapPoint { x: number, z: number }

/** A small north-up map of the river with the port, home, and her position. */
export function createMiniMap(
  bounds: { x0: number, x1: number, z0: number, z1: number },
  river: { x: number, z: number, width: number }[],
  places: { port: MapPoint, home: MapPoint },
) {
  const scale = 1.5
  const canvas = document.createElement('canvas')
  canvas.className = 'mini-map'
  canvas.width = Math.round((bounds.x1 - bounds.x0) * scale)
  canvas.height = Math.round((bounds.z1 - bounds.z0) * scale)
  document.body.append(canvas)
  const toMap = ({ x, z }: MapPoint) => [(x - bounds.x0) * scale, (z - bounds.z0) * scale] as const

  // The fields, river and landmarks never change, so draw them once.
  const base = document.createElement('canvas')
  base.width = canvas.width
  base.height = canvas.height
  const draw = base.getContext('2d')!
  draw.fillStyle = palette.canopy
  draw.fillRect(0, 0, base.width, base.height)
  draw.strokeStyle = palette.water
  draw.lineCap = 'round'
  for (let i = 1; i < river.length; i++) {
    draw.lineWidth = river[i].width * scale
    draw.beginPath()
    draw.moveTo(...toMap(river[i - 1]))
    draw.lineTo(...toMap(river[i]))
    draw.stroke()
  }
  for (const [place, color] of [[places.port, palette.wood], [places.home, palette.cream]] as const) {
    const [x, y] = toMap(place)
    draw.fillStyle = color
    draw.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6)
  }

  const context = canvas.getContext('2d')!
  return {
    set visible(visible: boolean) { canvas.hidden = !visible },
    update(position: MapPoint, heading: number) {
      context.drawImage(base, 0, 0)
      const [x, y] = toMap(position)
      context.fillStyle = palette.highlight
      context.fillRect(Math.round(x + Math.sin(heading) * 3) - 1, Math.round(y + Math.cos(heading) * 3) - 1, 2, 2)
      context.fillStyle = palette.haze
      context.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3)
    },
  }
}
