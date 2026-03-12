// data/npcs/board.js
// NPC data for the board sign in the outdoor map.
// spriteKey is resolved to a SPRITES reference by npcs.js.

export const boardNpc = {
  kind:      "npc",
  name:      "board",
  spriteKey: "board",
  x:         2689,
  y:         3352,
  talkHit:   { x: 0, y: 0, w: 16, h: 14 },
  talkType:  "sign",
  talkPages: [["ここは モリタサキイン・ザ・プールの いえ"]],
  solid:     true,
};
