export const pubNpc = {
  kind: "npc",
  name: "pub",
  spriteKey: "pub",
  x: 89,
  y: 123,
  talkHit: { x: 0, y: 0, w: 16, h: 21 },
  solid: true,
  noWalk: true,
  animMs: Infinity,
  event: {
    type: "item_shop",
    shopName: "パブ",
    greeting: [["いーらっしゃい。"]],
    byeDialog: [["ありがとうございますん。"]],
    items: [
      { id: "beer", name: "ビール", price: 200 },
      { id: "vodka", name: "ウォッカ", price: 200 },
      { id: "whiskey", name: "ウイスキー", price: 200 },
    ],
    closeLabel: "やめる",
  },
};
