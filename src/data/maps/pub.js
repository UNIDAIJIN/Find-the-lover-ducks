// data/maps/pub.js
// bg: 256×240。moritasaki_room と同じ配置
export const pubMap = {
  bgSrc:  "assets/maps/pub.png",
  colSrc: "assets/maps/pub_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 128, y: 160 },
  doors: [
    {
      id:        40,
      to:        "outdoor",
      trigger:   { x: 89, y: 188, w: 16, h: 8 }, // 底辺中心 (97,192)
      entryAt:   { x: 89, y: 176 },
      entryWalk: { dx: 0, dy: -1, frames: 20 },
    },
  ],
};
