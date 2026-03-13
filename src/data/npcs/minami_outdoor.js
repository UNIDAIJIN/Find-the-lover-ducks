export const outdoorMinamiNpc = {
  kind:         "npc",
  name:         "minami",
  spriteKey:    "minami",
  x:            2220,
  y:            3300,
  talkHit:      { x: 0, y: 0, w: 16, h: 14 },
  talkPages: [
    ["アルバムのせいさくひをよこせ だって？"],
    ["ほしければ ちからづくで ・・・うばってみろ！！"],
  ],
  solid:        true,
  battleTrigger: true,
  battleWinPages: [
    ["いいだろう。やくそくどおり せいさくひをよういしてやる。"],
    ["さっそく おくのへやで れんしゅうでもしてこい！ "],
  ],
  battleLosePages: [
    ["でなおしてこい クソガキども。"],
  ],
};
