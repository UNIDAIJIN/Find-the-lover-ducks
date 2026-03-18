# CLAUDE.md — Find-the-lover-ducks

AI assistant guide for working in this repository.

---

## Project Overview

**Find-the-lover-ducks** is a browser-based pixel-art RPG built with vanilla JavaScript ES Modules and HTML5 Canvas. There is **no build step** — the game runs directly in the browser by opening `index.html`.

- **Version**: 0.1.6
- **Canvas resolution**: 256×240 (scaled 3× in CSS → 768px)
- **Target FPS**: 60fps desktop, 30fps mobile
- **Platform**: Any modern browser (Chrome, Firefox, Safari, iOS)

---

## Repository Structure

```
Find-the-lover-ducks/
├── index.html               # Entry point — loads src/main.js as a module
├── style.css                # Canvas element styling
├── README.md                # Player-facing documentation
├── fonts/                   # PixelMplus10 bitmap font
├── assets/
│   ├── audio/               # bgm0.mp3, bgm_battle.mp3, bgm_end.mp3, duckA-J.mp3, se/
│   ├── sprites/             # Character and NPC sprite PNGs (16×16 tiles)
│   ├── maps/                # Background PNGs, top-layer PNGs, collision PNGs, shrine variants
│   └── battle/              # Boss battle sprite sheet
└── src/
    ├── main.js              # Game loop, rendering pipeline, top-level state
    ├── config.js            # All magic numbers / constants
    ├── state.js             # Persistent runtime game state (items collected, position, etc.)
    ├── registry.js          # Central export of all system constructors
    ├── input.js             # Keyboard + mobile input handler
    ├── battle.js            # Turn-based battle engine
    ├── maps.js              # Map loader
    ├── npcs.js              # NPC definitions loader
    ├── items.js             # Item (duck) definitions
    ├── pickups.js           # Collectible pickup spawns
    ├── sprites.js           # Sprite asset loader
    ├── col.js               # Pixel-based collision detection
    ├── party_followers.js   # Party member trailing logic (ring buffer)
    ├── ui_dialog.js         # Typewriter dialog box
    ├── ui_choice.js         # Choice menu overlay
    ├── ui_inventory.js      # Inventory grid UI
    ├── battle_ui.js         # Battle screen rendering
    ├── fx_fade.js           # Fade-in/out transitions
    ├── fx_sea.js            # Animated water layer
    ├── ending.js            # Scrolling credits sequence
    ├── audio_bgm.js         # Background music controller
    ├── se.js                # Sound effects via Web Audio API
    ├── npc_events.js        # NPC event scripting
    ├── title.js             # Title screen
    ├── mobile_controller.js # Touch d-pad and buttons
    └── data/
        ├── maps/            # outdoor.js, indoor_01.js, pool.js, vj_room01.js, vj_room02.js
        ├── npcs/            # One .js file per NPC (16 files)
        ├── items/           # Item data files
        └── events/          # Special event scripts
```

---

## Architecture

### Module Pattern

Every system is a **factory function** that returns a public API object. Modules use ES module `import`/`export`; no bundler or transpiler is involved.

```js
// Typical module structure
export function createFoo(deps) {
  let _private = ...;

  function bar() { ... }

  return { bar };
}
```

### Registry

`src/registry.js` re-exports all major system constructors. Use this as the single import point instead of importing individual modules directly from `main.js`.

### State

- **`state.js`** — persistent data: collected items, current map, leader position, inventory. This is what gets saved to `localStorage`.
- **`main.js` locals** — transient runtime state: actors array, `mapReady`, current dialog instance, etc.

### Rendering Pipeline (in order)

1. Clear canvas
2. Sea animation layer (`fx_sea.js`)
3. Background image (camera-culled)
4. Shrine background crossfade (when in shrine zone)
5. All actors (party + NPCs) sorted by Y
6. Top layer image (foreground objects, rooftops)
7. UI: inventory → dialog → choice menu
8. Ending credits overlay
9. Fade transition
10. Debug overlay (coordinate readout, save notice)

### Game Loop

```
requestAnimationFrame → update(t) → draw()
```

Mobile caps at 30fps; desktop runs at 60fps.

---

## Key Systems

### Input (`input.js`)

- `input.down(key)` — true while key is held
- `input.consume(key)` — true once per keypress (resets after read)
- Keys: Arrow keys, Z (confirm), X (inventory), C, D (debug jump), S (save), L (load)
- Mobile: virtual d-pad injects same key events

### Collision (`col.js`)

Collision data is stored as PNGs. Pixel color meanings:
- **Alpha = 0** (transparent) → walkable
- **Red > 200, G < 50, B < 50** → shrine zone (triggers shrine mechanic)
- **Any other opaque pixel** → wall

### Maps (`data/maps/*.js`)

Each map exports an object with:
```js
{
  id, bgSrc, bgTopSrc, colSrc,       // asset paths
  bgmSrc, bgmVolume,                  // audio
  spawnPoints: { [id]: {x, y} },      // named spawn positions
  doors: [...],                        // door triggers → target map + spawn
  npcs: [...],                         // NPC IDs to load
  pickups: [...]                       // item pickups
}
```

### Dialog (`ui_dialog.js`)

