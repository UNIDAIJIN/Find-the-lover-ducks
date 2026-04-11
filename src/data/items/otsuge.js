// data/items/otsuge.js
// お告げの書 1-30: 読むとそれぞれクエスト 1-30 の達成条件が記されている。
// 消費されず何度でも読める。
export const otsugeItems = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  const id2 = String(n).padStart(2, "0");
  return {
    id:       `otsuge_${id2}`,
    name:     `お告げの書${n}`,
    bgmSrc:   null,
    throwDmg: 1,
  };
});
