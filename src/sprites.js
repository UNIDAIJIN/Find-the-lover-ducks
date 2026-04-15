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

  p1_t1: loadSprite("assets/sprites/p1_t1.png"),
  p2_t1: loadSprite("assets/sprites/p2_t1.png"),
  p3_t1: loadSprite("assets/sprites/p3_t1.png"),
  p4_t1: loadSprite("assets/sprites/p4_t1.png"),

  p1_t2: loadSprite("assets/sprites/p1_t2.png"),
  p2_t2: loadSprite("assets/sprites/p2_t2.png"),
  p3_t2: loadSprite("assets/sprites/p3_t2.png"),
  p4_t2: loadSprite("assets/sprites/p4_t2.png"),
  mecha_natsumi: loadSprite("assets/sprites/mecha-natsumi.png"),
  
  // npc
  natsumi:   loadSprite("assets/sprites/natsumi_play.png"),
  mizugi_m:  loadSprite("assets/sprites/mizugi_m.png"),
  mizugi_f:  loadSprite("assets/sprites/mizugi_f.png"),
  npc1:      loadSprite("assets/sprites/npc1.png"),
  pepper:    loadSprite("assets/sprites/pepper.png"),
  pepper_off: loadSprite("assets/sprites/pepper_off.png"),
  skull_a:   loadSprite("assets/sprites/skull_a.png"),
  skull_b:   loadSprite("assets/sprites/skull_b.png"),
  skull_r:   loadSprite("assets/sprites/skull_r.png"),
  riku_play: loadSprite("assets/sprites/riku_play.png"),
  maki_play: loadSprite("assets/sprites/maki_play.png"),
  nino_play: loadSprite("assets/sprites/nino_play.png"),
  ricky: loadSprite("assets/sprites/ricky.png"),
  ohara: loadSprite("assets/sprites/ohara.png"),
  minami: loadSprite("assets/sprites/minami.png"),
  pbd:    loadSprite("assets/sprites/pbd.png"),
  shaman: loadSprite("assets/sprites/Shaman.png"),
  ponydeadyouth: loadSprite("assets/sprites/ponydeadyouth.png"),
  hisaro:       loadSprite("assets/sprites/hisaro.png"),
  diggy:        loadSprite("assets/sprites/diggy.png"),
  workmangirl:  loadSprite("assets/sprites/workmangirl.png"),
  workman:      loadSprite("assets/sprites/workman.png"),

  // duck
  duck: loadSprite("assets/sprites/duck.png"),
  duck_red: loadSprite("assets/sprites/duck_red.png"),

  // other
  board: loadSprite("assets/sprites/board.png"),
  pizzashop: loadSprite("assets/sprites/pizzashop.png"),
  cdshop: loadSprite("assets/sprites/cdshop.png"),
  ufogirl: loadSprite("assets/sprites/ufogirl.png"),
  yuma: loadSprite("assets/sprites/yuma.png"),
  afloboy: loadSprite("assets/sprites/afloboy.png"),
  ice: loadSprite("assets/sprites/ice.png"),
  pizza_sign: loadSprite("assets/sprites/pizza_sign.png"),
  fan: loadSprite("assets/sprites/fan.png"),
  ac_1: loadSprite("assets/sprites/ac_1.png"),
  ac_2: loadSprite("assets/sprites/ac_2.png"),
  ac_3: loadSprite("assets/sprites/ac_3.png"),
  ac_4: loadSprite("assets/sprites/ac_4.png"),
  ac_5: loadSprite("assets/sprites/ac_5.png"),
  ac_6: loadSprite("assets/sprites/ac_6.png"),
  afloclub_off: loadSprite("assets/maps/afloclub_off.png"),
  fan_flower: loadSprite("assets/sprites/fan_flower.png"),
  kori: loadSprite("assets/sprites/kori.png"),
  cat1: loadSprite("assets/sprites/cat_g.png"),
  misaki: loadSprite("assets/sprites/misaki.png"),
  seats: loadSprite("assets/sprites/seats.png"),

  // hole マップ
  nidhogg:  loadSprite("assets/sprites/nidhogg.png"),
  nidhogg2: loadSprite("assets/sprites/nidhogg2.png"),

  // ura_ketchupug マップ
  ura_yahhy: loadSprite("assets/sprites/ura_yahhy.png"),
  yahhy:     loadSprite("assets/sprites/yahhy.png"),
  moriGirl:  loadSprite("assets/sprites/mori-girl.png"),
  met:         loadSprite("assets/sprites/met.png"),
  aflo_p1:     loadSprite("assets/sprites/aflo_p1.png"),
  aflo_p2:     loadSprite("assets/sprites/aflo_p2.png"),
  aflo_p3:     loadSprite("assets/sprites/aflo_p3.png"),
  aflo_p4:     loadSprite("assets/sprites/aflo_p4.png"),
  kingyobachi: loadSprite("assets/sprites/kingyobachi.png"),
  kingyobachi_san: loadSprite("assets/sprites/kingyobachi-san.png"),
  s_hat:       loadSprite("assets/sprites/s_hat.png"),

  // cactus
  cactus:        loadSprite("assets/sprites/cactus.png"),
  cactus_hat:    loadSprite("assets/sprites/cactus_hat.png"),
  cactus_shadow:     loadSprite("assets/sprites/cactus_shadow.png"),
  cactus_hat_shadow: loadSprite("assets/sprites/cactus_hat_shadow.png"),

  d_sword_on:  loadSprite("assets/sprites/d-sword-on.png"),
  d_sword_off: loadSprite("assets/sprites/d-sword-off.png"),

  keeper: loadSprite("assets/sprites/keeper.png"),

  door0: loadSprite("assets/sprites/door0.png"),
  door:  loadSprite("assets/sprites/door.png"),
  door2: loadSprite("assets/sprites/door2.png"),
  door3: loadSprite("assets/sprites/door3.png"),
  door4: loadSprite("assets/sprites/door4.png"),
  door5: loadSprite("assets/sprites/door5.png"),
  door6: loadSprite("assets/sprites/door6.png"),
  door7: loadSprite("assets/sprites/door7.png"),
  door_clear: loadSprite("assets/sprites/door_clear.png"),
  door_noclear: loadSprite("assets/sprites/door_noclear.png"),
  gate:  loadSprite("assets/sprites/gate.png"),
  lucha: loadSprite("assets/sprites/lucha.png"),

  // outdoor オブジェクト
  balloondog:      loadSprite("assets/sprites/balloondog.png"),
  balloondog_half: loadSprite("assets/sprites/balloondog_half.png"),
  balloon:         loadSprite("assets/sprites/balloon.png"),
  movie:           loadSprite("assets/sprites/movie.png"),
  moon:            loadSprite("assets/sprites/moon.png"),
  chinanago_off:  loadSprite("assets/sprites/chinanago_off.png"),
  chinanago_half: loadSprite("assets/sprites/chinanago_half.png"),
  chinanago_on:   loadSprite("assets/sprites/chinanago_on.png"),
  careful: loadSprite("assets/sprites/careful.png"),
  orca3:   loadSprite("assets/sprites/orca3.png"),
  orca2:   loadSprite("assets/sprites/orca2.png"),
  orca:    loadSprite("assets/sprites/orca.png"),
  yashi:   loadSprite("assets/sprites/yashi.png"),
  yashi2:  loadSprite("assets/sprites/yashi2.png"),
  yashi3:  loadSprite("assets/sprites/yashi3.png"),
};
