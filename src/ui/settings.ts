export type TimeOfDay = 'morning' | 'evening' | 'night'

export function createSettings(
  onToggle: (enabled: boolean) => void,
  onPixelSize: (width: number, height: number) => void,
  onTime: (time: TimeOfDay) => void,
  onMute: (muted: boolean) => void,
) {
  const settings = document.createElement('section')
  settings.className = 'settings'
  settings.innerHTML = `<div class="settings-bar"><button class="mute-button" aria-pressed="true">SOUND OFF</button><button class="settings-button">WORLD SETTINGS</button></div><div class="settings-menu" hidden>
    <label><input class="dither" type="checkbox" checked> dither</label>
    <label>pixels <select class="size"><option value="320">320 × 180</option><option value="480">480 × 270</option><option value="240">240 × 135</option></select></label>
    <label>time <select class="time"><option value="morning" selected>morning</option><option value="evening">evening</option><option value="night">Thadingyut night</option></select></label>
  </div>`
  document.body.append(settings)
  const menu = settings.querySelector<HTMLElement>('.settings-menu')!
  settings.querySelector('.settings-button')!.addEventListener('click', () => { menu.hidden = !menu.hidden })
  settings.querySelector('.dither')!.addEventListener('change', (event) => onToggle((event.target as HTMLInputElement).checked))
  settings.querySelector('.size')!.addEventListener('change', (event) => {
    const width = Number((event.target as HTMLSelectElement).value)
    onPixelSize(width, Math.round(width * 9 / 16))
  })
  settings.querySelector('.time')!.addEventListener('change', (event) => onTime((event.target as HTMLSelectElement).value as TimeOfDay))
  const mute = settings.querySelector<HTMLButtonElement>('.mute-button')!
  mute.addEventListener('click', () => {
    const muted = mute.getAttribute('aria-pressed') !== 'true'
    mute.setAttribute('aria-pressed', String(muted))
    mute.textContent = muted ? 'SOUND OFF' : 'SOUND ON'
    onMute(muted)
  })
}
