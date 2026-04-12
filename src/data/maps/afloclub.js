export const afloclubMap = {
  bgSrc: "assets/maps/afloclub.png",
  bgTopSrc: "assets/maps/afloclub_top.png",
  colSrc: "assets/maps/afloclub_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn: { x: 128, y: 160 },
  doors: [
    {
      id: 32,
      to: "house07",
      trigger: { x: 191, y: 158, w: 16, h: 8 },
      entryAt: { x: 191, y: 148 },
      entryWalk: { dx: -1, dy: 0, frames: 20 },
    },
  ],
};
