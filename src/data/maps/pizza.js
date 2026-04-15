// data/maps/pizza.js
export const pizzaMap = {
  bgSrc:  "assets/maps/pizza.png",
  colSrc: "assets/maps/pizza_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 196, y: 176 },
  doors: [
    {
      id:        37,
      to:        "outdoor",
      trigger:   { x: 201, y: 168, w: 16, h: 8 },
      entryAt:   { x: 201, y: 162 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
