// data/maps/stair3.js
export const stair3Map = {
  bgSrc:    "assets/maps/stair3.png",
  bgTopSrc: "assets/maps/stair3_top.png",
  bgMidSrc: "assets/maps/stair3_mid.png",
  colSrc:   "assets/maps/stair123_col.png",
  bgmSrc:   null,
  spawn:    { x: 186, y: 48 },
  doors:    [
    {
      id:        12,
      to:        "outdoor",
      trigger:   { x: 186, y: 56, w: 16, h: 8 }, // 底辺中心 (194,60)
      entryAt:   { x: 186, y: 48 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        15,
      to:        "outdoor",
      trigger:   { x: 201, y: 323, w: 16, h: 8 }, // 底辺中心 (209,327)
      entryAt:   { x: 201, y: 315 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],
};
