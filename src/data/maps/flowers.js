// data/maps/flowers.js
export const flowersMap = {
  bgSrc:    "assets/maps/flowers.png",
  bgTopSrc: "assets/maps/flowers_top.png",
  colSrc:   "assets/maps/flowers_col.png",
  bgmSrc: "assets/audio/bgm0.mp3",
  spawn:  { x: 117, y: 142 },
  doors: [
    {
      id:        41,
      to:        "outdoor",
      trigger:   { x: 191, y: 158, w: 16, h: 8 }, // 底辺中心 (199,162) 基準
      entryAt:   { x: 191, y: 152 },               // outdoor から戻ったとき出現位置
      entryWalk: { dx: -1, dy: 0, frames: 20 },    // 左へ20フレーム自動歩行
    },
  ],
};
