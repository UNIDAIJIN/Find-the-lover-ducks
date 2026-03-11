// data/maps/pool.js
export const poolMap = {
  bgSrc:    "assets/maps/pool.png",
  bgTopSrc: "assets/maps/pool_top.png",
  colSrc:   "assets/maps/pool_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 640, y: 317 },
  doors: [
    {
      id:        2,
      to:        "outdoor",
      trigger:   { x: 644, y: 326, w: 16, h: 8 },
      entryAt:   { x: 640, y: 317 },
      entryWalk: { dx: -1, dy: 0, frames: 20 }, // 入場後20フレーム左に自動歩行
    },
  ],
};
