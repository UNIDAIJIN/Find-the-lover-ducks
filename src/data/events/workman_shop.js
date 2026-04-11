// data/events/workman_shop.js
export const workmanShopEvent = {
  type:      "item_shop",
  shopName:  "ワークメン",
  greeting:  [["いつもにこにこ、ワークメンです!"]],
  question:  "なににしますか？",
  items: [
    { id: "gunter",  name: "ぐんて",     price: 450  },
    { id: "helmet",  name: "ヘルメット", price: 1780 },
  ],
  closeLabel: "やめる",
  byeDialog:  [["またどうぞ!!"]],
};
