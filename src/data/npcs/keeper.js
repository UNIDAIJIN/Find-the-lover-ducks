export const keeperNpc = {
  kind:      "npc",
  id:        "keeper",
  name:      "keeper",
  spriteKey: "keeper",
  x:         1058,
  y:         1927,
  solid:     true,
  animMs:    Infinity,
  talkHit:   { x: -8, y: 0, w: 32, h: 16 },
  event: { type: "keeper_talk" },
};
