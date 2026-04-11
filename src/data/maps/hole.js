// data/maps/hole.js
export const holeMap = {
  bgSrc:    "assets/maps/hole.png",
  bgTopSrc: "assets/maps/hole_top.png",
  colSrc:   "assets/maps/hole_col.png",
  bgmSrc:   null,
  spawn:    { x: 110, y: 166 },
  doors: [
    {
      id:        8,
      to:        "outdoor",
      sound:     "zazza",
      trigger:   { x: 78, y: 7, w: 16, h: 12 }, // 中心 (86,13)
      entryAt:   null,
    },
  ],
};
