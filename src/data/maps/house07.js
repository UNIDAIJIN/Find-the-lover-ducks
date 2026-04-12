// data/maps/house07.js
export const house07Map = {
  bgSrc:  "assets/maps/house07.png",
  colSrc: "assets/maps/house07_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 128, y: 160 },
  doors: [
    {
      id:        32,
      to:        "afloclub",
      trigger:   { x: 122, y: 126, w: 16, h: 8 },
      entryAt:   { x: 122, y: 120 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        24,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 }, // 底辺中心 (199,162)
      entryAt:   { x: 191, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
