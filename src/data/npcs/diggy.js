export const diggyNpc = {
  kind: "npc",
  name: "diggy",
  spriteKey: "diggy",
  x: 124,
  y: 122,
  solid: true,
  talkHit: { x: 0, y: 0, w: 16, h: 40 },
  event: {
    type: "item_shop",
    shopName: "DIG IT MORE",
    greeting: [
      ["いらっしゃい。"],
      ["すぐ隣にワークメンができて、困っちゃうよ。"],
      ["まったく、人間ってやつはなんでも便利になればいいと思ってやがる。"],
      ["ロマンがねーよな、ロマンが。"],
      ["その点、俺たちカッパはよーくわかってるぜ。そういうとこ。"],
    ],
    repeatGreeting: [["お前らか、いらっしゃい。"]],
    byeDialog: [["ありがとよ。"]],
    items: [
      { id: "shovel", name: "スコップ", price: 2000 },
      { id: "pickaxe", name: "ツルハシ", price: 2000 },
    ],
    closeLabel: "やめる",
  },
};
