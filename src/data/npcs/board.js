// data/npcs/board.js
// NPC data for the board sign in the outdoor map.
// spriteKey is resolved to a SPRITES reference by npcs.js.

export const boardNpc = {
  kind:      "npc",
  name:      "board",
  spriteKey: "board",
  x:         2151,
  y:         2551,
  talkHit:   { x: 0, y: 0, w: 16, h: 14 },
  talkType:  "sign",
  talkPages: [["モリタサキ・イン・ザ・プールのいえ"]],
  solid:     true,
};
