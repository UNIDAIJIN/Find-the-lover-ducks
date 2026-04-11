// maps.js
// マップ定義を一元管理する
import { outdoorMap }         from "./data/maps/outdoor.js";
import { indoor01Map }        from "./data/maps/indoor_01.js";
import { poolMap }            from "./data/maps/pool.js";
import { vjRoom01Map }        from "./data/maps/vj_room01.js";
import { vjRoom02Map }        from "./data/maps/vj_room02.js";
import { moritasakiRoomMap }  from "./data/maps/moritasaki_room.js";
import { holeMap }            from "./data/maps/hole.js";
import { innMap }             from "./data/maps/inn.js";
import { seaholeMap }         from "./data/maps/seahole.js";
import { uraKetchupugMap }    from "./data/maps/ura_ketchupug.js";
import { charchMap }          from "./data/maps/charch.js";
import { stair1Map }          from "./data/maps/stair1.js";
import { stair2Map }          from "./data/maps/stair2.js";
import { stair3Map }          from "./data/maps/stair3.js";
import { hisaroMap }          from "./data/maps/hisaro.js";
import { workmenMap }         from "./data/maps/workmen.js";
import { house01Map }         from "./data/maps/house01.js";
import { house02Map }         from "./data/maps/house02.js";
import { house03Map }         from "./data/maps/house03.js";
import { house04Map }         from "./data/maps/house04.js";
import { house05Map }         from "./data/maps/house05.js";
import { house06Map }         from "./data/maps/house06.js";
import { house07Map }         from "./data/maps/house07.js";
import { house08Map }         from "./data/maps/house08.js";
import { house09Map }         from "./data/maps/house09.js";
import { house10Map }         from "./data/maps/house10.js";
import { house11Map }         from "./data/maps/house11.js";
import { umiHouse1Map }       from "./data/maps/umi_house1.js";
import { umiHouse2Map }       from "./data/maps/umi_house2.js";
import { umiHouse3Map }       from "./data/maps/umi_house3.js";
import { dHoleMap }           from "./data/maps/d_hole.js";
import { inugoyaMap }         from "./data/maps/inugoya.js";

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
  moritasaki_room: moritasakiRoomMap,
  hole:            holeMap,
  inn:             innMap,
  seahole:         seaholeMap,
  ura_ketchupug:   uraKetchupugMap,
  charch:          charchMap,
  stair1:    stair1Map,
  stair2:    stair2Map,
  stair3:    stair3Map,
  hisaro:    hisaroMap,
  workmen:   workmenMap,
  house01:   house01Map,
  house02:   house02Map,
  house03:   house03Map,
  house04:   house04Map,
  house05:   house05Map,
  house06:   house06Map,
  house07:   house07Map,
  house08:   house08Map,
  house09:   house09Map,
  house10:   house10Map,
  house11:   house11Map,
  umi_house1: umiHouse1Map,
  umi_house2: umiHouse2Map,
  umi_house3: umiHouse3Map,
  d_hole:     dHoleMap,
  inugoya:    inugoyaMap,
  indoor_01: indoor01Map,
  pool:      poolMap,
  vj_room01: vjRoom01Map,
  vj_room02: vjRoom02Map,

  // ===== 戦闘（黒画面） =====
  // ・当たり判定なし
  // ・描画は main.js 側で上書きする前提
  battle_01: {
    bgSrc: BLACK_1PX,
    colSrc: CLEAR_1PX,
    bgmSrc: "assets/audio/bgm0.mp3", // とりあえず共通
  },
};

