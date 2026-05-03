// config.js
// Global configuration for the RPG engine.
// Import this file to avoid hardcoded magic numbers scattered across modules.

export const VERSION = "0.8.0";

export const CONFIG = {
  // ---- Canvas / Display ----
  BASE_W: 256,      // base render width in pixels
  BASE_H: 240,      // base render height in pixels
  SCALE:  3,        // CSS display scale (256×3 = 768px wide)

  // ---- Sprites ----
  SPR: 16,          // sprite tile size in pixels (width and height)

  // ---- Player movement ----
  SPEED:    1,      // pixels moved per frame
  FRAME_MS: 180,    // ms between walk animation frames

  // ---- NPC animation ----
  NPC_FRAME_MS: 360, // ms between NPC animation frames (FRAME_MS × 2)

  // ---- Party followers ----
  GAP2: 30,   // frames behind leader that p2 follows
  GAP3: 60,   // frames behind leader that p3 follows
  GAP4: 90,   // frames behind leader that p4 follows

  // ---- Map / Door transitions ----
  DOOR_COOLDOWN_MS: 220,  // cooldown after entering a door (prevents instant re-trigger)
  MAP_FADE_OUT_MS:  220,  // duration of fade-out when leaving a map
  MAP_FADE_IN_MS:   160,  // duration of fade-in when entering a map
};
