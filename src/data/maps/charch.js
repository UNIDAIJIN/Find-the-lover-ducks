// data/maps/charch.js
export const charchMap = {
  bgSrc:    "assets/maps/charch.png",
  bgTopSrc: "assets/maps/charch_top.png",
  colSrc:   "assets/maps/charch_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 112, y: 120 },
  doors: [
    {
      id:        9,
      to:        "outdoor",
      trigger:   { x: 191, y: 189, w: 16, h: 8 }, // 底辺中心 (199, 193)
      entryAt:   { x: 191, y: 177 },
      entryWalk: { dx: 0, dy: -1, frames: 20 },    // 上へ歩いて入場
    },
  ],
};
