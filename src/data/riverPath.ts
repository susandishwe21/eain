/**
 * The river from the neighbouring village's port in the south (+z) up past the home landing in
 * the north (-z), as [x, z, width] control points. world/river.ts smooths these into a curve,
 * draws the water along it, and keeps the boat between its banks.
 */
export const riverPath: [x: number, z: number, width: number][] = [
  [2.0, 66, 4.0],
  [-0.5, 58, 4.5],
  [-1.0, 52, 5.5], // the port basin, where the village jetty reaches into the river
  [-1.0, 46, 5.5],
  [0.5, 40, 4.0],
  [4.5, 33, 3.4],
  [5.5, 26, 3.2],
  [2.5, 19, 3.0],
  [2.0, 13, 2.8],
  [3.6, 7.5, 2.4],
  [3.6, 3.0, 2.2], // entering the homestead
  [3.5, -1.0, 2.2], // the home landing is on the west bank, near z = -2
  [3.7, -4.0, 2.2],
  [3.9, -8.0, 2.2],
  [4.0, -15, 2.2],
]
