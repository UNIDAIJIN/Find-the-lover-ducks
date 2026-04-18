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
    resolve({ ...yashiNpc, name: "yashi3_1", spriteKey: "yashi3", x: 2100, y: 542, hitOy: 5 }),
    resolve({ ...yashiNpc, name: "yashi3_2", spriteKey: "yashi3", x: 2406, y: 874, hitOy: 5 }),
    resolve(fanNpc),
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
    // 1段目
    resolve({ ...yashiNpc, name: "kako_yashi_1",  x: 1242, y: 1413 }),
    resolve({ ...yashiNpc, name: "kako_yashi_2",  x: 1270, y: 1407 }),
    resolve({ ...yashiNpc, name: "kako_yashi_3",  x: 1298, y: 1415 }),
    resolve({ ...yashiNpc, name: "kako_yashi_4",  x: 1326, y: 1409 }),
    resolve({ ...yashiNpc, name: "kako_yashi_5",  x: 1354, y: 1416 }),
    resolve({ ...yashiNpc, name: "kako_yashi_6",  x: 1382, y: 1411 }),
    resolve({ ...yashiNpc, name: "kako_yashi_7",  x: 1410, y: 1408 }),
    resolve({ ...yashiNpc, name: "kako_yashi_8",  x: 1438, y: 1414 }),
    resolve({ ...yashiNpc, name: "kako_yashi_9",  x: 1466, y: 1410 }),
    resolve({ ...yashiNpc, name: "kako_yashi_10", x: 1494, y: 1417 }),
    resolve({ ...yashiNpc, name: "kako_yashi_11", x: 1522, y: 1406 }),
    resolve({ ...yashiNpc, name: "kako_yashi_12", x: 1550, y: 1412 }),
    resolve({ ...yashiNpc, name: "kako_yashi_13", x: 1578, y: 1418 }),
    resolve({ ...yashiNpc, name: "kako_yashi_14", x: 1606, y: 1409 }),
    resolve({ ...yashiNpc, name: "kako_yashi_15", x: 1634, y: 1415 }),
    resolve({ ...yashiNpc, name: "kako_yashi_16", x: 1662, y: 1407 }),
    resolve({ ...yashiNpc, name: "kako_yashi_17", x: 1690, y: 1413 }),
    resolve({ ...yashiNpc, name: "kako_yashi_18", x: 1718, y: 1416 }),
    resolve({ ...yashiNpc, name: "kako_yashi_19", x: 1746, y: 1408 }),
    resolve({ ...yashiNpc, name: "kako_yashi_20", x: 1774, y: 1411 }),
    // 2段目
    resolve({ ...yashiNpc, name: "kako_yashi_21", x: 1248, y: 1428 }),
    resolve({ ...yashiNpc, name: "kako_yashi_22", x: 1276, y: 1423 }),
    resolve({ ...yashiNpc, name: "kako_yashi_23", x: 1304, y: 1431 }),
    resolve({ ...yashiNpc, name: "kako_yashi_24", x: 1332, y: 1425 }),
    resolve({ ...yashiNpc, name: "kako_yashi_25", x: 1360, y: 1432 }),
    resolve({ ...yashiNpc, name: "kako_yashi_26", x: 1388, y: 1426 }),
    resolve({ ...yashiNpc, name: "kako_yashi_27", x: 1416, y: 1424 }),
    resolve({ ...yashiNpc, name: "kako_yashi_28", x: 1444, y: 1430 }),
    resolve({ ...yashiNpc, name: "kako_yashi_29", x: 1472, y: 1427 }),
    resolve({ ...yashiNpc, name: "kako_yashi_30", x: 1500, y: 1433 }),
    resolve({ ...yashiNpc, name: "kako_yashi_31", x: 1528, y: 1422 }),
    resolve({ ...yashiNpc, name: "kako_yashi_32", x: 1556, y: 1429 }),
    resolve({ ...yashiNpc, name: "kako_yashi_33", x: 1584, y: 1434 }),
    resolve({ ...yashiNpc, name: "kako_yashi_34", x: 1612, y: 1425 }),
    resolve({ ...yashiNpc, name: "kako_yashi_35", x: 1640, y: 1431 }),
    resolve({ ...yashiNpc, name: "kako_yashi_36", x: 1668, y: 1423 }),
    resolve({ ...yashiNpc, name: "kako_yashi_37", x: 1696, y: 1429 }),
    resolve({ ...yashiNpc, name: "kako_yashi_38", x: 1724, y: 1432 }),
    resolve({ ...yashiNpc, name: "kako_yashi_39", x: 1752, y: 1424 }),
    resolve({ ...yashiNpc, name: "kako_yashi_40", x: 1780, y: 1427 }),
    // 3段目
    resolve({ ...yashiNpc, name: "kako_yashi_41", x: 1245, y: 1444 }),
    resolve({ ...yashiNpc, name: "kako_yashi_42", x: 1273, y: 1439 }),
    resolve({ ...yashiNpc, name: "kako_yashi_43", x: 1301, y: 1447 }),
    resolve({ ...yashiNpc, name: "kako_yashi_44", x: 1329, y: 1441 }),
    resolve({ ...yashiNpc, name: "kako_yashi_45", x: 1357, y: 1448 }),
    resolve({ ...yashiNpc, name: "kako_yashi_46", x: 1385, y: 1442 }),
    resolve({ ...yashiNpc, name: "kako_yashi_47", x: 1413, y: 1440 }),
    resolve({ ...yashiNpc, name: "kako_yashi_48", x: 1441, y: 1446 }),
    resolve({ ...yashiNpc, name: "kako_yashi_49", x: 1469, y: 1443 }),
    resolve({ ...yashiNpc, name: "kako_yashi_50", x: 1497, y: 1449 }),
    resolve({ ...yashiNpc, name: "kako_yashi_51", x: 1525, y: 1438 }),
    resolve({ ...yashiNpc, name: "kako_yashi_52", x: 1553, y: 1445 }),
    resolve({ ...yashiNpc, name: "kako_yashi_53", x: 1581, y: 1450 }),
    resolve({ ...yashiNpc, name: "kako_yashi_54", x: 1609, y: 1441 }),
    resolve({ ...yashiNpc, name: "kako_yashi_55", x: 1637, y: 1447 }),
    resolve({ ...yashiNpc, name: "kako_yashi_56", x: 1665, y: 1439 }),
    resolve({ ...yashiNpc, name: "kako_yashi_57", x: 1693, y: 1445 }),
    resolve({ ...yashiNpc, name: "kako_yashi_58", x: 1721, y: 1448 }),
    resolve({ ...yashiNpc, name: "kako_yashi_59", x: 1749, y: 1440 }),
    resolve({ ...yashiNpc, name: "kako_yashi_60", x: 1777, y: 1443 }),
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
    if (houseNum === 3) {
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
