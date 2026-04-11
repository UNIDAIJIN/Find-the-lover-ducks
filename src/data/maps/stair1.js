// data/maps/stair1.js
export const stair1Map = {
  bgSrc:    "assets/maps/stair1.png",
  bgTopSrc: "assets/maps/stair1_top.png",
  bgMidSrc: "assets/maps/stair1_mid.png",
  colSrc:   "assets/maps/stair123_col.png",
  bgmSrc:   null,
  spawn:    { x: 186, y: 48 },
  doors:    [
    {
      id:        10,
      to:        "outdoor",
      trigger:   { x: 186, y: 56, w: 16, h: 8 }, // 底辺中心 (194,60)
      entryAt:   { x: 186, y: 48 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        13,
      to:        "outdoor",
      trigger:   { x: 201, y: 323, w: 16, h: 8 }, // 底辺中心 (209,327)
      entryAt:   { x: 201, y: 315 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],
};
