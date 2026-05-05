export const flowersNpc = {
  kind: "npc",
  name: "flowers",
  spriteKey: "flowers",
  x: 86,
  y: 121,
  talkHit: { x: 0, y: 0, w: 16, h: 21 },
  solid: true,
  noWalk: true,
  animMs: Infinity,
  event: {
    type: "item_shop",
    shopName: "花屋",
    greeting: [["いらっしゃいませ。"]],
    byeDialog: [["ありがとうございました。"]],
    items: [
      { id: "hanataba", name: "はなたば", price: 400 },
    ],
    closeLabel: "やめる",
  },
};
