// data/maps/pool.js
export const poolMap = {
  bgSrc:    "assets/maps/pool.png",
  bgTopSrc: "assets/maps/pool_top.png",
  colSrc:   "assets/maps/pool_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 638, y: 336 },
  doors: [
    {
      id:      2,
      to:      "outdoor",
      trigger: { x: 644, y: 326, w: 16, h: 8 },
      entryAt: { x: 638, y: 336 }, // outdoor から入ったときの出現位置（ドアのすぐ内側）
    },
  ],
};
