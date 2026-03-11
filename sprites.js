// sprites.js
function loadSprite(src){
  const img = new Image();
  img.onload = () => console.log("[SPRITE OK]", src, img.naturalWidth, img.naturalHeight);
  img.onerror = () => console.error("[SPRITE NG]", src);
  img.src = src;
  return img;
}

export const SPRITES = {
  p1: loadSprite("assets/sprites/p1.png"),
  p2: loadSprite("assets/sprites/p2.png"),
  p3: loadSprite("assets/sprites/p3.png"),
  p4: loadSprite("assets/sprites/p4.png"),

  p1_t2: loadSprite("assets/sprites/p1_t2.png"),
  p2_t2: loadSprite("assets/sprites/p2_t2.png"),
  p3_t2: loadSprite("assets/sprites/p3_t2.png"),
  p4_t2: loadSprite("assets/sprites/p4_t2.png"),
  
  // npc
  ricky: loadSprite("assets/sprites/ricky.png"),
  ohara: loadSprite("assets/sprites/ohara.png"),
  minami: loadSprite("assets/sprites/minami.png"),
  hisaro: loadSprite("assets/sprites/hisaro.png"),

  // duck
  duck: loadSprite("assets/sprites/duck.png"),
  duck_red: loadSprite("assets/sprites/duck_red.png"),

  // other
  board: loadSprite("assets/sprites/board.png"),
  fan_flower: loadSprite("assets/sprites/fan_flower.png"),
  cat1: loadSprite("assets/sprites/cat_g.png"),
  seats: loadSprite("assets/sprites/seats.png"),
  sabo_hat: loadSprite("assets/sprites/sabo_hat.png"),
  sabo: loadSprite("assets/sprites/sabo.png"),

  // 戦闘グラフィック
boss: loadSprite("assets/sprites/boss.png"),
};