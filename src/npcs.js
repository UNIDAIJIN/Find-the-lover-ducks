// npcs.js
import { CONFIG } from "./config.js";
import { SPRITES } from "./sprites.js";

import { boardNpc }         from "./data/npcs/board.js";
import { seatsNpc }         from "./data/npcs/seats.js";
import { cat1Npc }          from "./data/npcs/cat1.js";
import { fanFlowerNpc }     from "./data/npcs/fan_flower.js";
import { saboNpc }          from "./data/npcs/sabo.js";
import { saboHatNpc }       from "./data/npcs/sabo_hat.js";
import { rickyNpc }         from "./data/npcs/ricky.js";
import { oharaNpc }         from "./data/npcs/ohara.js";
import { indoorMinamiNpc } from "./data/npcs/minami_indoor01.js";
import { hisaroNpc }      from "./data/npcs/hisaro.js";
import { vjRoom01MinamiNpc }   from "./data/npcs/minami_vj_room01.js";
import { redDoorVjRoom01Npc } from "./data/npcs/red_door_vj_room01.js";
import { natsumiRoom02Npc, rikuRoom02Npc, makiRoom02Npc, ninoRoom02Npc } from "./data/npcs/vj_room02_npcs.js";

const { NPC_FRAME_MS } = CONFIG;

// Resolve a data NPC (spriteKey: string) into a runtime NPC (img: HTMLImageElement).
function resolve(def) {
  const { spriteKey, ...rest } = def;
  return { ...rest, img: SPRITES[spriteKey], animMs: NPC_FRAME_MS };
}

export const NPCS_BY_MAP = {
  outdoor: [
    resolve(boardNpc),
    resolve(seatsNpc),
    resolve(cat1Npc),
    resolve(fanFlowerNpc),
    resolve(saboNpc),
    resolve(saboHatNpc),
    resolve(hisaroNpc),
  ],

  vj_room01: [
    resolve(vjRoom01MinamiNpc),
    resolve(redDoorVjRoom01Npc),
  ],

  vj_room02: [
    resolve(natsumiRoom02Npc),
    resolve(rikuRoom02Npc),
    resolve(makiRoom02Npc),
    resolve(ninoRoom02Npc),
  ],

  indoor_01: [
    resolve(rickyNpc),
    resolve(oharaNpc),
    resolve(indoorMinamiNpc),
  ],
};
