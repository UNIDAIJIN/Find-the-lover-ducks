// npcs.js
import { CONFIG } from "./config.js";
import { SPRITES } from "./sprites.js";

import { boardNpc }         from "./data/npcs/board.js";
import { seatsNpc }         from "./data/npcs/seats.js";
import { cat1Npc }          from "./data/npcs/cat1.js";
import { fanFlowerNpc }     from "./data/npcs/fan_flower.js";
import { outdoorMinamiNpc } from "./data/npcs/minami_outdoor.js";
import { saboNpc }          from "./data/npcs/sabo.js";
import { saboHatNpc }       from "./data/npcs/sabo_hat.js";
import { rickyNpc }         from "./data/npcs/ricky.js";
import { oharaNpc }         from "./data/npcs/ohara.js";
import { indoorMinamiNpc } from "./data/npcs/minami_indoor01.js";
import { hisaroNpc }      from "./data/npcs/hisaro.js";
import { natsumiNpc }     from "./data/npcs/natsumi.js";

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
    resolve(outdoorMinamiNpc),
    resolve(saboNpc),
    resolve(saboHatNpc),
    resolve(hisaroNpc),
    resolve(natsumiNpc),
  ],

  indoor_01: [
    resolve(rickyNpc),
    resolve(oharaNpc),
    resolve(indoorMinamiNpc),
  ],
};
