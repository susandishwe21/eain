/**
 * walking: on foot, at the port or at home
 * boating: driving the boat up the river
 * home:    reached the door; "Welcome home" while the camera moves in
 * indoor:  inside the room
 */
export type GameState = 'walking' | 'boating' | 'home' | 'indoor'

export function createGameState(initial: GameState) {
  let current = initial
  const listeners: ((next: GameState, previous: GameState) => void)[] = []
  return {
    get current() { return current },
    set(next: GameState) {
      if (next === current) return
      const previous = current
      current = next
      for (const listener of listeners) listener(next, previous)
    },
    onChange(listener: (next: GameState, previous: GameState) => void) {
      listeners.push(listener)
    },
  }
}
