// data/maps/stair2.js
export const stair2Map = {
  bgSrc:    "assets/maps/stair2.png",
  bgTopSrc: "assets/maps/stair2_top.png",
  bgMidSrc: "assets/maps/stair2_mid.png",
  colSrc:   "assets/maps/stair123_col.png",
  bgmSrc:   null,
  spawn:    { x: 186, y: 48 },
  doors:    [
    {
      id:        11,
      to:        "outdoor",
      trigger:   { x: 186, y: 56, w: 16, h: 8 }, // 底辺中心 (194,60)
      entryAt:   { x: 186, y: 48 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        14,
      to:        "outdoor",
      trigger:   { x: 201, y: 323, w: 16, h: 8 }, // 底辺中心 (209,327)
      entryAt:   { x: 201, y: 315 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],
};
