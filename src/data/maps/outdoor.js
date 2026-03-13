// data/maps/outdoor.js
export const outdoorMap = {
  bgSrc:  "assets/maps/outdoor.png",
  colSrc: "assets/maps/outdoor_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 2358, y: 3106 },
  doors: [
    {
      id:      1,
      to:      "indoor_01",
      trigger: null, // TODO: outdoor → indoor_01 のドア位置未設定
      entryAt: null, // TODO: indoor_01 から戻ったときの出現位置
    },
    {
      id:        2,
      to:        "pool",
      trigger:   { x: 1957, y: 3236, w: 16, h: 8 }, // 底辺中心 (1965,3240)
      entryAt:   { x: 1955, y: 3230 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
    {
      id:        3,
      to:        "vj_room01",
      trigger:   { x: 2411, y: 2155, w: 16, h: 8 }, // 中心 (2419,2159)
      entryAt:   { x: 2412, y: 2144 },
      entryWalk: { dx: 0, dy: 1, frames: 20 },
    },
  ],
};
