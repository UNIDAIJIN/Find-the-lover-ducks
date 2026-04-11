export const pbdNpc = {
  kind:      "npc",
  name:      "pbd",
  spriteKey: "pbd",
  x:         120,
  y:         115,
  talkHit:   { x: 0, y: 0, w: 16, h: 24 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "ワンダフルワン",
    greeting:  [["ワン！"]],
    byeDialog: [["ハッ、ハッ、"]],
    items: [
      { id: "afro", name: "アフロセット", price: 2000 },
      { id: "hone", name: "ほね",         price: 100  },
    ],
    closeLabel: "やめる",
  },
};
