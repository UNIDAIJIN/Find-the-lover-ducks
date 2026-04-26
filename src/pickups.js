// pickups.js
// 「マップに置く取得物」のデータだけ置く

export const PICKUPS_BY_MAP = {
  outdoor: [
    // 10体を横一列で並べる例（座標は後で微調整）
    { itemId: "rubber_duck_A", x: 2029, y: 2457 },
    { itemId: "rubber_duck_E", x: 1618, y: 1276 },
    { itemId: "rubber_duck_H", x: 2422, y: 659 },
    { itemId: "rubber_duck_J", x: 2594, y: 186 },
  ],
  inn: [
    { itemId: "rubber_duck_D", x: 133, y: 123, requireFlag: "innDuckSpawned" },
  ],
  seahole: [
    { itemId: "rubber_duck_F", x: 120, y: 156 },
  ],
  pool: [
    { itemId: "rubber_duck_I", x: 151, y: 293 },
  ],
  charch: [
    { itemId: "rubber_duck_B", x: 192, y: 127, talkHit: { x: 0, y: 0, w: 16, h: 30 } },
  ],
  space: [
    { itemId: "moon_stone", x: 1920, y: 126 },
  ],
  mirai: [
    { itemId: "iron_heart", x: 2638, y: 152 },
  ],
};
