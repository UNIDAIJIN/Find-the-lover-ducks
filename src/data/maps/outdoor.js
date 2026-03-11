// data/maps/outdoor.js
export const outdoorMap = {
  bgSrc:  "assets/maps/outdoor.png",
  colSrc: "assets/maps/outdoor_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 2358, y: 3106 },
  doors: [
    {
      id:       1,
      to:       "indoor_01",
      trigger:  null, // TODO: set { x, y, w, h } once door position is confirmed in outdoor_col
      entryAt:  null, // TODO: set where player appears in outdoor after exiting indoor
    },
  ],
};
