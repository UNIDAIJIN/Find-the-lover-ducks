export const vjRoom01MinamiNpc = {
  kind:         "npc",
  name:         "minami",
  spriteKey:    "minami",
  x:            66,
  y:            121,
  talkHit:      { x: 0, y: 0, w: 16, h: 14 },
  battleConfirmQuestion: "アルバムの制作費をよこせだって？",
  battleConfirmPrompt: "欲しければ力ずくで奪ってみろ！",
  solid:        true,
  battleTrigger:   true,
  battleConfirm:   true,
  battleWinEnding: true,
  battleWinPages: [
    ["ハァ、ハァ、"],
    ["いいだろう。制作費を用意してやる。"],
    ["それじゃあさっそく、奥の部屋で練習でもしてこい！"],
  ],
  battlePayPages: [
    ["なんでそんなことしたんだ？"],
    ["まあいいか。"],
    ["それじゃあ、さっそく奥の部屋で練習でもしてくれば？"],
  ],
};
