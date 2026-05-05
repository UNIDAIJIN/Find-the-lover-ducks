// main.js
import { CONFIG } from "./config.js";
import { SPRITES } from "./sprites.js";
import { MAPS } from "./maps.js";
import { makeColStore } from "./col.js";
import { START_INVENTORY_NORMAL, itemName, itemBgmSrc, itemThrowDmg } from "./items.js";
import { PICKUPS_BY_MAP } from "./pickups.js";
import { NPCS_BY_MAP, getUfoHouseNpcs } from "./npcs.js";
import { REGISTRY } from "./registry.js";
const { createInput, createBgm, createSea, createDialog, createChoice, createShop, createJumprope, createFade, createInventory, createToast, createFollowers, createBattleSystem, runNpcEvent } = REGISTRY;
import { STATE } from "./state.js";
import { createEnding }     from "./ending.js";
import { createTitle  }     from "./title.js";
import { createCharSelect } from "./char_select.js";
import { createLoading }    from "./loading.js";
import { setupMobileController } from "./mobile_controller.js";
import { playSuzu, playFuro, playDoor, playZazza, playHoleFall, playHoleRoll, playConfirm, playClickOn, playCursor, playTimeMachineShine, playWave, startHeartbeat, stopHeartbeat, playQuestJingleB, playPunch, startShootingBgm, stopShootingBgm, startAfloClubBgm, stopAfloClubBgm, stopJaws, playBattleWinJingle, getAfloClubKickPulseMs, unlockSeAudio, startRainLoop, stopRainLoop, startSeasideBgm, stopSeasideBgm, startDivingBgm, stopDivingBgm, playDinoStep, playBirdCall, playWingFlap, startWaterfall, setWaterfallVol, stopWaterfall, startPhoneRing, stopPhoneRing, playPhonePick, playPhoneHang, playDadaan, startMetalBgm, stopMetalBgm, startChaosMetalBgm, stopChaosMetalBgm, playAlienTypingNoise, playTypingVoice, playGlassShatter, playItemJingle } from "./se.js";
import { createMenu } from "./ui_menu.js";
import { createTripEffect }     from "./trip_effect.js";
import { createGoodTripEffect } from "./trip_effect_good.js";
import * as letterbox           from "./letterbox.js";
import { createQuestAlert }     from "./ui_quest_alert.js";
import { QUESTS }               from "./data/quests.js";
import { createShooting, drawShootingBackdrop, SHOOTING_DIFFICULTIES } from "./ui_shooting.js";
import { createDiving, DIVE_W, DIVE_H } from "./ui_diving.js";
import { createPhoneBrawl, PHONE_BRAWL_W, PHONE_BRAWL_H } from "./ui_phone_brawl.js";
import { createInteractionSession } from "./interaction_session.js";
import { controlPrompt } from "./control_prompts.js";
import { gateNpc } from "./data/npcs/gate.js";

const DEBUG  = true;
const MOBILE = new URLSearchParams(location.search).has('m');

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const trip     = createTripEffect();
const goodTrip = createGoodTripEffect({ useCssFilter: MOBILE });
ctx.imageSmoothingEnabled = false;

// 文字に紺色の +1,+1 影を付与（ミニゲーム等で this._skipTextShadow = true にすれば無効）
const TEXT_SHADOW_COLOR = "#0a1a4d";
const _origFillText = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
  if (this._skipTextShadow) {
    return maxWidth !== undefined
      ? _origFillText.call(this, text, x, y, maxWidth)
      : _origFillText.call(this, text, x, y);
  }
  const origStyle = this.fillStyle;
  this.fillStyle = TEXT_SHADOW_COLOR;
  if (maxWidth !== undefined) _origFillText.call(this, text, x + 1, y + 1, maxWidth);
  else _origFillText.call(this, text, x + 1, y + 1);
  this.fillStyle = origStyle;
  if (maxWidth !== undefined) _origFillText.call(this, text, x, y, maxWidth);
  else _origFillText.call(this, text, x, y);
};

const { SCALE, SPR, SPEED, FRAME_MS, GAP2, GAP3, GAP4, NPC_FRAME_MS, DOOR_COOLDOWN_MS, MAP_FADE_OUT_MS, MAP_FADE_IN_MS } = CONFIG;
// ゲーム本編は常に 192×180（タイトル/セレクト/エンディングは CONFIG.BASE_W/H = 256×240）
const BASE_W = 192;
const BASE_H = 180;

// ボス戦専用の固定解像度（ゲーム本編の解像度に依存しない）
// battle_ui.js は cmdX=160,cmdW=88(合計248) / BOSS_SCALE=3で80×80→240px 等、256×240想定で設計
const BATTLE_W = 256;
const BATTLE_H = 240;
const SHOOTING_W = 256;
const SHOOTING_H = 240;

// Fit canvas CSS size to window while keeping pixel-perfect aspect ratio
function fitCanvas() {
  const aspect = canvas.width / canvas.height;
  const ww = window.innerWidth;
  const wh = window.innerHeight;
  if (ww / wh > aspect) {
    canvas.style.height = wh + "px";
    canvas.style.width  = Math.floor(wh * aspect) + "px";
  } else {
    canvas.style.width  = ww + "px";
    canvas.style.height = Math.floor(ww / aspect) + "px";
  }
}
window.addEventListener("resize", fitCanvas);

// Start with title resolution (shared between mobile and desktop)
canvas.width = CONFIG.BASE_W;
canvas.height = CONFIG.BASE_H;
fitCanvas();

const input = createInput();

const nowMs = (typeof performance !== "undefined" && performance.now)
  ? performance.now.bind(performance)
  : Date.now.bind(Date);


// UI / FX
const shooting  = createShooting({ BASE_W: SHOOTING_W, BASE_H: SHOOTING_H, input, sprites: SPRITES, getLeaderImg: () => leader?.img, mobile: MOBILE });
const diving    = createDiving({ BASE_W, BASE_H, input, getLeaderImg: () => leader?.img, getHeadwearImg: () => SPRITES.kingyobachi, sprites: SPRITES, mobile: MOBILE });
const phoneBrawl = createPhoneBrawl({
  input,
  inputTarget: window,
  gameOverAction: "close",
  endTiming: "confirm",
  mobile: MOBILE,
  sprites: {
    playerBase: SPRITES.earth,
    enemyBaseParts: {
      low: SPRITES.urabossLow,
      mid: SPRITES.urabossMid,
      top: SPRITES.urabossTop,
    },
    enemy: SPRITES.phoneBrawlEnemy,
    enemyCards: {
      runner: SPRITES.boss_fly,
      guard: SPRITES.boss_cat,
      bruiser: SPRITES.boss_main,
      blaster: SPRITES.boss_tower,
      swarm: SPRITES.boss_three,
    },
    curry: SPRITES.curry,
    pepper: SPRITES.pepper,
    gyoza: SPRITES.gyoza,
    cards: {
      runner: [SPRITES.p1, SPRITES.p2, SPRITES.p3, SPRITES.p4],
      guard: SPRITES.nidhogg2,
      bruiser: SPRITES.phoneBrawl3,
      blaster: SPRITES.angler,
      sniper: SPRITES.ryousan,
      medic: SPRITES.lee,
      swarm: SPRITES.phoneBrawl7,
      frost: [SPRITES.cactus, SPRITES.cactus, SPRITES.cactus_hat],
      spark: [SPRITES.ac_1, SPRITES.ac_2, SPRITES.ac_3, SPRITES.ac_4, SPRITES.ac_5, SPRITES.afloboy2],
      mechanic: SPRITES.yahhy,
    },
  },
});
const dialog = createDialog({ BASE_W, BASE_H, input });
const choice = createChoice({ BASE_W, BASE_H, input, dialog });
const shop      = createShop({ BASE_W, BASE_H, input });
const jumprope  = createJumprope({ BASE_W, BASE_H, input, getParty: () => ({ leader, p2, p3, p4 }), yahhyImg: SPRITES.yahhy });
const fade = createFade({ BASE_W, BASE_H, canvas, input, mapOutMs: MAP_FADE_OUT_MS, mapInMs: MAP_FADE_IN_MS });

const interactionSession = createInteractionSession({
  input,
  isUiActive: () => dialog.isActive() || choice.isActive() || shop.isActive() || fade.isActive() || input.isLocked(),
});

const dialogOpenRaw = dialog.open.bind(dialog);
dialog.open = (pages, onClose, ...args) => {
  const ret = dialogOpenRaw(pages, interactionSession.wrapCallback(onClose), ...args);
  interactionSession.scheduleReleaseCheck();
  return ret;
};

const choiceOpenRaw = choice.open.bind(choice);
choice.open = (options, onSelect, ...args) => {
  const ret = choiceOpenRaw(options, interactionSession.wrapCallback(onSelect), ...args);
  interactionSession.scheduleReleaseCheck();
  return ret;
};

const shopOpenRaw = shop.open.bind(shop);
shop.open = (items, closeLabel, name, onSelect, ...args) => {
  const ret = shopOpenRaw(items, closeLabel, name, interactionSession.wrapCallback(onSelect), ...args);
  interactionSession.scheduleReleaseCheck();
  return ret;
};

function runFieldInteraction(fn) {
  interactionSession.begin();
  const handled = interactionSession.trackSync(fn);
  if (!handled) interactionSession.end();
  return handled;
}

// 初期：ダイアログの上にchoiceを積むための基準を渡す
if (typeof dialog.getRect === "function" && typeof choice.setAnchorRect === "function") {
  choice.setAnchorRect(dialog.getRect());
}

// ---- BGM (externalized) ----
const BGM_VOLUME = 0.35;
const bgmCtl = createBgm({ defaultSrc: "assets/audio/bgm0.mp3", volume: BGM_VOLUME });
let bgmFadeStopTimer = null;

function fadeOutBgmToSilence(durationMs = 1200) {
  if (bgmFadeStopTimer) {
    clearInterval(bgmFadeStopTimer);
    bgmFadeStopTimer = null;
  }
  const audio = bgmCtl.audio;
  const startMs = nowMs();
  const startVol = audio.volume || BGM_VOLUME;
  bgmFadeStopTimer = setInterval(() => {
    const p = Math.min(1, (nowMs() - startMs) / durationMs);
    const eased = p * p * (3 - 2 * p);
    audio.volume = startVol * (1 - eased);
    if (p >= 1) {
      clearInterval(bgmFadeStopTimer);
      bgmFadeStopTimer = null;
      bgmCtl.setOverride("about:blank");
      bgmCtl.resetVolumeForCurrentSrc();
    }
  }, 16);
}
// BATTLE_BGM_SRC は使用せず Web Audio API のハートビートに変更

// ---- Sea (externalized) ----
const sea = createSea({
  rgb: "rgb(61,209,195)",
  grid: 10,
  alpha: 0.22,
  twSpeed: 0.0045,
  driftX: 0.9,
  driftY: 0.6,
  density: 0.25,
});

// ---- Map / Collision ----
const bgImg         = new Image();
const bgTopImg      = new Image();
const bgMidImg      = new Image();
const bgShrineImg    = new Image();
const bgShrineTopImg = new Image();
const bgShoreImg     = new Image();
const bgShoreCanvas  = document.createElement("canvas");
let bgShoreReady = false;
let bgShoreOffsetX = 0;
let bgShoreOffsetY = 0;
let bgShoreData = null;
bgShoreImg.onload = () => {
  if (!bgShoreImg.naturalWidth) return;
  const w = bgShoreImg.naturalWidth;
  const h = bgShoreImg.naturalHeight;
  const tc = document.createElement("canvas");
  tc.width = w;
  tc.height = h;
  const tx = tc.getContext("2d", { willReadFrequently: true });
  tx.drawImage(bgShoreImg, 0, 0);
  const data = tx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) { bgShoreReady = false; return; }
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  bgShoreCanvas.width = cw;
  bgShoreCanvas.height = ch;
  const bcx = bgShoreCanvas.getContext("2d");
  bcx.imageSmoothingEnabled = false;
  bcx.drawImage(bgShoreImg, minX, minY, cw, ch, 0, 0, cw, ch);
  bgShoreData = bcx.getImageData(0, 0, cw, ch).data;
  bgShoreOffsetX = minX;
  bgShoreOffsetY = minY;
  bgShoreReady = true;
  bgShoreImg.src = ""; // free decoded memory of full-size PNG
};
function drawBgShore() {
  if (!bgShoreReady) return;
  const dx = (bgShoreOffsetX - cam.x) | 0;
  const dy = (bgShoreOffsetY - cam.y) | 0;
  ctx.drawImage(bgShoreCanvas, dx, dy);
}
function isOnShoreOverlay(wx, wy) {
  if (!current.hasBgShore || !bgShoreReady || !bgShoreData) return false;
  const x = (wx - bgShoreOffsetX) | 0;
  const y = (wy - bgShoreOffsetY) | 0;
  if (x < 0 || y < 0 || x >= bgShoreCanvas.width || y >= bgShoreCanvas.height) return false;
  return bgShoreData[(y * bgShoreCanvas.width + x) * 4 + 3] > 0;
}
function isShoreOverlayInCamera() {
  if (!current.hasBgShore || !bgShoreReady || !bgShoreData) return false;
  const x0 = Math.max(0, Math.floor(cam.x - bgShoreOffsetX));
  const y0 = Math.max(0, Math.floor(cam.y - bgShoreOffsetY));
  const x1 = Math.min(bgShoreCanvas.width, Math.ceil(cam.x + canvas.width - bgShoreOffsetX));
  const y1 = Math.min(bgShoreCanvas.height, Math.ceil(cam.y + canvas.height - bgShoreOffsetY));
  if (x0 >= x1 || y0 >= y1) return false;
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      if (bgShoreData[(y * bgShoreCanvas.width + x) * 4 + 3] > 0) return true;
    }
  }
  return false;
}
const col = makeColStore();
const MOBILE_MAP_CHUNK = 512;
const MOBILE_MAP_CACHE_LIMIT = 12;
let mapChunkCache = new WeakMap();
const afloFxSceneCanvas = document.createElement("canvas");
afloFxSceneCanvas.width = CONFIG.BASE_W;
afloFxSceneCanvas.height = CONFIG.BASE_H;
const afloFxSceneCtx = afloFxSceneCanvas.getContext("2d");
const afloFxTintCanvas = document.createElement("canvas");
afloFxTintCanvas.width = CONFIG.BASE_W;
afloFxTintCanvas.height = CONFIG.BASE_H;
const afloFxTintCtx = afloFxTintCanvas.getContext("2d");
const pageTurnPrevCanvas = document.createElement("canvas");
pageTurnPrevCanvas.width = CONFIG.BASE_W;
pageTurnPrevCanvas.height = CONFIG.BASE_H;
const pageTurnPrevCtx = pageTurnPrevCanvas.getContext("2d");

// ---- Mobile device detection ----
const IS_MOBILE_DEVICE = navigator.maxTouchPoints > 0 || /Mobi|Android/i.test(navigator.userAgent);

// ---- Shrine state ----
let shrineMode  = false;
let shrineFade  = 0;      // 0.0 (normal) → 1.0 (shrine)
let shrineTriggerActive = false; // 踏み続けている間は再発火しない
const SHRINE_FADE_SPEED = 1 / 6; // ~6フレームでフェード完了（重い遷移区間を短縮）
// モバイル用：白フラッシュで瞬時スイッチ
let shrineWhite = { phase: "off", alpha: 0, targetMode: false }; // phase: 'off'|'fade-in'|'fade-out'
let redScreenStart = -1;
let _shakeUntil = 0;
let _shakeIntensity = 3;
let _spaceBossRantShake = false;
let redScreenOnEnd = null;
const RED_TO_BLACK_MS = 4000;
const SHADOW_W = 130;
let seaholeCutscene = { active: false, shadowX: BASE_W, charOffsetX: 0 };
let orcaRide = { active: false, startMs: 0, durationMs: 15000, ending: false };
let mechaEvolution = { active: false, phase: "idle", startMs: 0, fromImg: null, toImg: null };
let theaterScene = { active: false, startMs: 0, exitWaitStartMs: 0, phase: "intro", messageShown: false };
let kakoMovieScene = { active: false, startMs: 0, exitWaitStartMs: 0, phase: "intro", messageShown: false };
let gateWarpFx = null;
const RAIN_DROP_COUNT = IS_MOBILE_DEVICE ? 48 : 84;
const RAIN_DURATION_MS = 60000;
let rainScene = {
  active: false,
  untilMs: 0,
  questAtMs: 0,
  questDone: false,
  drops: Array.from({ length: RAIN_DROP_COUNT }, () => ({ x: 0, y: 0, len: 0, speed: 0 })),
};

function seedRainDrops() {
  for (const d of rainScene.drops) {
    d.x = Math.random() * (BASE_W + 32) - 16;
    d.y = Math.random() * (BASE_H + 32) - 16;
    d.len = 7 + Math.random() * 9;
    d.speed = 3.4 + Math.random() * 2.4;
  }
}

function startRainScene(now) {
  rainScene.active = true;
  rainScene.untilMs = now + RAIN_DURATION_MS;
  rainScene.questAtMs = now + 1000;
  rainScene.questDone = false;
  seedRainDrops();
  startRainLoop();
}

function updateRainScene(now) {
  if (!rainScene.active) return;
  if (now >= rainScene.untilMs) {
    rainScene.active = false;
    stopRainLoop();
    return;
  }
  if (current.id !== "outdoor") return;
  if (!rainScene.questDone && now >= rainScene.questAtMs) {
    rainScene.questDone = true;
    achieveQuest("24");
  }

  for (const d of rainScene.drops) {
    d.y += d.speed;
    if (d.y > BASE_H + 12) {
      d.x = Math.random() * (BASE_W + 24) - 12;
      d.y = -12 - Math.random() * 28;
      d.len = 7 + Math.random() * 9;
      d.speed = 3.4 + Math.random() * 2.4;
    }
  }
}

function drawRainScene(tt) {
  if (!rainScene.active || current.id !== "outdoor") return;

  const remaining = Math.max(0, rainScene.untilMs - tt);
  const fade = Math.min(1, remaining / 1800);
  ctx.save();
  ctx.globalAlpha = 0.14 * fade;
  ctx.fillStyle = "#102030";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = `rgba(190,220,255,${0.28 * fade})`;
  ctx.lineWidth = 1;
  for (const d of rainScene.drops) {
    ctx.beginPath();
    ctx.moveTo(d.x | 0, d.y | 0);
    ctx.lineTo(d.x | 0, (d.y - d.len) | 0);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.06 * fade;
  ctx.fillStyle = "#9fc2ff";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.restore();
}

function drawCenteredChar(img, x, y, scale = 4, frame = 0) {
  if (!img?.naturalWidth) return;
  const spr = 16;
  const w = spr * scale;
  const h = spr * scale;
  ctx.drawImage(img, frame * spr, 0, spr, spr, (x - w / 2) | 0, (y - h / 2) | 0, w | 0, h | 0);
}

function drawCenteredCharRotated(img, x, y, scale = 1, frame = 0, rotation = 0) {
  if (!img?.naturalWidth) return;
  const spr = 16;
  const w = spr * scale;
  const h = spr * scale;
  ctx.save();
  ctx.translate(x | 0, y | 0);
  ctx.rotate(rotation);
  ctx.drawImage(img, frame * spr, 0, spr, spr, (-w / 2) | 0, (-h / 2) | 0, w | 0, h | 0);
  ctx.restore();
}

function startSpaceBossMoonScene() {
  interactionSession.begin();
  input.lock();
  spaceBossWhiteReunion = null;
  spaceBossMoonScene = {
    startMs: nowMs(),
    stars: Array.from({ length: 120 }, () => ({
      x: Math.random() * BASE_W,
      y: Math.random() * BASE_H,
      r: Math.random() < 0.16 ? 2 : 1,
      a: 0.28 + Math.random() * 0.72,
      phase: Math.random() * Math.PI * 2,
    })),
  };
}

function quadPoint(a, b, c, t) {
  const mt = 1 - t;
  return mt * mt * a + 2 * mt * t * b + t * t * c;
}

function drawSpaceBossMoonScene(tt) {
  const scene = spaceBossMoonScene;
  if (!scene) return;
  const elapsed = tt - scene.startMs;
  ctx.save();
  ctx.fillStyle = "#02040d";
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  for (const s of scene.stars || []) {
    const tw = 0.55 + 0.45 * Math.sin(elapsed / 720 + s.phase);
    ctx.globalAlpha = s.a * tw;
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x | 0, s.y | 0, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  const moonX = -22;
  const moonY = BASE_H - 70;
  const moonSize = 96;
  if (SPRITES.moon?.naturalWidth > 0) {
    ctx.drawImage(SPRITES.moon, moonX, moonY, moonSize, moonSize);
  } else {
    ctx.fillStyle = "#d8d8d0";
    ctx.beginPath();
    ctx.arc(moonX + moonSize / 2, moonY + moonSize / 2, moonSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const local = elapsed - 500;
  const p = Math.min(1, Math.max(0, local / 2300));
  if (local >= 0 && local <= 2600) {
    const x0 = -18, y0 = BASE_H - 66;
    const x1 = 62, y1 = 28;
    const x2 = BASE_W + 24, y2 = 44;
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 18; i += 1) {
      const tp = Math.max(0, p - i * 0.012);
      const alpha = (1 - i / 18) * Math.sin(Math.min(1, p) * Math.PI) * 0.85;
      if (tp <= 0 || alpha <= 0) continue;
      const x = quadPoint(x0, x1, x2, tp);
      const y = quadPoint(y0, y1, y2, tp);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = i < 3 ? "#ffffff" : "#8fdfff";
      ctx.fillRect(x | 0, y | 0, i < 3 ? 3 : 2, i < 3 ? 3 : 1);
    }
    const hx = quadPoint(x0, x1, x2, p);
    const hy = quadPoint(y0, y1, y2, p);
    ctx.globalAlpha = Math.sin(Math.min(1, p) * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fillRect((hx - 2) | 0, (hy - 2) | 0, 4, 4);
  }

  const blackoutP = Math.max(0, Math.min(1, (elapsed - 5200) / 1400));
  if (blackoutP > 0) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = blackoutP * blackoutP * (3 - 2 * blackoutP);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }
  ctx.restore();
}

function updateSpaceBossMoonScene(tt) {
  const scene = spaceBossMoonScene;
  if (!scene) return;
  const elapsed = tt - scene.startMs;
  if (!scene.seasideBgmStarted && elapsed >= 6600) {
    scene.seasideBgmStarted = true;
    startSeasideBgm(3200);
  }
  if (!scene.outdoorStarted && elapsed >= 9800) {
    scene.outdoorStarted = true;
    startSpaceBossOutdoorEpilogueScene();
  }
}

function startSpaceBossOutdoorEpilogueScene() {
  interactionSession.begin();
  input.lock();
  spaceBossMoonScene = null;
  setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
  partyVisible = false;
  loadMap("outdoor", { spawnAt: { x: 2151 - 8, y: 2578 - 8 }, skipBgm: true });
  spaceBossOutdoorEpilogue = {
    fadeStartMs: null,
    fadeMs: 5200,
    waitStartMs: null,
    waitMs: 5000,
  };
}

function debugJumpToSpaceBossOutdoorEpilogue() {
  input.lock();
  ending.stop();
  bgmCtl.audio.loop = true;
  bgmCtl.setOverride("about:blank");
  startSeasideBgm(1000);
  startSpaceBossOutdoorEpilogueScene();
}

function updateSpaceBossOutdoorEpilogue(tt) {
  const scene = spaceBossOutdoorEpilogue;
  if (!scene) return;
  if (!mapReady) return;
  if (scene.fadeStartMs == null) {
    scene.fadeStartMs = tt;
    updateCam();
  }
  if (scene.waitStartMs == null && tt - scene.fadeStartMs >= scene.fadeMs) {
    scene.waitStartMs = tt;
  }
  if (!scene.creditsStarted && scene.waitStartMs != null && tt - scene.waitStartMs >= scene.waitMs) {
    scene.creditsStarted = true;
    interactionSession.end();
    letterbox.reset();
    input.clear();
    input.unlock();
    ending.startCredits(tt);
  }
}

function drawSpaceBossOutdoorEpilogueOverlay(tt) {
  const scene = spaceBossOutdoorEpilogue;
  if (!scene) return;
  const start = scene.fadeStartMs ?? tt;
  const p = Math.max(0, Math.min(1, (tt - start) / scene.fadeMs));
  const eased = p * p * (3 - 2 * p);
  const alpha = 1 - eased;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawSpaceBossOutdoorDeadParty() {
  if (!spaceBossOutdoorEpilogue) return;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const bodies = [
    { img: SPRITES.p1_dead, x: cx + 52, y: cy - 30, rot: -Math.PI / 2 },
    { img: SPRITES.p2_dead, x: cx + 78, y: cy - 6, rot: -Math.PI / 2 },
    { img: SPRITES.p3_dead, x: cx + 28, y: cy + 12, rot: -Math.PI / 2 },
    { img: SPRITES.p4_dead, x: cx + 61, y: cy + 28, rot: -Math.PI / 2 },
  ];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const body of bodies) {
    if (!body.img?.naturalWidth) continue;
    ctx.save();
    ctx.translate(body.x | 0, body.y | 0);
    ctx.rotate(body.rot);
    ctx.drawImage(body.img, -8, -8, 16, 16);
    ctx.restore();
  }
  ctx.restore();
}

function spaceBossWhiteReunionLayout() {
  const cx = BASE_W / 2;
  const partyY = BASE_H / 2 - 4;
  const ssY = partyY - 32;
  return {
    cx,
    partyY,
    ssY,
    ss: { x: cx, y: ssY },
    party: [
      { key: "p1", img: SPRITES.p1, x: cx - 30, y: partyY, vx: -136, vy: -92, rot: -9.6 },
      { key: "p2", img: SPRITES.p2, x: cx - 10, y: partyY, vx: -80, vy: 128, rot: 8.8 },
      { key: "p3", img: SPRITES.p3, x: cx + 10, y: partyY, vx: 86, vy: -118, rot: -8.2 },
      { key: "p4", img: SPRITES.p4, x: cx + 30, y: partyY, vx: 142, vy: 96, rot: 9.4 },
    ],
  };
}

function drawSpaceBossWhiteReunionScene(tt) {
  const start = spaceBossWhiteReunion?.startMs || tt;
  const fadeIn = Math.max(0, Math.min(1, (tt - start) / 1100));
  const alpha = fadeIn * fadeIn * (3 - 2 * fadeIn);
  const layout = spaceBossWhiteReunionLayout();
  const fx = spaceBossWhiteReunion || {};
  const heartFx = fx.heartFx;
  const waveFx = fx.waveFx;
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  for (const m of layout.party) {
    if (waveFx) continue;
    ctx.fillRect((m.x - 6) | 0, (m.y + 8) | 0, 12, 2);
  }
  ctx.fillRect((layout.ss.x - 7) | 0, (layout.ss.y + 8) | 0, 14, 2);
  drawCenteredChar(SPRITES.spacesisters1, layout.ss.x, layout.ss.y, 1, 0);
  if (waveFx) {
    const p = Math.max(0, Math.min(1, (tt - waveFx.startMs) / waveFx.duration));
    const eased = p * p * (3 - 2 * p);
    for (const m of layout.party) {
      const spin = m.rot * eased;
      const lift = Math.sin(p * Math.PI) * 18;
      drawCenteredCharRotated(m.img, m.x + m.vx * eased, m.y + m.vy * eased - lift, 1, Math.floor(tt / 110) % 2, spin);
    }
  } else {
    for (const m of layout.party) drawCenteredChar(m.img, m.x, m.y, 1, 0);
  }

  if (heartFx) {
    const elapsed = tt - heartFx.startMs;
    const flashP = Math.max(0, Math.min(1, elapsed / 420));
    const moveP = Math.max(0, Math.min(1, (elapsed - 320) / 1350));
    const eased = 1 - Math.pow(1 - moveP, 3);
    const from = { x: layout.party[0].x, y: layout.party[0].y - 14 };
    const to = { x: layout.ss.x, y: layout.ss.y - 9 };
    const x = from.x + (to.x - from.x) * eased;
    const y = from.y + (to.y - from.y) * eased - Math.sin(moveP * Math.PI) * 8;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = (1 - flashP) * 0.68;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.globalAlpha = 0.32 + Math.sin(tt / 80) * 0.08;
    ctx.fillStyle = "#ff4a4a";
    ctx.beginPath();
    ctx.arc(x, y, 12 + Math.sin(tt / 120) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawIronHeartMark(x, y, tt);
  }

  if (waveFx) {
    const p = Math.max(0, Math.min(1, (tt - waveFx.startMs) / waveFx.duration));
    const radius = 6 + p * 150;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p);
    ctx.strokeStyle = "#f7f2e8";
    ctx.lineWidth = 2 + p * 6;
    ctx.beginPath();
    ctx.arc(layout.ss.x, layout.ss.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = Math.max(0, 0.36 * (1 - p));
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(layout.ss.x, layout.ss.y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawTheaterScene(tt) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  const img = SPRITES.movie;
  if (!img?.naturalWidth) return;

  const elapsed = tt - theaterScene.startMs;
  const frameDur = 320;
  const framePhase = (elapsed % frameDur) / frameDur;
  const frame = ((elapsed / frameDur) | 0) % 2;
  const nextFrame = (frame + 1) % 2;
  const fadeIn = Math.min(1, elapsed / 2200);
  const fadeAlpha = fadeIn * fadeIn * (3 - 2 * fadeIn);
  const frameW = (img.naturalWidth / 2) | 0;
  const frameH = img.naturalHeight | 0;
  const cx = BASE_W * 0.5;
  const cy = BASE_H * 0.5;
  const jitterX = Math.sin(tt / 170) * 0.9 + Math.sin(tt / 43) * 0.45;
  const jitterY = Math.sin(tt / 210 + 0.7) * 0.7 + Math.sin(tt / 57) * 0.35;
  const x = cx + jitterX;
  const y = cy + jitterY;
  const w = BASE_W;
  const h = Math.round(BASE_W * (frameH / frameW));
  const trails = 4;
  const projectorFlicker = 0.9 + Math.sin(tt / 41) * 0.06 + Math.sin(tt / 13) * 0.035;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = trails; i >= 1; i--) {
    const tx = x - i * 0.7;
    const alpha = 0.08 * (1 - i / (trails + 1));
    const trailFrame = (frame + i) % 2;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, trailFrame * frameW, 0, frameW, frameH, (tx - w / 2) | 0, (y - h / 2) | 0, w | 0, h | 0);
  }
  ctx.restore();

  const blurMix = Math.max(0, 1 - Math.abs(framePhase - 0.5) / 0.5);
  const blurAlpha = blurMix * 0.62;
  const blurOffset = 4 + blurMix * 6;

  ctx.save();
  ctx.globalAlpha = 0.12 * fadeAlpha;
  ctx.fillStyle = "#7ee6ff";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,0.28)";
  ctx.shadowBlur = 26;
  ctx.globalAlpha = projectorFlicker * fadeAlpha;
  if (blurAlpha > 0.001) {
    ctx.globalAlpha = blurAlpha * 0.72 * fadeAlpha;
    ctx.drawImage(img, nextFrame * frameW, 0, frameW, frameH, (x - w / 2 - blurOffset) | 0, (y - h / 2) | 0, w | 0, h | 0);
    ctx.drawImage(img, nextFrame * frameW, 0, frameW, frameH, (x - w / 2 + blurOffset) | 0, (y - h / 2) | 0, w | 0, h | 0);
    ctx.globalAlpha = blurAlpha * 0.48 * fadeAlpha;
    ctx.drawImage(img, nextFrame * frameW, 0, frameW, frameH, (x - w / 2 - blurOffset * 0.55) | 0, (y - h / 2) | 0, w | 0, h | 0);
    ctx.drawImage(img, nextFrame * frameW, 0, frameW, frameH, (x - w / 2 + blurOffset * 0.55) | 0, (y - h / 2) | 0, w | 0, h | 0);
    ctx.globalAlpha = (0.28 + blurAlpha * 0.3) * fadeAlpha;
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, (x - w / 2 - 2) | 0, (y - h / 2) | 0, w | 0, h | 0);
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, (x - w / 2 + 2) | 0, (y - h / 2) | 0, w | 0, h | 0);
  }
  ctx.globalAlpha = (1 - blurAlpha * 0.4) * projectorFlicker * fadeAlpha;
  ctx.drawImage(img, frame * frameW, 0, frameW, frameH, (x - w / 2) | 0, (y - h / 2) | 0, w | 0, h | 0);
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 20; i++) {
    const n = Math.sin(tt * 0.021 + i * 17.13);
    const px = ((n * 0.5 + 0.5) * BASE_W) | 0;
    const py = (((Math.sin(tt * 0.017 + i * 9.7) * 0.5 + 0.5) * BASE_H)) | 0;
    const a = 0.025 + ((i % 3) * 0.01);
    ctx.globalAlpha = a * fadeAlpha;
    ctx.fillStyle = "#fff";
    ctx.fillRect(px, py, 1, 1);
  }
  ctx.restore();

}

// ---- kako 恐竜ムービー ----
const DINO_W = 192, DINO_H = 180;
const DINO_APPEAR_MS  = 4000;  // 恐竜登場まで
const DINO_LINGER_MS  = 10000; // 去った後の余韻
const STEP_PX = 20;
const DINO_STEP_INTERVAL = 2800;
const DINO_BIRD_INTERVAL = 2500;
const DINO_WING_INTERVAL = 1800;

function drawDinoScene(tt) {
  const elapsed = tt - kakoMovieScene.startMs;
  const fadeIn = Math.min(1, elapsed / 1500);

  // 恐竜の歩行サイクル（着地タイミング計算）
  const dinoActive = elapsed >= DINO_APPEAR_MS;
  const dinoElapsed = elapsed - DINO_APPEAR_MS;
  const dinoExitSteps = (BASE_W + 40 + 160) / STEP_PX;
  const dinoExitMs = dinoExitSteps * DINO_STEP_INTERVAL;
  const dinoGone = dinoActive && dinoElapsed >= dinoExitMs;
  const fadeOut = dinoGone ? Math.max(0, 1 - (dinoElapsed - dinoExitMs) / DINO_LINGER_MS) : 1;
  const stepCycle = dinoActive ? ((elapsed - DINO_APPEAR_MS) % DINO_STEP_INTERVAL) / DINO_STEP_INTERVAL : 0;
  const landAt = 0.3 + 0.15;
  const landWindow = 0.1;
  const isLanding = dinoActive && stepCycle >= landAt && stepCycle < landAt + landWindow;
  const landT = isLanding ? (stepCycle - landAt) / landWindow : 1;
  const shakeAmt = isLanding ? (1 - landT) * 3 * fadeOut : 0;
  const shakeX = shakeAmt * Math.sin(tt * 0.3) | 0;
  const shakeY = shakeAmt | 0;

  ctx.save();
  if (dinoActive) ctx.translate(shakeX, shakeY);
  ctx.globalAlpha = fadeIn;

  // 空（緑がかった青）
  const skyGrad = ctx.createLinearGradient(0, 0, 0, BASE_H);
  skyGrad.addColorStop(0, "#5ab8a0");
  skyGrad.addColorStop(0.5, "#7dd4b8");
  skyGrad.addColorStop(1, "#a8e6cf");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  // 雲
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  const cw1 = 40 + Math.sin(tt / 3000) * 5;
  ctx.fillRect((30 + elapsed * 0.003) % (BASE_W + 60) - 30, 25, cw1 | 0, 8);
  ctx.fillRect((120 + elapsed * 0.005) % (BASE_W + 60) - 30, 15, 30, 6);
  ctx.fillRect((80 + elapsed * 0.002) % (BASE_W + 60) - 30, 40, 35, 7);

  // 火山シルエット（三角、てっぺん平ら、やや右寄り）
  ctx.fillStyle = "rgba(35,80,60,0.45)";
  ctx.beginPath();
  ctx.moveTo(60, BASE_H);
  ctx.lineTo(140, 85); ctx.lineTo(155, 85);
  ctx.lineTo(235, BASE_H);
  ctx.closePath(); ctx.fill();

  // 地面（ヤシの下に敷く）
  const treeY = BASE_H - 5;
  ctx.fillStyle = "#2e6b48";
  ctx.fillRect(0, treeY + 20, BASE_W, BASE_H - treeY);
  ctx.fillStyle = "#3a7a55";
  ctx.fillRect(0, treeY + 10, BASE_W, 14);

  // 恐竜（ヤシの奥）
  const dinoImg = SPRITES.dinosour;
  if (dinoImg?.naturalWidth && dinoActive) {
    const rise = 0.3, fall = 0.15;
    let liftPhase, moveInStep;
    if (stepCycle < rise) {
      const t = stepCycle / rise;
      const ease = t * t * (3 - 2 * t);
      liftPhase = ease;
      moveInStep = ease * 0.8;
    } else if (stepCycle < rise + fall) {
      const t = (stepCycle - rise) / fall;
      liftPhase = 1 - t;
      moveInStep = 0.8 + t * 0.2;
    } else {
      liftPhase = 0;
      moveInStep = 1.0;
    }
    const stepCount = (elapsed - DINO_APPEAR_MS) / DINO_STEP_INTERVAL;
    const fullSteps = Math.floor(stepCount);
    const dx = BASE_W + 40 - (fullSteps + moveInStep) * STEP_PX;
    const dy = treeY - 130;
    const bobY = liftPhase * -8;
    const tilt = liftPhase * 0.015;
    const dw = 144, dh = 128;
    ctx.globalAlpha = fadeIn;
    ctx.save();
    ctx.translate((dx + dw / 2) | 0, (dy + dh + bobY) | 0);
    ctx.rotate(tilt);
    ctx.drawImage(dinoImg, 0, 0, DINO_W, DINO_H, (-dw / 2) | 0, -dh, dw, dh);
    ctx.restore();
  }

  // ヤシの森（手前、恐竜を覆う）
  const yashiImg = SPRITES.yashi;
  if (yashiImg?.naturalWidth) {
    const yf = ((tt / 400) | 0) % 2;
    // 最奥の層（隙間埋め）
    ctx.globalAlpha = fadeIn * 0.4;
    for (let i = 0; i < 30; i++) {
      const tx = i * 9 - 10 + Math.sin(i * 3.1) * 3;
      const ty = treeY - 60 + Math.sin(i * 0.9 + 2.0) * 3;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 22, 44);
    }
    // 奥の層
    ctx.globalAlpha = fadeIn * 0.55;
    for (let i = 0; i < 26; i++) {
      const tx = i * 10 - 8 + Math.sin(i * 2.3) * 3;
      const ty = treeY - 70 + Math.sin(i * 1.3 + 0.5) * 3;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 28, 56);
    }
    // 中間層
    ctx.globalAlpha = fadeIn * 0.7;
    for (let i = 0; i < 28; i++) {
      const tx = i * 9 - 6 + Math.sin(i * 1.9 + 1.0) * 4;
      const ty = treeY - 80 + Math.sin(i * 1.7) * 4;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 34, 68);
    }
    // 手前層（大きめ、明るい）
    ctx.globalAlpha = fadeIn * 0.9;
    for (let i = 0; i < 24; i++) {
      const tx = i * 11 - 5 + Math.sin(i * 2.7 + 2.0) * 5;
      const ty = treeY - 92 + Math.sin(i * 1.1 + 0.8) * 5;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 42, 84);
    }
  }

  ctx.restore();

  // 双眼鏡オーバーレイ（常に不透明）
  const maskImg = SPRITES.sogankyo_mask;
  if (maskImg?.naturalWidth) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(maskImg, 0, 0, BASE_W, BASE_H);
    ctx.fillStyle = "rgb(20,20,20)";
    ctx.fillRect(0, 0, BASE_W, 4);
    ctx.fillRect(0, BASE_H - 4, BASE_W, 4);
    ctx.fillRect(0, 0, 4, BASE_H);
    ctx.fillRect(BASE_W - 4, 0, 4, BASE_H);
    ctx.restore();
  }

  // SE タイミング（着地に合わせる）
  const stepBeat = (elapsed / DINO_STEP_INTERVAL) | 0;
  const stepVol = dinoGone ? fadeOut : 1;
  if (stepVol > 0.05 && isLanding && stepBeat !== kakoMovieScene._lastStep) {
    kakoMovieScene._lastStep = stepBeat;
    playDinoStep(stepVol);
  }
  const birdBeat = (elapsed / DINO_BIRD_INTERVAL) | 0;
  if (birdBeat !== kakoMovieScene._lastBird) {
    kakoMovieScene._lastBird = birdBeat;
    playBirdCall();
  }
  const wingBeat = (elapsed / DINO_WING_INTERVAL) | 0;
  if (wingBeat !== kakoMovieScene._lastWing && elapsed > 500) {
    kakoMovieScene._lastWing = wingBeat;
    playWingFlap();
  }
}

function startMechaEvolutionScene() {
  interactionSession.begin();
  const skinLevel = STATE.flags.skinLevel | 0;
  const fromImg = skinLevel === 2 ? SPRITES.p1_t2 : skinLevel === 1 ? SPRITES.p1_t1 : SPRITES.p1;
  setBgmOverrideSafe("assets/audio/bgm_select.mp3");
  mechaEvolution = {
    active: true,
    phase: "queued",
    startMs: nowMs(),
    fromImg,
    toImg: SPRITES.mecha_natsumi,
  };
}

function drawMechaEvolutionScene(tt) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  const cx = BASE_W >> 1;
  const cy = 92;
  const fromImg = mechaEvolution.fromImg || SPRITES.p1;
  const toImg = mechaEvolution.toImg || SPRITES.mecha_natsumi;

  if (mechaEvolution.phase === "queued") {
    // 黒背景だけ。フェード明け後にメッセージへ進む。
  } else if (mechaEvolution.phase === "message") {
    const bob = Math.sin(tt / 220) * 1.5;
    drawCenteredChar(fromImg, cx, cy + bob, 4);
  } else if (mechaEvolution.phase === "result" || mechaEvolution.phase === "done") {
    drawCenteredChar(toImg, cx, cy, 4.55, 0);
  } else {
    const elapsed = tt - mechaEvolution.startMs;
    const p = Math.min(1, elapsed / 2200);
    const flash = Math.max(0, Math.sin(elapsed / 45)) * (1 - p * 0.4);
    const ringR = 20 + p * 34 + Math.sin(elapsed / 80) * 2;
    const scale = 4 + Math.sin(elapsed / 70) * 0.35 + p * 0.55;
    const useMecha = elapsed > 1300 || (Math.floor(elapsed / 90) % 2 === 1);
    const img = useMecha ? toImg : fromImg;

    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + flash * 0.35})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, ringR + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    drawCenteredChar(img, cx, cy, scale, 0);

    if (flash > 0.15) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.75, flash * 0.7);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }
  }

  dialog.draw(ctx);
}

function drawAfloClubFx(tt) {
  const pulse = ((tt / 220) | 0) % 2;
  const color = pulse === 0 ? "rgba(178, 70, 255, 0.22)" : "rgba(80, 255, 120, 0.22)";
  const t = tt * 0.00028;

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const cx = ((current.bgW / 2) - cam.x) | 0;
  const cy = (((current.bgH / 2) - 100) - cam.y) | 0;
  const diskRx = BASE_W * 1.12 + 100;
  const diskRy = BASE_H * 1.08 + 100;
  for (let ring = 0; ring < 8; ring++) {
    const count = 16 + ring * 6;
    const rrX = diskRx * (0.22 + ring * 0.10);
    const rrY = diskRy * (0.20 + ring * 0.10);
    for (let i = 0; i < count; i++) {
      const a0 = (Math.PI * 2 * i) / count + t * (1 + ring * 0.04) + ring * 0.2;
      const wobble = Math.sin(t * 2.1 + i * 0.7 + ring) * 1.5;
      const x = cx + Math.cos(a0) * (rrX + wobble);
      const y = cy + Math.sin(a0) * (rrY + wobble * 0.6);
      ctx.fillStyle = pulse === 0 ? "rgba(255,230,255,0.28)" : "rgba(230,255,240,0.28)";
      ctx.beginPath();
      ctx.arc(x, y, ring < 2 ? 2.2 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 4; i++) {
    const hue = pulse === 0 ? 290 : 130;
    const x = ((current.bgW / 2) - cam.x) + Math.sin(t * (1.3 + i * 0.18) + i * 1.7) * (70 + i * 24);
    const y = (((current.bgH / 2) - 140) - cam.y) + Math.cos(t * (1.1 + i * 0.14) + i) * 14;
    const beamW = 26 + i * 8;
    const beamH = 120 + i * 24;
    const g = ctx.createRadialGradient(x, y, 0, x, y, beamH);
    g.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.12)`);
    g.addColorStop(0.35, `hsla(${hue + 30}, 100%, 70%, 0.08)`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 0.9 + i) * 0.18);
    ctx.fillRect(-beamW / 2, -beamH / 2, beamW, beamH);
    ctx.restore();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#fff";
  for (let y = ((tt / 45) | 0) % 5; y < BASE_H; y += 5) {
    ctx.fillRect(0, y, BASE_W, 1);
  }
  ctx.restore();
}

function applyAfloClubRgbShift() {
  const kickMs = getAfloClubKickPulseMs();
  const kickAmt = Math.max(0, 1 - kickMs / 120);
  if (kickAmt <= 0) return;

  const off = Math.max(1, Math.ceil(kickAmt * 2));
  afloFxSceneCtx.clearRect(0, 0, BASE_W, BASE_H);
  afloFxSceneCtx.drawImage(canvas, 0, 0, BASE_W, BASE_H);

  function drawShift(dx, color, alpha) {
    afloFxTintCtx.clearRect(0, 0, BASE_W, BASE_H);
    afloFxTintCtx.globalCompositeOperation = "source-over";
    afloFxTintCtx.drawImage(afloFxSceneCanvas, 0, 0);
    afloFxTintCtx.globalCompositeOperation = "source-atop";
    afloFxTintCtx.fillStyle = color;
    afloFxTintCtx.fillRect(0, 0, BASE_W, BASE_H);
    afloFxTintCtx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha;
    ctx.drawImage(afloFxTintCanvas, dx, 0);
    ctx.restore();
  }

  drawShift(-off, "rgba(255,60,160,1)", 0.16 * kickAmt);
  drawShift( off, "rgba(80,255,255,1)", 0.16 * kickAmt);
}
let shootingDoorCooldown = 0;
let shootingKnockback = null;
let shootingDoorMarkLastMs = 0;
let shootingDifficultyUi = { active: false, index: 1, openedAt: 0 };

// ---- ベンチ・噴水トリガー ----
const BENCH_TRIGGER    = { x: 402,  y: 2443, w: 40, h: 32 }; // 教会ベンチ (422,2459)
const FOUNTAIN_TRIGGER = { x: 1972, y: 1447, w: 160, h: 64 }; // 噴水 (2052,1479)
const SHOVEL_DIG_TRIGGER = { x: 1952, y: 2190, w: 16, h: 16 }; // around 1960,2198
const TIMEMACHINE_TALK_TRIGGER = { x: 2641, y: 121, w: 3, h: 5 };
const TIMEMACHINE_WAIT_TRIGGER_A = { x: 2616, y: 116, w: 24, h: 12 };
const TIMEMACHINE_WAIT_TRIGGER_B = { x: 2645, y: 116, w: 24, h: 12 };
let benchEnterMs    = 0; // プレイヤーが入った時刻（0=外）
let fountainEnterMs = 0;
let timeMachineEnterMsA = 0;
let timeMachineEnterMsB = 0;
let heightLevel = "ground"; // "ground" | "upper"
let exclamations = []; // { sx, sy, startMs, duration, char?, color? }
let dashDust = []; // { x, y, vx, vy, born, life, size }
let dashDustLastMs = 0;
let chinanagoActivated = false;
let cactusActivated    = false;
const SHRINE_WHITE_SPEED = 1 / 8; // ~8フレームでフェードイン/アウト

// ---- Water sea overlay (color-masked) ----
const seaTempCanvas = document.createElement("canvas");
seaTempCanvas.width  = CONFIG.BASE_W;
seaTempCanvas.height = CONFIG.BASE_H;
const seaTempCtx = seaTempCanvas.getContext("2d");
let waterMaskCanvas = null;

// A: スパークルキャッシュ（3フレームに1回だけ再描画）
const seaSparkleCanvas = document.createElement("canvas");
seaSparkleCanvas.width  = CONFIG.BASE_W;
seaSparkleCanvas.height = CONFIG.BASE_H;
const seaSparkleCtx = seaSparkleCanvas.getContext("2d");
let seaSparkleFrame = 0;

function buildFullWaterMask(w, h) {
  const mc = document.createElement("canvas");
  mc.width = w;
  mc.height = h;
  const mx = mc.getContext("2d");
  mx.fillStyle = "#fff";
  mx.fillRect(0, 0, w, h);
  waterMaskCanvas = mc;
}

// Resize canvas (and seaTempCanvas) when switching between title and gameplay
function setGameResolution(w, h) {
  canvas.width = w;
  canvas.height = h;
  seaTempCanvas.width = w;
  seaTempCanvas.height = h;
  seaSparkleCanvas.width = w;
  seaSparkleCanvas.height = h;
  fitCanvas();
}

function startPhoneBrawl(onDone, options = {}) {
  if (phoneBrawl.isActive()) return;
  interactionSession.end();
  stopChaosMetalBgm();
  pushBgmOverride("about:blank", { safe: false });
  setGameResolution(PHONE_BRAWL_W, PHONE_BRAWL_H);
  phoneBrawl.start((result) => {
    popBgmOverride({ safe: false });
    setGameResolution(BASE_W, BASE_H);
    input.clear();
    if (typeof onDone === "function") {
      interactionSession.begin();
      interactionSession.trackSync(() => onDone(result));
    }
  }, options);
}

function startDivingMinigame(onDone) {
  if (diving.isActive()) return;
  pushBgmOverride("about:blank", { safe: false });
  setGameResolution(DIVE_W, DIVE_H);
  startDivingBgm();
  interactionSession.end();
  diving.start(() => {
    stopDivingBgm();
    popBgmOverride({ safe: false });
    setGameResolution(BASE_W, BASE_H);
    if (typeof onDone === "function") {
      interactionSession.begin();
      letterbox.snapAuto(true);
      interactionSession.trackSync(() => onDone());
    }
  });
}

function startSpaceBossFirstBattle() {
  if (current.id !== "space_boss" || phoneBrawl.isActive()) return;
  sbLastBattleStarted = true;
  for (const act of actors) {
    if (act.name?.startsWith("sb_party_")) act.hidden = true;
  }
  input.unlock();
  startPhoneBrawl((result) => {
    if (current.id !== "space_boss") return;
    stopHeartbeat();
    startSpaceBossReunionEvent();
  }, { playerDeckIds: "n2_msitp", giveUpAction: "interventionReturn", internalBgm: false });
}

function startSpaceBossFirstBattleGameOverDebug() {
  if (current.id !== "space_boss" || phoneBrawl.isActive()) return;
  sbLastBattleStarted = true;
  restoreSpaceBossPreBattleLayout();
  for (const act of actors) {
    if (act.name?.startsWith("sb_party_")) act.hidden = true;
  }
  input.unlock();
  startPhoneBrawl((result) => {
    if (current.id !== "space_boss") return;
    stopHeartbeat();
    startSpaceBossReunionEvent();
  }, {
    playerDeckIds: "n2_msitp",
    giveUpAction: "interventionReturn",
    internalBgm: false,
    startAtGameOver: "intervention",
  });
}

function startSpaceBossBossSpeech(onDone) {
  if (current.id !== "space_boss") {
    onDone?.();
    return;
  }
  input.lock();
  _spaceBossRantShake = false;
  const now = nowMs();
  sbBossType = {
    lines: SPACE_BOSS_BOSS_LINES,
    lineIndex: 0,
    charIndex: 0,
    lastCharAt: now - SPACE_BOSS_TYPE_CHAR_MS,
    lineDoneAt: 0,
    onDone,
  };
}

function getSpaceBossTypeLine(fx) {
  if (fx.phase === "draft" || fx.phase === "erase") return SPACE_BOSS_BOSS_RETYPE_DRAFT;
  if (fx.phase === "final") return SPACE_BOSS_BOSS_RETYPE_FINAL;
  if (fx.phase === "after") return SPACE_BOSS_BOSS_AFTER_LINE;
  if (fx.phase === "mimic1") return SPACE_BOSS_BOSS_MIMIC_LINES[0];
  if (fx.phase === "mimic2") return SPACE_BOSS_BOSS_MIMIC_LINES[1];
  if (fx.phase === "like") return SPACE_BOSS_BOSS_LIKE_LINE;
  if (fx.phase === "know") return SPACE_BOSS_BOSS_KNOW_LINE;
  if (fx.phase === "glitchPreface") return SPACE_BOSS_BOSS_GLITCH_PREFACE_LINES[fx.prefaceIndex | 0] || "";
  if (fx.phase === "glitchChoice") return SPACE_BOSS_BOSS_GLITCH_QUESTION;
  if (fx.phase === "choiceRant") return SPACE_BOSS_BOSS_CHOICE_RANT_LINES[fx.rantIndex | 0] || "";
  if (fx.phase === "postChoiceTransition") return fx.visibleLine || "";
  return fx.lines[fx.lineIndex] || "";
}

function updateSpaceBossBossSpeech(t) {
  if (!sbBossType) return;
  const fx = sbBossType;
  if (fx.phase === "postChoiceTransition") {
    if (!fx.transitionStarted && t >= fx.transitionAt) {
      fx.transitionStarted = true;
      const done = fx.onDone;
      sbBossType = null;
      input.lock();
      _spaceBossRantShake = false;
      startBattleTransition(() => {
        bgmCtl.unlock();
        bgmCtl.setOverride("about:blank");
        stopChaosMetalBgm();
        startHeartbeat(68, BGM_VOLUME);
        if (typeof done === "function") done();
        else input.unlock();
      });
    }
    return;
  }

  const line = getSpaceBossTypeLine(fx);
  const chars = [...line];
  if (fx.phase === "erase") {
    if (t - fx.lastCharAt >= SPACE_BOSS_TYPE_BACKSPACE_MS) {
      fx.charIndex = Math.max(0, fx.charIndex - 1);
      fx.lastCharAt = t;
      playAlienTypingNoise(900 + fx.charIndex);
      if (fx.charIndex <= 0) {
        fx.phase = "final";
        fx.lineDoneAt = 0;
        fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      }
    }
    return;
  }

  if (fx.charIndex < chars.length) {
    if (t - fx.lastCharAt >= SPACE_BOSS_TYPE_CHAR_MS) {
      const ch = chars[fx.charIndex];
      fx.charIndex += 1;
      fx.lastCharAt = t;
      if (ch !== " " && ch !== "　") {
        playAlienTypingNoise(fx.charIndex + fx.lineIndex * 17);
      }
    }
    return;
  }

  if (!fx.lineDoneAt) fx.lineDoneAt = t;
  if (fx.phase === "draft") {
    if (t - fx.lineDoneAt < SPACE_BOSS_TYPE_RETYPE_PAUSE_MS) return;
    fx.phase = "erase";
    fx.charIndex = chars.length;
    fx.lineDoneAt = 0;
    fx.lastCharAt = t;
    return;
  }
  if (fx.phase === "mimic1") {
    if (t - fx.lineDoneAt < SPACE_BOSS_TYPE_LINE_HOLD_MS) return;
    fx.phase = "mimic2";
    fx.charIndex = 0;
    fx.lineDoneAt = 0;
    fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
    return;
  }
  if (fx.phase === "glitchPreface") {
    if (t - fx.lineDoneAt < SPACE_BOSS_TYPE_LINE_HOLD_MS) return;
    fx.prefaceIndex = (fx.prefaceIndex | 0) + 1;
    fx.charIndex = 0;
    fx.lineDoneAt = 0;
    fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
    if (fx.prefaceIndex >= SPACE_BOSS_BOSS_GLITCH_PREFACE_LINES.length) {
      fx.phase = "glitchChoice";
      fx.prefaceIndex = 0;
    }
    return;
  }
  if (fx.phase === "choiceRant") {
    if (t - fx.lineDoneAt < SPACE_BOSS_TYPE_RANT_HOLD_MS) return;
    fx.rantIndex = (fx.rantIndex | 0) + 1;
    if (fx.rantIndex >= SPACE_BOSS_BOSS_CHOICE_RANT_LINES.length) {
      fx.phase = "postChoiceTransition";
      fx.visibleLine = SPACE_BOSS_BOSS_CHOICE_RANT_LINES[SPACE_BOSS_BOSS_CHOICE_RANT_LINES.length - 1];
      fx.charIndex = [...fx.visibleLine].length;
      fx.lineDoneAt = 0;
      fx.transitionAt = t + SPACE_BOSS_TYPE_TRANSITION_HOLD_MS;
      return;
    }
    fx.charIndex = 0;
    fx.lineDoneAt = 0;
    fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
    return;
  }

  const isFinalMainLine = !fx.phase && fx.lineIndex >= fx.lines.length - 1;
  const isFinalRetypedLine = fx.phase === "final";
  const isAfterLine = fx.phase === "after";
  const isMimicFinalLine = fx.phase === "mimic2";
  const isLikeLine = fx.phase === "like";
  const isKnowLine = fx.phase === "know";
  const isGlitchChoiceLine = fx.phase === "glitchChoice";
  if (isGlitchChoiceLine) {
    if (!fx.waitingChoice) {
      fx.waitingChoice = true;
      fx.choiceIndex = 0;
      input.unlock();
      input.clear();
    }
    const prevChoice = fx.choiceIndex | 0;
    if (input.consume("ArrowLeft") || input.consume("ArrowUp")) fx.choiceIndex = Math.max(0, prevChoice - 1);
    if (input.consume("ArrowRight") || input.consume("ArrowDown")) fx.choiceIndex = Math.min(SPACE_BOSS_BOSS_CHOICES.length - 1, (fx.choiceIndex | 0) + 1);
    if ((fx.choiceIndex | 0) !== prevChoice) {
      playCursor();
    }
    if (input.consume("x")) fx.choiceIndex = 1;
    else if (!input.consume("z")) return;
    playConfirm();
    fx.choiceResult = SPACE_BOSS_BOSS_CHOICES[fx.choiceIndex];
    _spaceBossRantShake = true;
    input.lock();
    fx.phase = "choiceRant";
    fx.rantIndex = 0;
    fx.charIndex = 0;
    fx.lineDoneAt = 0;
    fx.waitingChoice = false;
    fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
    return;
  }
  if (isFinalMainLine || isFinalRetypedLine || isAfterLine || isMimicFinalLine || isLikeLine || isKnowLine) {
    if (!fx.waitingForAdvance) {
      fx.waitingForAdvance = true;
      input.unlock();
      input.clear();
    }
    if (!input.consume("z")) return;
    if (isFinalMainLine) {
      input.lock();
      fx.phase = "draft";
      fx.charIndex = 0;
      fx.lineDoneAt = 0;
      fx.waitingForAdvance = false;
      fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      return;
    }
    if (isFinalRetypedLine) {
      input.lock();
      fx.phase = "after";
      fx.charIndex = 0;
      fx.lineDoneAt = 0;
      fx.waitingForAdvance = false;
      fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      return;
    }
    if (isAfterLine) {
      input.lock();
      fx.phase = "mimic1";
      fx.charIndex = 0;
      fx.lineDoneAt = 0;
      fx.waitingForAdvance = false;
      fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      return;
    }
    if (isMimicFinalLine) {
      input.lock();
      fx.phase = "like";
      fx.charIndex = 0;
      fx.lineDoneAt = 0;
      fx.waitingForAdvance = false;
      fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      return;
    }
    if (isLikeLine) {
      input.lock();
      fx.phase = "know";
      fx.charIndex = 0;
      fx.lineDoneAt = 0;
      fx.waitingForAdvance = false;
      fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      return;
    }
    if (isKnowLine) {
      input.lock();
      fx.phase = "glitchPreface";
      fx.prefaceIndex = 0;
      fx.charIndex = 0;
      fx.lineDoneAt = 0;
      fx.waitingForAdvance = false;
      fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
      return;
    }
    const done = fx.onDone;
    sbBossType = null;
    if (typeof done === "function") done();
    else input.unlock();
    return;
  }

  const hold = SPACE_BOSS_TYPE_LINE_HOLD_MS;
  if (t - fx.lineDoneAt < hold) return;

  fx.lineIndex += 1;
  fx.charIndex = 0;
  fx.lineDoneAt = 0;
  fx.lastCharAt = t - SPACE_BOSS_TYPE_CHAR_MS;
}

function startSpaceBossReunionEvent() {
  if (current.id !== "space_boss") return;
  interactionSession.begin();
  bgmCtl.setOverride("assets/audio/duckC.mp3");
  restoreSpaceBossPreBattleLayout();
  input.lock();
  interactionSession.trackSync(() => startSpaceBossCactusIntro(() => {
    input.unlock();
    dialog.open([["またせたな、アミーゴ！"]], () => {
      dialog.open([["みんなを集めるのに時間がかかっちまった！"]], () => {
        input.lock();
        startSpaceBossCactusLeadHop(() => {
          input.unlock();
          dialog.open([["みんなー！"]], () => {
            input.lock();
            startSpaceBossCactusFriendsIntro(() => {
              startSpaceBossCactusHatHop(() => {
                input.unlock();
                dialog.open([["俺たちだけじゃないぜ！"]], () => {
                  input.lock();
                  setTimeout(() => {
                    startSpaceBossAlliesIntro(() => {
                      startSpaceBossAllMembersAnim(() => {
                        startSpaceBossSpacesistersHop(() => {
                          input.unlock();
                          dialog.open([
                            ["間に合ってよかったよ！"],
                            ["さぁ、力を合わせてあいつを倒すんだ！"],
                          ], () => {
                            input.lock();
                            startSpaceBossAllMembersHop(() => {
                              input.unlock();
                              dialog.open([["うおーーー！"]], null, "talk", 0, {
                                position: "top",
                                textScale: 2,
                                align: "center",
                                valign: "center",
                                highlights: [{ text: "うおーーー！", rainbow: true }],
                                onFinalAdvance: () => {
                                  input.lock();
                                  startBattleTransition(() => startSpaceBossFinalBattle());
                                  dialog.close();
                                },
                              });
                            });
                          }, "talk", 0, { position: "top" });
                        });
                      });
                    });
                  }, 1000);
                }, "talk", 0, { position: "top" });
              });
            });
          }, "talk", 0, { position: "top" });
        });
      }, "talk", 0, { position: "top" });
    }, "talk", 0, { position: "top" });
  }, 1000));
}

function startSpaceBossCactusLeadHop(onDone) {
  if (!sbCactusIntro?.cactus) {
    onDone?.();
    return;
  }
  const cactus = sbCactusIntro.cactus;
  sbCactusIntro.phase = "leadHop";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = nowMs();
  sbCactusIntro.leadHop = {
    act: cactus,
    x: cactus.x,
    y: cactus.y,
  };
  sbCactusIntro.onDone = onDone;
}

function updateSpaceBossCactusLeadHop(t, fx) {
  const hop = fx.leadHop;
  if (!hop?.act) {
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    fx.leadHop = null;
    if (typeof done === "function") done();
    return;
  }
  const local = t - fx.phaseStartMs;
  const hopMs = 360;
  const total = hopMs * 2;
  const p = Math.min(1, local / total);
  const hopPhase = (local % hopMs) / hopMs;
  const lift = Math.sin(hopPhase * Math.PI) * 24 * (1 - p * 0.08);
  hop.act.x = hop.x;
  hop.act.y = hop.y - lift;
  hop.act.alpha = 1;
  hop.act.scale = 1;
  hop.act.frame = Math.floor(local / 105) % 2;
  if (local >= total) {
    hop.act.y = hop.y;
    hop.act.frame = 0;
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    fx.leadHop = null;
    if (typeof done === "function") done();
  }
}

function restoreSpaceBossPreBattleLayout() {
  const party = actors.filter((act) => act.name?.startsWith("sb_party_"));
  const px = leader.x;
  const py = leader.y;
  for (let i = 0; i < party.length; i++) {
    party[i].hidden = false;
    party[i].glow = true;
    party[i].solid = false;
    party[i].x = px - 30 + i * 20;
    party[i].y = py + 60;
  }
  const ss = actors.find((act) => act.name === "sb_ss1");
  if (ss) ss.hidden = true;
  updateCam();
}

function startSpaceBossCactusIntro(onDone, delayMs = 0) {
  const now = nowMs() + Math.max(0, delayMs | 0);
  const holeX = 26;
  const holeY = 92;
  const targetX = BASE_W / 2;
  const targetY = BASE_H / 2 + 20;
  let cactus = actors.find((act) => act.name === "sb_cactus_intro");
  if (!cactus) {
    cactus = {
      kind: "npc",
      name: "sb_cactus_intro",
      img: SPRITES.cactus,
      x: cam.x + holeX - 8,
      y: cam.y + holeY - 8,
      spr: SPR,
      sprH: SPR,
      frame: 0,
      last: 0,
      solid: false,
      noWalk: true,
      animMs: Infinity,
      talkHit: { x: 0, y: 0, w: 0, h: 0 },
    };
    actors.push(cactus);
  }
  cactus.hidden = false;
  cactus.glow = false;
  cactus.alpha = 0;
  cactus.scale = 0.35;
  cactus.frame = 0;
  cactus.x = cam.x + holeX - 8;
  cactus.y = cam.y + holeY - 8;
  cactus.animMs = Infinity;
  sbCactusIntro = {
    startMs: now,
    phase: "hole",
    holeX,
    holeY,
    startX: cam.x + holeX - 8,
    startY: cam.y + holeY - 8,
    targetX: cam.x + targetX - 8,
    targetY: cam.y + targetY - 8,
    cactus,
    onDone,
  };
}

function showSpaceBossPartyExclamations(char = "!", duration = 1200) {
  const now = nowMs();
  const party = actors.filter((act) => act.name?.startsWith("sb_party_") && !act.hidden);
  const targets = party.length ? party : [leader, p2, p3, p4];
  for (const m of targets) {
    exclamations.push({
      sx: ((m.x + 8) - cam.x) | 0,
      sy: (m.y - cam.y) | 0,
      startMs: now,
      duration,
      char,
      color: char === "?" ? "#fff" : "#e00",
      opaque: true,
    });
  }
}

function updateSpaceBossCactusIntro(t) {
  if (!sbCactusIntro) return;
  const fx = sbCactusIntro;
  const cactus = fx.cactus;
  if (!cactus || current.id !== "space_boss") {
    sbCactusIntro = null;
    return;
  }
  if (fx.phase === "leadHop") {
    updateSpaceBossCactusLeadHop(t, fx);
    return;
  }
  if (fx.phase === "friends") {
    updateSpaceBossCactusFriendsIntro(t, fx);
    return;
  }
  if (fx.phase === "hatHop") {
    updateSpaceBossCactusHatHop(t, fx);
    return;
  }
  if (fx.phase === "allMembersAnim") {
    updateSpaceBossAllMembersAnim(t, fx);
    return;
  }
  if (fx.phase === "allMembersHop") {
    updateSpaceBossAllMembersHop(t, fx);
    return;
  }
  if (fx.phase === "spacesistersHop") {
    updateSpaceBossSpacesistersHop(t, fx);
    return;
  }
  if (fx.phase === "allies") {
    updateSpaceBossAlliesIntro(t, fx);
    return;
  }
  const elapsed = t - fx.startMs;
  if (fx.phase === "hole") {
    cactus.alpha = 0;
    cactus.x = fx.startX;
    cactus.y = fx.startY;
    if (!fx.questionShown && elapsed >= 1000) {
      fx.questionShown = true;
      showSpaceBossPartyExclamations("?", 1800);
    }
    if (elapsed >= 4000) {
      fx.phase = "jump";
      fx.phaseStartMs = t;
    }
    return;
  }
  if (fx.phase === "jump") {
    const p = Math.min(1, (t - fx.phaseStartMs) / 820);
    const eased = 1 - Math.pow(1 - p, 3);
    const hop = Math.sin(p * Math.PI) * 42;
    cactus.alpha = Math.min(1, p * 3);
    cactus.scale = 0.72 + eased * 0.28;
    cactus.x = fx.startX + (fx.targetX - fx.startX) * eased;
    cactus.y = fx.startY + (fx.targetY - fx.startY) * eased - hop;
    cactus.frame = 0;
    if (p >= 1) {
      fx.phase = "landWait";
      fx.phaseStartMs = t;
      cactus.x = fx.targetX;
      cactus.y = fx.targetY;
      cactus.scale = 1;
      cactus.alpha = 1;
      cactus.frame = 0;
    }
    return;
  }
  if (fx.phase === "landWait") {
    cactus.x = fx.targetX;
    cactus.y = fx.targetY;
    cactus.scale = 1;
    cactus.alpha = 1;
    cactus.frame = 0;
    if (t - fx.phaseStartMs >= 1000) {
      fx.phase = "animate";
      fx.phaseStartMs = t;
    }
    return;
  }
  if (fx.phase === "animate") {
    const local = t - fx.phaseStartMs;
    cactus.x = fx.targetX;
    cactus.y = fx.targetY + (Math.sin(local / 120 * Math.PI) < 0 ? 1 : 0);
    cactus.scale = 1;
    cactus.alpha = 1;
    cactus.frame = Math.floor(local / 120) % 2;
    if (local >= 720) {
      cactus.frame = 0;
      cactus.y = fx.targetY;
      cactus.animMs = Infinity;
      fx.phase = "postSurpriseWait";
      fx.phaseStartMs = t;
      if (!fx.cactusSurpriseShown) {
        fx.cactusSurpriseShown = true;
        showSpaceBossPartyExclamations("!", 1200);
      }
    }
    return;
  }
  if (fx.phase === "postSurpriseWait") {
    cactus.x = fx.targetX;
    cactus.y = fx.targetY;
    cactus.scale = 1;
    cactus.alpha = 1;
    cactus.frame = 0;
    if (t - fx.phaseStartMs >= 1000) {
      const done = fx.onDone;
      fx.phase = "hold";
      fx.done = true;
      fx.onDone = null;
      if (typeof done === "function") done();
    }
  }
}

function startSpaceBossCactusFriendsIntro(onDone) {
  if (!sbCactusIntro) {
    onDone?.();
    return;
  }
  const now = nowMs();
  const holeX = sbCactusIntro.holeX;
  const holeY = sbCactusIntro.holeY;
  const startX = cam.x + holeX - 8;
  const startY = cam.y + holeY - 8;
  const centerX = cam.x + BASE_W / 2 - 8;
  const centerY = cam.y + BASE_H / 2 + 48;
  const offsets = [
    [-50, -10], [-30, -22], [-10, -14], [12, -24], [34, -10],
    [-42, 16], [-20, 28], [4, 22], [28, 28], [48, 12],
  ];
  const friends = offsets.map(([ox, oy], i) => {
    const isHat = i === offsets.length - 1;
    const act = actors.find((a) => a.name === `sb_cactus_friend_${i}`) || {
      kind: "npc",
      name: `sb_cactus_friend_${i}`,
      img: isHat ? SPRITES.cactus_hat : SPRITES.cactus,
      x: startX,
      y: startY,
      spr: SPR,
      sprH: SPR,
      frame: 0,
      last: 0,
      solid: false,
      noWalk: true,
      animMs: Infinity,
      talkHit: { x: 0, y: 0, w: 0, h: 0 },
    };
    if (!actors.includes(act)) actors.push(act);
    act.img = isHat ? SPRITES.cactus_hat : SPRITES.cactus;
    act.hidden = false;
    act.alpha = 0;
    act.scale = 0.35;
    act.glow = false;
    act.frame = 0;
    act.x = startX;
    act.y = startY;
    act.animMs = Infinity;
    return {
      act,
      delay: i * 86,
      sx: startX,
      sy: startY,
      tx: centerX + ox,
      ty: centerY + oy,
    };
  });
  sbCactusIntro.phase = "friends";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = now;
  sbCactusIntro.friends = friends;
  sbCactusIntro.onDone = onDone;
}

function startSpaceBossCactusHatHop(onDone) {
  if (!sbCactusIntro) {
    onDone?.();
    return;
  }
  const hat = actors.find((a) => a.name === "sb_cactus_friend_9") || actors.find((a) => a.img === SPRITES.cactus_hat);
  if (!hat) {
    onDone?.();
    return;
  }
  sbCactusIntro.phase = "hatHop";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = nowMs();
  sbCactusIntro.hatHop = {
    act: hat,
    x: hat.x,
    y: hat.y,
  };
  sbCactusIntro.onDone = onDone;
}

function updateSpaceBossCactusHatHop(t, fx) {
  const hop = fx.hatHop;
  if (!hop?.act) {
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    if (typeof done === "function") done();
    return;
  }
  const local = t - fx.phaseStartMs;
  const hopMs = 360;
  const total = hopMs * 2;
  const p = Math.min(1, local / total);
  const hopPhase = (local % hopMs) / hopMs;
  const lift = Math.sin(hopPhase * Math.PI) * 24 * (1 - p * 0.08);
  hop.act.x = hop.x;
  hop.act.y = hop.y - lift;
  hop.act.alpha = 1;
  hop.act.scale = 1;
  hop.act.frame = Math.floor(local / 105) % 2;
  if (local >= total) {
    hop.act.y = hop.y;
    hop.act.frame = 0;
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    if (typeof done === "function") done();
  }
}

function startSpaceBossAllMembersAnim(onDone) {
  if (!sbCactusIntro) {
    onDone?.();
    return;
  }
  const members = getSpaceBossVisibleRallyMembers();
  if (!members.length) {
    onDone?.();
    return;
  }
  sbCactusIntro.phase = "allMembersAnim";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = nowMs();
  sbCactusIntro.allMembersAnim = members.map((act) => ({
    act,
    x: act.x,
    y: act.y,
  }));
  sbCactusIntro.onDone = onDone;
}

function getSpaceBossVisibleRallyMembers() {
  return actors
    .filter((act) =>
      act.name === "sb_cactus_intro" ||
      act.name?.startsWith("sb_cactus_friend_") ||
      act.name?.startsWith("sb_ally_") ||
      act.name?.startsWith("sb_party_"))
    .filter((act) => !act.hidden);
}

function updateSpaceBossAllMembersAnim(t, fx) {
  const local = t - fx.phaseStartMs;
  const duration = 720;
  for (const m of fx.allMembersAnim || []) {
    if (!m.act) continue;
    m.act.x = m.x;
    m.act.y = m.y + (Math.sin(local / 120 * Math.PI) < 0 ? 1 : 0);
    m.act.alpha = 1;
    m.act.scale = 1;
    m.act.frame = Math.floor(local / 120) % 2;
  }
  if (local >= duration) {
    for (const m of fx.allMembersAnim || []) {
      if (!m.act) continue;
      m.act.x = m.x;
      m.act.y = m.y;
      m.act.frame = 0;
    }
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    fx.allMembersAnim = null;
    if (typeof done === "function") done();
  }
}

function startSpaceBossAllMembersHop(onDone) {
  if (!sbCactusIntro) {
    onDone?.();
    return;
  }
  const members = getSpaceBossVisibleRallyMembers();
  if (!members.length) {
    onDone?.();
    return;
  }
  sbCactusIntro.phase = "allMembersHop";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = nowMs();
  sbCactusIntro.allMembersHop = members.map((act) => ({
    act,
    x: act.x,
    y: act.y,
  }));
  sbCactusIntro.onDone = onDone;
}

function updateSpaceBossAllMembersHop(t, fx) {
  const local = t - fx.phaseStartMs;
  const hopMs = 360;
  const total = hopMs * 2;
  const p = Math.min(1, local / total);
  const hopPhase = (local % hopMs) / hopMs;
  const lift = Math.sin(hopPhase * Math.PI) * 24 * (1 - p * 0.08);
  for (const m of fx.allMembersHop || []) {
    if (!m.act) continue;
    m.act.x = m.x;
    m.act.y = m.y - lift;
    m.act.alpha = 1;
    m.act.scale = 1;
    m.act.frame = Math.floor(local / 105) % 2;
  }
  if (local >= total) {
    for (const m of fx.allMembersHop || []) {
      if (!m.act) continue;
      m.act.x = m.x;
      m.act.y = m.y;
      m.act.frame = 0;
    }
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    fx.allMembersHop = null;
    if (typeof done === "function") done();
  }
}

function startSpaceBossSpacesistersHop(onDone) {
  if (!sbCactusIntro) {
    onDone?.();
    return;
  }
  const act = actors.find((a) => a.name === "sb_ally_spacesisters1");
  if (!act) {
    onDone?.();
    return;
  }
  sbCactusIntro.phase = "spacesistersHop";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = nowMs();
  sbCactusIntro.spacesistersHop = {
    act,
    x: act.x,
    y: act.y,
  };
  sbCactusIntro.onDone = onDone;
}

function updateSpaceBossSpacesistersHop(t, fx) {
  const hop = fx.spacesistersHop;
  if (!hop?.act) {
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    if (typeof done === "function") done();
    return;
  }
  const local = t - fx.phaseStartMs;
  const hopMs = 360;
  const total = hopMs * 2;
  const p = Math.min(1, local / total);
  const hopPhase = (local % hopMs) / hopMs;
  const lift = Math.sin(hopPhase * Math.PI) * 24 * (1 - p * 0.08);
  hop.act.x = hop.x;
  hop.act.y = hop.y - lift;
  hop.act.alpha = 1;
  hop.act.scale = 1;
  hop.act.frame = Math.floor(local / 105) % 2;
  if (local >= total) {
    hop.act.y = hop.y;
    hop.act.frame = 0;
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    if (typeof done === "function") done();
  }
}

function updateSpaceBossCactusFriendsIntro(t, fx) {
  const jumpMs = 560;
  const landWaitMs = 1000;
  const animMs = 420;
  let allDone = true;
  for (const f of fx.friends || []) {
    const local = t - fx.phaseStartMs - f.delay;
    const act = f.act;
    if (local < 0) {
      act.alpha = 0;
      act.x = f.sx;
      act.y = f.sy;
      allDone = false;
      continue;
    }
    const p = Math.min(1, local / jumpMs);
    const eased = 1 - Math.pow(1 - p, 3);
    const hop = Math.sin(p * Math.PI) * 40;
    act.alpha = Math.min(1, p * 4);
    act.scale = 0.62 + eased * 0.38;
    act.x = f.sx + (f.tx - f.sx) * eased;
    act.y = f.sy + (f.ty - f.sy) * eased - hop;
    act.frame = local < jumpMs + landWaitMs ? 0 : Math.floor((local - jumpMs - landWaitMs) / 105) % 2;
    if (local < jumpMs + landWaitMs + animMs) {
      allDone = false;
    } else {
      act.x = f.tx;
      act.y = f.ty;
      act.alpha = 1;
      act.scale = 1;
      act.frame = 0;
    }
  }
  if (allDone) {
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    if (typeof done === "function") done();
  }
}

function startSpaceBossAlliesIntro(onDone) {
  if (!sbCactusIntro) {
    onDone?.();
    return;
  }
  const now = nowMs();
  const startX = cam.x + sbCactusIntro.holeX - 8;
  const startY = cam.y + sbCactusIntro.holeY - 8;
  const centerX = cam.x + BASE_W / 2 - 8;
  const centerY = cam.y + BASE_H / 2 + 42;
  const defs = [
    { key: "nidhogg2", img: SPRITES.nidhogg2, ox: -68, oy: -34, spr: 32, sprH: 32 },
    { key: "chinanago_on_0", img: SPRITES.chinanago_on, ox: -76, oy: -4 },
    { key: "chinanago_on_1", img: SPRITES.chinanago_on, ox: -56, oy: 10 },
    { key: "chinanago_on_2", img: SPRITES.chinanago_on, ox: -36, oy: -2 },
    { key: "lucha", img: SPRITES.lucha, ox: 64, oy: 10 },
    { key: "yahhy", img: SPRITES.yahhy, ox: 42, oy: -12 },
    { key: "spacesisters1", img: SPRITES.spacesisters1, ox: 18, oy: -36 },
    { key: "kingyobachi_san", img: SPRITES.kingyobachi_san, ox: -62, oy: 28, spr: 16, sprH: 32 },
    { key: "lee", img: SPRITES.lee, ox: 58, oy: 34 },
  ];
  const allies = defs.map((def, i) => {
    const name = `sb_ally_${def.key}`;
    let act = actors.find((a) => a.name === name);
    if (!act) {
      act = {
        kind: "npc",
        name,
        img: def.img,
        x: startX,
        y: startY,
        spr: def.spr ?? SPR,
        sprH: def.sprH ?? def.spr ?? SPR,
        frame: 0,
        last: 0,
        solid: false,
        noWalk: true,
        animMs: Infinity,
        talkHit: { x: 0, y: 0, w: 0, h: 0 },
      };
      actors.push(act);
    }
    act.img = def.img;
    act.spr = def.spr ?? SPR;
    act.sprH = def.sprH ?? def.spr ?? SPR;
    act.hidden = false;
    act.alpha = 0;
    act.scale = 0.35;
    act.glow = false;
    act.frame = 0;
    act.x = startX;
    act.y = startY;
    act.animMs = Infinity;
    return {
      act,
      delay: i * 92,
      sx: startX,
      sy: startY,
      tx: centerX + def.ox,
      ty: centerY + def.oy,
    };
  });
  sbCactusIntro.phase = "allies";
  sbCactusIntro.done = false;
  sbCactusIntro.phaseStartMs = now;
  sbCactusIntro.allies = allies;
  sbCactusIntro.onDone = onDone;
}

function updateSpaceBossAlliesIntro(t, fx) {
  const jumpMs = 620;
  const landWaitMs = 220;
  const animMs = 420;
  let allDone = true;
  for (const f of fx.allies || []) {
    const local = t - fx.phaseStartMs - f.delay;
    const act = f.act;
    if (local < 0) {
      act.alpha = 0;
      act.x = f.sx;
      act.y = f.sy;
      allDone = false;
      continue;
    }
    const p = Math.min(1, local / jumpMs);
    const eased = 1 - Math.pow(1 - p, 3);
    const hop = Math.sin(p * Math.PI) * 44;
    act.alpha = Math.min(1, p * 4);
    act.scale = 0.62 + eased * 0.38;
    act.x = f.sx + (f.tx - f.sx) * eased;
    act.y = f.sy + (f.ty - f.sy) * eased - hop;
    act.frame = local < jumpMs + landWaitMs ? 0 : Math.floor((local - jumpMs - landWaitMs) / 105) % 2;
    if (local < jumpMs + landWaitMs + animMs) {
      allDone = false;
    } else {
      act.x = f.tx;
      act.y = f.ty;
      act.alpha = 1;
      act.scale = 1;
      act.frame = 0;
    }
  }
  if (allDone) {
    const done = fx.onDone;
    fx.phase = "hold";
    fx.done = true;
    fx.onDone = null;
    if (typeof done === "function") done();
  }
}

function animateSpaceBossPartyRush(onDone) {
  const party = actors.filter((act) => act.name?.startsWith("sb_party_"));
  if (!party.length) {
    onDone?.();
    return;
  }
  const targets = [
    { x: leader.x - 36, y: leader.y + 44 },
    { x: leader.x - 12, y: leader.y + 58 },
    { x: leader.x + 12, y: leader.y + 58 },
    { x: leader.x + 36, y: leader.y + 44 },
  ];
  const starts = party.map((act, i) => {
    const target = targets[i % targets.length];
    const side = i < 2 ? -1 : 1;
    act.hidden = false;
    act.glow = true;
    act.solid = false;
    act.x = target.x + side * (180 + i * 16);
    act.y = target.y + 36 + i * 5;
    return { act, sx: act.x, sy: act.y, tx: target.x, ty: target.y };
  });
  const startMs = nowMs();
  const duration = 900;
  const timer = setInterval(() => {
    if (current.id !== "space_boss") {
      clearInterval(timer);
      return;
    }
    const p = Math.min(1, (nowMs() - startMs) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const hop = Math.sin(p * Math.PI) * 26;
    for (const s of starts) {
      s.act.x = s.sx + (s.tx - s.sx) * eased;
      s.act.y = s.sy + (s.ty - s.sy) * eased - hop;
    }
    updateCam();
    if (p >= 1) {
      clearInterval(timer);
      for (const s of starts) {
        s.act.x = s.tx;
        s.act.y = s.ty;
      }
      onDone?.();
    }
  }, 16);
}

function startSpaceBossFinalBattle() {
  if (current.id !== "space_boss" || phoneBrawl.isActive()) return;
  sbCactusIntro = null;
  input.unlock();
  startPhoneBrawl((result) => {
    if (result?.result === "victory" || result === "victory") {
      startSpaceBossWinEvent();
      return;
    }
    returnToTitleAfterLastBattleGameOver();
  }, { playerDeckIds: "lastbattle2", internalBgm: false });
}

function startSpaceBossWinEvent() {
  if (current.id !== "space_boss") return;
  interactionSession.end();
  STATE.flags.galaxyBossDefeated = true;
  bgmCtl.setOverride("assets/audio/duckE.mp3");
  spaceBossWhiteReunion = { startMs: nowMs() };
  partyVisible = false;
  input.lock();
  setTimeout(() => {
    input.unlock();
    dialog.open([
      ["すごいすごい！"],
      ["本当にすごいよきみたち！"],
      ["ついにやったんだ！"],
      ["はぁ、、、。"],
      ["感動でなんにも言えないや。"],
      ["ありがとう。"],
      ["きみたちのおかげで、たくさんの世界が救われた。"],
    ], () => {
      dialog.open([
        ["・・・・・・。"],
        ["うん。"],
      ], () => {
        startSpaceBossReturnHomeSequence(() => {
          input.lock();
          setTimeout(() => {
            input.unlock();
            dialog.open([
              ["さ。"],
              ["かえろっか。"],
            ], () => {
              startSpaceBossAfterHeartReturnSequence();
            }, "talk");
          }, 3000);
        });
      }, "talk");
    }, "talk");
  }, 6100);
}

function startSpaceBossReturnHomeSequence(onDone = startSpaceBossAfterHeartReturnSequence) {
  interactionSession.end();
  input.lock();
  setTimeout(() => {
    input.unlock();
    dialog.open([["それから、"]], () => {
      startSpaceBossHeartReturnSequence(onDone);
    }, "talk");
  }, 1000);
}

function startSpaceBossHeartReturnSequence(onDone = startSpaceBossAfterHeartReturnSequence) {
  interactionSession.end();
  input.lock();
  if (spaceBossWhiteReunion) {
    spaceBossWhiteReunion.heartFx = { startMs: nowMs(), duration: 1700 };
  }
  setTimeout(() => {
    input.unlock();
    dialog.open([["これは返してもらわなきゃね。"]], () => {
      input.lock();
      setTimeout(() => {
        input.unlock();
        dialog.open([
          ["また別の時空のきみたちが見つけられるように、"],
          ["ほろびた世界に隠しておかなきゃいけないからさ。"],
        ], () => {
          onDone?.();
        }, "talk");
      }, 1000);
    }, "talk");
  }, 1850);
}

function startSpaceBossAfterHeartReturnSequence() {
  interactionSession.end();
  dialog.open([
    ["みんながまってる。"],
  ], () => {
    input.lock();
    setTimeout(() => {
      input.unlock();
      dialog.open([
        ["タイムマシン？帰る時は必要ないよ。"],
        ["あれはこのパターンの世界で作ったものじゃないから、もう使えないのさ。"],
        ["それに、宇宙から未来に帰るのって、実はけっこう簡単なんだよ。"],
      ], () => {
        input.lock();
        setTimeout(() => {
          input.unlock();
          dialog.open([["さってっと、"]], () => {
            dialog.open([
              ["いくよ、"],
              ["そりゃーーーー！"],
            ], () => {
              startSpaceBossReturnWave();
            }, "talk");
          }, "talk");
        }, 3000);
      }, "talk");
    }, 2000);
  }, "talk");
}

function startSpaceBossReturnWave() {
  interactionSession.end();
  input.lock();
  if (spaceBossWhiteReunion) {
    spaceBossWhiteReunion.heartFx = null;
    spaceBossWhiteReunion.waveFx = { startMs: nowMs(), duration: 1800 };
  }
  setTimeout(() => {
    fadeOutBgmToSilence(1400);
    startSpaceBossMoonScene();
  }, 1900);
}

function triggerSpaceBossEnding() {
  interactionSession.begin();
  input.lock();
  bgmCtl.setOverride("about:blank");
  fade.startIrisFade(nowMs(), {
    outMs: 800,
    holdMs: 500,
    inMs: 300,
    cx: (leader.x - cam.x + SPR / 2) | 0,
    cy: (leader.y - cam.y + SPR / 2) | 0,
    onBlack: () => {
      spaceBossWhiteReunion = null;
      setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
      partyVisible = false;
      loadMap("vj_room02", { isEnding: true });
    },
    onEnd: () => {
      pendingEndingFadeIn = true;
    },
  });
}

function returnToTitleAfterLastBattleGameOver() {
  input.lock();
  bgmCtl.setOverride("about:blank");
  fade.startCutFade(nowMs(), {
    outMs: 1,
    holdMs: 250,
    inMs: 400,
    onBlack: () => {
      partyVisible = true;
      loadMap("moritasaki_room", { skipBgm: true });
      setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
    },
    onEnd: () => {
      input.unlock();
      input.clear();
      startTitle();
    },
  });
}

function buildWaterMask(img, color) {
  const [tr, tg, tb] = color;
  const mc = document.createElement("canvas");
  mc.width  = img.naturalWidth;
  mc.height = img.naturalHeight;
  const mx = mc.getContext("2d", { willReadFrequently: true });
  mx.drawImage(img, 0, 0);
  const id = mx.getImageData(0, 0, mc.width, mc.height);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === tr && d[i+1] === tg && d[i+2] === tb) {
      d[i] = d[i+1] = d[i+2] = 255; d[i+3] = 255;
    } else {
      d[i+3] = 0;
    }
  }
  mx.putImageData(id, 0, 0);
  waterMaskCanvas = mc;
}

function getMapChunkEntry(img) {
  let entry = mapChunkCache.get(img);
  const src = img.currentSrc || img.src;
  if (!entry || entry.src !== src) {
    entry = { src, chunks: new Map(), order: [] };
    mapChunkCache.set(img, entry);
  }
  return entry;
}

function getMapChunk(img, cx, cy) {
  const entry = getMapChunkEntry(img);
  const key = `${cx},${cy}`;
  const cached = entry.chunks.get(key);
  if (cached) return cached;

  const sx = cx * MOBILE_MAP_CHUNK;
  const sy = cy * MOBILE_MAP_CHUNK;
  const sw = Math.min(MOBILE_MAP_CHUNK, img.naturalWidth - sx);
  const sh = Math.min(MOBILE_MAP_CHUNK, img.naturalHeight - sy);
  if (sw <= 0 || sh <= 0) return null;

  const chunk = document.createElement("canvas");
  chunk.width = sw;
  chunk.height = sh;
  const cctx = chunk.getContext("2d");
  cctx.imageSmoothingEnabled = false;
  cctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  entry.chunks.set(key, chunk);
  entry.order.push(key);
  while (entry.order.length > MOBILE_MAP_CACHE_LIMIT) {
    const oldKey = entry.order.shift();
    entry.chunks.delete(oldKey);
  }
  return chunk;
}

function drawWaterSea(ctx) {
  if (!waterMaskCanvas) return;
  seaTempCtx.clearRect(0, 0, seaTempCanvas.width, seaTempCanvas.height);
  // A: sea.draw の代わりにキャッシュを使う
  seaTempCtx.drawImage(seaSparkleCanvas, 0, 0);
  // B: マップ全体ではなくcam範囲だけ切り出してマスク合成
  seaTempCtx.globalCompositeOperation = "destination-in";
  seaTempCtx.drawImage(
    waterMaskCanvas,
    cam.x | 0, cam.y | 0, seaTempCanvas.width, seaTempCanvas.height,
    0, 0, seaTempCanvas.width, seaTempCanvas.height
  );
  seaTempCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(seaTempCanvas, 0, 0);
}

const { current, cam, leader, p2, p3, p4, collectedItems } = STATE;

function getPartySprite(charNo) {
  const n = charNo | 0;
  if (n === 1 && STATE.flags.mechaNatsumi) return SPRITES.mecha_natsumi;
  const lv = STATE.flags.skinLevel | 0;
  const suffix = lv === 1 ? "_t1" : lv === 2 ? "_t2" : "";
  return SPRITES[`p${n}${suffix}`];
}

function getPartyFuroSprite(charNo) {
  const n = charNo | 0;
  const lv = STATE.flags.skinLevel | 0;
  const suffix = lv === 1 ? "_t1" : lv === 2 ? "_t2" : "";
  return SPRITES[`p${n}${suffix}_furo`] || getPartySprite(n);
}

function getHeadwearSpriteForImg(img) {
  const hw = STATE.headwear;
  if (!hw) return null;
  if (hw === "helmet") return SPRITES.met;
  if (hw === "kingyobachi") return SPRITES.kingyobachi;
  if (hw === "s_hat") return SPRITES.s_hat;
  if (hw === "afro") {
    if (img === SPRITES.p1 || img === SPRITES.p1_t1 || img === SPRITES.p1_t2 || img === SPRITES.mecha_natsumi) return SPRITES.aflo_p1;
    if (img === SPRITES.p2 || img === SPRITES.p2_t1 || img === SPRITES.p2_t2) return SPRITES.aflo_p2;
    if (img === SPRITES.p3 || img === SPRITES.p3_t1 || img === SPRITES.p3_t2) return SPRITES.aflo_p3;
    if (img === SPRITES.p4 || img === SPRITES.p4_t1 || img === SPRITES.p4_t2) return SPRITES.aflo_p4;
  }
  return null;
}

function setupParty(leaderIdx) {
  STATE.leaderIdx = leaderIdx;
  const all = [1, 2, 3, 4];
  const leaderNo = all[leaderIdx];
  leader.img = getPartySprite(leaderNo);
  const rest = all.filter((n) => n !== leaderNo);
  p2.img = getPartySprite(rest[0]);
  p3.img = getPartySprite(rest[1]);
  p4.img = getPartySprite(rest[2]);
}
setupParty(0); // デフォルト: P1 がリーダー

function partyNoForSlot(name) {
  const all = [1, 2, 3, 4];
  const leaderNo = all[STATE.leaderIdx | 0] || 1;
  if (name === "leader") return leaderNo;
  const rest = all.filter((n) => n !== leaderNo);
  if (name === "p2") return rest[0];
  if (name === "p3") return rest[1];
  if (name === "p4") return rest[2];
  return null;
}

function isPartySlotVisibleOnCurrentMap(name) {
  const no = partyNoForSlot(name);
  if (current.id === "furo_f") return no !== 3 && no !== 4;
  if (current.id === "furo_m") return no !== 1 && no !== 2;
  return true;
}

function isFuroHotActive() {
  return (STATE.flags.furoHotUntil || 0) > nowMs();
}

function getPartyDrawImgForSlot(name, fallbackImg) {
  if (current.id !== "furo_f" && current.id !== "furo_m") return fallbackImg;
  const no = partyNoForSlot(name);
  return getPartyFuroSprite(no) || fallbackImg;
}

function applySkinLevel(level) {
  STATE.flags.skinLevel = level | 0;
  setupParty(STATE.leaderIdx | 0);
}

let mapReady = false;

// ---- Followers (externalized) ----
const followers = createFollowers({
  gap2: GAP2,
  gap3: GAP3,
  gap4: GAP4,
  frameMs: FRAME_MS,
});

// actors
let actors = [];
// NPC_FRAME_MS comes from CONFIG (= FRAME_MS × 2)
// 描画ソート用リスト（毎フレームクリアして再利用）
const _groundList = [];
const _upperList  = [];
const _aboveTopList = [];
// 描画アイテムプール（毎フレームのオブジェクト生成ゼロ）
const _POOL_SIZE  = 100;
const _renderPool = Array.from({ length: _POOL_SIZE }, () => ({}));
let   _poolIdx    = 0;
function _poolItem() {
  if (_poolIdx < _POOL_SIZE) {
    const item = _renderPool[_poolIdx++];
    item.sparkle = undefined;
    item.sparkleColor = undefined;
    item.sparklePhase = undefined;
    item.markImg = undefined;
    item.markSpr = undefined;
    item.markAnimMs = undefined;
    item.markMode = undefined;
    item.markFromImg = undefined;
    item.markAnimStart = undefined;
    item.markAnimUntil = undefined;
    item.shadowImg = undefined;
    item.shadowOff = undefined;
    item.metImg = undefined;
    item.alpha = undefined;
    item.scale = undefined;
    item.rotation = undefined;
    item.filter = undefined;
    item.tint = undefined;
    item.vanishStart = undefined;
    item.ironHeartMark = undefined;
    item.sweat = undefined;
    item.sweatPhase = undefined;
    item.hotSteam = undefined;
    item.hotPhase = undefined;
    return item;
  }
  return {}; // フォールバック（超えることはほぼない）
}
const _cactusShadowOff = { x: 9, y: 1 }; // 毎フレーム生成しない
const tintCanvas = document.createElement("canvas");
const tintCtx = tintCanvas.getContext("2d");
const PIZZA_TARGET_NAMES = ["kori", "yahhy", "keeper"];
const PIZZA_ITEM_ID = "pizza";

function getPizzaReward(elapsedMs) {
  const sec = Math.max(0, (elapsedMs / 1000) | 0);
  if (sec <= 30) return 1500;
  if (sec <= 60) return 1200;
  if (sec <= 120) return 1000;
  if (sec <= 180) return 700;
  return 400;
}

function refreshPizzaJobMarkers() {
  for (const act of actors) {
    if (act.kind !== "npc") continue;
    if (!PIZZA_TARGET_NAMES.includes(act.name)) continue;
    act.markImg = null;
    act.markSpr = undefined;
    act.markAnimMs = undefined;
    act.markMode = undefined;
  }
  if (!STATE.flags.pizzaJobActive || STATE.flags.pizzaDelivered) return;
  const target = STATE.flags.pizzaTargetNpc;
  const act = actors.find((a) => a.kind === "npc" && a.name === target);
  if (!act) return;
  act.markImg = SPRITES.pizza_sign;
  act.markMode = "pizza_pop";
}

function talkBoxLeader() {
  return { x: leader.x, y: leader.y, w: SPR, h: SPR };
}
function talkRectActor(a) {
  const th = a.talkHit || { x: 0, y: 0, w: SPR, h: SPR };
  return { x: a.x + (th.x | 0), y: a.y + (th.y | 0), w: th.w | 0, h: th.h | 0 };
}

function spawnDashDustForChar(t, ch, dx, dy, phase = 0) {
  if (current.id === "space" || current.id === "space_boss") return;
  const len = Math.hypot(dx, dy) || 1;
  const bx = ch.x + 8 - (dx / len) * (4 + phase);
  const by = ch.y + 15;
  dashDust.push({
    x: bx + (Math.random() * 8 - 4),
    y: by + (Math.random() * 3 - 1),
    vx: -(dx / len) * (0.18 + Math.random() * 0.18) + (Math.random() - 0.5) * 0.12,
    vy: -0.12 - Math.random() * 0.12,
    born: t,
    life: 260 + Math.random() * 120,
    size: 1 + (Math.random() * 2 | 0),
  });
}

function spawnDashDust(t, dx, dy) {
  if (current.id === "space" || current.id === "space_boss") return;
  if (t - dashDustLastMs < 55) return;
  dashDustLastMs = t;
  spawnDashDustForChar(t, leader, dx, dy, 0);
  spawnDashDustForChar(t, p2, dx, dy, 0.7);
  spawnDashDustForChar(t, p3, dx, dy, 1.4);
  spawnDashDustForChar(t, p4, dx, dy, 2.1);
  if (dashDust.length > 48) dashDust.splice(0, dashDust.length - 48);
}

function drawDashDust(t) {
  if (!dashDust.length) return;
  ctx.save();
  dashDust = dashDust.filter((p) => {
    const age = t - p.born;
    if (age >= p.life) return false;
    const k = age / p.life;
    const x = p.x + p.vx * age * 0.08;
    const y = p.y + p.vy * age * 0.08 - k * 2;
    ctx.globalAlpha = (1 - k) * 0.55;
    ctx.fillStyle = k < 0.45 ? "#c7b08a" : "#8d806b";
    const s = p.size + (k > 0.5 ? 1 : 0);
    ctx.fillRect((x - cam.x) | 0, (y - cam.y) | 0, s, s);
    return true;
  });
  ctx.restore();
}

function pickupSpriteFor(itemId) {
  if (itemId === "rubber_duck_H") return SPRITES.duck_red;
  return SPRITES.duck;
}

function spawnActorsForMap(mapId) {
  actors = [];

  const npcs = NPCS_BY_MAP?.[mapId] || [];
  for (const def of npcs) actors.push({ ...def, frame: 0, last: 0 });

  const ufoMatch = mapId.match(/^umi_house(\d)$/);
  if (ufoMatch) {
    for (const def of getUfoHouseNpcs(+ufoMatch[1])) actors.push({ ...def, frame: 0, last: 0 });
  }
  if (mapId === "vj_factry" && STATE.flags.galaxyLastBattle) {
    actors = actors.filter(a => !a.name?.startsWith("factry_ss"));
  }
  if (mapId === "kako" && STATE.flags.galaxyLastBattle) {
    const ss = [
      { name: "kako_ss1", x: 1705, y: 1287 },
      { name: "kako_ss2", x: 1689, y: 1311 },
      { name: "kako_ss3", x: 1721, y: 1311 },
    ];
    for (const s of ss) {
      actors.push({ kind: "npc", name: s.name, img: SPRITES.spacesisters1, x: s.x, y: s.y, spr: SPR, sprH: SPR, frame: 0, last: 0, solid: true, noWalk: true, animMs: NPC_FRAME_MS, talkHit: { x: 0, y: 0, w: 16, h: 14 }, event: { type: "kako_sisters_warp" } });
    }
  }

  if (mapId === "shooting_lobby") {
    for (const a of actors) {
      if (!a.name?.startsWith("door_")) continue;
      a.markImg = null;
      if (a.name === "door_0") {
        if (!STATE.flags.shootingLobbyExitUnlocked) {
          a.hidden = true;
          a.alpha = 0;
          a.scale = 0.7;
        } else {
          a.hidden = false;
          a.alpha = 1;
          a.scale = 1;
        }
        continue;
      }
      if (a.name === "door_demon") {
        a.hidden = !STATE.flags.luchadolaDefeated;
        continue;
      }
      if (STATE.flags[`shootingCleared_${a.name}`]) {
        a.hidden = true;
        a.solid = false;
        a.talkHit = { x: 0, y: 0, w: 0, h: 0 };
      }
    }
  }
  if (mapId === "outdoor") {
    const a = actors.find((a) => a.name === "lucha");
    if (a) {
      if (STATE.flags.luchadolaDefeated) {
        a.talkPages = [["チクショーーーー！"]];
      } else if (STATE.achievedQuests.has("12")) {
        a.hidden = true;
        a.solid = false;
        a.talkHit = { x: 0, y: 0, w: 0, h: 0 };
      }
    }
    if (STATE.flags.loveSongReturned) {
      const loveSong = actors.find((a) => a.name === "lovesong");
      const hawaii = actors.find((a) => a.name === "hawaii");
      if (loveSong) {
        loveSong.x = (hawaii?.x ?? 1828) + 18;
        loveSong.y = hawaii?.y ?? 2475;
      }
    }
  }
  if (mapId === "house07" && STATE.flags.ac1Gone) {
    const a = actors.find((a) => a.name === "ac_1");
    if (a) {
      a.hidden = true;
      a.solid = false;
      a.talkHit = { x: 0, y: 0, w: 0, h: 0 };
    }
  }

  // 永続フラグによるスプライト上書き
  if (STATE.flags.nidhoggGave) {
    const a = actors.find(a => a.id === "nidhogg");
    if (a) a.img = SPRITES.nidhogg2;
  }
  if (STATE.flags.dSwordGave) {
    const a = actors.find(a => a.name === "d_sword_on");
    if (a) { a.img = SPRITES.d_sword_off; a.animMs = Infinity; a.talkHit = { x: 0, y: 0, w: 0, h: 0 }; }
  }
  if (STATE.achievedQuests.size >= 20) {
    const a = actors.find(a => a.id === "keeper");
    if (a) { a.x = 1613; a.y = 2709; }
  }
  if (STATE.flags.galaxyMaou) {
    actors = actors.filter(a => a.name !== "grasan");
  }
  if (mapId === "vj_room01" && STATE.flags.galaxyMaou) {
    actors = actors.filter(a => a.name !== "minami");
    if (!STATE.flags.galaxyMaou2) {
      setTimeout(() => {
        if (current.id === "vj_room01") startPhoneCallEvent2();
      }, 1000);
    }
  }
  refreshPizzaJobMarkers();

  const list = PICKUPS_BY_MAP?.[mapId] || [];
  for (const p of list) {
    const itemId = p?.itemId;
    if (!itemId) continue;
    if (collectedItems.has(itemId)) continue;
    if (p.requireFlag && !STATE.flags[p.requireFlag]) continue;

    actors.push({
      kind: "pickup",
      name: "pickup",
      itemId,
      x: p.x | 0,
      y: p.y | 0,
      frame: 0,
      last: 0,
      img: pickupSpriteFor(itemId),
      talkHit: p.talkHit || { x: 0, y: 0, w: 16, h: 16 },
      solid: true,
      animMs: NPC_FRAME_MS,
      sparkle: itemId === "moon_stone" || itemId === "iron_heart",
      sparkleColor: itemId === "iron_heart" ? "red" : "green",
      sparklePhase: Math.random() * Math.PI * 2,
    });
  }
}

function applyFlagsToActors(mapId) {
  if (mapId === "hole" && STATE.flags.nidhoggGave) {
    const a = actors.find(x => x.id === "nidhogg");
    if (a) a.img = SPRITES.nidhogg2;
  }
  if (mapId === "d_hole" && STATE.flags.dSwordGave) {
    const a = actors.find(x => x.name === "d_sword_on");
    if (a) {
      a.img     = SPRITES.d_sword_off;
      a.animMs  = Infinity;
      a.talkHit = { x: 0, y: 0, w: 0, h: 0 };
    }
  }
  if (mapId === "outdoor" && STATE.flags.cactus14Talked) {
    const a = actors.find(x => x.name === "cactus_14");
    if (a) {
      a.animMs  = 200;
      a.talkHit = { x: 0, y: 0, w: 0, h: 0 };
    }
  }
  if (mapId === "shooting_lobby" && STATE.flags.luchadolaDefeated) {
    const a = actors.find(x => x.name === "lucha_shooting");
    if (a) {
      a.hidden = true;
      a.solid = false;
      a.talkHit = { x: 0, y: 0, w: 0, h: 0 };
    }
  }
}

function spawnPickup(itemId, x, y) {
  if (!itemId) return;
  if (collectedItems.has(itemId)) return;
  if (actors.some(a => a.kind === "pickup" && a.itemId === itemId)) return;
  actors.push({
    kind: "pickup",
    name: "pickup",
    itemId,
    x: x | 0,
    y: y | 0,
    frame: 0,
    last: 0,
    img: pickupSpriteFor(itemId),
    talkHit: { x: 0, y: 0, w: 16, h: 16 },
    solid: true,
    animMs: NPC_FRAME_MS,
    sparkle: itemId === "moon_stone" || itemId === "iron_heart",
    sparkleColor: itemId === "iron_heart" ? "red" : "green",
    sparklePhase: Math.random() * Math.PI * 2,
  });
}

// ---- Space Warp FX ----
let spaceWarpFx = { active: false, start: 0 };
const WARP_SHAKE_MS = 800;
const WARP_SPIN_MS  = 1200;
const WARP_TOTAL_MS = WARP_SHAKE_MS + WARP_SPIN_MS;
const SPACE_BOSS_TIMING = {
  introDelay: 5000,
  shortDelay: 1000,
  preStyleDelay: 2000,
  whiteFlash: 2000,
  whiteFlashChange: 1000,
  postRestoreLineDelay: 1000,
  preSuckDelay: 1000,
  suck: 1500,
  blackHoleHold: 10000,
  regroupFadeIn: 800,
  preBossDropDelay: 3000,
  bossDrop: 4500,
  battleAfterBossDrop: 7500,
  fadeOut: 800,
  fadeHold: 600,
  fadeIn: 800,
};
const SPACE_BOSS_BOSS_LINES = [
  "ア　ア　ア　ウ　ア",
  "ア・・・",
  "・・・わにさん",
  "わに",
  "いるかさん",
  "わにさん　と",
  "こんにちは",
  "あなた　はーい",
  "・・・・",
  "・・・・・・・・・",
  "はァい　こんにちは　わたくしが　あなたがたの　さがしものです。",
];
const SPACE_BOSS_TYPE_CHAR_MS = 90;
const SPACE_BOSS_TYPE_BACKSPACE_MS = 42;
const SPACE_BOSS_TYPE_LINE_HOLD_MS = 620;
const SPACE_BOSS_TYPE_RETYPE_PAUSE_MS = 450;
const SPACE_BOSS_TYPE_RANT_HOLD_MS = 760;
const SPACE_BOSS_TYPE_TRANSITION_HOLD_MS = 650;
const SPACE_BOSS_BOSS_RETYPE_DRAFT = "おどろいたでしょう";
const SPACE_BOSS_BOSS_RETYPE_FINAL = "驚いたでしょう。私があなた方地球人類と同じ姿をしているものだから。";
const SPACE_BOSS_BOSS_AFTER_LINE = "本来、私は物質としての姿を持ちません。";
const SPACE_BOSS_BOSS_MIMIC_LINES = [
  "あなた方との対話を円滑にするため、",
  "地球人類と呼ばれるものの姿を模倣させていただきました。",
];
const SPACE_BOSS_BOSS_LIKE_LINE = "お気に召しましたか？";
const SPACE_BOSS_BOSS_KNOW_LINE = "あなた方のことはよくわかりました。";
const SPACE_BOSS_BOSS_GLITCH_PREFACE_LINES = [
  "◇※△□○は、◇◇◇記□※○○に△◇※。",
  "◇◇◇□※奥で、◇◇◇な◇※△が反□◇※。",
  "◇◇問◇は、◇◇◇方の△◇でなく△○□◇※。",
];
const SPACE_BOSS_BOSS_GLITCH_QUESTION = "◇◇◇△□◇○※☆？";
const SPACE_BOSS_BOSS_CHOICES = ["はい", "いいえ"];
const SPACE_BOSS_BOSS_CHOICE_RANT_LINES = [
  "◇□△※○◇◇※△□○※◇△□※○◇※△□○",
  "○◇※□△◇◇／※○□△※◇○□△◇※○□△",
  "観◇△□※○◇□△※※※○□◇△※○□◇△※",
  "ゆ◇◇※□△○◇※□△○◇※□△○◇※□△○",
  "◇◇◇開△□※◇○△※□◇○△※□",
];
const SPACE_BOSS_TALK = [
  { wait: SPACE_BOSS_TIMING.introDelay, pages: [["さあ、しばらくおしゃべりでもしてよっか。"], ["ここからはけっこう遠いからね。"]] },
  { wait: SPACE_BOSS_TIMING.shortDelay, pages: [["なぜ息ができるんだって？"], ["とうぜん、ぼくらが一緒にいるからさ。"]] },
  { fade: true, pages: [["そうだね。つまり地球のきみたちの次元に合わせて言うなら、"], ["宇宙人はかならず三つ子で生まれてくると、説明することもできるね。"], ["でも、ぼくの生まれた次元からみればひとつの体さ。"], ["地球人はあらかじめ折りたたまれた状態で生まれてくるわけだ。"], ["おもしろいね。"]] },
  { fade: true, pages: [["はじめて地球にきた日をおぼえているよ。"], ["きみたちの一人が生まれた日のことさ。"], ["かわいかったなぁ。"]] },
  { fade: true, pages: [["おでんは宇宙人が地球に伝えたんだよ。"], ["カップヌードルもね。"], ["あとはねー、"]] },
  { fade: true, pages: [["ユーフォー？カップ焼きそばの？"], ["ハハハ、それはちがうよー。"], ["あ、あとはウイダー！ウイダーは宇宙製だよ。"], ["忘れてた忘れた。"]] },
  { fade: true, onBlack: () => { sbBlackHole = { y: -20, r: 50 }; }, pages: [["さぁ、ついたよ。"], ["覚悟を決めるんだね。"], ["もう後戻りはできない。"], ["たのしかったよ、しなないでね。"]] },
  { wait: SPACE_BOSS_TIMING.preStyleDelay, pages: [["あ、そうだ。"], ["さいごの戦いなのに、そんな感じじゃカッコつかないだろう。"], ["それ！"]] },
  { action: "whiteFlash" },
  { pages: [["やっぱりこれがきみたちってかんじだよ。"]] },
  { wait: SPACE_BOSS_TIMING.postRestoreLineDelay, pages: [["それじゃ！"], ["はりきっていってらっしゃい！"]] },
  { action: "suck" },
  { action: "regroup" },
  { wait: SPACE_BOSS_TIMING.preBossDropDelay },
  { action: "dropBoss" },
];

function startSpaceWarp(targetMap = "space") {
  spaceWarpFx = { active: true, start: performance.now(), done: false, target: targetMap };
  input.lock();
  playTimeMachineShine();
}

// ---- Toast (item use message) ----
const toast       = createToast({ BASE_W, BASE_H });
const questAlert  = createQuestAlert({ BASE_W });
let afloBlackout = { active: false, phase: "idle", phaseStart: 0 };
let spaceStars = [];
let spaceVel = { x: 0, y: 0 };
const SPACE_MOON_ENABLED = true;
const SPACE_MOON_SYSTEM_ENABLED = true;
const SPACE_MOON = { x: 1820, y: 120, w: 140, h: 140, cx: 1820 + 70, cy: 120 + 70, surfaceR: 78 };
let spaceMoonAttach = false;
let spaceMoonAngle = 0;
let spaceMoonRadius = SPACE_MOON.surfaceR;
let spaceMoonCooldownUntil = 0;
let timeMachineFx = { active: false, start: 0, until: 0, onDone: null };
let pageTurnFx = {
  active: false,
  start: 0,
  switched: false,
  switchedAt: 0,
  destMap: null,
  spawnAt: null,
  dir: "rtl",
};
const TM_FADE_OUT_MS = 400;
const TM_FADE_IN_MS  = 400;
let timeMachineTravelFx = {
  active: false,
  start: 0,
  switched: false,
  switchedAt: 0,
  destMap: null,
  spawnAt: null,
  dir: "rtl",
};
const SPACE_O2_MAX = 12000;
let spaceO2 = SPACE_O2_MAX;
let spaceO2LastMs = 0;
let spaceO2Depleted = false;
function getSpaceO2Capacity() {
  return STATE.headwear === "kingyobachi" ? SPACE_O2_MAX * 2 : SPACE_O2_MAX;
}
function getSpaceO2DrainRate() {
  return STATE.headwear === "kingyobachi" ? 0.2 : 1;
}
function isAfloClubBgmLocked() {
  return current.id === "afloclub";
}
function setBgmOverrideSafe(src) {
  if (isAfloClubBgmLocked()) return;
  bgmCtl.setOverride(src);
}
const bgmOverrideStack = [];
function currentBgmOverrideSnapshot() {
  return bgmCtl.getOverrideSrc();
}
function pushBgmOverride(src, { safe = true } = {}) {
  bgmOverrideStack.push(currentBgmOverrideSnapshot());
  if (safe) setBgmOverrideSafe(src);
  else bgmCtl.setOverride(src);
}
function popBgmOverride({ safe = true } = {}) {
  const prev = bgmOverrideStack.length ? bgmOverrideStack.pop() : null;
  if (safe) setBgmOverrideSafe(prev);
  else bgmCtl.setOverride(prev);
}
function restoreItemBgm() {
  popBgmOverride();
}
function lockItemUseWait({ restoreBgm = false } = {}) {
  input.lock();
  if (restoreBgm) setTimeout(restoreItemBgm, 670);
}
function setBgmMapSafe(src) {
  if (isAfloClubBgmLocked()) return;
  stopShootingBgm();
  stopAfloClubBgm();
  bgmCtl.setMap(src);
}
function initSpaceStars() {
  if (spaceStars.length) return;
  const rand = (n) => Math.random() * n;
  spaceStars = Array.from({ length: 440 }, () => ({
    x: rand(2048),
    y: rand(1536),
    r: Math.random() < 0.15 ? 2 : 1,
    a: 0.45 + Math.random() * 0.55,
    speed: 0.0015 + Math.random() * 0.004,
    phase: Math.random() * Math.PI * 2,
  }));
}
function drawSpaceBackdrop(tt) {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  for (const s of spaceStars) {
    const x = (s.x - cam.x) | 0;
    const y = (s.y - cam.y) | 0;
    if (x < -4 || y < -4 || x > BASE_W + 4 || y > BASE_H + 4) continue;
    const tw = 0.5 + 0.5 * Math.sin(tt * s.speed + s.phase);
    ctx.globalAlpha = s.a * (0.55 + tw * 0.45);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y, s.r, s.r);
  }
  if (SPACE_MOON_ENABLED) {
    const mx = (SPACE_MOON.x - cam.x) | 0;
    const my = (SPACE_MOON.y - cam.y) | 0;
    if (SPRITES.moon && mx < BASE_W && my < BASE_H && mx + SPACE_MOON.w > 0 && my + SPACE_MOON.h > 0) {
      ctx.globalAlpha = 1;
      ctx.drawImage(SPRITES.moon, mx, my, SPACE_MOON.w, SPACE_MOON.h);
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
let _sbStars = null;
let sbBlackHole = false;
let sbSuck = null;
let sbBoss = null;
let sbWhiteFlash = null;
let _whiteFlash = null;
let sbBossType = null;
let sbCactusIntro = null;
let sbLastBattleStarted = false;
function drawSpaceBossBackdrop(tt) {
  if (!_sbStars) {
    _sbStars = Array.from({ length: 120 }, () => ({
      x: Math.random() * BASE_W,
      y: Math.random() * BASE_H,
      r: Math.random() < 0.15 ? 2 : 1,
      a: 0.5 + Math.random() * 0.5,
      speed: 0.3 + Math.random() * 0.7,
    }));
  }
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.fillStyle = "#fff";
  for (const s of _sbStars) {
    s.y += s.speed;
    if (s.y > BASE_H) { s.y = -2; s.x = Math.random() * BASE_W; }
    ctx.globalAlpha = s.a;
    ctx.fillRect(s.x | 0, s.y | 0, s.r, s.r);
  }
  if (sbBlackHole) {
    const bx = BASE_W / 2;
    let by = sbBlackHole.y ?? -20;
    let br = sbBlackHole.r ?? 50;
    if (sbBlackHole.animStart != null) {
      const e = nowMs() - sbBlackHole.animStart;
      const p = Math.min(1, Math.max(0, e / sbBlackHole.duration));
      const eased = p * p;
      by = sbBlackHole.startY + (sbBlackHole.endY - sbBlackHole.startY) * eased;
      br = sbBlackHole.startR + (sbBlackHole.endR - sbBlackHole.startR) * eased;
    }
    const rot = tt / 3000;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot);
    const ring = ctx.createRadialGradient(0, 0, br * 0.3, 0, 0, br);
    ring.addColorStop(0, "rgba(0,0,0,1)");
    ring.addColorStop(0.4, "rgba(0,0,0,0.95)");
    ring.addColorStop(0.6, "rgba(80,0,160,0.4)");
    ring.addColorStop(0.8, "rgba(255,120,40,0.25)");
    ring.addColorStop(1, "rgba(255,180,60,0)");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(0, 0, br, 0, Math.PI * 2);
    ctx.fill();
    const disc = ctx.createRadialGradient(0, 0, 0, 0, 0, br * 0.35);
    disc.addColorStop(0, "rgba(0,0,0,1)");
    disc.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(0, 0, br * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawSpaceBossCactusHole(tt);
  ctx.restore();
  ctx.globalAlpha = 1;
  if (sbBoss) drawUraboss(tt);
}

function drawSpaceBossCactusHole(tt) {
  if (!sbCactusIntro) return;
  const fx = sbCactusIntro;
  const elapsed = nowMs() - fx.startMs;
  const growP = Math.min(1, elapsed / 520);
  const jumpP = fx.phase === "jump" ? Math.min(1, (nowMs() - fx.phaseStartMs) / 820) : 0;
  const r = 4 + Math.sin(growP * Math.PI / 2) * 13 + Math.sin(tt / 170) * 0.8;
  const alpha = Math.max(0, Math.min(1, growP * 1.4));
  if (alpha <= 0 || r <= 1) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(fx.holeX, fx.holeY);
  ctx.rotate(tt / 360 + jumpP * 2.6);
  ctx.fillStyle = "rgba(92,55,170,0.32)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20,10,42,0.74)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(190,220,255,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.15, r * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawUraboss(tt) {
  const now = nowMs();
  const elapsed = now - sbBoss.startMs;
  const p = Math.min(1, elapsed / sbBoss.duration);
  const ease = 1 - Math.pow(1 - p, 3);
  const x = BASE_W / 2;
  const y = sbBoss.startY + (sbBoss.endY - sbBoss.startY) * ease;
  const size = sbBoss.size;
  const t = now / 1000;
  const low = SPRITES.urabossLow;
  const mid = SPRITES.urabossMid;
  const top = SPRITES.urabossTop;
  ctx.save();
  drawUrabossPsychedelicPop(x, y, t, size);
  if (low.complete && low.naturalWidth) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * -2.2);
    ctx.drawImage(low, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  if (mid.complete && mid.naturalWidth) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 2.8);
    ctx.drawImage(mid, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  if (top.complete && top.naturalWidth) {
    ctx.drawImage(top, x - size / 2, y - size / 2, size, size);
  }
  ctx.restore();
}
function drawUrabossPsychedelicPop(x, y, t, size) {
  const scale = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.72;
  const colors = ["#ff1744", "#ffea00", "#00e676", "#00b0ff", "#ff00e6", "#ff7a00"];
  for (let i = 0; i < 18; i++) {
    const a = t * 1.6 + (i * Math.PI * 2) / 18;
    const inner = (17 + (i % 2) * 5) * scale;
    const outer = (58 + Math.sin(t * 4 + i) * 6) * scale;
    const w = (i % 3 === 0 ? 9 : 6) * scale;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.045) * inner, Math.sin(a - 0.045) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.lineTo(Math.cos(a + 0.045) * inner, Math.sin(a + 0.045) * inner);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect((Math.cos(a) * (outer - 3 * scale)) | 0, (Math.sin(a) * (outer - 3 * scale)) | 0, w, w);
  }
  ctx.globalAlpha = 0.58;
  ctx.lineWidth = 3 * scale;
  for (let i = 0; i < 4; i++) {
    const r = (31 + i * 8 + Math.sin(t * 5 + i) * 2) * scale;
    ctx.strokeStyle = colors[(i * 2 + (t * 4 | 0)) % colors.length];
    ctx.beginPath();
    ctx.arc(0, 0, r, t * (i % 2 ? -1.8 : 1.4), t * (i % 2 ? -1.8 : 1.4) + Math.PI * 1.35);
    ctx.stroke();
  }
  ctx.restore();
}
function wrapSpaceBossTypeText(text, maxWidth) {
  const lines = [];
  let row = "";
  for (const ch of [...text]) {
    const next = row + ch;
    if (row && ctx.measureText(next).width > maxWidth) {
      lines.push(row);
      row = ch;
    } else {
      row = next;
    }
  }
  if (row || !lines.length) lines.push(row);
  return lines;
}
function drawSpaceBossTypedSpeech(tt) {
  if (!sbBossType) return;
  const fx = sbBossType;
  const line = getSpaceBossTypeLine(fx);
  const visible = [...line].slice(0, fx.charIndex).join("");
  if (!visible) return;

  ctx.save();
  const prevSkipShadow = ctx._skipTextShadow;
  ctx._skipTextShadow = true;
  ctx.font = "bold 12px PixelMplus10";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.82)";
  const lines = wrapSpaceBossTypeText(visible, BASE_W - 18);
  const lineH = 16;
  const baseY = (BASE_H / 2 - ((lines.length - 1) * lineH) / 2) | 0;
  const flicker = Math.sin(tt / 58 + fx.lineIndex * 1.7) > 0.74;
  ctx.fillStyle = flicker ? "#cafff5" : "#fff7ee";
  for (let i = 0; i < lines.length; i++) {
    const y = baseY + i * lineH;
    const jitter = flicker && i === lines.length - 1 ? 1 : 0;
    ctx.strokeText(lines[i], BASE_W / 2 + jitter, y);
    ctx.fillText(lines[i], BASE_W / 2 + jitter, y);
  }
  if (fx.waitingChoice) {
    ctx.font = "10px PixelMplus10";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const labels = SPACE_BOSS_BOSS_CHOICES;
    const hPad = 6;
    const gapW = 16;
    const widths = labels.map(label => Math.ceil(ctx.measureText(label).width));
    const boxWs = widths.map(w => w + hPad * 2);
    const totalW = boxWs.reduce((sum, w, i) => sum + w + (i < boxWs.length - 1 ? gapW : 0), 0);
    let choiceX = ((BASE_W - totalW) / 2) | 0;
    const choiceY = Math.min(BASE_H - 22, (baseY + lines.length * lineH + 12) | 0);

    for (let i = 0; i < labels.length; i++) {
      if (fx.choiceIndex === i) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(choiceX, choiceY - 1, boxWs[i], 13);
        ctx.fillStyle = "#000";
        ctx.fillText(labels[i], choiceX + hPad, choiceY);
      } else {
        ctx.fillStyle = "#fff";
        ctx.fillText(labels[i], choiceX + hPad, choiceY);
      }
      choiceX += boxWs[i] + (i < labels.length - 1 ? gapW : 0);
    }
  }
  ctx._skipTextShadow = prevSkipShadow;
  ctx.restore();
}
function drawSpaceO2Meter() {
  const ratio = Math.max(0, Math.min(1, spaceO2 / getSpaceO2Capacity()));
  const danger = ratio <= 0.2;
  const cx = BASE_W >> 1;
  const cy = 24;
  const lineW = STATE.headwear === "kingyobachi" ? 60 : 30;
  const lineH = 2;
  const lineX = cx - (lineW >> 1);
  const lineY = cy + 7;
  const fillW = Math.round(lineW * ratio);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = danger ? "rgba(255,80,80,0.35)" : "rgba(255,255,255,0.22)";
  ctx.fillRect(lineX, lineY, lineW, lineH);
  ctx.fillStyle = danger ? "#ff6060" : "#ffffff";
  ctx.fillRect(lineX, lineY, fillW, lineH);

  ctx.fillStyle = danger ? "#ff8080" : "#ffffff";
  ctx.font = "normal 10px PixelMplus10";
  ctx.textBaseline = "middle";
  const label = "O2";
  const tw = Math.round(ctx.measureText(label).width);
  ctx.fillText(label, (cx - (tw >> 1)) | 0, cy);
  ctx.restore();
}
function startTimemachineFx(onDone = null) {
  interactionSession.begin();
  input.lock();
  const now = nowMs();
  timeMachineFx = { active: true, start: now, until: now + 7000, onDone };
  playTimeMachineShine();
  try { navigator.vibrate?.([70, 40, 90, 40, 120, 40, 160]); } catch (_) {}
}
function startPageTurnTravel(destMap, spawnAt, dir = "rtl") {
  interactionSession.begin();
  input.lock();
  pageTurnPrevCtx.clearRect(0, 0, BASE_W, BASE_H);
  pageTurnPrevCtx.drawImage(canvas, 0, 0, BASE_W, BASE_H);
  pageTurnFx = {
    active: true,
    start: nowMs(),
    switched: false,
    switchedAt: 0,
    destMap,
    spawnAt,
    dir,
  };
  loadMap(destMap, { spawnAt });
}
function startTimeMachineTravel(destMap, spawnAt, dir = "rtl") {
  interactionSession.begin();
  input.lock();
  timeMachineTravelFx = {
    active: true,
    start: nowMs(),
    switched: false,
    switchedAt: 0,
    destMap,
    spawnAt,
    dir,
  };
  try { playTimeMachineShine(); } catch (_) {}
  try { navigator.vibrate?.([40,20,60,20,80,20,110,20,150,20,200]); } catch (_) {}
}
function drawTimeMachineTravelFx(tt) {
  if (!timeMachineTravelFx.active) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (!timeMachineTravelFx.switched) {
    const elapsed = tt - timeMachineTravelFx.start;
    const p = Math.max(0, Math.min(1, elapsed / TM_FADE_OUT_MS));
    ctx.globalAlpha = p;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  } else {
    const p = !mapReady ? 0 : Math.max(0, Math.min(1, (tt - timeMachineTravelFx.switchedAt) / TM_FADE_IN_MS));
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
  }
  ctx.restore();
}
function drawPageTurnFx(tt) {
  if (!pageTurnFx.active) return;
  const revealMs = 420;
  const rtl = pageTurnFx.dir !== "ltr";
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (!pageTurnFx.switched) {
    ctx.drawImage(pageTurnPrevCanvas, 0, 0, BASE_W, BASE_H);
  } else {
    const p = !mapReady ? 0 : Math.max(0, Math.min(1, (tt - pageTurnFx.switchedAt) / revealMs));
    const slide = Math.max(0, Math.min(BASE_W, Math.floor(BASE_W * p)));
    const x = rtl ? -slide : slide;
    ctx.drawImage(pageTurnPrevCanvas, x, 0, BASE_W, BASE_H);
  }

  ctx.restore();
}
function startAfloClubBlackout(t) {
  const ts = typeof t === "number"
    ? t
    : (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
  interactionSession.end();
  input.lock();
  playClickOn();
  stopAfloClubBgm();
  afloBlackout = { active: true, phase: "blackout", phaseStart: ts };
}
function updateAfloClubBlackout(t) {
  if (!afloBlackout.active) return false;
  const elapsed = t - afloBlackout.phaseStart;
  if (afloBlackout.phase === "blackout" && elapsed >= 5000) {
    afloBlackout.phase = "restore";
    afloBlackout.phaseStart = t;
    return true;
  }
  if (afloBlackout.phase === "restore" && elapsed >= 650) {
    afloBlackout.phase = "silent_gap";
    afloBlackout.phaseStart = t;
    return true;
  }
  if (afloBlackout.phase === "silent_gap" && elapsed >= 220) {
    afloBlackout.phase = "cooldown";
    afloBlackout.phaseStart = t;
    if (current.id === "afloclub") startAfloClubBgm();
    return true;
  }
  if (afloBlackout.phase === "cooldown" && elapsed >= 1000) {
    afloBlackout = { active: false, phase: "idle", phaseStart: 0 };
    input.unlock();
    return true;
  }
  return true;
}
function drawAfloClubBlackout(tt) {
  if (!afloBlackout.active) return;
  let visible = true;
  if (afloBlackout.phase === "silent_gap" || afloBlackout.phase === "cooldown") {
    visible = false;
  } else if (afloBlackout.phase === "restore") {
    const p = tt - afloBlackout.phaseStart;
    visible = ((p / 70) | 0) % 2 === 0;
  }
  if (!visible) return;
  drawMapImg(SPRITES.afloclub_off);
}

// ---- Inventory (externalized) ----
const inventory = createInventory({
  BASE_W,
  BASE_H,
  input,
  itemName,
  itemBgmSrc,
  stopBgm: () => pushBgmOverride("about:blank"),
  unlockBgm: () => bgmCtl.unlock(),
  setOverrideBgm: (src) => {
    if (src == null) { restoreItemBgm(); return; }
    setBgmOverrideSafe(src);
    if (src === "assets/audio/duckF.mp3" && current.id === "seahole") {
      input.lock();
      setTimeout(() => { input.unlock(); startSeaholeCutscene(); }, 2000);
    }
  },
  toast,
  startItems: START_INVENTORY_NORMAL,
  visibleRows: 10,
});

// ---- Menu (タブ選択 → にゅん展開) ----
const menu = createMenu({
  BASE_W,
  BASE_H,
  input,
  inventory,
  itemName,
  itemBgmSrc,
  stopBgm:        () => pushBgmOverride("about:blank"),
  unlockBgm:      () => bgmCtl.unlock(),
  setOverrideBgm: (src) => {
    if (src == null) { restoreItemBgm(); return; }
    setBgmOverrideSafe(src);
    if (src === "assets/audio/duckF.mp3" && current.id === "seahole") {
      input.lock();
      setTimeout(() => { input.unlock(); startSeaholeCutscene(); }, 2000);
    }
  },
  toast,
  mobile: MOBILE,
  onUseItem: (id) => {
    return runFieldInteraction(() => {
    if (id === "pickaxe") {
      const f = footBox(leader.x, leader.y);
      const fx = (f.x + (f.w >> 1)) | 0;
      const fy = (f.y + (f.h >> 1)) | 0;
      const canDigTreasure =
        current.id === "outdoor" &&
        !STATE.flags.treasureDug &&
        STATE.flags.shovelHitHard &&
        fx >= SHOVEL_DIG_TRIGGER.x &&
        fx < SHOVEL_DIG_TRIGGER.x + SHOVEL_DIG_TRIGGER.w &&
        fy >= SHOVEL_DIG_TRIGGER.y &&
        fy < SHOVEL_DIG_TRIGGER.y + SHOVEL_DIG_TRIGGER.h;
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        if (canDigTreasure) {
          STATE.flags.treasureDug = true;
          dialog.open([
            ["あしもとを掘った。"],
            ["ガキン。"],
          ], () => {
            exclamations.push({
              sx: ((leader.x + 8) - cam.x) | 0,
              sy: (leader.y - cam.y) | 0,
              startMs: nowMs(),
              duration: 2000,
              char: "!",
              color: "#e00",
              opaque: true,
            });
            input.lock();
            setTimeout(() => {
              input.unlock();
              STATE.money = Math.min(STATE.money + 999999, 999999);
              dialog.open([
                ["埋蔵金だ！"],
                ["なんと埋蔵金を見つけた！"],
                ["999999ENを手に入れた。"],
              ], null, "sign");
            }, 2000);
          }, "sign");
          return;
        }
        dialog.open([
          ["あしもとを掘った。"],
          ["ガキン。"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "shovel") {
      const f = footBox(leader.x, leader.y);
      const fx = (f.x + (f.w >> 1)) | 0;
      const fy = (f.y + (f.h >> 1)) | 0;
      const inDigSpot =
        current.id === "outdoor" &&
        !STATE.flags.treasureDug &&
        fx >= SHOVEL_DIG_TRIGGER.x &&
        fx < SHOVEL_DIG_TRIGGER.x + SHOVEL_DIG_TRIGGER.w &&
        fy >= SHOVEL_DIG_TRIGGER.y &&
        fy < SHOVEL_DIG_TRIGGER.y + SHOVEL_DIG_TRIGGER.h;
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        if (inDigSpot) {
          STATE.flags.shovelHitHard = true;
          dialog.open([
            ["あしもとを掘った。"],
            ["ザクり。"],
          ], () => {
            exclamations.push({
              sx: ((leader.x + 8) - cam.x) | 0,
              sy: (leader.y - cam.y) | 0,
              startMs: nowMs(),
              duration: 2000,
              char: "?",
              color: "#fff",
              opaque: true,
            });
            input.lock();
            setTimeout(() => {
              input.unlock();
              dialog.open([
                ["なにか硬いものにあたってこれ以上掘れない。"],
              ], null, "sign");
            }, 2000);
          }, "sign");
          return;
        }
        dialog.open([
          ["あしもとを掘った。"],
          ["ザクり。"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "gunter") {
      inventory.removeItem("gunter");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはぐんてをたべてみた！"],
          ["イマイチ！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "ninja_stone") {
      inventory.removeItem("ninja_stone");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはニンジャストーンをたべてみた！"],
          ["カチカチ！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "hone") {
      inventory.removeItem("hone");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはほねをたべてみた！"],
          ["ダシのあじ！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "tacos") {
      inventory.removeItem("tacos");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはタコスをたべてみた！"],
          ["最高！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "vodka") {
      inventory.removeItem("vodka");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはウォッカをたべてみた！"],
          ["ウゲー！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "ice_cream") {
      inventory.removeItem("ice_cream");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはアイスクリームをたべてみた！"],
          ["あまい、つめたーい。"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "gyoza") {
      inventory.removeItem("gyoza");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはギョウザをたべてみた！"],
          ["ジューシー！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "yakisoba") {
      inventory.removeItem("yakisoba");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはやきそばをたべてみた！"],
          ["ソースがきいてる！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "beer") {
      inventory.removeItem("beer");
      const seaViewBeer = isShoreOverlayInCamera();
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        if (seaViewBeer) achieveQuest("18");
        input.unlock();
        dialog.open([
          ["ナツミはビールをのんでみた！"],
          ["カーッ！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "love_song_snack") {
      inventory.removeItem("love_song_snack");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミはラブソングのおやつをたべてみた！"],
          ["おいしい！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "pizza") {
      inventory.removeItem("pizza");
      const ateDeliveryPizza = STATE.flags.pizzaJobActive && !STATE.flags.pizzaDelivered;
      if (STATE.flags.pizzaJobActive && !STATE.flags.pizzaDelivered) {
        STATE.flags.pizzaAte = true;
      }
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        dialog.open([
          ["ナツミはピザをたべてしまった！"],
          ["激うま！"],
          ["商品をたべてしまった。"],
          ["あやまりにいこう。"],
        ], () => {
          if (ateDeliveryPizza) {
            setTimeout(() => achieveQuest("16"), 1000);
          }
        }, "sign");
      }, 700);
      return true;
    }
    if (id === "moon_stone") {
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        dialog.open([
          ["ナツミはつきのいしをたべてみた！"],
          ["オエーーーーー！"],
          ["たべれたものではない！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "iron_heart") {
      inventory.removeItem("iron_heart");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミは鉄の心臓をたべてみた！"],
          ["ムムム・・・。"],
        ], () => {
          input.lock();
          fade.startCutFade(nowMs(), {
            outMs: 280,
            holdMs: 0,
            inMs: 280,
            onBlack: () => {
              stopShootingBgm();
              setBgmOverrideSafe("about:blank");
              input.unlock();
              startMechaEvolutionScene();
            },
          });
        }, "sign");
      }, 700);
      return true;
    }
    if (id === "densetsu_no_ken") {
      inventory.removeItem("densetsu_no_ken");
      lockItemUseWait();
      setTimeout(() => {
        STATE.flags.eatCount = (STATE.flags.eatCount || 0) + 1;
        if (STATE.flags.eatCount >= 10) achieveQuest("26");
        input.unlock();
        dialog.open([
          ["ナツミは伝説の剣をたべてみた！"],
          ["ウンマイ！"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "temp_item_1") {
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        dialog.open([["仮アイテム１をつかった！"]], null, "sign");
      }, 700);
      return true;
    }
    if (id === "temp_item_2") {
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        dialog.open([["仮アイテム２をつかった！"]], null, "sign");
      }, 700);
      return true;
    }
    if (id.startsWith("otsuge_")) {
      const n = parseInt(id.slice(7), 10);
      const quest = QUESTS.find(q => q.id === String(n).padStart(2, "0"));
      const cond = quest?.cond ?? "？？？";
      lockItemUseWait();
      setTimeout(() => {
        input.unlock();
        dialog.open([
          [`お告げの書${n}をひらいた。`],
          [`中には「${cond}」としるされている。`],
        ], null, "sign");
      }, 700);
      return true;
    }
    const HEADWEAR_DEFS = {
      helmet:      { key: "helmet",      on: "ヘルメットをかぶった！",      off: "ヘルメットをはずした！" },
      afro:        { key: "afro",        on: "アフロセットをつけた！",      off: "アフロセットをはずした！" },
      kingyobachi: { key: "kingyobachi", on: "きんぎょばちをかぶった！",    off: "きんぎょばちをはずした！" },
      s_hat:       { key: "s_hat",       on: "サボテンハットをかぶった！",  off: "サボテンハットをはずした！" },
    };
    if (HEADWEAR_DEFS[id]) {
      const def = HEADWEAR_DEFS[id];
      lockItemUseWait();
      if (STATE.headwear === def.key) {
        STATE.headwear = null;
        setTimeout(() => { input.unlock(); dialog.open([[def.off]], null, "sign"); }, 700);
      } else {
        setTimeout(() => {
          input.unlock();
          dialog.open([[def.on]], () => { STATE.headwear = def.key; }, "sign");
        }, 700);
      }
      return true;
    }
    return false;
    });
  },
});

// ---- Battle ----
let pendingBattlePages   = null; // { win, lose, winEnding }
let partyVisible         = true;
let pendingEndingFadeIn  = false;
let continueRevealFx     = null; // { phase: "loading" | "reveal", startMs, duration, cx, cy, maxR }
let spaceBossWhiteReunion = null; // { startMs }
let spaceBossMoonScene = null; // { startMs, stars }
let spaceBossOutdoorEpilogue = null; // { fadeStartMs, fadeMs, waitMs }

// ---- Seahole bubbles (オブジェクトプール) ----
const BUBBLE_POOL_SIZE = 32;
const bubblePool = Array.from({ length: BUBBLE_POOL_SIZE }, () => ({ active: false }));
let bubbleLastSpawn = [0, 0, 0, 0]; // per character

function acquireBubble() {
  for (let i = 0; i < BUBBLE_POOL_SIZE; i++) {
    if (!bubblePool[i].active) return bubblePool[i];
  }
  return null; // プール枯渇時はスキップ
}

// ---- Seahole fish ----
const FISH_COLORS = ["#f44","#44f","#ff4","#f84","#4f4","#f4f","#4ff","#f48","#fa0","#a0f"];
const fishArr = [];
let fishLastT = 0;

function initFish() {
  fishArr.length = 0;
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.18 + Math.random() * 0.22;
    fishArr.push({
      x: 20 + Math.random() * 210,
      y: 20 + Math.random() * 195,
      speed,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.35,
      size: 2 + Math.random() * 2,
      color: FISH_COLORS[i % FISH_COLORS.length],
      turnTimer: Math.random() * 180 | 0,
      turnInterval: 120 + Math.random() * 240 | 0,
    });
  }
  fishLastT = 0;
}

// ---- 負け演出: コミックポップ ----
let beatPops = []; // { text, x, y, startMs, duration }

// ---- Encounter transition (画面が砕け散る) ----
let battleTransition = null; // { off, shards, startMs, duration, flashUntil, onDone }
const BT_COLS = 10, BT_ROWS = 8;
const BT_DURATION = 550;

function startBattleTransition(onDone) {
  playGlassShatter();
  // 現在のキャンバスをスナップショット（ゲーム解像度のまま）
  const off = document.createElement("canvas");
  off.width  = BASE_W;
  off.height = BASE_H;
  const offCtx = off.getContext("2d");
  offCtx.imageSmoothingEnabled = false;
  offCtx.drawImage(canvas, 0, 0, BASE_W, BASE_H);

  const sw = BASE_W / BT_COLS;
  const sh = BASE_H / BT_ROWS;
  const cx = BASE_W / 2;
  const cy = BASE_H / 2;
  const shards = [];

  for (let r = 0; r < BT_ROWS; r++) {
    for (let c = 0; c < BT_COLS; c++) {
      const sx = c * sw;
      const sy = r * sh;
      const pcx = sx + sw / 2;
      const pcy = sy + sh / 2;
      const dx = pcx - cx;
      const dy = pcy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = (0.25 + Math.random() * 0.25);
      shards.push({
        sx, sy,
        vx: (dx / dist) * speed + (Math.random() - 0.5) * 0.1,
        vy: (dy / dist) * speed + (Math.random() - 0.5) * 0.1,
        rotSpeed: (Math.random() - 0.5) * 0.009,
      });
    }
  }

  const now = nowMs();
  battleTransition = {
    off, shards, startMs: now,
    duration: BT_DURATION,
    flashUntil: now + 100,
    onDone,
  };
}
const ending     = createEnding({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H });
const title      = createTitle({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input, pocketEdition: MOBILE });
const charSelect = createCharSelect({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input, sprites: SPRITES, mobile: MOBILE });
const loading    = createLoading({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H });

// ---- Save / Load ----
const SAVE_KEY = "rpg_save";
let saveNotice = null; // { text, until }

const PROLOGUE_PAGES = [
  [
    "202X年、モリタサキ・イン・ザ・プールは暇を持て余していた。",
    "",
    "来る日も来る日も、くっちゃねくっちゃねのぐーたら三昧。",
    "",
    "そんな時、誰かが口を開いた。",
    "",
    "「セカンドアルバムを作ろう！」",
    "",
    "その一言で、この腐ったコケのような生活に終止符が打たれた。",
    "",
    "そうと決まれば、所属事務所から制作費をせしめねばなるまい。",
    "",
    "一行はヴィニールジャンキーレコーディングスの社長、",
    "ミナミの元へ向かうこととなったのであった。",
  ].join("\n"),
];

let prologue = {
  active: false,
  page: 0,
  startedAt: 0,
  revealed: false,
  typeSeCharCount: 0,
};

function hasSaveData() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (_) {
    return false;
  }
}

function startNewGameFlow() {
  current.id = "";
  mapReady = false;
  resetProgress();
  inventory.resetItems(START_INVENTORY_NORMAL);
  bgmCtl.setOverride("assets/audio/bgm_select.mp3");
  bgmCtl.unlock();
  charSelect.start(
    (leaderIdx) => {
      bgmCtl.setOverride("about:blank");
      setGameResolution(BASE_W, BASE_H);
      setupParty(leaderIdx);
      resetHeightState();
      inventory.resetItems(START_INVENTORY_NORMAL);
      startPrologue();
    },
    () => {
      bgmCtl.setOverride("about:blank");
      startTitle();
    },
  );
}

function startPrologue() {
  bgmCtl.setOverride("about:blank");
  setGameResolution(BASE_W * 2, BASE_H * 2);
  prologue = {
    active: true,
    page: 0,
    startedAt: nowMs(),
    revealed: false,
    typeSeCharCount: 0,
    fadingOut: false,
    fadeOutStartedAt: 0,
    fadeOutMs: 800,
  };
  input.clear();
}

function finishPrologue() {
  prologue.active = false;
  setGameResolution(BASE_W, BASE_H);
  bgmCtl.setOverride(null);
  forceGroundHeightState();
  loadMap("moritasaki_room", { resetHeight: true });
  fade.startIrisFade(nowMs(), {
    outMs:     1,
    holdMs:    500,
    inMs:      700,
    pauseMs:   0,
    skipClose: true,
    inMode:    "iris",
  });
}

function prologueAdvancePressed() {
  return (
    input.consume("z") ||
    input.consume("x") ||
    input.consume("Enter") ||
    input.consume(" ")
  );
}

function updatePrologue() {
  if (!prologue.active) return false;
  if (prologue.fadingOut) {
    if (nowMs() - prologue.fadeOutStartedAt >= prologue.fadeOutMs) {
      finishPrologue();
      return false;
    }
    return true;
  }
  updatePrologueTypingSe();
  if (prologueAdvancePressed()) {
    if (!isProloguePageComplete()) {
      input.clear();
      return true;
    }
    if (prologue.page < PROLOGUE_PAGES.length - 1) {
      prologue.page++;
      prologue.startedAt = nowMs();
      prologue.revealed = false;
      prologue.typeSeCharCount = 0;
      input.clear();
    } else {
      prologue.fadingOut = true;
      prologue.fadeOutStartedAt = nowMs();
      input.clear();
    }
  }
  return true;
}

function updatePrologueTypingSe() {
  if (prologue.revealed) return;
  const text = PROLOGUE_PAGES[prologue.page] || "";
  const count = Math.min([...text].length, prologueVisibleCharCount());
  if (count <= prologue.typeSeCharCount) return;
  const ch = [...text][count - 1] || "";
  prologue.typeSeCharCount = count;
  if (ch.trim()) playTypingVoice("default");
}

function drawPrologue(ctx) {
  if (!prologue.active) return false;
  const w = canvas.width;
  const h = canvas.height;
  const text = PROLOGUE_PAGES[prologue.page] || "";
  const visibleCount = prologue.revealed ? [...text].length : prologueVisibleCharCount();
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  if (prologue.fadingOut) {
    const elapsed = nowMs() - prologue.fadeOutStartedAt;
    ctx.globalAlpha = Math.max(0, 1 - elapsed / prologue.fadeOutMs);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#f7f2e8";
  ctx.font = "normal 12px PixelMplus12";

  const lines = wrapTextLayout(ctx, text, w - 14);
  const lineH = 16;
  const startY = Math.max(8, ((h - lines.length * lineH) / 2) | 0);
  let remaining = visibleCount;
  for (let i = 0; i < lines.length; i++) {
    const chars = [...lines[i].text];
    const lineText = chars.slice(0, Math.max(0, remaining)).join("");
    ctx.fillText(lineText, w / 2, startY + i * lineH);
    remaining -= chars.length;
    if (lines[i].consumeBreak) remaining -= 1;
  }

  ctx.restore();
  return true;
}

function prologueVisibleCharCount() {
  const elapsed = Math.max(0, nowMs() - prologue.startedAt);
  return prologueCharCountAt(elapsed);
}

function isProloguePageComplete() {
  const text = PROLOGUE_PAGES[prologue.page] || "";
  return prologue.revealed || prologueVisibleCharCount() >= [...text].length;
}

function wrapTextLines(ctx, text, maxW) {
  return wrapTextLayout(ctx, text, maxW).map(line => line.text);
}

function wrapTextLayout(ctx, text, maxW) {
  const lines = [];
  const rawLines = String(text).split("\n");
  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const consumeBreak = i < rawLines.length - 1;
    if (rawLine === "") {
      lines.push({ text: "", consumeBreak });
      continue;
    }
    const wrapped = wrapSingleTextLine(ctx, rawLine, maxW);
    for (let j = 0; j < wrapped.length; j++) {
      lines.push({ text: wrapped[j], consumeBreak: consumeBreak && j === wrapped.length - 1 });
    }
  }
  return lines.length ? lines : [{ text: "", consumeBreak: false }];
}

function wrapSingleTextLine(ctx, text, maxW) {
  const chars = [...text];
  const lines = [];
  let line = "";
  for (const ch of chars) {
    const next = line + ch;
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function prologueCharCountAt(elapsedMs) {
  const text = PROLOGUE_PAGES[prologue.page] || "";
  const chars = [...text];
  const startWaitMs = 1400;
  const lineWaitMs = 520;
  const charMs = 50;
  let time = startWaitMs;
  let count = 0;
  for (const ch of chars) {
    if (elapsedMs < time) return count;
    count++;
    time += ch === "\n" ? lineWaitMs : charMs;
  }
  return count;
}

const questQueue = [];

function drainQuestQueue() {
  if (!questAlert.isActive() && questQueue.length > 0) {
    const { id, title } = questQueue.shift();
    questAlert.show(id, title);
    playQuestJingleB();
  }
}

function checkQuest01() {
  const DUCK_REQUIRED = ["A","B","C","D","E","F","G","H","I","J"];
  const inv = inventory.getSnapshot();
  const hasAll = DUCK_REQUIRED.every(l =>
    inv.includes(`rubber_duck_${l}`) || (l === "G" && inv.includes("rubber_duck_G_bad"))
  );
  if (hasAll) achieveQuest("01");
}

let _phoneCallIconActive = false;
let _phoneCallIconMs = 0;

function achieveQuest(id) {
  if (STATE.achievedQuests.has(id)) return;
  STATE.achievedQuests.add(id);
  const q = QUESTS.find(q => q.id === id);
  questQueue.push({ id, title: q?.title ?? "" });
  drainQuestQueue();
  if (STATE.achievedQuests.size >= 20) {
    const a = actors.find(a => a.id === "keeper");
    if (a) { a.x = 1613; a.y = 2709; }
  }
  if (STATE.achievedQuests.size >= 30 && !STATE.flags.phoneCalled) {
    STATE.flags.phoneCalled = true;
    setTimeout(() => startPhoneCallEvent(), 3000);
  }
}

function debugCompleteAllQuests() {
  for (const q of QUESTS) STATE.achievedQuests.add(q.id);
  questQueue.length = 0;
  const keeper = actors.find(a => a.id === "keeper");
  if (keeper) { keeper.x = 1613; keeper.y = 2709; }
  saveNotice = { text: "QUEST ALL", until: nowMs() + 1200 };
  if (!STATE.flags.phoneCalled) {
    STATE.flags.phoneCalled = true;
    setTimeout(() => startPhoneCallEvent(), 3000);
  }
}

function debugJumpToShootingLobby() {
  STATE.flags.shootingLobbyLuchaTalked = true;
  shootingKnockback = null;
  loadMap("shooting_lobby");
  saveNotice = { text: "SHOOTING", until: nowMs() + 1200 };
}

const SHOOTING_DIFFICULTY_ORDER = ["hard", "normal", "easy"];

function getShootingDifficultyId() {
  const id = STATE.flags.shootingDifficulty;
  return SHOOTING_DIFFICULTIES[id] ? id : "normal";
}

function openShootingDifficultyUi() {
  const currentId = getShootingDifficultyId();
  const idx = SHOOTING_DIFFICULTY_ORDER.indexOf(currentId);
  shootingDifficultyUi.active = true;
  shootingDifficultyUi.index = idx >= 0 ? idx : 1;
  shootingDifficultyUi.openedAt = nowMs();
  input.clear();
}

function closeShootingDifficultyUi() {
  shootingDifficultyUi.active = false;
  input.clear();
}

function updateShootingDifficultyUi() {
  if (!shootingDifficultyUi.active) return false;
  if (input.consume("ArrowLeft")) {
    shootingDifficultyUi.index = (shootingDifficultyUi.index + SHOOTING_DIFFICULTY_ORDER.length - 1) % SHOOTING_DIFFICULTY_ORDER.length;
    playCursor();
  }
  if (input.consume("ArrowRight")) {
    shootingDifficultyUi.index = (shootingDifficultyUi.index + 1) % SHOOTING_DIFFICULTY_ORDER.length;
    playCursor();
  }
  if (input.consume("ArrowUp")) {
    shootingDifficultyUi.index = (shootingDifficultyUi.index + SHOOTING_DIFFICULTY_ORDER.length - 1) % SHOOTING_DIFFICULTY_ORDER.length;
    playCursor();
  }
  if (input.consume("ArrowDown")) {
    shootingDifficultyUi.index = (shootingDifficultyUi.index + 1) % SHOOTING_DIFFICULTY_ORDER.length;
    playCursor();
  }
  if (input.consume("x")) {
    playCursor();
    closeShootingDifficultyUi();
    return true;
  }
  if (input.consume("z") || input.consume("Enter") || input.consume(" ")) {
    const id = SHOOTING_DIFFICULTY_ORDER[shootingDifficultyUi.index];
    STATE.flags.shootingDifficulty = id;
    saveNotice = { text: SHOOTING_DIFFICULTIES[id].label, until: nowMs() + 900 };
    playConfirm();
    closeShootingDifficultyUi();
    return true;
  }
  return true;
}

function drawShootingDifficultyUi(tt) {
  if (!shootingDifficultyUi.active) return;
  const cards = SHOOTING_DIFFICULTY_ORDER.map((id) => SHOOTING_DIFFICULTIES[id]);
  const cx = BASE_W >> 1;
  const cardW = 48;
  const cardH = 88;
  const topY = 48;
  const xs = [18, 72, 126];
  const pulse = 0.5 + 0.5 * Math.sin(tt / 180);
  const current = cards[shootingDifficultyUi.index];
  const prevSkip = ctx._skipTextShadow;
  ctx._skipTextShadow = true;
  const drawCenterText = (text, centerX, y) => {
    const tw = ctx.measureText(text).width;
    ctx.fillText(text, ((centerX - tw / 2) | 0), y | 0);
  };
  const drawBanner = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 4, y + h - 6);
    ctx.lineTo(x + (w >> 1), y + h);
    ctx.lineTo(x + 4, y + h - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + 4, y + 3, w - 8, 2);
  };
  const drawStepBorder = (x, y, w, h, colorA, colorB) => {
    for (let i = 0; i < w; i += 8) {
      ctx.fillStyle = ((i >> 3) & 1) ? colorA : colorB;
      ctx.fillRect(x + i, y, 4, 2);
      ctx.fillRect(x + i + 4, y + h - 2, 4, 2);
    }
    for (let i = 0; i < h; i += 8) {
      ctx.fillStyle = ((i >> 3) & 1) ? colorB : colorA;
      ctx.fillRect(x, y + i, 2, 4);
      ctx.fillRect(x + w - 2, y + i + 4, 2, 4);
    }
  };

  ctx.save();
  ctx.fillStyle = "rgba(4,0,10,0.76)";
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  for (let y = 0; y < BASE_H; y += 12) {
    ctx.fillStyle = (y / 12) & 1 ? "rgba(255,120,70,0.05)" : "rgba(40,180,120,0.05)";
    ctx.fillRect(0, y, BASE_W, 6);
  }
  drawStepBorder(6, 6, BASE_W - 12, BASE_H - 12, "#f3bb54", "#db5f4a");

  const bannerY = 8;
  const bannerColors = ["#e35d4f", "#f3bb54", "#43b98e", "#e05ca8", "#4f9de3", "#f08e33"];
  for (let i = 0; i < 6; i++) {
    drawBanner(12 + i * 28, bannerY + ((i & 1) ? 2 : 0), 20, 14, bannerColors[i % bannerColors.length]);
  }
  ctx.strokeStyle = "#f7e7b5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(8, 10);
  ctx.lineTo(BASE_W - 8, 10);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,${180 + (pulse * 40) | 0},90,0.8)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, 98, 60 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(245,177,60,0.10)";
  ctx.beginPath();
  ctx.arc(cx, 98, 50, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x1 = (cx + Math.cos(a) * 36) | 0;
    const y1 = (98 + Math.sin(a) * 36) | 0;
    const x2 = (cx + Math.cos(a) * 56) | 0;
    const y2 = (98 + Math.sin(a) * 56) | 0;
    ctx.strokeStyle = i & 1 ? "rgba(255,228,140,0.35)" : "rgba(255,120,90,0.30)";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.font = "normal 10px PixelMplus10";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff2cc";
  drawCenterText("JIGOKU LEVEL", cx, 14);
  ctx.fillStyle = "#ffd36a";
  drawCenterText("PUNISHMENT SCALE", cx, 26);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const selected = i === shootingDifficultyUi.index;
    const x = xs[i];
    const y = topY - (selected ? 8 : 0);
    const glow = selected ? 0.75 + pulse * 0.25 : 0.24;
    const frame = selected ? card.color : "#8a6d48";

    ctx.strokeStyle = "#d0b080";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + cardW / 2, 14);
    ctx.lineTo(x + cardW / 2, y + 6);
    ctx.stroke();
    ctx.fillStyle = "#f9f2cf";
    ctx.fillRect(x + cardW / 2 - 2, 12, 4, 4);

    ctx.fillStyle = `rgba(0,0,0,${selected ? 0.5 : 0.34})`;
    ctx.fillRect(x + 2, y + 4, cardW, cardH);
    ctx.fillStyle = selected ? "#2a1511" : "#1a1016";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(x + 2, y + 2, cardW - 4, 8);
    for (let sy = y + 24; sy < y + cardH - 8; sy += 8) {
      ctx.fillStyle = ((sy >> 3) & 1) ? "rgba(243,187,84,0.09)" : "rgba(67,185,142,0.08)";
      ctx.fillRect(x + 4, sy, cardW - 8, 3);
    }
    ctx.strokeStyle = frame;
    ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, cardH - 1);
    if (selected) {
      ctx.strokeStyle = `rgba(255,255,255,${glow})`;
      ctx.strokeRect(x - 2.5, y - 2.5, cardW + 3, cardH + 3);
      ctx.fillStyle = `rgba(255,255,255,${0.16 + pulse * 0.06})`;
      ctx.fillRect(x + 3, y + 40, cardW - 6, 12);
      ctx.fillRect(x + 3, y + 58, cardW - 6, 12);
    }
    ctx.fillStyle = frame;
    ctx.fillRect(x + 8, y + 8, cardW - 16, 2);
    ctx.fillRect(x + 8, y + cardH - 10, cardW - 16, 2);

    ctx.font = "normal 10px PixelMplus10";
    ctx.fillStyle = card.color;
    drawCenterText(card.label, x + (cardW >> 1), y + 12);

    ctx.font = "normal 10px PixelMplus10";
    ctx.fillStyle = "#fff";
    drawCenterText(`SCORE`, x + (cardW >> 1), y + 30);
    ctx.fillStyle = "#fff";
    const mulText = `x${card.scoreMul.toFixed(1)}`;
    const mulW = ctx.measureText(mulText).width;
    ctx.fillText(mulText, (((x + (cardW >> 1)) - mulW / 2) | 0), (y + 42) | 0);
    ctx.fillStyle = "#ffdf72";
    const lifeText = `LIFE ${card.lives}`;
    const lifeW = ctx.measureText(lifeText).width;
    ctx.fillText(lifeText, (((x + (cardW >> 1)) - lifeW / 2) | 0), (y + 60) | 0);
  }

  ctx.font = "normal 10px PixelMplus10";
  ctx.fillStyle = current.color;
  drawCenterText(controlPrompt("z", { mobile: MOBILE }) + " SELECT  " + controlPrompt("x", { mobile: MOBILE }) + " CLOSE", cx, 160);
  ctx.restore();
  ctx._skipTextShadow = prevSkip;
}

function phoneCallSequence(pages, onDone, opts = {}) {
  interactionSession.begin();
  input.lock();
  startPhoneRing();
  dialog.open([
    ["プルルルルルルル"],
  ], () => {
    stopPhoneRing();
    playPhonePick();
    dialog.open([
      ["ピ"],
    ], () => {
      _phoneCallIconActive = true;
      _phoneCallIconMs = nowMs();
      input.unlock();
      dialog.setVoice("m_mid");
      const allPages = [["ミナミだ。"], ...pages];
      const waits = opts.pageWaits || {};
      dialog.open(allPages, () => {
          dialog.setVoice("default");
          _phoneCallIconActive = false;
          input.lock();
          playPhoneHang();
          dialog.open([
            ["ガチャン"],
          ], () => {
            input.unlock();
            if (onDone) onDone();
          }, "sign", 1200);
        }, "talk", 0, opts);
      dialog.onPageChange((idx) => {
        const ms = waits[idx];
        if (ms > 0) {
          input.lock();
          setTimeout(() => input.unlock(), ms);
        }
      });
    }, "sign", 800);
  }, "talk", 2800);
}

function startPhoneCallEvent() {
  phoneCallSequence([
    ["おまえたち、今すぐヴィニールジャンキーに来てくれ！"],
    ["制作費？今はそんな話をしている場合ではない！"],
    ["超銀河魔王が復活してしまったのだ！"],
    ["このままでは、地球は滅んでしまう！"],
    ["今すぐ超銀河魔王の攻撃をそししなければ！"],
    ["とにかく！"],
    ["すぐにヴィニールジャンキーにくるんだ！"],
  ], () => {
    STATE.flags.galaxyMaou = true;
    actors = actors.filter(a => a.name !== "grasan");
  }, { highlights: [{ text: "超銀河魔王", color: "#f44" }], pageWaits: { 2: 1000 } });
}

function startPhoneCallEvent2() {
  phoneCallSequence([
    ["伝え忘れていたが、"],
    ["事務所じゃなくて隣の工場の方に来てくれ！"],
  ], () => {
    STATE.flags.galaxyMaou2 = true;
  });
}

function clearFlags() {
  for (const k of Object.keys(STATE.flags)) delete STATE.flags[k];
}

function resetProgress() {
  collectedItems.clear();
  clearFlags();
  STATE.money    = 0;
  STATE.headwear = null;
  STATE.achievedQuests.clear();
  forceGroundHeightState();
}

function isSceneActive() {
  if (interactionSession.isActive()) return true;
  if (fade.isActive()) return true;
  if (dialog.isActive()) return true;
  if (choice.isActive()) return true;
  if (letterbox.isActive()) return true;
  if (battle.isActive()) return true;
  if (shooting.isActive()) return true;
  if (diving.isActive()) return true;
  if (phoneBrawl.isActive()) return true;
  if (sbBossType) return true;
  if (jumprope.isActive()) return true;
  if (shop.isActive()) return true;
  if (ending.isActive()) return true;
  if (battleTransition) return true;
  if (holeTransition) return true;
  if (STATE.flags.carefulActive) return true;
  if (STATE.flags.uraYahhyCooking) return true;
  return false;
}

function saveGame() {
  if (isSceneActive()) {
    saveNotice = { text: "CANT SAVE", until: nowMs() + 1200 };
    return;
  }
  const data = {
    mapId:          current.id,
    leaderX:        leader.x,
    leaderY:        leader.y,
    leaderIdx:      STATE.leaderIdx | 0,
    charHeight:     { ...charHeight },
    collectedItems: [...collectedItems],
    inventoryItems: inventory.getSnapshot(),
    flags:          { ...STATE.flags },
    money:          STATE.money,
    headwear:       STATE.headwear,
    achievedQuests: [...STATE.achievedQuests],
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  saveNotice = { text: "SAVED", until: nowMs() + 1200 };
}

function beginContinueReveal() {
  input.lock();
  const w = canvas.width || BASE_W;
  const h = canvas.height || BASE_H;
  continueRevealFx = {
    phase: "loading",
    startMs: 0,
    duration: 720,
    cx: w / 2,
    cy: h / 2,
    maxR: Math.sqrt(w * w + h * h) + 4,
  };
}

function startContinueReveal() {
  if (!continueRevealFx) return;
  continueRevealFx.phase = "reveal";
  continueRevealFx.startMs = nowMs();
  input.lock();
}

function updateContinueReveal(t) {
  if (!continueRevealFx) return false;
  if (continueRevealFx.phase === "loading") {
    if (mapReady) startContinueReveal();
    return true;
  }
  if (continueRevealFx.phase === "reveal") {
    if (t - continueRevealFx.startMs >= continueRevealFx.duration) {
      continueRevealFx = null;
      input.unlock();
      return false;
    }
    return true;
  }
  return false;
}

function drawContinueRevealOverlay(ctx, t) {
  if (!continueRevealFx) return false;
  const w = canvas.width || BASE_W;
  const h = canvas.height || BASE_H;
  if (continueRevealFx.phase === "loading") {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    return true;
  }

  const p = Math.max(0, Math.min(1, (t - continueRevealFx.startMs) / continueRevealFx.duration));
  const e = p * p * (3 - 2 * p);
  const r = continueRevealFx.maxR * e;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.arc(continueRevealFx.cx, continueRevealFx.cy, r, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  ctx.restore();
  return false;
}

function loadGame(opt = {}) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { saveNotice = { text: "NO DATA", until: nowMs() + 1200 }; return; }
  try {
    if (opt.fromTitle) beginContinueReveal();
    const data = JSON.parse(raw);
    collectedItems.clear();
    for (const id of (data.collectedItems || [])) collectedItems.add(id);
    clearFlags();
    Object.assign(STATE.flags, data.flags || {});
    STATE.money    = data.money    | 0;
    STATE.headwear = data.headwear ?? null;
    STATE.achievedQuests.clear();
    for (const q of (data.achievedQuests || [])) STATE.achievedQuests.add(q);
    Object.assign(charHeight, data.charHeight || {
      leader: "ground",
      p2: "ground",
      p3: "ground",
      p4: "ground",
    });
    heightLevel = charHeight.leader;
    inventory.resetItems(data.inventoryItems || []);
    setupParty(data.leaderIdx | 0);
    applySkinLevel(STATE.flags.skinLevel | 0);
    const targetMapId = data.mapId || "outdoor";
    bgmCtl.setMap(MAPS[targetMapId]?.bgmSrc || "assets/audio/bgm0.mp3");
    loadMap(targetMapId, {
      spawnAt: { x: data.leaderX, y: data.leaderY },
      onReady: opt.fromTitle ? startContinueReveal : null,
    });
    if (!opt.fromTitle) saveNotice = { text: "LOADED", until: nowMs() + 1200 };
  } catch (e) {
    continueRevealFx = null;
    input.unlock();
    saveNotice = { text: "LOAD ERROR", until: nowMs() + 1200 };
  }
}

const battle = createBattleSystem({
  BASE_W: BATTLE_W,
  BASE_H: BATTLE_H,
  itemName,
  itemBgmSrc,
  itemThrowDmg,
  unlockBgm: () => bgmCtl.unlock(),
  setOverrideBgm: (src) => { stopHeartbeat(); bgmCtl.setOverride(src); },
  getFieldInventorySnapshot: () => inventory.getSnapshot(),
  onRunExit: (done) => {
    input.lock();
    fade.startIrisFade(nowMs(), {
      outMs:  800,
      holdMs: 200,
      inMs:   500,
      pauseMs: 0,
      onBlack: () => {
        done();
        stopHeartbeat();
        popBgmOverride({ safe: false });
        setGameResolution(BASE_W, BASE_H);
        pendingBattlePages = null;
        interactionSession.begin();
        letterbox.snapAuto(true);
      },
      onEnd: () => {
        input.unlock();
        dialog.open([["弱虫どもめ。"], ["でなおしてこい。"]], null, "talk");
      },
    });
  },
  onLoseExit: (done) => {
    // バトルが描画中のうちにフェードアウト → 真っ黒になってから done() でバトル終了
    const BEAT_MS = 4200;
    const WORDS   = ["DOKA", "BAKI", "BOKO"];
    input.lock();
    fade.startCutFade(nowMs(), {
      outMs:  350,
      holdMs: BEAT_MS,
      inMs:   600,
      onBlack: () => {
        done(); // st=null: バトル描画終了
        stopHeartbeat();
        popBgmOverride({ safe: false });
        setGameResolution(BASE_W, BASE_H);
        pendingBattlePages = null;
        charHeight.leader = charHeight.p2 = charHeight.p3 = charHeight.p4 = "ground";
        heightLevel = "ground";
        loadMap("moritasaki_room", { spawnAt: { x: 128, y: 160 } });
        [0, 1, 2].forEach((type, i) => {
          setTimeout(() => {
            playPunch(type);
            beatPops.push({
              text:    WORDS[type],
              color:   "#f00",
              x:       Math.round(28 + Math.random() * (BASE_W - 56)),
              y:       Math.round(20 + Math.random() * (BASE_H - 40)),
              startMs: performance.now(),
              duration: 600,
            });
          }, 1400 + i * 500);
        });
      },
      onEnd: () => {
        achieveQuest("02");
        setTimeout(() => {
          input.unlock();
          dialog.open([["ひどいめにあった。"]], null, "sign");
        }, 2000);
      },
    });
  },
  onExitToField: (result) => {
    input.clear();
    stopHeartbeat();
    popBgmOverride({ safe: false });
    setGameResolution(BASE_W, BASE_H);
    const pages      = result === "win" ? pendingBattlePages?.win  : pendingBattlePages?.lose;
    const isEnding   = result === "win" && !!pendingBattlePages?.winEnding;
    pendingBattlePages = null;

    const triggerEnding = () => {
      interactionSession.end();
      letterbox.reset();
      bgmCtl.setOverride("about:blank");
      fade.startIrisFade(nowMs(), {
        outMs:   800,
        holdMs:  500,
        inMs:    300,
        cx: (leader.x - cam.x + SPR / 2) | 0,
        cy: (leader.y - cam.y + SPR / 2) | 0,
        onBlack: () => { setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H); partyVisible = false; loadMap("vj_room02", { isEnding: true }); },
        onEnd:   () => { pendingEndingFadeIn = true; },
      });
    };

    if (pages && pages.length) {
      input.lock();
      setTimeout(() => {
        input.unlock();
        interactionSession.begin();
        dialog.open(pages, isEnding ? triggerEnding : null, "talk");
      }, 1000);
    } else if (isEnding) {
      input.lock();
      setTimeout(() => { input.unlock(); triggerEnding(); }, 1000);
    }
  },
});

// ---- Collision ----
function footBox(x, y) {
  return { x: x + 2, y: y + 10, w: 12, h: 6 };
}
function hitRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function hitBg(nx, ny) {
  if (current.id === "shooting_lobby" || current.id === "dark_throne" || current.id === "space" || current.id === "space_boss") return false;
  const f = footBox(nx, ny);
  for (let y = f.y; y < f.y + f.h; y++) {
    for (let x = f.x; x < f.x + f.w; x++) {
      if (col.isWallAt(x, y, heightLevel)) return true;
    }
  }
  const def = MAPS[current.id];
  for (const door of def.doors || []) {
    const tr = door.trigger;
    if (!tr || !isDoorBlockedForLeader(door)) continue;
    if (f.x < tr.x + tr.w && f.x + f.w > tr.x &&
        f.y < tr.y + tr.h && f.y + f.h > tr.y) return true;
  }
  // ヘルメット未装備時、helmetRequired な穴 trigger は壁扱い
  if (STATE.headwear !== "helmet") {
    for (const hole of def.holes || []) {
      if (!hole.helmetRequired || !hole.trigger) continue;
      const tr = hole.trigger;
      if (f.x < tr.x + tr.w && f.x + f.w > tr.x &&
          f.y < tr.y + tr.h - 2 && f.y + f.h > tr.y + 2) return true;
    }
  }
  return false;
}
function npcFootBox(act) {
  const spr = act.spr ?? SPR;
  const sprH = act.sprH ?? spr;
  if (act.hitW != null) {
    const rawW = Math.max(1, act.hitW | 0);
    const rawH = Math.max(1, (act.hitH ?? 8) | 0);
    const w = Math.max(1, rawW - 2);
    const ox = (((spr - rawW) / 2 + 1) | 0) + (act.hitOx | 0);
    const oy = Math.max(0, sprH - rawH) + (act.hitOy | 0);
    return { x: act.x + ox, y: act.y + oy, w, h: rawH };
  }
  const mx = (spr * 0.2) | 0;
  if (sprH !== spr) {
    return { x: act.x + mx, y: act.y, w: spr - mx * 2, h: sprH };
  }
  return { x: act.x + mx, y: act.y + spr - 8, w: spr - mx * 2, h: 8 };
}

function hitNpc(nx, ny) {
  if (!actors.length) return false;
  const a = footBox(nx, ny);
  for (const act of actors) {
    if (act.hidden) continue;
    if (!act.solid) continue;
    if (act.showWhenBgm && bgmCtl.getOverrideSrc() !== act.showWhenBgm) continue;
    if (hitRect(a, npcFootBox(act))) return true;
  }
  return false;
}

// ---- Camera ----
function updateCam() {
  const cw = canvas.width;
  const ch = canvas.height;
  const maxX = Math.max(0, (current.bgW | 0) - cw);
  const maxY = Math.max(0, (current.bgH | 0) - ch);
  const cx = leader.x + 8 - cw / 2;
  const cy = leader.y + 8 - ch / 2;
  cam.x = Math.max(0, Math.min(maxX, cx)) | 0;
  cam.y = Math.max(0, Math.min(maxY, cy)) | 0;
  const now = performance.now();
  if (_shakeUntil > now) {
    const p = (_shakeUntil - now) / 500;
    cam.x += (Math.sin(now * 0.05) * _shakeIntensity * p) | 0;
    cam.y += (Math.cos(now * 0.07) * _shakeIntensity * p) | 0;
  }
  if (_spaceBossRantShake) {
    cam.x += (Math.sin(now * 0.083) * 2.4 + Math.sin(now * 0.031) * 1.2) | 0;
    cam.y += (Math.cos(now * 0.071) * 2.2) | 0;
  }
}

// ---- Entry auto-walk ----
let autoWalk = null; // { dx, dy, frames }

// ---- Hole warp ----
let holeTransition = null;
let holeCooldown   = 0;
let playerHoleScale = 1;
let playerHoleDrawX = null; // null = use leader.x
let playerHoleDrawY = null;
const HOLE_FALL_MS   = 500;
const HOLE_ROLL_MS   = 4500;
const HOLE_EMERGE_MS = 500;

function holeCheck(t) {
  if (!mapReady || holeTransition || t < holeCooldown) return;
  if (fade.isActive() || dialog.isActive() || choice.isActive() || menu.isOpen()) return;
  const def = MAPS[current.id];
  const f   = footBox(leader.x, leader.y);
  const fx  = (f.x + (f.w >> 1)) | 0;
  const fy  = (f.y + (f.h >> 1)) | 0;
  for (const hole of def.holes || []) {
    if (!hole.trigger) continue;
    if (hole.to == null && !hole.destMap) continue;
    if (hole.helmetRequired && STATE.headwear !== "helmet") continue;
    const tr = hole.trigger;
    if (fx >= tr.x && fx < tr.x + tr.w && fy >= tr.y && fy < tr.y + tr.h) {
      const dest = hole.to != null ? (def.holes || []).find(h => h.id === hole.to) : null;
      if (hole.to != null && !dest?.exitAt) return;
      const wps = dest ? [...(hole.waypoints || []), { x: dest.exitAt.x, y: dest.exitAt.y }] : [];
      holeTransition = {
        phase: 'falling', phaseStart: t, dest, destMap: hole.destMap ?? null,
        waypoints: wps, startCamX: cam.x, startCamY: cam.y,
        fallStartX: leader.x, fallStartY: leader.y,
        holeCx: tr.x + tr.w / 2, holeCy: tr.y + tr.h / 2,
      };
      playHoleFall();
      STATE.flags.holeFallCount = (STATE.flags.holeFallCount | 0) + 1;
      if (STATE.flags.holeFallCount >= 10) achieveQuest("27");
      input.clear();
      return;
    }
  }
}

// ---- Door warp ----
let doorCooldown = 0;
let ignoredDoorId = null;
const FURO_HOT_MS = 60 * 1000;

function leaderDoorKey() {
  return `p${(STATE.leaderIdx | 0) + 1}`;
}

function isDoorBlockedForLeader(door) {
  const blocked = door?.blockedByLeader;
  if (!blocked) return false;
  const key = leaderDoorKey();
  return Array.isArray(blocked) ? blocked.includes(key) : !!blocked[key];
}

function resolveDoorTo(door) {
  if (!door?.toByLeader) return door?.to;
  return door.toByLeader[leaderDoorKey()] || door.to;
}

function startFuroSoak(t) {
  input.lock();
  fade.startCutFade(t, {
    outMs: 420,
    holdMs: 1800,
    inMs: 520,
    onBlack: () => {
      playFuro();
      STATE.flags.furoHotUntil = nowMs() + FURO_HOT_MS;
    },
    onEnd: () => {
      input.unlock();
    },
  });
}

function doorCheck(t) {
  if (!mapReady || t < doorCooldown) return;
  if (menu.isOpen()) return;
  if (battle.isActive()) return;
  if (dialog.isActive()) return;
  if (choice.isActive()) return;
  if (fade.isActive()) return;

  const f = footBox(leader.x, leader.y);
  const fx = (f.x + (f.w >> 1)) | 0;
  const fy = (f.y + (f.h >> 1)) | 0;

  const def = MAPS[current.id];
  if (ignoredDoorId != null) {
    const ignoredDoor = (def.doors || []).find(d => d.id === ignoredDoorId);
    const tr = ignoredDoor?.trigger;
    if (!tr || !(fx >= tr.x && fx < tr.x + tr.w && fy >= tr.y && fy < tr.y + tr.h)) {
      ignoredDoorId = null;
    }
  }
  for (const door of def.doors || []) {
    if (!door.trigger) continue;
    if (door.id === ignoredDoorId) continue;
    const tr = door.trigger;
    if (fx >= tr.x && fx < tr.x + tr.w && fy >= tr.y && fy < tr.y + tr.h) {
      if (isDoorBlockedForLeader(door)) continue;
      if (door.action === "furo_soak") {
        doorCooldown = t + DOOR_COOLDOWN_MS;
        ignoredDoorId = door.id;
        startFuroSoak(t);
        return;
      }
      const to = resolveDoorTo(door);
      if (!to) continue;
      doorCooldown = t + DOOR_COOLDOWN_MS;
      if (door.sound === 'zazza') playZazza();
      else playDoor();
      const doorId = door.doorIdByTo?.[to] ?? door.id;
      const mapOpt = door.spawnAt
        ? { spawnAt: door.spawnAt }
        : { doorId };
      if (door.preFadeInWalk) mapOpt.preFadeInWalk = door.preFadeInWalk;
      if (door.fadeOutMs != null) mapOpt.fadeOutMs = door.fadeOutMs;
      if (door.fadeInMs != null) mapOpt.fadeInMs = door.fadeInMs;
      fade.startMapFade(to, mapOpt, t, loadMap);
      return;
    }
  }
}

// ---- Shrine trigger check ----
const charHeight = { leader: "ground", p2: "ground", p3: "ground", p4: "ground" };
const stairZonePrev = { leader: false, p2: false, p3: false, p4: false };
const stairPosPrev = {
  leader: { x: 0, y: 0 },
  p2:     { x: 0, y: 0 },
  p3:     { x: 0, y: 0 },
  p4:     { x: 0, y: 0 },
};

function resetHeightState() {
  charHeight.leader = "ground";
  charHeight.p2 = "ground";
  charHeight.p3 = "ground";
  charHeight.p4 = "ground";
  heightLevel = "ground";
  resetStairTracking();
  syncStairZonePrev();
}

function forceGroundHeightState() {
  charHeight.leader = "ground";
  charHeight.p2 = "ground";
  charHeight.p3 = "ground";
  charHeight.p4 = "ground";
  heightLevel = "ground";
  resetStairTracking();
}

function resetStairTracking() {
  stairZonePrev.leader = false;
  stairZonePrev.p2 = false;
  stairZonePrev.p3 = false;
  stairZonePrev.p4 = false;
  rememberStairPos("leader", leader.x, leader.y);
  rememberStairPos("p2", p2.x, p2.y);
  rememberStairPos("p3", p3.x, p3.y);
  rememberStairPos("p4", p4.x, p4.y);
}

function stairFootCenter(cx, cy) {
  const f  = footBox(cx, cy);
  return {
    x: (f.x + (f.w >> 1)) | 0,
    y: (f.y + (f.h >> 1)) | 0,
  };
}

function isStairAtChar(cx, cy) {
  const p = stairFootCenter(cx, cy);
  return col.getZone(p.x, p.y) === "stair";
}

function isStairCrossedByChar(name, cx, cy) {
  const from = stairPosPrev[name] || stairFootCenter(cx, cy);
  const to = stairFootCenter(cx, cy);
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1) | 0;
  for (let i = 0; i <= steps; i += 1) {
    const k = i / steps;
    const x = (from.x + (to.x - from.x) * k) | 0;
    const y = (from.y + (to.y - from.y) * k) | 0;
    if (col.getZone(x, y) === "stair") return true;
  }
  return false;
}

function rememberStairPos(name, cx, cy) {
  const p = stairFootCenter(cx, cy);
  stairPosPrev[name].x = p.x;
  stairPosPrev[name].y = p.y;
}

function syncStairZonePrev() {
  if (!mapReady || current.id !== "outdoor") {
    stairZonePrev.leader = false;
    stairZonePrev.p2 = false;
    stairZonePrev.p3 = false;
    stairZonePrev.p4 = false;
    return;
  }
  stairZonePrev.leader = isStairAtChar(leader.x, leader.y);
  stairZonePrev.p2 = isStairAtChar(p2.x, p2.y);
  stairZonePrev.p3 = isStairAtChar(p3.x, p3.y);
  stairZonePrev.p4 = isStairAtChar(p4.x, p4.y);
  rememberStairPos("leader", leader.x, leader.y);
  rememberStairPos("p2", p2.x, p2.y);
  rememberStairPos("p3", p3.x, p3.y);
  rememberStairPos("p4", p4.x, p4.y);
}

function checkStairForChar(name, cx, cy) {
  const on = isStairCrossedByChar(name, cx, cy);
  rememberStairPos(name, cx, cy);
  if (on === stairZonePrev[name]) return;
  stairZonePrev[name] = on;
  if (on) charHeight[name] = charHeight[name] === "ground" ? "upper" : "ground";
}

function stairTriggerCheck() {
  if (!mapReady) return;
  if (current.id !== "outdoor") {
    heightLevel = "ground";
    return;
  }
  checkStairForChar("leader", leader.x, leader.y);
  checkStairForChar("p2", p2.x, p2.y);
  checkStairForChar("p3", p3.x, p3.y);
  checkStairForChar("p4", p4.x, p4.y);
  // isWallAt 用に先頭キャラの高さを heightLevel に反映
  heightLevel = charHeight.leader;
}

function shrineTriggerCheck() {
  if (!mapReady) return;
  const f  = footBox(leader.x, leader.y);
  const fx = (f.x + (f.w >> 1)) | 0;
  const fy = (f.y + (f.h >> 1)) | 0;
  const inZone = col.getZone(fx, fy) === "shrine";

  if (inZone !== shrineTriggerActive) {
    shrineTriggerActive = inZone;
    if (inZone && STATE.headwear === "helmet") achieveQuest("07");
    playSuzu();
    bgmCtl.audio.muted = inZone; // iOS は volume 変更不可のため muted を使う
    if (IS_MOBILE_DEVICE) {
      // モバイル：白フラッシュ開始。ピーク時に shrineFade をスナップ
      shrineWhite = { phase: "fade-in", alpha: 0, targetMode: inZone };
    } else {
      shrineMode = inZone;
    }
  }
}

// ---- Load map ----
function startSeaholeCutscene() {
  input.lock();

  const now = performance.now();
  for (const m of [leader, p2, p3, p4]) {
    exclamations.push({ sx: ((m.x + 8) - cam.x) | 0, sy: (m.y - cam.y) | 0, startMs: now, duration: 1200 });
  }
  playConfirm();

  setTimeout(() => {
    seaholeCutscene.active = true;

    // Phase 1: ジリジリ後退り（1.5s）
    const retreatDur   = 1500;
    const retreatStart = performance.now();
    const retreatId    = setInterval(() => {
      const el = performance.now() - retreatStart;
      const t  = Math.min(el / retreatDur, 1);
      seaholeCutscene.charOffsetX = -14 * t + (t < 1 ? Math.sin(el / 55) * 2.5 : 0);
      if (t < 1) return;
      clearInterval(retreatId);
      seaholeCutscene.charOffsetX = -14;

      // Phase 2: 影が右から素早くスイープイン（0.38s）
      const sweepDur    = 380;
      const sweepStart  = performance.now();
      const sweepTarget = -30;
      seaholeCutscene.shadowX = BASE_W;
      const sweepId = setInterval(() => {
        const el2 = performance.now() - sweepStart;
        const st  = Math.min(el2 / sweepDur, 1);
        seaholeCutscene.shadowX = BASE_W + (sweepTarget - BASE_W) * (st * st);
        if (st < 1) return;
        clearInterval(sweepId);
        seaholeCutscene.shadowX = sweepTarget;

        // Phase 3: 影＋キャラが右に退場（0.5s）
        const exitDur   = 500;
        const exitStart = performance.now();
        const exitDest  = BASE_W + SHADOW_W + 10;
        const exitId    = setInterval(() => {
          const el3 = performance.now() - exitStart;
          const et  = Math.min(el3 / exitDur, 1);
          const eased = et * et;
          seaholeCutscene.shadowX     = sweepTarget + (exitDest - sweepTarget) * eased;
          seaholeCutscene.charOffsetX = -14        + (exitDest - sweepTarget) * eased;
          if (et < 1) return;
          clearInterval(exitId);
          fade.startCutFade(nowMs(), {
            outMs: 400, holdMs: 9999999, inMs: 0,
            onBlack: () => {
              seaholeCutscene = { active: false, shadowX: BASE_W, charOffsetX: 0 };
              partyVisible = true;
              loadMap("orca_ride", {
                spawnAt: { x: 3824, y: 402 },
                skipBgm: true,
                onReady: () => {
                  actors.push({
                    kind: "npc",
                    name: "orca3",
                    x: 3780,
                    y: 392,
                    img: SPRITES.orca,
                    spr: 64,
                    sprH: 32,
                    frame: 0,
                    last: 0,
                    talkHit: { x: 0, y: 0, w: 0, h: 0 },
                    solid: false,
                    animMs: NPC_FRAME_MS,
                  });
                  p2.x = p3.x = p4.x = -2000;
                  playWave();
                  setTimeout(() => {
                    orcaRide = { active: true, startMs: nowMs(), durationMs: 15000, ending: false };
                    achieveQuest("08");
                    fade.startCutFade(nowMs(), { outMs: 0, holdMs: 0, inMs: 700, onEnd: () => input.unlock() });
                  }, 2000);
                },
              });
            },
          });
        }, 16);
      }, 16);
    }, 16);
  }, 2000);
}

function loadMap(id, opt = null) {
  mapReady = false;
  const prevMapId = current.id;
  current.id = id;
  afloBlackout = { active: false, phase: "idle", phaseStart: 0 };
  timeMachineFx = { active: false, start: 0, until: 0, onDone: null };
  stopChaosMetalBgm();
  _spaceBossRantShake = false;
  sbBossType = null;
  sbCactusIntro = null;
  theaterScene = { active: id === "theater", startMs: 0, exitWaitStartMs: 0, phase: "intro", messageShown: false };
  kakoMovieScene = { active: false, startMs: 0, exitWaitStartMs: 0, phase: "intro", messageShown: false };
  timeMachineEnterMsA = 0;
  timeMachineEnterMsB = 0;
  ignoredDoorId = opt?.doorId ?? null;
  if (id !== "space") {
    spaceVel.x = 0;
    spaceVel.y = 0;
    spaceMoonAttach = false;
    spaceMoonAngle = 0;
    spaceMoonRadius = SPACE_MOON.surfaceR;
    spaceMoonCooldownUntil = 0;
    spaceO2 = getSpaceO2Capacity();
    spaceO2LastMs = 0;
    spaceO2Depleted = false;
  }
  mapChunkCache = new WeakMap();

  if (id === "outdoor") {
    delete STATE.flags.carefulActive;
    delete STATE.flags.ac1Gone;
  }
  if (!(prevMapId === "theater" && id === "outdoor" && opt?.doorId === 34)) {
    rainScene.active = false;
    rainScene.questDone = false;
    stopRainLoop();
  }

  menu.close();

  const def = MAPS[id];
  if (!def) throw new Error("Unknown map: " + id);

  let bgOK = false,
    colOK = false;

  function done() {
    if (!bgOK || !colOK) return;

    // クエスト11: チキンカレーのエフェクト中にプールに入る
    if (id === "pool" && goodTrip.isActive()) achieveQuest("11");

    current.bgW = (def.bgW || bgImg.naturalWidth) | 0;
    current.bgH = (def.bgH || bgImg.naturalHeight) | 0;
    if (id === "space" || id === "space_boss") {
      initSpaceStars();
      spaceMoonAttach = false;
      spaceMoonAngle = 0;
      spaceMoonRadius = SPACE_MOON.surfaceR;
      spaceMoonCooldownUntil = 0;
      if (id === "space") {
        spaceO2 = getSpaceO2Capacity();
        spaceO2LastMs = nowMs();
        spaceO2Depleted = false;
      }
    }

    let sx = current.bgW >> 1,
      sy = current.bgH >> 1;

    if (opt?.spawnAt) {
      sx = opt.spawnAt.x;
      sy = opt.spawnAt.y;
    } else if (opt && opt.doorId != null) {
      // find the door on the destination map that matches this id
      const door = (def.doors || []).find(d => d.id === opt.doorId);
      if (door?.entryAt) { sx = door.entryAt.x; sy = door.entryAt.y; }
      else if (def.spawn) { sx = def.spawn.x; sy = def.spawn.y; }
    } else if (def.spawn) {
      sx = def.spawn.x;
      sy = def.spawn.y;
    }

    leader.x = sx;
    leader.y = sy;
    leader.frame = 0;
    leader.last = 0;
    if (opt?.resetHeight) forceGroundHeightState();

    const entryDoor = (def.doors || []).find(d => d.id === opt?.doorId);
    autoWalk = entryDoor?.entryWalk ? { ...entryDoor.entryWalk } : null;

    if (def.fullWater) buildFullWaterMask(current.bgW, current.bgH);
    else if (def.waterColor) buildWaterMask(bgImg, def.waterColor);
    else waterMaskCanvas = null;

    const _ufoM = current.id.match(/^umi_house(\d)$/);
    if (_ufoM && !STATE.flags.ufoComplete) {
      const _ufoSeq = [2, 3, 1, 1, 3, 1, 2, 3];
      const _step = STATE.flags.ufoStep || 0;
      const _isCorrect = _step < _ufoSeq.length && _ufoSeq[_step] === +_ufoM[1];
      if (_isCorrect && _step === _ufoSeq.length - 1) {
        STATE.flags.ufoComplete = true;
      } else if (!_isCorrect) {
        STATE.flags.ufoStep = 0;
      }
    }

    spawnActorsForMap(current.id);
    applyFlagsToActors(current.id);

    if (opt?.isEnding || opt?.skipBgm) {
      // BGM は呼び出し元が管理
      if (current.id === "shooting_lobby" || current.id === "dark_throne") {
        bgmCtl.setOverride("about:blank");
        startShootingBgm();
      } else {
        stopShootingBgm();
      }
    } else if (current.id === "shooting_lobby" || current.id === "dark_throne") {
      bgmCtl.setOverride("about:blank");
      stopAfloClubBgm();
      startShootingBgm();
    } else if (current.id === "space" || current.id === "space_boss") {
      bgmCtl.setOverride("about:blank");
      stopShootingBgm();
      stopAfloClubBgm();
    } else if (current.id === "afloclub") {
      bgmCtl.setOverride("about:blank");
      stopShootingBgm();
      stopMetalBgm();
      startAfloClubBgm();
    } else if (current.id === "vj_factry") {
      bgmCtl.setOverride("about:blank");
      stopShootingBgm();
      stopAfloClubBgm();
      startMetalBgm();
    } else if (current.id === "theater") {
      bgmCtl.setOverride("assets/audio/bgm_movie.mp3");
      stopShootingBgm();
      stopAfloClubBgm();
    } else if (prevMapId === "theater") {
      bgmCtl.setOverride(null);
      stopShootingBgm();
      stopAfloClubBgm();
    } else {
      stopShootingBgm();
      stopAfloClubBgm();
      stopMetalBgm();
      const _curOv = bgmCtl.getOverrideSrc();
      const _isDuckBgm = _curOv && /\/duck.*\.mp3$/.test(_curOv);
      if (!_isDuckBgm) bgmCtl.setOverride(null);
    }

    seaholeCutscene = { active: false, shadowX: BASE_W, charOffsetX: 0 };

    bgmCtl.setUnderwater(!MOBILE && current.id === "seahole");
    bgmCtl.setReverb(!MOBILE && (current.id === "pool" || current.id === "charch") ? current.id : null);
    if (current.id === "seahole") initFish();

    chinanagoActivated = false;
    cactusActivated    = false;
    followers.reset({ leader, p2, p3, p4 });
    if (opt?.preFadeInWalk) {
      const walk = opt.preFadeInWalk;
      const frames = Math.max(0, walk.frames | 0);
      const dx = Number(walk.dx) || 0;
      const dy = Number(walk.dy) || 0;
      for (let i = 0; i < frames; i += 1) {
        leader.x += dx;
        leader.y += dy;
        followers.push(leader.x, leader.y);
        followers.update(nowMs(), { p2, p3, p4 });
      }
      leader.frame = 0;
      p2.frame = p3.frame = p4.frame = 0;
    }
    if (current.id === "space_boss") {
      bgmCtl.setOverride("assets/audio/duckE.mp3");
      partyVisible = false;
      const cx = leader.x;
      const cy = leader.y;
      const all = [1, 2, 3, 4];
      const leaderNo = all[STATE.leaderIdx];
      const order = [leaderNo, ...all.filter(n => n !== leaderNo)];
      for (let i = 0; i < 4; i++) {
        actors.push({
          kind: "npc", name: `sb_party_${i}`,
          img: getPartySprite(order[i]),
          x: cx - 30 + i * 20, y: cy,
          spr: SPR, sprH: SPR,
          frame: 0, last: 0,
          solid: false, noWalk: true,
          animMs: NPC_FRAME_MS,
          talkHit: { x: 0, y: 0, w: 0, h: 0 },
          glow: true,
        });
      }
      for (const act of actors) {
        if (act.name === "sb_ss1") act.glow = true;
      }
      input.lock();
      let sbIdx = opt?.spaceBossStartAt === "blackHole" || opt?.spaceBossStartAt === "gameOver" || opt?.spaceBossStartAt === "firstBattle"
        ? SPACE_BOSS_TALK.findIndex(step => step.action === "suck")
        : 0;
      if (sbIdx < 0) sbIdx = 0;
      sbBlackHole = null;
      sbSuck = null;
      sbBoss = null;
      sbWhiteFlash = null;
      sbBossType = null;
      sbLastBattleStarted = false;
      if (opt?.spaceBossStartAt === "blackHole" || opt?.spaceBossStartAt === "gameOver" || opt?.spaceBossStartAt === "firstBattle") {
        sbBlackHole = { y: -20, r: 50 };
        const party = actors.filter(a => a.name?.startsWith("sb_party_"));
        for (let i = 0; i < party.length; i++) {
          party[i].img = SPRITES[`p${i + 1}`];
        }
        const ss = actors.find(a => a.name === "sb_ss1");
        if (ss) ss.ironHeartMark = true;
      }
      if (opt?.spaceBossStartAt === "firstBattle") {
        sbBlackHole = null;
        sbSuck = null;
        sbBoss = {
          startMs: nowMs(),
          duration: 1,
          startY: 55,
          endY: 55,
          size: 90,
        };
        const ss = actors.find(a => a.name === "sb_ss1");
        if (ss) ss.hidden = true;
        const px = leader.x;
        const py = leader.y;
        const party = actors.filter(a => a.name?.startsWith("sb_party_"));
        for (let i = 0; i < party.length; i++) {
          party[i].x = px - 30 + i * 20;
          party[i].y = py + 60;
          party[i].glow = true;
        }
        setTimeout(() => {
          if (current.id === "space_boss" && !sbLastBattleStarted) {
            startSpaceBossBossSpeech(() => startSpaceBossFirstBattle());
          }
        }, 250);
        return;
      }
      if (opt?.spaceBossStartAt === "gameOver") {
        sbBlackHole = null;
        sbSuck = null;
        sbBoss = {
          startMs: nowMs(),
          duration: 1,
          startY: 55,
          endY: 55,
          size: 90,
        };
        const ss = actors.find(a => a.name === "sb_ss1");
        if (ss) ss.hidden = true;
        const px = leader.x;
        const py = leader.y;
        const party = actors.filter(a => a.name?.startsWith("sb_party_"));
        for (let i = 0; i < party.length; i++) {
          party[i].x = px - 30 + i * 20;
          party[i].y = py + 60;
          party[i].hidden = true;
          party[i].glow = true;
        }
        setTimeout(() => startSpaceBossFirstBattleGameOverDebug(), 250);
        return;
      }
      function sbNext() {
        if (sbIdx >= SPACE_BOSS_TALK.length) return;
        const step = SPACE_BOSS_TALK[sbIdx++];
        if (step.action === "regroup") {
          startChaosMetalBgm();
          sbSuck = null;
          sbBlackHole = null;
          const ss = actors.find(a => a.name === "sb_ss1");
          if (ss) ss.hidden = true;
          const px = leader.x;
          const py = leader.y;
          const party = actors.filter(a => a.name?.startsWith("sb_party_"));
          for (let i = 0; i < party.length; i++) {
            party[i].x = px - 30 + i * 20;
            party[i].y = py + 60;
            party[i].glow = true;
          }
          fade.startCutFade(nowMs(), { outMs: 0, holdMs: 0, inMs: SPACE_BOSS_TIMING.regroupFadeIn, onEnd: sbNext });
          return;
        }
        if (step.action === "dropBoss") {
          sbBoss = {
            startMs: nowMs(),
            duration: SPACE_BOSS_TIMING.bossDrop,
            startY: -60,
            endY: 55,
            size: 90,
          };
          setTimeout(() => {
            if (current.id === "space_boss" && !sbLastBattleStarted) {
              startSpaceBossBossSpeech(() => startSpaceBossFirstBattle());
            }
          }, SPACE_BOSS_TIMING.battleAfterBossDrop);
          return;
        }
        if (step.action === "whiteFlash") {
          sbWhiteFlash = { startMs: nowMs(), duration: SPACE_BOSS_TIMING.whiteFlash };
          setTimeout(() => {
            const party = actors.filter(a => a.name?.startsWith("sb_party_"));
            for (let i = 0; i < party.length; i++) {
              party[i].img = SPRITES[`p${i + 1}`];
            }
          }, SPACE_BOSS_TIMING.whiteFlashChange);
          setTimeout(() => {
            sbWhiteFlash = null;
            sbNext();
          }, SPACE_BOSS_TIMING.whiteFlash);
          return;
        }
        if (step.action === "suck") {
          input.lock();
          setTimeout(() => {
            const targets = actors.filter(a => a.name?.startsWith("sb_party_"));
            const suckStart = nowMs();
            sbSuck = { targets, start: suckStart, duration: SPACE_BOSS_TIMING.suck };
            setTimeout(() => {
              bgmCtl.setOverride("about:blank");
              fade.startCutFade(nowMs(), {
                outMs: SPACE_BOSS_TIMING.fadeHold, holdMs: SPACE_BOSS_TIMING.blackHoleHold, inMs: 0,
                onEnd: sbNext,
              });
            }, SPACE_BOSS_TIMING.suck);
          }, SPACE_BOSS_TIMING.preSuckDelay);
          return;
        }
        if (step.fade && !step.pages) {
          fade.startCutFade(nowMs(), { outMs: SPACE_BOSS_TIMING.fadeOut, holdMs: SPACE_BOSS_TIMING.fadeHold, inMs: SPACE_BOSS_TIMING.fadeIn, onBlack: step.onBlack, onEnd: sbNext });
          return;
        }
        if (step.fade) {
          fade.startCutFade(nowMs(), {
            outMs: SPACE_BOSS_TIMING.fadeOut, holdMs: SPACE_BOSS_TIMING.fadeHold, inMs: SPACE_BOSS_TIMING.fadeIn,
            onBlack: step.onBlack,
            onEnd: () => {
              input.unlock();
              dialog.setVoice("s_hi");
              dialog.open(step.pages, () => { dialog.setVoice("default"); sbNext(); }, "talk");
            },
          });
          return;
        }
        const delay = step.wait || 0;
        if (!step.pages) {
          setTimeout(sbNext, delay);
          return;
        }
        setTimeout(() => {
          input.unlock();
          dialog.setVoice("s_hi");
          dialog.open(step.pages, () => { dialog.setVoice("default"); input.lock(); sbNext(); }, "talk");
        }, delay);
      }
      sbNext();
    }
    updateCam();
    if (current.id === "theater") {
      theaterScene.startMs = nowMs();
      theaterScene.exitWaitStartMs = 0;
      theaterScene.phase = "intro";
      theaterScene.messageShown = false;
    }
    if (prevMapId === "theater" && current.id === "outdoor" && opt?.doorId === 34) {
      startRainScene(nowMs());
      actors.push({
        kind: "npc",
        name: "misaki",
        x: 2414,
        y: 1349,
        img: SPRITES.misaki,
        spr: 16,
        sprH: 16,
        frame: 0,
        last: 0,
        talkHit: { x: 0, y: 0, w: 16, h: 14 },
        talkPages: [["映画館から出て雨が降ってると、なんかちょっとした気持ちになるよねぇ。"]],
        solid: true,
        animMs: Infinity,
      });
    }
    mapReady = true;
    syncStairZonePrev();
    if (typeof opt?.onReady === "function") opt.onReady();
  }

  bgImg.onload = () => {
    bgOK = true;
    done();
  };
  bgImg.onerror = () => {
    bgOK = true;
    done();
  };
  bgImg.src = def.bgSrc;
  bgTopImg.src         = def.bgTopSrc       || "";
  bgMidImg.src         = def.bgMidSrc       || "";
  bgShrineImg.src      = def.bgShrineSrc    || "";
  bgShrineTopImg.src   = def.bgShrineTopSrc || "";
  bgShoreImg.src       = def.bgShoreSrc     || "";
  current.hasBgTop       = !!def.bgTopSrc;
  current.hasBgMid       = !!def.bgMidSrc;
  current.hasBgShrine    = !!def.bgShrineSrc;
  current.hasBgShrineTop = !!def.bgShrineTopSrc;
  current.hasBgShore     = !!def.bgShoreSrc;
  current.bgMidOffset    = def.bgMidOffset    || null;
  current.bgTopOffset    = def.bgTopOffset    || null;
  current.bgShrineOffset = def.bgShrineOffset || null;
  current.bgShrineTopOffset = def.bgShrineTopOffset || null;
  current.bgShoreOffset  = def.bgShoreOffset  || null;
  if (!current.hasBgShore) {
    bgShoreReady = false;
    bgShoreData = null;
  }
  shrineMode = false;
  shrineFade = 0;
  shrineTriggerActive = false;
  heightLevel = id === "outdoor" ? charHeight.leader : "ground";
  stairZonePrev.leader = stairZonePrev.p2 = stairZonePrev.p3 = stairZonePrev.p4 = false;
  shrineWhite = { phase: "off", alpha: 0, targetMode: false };

  col.load(def.colSrc, () => {
    colOK = true;
    done();
  });
}

// ---- Draw ----
// カメラが映している範囲だけ描画（巨大マップのGPU負荷削減）
function drawMapImg(img, alpha, offset) {
  if (!img.complete || img.naturalWidth <= 0) return;
  const ox = (offset && offset.x) | 0;
  const oy = (offset && offset.y) | 0;
  const camX = cam.x - ox;
  const camY = cam.y - oy;
  if (IS_MOBILE_DEVICE && current.id === "outdoor" && img.naturalWidth > 2048) {
    const startCx = Math.max(0, (camX / MOBILE_MAP_CHUNK) | 0);
    const startCy = Math.max(0, (camY / MOBILE_MAP_CHUNK) | 0);
    const endCx = Math.min(((img.naturalWidth - 1) / MOBILE_MAP_CHUNK) | 0, ((camX + canvas.width) / MOBILE_MAP_CHUNK) | 0);
    const endCy = Math.min(((img.naturalHeight - 1) / MOBILE_MAP_CHUNK) | 0, ((camY + canvas.height) / MOBILE_MAP_CHUNK) | 0);
    if (alpha !== undefined && alpha < 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let cy = startCy; cy <= endCy; cy++) {
        for (let cx = startCx; cx <= endCx; cx++) {
          const chunk = getMapChunk(img, cx, cy);
          if (!chunk) continue;
          const dx = cx * MOBILE_MAP_CHUNK - camX;
          const dy = cy * MOBILE_MAP_CHUNK - camY;
          ctx.drawImage(chunk, dx | 0, dy | 0);
        }
      }
      ctx.restore();
    } else {
      for (let cy = startCy; cy <= endCy; cy++) {
        for (let cx = startCx; cx <= endCx; cx++) {
          const chunk = getMapChunk(img, cx, cy);
          if (!chunk) continue;
          const dx = cx * MOBILE_MAP_CHUNK - camX;
          const dy = cy * MOBILE_MAP_CHUNK - camY;
          ctx.drawImage(chunk, dx | 0, dy | 0);
        }
      }
    }
    return;
  }
  const sx = Math.max(0, camX | 0);
  const sy = Math.max(0, camY | 0);
  const dxOff = sx - camX;
  const dyOff = sy - camY;
  const sw = Math.min(canvas.width  - dxOff, img.naturalWidth  - sx);
  const sh = Math.min(canvas.height - dyOff, img.naturalHeight - sy);
  if (sw <= 0 || sh <= 0) return;
  if (alpha !== undefined && alpha < 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sw, sh, dxOff | 0, dyOff | 0, sw, sh);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, dxOff | 0, dyOff | 0, sw, sh);
  }
}

function drawSprite(img, f, x, y, spr = SPR, sprH = spr) {
  if (!img) {
    if (DEBUG) {
      ctx.strokeStyle = "#f00";
      ctx.strokeRect((x - cam.x) | 0, (y - cam.y) | 0, spr, sprH);
    }
    return;
  }
  if (img.naturalWidth <= 0) return;
  ctx.drawImage(img, (f * spr) | 0, 0, spr, sprH, (x - cam.x) | 0, (y - cam.y) | 0, spr, sprH);
}

function drawTintedSprite(img, f, x, y, tint, spr = SPR, sprH = spr) {
  if (!img || img.naturalWidth <= 0) return;
  tintCanvas.width = spr;
  tintCanvas.height = sprH;
  tintCtx.clearRect(0, 0, spr, sprH);
  tintCtx.globalCompositeOperation = "source-over";
  tintCtx.drawImage(img, (f * spr) | 0, 0, spr, sprH, 0, 0, spr, sprH);
  tintCtx.globalCompositeOperation = "multiply";
  tintCtx.fillStyle = tint;
  tintCtx.fillRect(0, 0, spr, sprH);
  tintCtx.globalCompositeOperation = "destination-in";
  tintCtx.drawImage(img, (f * spr) | 0, 0, spr, sprH, 0, 0, spr, sprH);
  tintCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(tintCanvas, (x - cam.x) | 0, (y - cam.y) | 0);
}


function drawEntry(o) {
  if (o.explodeStart) {
    const ee = (nowMs() - o.explodeStart) / 260;
    if (ee >= 1) return;
    const ep = Math.min(1, ee);
    const sx = ((o.x - cam.x) | 0) + 8;
    const sy = ((o.y - cam.y) | 0) + 16;
    const flash = 1 - Math.abs(ep - 0.16) / 0.16;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - ep * 1.5);
    drawSprite(o.img, o.frame, o.x, o.y, o.spr ?? SPR, o.sprH ?? (o.spr ?? SPR));
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.max(0, flash) * 0.95;
    ctx.fillStyle = "#fff7d0";
    ctx.beginPath();
    ctx.arc(sx, sy, 12 + ep * 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (1 - ep) * 0.88;
    ctx.strokeStyle = "#ff5a3d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, 9 + ep * 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (1 - ep) * 0.72;
    ctx.strokeStyle = "#fff7d0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 6 + ep * 26, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + ep * 5;
      const r = ep * (18 + (i % 4) * 9);
      const px = sx + Math.cos(a) * r;
      const py = sy + Math.sin(a) * r - ep * 10;
      ctx.globalAlpha = (1 - ep) * 0.9;
      ctx.fillStyle = i % 3 === 0 ? "#fff7d0" : i % 2 === 0 ? "#ff1744" : "#ff9a3d";
      ctx.fillRect(px | 0, py | 0, 4, 4);
    }
    ctx.restore();
    return;
  }
  if (o.vanishStart) {
    const ve = (nowMs() - o.vanishStart) / 400;
    if (ve >= 1) return;
    const vp = ve * ve;
    const sx = ((o.x - cam.x) | 0) + 8;
    const sy = ((o.y - cam.y) | 0) + 8;
    const vanishUp = !!o.vanishUp;
    ctx.save();
    ctx.globalAlpha = 1 - vp;
    ctx.translate(sx, sy + (vanishUp ? -vp * 18 : 0));
    ctx.scale(1 - vp * 0.8, 1 + vp * 2);
    ctx.translate(-sx, -sy);
    const _vs = o.spr ?? SPR, _vh = o.sprH ?? _vs;
    drawSprite(o.img, o.frame, o.x, o.y, _vs, _vh);
    // スプライト形状だけ白く光らせる
    tintCanvas.width = _vs; tintCanvas.height = _vh;
    tintCtx.clearRect(0, 0, _vs, _vh);
    tintCtx.globalCompositeOperation = "source-over";
    tintCtx.drawImage(o.img, (o.frame * _vs) | 0, 0, _vs, _vh, 0, 0, _vs, _vh);
    tintCtx.globalCompositeOperation = "source-in";
    tintCtx.fillStyle = "#fff";
    tintCtx.fillRect(0, 0, _vs, _vh);
    tintCtx.globalCompositeOperation = "source-over";
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (1 - vp) * vp * 4;
    ctx.drawImage(tintCanvas, (o.x - cam.x) | 0, (o.y - cam.y) | 0);
    ctx.restore();
    // パーティクル
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + ve * 3;
      const r = ve * 20;
      const px = sx + Math.cos(a) * r;
      const py = sy + Math.sin(a) * r - ve * (vanishUp ? 28 : 12);
      ctx.save();
      ctx.globalAlpha = (1 - vp) * 0.9;
      ctx.fillStyle = "#aef";
      ctx.fillRect(px | 0, py | 0, 2, 2);
      ctx.restore();
    }
    return;
  }
  if (o.sparkle) {
    const sx = ((o.x - cam.x) | 0) + 8;
    const sy = ((o.y - cam.y) | 0) + 8;
    const t = nowMs() / 180 + (o.sparklePhase || 0);
    const r = Math.sin(t) > 0 ? 3 : 2;
    const red = o.sparkleColor === "red";
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = red ? "#ff8f8f" : "#9dff9d";
    ctx.fillRect(sx - r, sy, r * 2 + 1, 1);
    ctx.fillRect(sx, sy - r, 1, r * 2 + 1);
    ctx.fillStyle = red ? "rgba(255,140,140,0.7)" : "rgba(170,255,170,0.7)";
    ctx.fillRect(sx - 1, sy - 1, 3, 3);
    ctx.restore();
    return;
  }
  if (o.alpha !== undefined && o.alpha <= 0) return;
  const hasAlpha = o.alpha !== undefined && o.alpha < 1;
  const hasScale = o.scale !== undefined && o.scale !== 1;
  const rainbowOn = !!o.rainbow;
  const hasFilter = !!o.filter || rainbowOn;
  const hasTint = !!o.tint;
  const hasRotation = typeof o.rotation === "number" && o.rotation !== 0;
  const sprSize  = o.spr  ?? SPR;
  const sprSizeH = o.sprH ?? sprSize;

  if (o.glow) {
    const gx = ((o.x - cam.x) | 0) + sprSize / 2;
    const gy = ((o.y - cam.y) | 0) + sprSizeH / 2;
    const pulse = 0.35 + 0.15 * Math.sin(nowMs() / 600);
    const gr = Math.max(sprSize, sprSizeH) * 1.2;
    ctx.save();
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    grad.addColorStop(0, `rgba(180,220,255,${pulse})`);
    grad.addColorStop(0.5, `rgba(120,180,255,${pulse * 0.4})`);
    grad.addColorStop(1, "rgba(80,140,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    ctx.restore();
  }

  if (o.animMode === "crossfade" && o.crossAlpha !== undefined) {
    const t = o.crossAlpha;
    ctx.save();
    if (o.shadowImg) drawSprite(o.shadowImg, 0, o.x + (o.shadowOff?.x ?? 0), o.y + (o.shadowOff?.y ?? 0), sprSize, sprSizeH);
    ctx.globalAlpha = 1 - t;
    drawSprite(o.img, 0, o.x, o.y, sprSize, sprSizeH);
    ctx.globalAlpha = t;
    drawSprite(o.img, 1, o.x, o.y, sprSize, sprSizeH);
    ctx.restore();
    return;
  }

  if (hasAlpha || hasScale || hasFilter || hasTint || hasRotation) {
    ctx.save();
    if (hasAlpha) ctx.globalAlpha = Math.max(0, o.alpha);
    if (hasFilter) {
      if (rainbowOn) {
        const hue = (nowMs() / 8) % 360;
        ctx.filter = `hue-rotate(${hue}deg) saturate(2) brightness(1.3)`;
      } else {
        ctx.filter = o.filter;
      }
    }
    if (hasScale || hasRotation) {
      const sx = ((o.x - cam.x) | 0) + sprSize / 2;
      const sy = o.pivotMode === "center"
        ? ((o.y - cam.y) | 0) + sprSizeH / 2
        : ((o.y - cam.y) | 0) + sprSizeH - 3;
      ctx.translate(sx, sy);
      ctx.scale(o.scale, o.scale);
      if (hasRotation) ctx.rotate(o.rotation);
      ctx.translate(-sx, -sy);
    }
    if (o.shadowImg) drawSprite(o.shadowImg, 0, o.x + (o.shadowOff?.x ?? 0), o.y + (o.shadowOff?.y ?? 0), sprSize, sprSizeH);
    if (hasTint) drawTintedSprite(o.img, o.frame, o.x, o.y, o.tint, sprSize, sprSizeH);
    else drawSprite(o.img, o.frame, o.x, o.y, sprSize, sprSizeH);
    if (o.metImg) drawSprite(o.metImg, 0, o.x, o.y, sprSize, sprSizeH);
    ctx.restore();
  } else {
    if (o.shadowImg) drawSprite(o.shadowImg, 0, o.x + (o.shadowOff?.x ?? 0), o.y + (o.shadowOff?.y ?? 0), sprSize, sprSizeH);
    drawSprite(o.img, o.frame, o.x, o.y, sprSize, sprSizeH);
    if (o.metImg) drawSprite(o.metImg, 0, o.x, o.y, sprSize, sprSizeH);
  }

  if (o.pickupVanishStart) {
    const dur = o.pickupVanishDur || 520;
    const vp = Math.min(1, (nowMs() - o.pickupVanishStart) / dur);
    const HOP_SPLIT = 0.4;
    if (vp >= HOP_SPLIT) {
      const sp = (vp - HOP_SPLIT) / (1 - HOP_SPLIT);
      const cx = ((o.x - cam.x) | 0) + sprSize / 2;
      const cy = ((o.y - cam.y) | 0) + sprSizeH / 2;
      // 白シルエット発光
      tintCanvas.width = sprSize; tintCanvas.height = sprSizeH;
      tintCtx.clearRect(0, 0, sprSize, sprSizeH);
      tintCtx.globalCompositeOperation = "source-over";
      tintCtx.drawImage(o.img, (o.frame * sprSize) | 0, 0, sprSize, sprSizeH, 0, 0, sprSize, sprSizeH);
      tintCtx.globalCompositeOperation = "source-in";
      tintCtx.fillStyle = "#fff";
      tintCtx.fillRect(0, 0, sprSize, sprSizeH);
      tintCtx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = (1 - sp) * sp * 4;
      ctx.translate(cx, cy);
      const gs = 1 - sp;
      ctx.scale(gs, gs);
      ctx.rotate(sp * Math.PI * 2);
      ctx.drawImage(tintCanvas, -sprSize / 2, -sprSizeH / 2);
      ctx.restore();
      // スパークル
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + sp * 4;
        const r = sp * 18;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        ctx.save();
        ctx.globalAlpha = (1 - sp) * 0.9;
        ctx.fillStyle = "#aef";
        ctx.fillRect(px | 0, py | 0, 2, 2);
        ctx.restore();
      }
    }
  }

  if (o.ironHeartMark) {
    drawIronHeartMark(((o.x - cam.x) | 0) + sprSize / 2, ((o.y - cam.y) | 0) - 8, nowMs());
  }

  if (o.markImg?.naturalWidth > 0) {
    const now = nowMs();
    const ix = ((o.x - cam.x) | 0) + ((sprSize - 16) >> 1);
    const bob = Math.sin(nowMs() / 180) > 0 ? 1 : 0;
    const iy = ((o.y - cam.y) | 0) - 3 + bob;
    if (o.markMode === "pizza_pop") {
      return;
    }
    const markSpr = o.markSpr | 0;
    const markFrame = markSpr > 0 && o.markAnimMs
      ? (((now / o.markAnimMs) | 0) % Math.max(1, ((o.markImg.naturalWidth / markSpr) | 0)))
      : 0;
    if (o.markAnimStart && o.markAnimUntil && now < o.markAnimUntil && o.markFromImg?.naturalWidth > 0) {
      const dur = Math.max(1, o.markAnimUntil - o.markAnimStart);
      const p = Math.min(1, Math.max(0, (now - o.markAnimStart) / dur));
      if (p < 0.5) {
        const s = 1 - p * 0.7;
        ctx.save();
        ctx.translate(ix + 8, iy + 8);
        ctx.scale(s, s);
        ctx.drawImage(o.markFromImg, -8, -8, 16, 16);
        ctx.restore();
      } else {
        const s = 0.65 + ((p - 0.5) / 0.5) * 0.35;
        ctx.save();
        ctx.translate(ix + 8, iy + 8);
        ctx.scale(s, s);
        if (markSpr > 0) ctx.drawImage(o.markImg, markFrame * markSpr, 0, markSpr, 16, -8, -8, 16, 16);
        else ctx.drawImage(o.markImg, -8, -8, 16, 16);
        ctx.restore();
      }
    } else {
      const reveal = o.markReveal;
      if (reveal !== undefined) {
        if (reveal <= 0.001) return;
        const s = 0.2 + reveal * 0.8;
        ctx.save();
        ctx.globalAlpha *= reveal;
        ctx.translate(ix + 8, iy + 16);
        ctx.scale(s, s);
        if (markSpr > 0) ctx.drawImage(o.markImg, markFrame * markSpr, 0, markSpr, 16, -8, -16, 16, 16);
        else ctx.drawImage(o.markImg, -8, -16, 16, 16);
        ctx.restore();
      } else if (markSpr > 0) {
        ctx.drawImage(o.markImg, markFrame * markSpr, 0, markSpr, 16, ix, iy, 16, 16);
      } else {
        ctx.drawImage(o.markImg, ix, iy, 16, 16);
      }
    }
  }

  if (o.sweat) {
    const baseX = ((o.x - cam.x) | 0) + 8;
    const baseY = ((o.y - cam.y) | 0) + 3;
    const tt = nowMs() / 140 + (o.sweatPhase || 0);
    const p1x = baseX + ((Math.sin(tt * 1.7) * 5) | 0);
    const p1y = baseY + ((Math.cos(tt * 2.1) * 4) | 0);
    const p2x = baseX + 3 + ((Math.sin(tt * 1.3 + 1.7) * 6) | 0);
    const p2y = baseY + 1 + ((Math.cos(tt * 1.9 + 0.8) * 5) | 0);
    const p3x = baseX - 2 + ((Math.sin(tt * 1.9 + 2.4) * 4) | 0);
    const p3y = baseY + 4 + ((Math.cos(tt * 1.5 + 1.2) * 3) | 0);
    ctx.save();
    ctx.fillStyle = "#dff6ff";
    ctx.fillRect(p1x, p1y, 1, 2);
    ctx.fillRect(p2x, p2y, 1, 1);
    ctx.fillRect(p3x, p3y, 1, 1);
    ctx.restore();
  }

  if (o.hotSteam) {
    const baseX = ((o.x - cam.x) | 0) + sprSize / 2;
    const baseY = ((o.y - cam.y) | 0) + 4;
    const tt = nowMs() / 700 + (o.hotPhase || 0);
    ctx.save();
    for (let i = 0; i < 4; i += 1) {
      const p = (tt + i * 0.33) % 1;
      const wobble = Math.sin(tt * 4 + i * 1.7);
      const x = baseX - 6 + i * 4 + wobble * 3;
      const y = baseY - p * 15;
      const r = 2.2 + p * 2.6 + (i % 2) * 0.7;
      ctx.globalAlpha = (1 - p) * 0.52;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = (1 - p) * 0.28;
      ctx.fillStyle = "rgba(255,220,210,0.75)";
      ctx.beginPath();
      ctx.arc(x + 2, y + 1, Math.max(1.5, r * 0.65), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawIronHeartMark(x, y, t) {
  const bob = Math.sin(t / 180) > 0 ? 1 : 0;
  const sx = x | 0;
  const sy = (y + bob) | 0;
  ctx.save();
  ctx.fillStyle = "#ff8f8f";
  ctx.fillRect(sx - 4, sy, 9, 1);
  ctx.fillRect(sx, sy - 4, 1, 9);
  ctx.fillStyle = "rgba(255,140,140,0.7)";
  ctx.fillRect(sx - 1, sy - 1, 3, 3);
  ctx.restore();
}

function drawPizzaMarkOverlay(o) {
  if (o.markMode !== "pizza_pop") return;
  if (!o.markImg?.complete || o.markImg.naturalWidth <= 0) return;
  const sprSize = o.spr ?? SPR;
  const now = nowMs();
  const ix = ((o.x - cam.x) | 0) + ((sprSize - 16) >> 1);
  const iy = ((o.y - cam.y) | 0) - 3;
  const popY = iy - 16 + Math.sin(now / 260) * 1.2;
  ctx.drawImage(o.markImg, 0, 0, 16, 16, ix, popY, 16, 16);
}

function draw() {
  // フレーム先頭でコンテキスト状態をリセット（ブラー防止）
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  // ロード画面
  if (loading.isActive()) {
    loading.draw(ctx);
    return;
  }

  // タイトル画面
  if (title.isActive()) {
    const tt = typeof performance !== "undefined" ? performance.now() : Date.now();
    title.draw(ctx, tt);
    return;
  }

  // キャラクターセレクト
  if (charSelect.isActive()) {
    const tt = typeof performance !== "undefined" ? performance.now() : Date.now();
    charSelect.draw(ctx, tt);
    return;
  }

  if (drawPrologue(ctx)) return;

  {
    const tt = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (continueRevealFx?.phase === "loading" && drawContinueRevealOverlay(ctx, tt)) return;
  }

  if (mechaEvolution.active) {
    const tt = typeof performance !== "undefined" ? performance.now() : Date.now();
    drawMechaEvolutionScene(tt);
    fade.draw(ctx);
    return;
  }

  // エンカウント遷移アニメ中
  if (battleTransition) {
    const bt = battleTransition;
    const t  = nowMs();
    const elapsed  = t - bt.startMs;
    const progress = Math.min(1, elapsed / bt.duration);
    const sw = BASE_W / BT_COLS;
    const sh = BASE_H / BT_ROWS;

    // 黒背景
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    // 各シャード
    ctx.imageSmoothingEnabled = false;
    for (const s of bt.shards) {
      const px  = s.sx + s.vx * elapsed;
      const py  = s.sy + s.vy * elapsed;
      const rot = s.rotSpeed * elapsed;
      const a   = Math.max(0, 1 - progress * 1.6);

      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate((px + sw / 2) | 0, (py + sh / 2) | 0);
      ctx.rotate(rot);
      ctx.drawImage(bt.off, s.sx, s.sy, sw, sh, (-sw / 2) | 0, (-sh / 2) | 0, sw, sh);
      ctx.restore();
    }

    // 開始直後の白フラッシュ
    if (t < bt.flashUntil) {
      const fp = 1 - (t - bt.startMs) / (bt.flashUntil - bt.startMs);
      ctx.save();
      ctx.globalAlpha = fp * 0.9;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }

    fade.draw(ctx);
    return;
  }

  if (battle.isActive()) {
    battle.draw(ctx);
    fade.draw(ctx);
    return;
  }

  if (shooting.isActive()) {
    ctx._skipTextShadow = true;
    shooting.draw(ctx);
    ctx._skipTextShadow = false;
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    return;
  }

  if (diving.isActive()) {
    ctx._skipTextShadow = true;
    diving.draw(ctx);
    ctx._skipTextShadow = false;
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    return;
  }

  if (phoneBrawl.isActive()) {
    ctx._skipTextShadow = true;
    phoneBrawl.draw(ctx);
    ctx._skipTextShadow = false;
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    return;
  }

  // ★ここは見た目用なので performance.now() でもOK（ゲーム進行の時間とは別）
  const tt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  if (spaceBossMoonScene) {
    drawSpaceBossMoonScene(tt);
    fade.draw(ctx);
    return;
  }
  if (spaceBossWhiteReunion) {
    drawSpaceBossWhiteReunionScene(tt);
    dialog.draw(ctx);
    fade.draw(ctx);
    return;
  }
  const shouldDrawSea = current.id === "outdoor" || current.id === "mirai" || current.id === "kako" || !!waterMaskCanvas;
  const seaUpdateInterval = IS_MOBILE_DEVICE && (current.id === "outdoor" || current.id === "mirai" || current.id === "kako") ? 10 : 3;
  if (shouldDrawSea && seaSparkleFrame++ % seaUpdateInterval === 0) {
    sea.draw(seaSparkleCtx, tt, cam, seaSparkleCanvas.width, seaSparkleCanvas.height);
  }
  if (shouldDrawSea) ctx.drawImage(seaSparkleCanvas, 0, 0);

  if (current.id === "theater") {
    drawTheaterScene(tt);
    menu.draw(ctx);
    letterbox.draw(ctx, tt);
    dialog.draw(ctx);
    choice.draw(ctx);
    shop.draw(ctx);
    ctx._skipTextShadow = true;
    jumprope.draw(ctx);
    ctx._skipTextShadow = false;
    inventory.draw(ctx);
    toast.draw(ctx, tt);
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    fade.draw(ctx);
    return;
  }

  // ベースレイヤー：shrine完全移行後はbgImgを省略して描画コスト削減
  if (current.id === "shooting_lobby" || current.id === "dark_throne") {
    drawShootingBackdrop(ctx, BASE_W, BASE_H, tt);
  } else if (current.id === "space_boss") {
    drawSpaceBossBackdrop(tt);
  } else if (current.id === "space") {
    drawSpaceBackdrop(tt);
  } else if (current.id === "orca_ride") {
    ctx.fillStyle = "#3dc5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWaterSea(ctx);
  } else if (shrineFade >= 1) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (current.hasBgShrine) drawMapImg(bgShrineImg, undefined, current.bgShrineOffset);
  } else {
    drawMapImg(bgImg);
    drawWaterSea(ctx);
    if (current.hasBgShore && bgShoreReady && (((tt / 800) | 0) & 1) === 0) {
      drawBgShore();
    }
    if (shrineFade > 0 && current.hasBgShrine) drawMapImg(bgShrineImg, shrineFade, current.bgShrineOffset);
  }

  _groundList.length = 0;
  _upperList.length  = 0;
  _aboveTopList.length = 0;
  _poolIdx = 0;
  const groundList = _groundList;
  const upperList  = _upperList;
  const aboveTopList = _aboveTopList;
  const isSpaceMap = current.id === "space" || current.id === "space_boss";
  const isDashHeld = input.down("c") && !isSpaceMap;
  const spaceDanger = current.id === "space" && spaceO2 / SPACE_O2_MAX <= 0.2;
  const moonRot = isSpaceMap && spaceMoonAttach ? spaceMoonAngle + Math.PI / 2 : 0;
  const panicFx = spaceDanger || isDashHeld;
  const panicT = tt;
  const panicOx = (phase = 0) => panicFx ? (((Math.sin(panicT / 45 + phase) * 1.8) | 0)) : 0;
  const panicOy = (phase = 0) => panicFx ? (((Math.sin(panicT / 28 + phase) > 0 ? 1 : -1))) : 0;
  const hidePartyForSpaceWarp = spaceWarpFx.active && (nowMs() - spaceWarpFx.start) >= WARP_SHAKE_MS;
  const furoHot = isFuroHotActive();
  if (partyVisible && !hidePartyForSpaceWarp) {
    const singleLeaderOnly = current.id === "shooting_lobby" || current.id === "dark_throne";
    const followerAlpha = 1 - shrineFade;
    const emerging = holeTransition?.phase === 'emerging';
    const fx = emerging && playerHoleDrawX !== null ? playerHoleDrawX : null;
    const fy = emerging && playerHoleDrawY !== null ? playerHoleDrawY : null;
    const fs = emerging ? playerHoleScale : 1;
    const cOff = seaholeCutscene.active ? seaholeCutscene.charOffsetX : 0;
    const rideBob = orcaRide.active
      ? Math.round((1 - Math.cos((tt - orcaRide.startMs) * Math.PI * 2 / 720)) / 2)
      : 0;
    const _hw = STATE.headwear;
    const _p1imgs = [SPRITES.p1, SPRITES.p1_t1, SPRITES.p1_t2, SPRITES.mecha_natsumi];
    const _p2imgs = [SPRITES.p2, SPRITES.p2_t1, SPRITES.p2_t2];
    const _p3imgs = [SPRITES.p3, SPRITES.p3_t1, SPRITES.p3_t2];
    const _p4imgs = [SPRITES.p4, SPRITES.p4_t1, SPRITES.p4_t2];
    function _hwImg(img) {
      if (!_hw) return null;
      if (_hw === "helmet") return SPRITES.met;
      if (_hw === "kingyobachi") return SPRITES.kingyobachi;
      if (_hw === "s_hat") return SPRITES.s_hat;
      if (_hw === "afro") {
        if (_p1imgs.includes(img)) return SPRITES.aflo_p1;
        if (_p2imgs.includes(img)) return SPRITES.aflo_p2;
        if (_p3imgs.includes(img)) return SPRITES.aflo_p3;
        if (_p4imgs.includes(img)) return SPRITES.aflo_p4;
      }
      return null;
    }
    const pushParty = (name, o) => (charHeight[name] === "upper" ? upperList : groundList).push(o);
    if (!orcaRide.active && !singleLeaderOnly) {
      const followerSlots = [
        { name: "p2", actor: p2, phase: 2.9 },
        { name: "p3", actor: p3, phase: 2.1 },
        { name: "p4", actor: p4, phase: 1.3 },
      ];
      const drawSlots = (current.id === "furo_f" || current.id === "furo_m")
        ? followerSlots
            .filter((slot) => isPartySlotVisibleOnCurrentMap(slot.name))
            .map((slot, i) => ({ ...slot, actor: followerSlots[i].actor, phase: followerSlots[i].phase }))
        : followerSlots;
      for (let i = drawSlots.length - 1; i >= 0; i -= 1) {
        const slot = drawSlots[i];
        if (!isPartySlotVisibleOnCurrentMap(slot.name)) continue;
        const img = getPartyDrawImgForSlot(slot.name, slot.actor.img);
        const item = _poolItem();
        item.img = img;
        item.x = (fx ?? slot.actor.x) + cOff + panicOx(slot.phase);
        item.y = fy ?? slot.actor.y + panicOy(slot.phase);
        item.frame = emerging ? 0 : slot.actor.frame;
        item.alpha = followerAlpha;
        item.scale = fs;
        item.rotation = moonRot;
        item.metImg = _hwImg(img);
        item.spr = undefined;
        item.sprH = undefined;
        item.shadowImg = undefined;
        item.sweat = spaceDanger;
        item.sweatPhase = slot.phase;
        item.hotSteam = furoHot;
        item.hotPhase = slot.phase;
        pushParty(slot.name, item);
      }
    }
    const leaderImg = getPartyDrawImgForSlot("leader", leader.img);
    const il = _poolItem(); il.img = leaderImg; il.x = (playerHoleDrawX !== null ? playerHoleDrawX : leader.x) + cOff + panicOx(0.5); il.y = (playerHoleDrawY !== null ? playerHoleDrawY : leader.y) + rideBob + panicOy(0.5); il.frame = holeTransition ? 0 : leader.frame; il.alpha = undefined; il.scale = playerHoleScale; il.rotation = moonRot; il.metImg = _hwImg(leaderImg); il.spr = undefined; il.sprH = undefined; il.shadowImg = undefined; il.sweat = spaceDanger; il.sweatPhase = 0.5; il.hotSteam = furoHot; il.hotPhase = 0.5;
    if (gateWarpFx) {
      const gp = Math.min(1, (nowMs() - gateWarpFx.startMs) / gateWarpFx.duration);
      il.alpha = Math.max(0, 1 - gp * 0.7);
      il.scale = Math.max(0.05, 1 - gp);
      il.rotation = gp * Math.PI * 4;
      il.pivotMode = "center";
      il.glow = true;
    }
    if (isPartySlotVisibleOnCurrentMap("leader")) pushParty("leader", il);
  }
  for (const act of actors) {
    if (act.vanishStart && (nowMs() - act.vanishStart) >= 400) { act.hidden = true; act.vanishStart = undefined; }
    if (act.revealStart) {
      const rp = (nowMs() - act.revealStart) / 320;
      if (rp >= 1) {
        act.alpha = 1;
        act.scale = 1;
        act.revealStart = undefined;
      } else {
        act.alpha = rp;
        act.scale = 0.7 + rp * 0.3;
      }
    }
    if (act.hidden) continue;
    if (act.noRender) continue;
    let bgmFadeAlpha = 1;
    if (act.showWhenBgm) {
      const match = bgmCtl.getOverrideSrc() === act.showWhenBgm;
      if (act._bgmMatch === undefined) {
        act._bgmMatch = match;
        act._bgmAlpha = match ? 1 : 0;
      }
      if (act._bgmMatch !== match) {
        act._bgmMatch = match;
      }
      const BGM_FADE_MS = 500;
      const target = match ? 1 : 0;
      const dt = Math.max(0, tt - (act._bgmAlphaLast ?? tt));
      act._bgmAlphaLast = tt;
      const step = dt / BGM_FADE_MS;
      if (act._bgmAlpha < target) act._bgmAlpha = Math.min(target, (act._bgmAlpha ?? 0) + step);
      else if (act._bgmAlpha > target) act._bgmAlpha = Math.max(target, (act._bgmAlpha ?? 1) - step);
      bgmFadeAlpha = act._bgmAlpha;
      if (bgmFadeAlpha <= 0) continue;
    }
    // ビューポートカリング（画面外NPCはスキップ）
    const actSpr = act.spr ?? SPR;
    const actSprH = act.sprH ?? actSpr;
    if (act.x + actSpr < cam.x - actSpr || act.x > cam.x + canvas.width + actSpr) continue;
    if (act.y + actSprH < cam.y - actSprH || act.y > cam.y + canvas.height + actSprH) continue;
    const isCactus = act.name === "cactus_hat" || act.name?.startsWith("cactus_");
    const ia = _poolItem();
    ia.img = act.img; ia.x = act.x; ia.y = act.y; ia.frame = act.frame;
    ia.spr = act.spr; ia.sprH = act.sprH; ia.alpha = (act.alpha != null ? act.alpha : 1) * bgmFadeAlpha; ia.scale = act.scale; ia.rotation = act.rotation; ia.metImg = undefined;
    ia.sparkle = act.sparkle;
    ia.sparkleColor = act.sparkleColor;
    ia.sparklePhase = act.sparklePhase;
    ia.markImg = act.markImg;
    ia.markReveal = act.markReveal;
    ia.markSpr = act.markSpr;
    ia.markAnimMs = act.markAnimMs;
    ia.markMode = act.markMode;
    ia.markFromImg = act.markFromImg;
          ia.markAnimStart = act.markAnimStart;
          ia.markAnimUntil = act.markAnimUntil;
          ia.vanishStart = act.vanishStart;
          ia.pickupVanishStart = act.pickupVanishStart;
          ia.pickupVanishDur = act.pickupVanishDur;
          ia.pivotMode = act.pivotMode;
          ia.glow = act.glow;
          ia.ironHeartMark = act.ironHeartMark;
    if (sbSuck && sbSuck.targets.includes(act)) {
      const p = Math.min(1, (nowMs() - sbSuck.start) / sbSuck.duration);
      const ep = p * p;
      const tx = cam.x + BASE_W / 2 - 8;
      const ty = cam.y - 20;
      ia.x = act.x + (tx - act.x) * ep;
      ia.y = act.y + (ty - act.y) * ep;
      ia.scale = 1 - ep * 0.9;
      ia.alpha = 1 - ep;
      ia.glow = false;
    }
    ia.shadowImg = undefined; // 影は outdoor.png に合成済み
    ia.shadowOff = isCactus ? _cactusShadowOff : undefined;
    if (act.aboveTop) aboveTopList.push(ia);
    else if (charHeight.leader === "upper") upperList.push(ia);
    else                               groundList.push(ia);
  }

  const sortFn = (a, b) => {
    const aSpr = a.spr ?? SPR;
    const bSpr = b.spr ?? SPR;
    const aBottom = a.y + (a.sprH ?? aSpr);
    const bBottom = b.y + (b.sprH ?? bSpr);
    return aBottom - bBottom;
  };
  groundList.sort(sortFn);
  upperList.sort(sortFn);
  drawDashDust(tt);
  for (let i = 0; i < groundList.length; i++) drawEntry(groundList[i]);
  if (current.hasBgMid) drawMapImg(bgMidImg, undefined, current.bgMidOffset);
  for (let i = 0; i < upperList.length; i++) drawEntry(upperList[i]);
  for (let i = 0; i < groundList.length; i++) drawPizzaMarkOverlay(groundList[i]);
  for (let i = 0; i < upperList.length; i++) drawPizzaMarkOverlay(upperList[i]);

// seahole 魚の描画（スプライットの上）
  if (current.id === "seahole") {
    ctx.save();
    for (const f of fishArr) {
      const fx = (f.x - cam.x) | 0;
      const fy = (f.y - cam.y) | 0;
      const s  = f.size;
      const facingRight = f.vx >= 0;
      ctx.save();
      ctx.translate(fx, fy);
      if (!facingRight) ctx.scale(-1, 1);
      ctx.fillStyle = f.color;
      // 胴体
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      // 尾ひれ
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(-s * 2, -s * 0.65);
      ctx.lineTo(-s * 2,  s * 0.65);
      ctx.closePath();
      ctx.fill();
      // 目
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(s * 0.45, -s * 0.1, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // seahole 泡の描画（スプライットの上、topレイヤーの下）
  if (current.id === "seahole") {
    ctx.save();
    for (const b of bubblePool) {
      if (!b.active) continue;
      const age = tt - b.born;
      const prog = age / b.life;
      const alpha = b.alpha * (1 - prog);
      const bx = ((b.x - b.vx * age * 0.06 - cam.x) | 0);
      const by = ((b.y - b.vy * age * 0.06 - cam.y) | 0);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  }

  // トップレイヤー：同様に完全移行後は shrine 側のみ
  if (current.id === "space" || current.id === "space_boss") {
    // no top layer
  } else if (shrineFade >= 1) {
    if (current.hasBgShrineTop) drawMapImg(bgShrineTopImg, undefined, current.bgShrineTopOffset);
  } else {
    if (current.hasBgTop) drawMapImg(bgTopImg, undefined, current.bgTopOffset);
    if (shrineFade > 0 && current.hasBgShrineTop) drawMapImg(bgShrineTopImg, shrineFade, current.bgShrineTopOffset);
  }

  for (let i = 0; i < aboveTopList.length; i++) drawEntry(aboveTopList[i]);

  drawRainScene(tt);

  if (current.id === "afloclub") {
    drawAfloClubFx(tt);
    applyAfloClubRgbShift();
    drawAfloClubBlackout(tt);
  }

  if (current.id === "space") {
    drawSpaceO2Meter();
  }

  if (timeMachineFx.active) {
    const effectDur = 5000;
    const elapsed = tt - timeMachineFx.start;
    if (elapsed < effectDur) {
      const prog = Math.max(0, Math.min(1, elapsed / effectDur));
      const grow = Math.min(1, prog / 0.18);
      const shrink = Math.max(0, 1 - Math.max(0, prog - 0.72) / 0.28);
      const bloom = grow * shrink;
      const cx = BASE_W >> 1;
      const cy = BASE_H >> 1;
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let i = 0; i < 7; i++) {
        const rr = bloom * (16 + i * 13);
        const hue = (300 + i * 48 + prog * 180) % 360;
        const wobble = bloom * (7 + i * 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(i * 0.35 + tt * 0.0005);
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.001; a += Math.PI / 18) {
          const r = rr + Math.sin(a * 3 + tt * 0.004 + i) * wobble;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * (r * 0.72);
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `hsla(${hue},95%,68%,${bloom * 0.16})`;
        ctx.fill();
        ctx.restore();
      }

      for (let i = 0; i < 14; i++) {
        const ang = tt * 0.0011 + (Math.PI * 2 * i) / 14 + Math.sin(tt * 0.0012 + i) * 0.22;
        const hue = (20 + i * 22 + Math.sin(tt * 0.0008 + i * 2) * 35 + prog * 160) % 360;
        const len = bloom * (36 + i * 4) + Math.sin(tt * 0.004 + i * 1.7) * (6 + bloom * 12);
        const beamW = bloom * (8 + (i % 5) * 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        const g = ctx.createLinearGradient(0, 0, len, 0);
        g.addColorStop(0, `hsla(${hue},100%,68%,0.0)`);
        g.addColorStop(0.16, `hsla(${hue},100%,70%,${bloom * 0.32})`);
        g.addColorStop(0.5, `hsla(${(hue + 90) % 360},100%,66%,${bloom * 0.22})`);
        g.addColorStop(1, `hsla(${(hue + 180) % 360},100%,68%,0.0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, -beamW / 2, len, beamW);
        ctx.restore();
      }

      for (let i = 0; i < 5; i++) {
        const rr = bloom * (14 + i * 16);
        const hue = (260 + i * 58 + prog * 140) % 360;
        const ring = ctx.createRadialGradient(cx, cy, rr * 0.1, cx, cy, rr);
        ring.addColorStop(0, `hsla(${hue},100%,78%,${bloom * 0.2})`);
        ring.addColorStop(0.4, `hsla(${(hue + 70) % 360},100%,68%,${bloom * 0.1})`);
        ring.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rr, rr * 0.72, tt * 0.0003 + i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloom * 38);
      core.addColorStop(0, "rgba(255,250,180,0.92)");
      core.addColorStop(0.18, `rgba(255,110,210,${bloom * 0.55})`);
      core.addColorStop(0.42, `rgba(120,255,180,${bloom * 0.26})`);
      core.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, bloom * 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (pageTurnFx.active) {
    drawPageTurnFx(tt);
  }
  if (timeMachineTravelFx.active) {
    drawTimeMachineTravelFx(tt);
  }

  // モバイル：神社切替用の白フラッシュオーバーレイ
  if (IS_MOBILE_DEVICE && shrineWhite.phase !== "off" && shrineWhite.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = shrineWhite.alpha;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // seaholeカットシーン: 大きな黒い影（直径32の円）
  if (seaholeCutscene.active && seaholeCutscene.shadowX < BASE_W + 16) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc((seaholeCutscene.shadowX + 16) | 0, (BASE_H / 2) | 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // セピアフィルター（letterbox 連動）+ グッドトリップ色味
  {
    const parts = [];
    if (letterbox.isActive()) parts.push(`sepia(${letterbox.getSepiaAmount().toFixed(3)})`);
    const gtf = goodTrip.getCssFilter?.();
    if (gtf) parts.push(gtf);
    canvas.style.filter = parts.join(" ");
  }

  // びっくりマーク
  if (exclamations.length > 0) {
    exclamations = exclamations.filter(e => tt < e.startMs + e.duration);
    for (const e of exclamations) {
      const elapsed = tt - e.startMs;
      const p = elapsed / e.duration;
      // スケール: 0→1.2→1 (最初150ms), その後1, 最後200msでフェード
      let scale = 1;
      if (elapsed < 150) scale = (elapsed / 150) * 1.2;
      else if (elapsed < 220) scale = 1.2 - (elapsed - 150) / 70 * 0.2;
      const alpha = e.opaque ? 1 : (p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(e.sx, e.sy);
      ctx.scale(scale, scale);
      const ch = e.char || "!";
      const markImg = ch === "?" ? SPRITES.hatena : ch === "!" ? SPRITES.bikkuri : null;
      if (markImg?.naturalWidth > 0) {
        ctx.drawImage(markImg, -8, -16, 16, 16);
      } else {
        ctx.fillStyle = e.color || "#e00";
        ctx.font = "bold 12px PixelMplus10";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(ch, 0, 0);
      }
      ctx.restore();
    }
  }

  if (_phoneCallIconActive && SPRITES.minami_call?.naturalWidth > 0) {
    const elapsed = tt - _phoneCallIconMs;
    let scale = 1;
    if (elapsed < 150) scale = (elapsed / 150) * 1.2;
    else if (elapsed < 220) scale = 1.2 - (elapsed - 150) / 70 * 0.2;
    const bob = Math.sin(tt / 180) > 0 ? 1 : 0;
    const sx = ((leader.x + 8) - cam.x) | 0;
    const sy = ((leader.y) - cam.y) | 0;
    ctx.save();
    ctx.translate(sx, sy - 2 + bob);
    ctx.scale(scale, scale);
    ctx.drawImage(SPRITES.minami_call, -8, -16, 16, 16);
    ctx.restore();
  }

  menu.draw(ctx);
  if (!ending.isActive() && current.id !== "space_boss") letterbox.draw(ctx, tt);
  dialog.draw(ctx);
  choice.draw(ctx);
  shop.draw(ctx);
  ctx._skipTextShadow = true;
  jumprope.draw(ctx);
  ctx._skipTextShadow = false;
  toast.draw(ctx, tt);
  questAlert.update(); drainQuestQueue();
  questAlert.draw(ctx);
  drawSpaceBossOutdoorDeadParty();
  drawGateWarpFx();
  ending.draw(ctx, tt);

  // 赤→黒フェード（orca 衝撃）
  if (redScreenStart >= 0) {
    const elapsed = tt - redScreenStart;
    const p = Math.min(elapsed / RED_TO_BLACK_MS, 1);
    const r = Math.round(204 * (1 - p)) | 0;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(${r},0,0)`;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();
    if (p >= 1 && redScreenOnEnd) {
      const cb = redScreenOnEnd;
      redScreenOnEnd = null;
      cb();
    }
  }

  // ---- Space Warp FX ----
  if (spaceWarpFx.active) {
    const we = performance.now() - spaceWarpFx.start;
    if (we < WARP_SHAKE_MS) {
      // Phase 1: 画面揺れ + 白フラッシュ増加
      const p = we / WARP_SHAKE_MS;
      const shakeX = ((Math.sin(we * 0.05) * 3 * p) | 0);
      const shakeY = ((Math.cos(we * 0.07) * 3 * p) | 0);
      ctx.save();
      ctx.translate(shakeX, shakeY);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = p * 0.4;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    } else if (we < WARP_TOTAL_MS) {
      // Phase 2: キャラ回転上昇 + 白フラッシュ
      const p = (we - WARP_SHAKE_MS) / WARP_SPIN_MS;
      const ep = p * p;
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.4 + p * 0.6;
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
      const chars = [leader, p2, p3, p4];
      for (let i = 0; i < 4; i++) {
        const c = chars[i];
        const cx = ((c.x - cam.x) | 0) + 8;
        const cy = ((c.y - cam.y) | 0) + 8 - ep * 120 - i * 8 * ep;
        const rot = p * Math.PI * 6 + i * 0.5;
        const sc = Math.max(0, 1 - ep * 0.6);
        ctx.save();
        ctx.globalAlpha = 1 - ep;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        ctx.drawImage(c.img, 0, 0, SPR, SPR, -8, -8, SPR, SPR);
        ctx.restore();
      }
    } else if (!spaceWarpFx.done) {
      // フェード開始、白は描き続ける
      spaceWarpFx.done = true;
      const toSpaceBoss = (spaceWarpFx.target || "space") === "space_boss";
      fade.startCutFade(nowMs(), {
        outMs: 1, holdMs: toSpaceBoss ? 3200 : 200, inMs: 500,
        onBlack: () => {
          if (toSpaceBoss) STATE.headwear = null;
          spaceWarpFx.active = false;
          loadMap(spaceWarpFx.target || "space");
          input.unlock();
        },
      });
    }
    if (spaceWarpFx.done) {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();
    }
  }

  // ---- kako 恐竜ムービーオーバーレイ ----
  if (kakoMovieScene.active) {
    drawDinoScene(tt);
  }

  if (sbWhiteFlash) {
    const elapsed = nowMs() - sbWhiteFlash.startMs;
    const p = Math.min(1, elapsed / sbWhiteFlash.duration);
    let a;
    if (p < 0.1) a = p / 0.1;
    else if (p < 0.5) a = 1;
    else a = 1 - (p - 0.5) / 0.5;
    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();
  }

  drawSpaceBossTypedSpeech(tt);
  drawSpaceBossOutdoorEpilogueOverlay(tt);
  drawShootingDifficultyUi(tt);

  fade.draw(ctx);
  drawContinueRevealOverlay(ctx, tt);

  if (_whiteFlash) {
    const elapsed = nowMs() - _whiteFlash.startMs;
    const p = elapsed / _whiteFlash.duration;
    if (p >= 1) {
      _whiteFlash = null;
    } else {
      const a = p < 0.18 ? p / 0.18 : 1 - (p - 0.18) / (1 - 0.18);
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  // ---- 負け演出コミックポップ ----
  if (beatPops.length > 0) {
    const now_ms = performance.now();
    ctx.save();
    ctx.font = "bold 14px PixelMplus10";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.imageSmoothingEnabled = false;
    beatPops = beatPops.filter(p => {
      const el = now_ms - p.startMs;
      if (el > p.duration) return false;
      const prog = el / p.duration;
      const alpha = prog < 0.15 ? prog / 0.15 : 1 - (prog - 0.15) / 0.85;
      const px = p.x | 0;
      const py = p.y | 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color ?? "#fff";
      ctx.fillText(p.text, px, py);
      ctx.restore();
      return true;
    });
    ctx.restore();
  }

  // デバッグ：座標表示
  if (DEBUG && !MOBILE && input.down("b")) {
    const coord = `${leader.x | 0},${leader.y | 0}`;
    ctx.save();
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "bottom";
    const cw = ctx.measureText(coord).width;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(BASE_W - cw - 6, BASE_H - 14, cw + 4, 12);
    ctx.fillStyle = "#fff";
    ctx.fillText(coord, BASE_W - cw - 4, BASE_H - 3);
    ctx.restore();
  }

  // セーブ/ロード通知
  if (saveNotice && tt < saveNotice.until) {
    const alpha = Math.min(1, (saveNotice.until - tt) / 300);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#000";
    ctx.fillRect(BASE_W - 70, 4, 66, 14);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(BASE_W - 70 + 0.5, 4.5, 65, 13);
    ctx.fillStyle = "#fff";
    const tw = ctx.measureText(saveNotice.text).width;
    ctx.fillText(saveNotice.text, (BASE_W - 70 + (66 - tw) / 2) | 0, 6);
    ctx.restore();
  }

  // デバッグ：B ホールドで会話/当たり判定・ドアtrigger可視化
  if (DEBUG && input.down("b")) {
    ctx.save();
    ctx.font = "6px monospace";

    // プレイヤー足元当たり判定（黄）
    const pf = footBox(leader.x, leader.y);
    ctx.strokeStyle = "rgba(255,220,80,0.95)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pf.x - cam.x, pf.y - cam.y, pf.w, pf.h);
    ctx.fillStyle = "rgba(255,220,80,0.18)";
    ctx.fillRect(pf.x - cam.x, pf.y - cam.y, pf.w, pf.h);

    // talkHit
    for (const act of actors) {
      if (!act.talkHit && act.kind !== "npc") continue;
      const th = act.talkHit || { x: 0, y: 0, w: SPR, h: SPR };
      const rx = act.x + th.x - cam.x;
      const ry = act.y + th.y - cam.y;
      ctx.strokeStyle = "rgba(80,200,255,0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, th.w, th.h);
      ctx.fillStyle = "rgba(80,200,255,0.15)";
      ctx.fillRect(rx, ry, th.w, th.h);
    }

    // solid NPC の実当たり判定（緑）
    for (const act of actors) {
      if (!act.solid) continue;
      const hb = npcFootBox(act);
      ctx.strokeStyle = "rgba(80,255,120,0.95)";
      ctx.lineWidth = 1;
      ctx.strokeRect(hb.x - cam.x, hb.y - cam.y, hb.w, hb.h);
      ctx.fillStyle = "rgba(80,255,120,0.18)";
      ctx.fillRect(hb.x - cam.x, hb.y - cam.y, hb.w, hb.h);
    }

    // col.png 当たり判定（2px グリッド、赤）
    const STEP = 2;
    for (let sy = 0; sy < BASE_H; sy += STEP) {
      for (let sx = 0; sx < BASE_W; sx += STEP) {
        const wx = sx + cam.x, wy = sy + cam.y;
        if (col.isWallAt(wx, wy, heightLevel)) {
          ctx.fillStyle = "rgba(255,40,40,0.35)";
          ctx.fillRect(sx, sy, STEP, STEP);
        }
      }
    }

    // ドアtrigger（赤）
    for (const door of MAPS[current?.id]?.doors || []) {
      if (!door.trigger) continue;
      const { x, y, w, h } = door.trigger;
      ctx.strokeStyle = "rgba(255,80,80,0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - cam.x, y - cam.y, w, h);
      ctx.fillStyle = "rgba(255,80,80,0.25)";
      ctx.fillRect(x - cam.x, y - cam.y, w, h);
      ctx.fillStyle = "#fff";
      ctx.fillText(`id:${door.id}`, x - cam.x, y - cam.y - 1);
    }

    // cactus ナンバー表示（緑）
    for (const act of actors) {
      if (act.name !== "cactus_hat" && !act.name?.startsWith("cactus_")) continue;
      const sx = act.x - cam.x;
      const sy = act.y - cam.y;
      const num = act.name === "cactus_hat" ? "hat" : act.name.replace("cactus_", "");
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(sx, sy - 7, ctx.measureText(num).width + 2, 7);
      ctx.fillStyle = "#0f0";
      ctx.fillText(num, sx + 1, sy - 1);
    }

    // 穴trigger（黄：通常、オレンジ：helmetRequired）
    for (const hole of MAPS[current?.id]?.holes || []) {
      if (!hole.trigger) continue;
      const { x, y, w, h } = hole.trigger;
      const color = hole.helmetRequired ? "255,140,0" : "255,230,0";
      ctx.strokeStyle = `rgba(${color},0.9)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - cam.x, y - cam.y, w, h);
      ctx.fillStyle = `rgba(${color},0.25)`;
      ctx.fillRect(x - cam.x, y - cam.y, w, h);
      ctx.fillStyle = "#fff";
      ctx.fillText(`hole:${hole.id}`, x - cam.x, y - cam.y - 1);
    }

    // ベンチ・噴水トリガー（紫）
    if (current.id === "outdoor") {
      for (const [tr, label] of [[BENCH_TRIGGER, "bench"], [FOUNTAIN_TRIGGER, "fountain"]]) {
        ctx.strokeStyle = "rgba(200,80,255,0.9)";
        ctx.lineWidth = 1;
        ctx.strokeRect(tr.x - cam.x, tr.y - cam.y, tr.w, tr.h);
        ctx.fillStyle = "rgba(200,80,255,0.2)";
        ctx.fillRect(tr.x - cam.x, tr.y - cam.y, tr.w, tr.h);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, tr.x - cam.x, tr.y - cam.y - 1);
      }
      for (const [tr, label] of [[TIMEMACHINE_TALK_TRIGGER, "tm_talk"], [TIMEMACHINE_WAIT_TRIGGER_A, "tm_a"], [TIMEMACHINE_WAIT_TRIGGER_B, "tm_b"]]) {
        ctx.strokeStyle = "rgba(120,255,120,0.9)";
        ctx.lineWidth = 1;
        ctx.strokeRect(tr.x - cam.x, tr.y - cam.y, tr.w, tr.h);
        ctx.fillStyle = "rgba(120,255,120,0.2)";
        ctx.fillRect(tr.x - cam.x, tr.y - cam.y, tr.w, tr.h);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, tr.x - cam.x, tr.y - cam.y - 1);
      }
      {
        const tr = SHOVEL_DIG_TRIGGER;
        const dug = STATE.flags.treasureDug;
        const color = dug ? "120,120,120" : "220,160,60";
        ctx.strokeStyle = `rgba(${color},0.9)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(tr.x - cam.x, tr.y - cam.y, tr.w, tr.h);
        ctx.fillStyle = `rgba(${color},0.25)`;
        ctx.fillRect(tr.x - cam.x, tr.y - cam.y, tr.w, tr.h);
        ctx.fillStyle = "#fff";
        ctx.fillText(dug ? "dig(done)" : "dig", tr.x - cam.x, tr.y - cam.y - 1);
      }
    }

    // movieTrigger（マゼンタ）
    const _mt = MAPS[current?.id]?.movieTrigger;
    if (_mt) {
      ctx.strokeStyle = "rgba(255,0,255,0.9)";
      ctx.lineWidth = 1;
      ctx.strokeRect(_mt.x - cam.x, _mt.y - cam.y, _mt.w, _mt.h);
      ctx.fillStyle = "rgba(255,0,255,0.25)";
      ctx.fillRect(_mt.x - cam.x, _mt.y - cam.y, _mt.w, _mt.h);
      ctx.fillStyle = "#fff";
      ctx.fillText("movie", _mt.x - cam.x, _mt.y - cam.y - 1);
    }

    ctx.restore();
  }

  trip.applyFX(ctx, canvas, tt);
  goodTrip.applyFX(ctx, canvas, tt);

  // トリップダックのアルファをエフェクト強度に同期
  const tripDuck = actors.find(a => a.id === "trip_duck");
  if (tripDuck) tripDuck.alpha = trip.getIntensity() + goodTrip.getIntensity();
}

function updatePickupVanish(t) {
  const HOP_SPLIT = 0.4;
  const HOP_HEIGHT = 9;
  for (let i = actors.length - 1; i >= 0; i--) {
    const act = actors[i];
    if (!act.pickupVanishStart) continue;
    const dur = act.pickupVanishDur || 520;
    const p = Math.min(1, (t - act.pickupVanishStart) / dur);
    if (act.pickupVanishBaseY === undefined) act.pickupVanishBaseY = act.y;
    if (p < HOP_SPLIT) {
      const hp = p / HOP_SPLIT;
      act.y        = act.pickupVanishBaseY - Math.sin(hp * Math.PI) * HOP_HEIGHT;
      act.scale    = 1;
      act.rotation = 0;
      act.alpha    = 1;
    } else {
      const sp = (p - HOP_SPLIT) / (1 - HOP_SPLIT);
      act.y        = act.pickupVanishBaseY;
      act.scale    = 1 - sp;
      act.rotation = sp * Math.PI * 2;
      act.alpha    = 1 - sp;
    }
    if (p >= 1) actors.splice(i, 1);
  }
}

// ---- Update ----
function updateNpcAnim(t) {
  updatePickupVanish(t);
  const cullMargin = 32;
  const camLeft   = cam.x - cullMargin;
  const camRight  = cam.x + canvas.width + cullMargin;
  const camTop    = cam.y - cullMargin;
  const camBottom = cam.y + canvas.height + cullMargin;
  for (const act of actors) {
    if (act.patrol) {
      if (act.patrolHomeX === undefined) act.patrolHomeX = act.x;
      if (act.patrolDir === undefined) act.patrolDir = 1;
      const speed = act.patrol.speed ?? 0.25;
      const range = act.patrol.range ?? 20;
      act.x += act.patrolDir * speed;
      if (act.x >= act.patrolHomeX + range) { act.x = act.patrolHomeX + range; act.patrolDir = -1; }
      else if (act.x <= act.patrolHomeX - range) { act.x = act.patrolHomeX - range; act.patrolDir = 1; }
    }
    if (!act.alwaysAnim) {
      const sw = act.spr ?? SPR;
      const sh = act.sprH ?? act.spr ?? SPR;
      if (act.x + sw < camLeft || act.x > camRight || act.y + sh < camTop || act.y > camBottom) continue;
    }
    if (act.animMode === "seq") {
      const ms = act.animMs ?? NPC_FRAME_MS;
      if (t - (act.last | 0) > ms) {
        act.last = t;
        act.seqIdx = ((act.seqIdx ?? 0) + 1) % act.animSeq.length;
        act.frame = act.animSeq[act.seqIdx];
      }
      continue;
    }
    if (act.animMode === "crossfade") {
      const period = act.animMs ?? 1500;
      act.crossAlpha = (Math.sin(t / period * Math.PI * 2) + 1) / 2;
      continue;
    }
    const ms = act.animMs ?? NPC_FRAME_MS;
    if (t - (act.last | 0) > ms) {
      act.frame ^= 1;
      act.last = t;
    }
  }
}

function startLuchadolaEvent(act) {
  const pages = [
    ["おまえ！"],
    ["おまえーー！"],
    ["おーまーえーー！"],
    ["ジゴクを、自分のものにする気だな！"],
    ["ゆるせん！"],
    ["ここは、ここは、"],
    ["俺のジゴクだ！"],
  ];
  const returnPos = { x: act.x, y: act.y + 26 };
  dialog.open(pages, () => {
    startBattleTransition(() => {
      bgmCtl.setOverride("about:blank");
      setGameResolution(SHOOTING_W, SHOOTING_H);
      startShootingBgm();
      interactionSession.end();
      shooting.start((earnedEN, result) => {
        stopShootingBgm();
        bgmCtl.setOverride("about:blank");
        setGameResolution(BASE_W, BASE_H);
        STATE.money = Math.min(STATE.money + earnedEN, 999999);
        leader.x = returnPos.x;
        leader.y = returnPos.y;
        followers.reset({ leader, p2, p3, p4 });
        startShootingBgm();
        if (!result?.cleared) {
          shootingKnockback = {
            vx: 0,
            vy: -1.4,
            gravity: 0.32,
            until: nowMs() + 350,
          };
          shootingDoorCooldown = nowMs() + 800;
          return;
        }
        STATE.flags.luchadolaDefeated = true;
        input.lock();
        playBattleWinJingle();
        interactionSession.begin();
        letterbox.snapAuto(true);
        setTimeout(() => {
          input.unlock();
          dialog.open([["おぎゃーーーー！"]], () => {
            act.markImg = null;
            act.explodeStart = nowMs();
            setTimeout(() => {
              act.explodeStart = undefined;
              act.vanishUp = true;
              act.vanishStart = nowMs();
            }, 180);
            setTimeout(() => {
              act.hidden = true;
              act.solid = false;
              act.talkHit = { x: 0, y: 0, w: 0, h: 0 };
              act.vanishStart = undefined;
              act.vanishUp = undefined;
              const demonDoor = actors.find(x => x.name === "door_demon");
              if (demonDoor) demonDoor.hidden = false;
              achieveQuest("15");
              letterbox.reset();
              interactionSession.end();
            }, 620);
          }, "talk");
        }, 800);
      }, {
        autoEndOnClear: true,
        autoEndOnResult: true,
        difficulty: getShootingDifficultyId(),
        progressLevel: 7,
        supportDoors: [],
        bossOnly: true,
        bossSpriteKey: "lucha",
        bossName: "LUCHADORA",
      });
    });
  }, "talk");
}

function activateShootingLobbyDoor(act, t) {
  if (t < shootingDoorCooldown) return true;
  shootingDoorCooldown = t + 500;

  if (act.name === "door_0") {
    fade.startCutFade(t, {
      outMs: 150,
      holdMs: 80,
      inMs: 300,
      onBlack: () => loadMap("outdoor", { spawnAt: { x: gateNpc.x, y: gateNpc.y + 20 } }),
    });
    return true;
  }
  if (act.name === "door_demon") {
    fade.startCutFade(t, {
      outMs: 150,
      holdMs: 80,
      inMs: 300,
      onBlack: () => loadMap("dark_throne"),
    });
    return true;
  }

  const returnPos = { x: act.x, y: act.y + 26 };
  const clearedDoors = Array.from({ length: 7 }, (_, i) => `door_${i + 1}`)
    .filter((name) => !!STATE.flags[`shootingCleared_${name}`]);
  bgmCtl.setOverride("about:blank");
  setGameResolution(SHOOTING_W, SHOOTING_H);
  startShootingBgm();
  interactionSession.end();
  shooting.start((earnedEN, result) => {
    stopShootingBgm();
    bgmCtl.setOverride("about:blank");
    setGameResolution(BASE_W, BASE_H);
    STATE.money = Math.min(STATE.money + earnedEN, 999999);
    if (result?.cleared) {
      input.lock();
      playBattleWinJingle();
      STATE.flags[`shootingCleared_${act.name}`] = true;
      const unlockExitDoor = !STATE.flags.shootingLobbyExitUnlocked;
      if (unlockExitDoor) STATE.flags.shootingLobbyExitUnlocked = true;
      leader.x = returnPos.x;
      leader.y = returnPos.y;
      followers.reset({ leader, p2, p3, p4 });
      startShootingBgm();
      setTimeout(() => {
        act.markImg = null;
        act.explodeStart = nowMs();
        shootingDoorCooldown = nowMs() + 800;
      }, 1000);
      setTimeout(() => {
        act.explodeStart = undefined;
        act.vanishUp = true;
        act.vanishStart = nowMs();
      }, 1180);
      setTimeout(() => {
        act.hidden = true;
        act.solid = false;
        act.talkHit = { x: 0, y: 0, w: 0, h: 0 };
        act.vanishStart = undefined;
        act.vanishUp = undefined;
        if (unlockExitDoor) {
          const exitDoor = actors.find((a) => a.name === "door_0");
          if (exitDoor) {
            exitDoor.hidden = false;
            exitDoor.alpha = 0;
            exitDoor.scale = 0.7;
            exitDoor.revealStart = nowMs();
          }
        }
        input.unlock();
      }, 1620);
      return;
    }
    leader.x = returnPos.x;
    leader.y = returnPos.y;
    followers.reset({ leader, p2, p3, p4 });
    startShootingBgm();
    if (!result?.cleared) {
      shootingKnockback = {
        vx: 0,
        vy: -1.4,
        gravity: 0.32,
        until: nowMs() + 350,
      };
    }
    shootingDoorCooldown = nowMs() + 800;
  }, {
    autoEndOnClear: true,
    autoEndOnResult: true,
    difficulty: getShootingDifficultyId(),
    progressLevel: clearedDoors.length,
    supportDoors: [],
  });
  return true;
}

function updateShootingDoorMarkers(t) {
  if (current.id !== "shooting_lobby") {
    shootingDoorMarkLastMs = t;
    for (const act of actors) {
      if (act.name?.startsWith("door_")) act.markReveal = 0;
    }
    return;
  }
  const prev = shootingDoorMarkLastMs || t;
  shootingDoorMarkLastMs = t;
  const step = Math.max(0, Math.min(1, (t - prev) / 140));
  const touch = talkBoxLeader();
  const canShow = !!STATE.flags.shootingLobbyLuchaTalked;
  for (const act of actors) {
    if (!act.name?.startsWith("door_") || !act.markImg || act.name === "door_0") continue;
    const target = canShow && hitRect(touch, npcFootBox(act)) ? 1 : 0;
    const cur = act.markReveal ?? 0;
    act.markReveal = target > cur
      ? Math.min(target, cur + step)
      : Math.max(target, cur - step);
  }
}

let _letterboxTalkPending = false;

function startGateWarp(act) {
  if (gateWarpFx) return;
  input.lock();
  gateWarpFx = {
    startMs:       nowMs(),
    gx:            act.x + ((act.spr ?? SPR) >> 1),
    gy:            act.y + ((act.sprH ?? act.spr ?? SPR) >> 1),
    leaderStartX:  leader.x,
    leaderStartY:  leader.y,
    duration:      720,
    faded:         false,
  };
}

function checkGateWarpTriggers() {
  if (gateWarpFx) return;
  if (current.id !== "outdoor") return;
  if (autoWalk) return;
  const fb = footBox(leader.x, leader.y);
  for (const act of actors) {
    if (!act.shootingTrigger) continue;
    if (act.showWhenBgm && bgmCtl.getOverrideSrc() !== act.showWhenBgm) continue;
    const tb = talkRectActor(act);
    if (hitRect(fb, tb)) {
      startGateWarp(act);
      return;
    }
  }
}

function drawGateWarpFx() {
  if (!gateWarpFx) return;
  const elapsed = nowMs() - gateWarpFx.startMs;
  const p = Math.min(1, elapsed / gateWarpFx.duration);
  const cx = (gateWarpFx.gx - cam.x) | 0;
  const cy = (gateWarpFx.gy - cam.y) | 0;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // 外側ハロー
  const r1 = 6 + p * 36;
  const a1 = (1 - p) * 0.7;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r1);
  grad.addColorStop(0, `rgba(255,255,255,${a1})`);
  grad.addColorStop(0.4, `rgba(180,220,255,${a1 * 0.7})`);
  grad.addColorStop(1, "rgba(120,180,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r1, cy - r1, r1 * 2, r1 * 2);
  // 中心の白フラッシュ（ピーク後半）
  if (p > 0.55) {
    const fp = (p - 0.55) / 0.45;
    ctx.globalAlpha = fp * fp;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
  // スパークル
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + p * 6;
    const r = 8 + p * 18;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    ctx.globalAlpha = (1 - p) * 0.95;
    ctx.fillStyle = i % 2 === 0 ? "#fff" : "#aef";
    ctx.fillRect((px - 1) | 0, (py - 1) | 0, 2, 2);
  }
  ctx.restore();
}

function updateGateWarpFx(t) {
  if (!gateWarpFx) return false;
  if (gateWarpFx.faded) return false; // fade 進行中は通常フローに任せる
  const elapsed = t - gateWarpFx.startMs;
  const p = Math.min(1, elapsed / gateWarpFx.duration);
  const ep = p * p; // ease-in
  leader.x = gateWarpFx.leaderStartX + (gateWarpFx.gx - 8 - gateWarpFx.leaderStartX) * ep;
  leader.y = gateWarpFx.leaderStartY + (gateWarpFx.gy - 8 - gateWarpFx.leaderStartY) * ep;
  followers.reset({ leader, p2, p3, p4 });
  if (p >= 0.55) {
    gateWarpFx.faded = true;
    fade.startCutFade(nowMs(), {
      outMs:  220,
      holdMs: 80,
      inMs:   300,
      onBlack: () => {
        gateWarpFx = null;
        input.unlock();
        loadMap("shooting_lobby");
      },
    });
  }
  updateCam();
  return true;
}

function findInteractTarget() {
  const a = talkBoxLeader();
  for (let i = 0; i < actors.length; i++) {
    const act = actors[i];
    if (act.hidden) continue;
    if (current.id === "shooting_lobby" && act.name?.startsWith("door_") && (act.explodeStart || act.vanishStart)) continue;
    const b = (current.id === "shooting_lobby" && act.name?.startsWith("door_"))
      ? npcFootBox(act)
      : talkRectActor(act);
    if (!hitRect(a, b)) continue;
    if (act.kind === "npc" && act.showWhenBgm && bgmCtl.getOverrideSrc() !== act.showWhenBgm) continue;
    return act;
  }
  return null;
}

// ★ここを t を受け取る形にする
function tryInteract(t) {
  if (interactionSession.isActive()) return;
  if (dialog.isActive()) return;
  if (choice.isActive()) return;
  if (fade.isActive()) return;
  if (menu.isOpen()) return;
  if (battle.isActive()) return;
  const a = talkBoxLeader();

  for (let i = 0; i < actors.length; i++) {
    const act = actors[i];
    if (act.hidden) continue;
    if (current.id === "shooting_lobby" && act.name?.startsWith("door_") && (act.explodeStart || act.vanishStart)) continue;
    const b = (current.id === "shooting_lobby" && act.name?.startsWith("door_"))
      ? npcFootBox(act)
      : talkRectActor(act);
    if (!hitRect(a, b)) continue;

    if (act.kind === "npc") {
      if (current.id === "shooting_lobby" && act.name?.startsWith("door_")) {
        if (!STATE.flags.shootingLobbyLuchaTalked) return;
        interactionSession.begin();
        choice.open(["はい", "いいえ"], (idx) => {
          if (idx === 0) activateShootingLobbyDoor(act, nowMs());
        }, "このドアにはいる？", { instant: true });
        return;
      }
      if (
        STATE.flags.pizzaJobActive &&
        !STATE.flags.pizzaDelivered &&
        STATE.flags.pizzaTargetNpc === act.name &&
        PIZZA_TARGET_NAMES.includes(act.name) &&
        inventory.getSnapshot().includes(PIZZA_ITEM_ID)
      ) {
        inventory.removeItem(PIZZA_ITEM_ID);
        STATE.flags.pizzaDelivered = true;
        STATE.flags.pizzaDeliveredAtMs = nowMs();
        refreshPizzaJobMarkers();
        interactionSession.begin();
        dialog.open([["ピザを配達した！"]], null, "sign");
        return;
      }
      if (act.showWhenBgm && bgmCtl.getOverrideSrc() !== act.showWhenBgm) continue;
      interactionSession.begin();
      dialog.setVoice(act.voice || "default");
      const handled = interactionSession.trackSync(() => runNpcEvent(act, {
        nowMs, // ★重要：rAFのtを渡す（freeze防止）
        choice,
        shop,
        dialog,
        fade,
        inventory,
        sprites: SPRITES,
        party: { leader, p2, p3, p4 },
        lockInput: () => input.lock(),
        unlockInput: () => input.unlock(),
        stopBgm:      () => bgmCtl.setOverride("about:blank"),
        startAfloClubBlackout: () => startAfloClubBlackout(t),
        startTrip: () => {
          interactionSession.end();
          STATE.flags.tripCount = (STATE.flags.tripCount | 0) + 1;
          if (STATE.flags.tripCount >= 10) achieveQuest("09");
          trip.start(() => {
            STATE.flags.uraYahhyCooking = false;
            actors = actors.filter(a => a.id !== "trip_duck");
          });
          bgmCtl.setOverride(null);
          if (!MOBILE) bgmCtl.startTripPitch();
          if (!STATE.flags.duckGCollected) {
            actors.push({ kind: "pickup", id: "trip_duck", itemId: "rubber_duck_G_bad", img: SPRITES.duck, x: 168, y: 140, spr: 16, frame: 0, last: 0, alpha: 0 });
          }
        },
        startGoodTrip: () => {
          interactionSession.end();
          STATE.flags.tripCount = (STATE.flags.tripCount | 0) + 1;
          if (STATE.flags.tripCount >= 10) achieveQuest("09");
          goodTrip.start(() => {
            STATE.flags.uraYahhyCooking = false;
            actors = actors.filter(a => a.id !== "trip_duck");
          });
          bgmCtl.setOverride(null);
          if (!MOBILE) bgmCtl.startGoodTripPitch();
          if (!STATE.flags.duckGCollected) {
            actors.push({ kind: "pickup", id: "trip_duck", itemId: "rubber_duck_G", img: SPRITES.duck, x: 86, y: 127, spr: 16, frame: 0, last: 0, alpha: 0 });
          }
        },
        isTripActive:     () => trip.isActive() || goodTrip.isActive(),
        getNpcByName:     (name) => actors.find(a => a.kind === "npc" && a.name === name),
        getPlayerPos:     () => ({ x: leader.x, y: leader.y }),
        teleportPlayer:   (x, y) => {
          leader.x = x;
          leader.y = y;
          followers.reset({ leader, p2, p3, p4 });
        },
        spawnPickup,
        triggerWhiteFlash: (durMs = 600) => {
          _whiteFlash = { startMs: nowMs(), duration: durMs };
        },
        triggerRedScreen: () => {
          redScreenStart = (typeof performance !== "undefined" ? performance.now() : Date.now());
          letterbox.disableSepia();
          redScreenOnEnd = () => {
            redScreenStart = -1;
            fade.startCutFade(nowMs(), {
              outMs: 1, holdMs: 0, inMs: 700,
              onBlack: () => {
                letterbox.reset();
                stopJaws();
                loadMap("seahole");
                bgmCtl.audio.volume = 0;
                bgmCtl.setOverride(null);
                const rampStart = performance.now();
                const TARGET_VOL = bgmCtl.getVolumeForSrc(bgmCtl.getCurrentSrc() || bgmCtl.getMapSrc());
                const id = setInterval(() => {
                  const p = Math.min((performance.now() - rampStart) / 700, 1);
                  bgmCtl.audio.volume = TARGET_VOL * p;
                  if (p >= 1) clearInterval(id);
                }, 16);
              },
            });
          };
        },
        lockInput:          () => input.lock(),
        unlockInput:        () => input.unlock(),
        showExclamations:   () => {
          const now = performance.now();
          for (const m of [leader, p2, p3, p4]) {
            exclamations.push({
              sx: ((m.x + 8) - cam.x) | 0,
              sy: (m.y - cam.y) | 0,
              startMs: now,
              duration: 1200,
              char: "!",
              color: "#e00",
            });
          }
        },
        letterbox,
        jumprope,
        toast,
        achieveQuest,
        checkQuest01,
        getBgmSrc: () => bgmCtl.getOverrideSrc(),
        hasItem: (id) => inventory.getSnapshot().includes(id),
        startTimemachineFx,
        startPizzaJob: () => {
          const target = PIZZA_TARGET_NAMES[(Math.random() * PIZZA_TARGET_NAMES.length) | 0];
          STATE.flags.pizzaJobActive = true;
          STATE.flags.pizzaTargetNpc = target;
          STATE.flags.pizzaDelivered = false;
          STATE.flags.pizzaStartMs = nowMs();
          STATE.flags.pizzaLastReward = 0;
          inventory.addItem(PIZZA_ITEM_ID);
          refreshPizzaJobMarkers();
          return target;
        },
        settlePizzaJob: () => {
          const reward = getPizzaReward(nowMs() - (STATE.flags.pizzaStartMs | 0));
          STATE.money += reward;
          STATE.flags.pizzaLastReward = reward;
          STATE.flags.pizzaSuccessCount = (STATE.flags.pizzaSuccessCount | 0) + 1;
          delete STATE.flags.pizzaJobActive;
          delete STATE.flags.pizzaTargetNpc;
          delete STATE.flags.pizzaDelivered;
          delete STATE.flags.pizzaStartMs;
          delete STATE.flags.pizzaDeliveredAtMs;
          delete STATE.flags.pizzaAte;
          refreshPizzaJobMarkers();
          return reward;
        },
        cancelPizzaJob: () => {
          delete STATE.flags.pizzaJobActive;
          delete STATE.flags.pizzaTargetNpc;
          delete STATE.flags.pizzaDelivered;
          delete STATE.flags.pizzaStartMs;
          delete STATE.flags.pizzaDeliveredAtMs;
          delete STATE.flags.pizzaAte;
          refreshPizzaJobMarkers();
        },
        startSpaceWarp,
        startKakoMovie: () => {
          kakoMovieScene = { active: true, startMs: nowMs(), exitWaitStartMs: 0, phase: "intro", messageShown: false, _lastStep: -1, _lastBird: -1, _lastWing: -1 };
          pushBgmOverride("about:blank", { safe: false });
          startWaterfall();
        },
        startDiving: (onDone) => {
          startDivingMinigame(onDone);
        },
        startShake: (ms = 500, intensity = 3) => {
          _shakeUntil = performance.now() + ms;
          _shakeIntensity = intensity;
        },
        beginInteraction: () => interactionSession.begin(),
        endInteraction: () => interactionSession.end(),
        startPhoneBrawl,
      }));
      if (handled) return;

      if (act.shootingTrigger) {
        if (!shooting.isActive()) {
          fade.startCutFade(nowMs(), {
            outMs: 150,
            holdMs: 80,
            inMs: 300,
            onBlack: () => loadMap("shooting_lobby"),
          });
        }
        return;
      }

      if (act.battleTrigger) {
        pendingBattlePages = {
          win:        act.battleWinPages  || null,
          lose:       act.battleLosePages || null,
          winEnding:  !!act.battleWinEnding,
        };
        const doBattle = () => {
          startBattleTransition(() => {
            setGameResolution(BATTLE_W, BATTLE_H);
            bgmCtl.unlock();
            pushBgmOverride("about:blank", { safe: false }); // フィールドBGMを停止
            startHeartbeat(68, BGM_VOLUME);
            interactionSession.end();
            battle.start(input);
          });
        };
        const doWin = (pages) => {
          const winPages = pages || act.battleWinPages || null;
          const isEnding = !!act.battleWinEnding;
          const triggerEnd = () => {
            interactionSession.end();
            letterbox.reset();
            bgmCtl.setOverride("about:blank");
            fade.startIrisFade(nowMs(), {
              outMs: 800, holdMs: 500, inMs: 300,
              cx: (leader.x - cam.x + SPR / 2) | 0,
              cy: (leader.y - cam.y + SPR / 2) | 0,
              onBlack: () => { setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H); partyVisible = false; loadMap("vj_room02", { isEnding: true }); },
              onEnd:   () => { pendingEndingFadeIn = true; },
            });
          };
          if (winPages && winPages.length) {
            input.lock();
            setTimeout(() => {
              input.unlock();
              interactionSession.begin();
              dialog.open(winPages, isEnding ? triggerEnd : null, "talk");
            }, 1000);
          } else if (isEnding) {
            input.lock();
            setTimeout(() => { input.unlock(); triggerEnd(); }, 1000);
          }
        };
        if (act.battleConfirm) {
          choice.open(["はい", "いいえ"], (idx) => {
            if (typeof choice.close === "function") choice.close();
            if (idx === 0) {
              dialog.open([[act.battleConfirmPrompt ?? "……"]], () => {
                doBattle();
              }, act.talkType ?? "talk");
            } else {
              if (STATE.money >= 100000) {
                choice.open(["はい", "いいえ"], (idx2) => {
                  if (typeof choice.close === "function") choice.close();
                  if (idx2 === 0) {
                    doWin(act.battlePayPages || null);
                  } else {
                    dialog.open([["なんなんだまったく。"]]);
                  }
                }, "ハァ？じぶんたちで用意した？");
              } else {
                dialog.open([["なんなんだまったく。"]]);
              }
            }
          }, act.battleConfirmQuestion ?? "……");
        } else {
          dialog.open(act.talkPages || [["……"]], () => {
            doBattle();
          }, act.talkType ?? "talk");
        }
      } else {
        if (act.name === "lucha_shooting") {
          const allHellDoorsCleared = Array.from({ length: 7 }, (_, i) =>
            STATE.flags[`shootingCleared_door_${i + 1}`]
          ).every(Boolean);
          if (allHellDoorsCleared && !STATE.flags.luchadolaDefeated) {
            startLuchadolaEvent(act);
            return;
          }
          const firstTalk = !STATE.flags.shootingLobbyLuchaTalked;
          const pages = firstTalk
            ? (act.talkPages || [["……"]])
            : [["ジゴクの罰の重さは自分で選ぶもんだぜ！"]];
          const onClose = firstTalk
            ? () => {
                STATE.flags.shootingLobbyLuchaTalked = true;
                if (!STATE.flags.shootingDifficulty) STATE.flags.shootingDifficulty = "normal";
                achieveQuest("12");
                input.lock();
                setTimeout(() => input.unlock(), 1000);
              }
            : () => {
                if (!STATE.flags.shootingDifficulty) STATE.flags.shootingDifficulty = "normal";
                openShootingDifficultyUi();
              };
          dialog.open(pages, onClose, act.talkType ?? "talk");
        } else {
          dialog.open(act.talkPages || [["……"]], null, act.talkType ?? "talk");
        }
      }
      return;
    }

    if (act.kind === "pickup") {
      const id = act.itemId;
      if (!id) return;
      interactionSession.begin();

      collectedItems.add(id);
      inventory.addItem(id);
      if (id === "rubber_duck_G" || id === "rubber_duck_G_bad") {
        STATE.flags.duckGCollected = true;
      }
      if (id === "rubber_duck_B") STATE.flags.duckBCollected = true;
      if (id === "rubber_duck_I") STATE.flags.duckICollected = true;
      if (id === "rubber_duck_F") STATE.flags.duckFCollected = true;

      act.pickupVanishStart = nowMs();
      act.pickupVanishDur   = 520;
      act.solid             = false;
      act.talkHit           = { x: 0, y: 0, w: 0, h: 0 };
      act.scale             = 1;
      act.rotation          = 0;
      act.alpha             = 1;
      act.pivotMode         = "center";

      // クエスト01: ラバーダック取得時だけ判定
      if (String(id).startsWith("rubber_duck_")) checkQuest01();

      playItemJingle();
      const name = itemName(id);
      if (id === "moon_stone") dialog.open([["つきのいしをてにいれた！"]], null, "sign");
      else dialog.open([[`${name} をてにいれた。`]], null, "sign");
      return;
    }
  }
}

function update(t) {
  // ロード画面
  if (loading.isActive()) {
    loading.update();
    return;
  }

  // タイトル画面
  if (title.isActive()) {
    title.update();
    return;
  }

  // キャラクターセレクト
  if (charSelect.isActive()) {
    charSelect.update();
    return;
  }

  if (updateContinueReveal(t)) {
    updateCam();
    return;
  }

  letterbox.setAuto(!ending.isActive() && current.id !== "space_boss" && (interactionSession.isActive() || _letterboxTalkPending));

  if (updateGateWarpFx(t)) return;

  if (mechaEvolution.active) {
    if (mechaEvolution.phase === "queued") {
      if (fade.isActive()) {
        fade.update(t, () => mapReady);
      } else {
        mechaEvolution.phase = "message";
        dialog.open([["おや？ナツミのようすが"]], () => {
          mechaEvolution.phase = "evolving";
          mechaEvolution.startMs = nowMs();
        }, "sign");
      }
      updateCam();
      return;
    }
    if (dialog.isActive()) {
      dialog.update();
      updateCam();
      return;
    }
    if (mechaEvolution.phase === "evolving") {
      if (t - mechaEvolution.startMs >= 2200) {
        STATE.flags.mechaNatsumi = true;
        setupParty(STATE.leaderIdx | 0);
        playBattleWinJingle();
        mechaEvolution.phase = "result";
        mechaEvolution.startMs = t;
      }
      updateCam();
      return;
    }
    if (mechaEvolution.phase === "result") {
      if (t - mechaEvolution.startMs >= 500) {
        dialog.open([["ナツミはメカナツミに進化した！"]], () => {
          mechaEvolution.phase = "done";
          mechaEvolution.startMs = nowMs();
        }, "sign");
      }
      updateCam();
      return;
    }
    if (mechaEvolution.phase === "done") {
      if (t - mechaEvolution.startMs >= 150) {
        if (current.id === "shooting_lobby") startShootingBgm();
        else if (current.id === "afloclub") startAfloClubBgm();
        else bgmCtl.setOverride(null);
        input.lock();
        mechaEvolution.active = false;
        interactionSession.trackSync(() => {
          setTimeout(() => {
            achieveQuest("23");
            input.unlock();
          }, 300);
        });
      }
      updateCam();
      return;
    }
  }

  if (pageTurnFx.active) {
    const revealMs = 420;
    if (!pageTurnFx.switched) {
      if (mapReady) {
        pageTurnFx.switched = true;
        pageTurnFx.switchedAt = t;
      }
    } else if (mapReady && t - pageTurnFx.switchedAt >= revealMs) {
      pageTurnFx = {
        active: false,
        start: 0,
        switched: false,
        switchedAt: 0,
        destMap: null,
        spawnAt: null,
        dir: "rtl",
      };
      input.unlock();
    }
    updateCam();
    return;
  }

  if (timeMachineTravelFx.active) {
    if (!timeMachineTravelFx.switched) {
      if (t - timeMachineTravelFx.start >= TM_FADE_OUT_MS) {
        loadMap(timeMachineTravelFx.destMap, { spawnAt: timeMachineTravelFx.spawnAt });
        timeMachineTravelFx.switched = true;
        timeMachineTravelFx.switchedAt = t;
      }
    } else if (mapReady && t - timeMachineTravelFx.switchedAt >= TM_FADE_IN_MS) {
      timeMachineTravelFx = {
        active: false,
        start: 0,
        switched: false,
        switchedAt: 0,
        destMap: null,
        spawnAt: null,
        dir: "rtl",
      };
      input.unlock();
    }
    updateCam();
    return;
  }

  if (updatePrologue()) return;

  // fade 最優先
  if (fade.isActive()) {
    fade.update(t, () => mapReady);
    updateCam();
    return;
  }

  // フェードイン完了 → エンディング開始
  if (pendingEndingFadeIn) {
    pendingEndingFadeIn = false;
    interactionSession.end();
    letterbox.reset();
    bgmCtl.setOverride("assets/audio/bgm_end.mp3");
    bgmCtl.audio.loop = false;
    ending.start(t);
  }

  // ending 中は入力ブロック
  if (ending.isActive()) {
    const endingReturnPressed = () => (
      input.consume("z") ||
      input.consume("x") ||
      input.consume("c") ||
      input.consume("d") ||
      input.consume("s") ||
      input.consume("l") ||
      input.consume("v") ||
      input.consume("b") ||
      input.consume("m") ||
      input.consume("p") ||
      input.consume("1") ||
      input.consume("2") ||
      input.consume("Enter") ||
      input.consume(" ") ||
      input.consume("ArrowUp") ||
      input.consume("ArrowDown") ||
      input.consume("ArrowLeft") ||
      input.consume("ArrowRight")
    );
    ending.update(t);
    updateNpcAnim(t);
    updateCam();

    // フェードアウト完了後、press any button でタイトルに戻る
    if (ending.isDone() && endingReturnPressed()) {
      ending.stop();
      stopSeasideBgm();
      bgmCtl.audio.loop = true;
      bgmCtl.setOverride(null);
      partyVisible = true;
      spaceBossOutdoorEpilogue = null;
      resetProgress();
      inventory.resetItems(START_INVENTORY_NORMAL);
      loadMap("outdoor");
      setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
      title.start({
        onNewGame()  { startNewGameFlow(); },
        onContinue() { setGameResolution(BASE_W, BASE_H); if (hasSaveData()) loadGame(); else startNewGameFlow(); },
      });
      return;
    }

    // Debug: D キーでフィールドに即戻る
    if (DEBUG && input.consume("d")) {
      ending.stop();
      stopSeasideBgm();
      bgmCtl.audio.loop = true;
      bgmCtl.setOverride(null);
      partyVisible = true;
      spaceBossOutdoorEpilogue = null;
      setGameResolution(BASE_W, BASE_H);
      loadMap("outdoor");
      return;
    }
    return;
  }

  // エンカウント遷移中
  if (battleTransition) {
    const elapsed = nowMs() - battleTransition.startMs;
    if (elapsed >= battleTransition.duration) {
      const onDone = battleTransition.onDone;
      battleTransition = null;
      onDone();
    }
    return;
  }

  // battle
  if (battle.isActive()) {
    if (input.consume("z")) battle.confirm(input);
    if (input.consume("x")) battle.cancel(input);
    battle.update(input, t);
    return;
  }

  // shooting
  if (shooting.isActive()) {
    shooting.update();
    return;
  }

  // diving
  if (diving.isActive()) {
    diving.update();
    return;
  }

  // phone brawl
  if (phoneBrawl.isActive()) {
    phoneBrawl.update(1 / 60);
    return;
  }

  if (spaceBossWhiteReunion && !dialog.isActive()) {
    updateCam();
    return;
  }

  if (spaceBossMoonScene) {
    updateSpaceBossMoonScene(t);
    updateCam();
    return;
  }

  if (spaceBossOutdoorEpilogue) {
    updateSpaceBossOutdoorEpilogue(t);
    updateNpcAnim(t);
    updateCam();
    return;
  }

  if (sbBossType) {
    updateSpaceBossBossSpeech(t);
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
    updateCam();
    return;
  }

  if (sbCactusIntro && !sbCactusIntro.done) {
    updateSpaceBossCactusIntro(t);
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    updateCam();
    return;
  }

  // jumprope
  if (jumprope.isActive()) {
    jumprope.update();
    return;
  }

  if (shootingDifficultyUi.active) {
    updateShootingDifficultyUi();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
    updateCam();
    return;
  }

  if (timeMachineFx.active) {
    if (t >= timeMachineFx.until) {
      const cb = timeMachineFx.onDone;
      timeMachineFx = { active: false, start: 0, until: 0, onDone: null };
      input.unlock();
      if (cb) interactionSession.trackSync(() => cb());
    }
    updateCam();
    return;
  }

  // shop
  if (shop.isActive()) {
    shop.update();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    return;
  }

  // choice
  if (choice.isActive()) {
    choice.update();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    updateNpcAnim(t);
    updateCam();
    return;
  }

  // dialog
  if (dialog.isActive()) {
    dialog.update();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    updateNpcAnim(t);
    updateCam();
    return;
  }

  if (interactionSession.blockFieldInput()) {
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    updateNpcAnim(t);
    updateCam();
    return;
  }

  if (current.id === "theater") {
    input.consume("x");
    input.consume("s");
    input.consume("l");
    input.consume("v");
    input.consume("b");
    input.consume("d");
    input.consume("ArrowUp");
    input.consume("ArrowDown");
    input.consume("ArrowLeft");
    input.consume("ArrowRight");
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
    if (theaterScene.phase === "intro" && !theaterScene.messageShown && t - theaterScene.startMs >= 5000) {
      theaterScene.messageShown = true;
      dialog.open([
        ["白黒の映画だ。"],
        ["女が砂糖をたべる映像が30分くらい続いている。"],
      ], () => {
        theaterScene.phase = "await_exit";
        theaterScene.exitWaitStartMs = nowMs();
      }, "sign");
      updateCam();
      return;
    }
    if (theaterScene.phase === "await_exit" && t - theaterScene.exitWaitStartMs >= 5000 && input.consume("z")) {
      fade.startMapFade("outdoor", { doorId: 34 }, t, loadMap);
    }
    updateCam();
    return;
  }

  // kako dino movie
  if (kakoMovieScene.active) {
    input.consume("x");
    input.consume("ArrowUp"); input.consume("ArrowDown");
    input.consume("ArrowLeft"); input.consume("ArrowRight");
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    const _dinoElapsed = t - kakoMovieScene.startMs;
    const _dinoTotalMs = DINO_APPEAR_MS + ((BASE_W + 200) / STEP_PX) * DINO_STEP_INTERVAL + DINO_LINGER_MS;
    if (kakoMovieScene.phase === "intro" && _dinoElapsed >= _dinoTotalMs) {
      kakoMovieScene.phase = "await_exit";
      kakoMovieScene.active = false;
      stopWaterfall();
      popBgmOverride({ safe: false });
      input.lock();
      _letterboxTalkPending = true;
      letterbox.snapAuto(true);
      setTimeout(() => {
        input.unlock();
        dialog.open([
          ["すごいものをみてしまった。"],
        ], () => {
          _letterboxTalkPending = false;
          achieveQuest("22");
        }, "sign");
      }, 2000);
    }
    updateCam();
    return;
  }

  // menu
  if (menu.isOpen()) {
    menu.update();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
    updateCam();
    return;
  }

  // field
  if (current.id === "afloclub" && afloBlackout.active) {
    updateAfloClubBlackout(t);
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
    updateCam();
    return;
  }

  updateShootingDoorMarkers(t);

  if (input.consume("x")) menu.toggle();
  if (input.consume("z")) {
    if (_letterboxTalkPending) {
      // 帯のスライドイン待ち中：何もしない
    } else {
      const noUiBlocking =
        !interactionSession.isActive() &&
        !dialog.isActive() && !choice.isActive() &&
        !fade.isActive() && !menu.isOpen() && !battle.isActive();
      const target = noUiBlocking ? findInteractTarget() : null;
      const skipPreroll = target?.event?.type === "careful_letterbox";
      const wantPreroll = current.id !== "space_boss" && target && (target.kind === "npc" || target.kind === "pickup") && !skipPreroll;
      if (wantPreroll) {
        _letterboxTalkPending = true;
        input.lock();
        letterbox.setAuto(true);
        letterbox.onAutoShown(() => {
          setTimeout(() => {
            _letterboxTalkPending = false;
            input.unlock();
            tryInteract(nowMs());
          }, 180);
        });
      } else {
        tryInteract(t);
      }
    }
  }

  // セーブ / ロード
  if (input.consume("s")) { saveGame(); return; }
  if (input.consume("l")) { loadGame(); return; }
  if (input.consume("v")) { setBgmOverrideSafe(null); setBgmMapSafe("assets/audio/bgm0.mp3"); return; }
  if (DEBUG && input.consume("d")) {
    startDivingMinigame();
    return;
  }
  if (DEBUG && input.consume("p")) {
    startPhoneBrawl();
    return;
  }
  if (DEBUG && input.consume("1") && !pageTurnFx.active && !timeMachineTravelFx.active) {
    startTimeMachineTravel("kako", undefined, "ltr");
    return;
  }
  if (DEBUG && input.consume("2") && !pageTurnFx.active && !timeMachineTravelFx.active) {
    startTimeMachineTravel("mirai", undefined, "rtl");
    return;
  }
  if (DEBUG && input.consume("m")) {
    const inv = inventory.getSnapshot();
    if (inv.includes("moon_stone")) inventory.removeItem("moon_stone");
    else inventory.addItem("moon_stone");
    return;
  }

  if (shootingKnockback && current.id === "shooting_lobby") {
    const nx = leader.x + shootingKnockback.vx;
    const ny = leader.y + shootingKnockback.vy;
    leader.x = Math.max(0, Math.min(current.bgW - SPR, nx));
    leader.y = Math.max(0, Math.min(current.bgH - SPR, ny));
    followers.reset({ leader, p2, p3, p4 });
    leader.frame = 1;
    shootingKnockback.vx *= 0.88;
    shootingKnockback.vy += shootingKnockback.gravity ?? 0.12;
    if (t >= shootingKnockback.until) {
      shootingKnockback = null;
      leader.frame = 0;
    }
    updateCam();
    return;
  }

  // ---- クエスト29・30: 噴水/ベンチ付近で静止 ----
  if (current.id === "outdoor" || current.id === "mirai" || current.id === "kako") {
    const f  = footBox(leader.x, leader.y);
    const fx = (f.x + (f.w >> 1)) | 0;
    const fy = (f.y + (f.h >> 1)) | 0;
    const now_ms = performance.now();

    const inBench = fx >= BENCH_TRIGGER.x && fx < BENCH_TRIGGER.x + BENCH_TRIGGER.w &&
                    fy >= BENCH_TRIGGER.y && fy < BENCH_TRIGGER.y + BENCH_TRIGGER.h;
    if (inBench) {
      if (benchEnterMs === 0) benchEnterMs = now_ms;
      else if (now_ms - benchEnterMs >= 10000) achieveQuest("30");
    } else {
      benchEnterMs = 0;
    }

    const inFountain = fx >= FOUNTAIN_TRIGGER.x && fx < FOUNTAIN_TRIGGER.x + FOUNTAIN_TRIGGER.w &&
                       fy >= FOUNTAIN_TRIGGER.y && fy < FOUNTAIN_TRIGGER.y + FOUNTAIN_TRIGGER.h;
    if (inFountain) {
      if (fountainEnterMs === 0) fountainEnterMs = now_ms;
      else if (now_ms - fountainEnterMs >= 30000) achieveQuest("29");
    } else {
      fountainEnterMs = 0;
    }

    const inTimeA = fx >= TIMEMACHINE_WAIT_TRIGGER_A.x && fx < TIMEMACHINE_WAIT_TRIGGER_A.x + TIMEMACHINE_WAIT_TRIGGER_A.w &&
                    fy >= TIMEMACHINE_WAIT_TRIGGER_A.y && fy < TIMEMACHINE_WAIT_TRIGGER_A.y + TIMEMACHINE_WAIT_TRIGGER_A.h;
    const inTimeB = fx >= TIMEMACHINE_WAIT_TRIGGER_B.x && fx < TIMEMACHINE_WAIT_TRIGGER_B.x + TIMEMACHINE_WAIT_TRIGGER_B.w &&
                    fy >= TIMEMACHINE_WAIT_TRIGGER_B.y && fy < TIMEMACHINE_WAIT_TRIGGER_B.y + TIMEMACHINE_WAIT_TRIGGER_B.h;
    if (inTimeA) {
      if (timeMachineEnterMsA === 0) timeMachineEnterMsA = now_ms;
      else if (STATE.flags.timeMachineStarted && now_ms - timeMachineEnterMsA >= 20000 && !pageTurnFx.active && !timeMachineTravelFx.active) {
        const spawnAt = { x: leader.x, y: leader.y };
        const destMap = current.id === "outdoor" ? "mirai" : "outdoor";
        timeMachineEnterMsA = 0;
        startTimeMachineTravel(destMap, spawnAt, "rtl");
        updateCam();
        return;
      }
    } else {
      timeMachineEnterMsA = 0;
    }
    if (inTimeB) {
      if (timeMachineEnterMsB === 0) timeMachineEnterMsB = now_ms;
      else if (STATE.flags.timeMachineStarted && now_ms - timeMachineEnterMsB >= 20000 && !pageTurnFx.active && !timeMachineTravelFx.active) {
        const spawnAt = { x: leader.x, y: leader.y };
        const destMap = current.id === "outdoor" ? "kako" : "outdoor";
        timeMachineEnterMsB = 0;
        startTimeMachineTravel(destMap, spawnAt, "ltr");
        updateCam();
        return;
      }
    } else {
      timeMachineEnterMsB = 0;
    }
  }



  // クエスト13: 100000EN 貯める
  if (STATE.money >= 100000) achieveQuest("13");

  if (current.id === "space" && !spaceO2Depleted) {
    const last = spaceO2LastMs || t;
    const capacity = getSpaceO2Capacity();
    if (spaceO2 > capacity) spaceO2 = capacity;
    spaceO2 = Math.max(0, spaceO2 - (t - last) * getSpaceO2DrainRate());
    spaceO2LastMs = t;
    if (spaceO2 <= 0) {
      spaceO2Depleted = true;
      input.lock();
      fade.startCutFade(nowMs(), {
        outMs: 450,
        holdMs: 2000,
        inMs: 500,
        onBlack: () => {
          loadMap("moritasaki_room");
        },
        onEnd: () => {
          setTimeout(() => {
            input.unlock();
            dialog.open([["ひどいめにあった。"]], null, "sign");
          }, 2000);
        },
      });
      updateCam();
      return;
    }
  }

  if (!mapReady) {
    updateCam();
    return;
  }

  // ---- Hole transition update ----
  if (holeTransition) {
    const ht = holeTransition;
    const elapsed = t - ht.phaseStart;

    if (ht.phase === 'falling') {
      const prog = Math.min(1, elapsed / HOLE_FALL_MS);
      const tx = ht.holeCx - 8;
      const ty = ht.holeCy - 13;
      // ぴょん：sin アークで上に跳ねながら穴の位置へ移動、スケールは変えない
      playerHoleScale = 1;
      playerHoleDrawX = ht.fallStartX + (tx - ht.fallStartX) * prog;
      playerHoleDrawY = ht.fallStartY + (ty - ht.fallStartY) * prog
                        - Math.sin(prog * Math.PI) * 14;
      // 頂点（prog≈0.5）でフェード開始（destMap 時のみ、一度だけ）
      if (ht.destMap && !ht.fadeFired && prog >= 0.85) {
        holeTransition = { ...ht, fadeFired: true };
        fade.startCutFade(t, { outMs: 300, holdMs: 150, inMs: 500, onBlack: () => loadMap(ht.destMap) });
      }
      updateCam();
      if (prog >= 1) {
        playerHoleScale = 0;
        playerHoleDrawX = null;
        playerHoleDrawY = null;
        if (ht.destMap) {
          holeTransition = null;
          playerHoleScale = 1;
        } else {
          holeTransition = { ...ht, phase: 'rolling', phaseStart: t };
          playHoleRoll(HOLE_ROLL_MS);
        }
      }
      return;
    }

    if (ht.phase === 'rolling') {
      playerHoleScale = 0;
      // カメラをウェイポイント群に沿って飛ばす
      const prog = Math.min(1, elapsed / HOLE_ROLL_MS);
      const path = [
        { x: ht.startCamX + BASE_W / 2, y: ht.startCamY + BASE_H / 2 },
        ...ht.waypoints,
      ];
      const segCount = path.length - 1;
      const globalT   = prog * segCount;
      const segIdx    = Math.min(segCount - 1, Math.floor(globalT));
      const segT      = globalT - segIdx;
      const ease      = segT * segT * (3 - 2 * segT); // smoothstep
      const from = path[segIdx];
      const to   = path[segIdx + 1];
      const cx = from.x + (to.x - from.x) * ease;
      const cy = from.y + (to.y - from.y) * ease;
      const mw = current.bgW, mh = current.bgH;
      cam.x = Math.max(0, Math.min(mw - BASE_W, cx - BASE_W / 2)) | 0;
      cam.y = Math.max(0, Math.min(mh - BASE_H, cy - BASE_H / 2)) | 0;
      if (prog >= 1) {
        leader.x = ht.dest.exitAt.x;
        leader.y = ht.dest.exitAt.y;
        followers.reset({ leader, p2, p3, p4 });
        const dtr = ht.dest.trigger;
        holeTransition = {
          ...ht, phase: 'emerging', phaseStart: t,
          destHoleCx: dtr.x + dtr.w / 2,
          destHoleCy: dtr.y + dtr.h / 2,
        };
      }
      return;
    }

    if (ht.phase === 'emerging') {
      const prog = Math.min(1, elapsed / HOLE_EMERGE_MS);
      // ぽいん：穴の中心からぽんと跳ねて exitAt に着地（落下の逆）
      playerHoleScale = 1;
      const sx = ht.destHoleCx - 8;
      const sy = ht.destHoleCy - 13;
      const tx = ht.dest.exitAt.x;
      const ty = ht.dest.exitAt.y;
      playerHoleDrawX = sx + (tx - sx) * prog;
      playerHoleDrawY = sy + (ty - sy) * prog - Math.sin(prog * Math.PI) * 14;
      updateCam();
      if (prog >= 1) {
        playerHoleScale = 1;
        playerHoleDrawX = null;
        playerHoleDrawY = null;
        holeCooldown = t + 1000;
        holeTransition = null;
      }
      return;
    }
  }

  if (orcaRide.active) {
    updateNpcAnim(t);
    const RIDE_SPD = 3;
    leader.x -= RIDE_SPD;
    const orca = actors.find(a => a.kind === "npc" && a.name === "orca3");
    if (orca) orca.x -= RIDE_SPD;
    updateCam();

    if (leader.x < 1000 && !orcaRide.ending) {
      orcaRide.ending = true;
      fade.startCutFade(nowMs(), {
        outMs: 500, holdMs: 9999999, inMs: 0,
        onBlack: () => {
          orcaRide = { active: false, startMs: 0, durationMs: 15000, ending: false };
          loadMap("outdoor", {
            spawnAt: { x: 2220, y: 2579 },
            skipBgm: true,
            onReady: () => {
              followers.reset({ leader, p2, p3, p4 });
              partyVisible = true;
              updateCam();
              playWave();
              setTimeout(() => {
                fade.startCutFade(nowMs(), { outMs: 0, holdMs: 0, inMs: 700, onEnd: () => input.unlock() });
              }, 2000);
            },
          });
        },
      });
    }
    return;
  }

  if (autoWalk && autoWalk.frames > 0) {
    const nx = leader.x + autoWalk.dx;
    const ny = leader.y + autoWalk.dy;
    if (!hitBg(nx, ny) && !hitNpc(nx, ny)) {
      leader.x = nx; leader.y = ny;
      followers.push(leader.x, leader.y);
      if (t - leader.last > FRAME_MS) { leader.frame ^= 1; leader.last = t; }
    }
    autoWalk.frames--;
    if (autoWalk.frames <= 0) autoWalk = null;
    updateCam();
    return;
  }

  updateNpcAnim(t);

  if (current.id === "space_boss") {
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    input.clear();
    updateCam();
    return;
  }

  let dx = 0,
    dy = 0;

  const dashMul = current.id !== "space" && current.id !== "space_boss" && input.down("c") ? 1.6 : 1;
  const debugSpeedMul = DEBUG && input.down("b") ? 5 : 1;
  const spd = SPEED * debugSpeedMul * dashMul;

  if (current.id === "space") {
    if (SPACE_MOON_SYSTEM_ENABLED) {
      const px = leader.x + 8;
      const py = leader.y + 13;
      const mdx = px - SPACE_MOON.cx;
      const mdy = py - SPACE_MOON.cy;
      const dist = Math.hypot(mdx, mdy) || 1;
      if (!spaceMoonAttach && t >= spaceMoonCooldownUntil && dist < SPACE_MOON.surfaceR + 26) {
        spaceMoonAttach = true;
        spaceMoonAngle = Math.atan2(mdy, mdx);
        spaceMoonRadius = Math.max(SPACE_MOON.surfaceR - 2, Math.min(SPACE_MOON.surfaceR + 10, dist));
        spaceVel.x = 0;
        spaceVel.y = 0;
      }

      if (spaceMoonAttach) {
        const angSpd = (DEBUG && input.down("b") ? 0.05 : 0.032) * dashMul;
        if (input.down("ArrowLeft"))  spaceMoonAngle -= angSpd;
        if (input.down("ArrowRight")) spaceMoonAngle += angSpd;
        if (input.down("ArrowUp"))    spaceMoonRadius = Math.min(SPACE_MOON.surfaceR + 18, spaceMoonRadius + 0.8);
        if (input.down("ArrowDown"))  spaceMoonRadius = Math.max(SPACE_MOON.surfaceR - 4, spaceMoonRadius - 0.6);
        if (spaceMoonRadius <= SPACE_MOON.surfaceR - 4) achieveQuest("20");

        if (spaceMoonRadius > SPACE_MOON.surfaceR + 14) {
          spaceMoonAttach = false;
          spaceMoonCooldownUntil = t + 500;
          spaceVel.x = Math.cos(spaceMoonAngle) * 0.7;
          spaceVel.y = Math.sin(spaceMoonAngle) * 0.7;
        } else {
          leader.x = SPACE_MOON.cx + Math.cos(spaceMoonAngle) * spaceMoonRadius - 8;
          leader.y = SPACE_MOON.cy + Math.sin(spaceMoonAngle) * spaceMoonRadius - 13;
          followers.push(leader.x, leader.y);
          if (t - leader.last > FRAME_MS + 20) {
            leader.frame ^= 1;
            leader.last = t;
          }
          followers.update(t, { p2, p3, p4 });
          updateCam();
          return;
        }
      }
    }

    const acc = (DEBUG && input.down("b") ? 0.12 : 0.06) * dashMul;
    const max = (DEBUG && input.down("b") ? 1.9 : 1.25) * dashMul;
    if (input.down("ArrowLeft"))  spaceVel.x -= acc;
    if (input.down("ArrowRight")) spaceVel.x += acc;
    if (input.down("ArrowUp"))    spaceVel.y -= acc;
    if (input.down("ArrowDown"))  spaceVel.y += acc;

    const len = Math.hypot(spaceVel.x, spaceVel.y);
    if (len > max) {
      spaceVel.x = (spaceVel.x / len) * max;
      spaceVel.y = (spaceVel.y / len) * max;
    }

    spaceVel.x *= 0.988;
    spaceVel.y *= 0.988;

    if (Math.abs(spaceVel.x) > 0.01 || Math.abs(spaceVel.y) > 0.01) {
      leader.x = Math.max(0, Math.min(current.bgW - SPR, leader.x + spaceVel.x));
      leader.y = Math.max(0, Math.min(current.bgH - SPR, leader.y + spaceVel.y));
      followers.push(leader.x, leader.y);
      if (t - leader.last > FRAME_MS + 30) {
        leader.frame ^= 1;
        leader.last = t;
      }
    } else {
      leader.frame = 0;
    }

    followers.update(t, { p2, p3, p4 });
    updateCam();
    return;
  }

  if (input.down("ArrowLeft"))  dx = -spd;
  if (input.down("ArrowRight")) dx =  spd;
  if (input.down("ArrowUp"))    dy = -spd;
  if (input.down("ArrowDown"))  dy =  spd;

  // normalize diagonal so speed stays consistent
  if (dx && dy) { const n = spd / Math.SQRT2; dx = dx > 0 ? n : -n; dy = dy > 0 ? n : -n; }

  if (dx || dy) {
    const nx = leader.x + dx;
    const ny = leader.y + dy;

    let moved = false;
    if (!hitBg(nx, ny) && !hitNpc(nx, ny)) {
      leader.x = nx;
      leader.y = ny;
      moved = true;
    } else if (dx && dy) {
      // diagonal blocked — try sliding along each axis
      if (!hitBg(nx, leader.y) && !hitNpc(nx, leader.y)) {
        leader.x = nx;
        moved = true;
      } else if (!hitBg(leader.x, ny) && !hitNpc(leader.x, ny)) {
        leader.y = ny;
        moved = true;
      }
    }

    if (moved) {
      if (input.down("c")) spawnDashDust(t, dx, dy);
      followers.push(leader.x, leader.y);
      if (t - leader.last > FRAME_MS) {
        leader.frame ^= 1;
        leader.last = t;
      }
    }
  } else {
    leader.frame = 0;
  }

  followers.update(t, { p2, p3, p4 });
  checkGateWarpTriggers();

  // seahole 泡の生成・更新
  if (current.id === "seahole") {
    const chars = [leader, p2, p3, p4];
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const interval = 800 + Math.random() * 800; // 0.8〜1.6秒ごと
      if (t - bubbleLastSpawn[i] > interval) {
        bubbleLastSpawn[i] = t;
        const count = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < count; j++) {
          const b = acquireBubble();
          if (b) {
            b.active = true;
            b.x     = c.x + 4 + Math.random() * 8;
            b.y     = c.y + 2;
            b.r     = 0.5 + Math.random() * 1;
            b.alpha = 0.7 + Math.random() * 0.3;
            b.vy    = 0.3 + Math.random() * 0.3;
            b.vx    = (Math.random() - 0.5) * 0.3;
            b.born  = t;
            b.life  = 1200 + Math.random() * 600;
          }
        }
      }
    }
    // 寿命切れを非アクティブに戻す
    for (let i = 0; i < BUBBLE_POOL_SIZE; i++) {
      if (bubblePool[i].active && t - bubblePool[i].born > bubblePool[i].life) {
        bubblePool[i].active = false;
      }
    }
  } else {
    // マップ離脱時に全リセット
    for (let i = 0; i < BUBBLE_POOL_SIZE; i++) bubblePool[i].active = false;
  }

  // seahole 魚の更新
  if (current.id === "seahole" && fishArr.length > 0) {
    const dt = fishLastT > 0 ? Math.min(t - fishLastT, 50) : 16;
    fishLastT = t;
    for (const f of fishArr) {
      f.x += f.vx * (dt / 16);
      f.y += f.vy * (dt / 16);
      if (f.x < 8)   { f.vx =  Math.abs(f.vx); f.x = 8; }
      if (f.x > 248) { f.vx = -Math.abs(f.vx); f.x = 248; }
      if (f.y < 8)   { f.vy =  Math.abs(f.vy); f.y = 8; }
      if (f.y > 232) { f.vy = -Math.abs(f.vy); f.y = 232; }
      f.turnTimer--;
      if (f.turnTimer <= 0) {
        const na = Math.atan2(f.vy, f.vx) + (Math.random() - 0.5) * 1.2;
        f.vx = Math.cos(na) * f.speed;
        f.vy = Math.sin(na) * f.speed * 0.35;
        f.turnTimer = f.turnInterval + (Math.random() * 100 | 0);
      }
    }
  }

  // chinanago カメラ判定
  if (current.id === "outdoor") {
    const duckAPlaying = bgmCtl.getOverrideSrc() === "assets/audio/duckA.mp3";
    if (!chinanagoActivated && duckAPlaying) {
      const cw = canvas.width, ch = canvas.height;
      const inView = actors.some(a =>
        a.name === "chinanago" &&
        a.x + SPR > cam.x && a.x < cam.x + cw &&
        a.y + SPR > cam.y && a.y < cam.y + ch
      );
      if (inView) {
        chinanagoActivated = true;
        achieveQuest("03");
        actors.forEach(a => { if (a.name === "chinanago") a.img = SPRITES.chinanago_half; });
        setTimeout(() => {
          if (current.id === "outdoor" && bgmCtl.getOverrideSrc() === "assets/audio/duckA.mp3") {
            actors.forEach(a => { if (a.name === "chinanago") a.img = SPRITES.chinanago_on; });
          }
        }, 100);
      }
    } else if (chinanagoActivated && !duckAPlaying) {
      chinanagoActivated = false;
      actors.forEach(a => { if (a.name === "chinanago") a.img = SPRITES.chinanago_half; });
      setTimeout(() => {
        if (current.id === "outdoor") {
          actors.forEach(a => { if (a.name === "chinanago") a.img = SPRITES.chinanago_off; });
        }
      }, 100);
    }

    // cactus（duckD が鳴っている間だけアニメーション）
    const duckDPlaying = bgmCtl.getOverrideSrc() === "assets/audio/duckD.mp3";
    if (!cactusActivated && duckDPlaying) {
      cactusActivated = true;
      STATE.flags.cactus14CanTalk = true;
      actors.forEach(a => {
        if (a.name === "cactus_hat" || a.name?.startsWith("cactus_")) {
          if (a.name === "cactus_14" && !STATE.flags.cactus14Talked) return; // サボり中は静止
          a.animMs = NPC_FRAME_MS;
        }
      });
    } else if (cactusActivated && !duckDPlaying) {
      cactusActivated = false;
      STATE.flags.cactus14CanTalk = false;
      actors.forEach(a => {
        if (a.name === "cactus_hat" || a.name?.startsWith("cactus_")) {
          a.animMs = Infinity;
          a.frame  = 0;
        }
      });
    }

    // balloondog（duckB が鳴っている間だけ表示）
    const duckBPlaying = bgmCtl.getOverrideSrc() === "assets/audio/duckB.mp3";
    const bd = actors.find(a => a.name === "balloondog");
    if (bd) {
      if (duckBPlaying && bd.hidden) {
        const cw = canvas.width, ch = canvas.height;
        const inView = bd.x + SPR > cam.x && bd.x < cam.x + cw &&
                       bd.y + SPR > cam.y && bd.y < cam.y + ch;
        if (inView) {
          bd.hidden = false;
          achieveQuest("04");
          bd.img = SPRITES.balloondog_half;
          setTimeout(() => {
            if (current.id === "outdoor" && !bd.hidden) bd.img = SPRITES.balloondog;
          }, 100);
        }
      } else if (!duckBPlaying && !bd.hidden && bd.img === SPRITES.balloondog) {
        bd.img = SPRITES.balloondog_half;
        setTimeout(() => {
          if (current.id === "outdoor") bd.hidden = true;
        }, 100);
      }
    }
  }

  updateRainScene(t);

  doorCheck(t);
  holeCheck(t);
  shrineTriggerCheck();
  stairTriggerCheck();

  // shrine フェードアニメ
  if (IS_MOBILE_DEVICE) {
    // モバイル：白フラッシュ。ピーク(alpha=1)で shrineFade をスナップして即切替
    if (shrineWhite.phase === "fade-in") {
      shrineWhite.alpha = Math.min(1, shrineWhite.alpha + SHRINE_WHITE_SPEED);
      if (shrineWhite.alpha >= 1) {
        shrineMode = shrineWhite.targetMode;
        shrineFade = shrineWhite.targetMode ? 1 : 0;
        shrineWhite.phase = "fade-out";
      }
    } else if (shrineWhite.phase === "fade-out") {
      shrineWhite.alpha = Math.max(0, shrineWhite.alpha - SHRINE_WHITE_SPEED);
      if (shrineWhite.alpha <= 0) shrineWhite.phase = "off";
    }
  } else {
    // PC：グラデュアルクロスフェード
    if (shrineMode && shrineFade < 1) shrineFade = Math.min(1, shrineFade + SHRINE_FADE_SPEED);
    else if (!shrineMode && shrineFade > 0) shrineFade = Math.max(0, shrineFade - SHRINE_FADE_SPEED);
  }

  updateCam();
}

// ---- Loop ----
// マップを事前ロードしてからロード画面→タイトル表示
loadMap("moritasaki_room", { skipBgm: true });

function startTitle() {
  title.start({
    onNewGame() { startNewGameFlow(); },
    onContinue() {
      setGameResolution(BASE_W, BASE_H);
      if (hasSaveData()) loadGame({ fromTitle: true });
      else startNewGameFlow();
    },
  });
}

bgmCtl.setOverride("about:blank"); // ローディング・タイトル中はBGM無音
loading.start(startTitle);

if (MOBILE) {
  setupMobileController(input, {
    onUserGesture() {
      bgmCtl.unlock();
      unlockSeAudio();
    },
  });
}


const PERF_HUD = !MOBILE && !IS_MOBILE_DEVICE;
const _perfStats = {
  frames: 0,
  accFrame: 0,
  accUpdate: 0,
  accDraw: 0,
  lastWindowStart: 0,
  fps: 0,
  frameMs: 0,
  updateMs: 0,
  drawMs: 0,
};

function drawPerfHud() {
  if (!PERF_HUD) return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, 72, 28);
  ctx.fillStyle = "#0f0";
  ctx.font = "8px PixelMplus10, monospace";
  ctx.textBaseline = "top";
  ctx.fillText(`${_perfStats.fps.toFixed(0)}fps ${_perfStats.frameMs.toFixed(1)}ms`, 2, 2);
  ctx.fillText(`u${_perfStats.updateMs.toFixed(1)} d${_perfStats.drawMs.toFixed(1)}`, 2, 14);
  ctx.restore();
}

// ---- FPS 低下検知 → リロード推奨ダイアログ（iOS Safari 低電力モード対策） ----
const fpsWarn = {
  initialized: false,
  warmupUntilMs: 0,
  measureUntilMs: 0,
  startedMs: 0,
  frameCount: 0,
  shown: false,
  shownAt: 0,
  minVisibleMs: 2000,
  buttonRect: null,
};
function updateFpsWarn(t) {
  if (!IS_MOBILE_DEVICE) return;
  if (fpsWarn.shown || fpsWarn.measureUntilMs === -1) return;
  if (!fpsWarn.initialized) {
    fpsWarn.initialized = true;
    fpsWarn.warmupUntilMs = t + 1000;
    return;
  }
  if (t < fpsWarn.warmupUntilMs) return;
  if (fpsWarn.measureUntilMs === 0) {
    fpsWarn.measureUntilMs = t + 2000;
    fpsWarn.startedMs = t;
    fpsWarn.frameCount = 0;
    return;
  }
  fpsWarn.frameCount++;
  if (t >= fpsWarn.measureUntilMs) {
    const elapsed = t - fpsWarn.startedMs || 1;
    const avg = (fpsWarn.frameCount * 1000) / elapsed;
    if (avg < 35) {
      fpsWarn.shown = true;
      fpsWarn.shownAt = t;
    } else fpsWarn.measureUntilMs = -1;
  }
}
function drawFpsWarn(ctx) {
  if (!fpsWarn.shown) return;
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, w, h);
  const pw = Math.min(w - 16, 220), ph = 110;
  const px = ((w - pw) / 2) | 0, py = ((h - ph) / 2) | 0;
  ctx.fillStyle = "#000";
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "10px PixelMplus10";
  ctx.fillText("動作が重くなっています", px + pw / 2, py + 10);
  ctx.fillStyle = "#ccc";
  ctx.fillText("低電力モードをオフにしてから", px + pw / 2, py + 30);
  ctx.fillText("ブラウザのタブを閉じて", px + pw / 2, py + 44);
  ctx.fillText("開き直してください", px + pw / 2, py + 58);
  const bw = 70, bh = 18;
  const bx = px + ((pw - bw) / 2 | 0);
  const by = py + ph - bh - 8;
  ctx.fillStyle = "#fff";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#000";
  ctx._skipTextShadow = true;
  ctx.fillText("閉じる", bx + bw / 2, by + 4);
  ctx._skipTextShadow = false;
  fpsWarn.buttonRect = { x: bx, y: by, w: bw, h: bh };
  ctx.restore();
}
function fpsWarnTap(ev) {
  if (!fpsWarn.shown) return false;
  if (performance.now() - fpsWarn.shownAt < fpsWarn.minVisibleMs) return true;
  fpsWarn.shown = false;
  return true;
}
canvas.addEventListener("click", (e) => {
  if (fpsWarnTap(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, { capture: true });
canvas.addEventListener("touchstart", (e) => {
  if (fpsWarnTap(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, { capture: true, passive: false });
window.addEventListener("keydown", (e) => {
  if (!fpsWarn.shown) return;
  if (e.key === "z" || e.key === "Z" || e.key === "Enter" || e.key === " ") {
    if (performance.now() - fpsWarn.shownAt >= fpsWarn.minVisibleMs) {
      fpsWarn.shown = false;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, { capture: true });
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});

if (!window.__rpgLoopStarted) {
  window.__rpgLoopStarted = true;

  function loop(t) {
    const _a = performance.now();
    update(t);
    const _b = performance.now();
    draw();
    updateFpsWarn(t);
    drawFpsWarn(ctx);
    const _c = performance.now();
    if (PERF_HUD) {
      _perfStats.frames += 1;
      _perfStats.accFrame  += _c - _a;
      _perfStats.accUpdate += _b - _a;
      _perfStats.accDraw   += _c - _b;
      if (_c - _perfStats.lastWindowStart >= 500) {
        const elapsed = _c - _perfStats.lastWindowStart || 1;
        _perfStats.fps      = (_perfStats.frames * 1000) / elapsed;
        _perfStats.frameMs  = _perfStats.accFrame  / _perfStats.frames;
        _perfStats.updateMs = _perfStats.accUpdate / _perfStats.frames;
        _perfStats.drawMs   = _perfStats.accDraw   / _perfStats.frames;
        _perfStats.frames = 0;
        _perfStats.accFrame = 0;
        _perfStats.accUpdate = 0;
        _perfStats.accDraw = 0;
        _perfStats.lastWindowStart = _c;
      }
      drawPerfHud();
    }
    requestAnimationFrame(loop);
  }

  // フォント読み込み完了後にループ開始（初回テキスト化け防止）
  Promise.all([
    document.fonts.load("10px PixelMplus10"),
    document.fonts.load("12px PixelMplus12"),
  ]).then(() => {
    _perfStats.lastWindowStart = performance.now();
    requestAnimationFrame(loop);
  });
}

if (DEBUG) {
  window.__bgm = bgmCtl.audio;
  bgmCtl.audio.addEventListener("error", () => console.log("BGM error", bgmCtl.audio.src));
}
