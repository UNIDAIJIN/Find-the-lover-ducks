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
import { indoorMinamiNpc }  from "./data/npcs/minami_indoor01.js";

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

    // ★ hisaro（event構造が複雑なため未データ化）
    {
      kind: "npc",
      id: "hisaro",
      name: "hisaro",
      x: 2418,
      y: 3191,
      img: SPRITES.hisaro,
      solid: true,
      talkHit: { x: 0, y: 0, w: 16, h: 16 },
      animMs: 360,
      event: {
        type: "hisaro_sunlover",
        lines: ["ここは ひサロ サン・ラヴァー さ。", "きみも やいていくかい？"],
        options: ["はい", "いいえ"],
        fadeOutMs: 350,
        holdMs: 3000,
        fadeInMs: 350,
        partySkin: "t2",
        onYesDialog: [["いいじゃないか。", "にあっているぜ。"]],
        onNoDialog: [["おまえたちみたいな", "もやしには おにあいさ。"]],
      },
    },
  ],

  indoor_01: [
    resolve(rickyNpc),
    resolve(oharaNpc),
    resolve(indoorMinamiNpc),
  ],
};
