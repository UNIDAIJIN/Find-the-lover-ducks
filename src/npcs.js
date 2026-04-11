// npcs.js
import { CONFIG } from "./config.js";
import { SPRITES } from "./sprites.js";

import { boardNpc }         from "./data/npcs/board.js";
import { fanNpc }           from "./data/npcs/fan.js";
import { koriNpc }          from "./data/npcs/kori.js";
import { seatsNpc }         from "./data/npcs/seats.js";
import { cat1Npc }          from "./data/npcs/cat1.js";
import { fanFlowerNpc }     from "./data/npcs/fan_flower.js";
import { rickyNpc }         from "./data/npcs/ricky.js";
import { oharaNpc }         from "./data/npcs/ohara.js";
import { indoorMinamiNpc } from "./data/npcs/minami_indoor01.js";
import { hisaroNpc }      from "./data/npcs/hisaro.js";
import { vjRoom01MinamiNpc }   from "./data/npcs/minami_vj_room01.js";
import { redDoorVjRoom01Npc } from "./data/npcs/red_door_vj_room01.js";
import { natsumiRoom02Npc, rikuRoom02Npc, makiRoom02Npc, ninoRoom02Npc } from "./data/npcs/vj_room02_npcs.js";
import { nidhoggNpc }   from "./data/npcs/nidhogg.js";
import { mizugiMNpc, mizugiFNpc } from "./data/npcs/mizugi_npcs.js";
import { uraYahhyNpc } from "./data/npcs/ura_yahhy.js";
import { carefulNpc }     from "./data/npcs/careful.js";
import { orca3Npc }       from "./data/npcs/orca3.js";
import { chinanagoOffNpc, chinanagoOffNpc2, chinanagoOffNpc3 } from "./data/npcs/chinanago.js";
import { balloondogNpc }    from "./data/npcs/balloondog.js";
import { workmangirlNpc }  from "./data/npcs/workmangirl.js";
import { workmanNpc }      from "./data/npcs/workman.js";
import { yahhyNpc }        from "./data/npcs/yahhy.js";
import { yashiNpc }        from "./data/npcs/yashi.js";
import { moriGirlNpc }    from "./data/npcs/mori_girl.js";
import { cactusNpcs }     from "./data/npcs/cactus_group.js";
import { gateNpc }        from "./data/npcs/gate.js";
import { luchaNpc }       from "./data/npcs/lucha.js";
import { dSwordOnNpc }   from "./data/npcs/d_sword.js";
import { keeperNpc }     from "./data/npcs/keeper.js";
import { pbdNpc }        from "./data/npcs/pbd.js";
import { shamanNpc }     from "./data/npcs/shaman.js";
import { ponydeadyouthNpc } from "./data/npcs/ponydeadyouth.js";

const { NPC_FRAME_MS } = CONFIG;

// Resolve a data NPC (spriteKey: string) into a runtime NPC (img: HTMLImageElement).
function resolve(def) {
  const { spriteKey, ...rest } = def;
  return { animMs: NPC_FRAME_MS, ...rest, img: SPRITES[spriteKey] };
}

export const NPCS_BY_MAP = {
  outdoor: [
    resolve(boardNpc),
    resolve(seatsNpc),
    resolve(cat1Npc),
    resolve(fanFlowerNpc),
    resolve(carefulNpc),
    resolve(orca3Npc),
    resolve(chinanagoOffNpc),
    resolve(chinanagoOffNpc2),
    resolve(chinanagoOffNpc3),
    resolve(balloondogNpc),
    resolve(yahhyNpc),
    resolve(yashiNpc),
    resolve({ ...yashiNpc, name: "yashi2_1", spriteKey: "yashi2", x: 2393, y: 2938 }),
    resolve({ ...yashiNpc, name: "yashi_2", x: 2419, y: 2914 }),
    resolve({ ...yashiNpc, name: "yashi_3", x: 2446, y: 2891 }),
    resolve({ ...yashiNpc, name: "yashi_4", x: 2477, y: 2855 }),
    resolve({ ...yashiNpc, name: "yashi_5", x: 2503, y: 2831 }),
    resolve({ ...yashiNpc, name: "yashi_6", x: 2530, y: 2808 }),
    resolve({ ...yashiNpc, name: "yashi_7", x: 2717, y: 1806, solid: false }),
    resolve({ ...yashiNpc, name: "yashi_8", x: 2411, y: 1475, solid: false }),
    resolve({ ...yashiNpc, name: "yashi3_1", spriteKey: "yashi3", x: 2638, y: 1343, solid: false }),
    resolve({ ...yashiNpc, name: "yashi3_2", spriteKey: "yashi3", x: 2944, y: 1675, solid: false }),
    resolve(fanNpc),
    resolve({ ...fanNpc, name: "fan_2", x: 2837, y: 1934 }),
    resolve(koriNpc),
    resolve(moriGirlNpc),
    resolve(mizugiMNpc),
    resolve(mizugiFNpc),
    resolve(gateNpc),
    resolve(luchaNpc),
    resolve(keeperNpc),
    ...cactusNpcs.map(resolve),
  ],

  hisaro: [
    resolve(hisaroNpc),
  ],

  workmen: [
    resolve(workmangirlNpc),
    resolve(workmanNpc),
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

  hole: [
    resolve(nidhoggNpc),
  ],

  d_hole: [
    resolve(dSwordOnNpc),
  ],

  ura_ketchupug: [
    resolve(uraYahhyNpc),
  ],

  indoor_01: [
    resolve(rickyNpc),
    resolve(oharaNpc),
    resolve(indoorMinamiNpc),
  ],

  inugoya: [
    resolve(pbdNpc),
  ],

  house01: [
    resolve(shamanNpc),
  ],

  inn: [
    resolve(ponydeadyouthNpc),
  ],
};
