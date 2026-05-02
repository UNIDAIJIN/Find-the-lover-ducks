export const lovesongNpc = {
  kind:      "npc",
  name:      "lovesong",
  spriteKey: "lovesong",
  x:         493,
  y:         1775,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  talkPages: [
    ["わがはいはねこである。"],
    ["なまえはラブソング。"],
  ],
  event: {
    type: "love_song",
    snackItem: "love_song_snack",
  },
  solid:     true,
};
