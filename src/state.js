// state.js
// Runtime state of the game field.
// Stores the mutable objects that represent the current world state.
//
// Note: mapReady, actors, and doorCooldown are primitive/array values that get
// fully reassigned at runtime, so they remain as local `let` variables in main.js.
// Everything here is an object or Set — safe to destructure and mutate in place.

export const STATE = {

  // ---- Current map ----
  current: {
    id: "outdoor",
    bgW: 0,
    bgH: 0,
    markers: {
      spawn: null,
      outdoorDoor: new Map(),
      indoorDoor:  new Map(),
      indoorEntry: new Map(),
    },
  },

  // ---- Camera ----
  cam: { x: 0, y: 0 },

  // ---- Party (img references are set by main.js after sprites load) ----
  leader: { x: 0, y: 0, frame: 0, last: 0, dir: { x: 0, y: 1 }, img: null },
  p2:     { x: 0, y: 0, frame: 0, last: 0, img: null },
  p3:     { x: 0, y: 0, frame: 0, last: 0, img: null },
  p4:     { x: 0, y: 0, frame: 0, last: 0, img: null },

  // ---- Persistent field state ----
  collectedItems: new Set(), // item IDs collected across map transitions
};
