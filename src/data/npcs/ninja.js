// data/npcs/ninja.js
import { ninjaShopEvent } from "../events/ninja_shop.js";

export const ninjaNpc = {
  kind:      "npc",
  name:      "ninja",
  spriteKey: "ninja",
  x:         118,
  y:         140,
  solid:     true,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  event:     ninjaShopEvent,
};
