// data/npcs/gate.js

export const gateNpc = {
  kind:      "npc",
  name:      "gate",
  spriteKey: "gate",
  x:         2140,
  y:         1455,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  talkType:       "sign",
  talkPages:      [[""]],
  solid:          true,
  showWhenBgm:    "assets/audio/duckJ.mp3",
  shootingTrigger: true,
};
