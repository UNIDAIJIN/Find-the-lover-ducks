export const shamanNpc = {
  kind:      "npc",
  name:      "shaman",
  spriteKey: "shaman",
  x:         120,
  y:         160,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  solid:     true,
  event: {
    type:      "item_shop",
    shopName:  "シャーマン堂",
    greeting:  [["……"]],
    byeDialog: [["……"]],
    items: Array.from({ length: 30 }, (_, i) => {
      const n = i + 1;
      return { id: `otsuge_${String(n).padStart(2, "0")}`, name: `お告げの書${n}`, price: 1000 };
    }),
    closeLabel: "やめる",
  },
};
