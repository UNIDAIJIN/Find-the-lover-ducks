// data/npcs/careful.js
export const carefulNpc = {
  kind:      "npc",
  name:      "careful",
  spriteKey: "careful",
  spr:       16,
  sprH:      32,
  x:         3186,
  y:         1005,
  talkHit:   { x: 2, y: 6, w: 12, h: 26 },
  solid:     true,
  frame:     0,
  animMs:    Infinity,
  event:     { type: "careful_letterbox" },
};
