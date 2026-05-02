export const beerNpc = {
  kind:      "npc",
  name:      "beer",
  spriteKey: "beer",
  x:         1278,
  y:         1962,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "夏侍",
    greeting:  [["いっとけーーー！"]],
    byeDialog: [["よーし！"]],
    items: [
      { id: "beer", name: "ビール", price: 200 },
    ],
    closeLabel: "やめる",
  },
};
