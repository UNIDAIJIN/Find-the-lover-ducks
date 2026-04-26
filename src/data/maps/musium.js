// data/maps/musium.js
// bg: 400×240。出入口は moritasaki_room と同じ右端からのオフセット (49px)
export const musiumMap = {
  bgSrc:  "assets/maps/musium.png",
  colSrc: "assets/maps/musium_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 200, y: 160 },
  doors: [
    {
      id:        39,
      to:        "outdoor",
      trigger:   { x: 335, y: 158, w: 16, h: 8 },
      entryAt:   { x: 335, y: 152 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
