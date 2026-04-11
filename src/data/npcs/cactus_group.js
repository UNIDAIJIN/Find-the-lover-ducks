// data/npcs/cactus_group.js
// (1780, 1567) 周辺に cactus 20体 + cactus_hat 1体（No.7）

const base = {
  kind:    "npc",
  solid:   false, // 当たり判定は col.png に統合済み（14除く）
  talkHit: { x: 0, y: 0, w: 0, h: 0 }, // 会話なし
  animMs:  Infinity,                     // デフォルトは静止（frame 0 = 左向き）
};

// 中心 (1780, 1567) から広めに散らす
const offsets = [
  [ -150,  -80 ], [  -90,  -60 ], [  -30, -100 ], [   40,  -70 ], [  110,  -90 ],
  [  160,  -40 ], [  -60,  200 ], [  -10,  -40 ], [   70,  -10 ], [  130,   30 ],
  [ -140,   20 ], [  -80,   50 ], [   20,   30 ], [   90,   60 ], [  170,   70 ],
  [ -110,   90 ], [  -40,  100 ], [   30,   80 ], [  100,  110 ], [  160,  100 ],
  [ -251,  188 ], [ -284,  273 ], [ -214,  222 ], [   10, -130 ], [   80, -140 ],
  [  200,  -70 ], [  220,   10 ], [ -190,  -30 ], [ -170,   70 ], [  190,   50 ],
  [ -220,  130 ], [ -160,  160 ], [  -70,  150 ], [   50,  140 ], [  130,  160 ],
  [  151,    0 ], [ -100,  200 ], [   10,  220 ], [  110,  210 ], [  289,  -49 ],
];

const CX = 1780;
const CY = 1567;

// No.7 を cactus_hat に、No.14 はサボりイベント持ち
export const cactusNpcs = offsets.map(([ dx, dy ], i) => {
  const npc = {
    ...base,
    name:      i === 7 ? "cactus_hat" : `cactus_${i}`,
    spriteKey: i === 7 ? "cactus_hat" : "cactus",
    x:         CX + dx,
    y:         CY + dy,
  };
  if (i === 7) {
    npc.talkHit = { x: 0, y: 0, w: 16, h: 24 };
    npc.event   = {
      type:      "item_shop",
      shopName:  "サボテンハット",
      greeting:  [["ヘイ！ブロ！ハットかえ！"]],
      byeDialog: [["またな！ブロ！"]],
      items:     [
        { id: "s_hat", name: "サボテンハット", price: 2000 },
        { id: "tacos",  name: "タコス",         price: 200  },
      ],
      closeLabel: "やめる",
    };
  }
  if (i === 14) {
    npc.talkHit = { x: 0, y: 0, w: 16, h: 24 };
    npc.event   = { type: "cactus_14" };
    npc.solid   = true; // col に含まれていないため
  }
  return npc;
});