- Pass an array of pages; each page is an array of lines.
- Typewriter effect at 40ms/character.
- `onPageChange(pageIndex)` callback enables mid-dialog choice triggers.
- Dialog types: `"talk"` (bottom box) or `"sign"` (notice board style).

### Battle (`battle.js`)

Turn-based, party-of-4 vs boss ミナミ (10 HP). Characters have HP, attack, defense, and status effects (DOKU, BLIND, CONRAN, CHIBI). Items (rubber ducks) can be thrown for bonus damage.

### Save/Load

`localStorage` key: `"rpg_save"`. Saves map ID, leader position, collected items, and inventory contents.

---

## Config Constants (`config.js`)

All magic numbers live here. Key values:

| Constant | Value | Purpose |
|---|---|---|
| `BASE_W` | 256 | Canvas base width |
| `BASE_H` | 240 | Canvas base height |
| `SPRITE_SIZE` | 16 | Sprite tile size |
| `MOVE_SPEED` | 1 | Pixels per frame |
| `WALK_FRAME_MS` | 180 | Walk animation frame duration |
| `NPC_FRAME_MS` | 360 | NPC animation frame duration |
| `CSS_SCALE` | 3 | Canvas CSS magnification |

Do not hardcode these values elsewhere — always import from `config.js`.

---

## Code Conventions

### Naming

- **Functions/variables**: camelCase (`createBattle`, `mapReady`)
- **Constants**: CAPS_SNAKE_CASE (`BASE_W`, `NPC_FRAME_MS`)
- **Private variables inside closures**: underscore prefix (`_ctx`, `_buffers`)
- **Factory functions**: `create` prefix (`createDialog`, `createInventory`)
- **Boolean predicates**: `is` / `can` prefix (`isWalkable`, `canInteract`)

### Code Style

- Pure ES Modules — no CommonJS, no global variables
- Closures for encapsulation instead of classes
- Bitwise floor: `x | 0` (used in hot paths)
- No external libraries or frameworks
- No build tools — keep it directly browser-runnable

### Asset Paths

Always reference assets with paths relative to the project root (e.g., `"assets/sprites/p1.png"`). Do not use absolute paths.

---

## Development Workflow

### Running the Game

Open `index.html` in a browser. Because ES modules require a server context, use a local HTTP server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

### Debug Mode

In `src/main.js`, set `DEBUG = true` to enable:
- On-screen coordinate display
- Extra debug keys:
  - **D** — teleport to `vj_room02` (ending room)
  - **S** — save game
  - **L** — load game

### Adding a New Map

1. Create `src/data/maps/your_map.js` following the map object schema.
2. Register it in `src/maps.js`.
3. Add door entries in the source map that point to your map's spawn points.
4. Provide asset files: background PNG, top-layer PNG, collision PNG.

### Adding a New NPC

1. Create `src/data/npcs/your_npc.js` with the NPC definition.
2. Register it in `src/npcs.js`.
3. Add the NPC ID to the relevant map's `npcs` array.
4. If the NPC has dialog/events, add entries in `src/npc_events.js`.

### Adding a New Item

1. Add the item definition to `src/items.js`.
2. Place pickup spawns in the relevant map data file.

### Modifying the Battle System

Edit `src/battle.js` for logic and `src/battle_ui.js` for rendering. Keep them separate — logic must not call canvas APIs directly.

---

## Critical Rules

1. **Do not break existing systems.** Always read a module fully before modifying it.
2. **Prefer extending over modifying `main.js`.** Add new systems as separate modules and wire them in minimally.
3. **Maintain ES module imports.** Never use `<script>` tags without `type="module"` or require-style imports.
4. **Do not remove existing features** unless explicitly asked.
5. **No build step.** Any code added must work directly in-browser without transpilation (no JSX, no TypeScript, no Babel).
6. **All magic numbers go in `config.js`.** Do not scatter numeric literals.
7. **Output full file contents** when modifying existing files (the project has no patch tooling).

---

## Mobile Considerations

- Canvas renders at 192×180 on mobile (reduced from 256×240) for performance.
- Touch controls are provided by `mobile_controller.js` as a virtual d-pad.
- BGM uses `audio.muted` toggling (not `volume`) due to iOS volume restrictions.
- Sound effects use Web Audio API `AudioContext` to bypass mobile autoplay policy.
- Shrine transitions use a white-flash swap on mobile instead of gradual crossfade to avoid dual-layer draw cost.

---

## Audio

| File | Purpose |
|---|---|
| `bgm0.mp3` | Overworld BGM |
| `bgm_battle.mp3` | Battle BGM |
| `bgm_end.mp3` | Ending credits BGM |
| `duckA-J.mp3` | Duck item audio (plays in inventory) |
| `assets/audio/se/` | Sound effects (cursor, confirm, suzu bell) |

`audio_bgm.js` manages BGM with a single `<audio>` element. `se.js` uses Web Audio API buffers for low-latency SFX.

---

## Save Data Schema

```json
{
  "mapId": "outdoor",
  "leaderX": 120,
  "leaderY": 200,
  "collectedItems": ["duckA", "duckC"],
  "inventory": ["duckA", "duckC"]
}
```

Key: `localStorage.getItem("rpg_save")`
