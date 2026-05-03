export const iceNpc = {
  kind:      "npc",
  name:      "ice",
  spriteKey: "ice",
  x:         1672,
  y:         1519,
  talkHit:   { x: 0, y: 0, w: 32, h: 26 },
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
