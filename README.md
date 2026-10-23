# eain (အိမ်)

A cozy, pixel-art 3D game about going home in Myanmar's Ayeyarwady region,
built with Vite, TypeScript, and Three.js. A village girl starts at a
neighbouring village's river port, takes a boat up the river between the rice
fields, and walks home to the house among the trees, where the indoor room
opens. Everything is made from simple primitives so it is easy to learn from
and replace with Blender assets later.

## Run it

```bash
npm install
npm run dev
```

For a production build, run `npm run build`, then `npm run preview`.

## Play

| | Keyboard | Touch screen |
| --- | --- | --- |
| Walk | WASD or arrow keys | Joystick (bottom left) |
| Run | Shift | Push the joystick to its edge |
| Interact | E | ACTION button |
| Drive the boat | W / S speed up and slow down, A / D steer | Joystick |

1. At the port, walk out along the jetty. Near the boat, **E · လှေစီးမယ်
   (Board the boat)** appears.
2. Drive north up the river. The banks keep the boat on the water.
3. At the wooden landing by the house, **E · ကမ်းပေါ်တက်မယ် (Get off)** appears.
4. Walk to the front door: **အိမ်ရောက်ပြီ · Welcome home**, and the camera
   moves into the room. **BACK OUTSIDE** returns you to the yard.

Stand by the tree rows, the green field, the hut, the paddies, the river at
home, or the golden pagoda at the port and press E to read its story; you can
also click (or tap) either pagoda. In the evening and on Thadingyut night the
pagoda glows, candles light its base, and it reflects in the river. The mini-map
shows the river, the port, home, and where you are. Sound starts off; **SOUND OFF/ON** toggles the
engine and ambience; **WORLD SETTINGS** switches morning, evening, and
Thadingyut night (lanterns around the house), and the pixel effect.

## Learn the structure

North is −z and east is +x everywhere.

- `src/main.ts` creates the renderer and scene, wires everything together, and
  runs the game loop.
- `src/config.ts` is the tuning panel: palette, pixel resolution, walking and
  boat speeds, and camera distances.
- `src/game/state.ts` holds the game state: walking, boating, home, indoor.
- `src/player/character.ts` loads the girl, plays her idle/walk/run/sit
  animations with an `AnimationMixer`, and moves her.
- `src/player/controls.ts` reads the keyboard, the virtual joystick, and the
  Action button.
- `src/player/cameraFollow.ts` is the third-person camera; it pulls in rather
  than pass through trees and walls.
- `src/boat/boat.ts` builds the boats and drives the player's boat (throttle,
  steering, rocking, wake ripples, engine sound).
- `src/data/riverPath.ts` is the river's centreline and width, from the port to
  home. Edit it to reshape the river; the water, banks, fields, and boat limits
  all follow.
- `src/world/river.ts` draws the water and answers "how far from the river is
  this point?" for the boat and for walking.
- `src/world/home.ts` is the homestead, laid out from the satellite view: the
  house in its grove, the tree rows, the green field, the hut, the shed, and the
  landing. Its `areas` table says which grid cells each landmark claims; every
  other cell becomes a paddy.
- `src/world/port.ts` is the neighbouring village: jetty, moored boats, houses
  on stilts, tea shop, drying nets, baskets and pots, palms, and the golden pagoda.
- `src/world/pagoda.ts` builds the Burmese-style golden pagoda (stepped base,
  bell dome, banana bud, spire and hti), its candles, and its river reflection.
  A smaller one stands in the fields west of home.
- `src/world/world.ts` puts the port, river, fields, and home together.
- `src/world/colliders.ts` is the small collision system: circles and boxes,
  walkable regions, and walkways (the jetty and landing) over the water.
- `src/world/props.ts` has the shared builders: boxes, plots, trees, palms.
- `src/ui/prompts.ts` shows the "E · …" prompts, messages, and the mini-map;
  `src/ui/panel.ts` and `src/ui/settings.ts` are the story panel and settings.
- `src/scene/room.ts` and `src/scene/lights.ts` build the indoor room and the lights.
- `src/effects/pixelDither.ts` renders to a low-resolution HDR target, adds bloom
  (only colours brighter than 1.0 glow: the pagoda's crown and candles), then
  applies the 4×4 Bayer ordered-dither shader.
- `src/data/places.ts` and `src/data/objects.ts` contain the English and Burmese stories.

## Replace the girl

`public/models/girl.glb` is the girl built from shapes in
`src/player/character.ts` (`buildGirl`), exported with her four animations.
Replace it with any rigged character (for example a CC0 one from Quaternius or
Kenney): she is scaled to `playerConfig.height`, should face +z, and her
animation clips are matched by name — any clip whose name contains `idle`,
`walk`, `run`, or `sit` (a missing one falls back to idle). If the file is
missing, the game builds her from shapes instead.

## Change the pixel look

Edit `src/config.ts`. `palette` holds the fresh-green rainy-season colours: the
scene materials, sky, water, and UI (via `uiColors`, applied as CSS variables)
all use it, and the dither shader snaps every pixel to the nearest one of them.
In `pixelConfig`, `width` and `height` control the internal pixel canvas
(smaller means chunkier pixels) and `ditherStrength` sets how much ordered
dither is mixed in before snapping. The top-right settings menu lets you toggle
dithering and try a few resolutions at runtime.

## Add a Blender model

Export your room as `public/models/room.glb`. The app tries to load it on startup
and keeps the primitive room if the file is missing. To make model parts
clickable, name Blender objects `PhotoFrame`, `Lamp`, `Bookshelf`, or `Window`;
`src/scene/loadModel.ts` and `src/main.ts` document the mapping. Keep the model
at a similar scale/origin to the sample room, or adjust the camera in
`src/config.ts`.

## Deploy to Vercel

Import this repository in Vercel. It detects Vite automatically; use:

- Build command: `npm run build`
- Output directory: `dist`

Because models under `public/` are copied unchanged, an indoor model at
`public/models/room.glb` is available at `/models/room.glb` when deployed.
