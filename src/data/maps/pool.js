// data/maps/pool.js
export const poolMap = {
  bgSrc:    "assets/maps/pool.png",
  bgTopSrc: "assets/maps/pool_top.png",
  colSrc:   "assets/maps/pool_col.png",
  bgmSrc:   "assets/audio/bgm0.mp3",
  spawn:    { x: 500, y: 360 }, // TODO: 調整
  doors: [
    {
      id:      2,
      to:      "outdoor",
      trigger: null,   // TODO: ドア前の座標を { x, y, w, h } で設定
      entryAt: null,   // TODO: outdoor でプレイヤーが出現する座標
    },
  ],
};
