// data/npcs/yahhy.js
import { yahhyJumpropeEvent } from "../events/yahhy_jumprope.js";

export const yahhyNpc = {
  kind:      "npc",
  name:      "yahhy",
  spriteKey: "yahhy",
  x:         2081,
  y:         2362,
  solid:     true,
  talkHit:   { x: 0, y: 0, w: 16, h: 24 },
  event:     yahhyJumpropeEvent,
};
