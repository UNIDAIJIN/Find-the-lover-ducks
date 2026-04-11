// data/events/hisaro_sunlover.js
// Event data for the hisaro_sunlover interaction.
// The logic that reads these values lives in npc_events.js.

export const hisaroSunloverEvent = {
  type:      "hisaro_sunlover",
  lines:     ["ここは日サロ「サン・ラヴァー」さ。", "きみもやいてくかい？"],
  options:   ["はい", "いいえ"],
  fadeOutMs: 350,
  holdMs:    3000,
  fadeInMs:  350,
  partySkin: "t2",
  onYesDialog:     [["いいじゃないか。", "にあっているぜ。"]],
  onYesFinalPages: [["よし、じゃあしばらく", "そこでそうしていな。"]],
  onNoDialog:      [["おまえたちみたいなもやしにはおにあいさ。"]],
};
