let context: AudioContext | null = null
let master: GainNode | null = null
// Sound starts off; the SOUND button turns it on.
let muted = true
const waiting: ((context: AudioContext, master: GainNode) => void)[] = []

/** Browsers only allow audio after a user gesture, so sound starts on the first key press or tap. */
function start() {
  if (context) return
  context = new AudioContext()
  master = context.createGain()
  master.gain.value = muted ? 0 : 1
  master.connect(context.destination)
  for (const ready of waiting) ready(context, master)
}
window.addEventListener('pointerdown', start, { once: true })
window.addEventListener('keydown', start, { once: true })

/** Runs `ready` once audio has started; connect sounds to `master` so the mute button reaches them. */
export function onAudioReady(ready: (context: AudioContext, master: GainNode) => void) {
  if (context && master) ready(context, master)
  else waiting.push(ready)
}

export function setMuted(next: boolean) {
  muted = next
  if (context && master) master.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.05)
}
