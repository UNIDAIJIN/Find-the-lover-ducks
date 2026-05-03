export const sarferNpc = {
  kind:      "npc",
  name:      "sarfer",
  spriteKey: "sarfer",
  x:         1308,
  y:         1932,
  talkHit:   { x: 0, y: 0, w: 32, h: 26 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "ビッグウェーブ",
    greeting:  [["ヨォ！よってけよ！"]],
    byeDialog: [["またな！"]],
    items: [
      { id: "yakisoba", name: "やきそば", price: 200 },
    ],
    closeLabel: "やめる",
  },
};
