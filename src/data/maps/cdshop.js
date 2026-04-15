// data/maps/cdshop.js
export const cdshopMap = {
  bgSrc:    "assets/maps/cdshop.png",
  bgTopSrc: "assets/maps/cdshop_top.png",
  colSrc:   "assets/maps/cdshop_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 196, y: 176 },
  doors: [
    {
      id:        38,
      to:        "outdoor",
      trigger:   { x: 201, y: 168, w: 16, h: 8 },
      entryAt:   { x: 201, y: 162 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
