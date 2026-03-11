// maps.js
// マップ定義を一元管理する

// ---- util: ダミー画像（1px） ----
const BLACK_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP8z8AAAAMBAQAYk7kAAAAASUVORK5CYII=";

const CLEAR_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2XcAAAAASUVORK5CYII=";

// ---- MAPS ----
export const MAPS = {
  // ===== フィールド =====
  outdoor: {
    bgSrc: "assets/maps/outdoor.png",
    colSrc: "assets/maps/outdoor_col.png",
    bgmSrc: "assets/audio/bgm0.mp3",
  },

  // ===== 室内 =====
  indoor_01: {
    bgSrc: "assets/maps/indoor_01.png",
    colSrc: "assets/maps/indoor_01_col.png",
    bgmSrc: "assets/audio/bgm0.mp3",
  },

  // ===== 戦闘（黒画面） =====
  // ・当たり判定なし
  // ・描画は main.js 側で上書きする前提
  battle_01: {
    bgSrc: BLACK_1PX,
    colSrc: CLEAR_1PX,
    bgmSrc: "assets/audio/bgm0.mp3", // とりあえず共通
  },
};

// ---- ドア対応表（outdoor → indoor） ----
export const DOOR_ID_TO_INDOOR = {
  1: "indoor_01",
};