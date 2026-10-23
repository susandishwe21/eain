/** Movement for this frame: x is right (+) / left (−), y is forward (+) / back (−), each −1..1. */
export interface InputState { x: number, y: number, run: boolean }

/**
 * Keyboard (WASD or arrows, Shift to run, E to interact) plus an on-screen joystick and Action
 * button, which work with a mouse as well as a finger. Pushing the joystick to its edge runs.
 */
export function createControls() {
  const keys = new Set<string>()
  let action = false
  // Only changes the prompt's wording ("ACTION" rather than "E"); the on-screen controls always show.
  let touchScreen = window.matchMedia('(pointer: coarse)').matches

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('select, input')) return
    keys.add(event.code)
    if (event.code === 'KeyE' && !event.repeat) action = true
    if (event.code.startsWith('Arrow')) event.preventDefault()
  })
  window.addEventListener('keyup', (event) => keys.delete(event.code))
  window.addEventListener('blur', () => keys.clear())

  const touch = document.createElement('div')
  touch.className = 'touch-controls'
  touch.innerHTML = '<div class="joystick"><div class="knob"></div></div><button class="action-button">ACTION</button>'
  document.body.append(touch)
  window.addEventListener('touchstart', () => { touchScreen = true }, { once: true })

  const stick = { x: 0, y: 0 }
  const base = touch.querySelector<HTMLElement>('.joystick')!
  const knob = touch.querySelector<HTMLElement>('.knob')!
  let pointerId: number | null = null
  const moveKnob = (event: PointerEvent) => {
    const rect = base.getBoundingClientRect()
    const radius = rect.width / 2
    let dx = (event.clientX - rect.left - radius) / radius, dy = (event.clientY - rect.top - radius) / radius
    const length = Math.hypot(dx, dy)
    if (length > 1) { dx /= length; dy /= length }
    stick.x = dx
    stick.y = -dy
    knob.style.transform = `translate(${dx * radius * 0.6}px, ${dy * radius * 0.6}px)`
  }
  const release = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return
    pointerId = null
    stick.x = stick.y = 0
    knob.style.transform = ''
  }
  base.addEventListener('pointerdown', (event) => {
    pointerId = event.pointerId
    base.setPointerCapture(event.pointerId)
    moveKnob(event)
  })
  base.addEventListener('pointermove', (event) => { if (event.pointerId === pointerId) moveKnob(event) })
  base.addEventListener('pointerup', release)
  base.addEventListener('pointercancel', release)
  // preventDefault also stops a mouse click moving keyboard focus onto the button.
  touch.querySelector('.action-button')!.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    action = true
  })

  const pressed = (...codes: string[]) => codes.some((code) => keys.has(code))
  return {
    get touchScreen() { return touchScreen },
    read(): InputState {
      const x = (pressed('KeyD', 'ArrowRight') ? 1 : 0) - (pressed('KeyA', 'ArrowLeft') ? 1 : 0) + stick.x
      const y = (pressed('KeyW', 'ArrowUp') ? 1 : 0) - (pressed('KeyS', 'ArrowDown') ? 1 : 0) + stick.y
      const length = Math.max(1, Math.hypot(x, y))
      return { x: x / length, y: y / length, run: pressed('ShiftLeft', 'ShiftRight') || Math.hypot(stick.x, stick.y) > 0.9 }
    },
    /** Acts as if E was pressed, e.g. when the on-screen prompt is clicked. */
    press() {
      action = true
    },
    /** True once per press of E or the Action button. */
    consumeAction() {
      const wasPressed = action
      action = false
      return wasPressed
    },
    /** Hides the joystick and Action button indoors. */
    setTouchVisible(visible: boolean) {
      touch.hidden = !visible
    },
  }
}
