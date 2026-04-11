// data/npcs/workman.js
import { workmanShopEvent } from "../events/workman_shop.js";

export const workmanNpc = {
  kind:      "npc",
  name:      "workman",
  spriteKey: "workman",
  x:         90,
  y:         122,
  solid:     true,
  talkHit:   { x: 0, y: 0, w: 16, h: 24 },
  event:     workmanShopEvent,
};
