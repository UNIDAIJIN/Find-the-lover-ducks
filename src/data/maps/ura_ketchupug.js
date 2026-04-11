// data/maps/ura_ketchupug.js
export const uraKetchupugMap = {
  bgSrc:    "assets/maps/ura_ketchupug.png",
  bgTopSrc: "assets/maps/ura_ketchupug_top.png",
  colSrc:   "assets/maps/ura_ketchupug_col.png",
  bgmSrc:   null,
  spawn:    { x: 128, y: 160 },
  doors: [
    {
      id:        6,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 }, // moritasaki_room と同じ位置
      entryAt:   { x: 191, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
