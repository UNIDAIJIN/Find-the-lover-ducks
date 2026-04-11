// data/maps/d_hole.js
export const dHoleMap = {
  bgSrc:  "assets/maps/d-hole.png",
  colSrc: "assets/maps/d-hole_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 128, y: 160 },
  doors: [
    {
      id:        32,
      to:        "outdoor",
      trigger:   { x: 223, y: 168, w: 16, h: 8 }, // 底辺中心 (231,172)
      entryAt:   { x: 207, y: 160 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
