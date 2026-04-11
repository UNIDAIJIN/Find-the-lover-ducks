// data/npcs/ura_yahhy.js
import { uraYahhyEvent } from "../events/ura_yahhy.js";

export const uraYahhyNpc = {
  kind:      "npc",
  id:        "ura_yahhy",
  name:      "ウラヤッヒー",
  spriteKey: "ura_yahhy",
  spr:       16,
  x:         121,
  y:         144,
  solid:     true,
  voice:     "f",
  talkHit:   { x: 0, y: 0, w: 16, h: 16 },
  event:     uraYahhyEvent,
};
