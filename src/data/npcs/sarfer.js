export const sarferNpc = {
  kind:      "npc",
  name:      "sarfer",
  spriteKey: "sarfer",
  x:         1308,
  y:         1932,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "ビッグウェーブヌードル",
    greeting:  [["いらっしゃーい。"]],
    byeDialog: [["たのしんでねー！"]],
    items: [
      { id: "yakisoba", name: "やきそば", price: 200 },
    ],
    closeLabel: "やめる",
  },
};
