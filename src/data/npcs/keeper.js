export const keeperNpc = {
  kind:      "npc",
  id:        "keeper",
  name:      "keeper",
  spriteKey: "keeper",
  x:         1596,
  y:         2728,
  solid:     true,
  animMs:    Infinity,
  talkHit:   { x: -8, y: 0, w: 32, h: 16 },
  event: { type: "keeper_talk" },
};
