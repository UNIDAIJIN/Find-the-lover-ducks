// items.js

export const START_INVENTORY = [
  // 最初は空にするなら [] にする
  // テストでAを最初から持たせたいなら下を残す
];

// 表示名
const NAMES = {
  rubber_duck_A: "ラバーダックA",
  rubber_duck_B: "ラバーダックB",
  rubber_duck_C: "ラバーダックC",
  rubber_duck_D: "ラバーダックD",
  rubber_duck_E: "ラバーダックE",
  rubber_duck_F: "ラバーダックF",
  rubber_duck_G: "ラバーダックG",
  rubber_duck_H: "ラバーダックH",
  rubber_duck_I: "ラバーダックI",
  rubber_duck_J: "ラバーダックJ",
};

export function itemName(id){
  return NAMES[id] || id;
}

// 「使うと鳴るBGM」(無ければ null)
const BGMS = {
  rubber_duck_A: "assets/audio/duckA.mp3",
  rubber_duck_B: "assets/audio/duckB.mp3",
  rubber_duck_C: "assets/audio/duckC.mp3",
  rubber_duck_D: "assets/audio/duckD.mp3",
  rubber_duck_E: "assets/audio/duckE.mp3",
  rubber_duck_F: "assets/audio/duckF.mp3",
  rubber_duck_G: "assets/audio/duckG.mp3",
  rubber_duck_H: "assets/audio/duckH.mp3",
  rubber_duck_I: "assets/audio/duckI.mp3",
  rubber_duck_J: "assets/audio/duckJ.mp3",
};

export function itemBgmSrc(id){
  return BGMS[id] || null;
}