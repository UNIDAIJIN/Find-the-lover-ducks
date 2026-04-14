export const digitmoreMap = {
  bgSrc: "assets/maps/digitmore.png",
  colSrc: "assets/maps/digitmore_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn: { x: 196, y: 176 },
  doors: [
    {
      id:        36,
      to:        "outdoor",
      trigger:   { x: 201, y: 168, w: 16, h: 8 },
      entryAt:   { x: 201, y: 162 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
