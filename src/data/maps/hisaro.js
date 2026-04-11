// data/maps/hisaro.js
export const hisaroMap = {
  bgSrc:    "assets/maps/hisaro.png",
  bgTopSrc: "assets/maps/hisaro_top.png",
  colSrc:   "assets/maps/hisaro_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 128, y: 160 },
  doors: [
    {
      id:        16,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 },
      entryAt:   { x: 191, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
