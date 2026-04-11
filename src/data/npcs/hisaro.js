// data/npcs/hisaro.js
import { hisaroSunloverEvent } from "../events/hisaro_sunlover.js";

export const hisaroNpc = {
  kind:      "npc",
  id:        "hisaro",
  name:      "hisaro",
  spriteKey: "hisaro",
  x:         89,
  y:         158,
  solid:     true,
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  event:     hisaroSunloverEvent,
};
