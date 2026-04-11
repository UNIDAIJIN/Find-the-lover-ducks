// data/maps/inn.js
export const innMap = {
  bgSrc:    "assets/maps/inn.png",
  bgTopSrc: "assets/maps/inn_top.png",
  colSrc:   "assets/maps/inn_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 100, y: 130 },
  doors: [
    {
      id:        5,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 }, // moritasaki_room と同じ
      entryAt:   { x: 191, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
