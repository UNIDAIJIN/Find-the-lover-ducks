// npcs.js
import { CONFIG } from "./config.js";
import { SPRITES } from "./sprites.js";
import { STATE }   from "./state.js";

import { boardNpc }         from "./data/npcs/board.js";
import { pizzashopNpc }     from "./data/npcs/pizzashop.js";
import { cdshopNpc }        from "./data/npcs/cdshop.js";
import { fanNpc }           from "./data/npcs/fan.js";
import { ac1Npc }           from "./data/npcs/ac_1.js";
import { koriNpc }          from "./data/npcs/kori.js";
import { seatsNpc }         from "./data/npcs/seats.js";
import { cat1Npc }          from "./data/npcs/cat1.js";
import { fanFlowerNpc }     from "./data/npcs/fan_flower.js";
import { fanOrangeNpc }     from "./data/npcs/fan_orange.js";
import { sarferNpc }        from "./data/npcs/sarfer.js";
import { hyoryuNpc }        from "./data/npcs/hyoryu.js";
import { hawaiiNpc }        from "./data/npcs/hawaii.js";
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
import { balloonNpc }       from "./data/npcs/balloon.js";
import { workmangirlNpc }  from "./data/npcs/workmangirl.js";
import { workmanNpc }      from "./data/npcs/workman.js";
import { diggyNpc }        from "./data/npcs/diggy.js";
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
import { kingyobachiSanNpc } from "./data/npcs/kingyobachi_san.js";
import { moritasakiGiftNpc } from "./data/npcs/moritasaki_gift.js";
import { ufogirlNpc }        from "./data/npcs/ufogirl.js";
import { iceNpc }            from "./data/npcs/ice.js";
import { yumaNpc }           from "./data/npcs/yuma.js";
import { afloboyNpc }        from "./data/npcs/afloboy.js";
import { dreamNpc }          from "./data/npcs/dream.js";
import { grasanNpc }         from "./data/npcs/grasan.js";
import { charaNpc }          from "./data/npcs/chara.js";

const { NPC_FRAME_MS } = CONFIG;

// Resolve a data NPC (spriteKey: string) into a runtime NPC (img: HTMLImageElement).
function resolve(def) {
  const { spriteKey, ...rest } = def;
  return { animMs: NPC_FRAME_MS, ...rest, img: SPRITES[spriteKey] };
}

const timemachineSlotNpc = {
  kind: "npc",
  name: "timemachine_slot",
  spriteKey: "board",
  x: 2641,
  y: 121,
  talkHit: { x: 0, y: 0, w: 3, h: 5 },
  talkType: "sign",
  talkPages: [["なにかをおくばしょのようだ。"]],
  solid: false,
  hidden: true,
  event: { type: "timemachine_slot" },
};

