// data/maps/vj_room01.js
export const vjRoom01Map = {
  bgSrc:    "assets/maps/vj_room01.png",
  colSrc:   "assets/maps/vj_room01_col.png",
  bgTopSrc: "assets/maps/vj_room01_top.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 200, y: 160 },
  doors: [
    {
      id:        3,
      to:        "outdoor",
      trigger:   { x: 211, y: 153, w: 16, h: 8 }, // 青いドア底辺中心 (219,157)
      entryAt:   { x: 212, y: 146 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
