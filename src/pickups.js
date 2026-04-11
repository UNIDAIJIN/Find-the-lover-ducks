// pickups.js
// 「マップに置く取得物」のデータだけ置く

export const PICKUPS_BY_MAP = {
  outdoor: [
    // 10体を横一列で並べる例（座標は後で微調整）
    { itemId: "rubber_duck_A", x: 2567,  y: 3258 },
    { itemId: "rubber_duck_E", x: 2156, y: 2077 },
    { itemId: "rubber_duck_H", x: 2960, y: 1460 },
    { itemId: "rubber_duck_J", x: 3132, y:  987 },
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
    { itemId: "rubber_duck_B", x: 192, y: 127 },
  ],
};