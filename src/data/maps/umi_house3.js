// data/maps/umi_house3.js
export const umiHouse3Map = {
  bgSrc:  "assets/maps/umi-house3.png",
  colSrc: "assets/maps/umi-house3_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 128, y: 160 },
  doors: [
    {
      id:        31,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 }, // 底辺中心 (199,162)
      entryAt:   { x: 191, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
