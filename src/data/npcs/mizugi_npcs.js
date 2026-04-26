export const mizugiMNpc = {
  kind:      "npc",
  name:      "mizugi_m",
  spriteKey: "mizugi_m",
  x:         1566,
  y:         1821,
  frame:     1,
  animMs:    Infinity,
  talkHit:   { x: 0, y: 0, w: 26, h: 14 },
  event:     { type: "mizugi_couple" },
  solid:     true,
};

export const mizugiFNpc = {
  kind:      "npc",
  name:      "mizugi_f",
  spriteKey: "mizugi_f",
  x:         1576,
  y:         1821,
  frame:     0,
  animMs:    Infinity,
  talkHit:   { x: 0, y: 0, w: 0, h: 0 },
  talkPages: [["……"]],
  solid:     true,
};
