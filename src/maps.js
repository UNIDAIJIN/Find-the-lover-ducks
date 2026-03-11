// maps.js
// マップ定義を一元管理する
import { outdoorMap }  from "./data/maps/outdoor.js";
import { indoor01Map } from "./data/maps/indoor_01.js";
import { poolMap }     from "./data/maps/pool.js";

// ---- util: ダミー画像（1px） ----
const BLACK_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP8z8AAAAMBAQAYk7kAAAAASUVORK5CYII=";

const CLEAR_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2XcAAAAASUVORK5CYII=";

// ---- MAPS ----
export const MAPS = {
  // ===== フィールド =====
  outdoor: outdoorMap,

  // ===== 室内 =====
  indoor_01: indoor01Map,
  pool:      poolMap,

  // ===== 戦闘（黒画面） =====
  // ・当たり判定なし
  // ・描画は main.js 側で上書きする前提
  battle_01: {
    bgSrc: BLACK_1PX,
    colSrc: CLEAR_1PX,
    bgmSrc: "assets/audio/bgm0.mp3", // とりあえず共通
  },
};

