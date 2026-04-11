export const dSwordOnNpc = {
  kind:      "npc",
  name:      "d_sword_on",
  spriteKey: "d_sword_on",
  x:         58,
  y:         160,
  solid:     true,
  animMs:    Infinity,
  talkHit:   { x: -16, y: 0, w: 48, h: 16 },
  event: {
    type:     "d_sword_give",
    giveItem: "densetsu_no_ken",
  },
};
