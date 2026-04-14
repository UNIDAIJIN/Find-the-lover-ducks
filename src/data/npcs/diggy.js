export const diggyNpc = {
  kind: "npc",
  name: "diggy",
  spriteKey: "diggy",
  x: 124,
  y: 122,
  solid: true,
  animMs: Infinity,
  talkHit: { x: 0, y: 0, w: 16, h: 40 },
  event: {
    type: "item_shop",
    shopName: "DIG IT MORE",
    greeting: [["いらっしゃい。"], ["すぐ隣にワークメンができて、困っちゃうよ。"]],
    byeDialog: [["ありがとよ。"]],
    items: [
      { id: "shovel", name: "スコップ", price: 2000 },
      { id: "pickaxe", name: "ツルハシ", price: 2000 },
    ],
    closeLabel: "やめる",
  },
};
