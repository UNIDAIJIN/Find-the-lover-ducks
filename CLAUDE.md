# CLAUDE.md — Game Project

## Running the project

This is a static HTML5 Canvas game with no build step.

```bash
# Serve locally (any static file server works)
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. Append `?m` for mobile controller.

Debug mode is always on (`DEBUG = true` in `src/main.js`).

---

## Architecture

- **Canvas**: 256×240px logical, 3× CSS scale. Game area is 192×180, title/select/ending use full 256×240.
- **ES Modules**: No bundler. All imports are native `import`/`export`.
- **Entry point**: `index.html` → `src/main.js`
- **Data-driven**: NPC/map/event/item definitions live in `src/data/` subfolders.
- **Registry pattern**: `src/registry.js` wires up systems; `main.js` destructures from `REGISTRY`.

### Key files

| File | Role |
|---|---|
| `src/main.js` | Game loop, scene management, door transitions |
| `src/state.js` | Global mutable game state |
| `src/maps.js` | Map definitions list |
| `src/col.js` | Collision store (alpha-based: opaque = wall) |
| `src/registry.js` | System factory registry |
| `src/data/maps/*.js` | Per-map data: tiles, doors, NPCs, pickups |
| `src/data/npcs/*.js` | NPC definitions |
| `src/data/events/*.js` | Event scripts |

### Collision system

`col.png` / `*_col.png`: **opaque pixel = wall, transparent = walkable** (alpha-based, not color-based).

---

## Door pattern

<important if="implementing or modifying doors">

### Data structure

```js
// In the source map's doors[]
{
  id:        N,
  to:        "target_map",
  trigger:   { x, y, w: 16, h: 8 }, // based on threshold bottom-center
  entryAt:   { x, y },               // spawn position when returning to this map
  entryWalk: { dx, dy, frames: 20 }, // auto-walk direction after entry
}
```

### Coordinate rules

- **trigger**: threshold bottom-center (cx, cy) → `{ x: cx-8, y: cy-4, w: 16, h: 8 }`
- **entryAt** from bottom-center (cx, cy):

| Direction | entryWalk | entryAt |
|---|---|---|
| Down | `{ dx:0, dy:1 }` | `{ x: cx-8, y: cy-12 }` |
| Left | `{ dx:-1, dy:0 }` | `{ x: cx-8, y: cy-10 }` |
| Right | `{ dx:1, dy:0 }` | `{ x: cx+8, y: cy-10 }` |

Treat these as starting values; a few pixels of fine-tuning is normal.

Both sides of a door must be updated together (source map and target map).

### ID matching rule

**Both sides of a door pair must have the same `id`.** When transitioning A→B, the engine passes `doorId: door.id` (from map A) and looks for a door with that same `id` in map B to find `entryAt`. If the IDs don't match, it falls back to `spawn` and the player appears at the wrong position.

```js
// outdoor.js
{ id: 33, to: "inugoya", ... }

// inugoya.js — must also be id: 33
{ id: 33, to: "outdoor", ... }
```

</important>

---

## Code conventions

- **No bundler, no TypeScript**: Plain JS ES modules only.
- **Data files export a single constant** (e.g. `export const OUTDOOR = { ... }`).
- **NPC events** are async generator functions in `src/data/events/`.
- **Audio**: BGM is lazy-loaded after first user interaction (`src/audio_bgm.js`). SE functions are in `src/se.js`.
- **No external dependencies** except `qr-creator.min.js` (bundled locally).
- Don't add comments unless the logic is non-obvious. Don't add JSDoc.

---

## Git conventions

- Commit messages in English, concise imperative style (e.g. `Add pool map doors`).
- Keep PRs/commits small and focused — one feature or fix per commit.
- Commit as soon as a discrete task is done; don't batch unrelated changes.
- Push immediately when asked.

---

## What to avoid

- Don't introduce a build step, bundler, or transpiler.
- Don't add error handling for impossible cases (trust internal state).
- Don't add features beyond what was asked.
- Don't write new files when editing an existing one suffices.

---

## Future note

- Next performance task candidate: split `outdoor` into multiple area maps for mobile.
- Preferred workflow: user provides a same-size guide PNG for `outdoor` with area regions clearly marked.
- Best format for the guide PNG: transparent background + solid color-filled regions per area, no antialiasing.
- Goal: keep all gameplay coordinates in the current global `outdoor` world space, and treat each split map as a viewport/segment with its own cropped `bg` / `mid` / `top` / `shrine` / `shrine_top` / `col`.
- Desired result: generate split assets and segment definitions without manually reauthoring every NPC / trigger / door coordinate.
