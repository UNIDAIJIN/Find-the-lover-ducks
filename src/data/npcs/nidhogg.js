// data/npcs/nidhogg.js
import { nidhoggEvent } from "../events/nidhogg.js";

export const nidhoggNpc = {
  kind:      "npc",
  id:        "nidhogg",
  name:      "ニーズヘッグ",
  spriteKey: "nidhogg",
  spr:       32,
  hitW:      26,
  x:         150,
  y:         140,
  solid:     true,
  talkHit:   { x: 0, y: 24, w: 32, h: 8 },
  event:     nidhoggEvent,
};
