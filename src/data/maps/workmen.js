// data/maps/workmen.js
export const workmenMap = {
  bgSrc:  "assets/maps/workmen.png",
  bgTopSrc: "assets/maps/workmen_top.png",
  colSrc: "assets/maps/workmen_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 128, y: 160 },
  doors: [
    {
      id:        17,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 },
      entryAt:   { x: 191, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
