export const vjFactryMap = {
  bgSrc:  "assets/maps/vj_factry.png",
  colSrc: "assets/maps/vj_factry_col.png",
  bgmSrc: null,
  spawn:  { x: 196, y: 176 },
  doors: [
    {
      id:        35,
      to:        "outdoor",
      trigger:   { x: 201, y: 168, w: 16, h: 8 },
      entryAt:   { x: 201, y: 162 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