export const NPCS_BY_MAP = {
  outdoor: [
    resolve(boardNpc),
    resolve({
      ...boardNpc,
      name: "board_timemachine",
      x: 2675,
      y: 127,
      talkPages: [["←　これはタイムマシン"]],
      talkType: "sign",
    }),
    resolve({
      ...boardNpc,
      name: "board_vj_records",
      x: 1817,
      y: 675,
      talkPages: [["すばらしき音楽事務所、ヴィニールジャンキーレコーディングス"]],
      talkType: "sign",
    }),
    resolve({
      ...boardNpc,
      name: "board_afroclub",
      x: 2624,
      y: 1015,
      talkPages: [["アフロ・クラブへようこそ"]],
      talkType: "sign",
    }),
    resolve({
      ...boardNpc,
      name: "board_sun_lover",
      x: 1674,
      y: 2076,
      talkPages: [["なんと！一室まるまる日サロ！サン・ラヴァー"]],
      talkType: "sign",
    }),
    resolve(timemachineSlotNpc),
    resolve(seatsNpc),
    resolve(cat1Npc),
    resolve(fanFlowerNpc),
    resolve({ ...fanFlowerNpc, name: "fan_flower_2", x: 2560, y: 1320 }),
    resolve(carefulNpc),
    resolve(orca3Npc),
    resolve(chinanagoOffNpc),
    resolve(chinanagoOffNpc2),
    resolve(chinanagoOffNpc3),
    resolve(balloondogNpc),
    resolve(balloonNpc),
    resolve(yahhyNpc),
    resolve(yashiNpc),
    resolve({ ...yashiNpc, name: "yashi2_1", spriteKey: "yashi2", x: 1855, y: 2137 }),
    resolve({ ...yashiNpc, name: "yashi_2", x: 1881, y: 2113 }),
    resolve({ ...yashiNpc, name: "yashi_3", x: 1908, y: 2090 }),
    resolve({ ...yashiNpc, name: "yashi_4", x: 1939, y: 2054 }),
    resolve({ ...yashiNpc, name: "yashi_5", x: 1965, y: 2030 }),
    resolve({ ...yashiNpc, name: "yashi_6", x: 1992, y: 2007 }),
    resolve({ ...yashiNpc, name: "yashi_7", x: 2179, y: 1005, hitOy: 5 }),
    resolve({ ...yashiNpc, name: "yashi_8", x: 1873, y: 674, hitOy: 5 }),
    resolve({ ...yashiNpc, name: "yashi3_1", spriteKey: "yashi3", x: 2100, y: 542, hitOy: 5, aboveTop: true }),
    resolve({ ...yashiNpc, name: "yashi3_2", spriteKey: "yashi3", x: 2406, y: 874, hitOy: 5 }),
    resolve(fanNpc),
    resolve(fanOrangeNpc),
    resolve(sarferNpc),
    resolve(hyoryuNpc),
    resolve(hawaiiNpc),
    resolve({ ...fanNpc, name: "fan_2", x: 2299, y: 1133 }),
    resolve({ ...fanNpc, name: "fan_3", x: 1522, y: 875 }),
    resolve({ ...fanNpc, name: "fan_4", x: 1595, y: 928 }),
    resolve({ ...fanNpc, name: "fan_5", x: 1843, y: 617, aboveTop: true }),
    resolve(koriNpc),
    resolve(moriGirlNpc),
    resolve(mizugiMNpc),
    resolve(mizugiFNpc),
    resolve(gateNpc),
    resolve(luchaNpc),
    resolve(keeperNpc),
    resolve(kingyobachiSanNpc),
    resolve(iceNpc),
    resolve({
      kind: "npc",
      name: "lee",
      spriteKey: "lee",
      x: 1583,
      y: 1609,
      talkHit: { x: 0, y: 0, w: 16, h: 16 },
      solid: true,
      event: {
        type: "item_shop",
        shopName: "リーの餃子",
        greeting: [["よくきたネ！"]],
        byeDialog: [["お腹いっぱいネ！"]],
        items: [
          { id: "gyoza", name: "ギョウザ", price: 200 },
        ],
        closeLabel: "やめる",
      },
    }),
    resolve(yumaNpc),
    resolve(afloboyNpc),
    resolve(dreamNpc),
    resolve(grasanNpc),
    resolve(charaNpc),
    ...cactusNpcs.map(resolve),
  ].map((npc) => ({ ...npc, y: typeof npc.y === "number" ? npc.y + 1 : npc.y })),

  hisaro: [
    resolve(hisaroNpc),
  ],

  workmen: [
    resolve(workmangirlNpc),
    resolve(workmanNpc),
  ],

  digitmore: [
    resolve(diggyNpc),
  ],

  pizza: [
    resolve(pizzashopNpc),
  ],

  cdshop: [
    resolve(cdshopNpc),
  ],

  moritasaki_room: [
    resolve(moritasakiGiftNpc),
  ],

  vj_room01: [
    resolve(vjRoom01MinamiNpc),
    resolve(redDoorVjRoom01Npc),
  ],

  space_boss: [
    resolve({ kind: "npc", name: "sb_ss1", spriteKey: "spacesisters1", x: 1024, y: 736, solid: true, noWalk: true, talkPages: [["ここまできたね！"]] }),
  ],

  vj_factry: [
    resolve({ kind: "npc", name: "factry_left_door", spriteKey: null, x: 39, y: 160, spr: 0, sprH: 0, solid: false, noWalk: true, animMs: Infinity, talkHit: { x: 0, y: 0, w: 16, h: 8 }, talkPages: [["ここは入れない。"]], talkType: "sign" }),
    resolve({ kind: "npc", name: "factry_ss1", spriteKey: "spacesisters1", x: 79, y: 131, solid: true, noWalk: true, talkPages: [["やっほー！"]] }),
    resolve({ kind: "npc", name: "factry_ss2", spriteKey: "spacesisters1", x: 107, y: 131, solid: true, noWalk: true, talkPages: [["げんきー？"]] }),
    resolve({ kind: "npc", name: "factry_minami", spriteKey: "minami", x: 135, y: 131, solid: true, noWalk: true, event: { type: "factry_minami" } }),
    resolve({ kind: "npc", name: "factry_ss3", spriteKey: "spacesisters1", x: 163, y: 131, solid: true, noWalk: true, talkPages: [["いぇーい！"]] }),
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

  shooting_lobby: [
    resolve({
      ...luchaNpc,
      name: "lucha_shooting",
      x: 120,
      y: 134,
      talkPages: [
        ["おまえ、あの世ってしってるか？"],
        ["あの世ってやつは、本当に最高なんだ。"],
        ["そう！"],
        ["ここが！ジ・ゴ・ク！"],
        ["サイコーーーーーー！！"],
      ],
    }),
    resolve({ kind: "npc", name: "door_4", spriteKey: "door4", x: 120, y: 40,  spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_3", spriteKey: "door3", x: 174, y: 62,  spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_2", spriteKey: "door2", x: 196, y: 116, spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_1", spriteKey: "door",  x: 174, y: 170, spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_0", spriteKey: "door0", x: 120, y: 192, spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_7", spriteKey: "door7", x: 66,  y: 170, spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_6", spriteKey: "door6", x: 44,  y: 116, spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
    resolve({ kind: "npc", name: "door_5", spriteKey: "door5", x: 66,  y: 62,  spr: 16, sprH: 32, frame: 0, animMs: Infinity, hitW: 12, hitH: 6, talkHit: { x: 0, y: 0, w: 0, h: 0 }, solid: false }),
  ],

  inugoya: [
    resolve(pbdNpc),
  ],

  house01: [
    resolve(shamanNpc),
  ],

  house07: [
    resolve(ac1Npc),
  ],

  house08: [
    resolve(ufogirlNpc),
  ],

  mirai: [
    resolve(timemachineSlotNpc),
  ],

  kako: [
    resolve(timemachineSlotNpc),
    resolve({ kind: "npc", name: "sogankyo", spriteKey: "sogankyo", x: 1588, y: 1370, spr: 16, sprH: 32, solid: true, hitW: 16, hitH: 8, talkHit: { x: 0, y: 16, w: 16, h: 16 }, noWalk: true, animMs: Infinity, talkType: "sign", event: { type: "sogankyo" } }),
    resolve({ kind: "npc", name: "kako_yashi", spriteKey: "kako_yashi", x: 1242, y: 1406, spr: 602, sprH: 172, hitW: 560, hitH: 8, solid: true, talkHit: { x: 0, y: 0, w: 0, h: 0 } }),
  ],

  afloclub: [
    resolve({ ...ac1Npc, x: 159, y: 124, talkHit: { x: 0, y: 3, w: 16, h: 12 }, event: { type: "afro_club_inside" } }),
    resolve({ ...ac1Npc, name: "ac_2", spriteKey: "ac_2", x: 80, y: 160, talkHit: { x: 0, y: 3, w: 16, h: 12 }, event: { type: "afro_club_inside_2" } }),
    resolve({ ...ac1Npc, name: "ac_3", spriteKey: "ac_3", x: 64, y: 139, talkHit: { x: 0, y: 3, w: 16, h: 12 }, event: { type: "afro_club_inside_3" } }),
    resolve({ ...ac1Npc, name: "ac_4", spriteKey: "ac_4", x: 123, y: 151, talkHit: { x: 0, y: 3, w: 16, h: 12 }, event: { type: "afro_club_inside_5" } }),
    resolve({ ...ac1Npc, name: "ac_5", spriteKey: "ac_5", x: 40, y: 166, talkHit: { x: 0, y: 3, w: 16, h: 12 }, event: { type: "afro_club_inside_4" } }),
    resolve({
      ...ac1Npc,
      name: "ac_6",
      spriteKey: "ac_6",
      x: 95,
      y: 123,
      talkHit: { x: 0, y: 3, w: 16, h: 15 },
      event: {
        type: "item_shop",
        shopName: "バーカン",
        greeting: [["うっふーん。"]],
        byeDialog: [["うふふーん。"]],
        items: [
          { id: "vodka", name: "ウォッカ", price: 300, comment: "ウゲー！" },
        ],
        closeLabel: "やめる",
      },
    }),
  ],

  inn: [
    resolve(ponydeadyouthNpc),
  ],
};

const UFO_SEQ = [2, 3, 1, 1, 3, 1, 2, 3];
const UFO_CX = 120, UFO_CY = 145;

export function getUfoHouseNpcs(houseNum) {
  const npcs = [];
  if (STATE.flags.ufoComplete) {
    if (houseNum === 3 && !STATE.flags.galaxyLastBattle) {
      npcs.push(
        resolve({ kind: "npc", name: "spacesisters1_a", spriteKey: "spacesisters1", x: UFO_CX, y: UFO_CY - 16, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true, event: { type: "spacesisters_warp" } }),
        resolve({ kind: "npc", name: "spacesisters1_b", spriteKey: "spacesisters1", x: UFO_CX - 24, y: UFO_CY + 14, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true, event: { type: "spacesisters_warp" } }),
        resolve({ kind: "npc", name: "spacesisters1_c", spriteKey: "spacesisters1", x: UFO_CX + 24, y: UFO_CY + 14, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true, event: { type: "spacesisters_warp" } }),
      );
    }
    return npcs;
  }

  const step = STATE.flags.ufoStep || 0;
  const isCorrect = step < UFO_SEQ.length && UFO_SEQ[step] === houseNum;
  const isLast = step === UFO_SEQ.length - 1;
  if (isCorrect && isLast) {
    npcs.push(
      resolve({ kind: "npc", name: "spacesisters1_a", spriteKey: "spacesisters1", x: UFO_CX, y: UFO_CY - 12, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true, talkPages: [["……"]] }),
      resolve({ kind: "npc", name: "spacesisters1_b", spriteKey: "spacesisters1", x: UFO_CX - 16, y: UFO_CY + 10, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true, talkPages: [["……"]] }),
      resolve({ kind: "npc", name: "spacesisters1_c", spriteKey: "spacesisters1", x: UFO_CX + 16, y: UFO_CY + 10, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true, talkPages: [["……"]] }),
    );
  } else if (isCorrect) {
    npcs.push(resolve({
      kind: "npc", name: "spacesisters1_hit", spriteKey: "spacesisters1",
      x: UFO_CX, y: UFO_CY, talkHit: { x: 0, y: 0, w: 16, h: 16 }, solid: true,
      event: { type: "spacesisters_hit" },
    }));
  } else {
    npcs.push(resolve({
      kind: "npc", name: "ufo_hazure_board", spriteKey: "board",
      x: UFO_CX, y: UFO_CY, talkHit: { x: 0, y: 0, w: 16, h: 14 }, solid: true,
      talkType: "sign",
      talkPages: [["ハ　ズ　レ"]],
    }));
  }
  return npcs;
}
