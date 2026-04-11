export const inugoyaMap = {
  bgSrc:  "assets/maps/inugoya.png",
  colSrc: "assets/maps/inugoya_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 120, y: 120 },
  doors: [
    {
      id:        33,
      to:        "outdoor",
      trigger:   { x: 120, y: 149, w: 16, h: 8 }, // 底辺中心 (128,151)
      entryAt:   { x: 120, y: 135 },
      entryWalk: { dx: 0, dy: 0, frames: 0 },
    },
  ],
};
