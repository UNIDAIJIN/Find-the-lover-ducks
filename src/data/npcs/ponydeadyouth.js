export const ponydeadyouthNpc = {
  kind:      "npc",
  name:      "ponydeadyouth",
  spriteKey: "ponydeadyouth",
  x:         89,
  y:         123,
  talkHit:   { x: 0, y: 0, w: 16, h: 21 },
  solid:     true,
  event: {
    type:     "inn_stay",
    price:    300,
    welcome:  "オアシス「サニーデッドユース」にようこそ。",
    question: "一泊300EN、宿泊ですか？",
    options:  ["はい", "いいえ"],
    onNo:     [["ロビーでくつろぐのはタダですから、ごじゆうにー。"]],
    restAt:   { x: 147, y: 123 },
    firstStaySpawn: { itemId: "rubber_duck_D", x: 178, y: 149, flag: "innDuckSpawned" },
  },
};
