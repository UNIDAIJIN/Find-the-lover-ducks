export const vjRoom01MinamiNpc = {
  kind:         "npc",
  name:         "minami",
  spriteKey:    "minami",
  x:            66,
  y:            121,
  talkHit:      { x: 0, y: 0, w: 16, h: 14 },
  talkPages: [
    ["アルバムのせいさくひをよこせ だって？"],
    ["ほしければ ちからづくで ・・・うばってみろ！！"],
  ],
  solid:        true,
  battleTrigger:   true,
  battleWinEnding: true,
  battleWinPages: [
    ["ハァ、ハァ、"],
    ["いいだろう。やくそくどおり せいさくひをよういしてやる。"],
    ["さっそく おくのへやで れんしゅうでもしてこい！ "],
  ],
  battleLosePages: [
    ["でなおしてこい クソガキども。"],
  ],
};
