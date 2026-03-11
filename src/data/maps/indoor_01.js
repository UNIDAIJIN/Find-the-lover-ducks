// data/maps/indoor_01.js
export const indoor01Map = {
  bgSrc:  "assets/maps/indoor_01.png",
  colSrc: "assets/maps/indoor_01_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 206, y: 151 },
  doors: [
    {
      id:      1,
      to:      "outdoor",
      trigger: { x: 208, y: 130, w: 16, h: 12 }, // around col marker (216,136)
      entryAt: { x: 206, y: 151 },               // where player appears when entering from outdoor
    },
  ],
};
