export const furoMMap = {
  bgSrc:  "assets/maps/furo_m.png",
  colSrc: "assets/maps/furo_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 191, y: 152 },
  doors: [
    {
      id:        44,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 },
      spawnAt:   { x: 1776, y: 838 },
      preFadeInWalk: { dx: -1, dy: 0, frames: 90 },
      fadeOutMs: 620,
      fadeInMs:  720,
    },
    {
      id:      144,
      action:  "furo_soak",
      trigger: { x: 51, y: 158, w: 16, h: 8 },
    },
  ],
};
