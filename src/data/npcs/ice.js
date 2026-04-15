export const iceNpc = {
  kind:      "npc",
  name:      "ice",
  spriteKey: "ice",
  x:         1680,
  y:         1530,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "ICE POPS",
    greeting:  [["いらっしゃーい。"]],
    byeDialog: [["たのしんでねー！"]],
    items: [
      { id: "ice_cream", name: "アイスクリーム", price: 200 },
    ],
    closeLabel: "やめる",
  },
};
