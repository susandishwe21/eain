import { placeStories, type PlaceId } from '../data/places'

export function createPanel() {
  const panel = document.createElement('aside')
  panel.className = 'story-panel'
  panel.hidden = true
  document.body.append(panel)
  return {
    get open() { return !panel.hidden },
    show(id: PlaceId) {
      const story = placeStories[id]
      panel.innerHTML = `<button class="close" aria-label="Close">×</button><p class="eyebrow">${story.titleMyanmar}</p><h2>${story.title}</h2><p>${story.text}</p><p lang="my">${story.textMyanmar}</p>`
      panel.hidden = false
      panel.querySelector('.close')?.addEventListener('click', () => { panel.hidden = true })
    },
    hide() {
      panel.hidden = true
    },
  }
}
