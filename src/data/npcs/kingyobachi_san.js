// data/npcs/kingyobachi_san.js

export const kingyobachiSanNpc = {
  kind:        "npc",
  name:        "kingyobachi_san",
  spriteKey:   "kingyobachi_san",
  spr:         16,
  sprH:        32,
  x:           1246,
  y:           2573,
  talkHit:     { x: 0, y: 0, w: 16, h: 16 },
  solid:       true,
  showWhenBgm: "assets/audio/duckI.mp3",
  event:       { type: "kingyobachi_san_give", giveItem: "kingyobachi" },
};
