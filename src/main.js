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
import { playSuzu, playDoor, playZazza, playHoleFall, playHoleRoll, playConfirm, playClickOn, playTimeMachineShine, playWave, startHeartbeat, stopHeartbeat, playQuestJingleB, playPunch, startShootingBgm, stopShootingBgm, startAfloClubBgm, stopAfloClubBgm, stopJaws, playBattleWinJingle, getAfloClubKickPulseMs, unlockSeAudio, startRainLoop, stopRainLoop, startDivingBgm, stopDivingBgm, playDinoStep, playBirdCall, playWingFlap, startWaterfall, setWaterfallVol, stopWaterfall } from "./se.js";
import { createMenu } from "./ui_menu.js";
import { createTripEffect }     from "./trip_effect.js";
import { createGoodTripEffect } from "./trip_effect_good.js";
import * as letterbox           from "./letterbox.js";
import { createQuestAlert }     from "./ui_quest_alert.js";
import { QUESTS }               from "./data/quests.js";
import { createShooting, drawShootingBackdrop } from "./ui_shooting.js";
import { createDiving, DIVE_W, DIVE_H } from "./ui_diving.js";
import { gateNpc } from "./data/npcs/gate.js";

const DEBUG  = true;
const MOBILE = new URLSearchParams(location.search).has('m');

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const trip     = createTripEffect();
const goodTrip = createGoodTripEffect({ useCssFilter: MOBILE });
ctx.imageSmoothingEnabled = false;

const { SCALE, SPR, SPEED, FRAME_MS, GAP2, GAP3, GAP4, NPC_FRAME_MS, DOOR_COOLDOWN_MS, MAP_FADE_OUT_MS, MAP_FADE_IN_MS } = CONFIG;
// ゲーム本編は常に 192×180（タイトル/セレクト/エンディングは CONFIG.BASE_W/H = 256×240）
const BASE_W = 192;
const BASE_H = 180;

// ボス戦専用の固定解像度（ゲーム本編の解像度に依存しない）
// battle_ui.js は cmdX=160,cmdW=88(合計248) / BOSS_SCALE=3で80×80→240px 等、256×240想定で設計
const BATTLE_W = 256;
const BATTLE_H = 240;

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

function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}


// UI / FX
const shooting  = createShooting({ BASE_W, BASE_H, input, sprites: SPRITES, getLeaderImg: () => leader?.img });
const diving    = createDiving({ BASE_W, BASE_H, input, getLeaderImg: () => leader?.img, getHeadwearImg: () => SPRITES.kingyobachi, sprites: SPRITES });
const dialog = createDialog({ BASE_W, BASE_H, input });
const choice = createChoice({ BASE_W, BASE_H, input });
const shop      = createShop({ BASE_W, BASE_H, input });
const jumprope  = createJumprope({ BASE_W, BASE_H, input, getParty: () => ({ leader, p2, p3, p4 }), yahhyImg: SPRITES.yahhy });
const fade = createFade({ BASE_W, BASE_H, canvas, input, mapOutMs: MAP_FADE_OUT_MS, mapInMs: MAP_FADE_IN_MS });

// 初期：ダイアログの上にchoiceを積むための基準を渡す
if (typeof dialog.getRect === "function" && typeof choice.setAnchorRect === "function") {
  choice.setAnchorRect(dialog.getRect());
}

// ---- BGM (externalized) ----
const BGM_VOLUME = 0.35;
const bgmCtl = createBgm({ defaultSrc: "assets/audio/bgm0.mp3", volume: BGM_VOLUME });
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
let redScreenOnEnd = null;
const RED_TO_BLACK_MS = 4000;
const SHADOW_W = 130;
let seaholeCutscene = { active: false, shadowX: BASE_W, charOffsetX: 0 };
let orcaRide = { active: false, startMs: 0, durationMs: 15000, ending: false };
let mechaEvolution = { active: false, phase: "idle", startMs: 0, fromImg: null, toImg: null };
let theaterScene = { active: false, startMs: 0, exitWaitStartMs: 0, phase: "intro", messageShown: false };
let kakoMovieScene = { active: false, startMs: 0, exitWaitStartMs: 0, phase: "intro", messageShown: false };
const RAIN_DROP_COUNT = 84;
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
      const ty = treeY - 40 + Math.sin(i * 0.9 + 2.0) * 3;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 22, 44);
    }
    // 奥の層
    ctx.globalAlpha = fadeIn * 0.55;
    for (let i = 0; i < 26; i++) {
      const tx = i * 10 - 8 + Math.sin(i * 2.3) * 3;
      const ty = treeY - 50 + Math.sin(i * 1.3 + 0.5) * 3;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 28, 56);
    }
    // 中間層
    ctx.globalAlpha = fadeIn * 0.7;
    for (let i = 0; i < 28; i++) {
      const tx = i * 9 - 6 + Math.sin(i * 1.9 + 1.0) * 4;
      const ty = treeY - 60 + Math.sin(i * 1.7) * 4;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 34, 68);
    }
    // 手前層（大きめ、明るい）
    ctx.globalAlpha = fadeIn * 0.9;
    for (let i = 0; i < 24; i++) {
      const tx = i * 11 - 5 + Math.sin(i * 2.7 + 2.0) * 5;
      const ty = treeY - 72 + Math.sin(i * 1.1 + 0.8) * 5;
      ctx.drawImage(yashiImg, yf * 64, 0, 64, 128, tx, ty, 42, 84);
    }
  }

  ctx.restore();

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
    item.filter = undefined;
    item.tint = undefined;
    item.vanishStart = undefined;
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

  if (mapId === "shooting_lobby") {
    for (const a of actors) {
      if (!a.name?.startsWith("door_")) continue;
      if (a.name === "door_0") {
        a.markImg = null;
        continue;
      }
      a.markImg = STATE.flags[`shootingCleared_${a.name}`] ? SPRITES.door_clear : SPRITES.door_noclear;
      if (STATE.flags[`shootingCleared_${a.name}`]) a.alpha = 0.82;
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
      talkHit: { x: 0, y: 0, w: 16, h: 16 },
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

function startSpaceWarp() {
  spaceWarpFx = { active: true, start: performance.now(), done: false };
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
let _preItemBgm = null;
function captureItemBgm() {
  const cur = bgmCtl.getOverrideSrc();
  _preItemBgm = (cur && cur !== "about:blank") ? cur : null;
}
function restoreItemBgm() {
  setBgmOverrideSafe(_preItemBgm);
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
  input.lock();
  const now = nowMs();
  timeMachineFx = { active: true, start: now, until: now + 7000, onDone };
  playTimeMachineShine();
  try { navigator.vibrate?.([70, 40, 90, 40, 120, 40, 160]); } catch (_) {}
}
function startPageTurnTravel(destMap, spawnAt, dir = "rtl") {
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
  stopBgm: () => { captureItemBgm(); setBgmOverrideSafe("about:blank"); },
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
  stopBgm:        () => { captureItemBgm(); setBgmOverrideSafe("about:blank"); },
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
  onUseItem: (id) => {
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
    if (id === "hone") {
      inventory.removeItem("hone");
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
    if (id === "pizza") {
      inventory.removeItem("pizza");
      if (STATE.flags.pizzaJobActive && !STATE.flags.pizzaDelivered) {
        STATE.flags.pizzaAte = true;
      }
      input.lock();
      setTimeout(restoreItemBgm, 670);
      setTimeout(() => {
        input.unlock();
        dialog.open([
          ["激うま！"],
          ["商品をたべてしまった。"],
          ["あやまりにいこう。"],
        ], null, "sign");
      }, 700);
      return true;
    }
    if (id === "moon_stone") {
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
      setTimeout(() => {
        input.unlock();
        dialog.open([["仮アイテム１をつかった！"]], null, "sign");
      }, 700);
      return true;
    }
    if (id === "temp_item_2") {
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
      input.lock();
      setTimeout(restoreItemBgm, 670);
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
  },
});

// ---- Battle ----
let pendingBattlePages   = null; // { win, lose, winEnding }
let partyVisible         = true;
let pendingEndingFadeIn  = false;

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
const title      = createTitle({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input });
const charSelect = createCharSelect({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input, sprites: SPRITES });
const loading    = createLoading({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H });

// ---- Save / Load ----
const SAVE_KEY = "rpg_save";
let saveNotice = null; // { text, until }

function hasSaveData() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (_) {
    return false;
  }
}

function startNewGameFlow() {
  bgmCtl.setOverride("assets/audio/bgm_select.mp3");
  bgmCtl.unlock();
  charSelect.start((leaderIdx) => {
    bgmCtl.setOverride(null);
    setupParty(leaderIdx);
    setGameResolution(BASE_W, BASE_H);
    resetProgress();
    inventory.resetItems(START_INVENTORY_NORMAL);
    fade.startCutFade(nowMs(), {
      outMs:  1,
      holdMs: 80,
      inMs:   500,
      onBlack: () => loadMap("moritasaki_room"),
    });
  });
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
  resetHeightState();
}

function isSceneActive() {
  if (fade.isActive()) return true;
  if (dialog.isActive()) return true;
  if (choice.isActive()) return true;
  if (letterbox.isActive()) return true;
  if (battle.isActive()) return true;
  if (shooting.isActive()) return true;
  if (diving.isActive()) return true;
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

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) { saveNotice = { text: "NO DATA", until: nowMs() + 1200 }; return; }
  try {
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
    bgmCtl.setOverride(null);
    loadMap(data.mapId || "outdoor", { spawnAt: { x: data.leaderX, y: data.leaderY } });
    saveNotice = { text: "LOADED", until: nowMs() + 1200 };
  } catch (e) {
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
        bgmCtl.setOverride(null);
        setGameResolution(BASE_W, BASE_H);
        pendingBattlePages = null;
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
        bgmCtl.setOverride(null);
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
    bgmCtl.setOverride(null);
    setGameResolution(BASE_W, BASE_H);
    const pages      = result === "win" ? pendingBattlePages?.win  : pendingBattlePages?.lose;
    const isEnding   = result === "win" && !!pendingBattlePages?.winEnding;
    pendingBattlePages = null;

    const triggerEnding = () => {
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
      setTimeout(() => { input.unlock(); dialog.open(pages, isEnding ? triggerEnding : null, "talk"); }, 1000);
    } else if (isEnding) {
      input.lock();
      setTimeout(() => { input.unlock(); triggerEnding(); }, 1000);
    }
  },
});

// ---- Collision ----
function footBox(x, y) {
  return { x: x + 3, y: y + 10, w: 10, h: 6 };
}
function hitRect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function hitBg(nx, ny) {
  if (current.id === "shooting_lobby" || current.id === "space") return false;
  const f = footBox(nx, ny);
  for (let y = f.y; y < f.y + f.h; y++) {
    for (let x = f.x; x < f.x + f.w; x++) {
      if (col.isWallAt(x, y, heightLevel)) return true;
    }
  }
  // ヘルメット未装備時、helmetRequired な穴 trigger は壁扱い
  if (STATE.headwear !== "helmet") {
    const def = MAPS[current.id];
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
      doorCooldown = t + DOOR_COOLDOWN_MS;
      if (door.sound === 'zazza') playZazza();
      else playDoor();
      fade.startMapFade(door.to, { doorId: door.id }, t, loadMap);
      return;
    }
  }
}

// ---- Shrine trigger check ----
const charHeight = { leader: "ground", p2: "ground", p3: "ground", p4: "ground" };
const stairZonePrev = { leader: false, p2: false, p3: false, p4: false };

function resetHeightState() {
  charHeight.leader = "ground";
  charHeight.p2 = "ground";
  charHeight.p3 = "ground";
  charHeight.p4 = "ground";
  heightLevel = "ground";
  stairZonePrev.leader = false;
  stairZonePrev.p2 = false;
  stairZonePrev.p3 = false;
  stairZonePrev.p4 = false;
}

function checkStairForChar(name, cx, cy) {
  const f  = footBox(cx, cy);
  const fx = (f.x + (f.w >> 1)) | 0;
  const fy = (f.y + (f.h >> 1)) | 0;
  const on = col.getZone(fx, fy) === "stair";
  if (on === stairZonePrev[name]) return;
  stairZonePrev[name] = on;
  if (on) charHeight[name] = charHeight[name] === "ground" ? "upper" : "ground";
}

function stairTriggerCheck() {
  if (!mapReady) return;
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
    if (id === "space") {
      initSpaceStars();
      spaceMoonAttach = false;
      spaceMoonAngle = 0;
      spaceMoonRadius = SPACE_MOON.surfaceR;
      spaceMoonCooldownUntil = 0;
      spaceO2 = getSpaceO2Capacity();
      spaceO2LastMs = nowMs();
      spaceO2Depleted = false;
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

    const entryDoor = (def.doors || []).find(d => d.id === opt?.doorId);
    autoWalk = entryDoor?.entryWalk ? { ...entryDoor.entryWalk } : null;

    if (def.fullWater) buildFullWaterMask(current.bgW, current.bgH);
    else if (def.waterColor) buildWaterMask(bgImg, def.waterColor);
    else waterMaskCanvas = null;

    spawnActorsForMap(current.id);
    applyFlagsToActors(current.id);

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

    if (opt?.isEnding || opt?.skipBgm) {
      // BGM は呼び出し元が管理
      if (current.id === "shooting_lobby") {
        bgmCtl.setOverride("about:blank");
        startShootingBgm();
      } else {
        stopShootingBgm();
      }
    } else if (current.id === "shooting_lobby") {
      bgmCtl.setOverride("about:blank");
      stopAfloClubBgm();
      startShootingBgm();
    } else if (current.id === "space") {
      bgmCtl.setOverride("about:blank");
      stopShootingBgm();
      stopAfloClubBgm();
    } else if (current.id === "afloclub") {
      bgmCtl.setOverride("about:blank");
      stopShootingBgm();
      startAfloClubBgm();
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
    }

    seaholeCutscene = { active: false, shadowX: BASE_W, charOffsetX: 0 };

    bgmCtl.setUnderwater(!MOBILE && current.id === "seahole");
    bgmCtl.setReverb(!MOBILE && (current.id === "pool" || current.id === "charch") ? current.id : null);
    if (current.id === "seahole") initFish();

    chinanagoActivated = false;
    cactusActivated    = false;
    followers.reset({ leader, p2, p3, p4 });
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
  shrineMode = false;
  shrineFade = 0;
  shrineTriggerActive = false;
  heightLevel = charHeight.leader;
  stairZonePrev.leader = stairZonePrev.p2 = stairZonePrev.p3 = stairZonePrev.p4 = false;
  shrineWhite = { phase: "off", alpha: 0, targetMode: false };

  col.load(def.colSrc, () => {
    colOK = true;
    done();
  });
}

// ---- Draw ----
// カメラが映している範囲だけ描画（巨大マップのGPU負荷削減）
function drawMapImg(img, alpha) {
  if (!img.complete || img.naturalWidth <= 0) return;
  if (IS_MOBILE_DEVICE && current.id === "outdoor" && img.naturalWidth > 2048) {
    const startCx = Math.max(0, (cam.x / MOBILE_MAP_CHUNK) | 0);
    const startCy = Math.max(0, (cam.y / MOBILE_MAP_CHUNK) | 0);
    const endCx = Math.min(((img.naturalWidth - 1) / MOBILE_MAP_CHUNK) | 0, ((cam.x + canvas.width) / MOBILE_MAP_CHUNK) | 0);
    const endCy = Math.min(((img.naturalHeight - 1) / MOBILE_MAP_CHUNK) | 0, ((cam.y + canvas.height) / MOBILE_MAP_CHUNK) | 0);
    if (alpha !== undefined && alpha < 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let cy = startCy; cy <= endCy; cy++) {
        for (let cx = startCx; cx <= endCx; cx++) {
          const chunk = getMapChunk(img, cx, cy);
          if (!chunk) continue;
          const dx = cx * MOBILE_MAP_CHUNK - cam.x;
          const dy = cy * MOBILE_MAP_CHUNK - cam.y;
          ctx.drawImage(chunk, dx | 0, dy | 0);
        }
      }
      ctx.restore();
    } else {
      for (let cy = startCy; cy <= endCy; cy++) {
        for (let cx = startCx; cx <= endCx; cx++) {
          const chunk = getMapChunk(img, cx, cy);
          if (!chunk) continue;
          const dx = cx * MOBILE_MAP_CHUNK - cam.x;
          const dy = cy * MOBILE_MAP_CHUNK - cam.y;
          ctx.drawImage(chunk, dx | 0, dy | 0);
        }
      }
    }
    return;
  }
  const sx = cam.x | 0;
  const sy = cam.y | 0;
  const sw = Math.min(canvas.width,  img.naturalWidth  - sx);
  const sh = Math.min(canvas.height, img.naturalHeight - sy);
  if (sw <= 0 || sh <= 0) return;
  if (alpha !== undefined && alpha < 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
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
  if (o.vanishStart) {
    const ve = (nowMs() - o.vanishStart) / 400;
    if (ve >= 1) return;
    const vp = ve * ve;
    const sx = ((o.x - cam.x) | 0) + 8;
    const sy = ((o.y - cam.y) | 0) + 8;
    ctx.save();
    ctx.globalAlpha = 1 - vp;
    ctx.translate(sx, sy);
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
      const py = sy + Math.sin(a) * r - ve * 12;
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
  const hasFilter = !!o.filter;
  const hasTint = !!o.tint;
  const hasRotation = typeof o.rotation === "number" && o.rotation !== 0;
  const sprSize  = o.spr  ?? SPR;
  const sprSizeH = o.sprH ?? sprSize;

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
    if (hasFilter) ctx.filter = o.filter;
    if (hasScale || hasRotation) {
      const sx = ((o.x - cam.x) | 0) + sprSize / 2;
      const sy = ((o.y - cam.y) | 0) + sprSizeH - 3;
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
      if (markSpr > 0) ctx.drawImage(o.markImg, markFrame * markSpr, 0, markSpr, 16, ix, iy, 16, 16);
      else ctx.drawImage(o.markImg, ix, iy, 16, 16);
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
    shooting.draw(ctx);
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    return;
  }

  if (diving.isActive()) {
    diving.draw(ctx);
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    return;
  }

  // ★ここは見た目用なので performance.now() でもOK（ゲーム進行の時間とは別）
  const tt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const shouldDrawSea = current.id === "outdoor" || current.id === "mirai" || current.id === "kako" || !!waterMaskCanvas;
  const seaUpdateInterval = IS_MOBILE_DEVICE && (current.id === "outdoor" || current.id === "mirai" || current.id === "kako") ? 6 : 3;
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
    jumprope.draw(ctx);
    inventory.draw(ctx);
    toast.draw(ctx, tt);
    questAlert.update(); drainQuestQueue();
    questAlert.draw(ctx);
    fade.draw(ctx);
    return;
  }

  // ベースレイヤー：shrine完全移行後はbgImgを省略して描画コスト削減
  if (current.id === "shooting_lobby") {
    drawShootingBackdrop(ctx, BASE_W, BASE_H, tt);
  } else if (current.id === "space") {
    drawSpaceBackdrop(tt);
  } else if (current.id === "orca_ride") {
    ctx.fillStyle = "#3dc5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawWaterSea(ctx);
  } else if (shrineFade >= 1) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawMapImg(bgShrineImg);
  } else {
    drawMapImg(bgImg);
    drawWaterSea(ctx);
    if (shrineFade > 0) drawMapImg(bgShrineImg, shrineFade);
  }

  _groundList.length = 0;
  _upperList.length  = 0;
  _aboveTopList.length = 0;
  _poolIdx = 0;
  const groundList = _groundList;
  const upperList  = _upperList;
  const aboveTopList = _aboveTopList;
  const spaceDanger = current.id === "space" && spaceO2 / SPACE_O2_MAX <= 0.2;
  const moonRot = current.id === "space" && spaceMoonAttach ? spaceMoonAngle + Math.PI / 2 : 0;
  const panicOx = (phase = 0) => spaceDanger ? (((Math.sin(tt / 45 + phase) * 1.8) | 0)) : 0;
  const panicOy = (phase = 0) => spaceDanger ? (((Math.sin(tt / 28 + phase) > 0 ? 1 : -1))) : 0;
  if (partyVisible) {
    const singleLeaderOnly = current.id === "shooting_lobby";
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
      const ip4 = _poolItem(); ip4.img = p4.img; ip4.x = (fx ?? p4.x) + cOff + panicOx(1.3); ip4.y = fy ?? p4.y + panicOy(1.3); ip4.frame = emerging ? 0 : p4.frame; ip4.alpha = followerAlpha; ip4.scale = fs; ip4.rotation = moonRot; ip4.metImg = _hwImg(p4.img); ip4.spr = undefined; ip4.sprH = undefined; ip4.shadowImg = undefined; ip4.sweat = spaceDanger; ip4.sweatPhase = 1.3;
      const ip3 = _poolItem(); ip3.img = p3.img; ip3.x = (fx ?? p3.x) + cOff + panicOx(2.1); ip3.y = fy ?? p3.y + panicOy(2.1); ip3.frame = emerging ? 0 : p3.frame; ip3.alpha = followerAlpha; ip3.scale = fs; ip3.rotation = moonRot; ip3.metImg = _hwImg(p3.img); ip3.spr = undefined; ip3.sprH = undefined; ip3.shadowImg = undefined; ip3.sweat = spaceDanger; ip3.sweatPhase = 2.1;
      const ip2 = _poolItem(); ip2.img = p2.img; ip2.x = (fx ?? p2.x) + cOff + panicOx(2.9); ip2.y = fy ?? p2.y + panicOy(2.9); ip2.frame = emerging ? 0 : p2.frame; ip2.alpha = followerAlpha; ip2.scale = fs; ip2.rotation = moonRot; ip2.metImg = _hwImg(p2.img); ip2.spr = undefined; ip2.sprH = undefined; ip2.shadowImg = undefined; ip2.sweat = spaceDanger; ip2.sweatPhase = 2.9;
      pushParty("p4", ip4); pushParty("p3", ip3); pushParty("p2", ip2);
    }
    const il = _poolItem(); il.img = leader.img; il.x = (playerHoleDrawX !== null ? playerHoleDrawX : leader.x) + cOff + panicOx(0.5); il.y = (playerHoleDrawY !== null ? playerHoleDrawY : leader.y) + rideBob + panicOy(0.5); il.frame = holeTransition ? 0 : leader.frame; il.alpha = undefined; il.scale = playerHoleScale; il.rotation = moonRot; il.metImg = _hwImg(leader.img); il.spr = undefined; il.sprH = undefined; il.shadowImg = undefined; il.sweat = spaceDanger; il.sweatPhase = 0.5;
    pushParty("leader", il);
  }
  for (const act of actors) {
    if (act.vanishStart && (nowMs() - act.vanishStart) >= 400) { act.hidden = true; act.vanishStart = undefined; }
    if (act.hidden) continue;
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
    ia.spr = act.spr; ia.sprH = act.sprH; ia.alpha = (act.alpha != null ? act.alpha : 1) * bgmFadeAlpha; ia.scale = undefined; ia.metImg = undefined;
    ia.sparkle = act.sparkle;
    ia.sparkleColor = act.sparkleColor;
    ia.sparklePhase = act.sparklePhase;
    ia.markImg = act.markImg;
    ia.markSpr = act.markSpr;
    ia.markAnimMs = act.markAnimMs;
    ia.markMode = act.markMode;
    ia.markFromImg = act.markFromImg;
    ia.markAnimStart = act.markAnimStart;
    ia.markAnimUntil = act.markAnimUntil;
    ia.vanishStart = act.vanishStart;
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
  for (let i = 0; i < groundList.length; i++) drawEntry(groundList[i]);
  drawMapImg(bgMidImg);
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
  if (current.id === "space") {
    // no top layer
  } else if (shrineFade >= 1) {
    drawMapImg(bgShrineTopImg);
  } else {
    drawMapImg(bgTopImg);
    if (shrineFade > 0) drawMapImg(bgShrineTopImg, shrineFade);
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
      ctx.translate(e.sx, e.sy - 10);
      ctx.scale(scale, scale);
      ctx.fillStyle = e.color || "#e00";
      ctx.font = "bold 12px PixelMplus10";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(e.char || "!", 0, 0);
      ctx.restore();
    }
  }

  menu.draw(ctx);
  letterbox.draw(ctx, tt);
  dialog.draw(ctx);
  choice.draw(ctx);
  shop.draw(ctx);
  jumprope.draw(ctx);
  toast.draw(ctx, tt);
  questAlert.update(); drainQuestQueue();
  questAlert.draw(ctx);
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
      fade.startCutFade(nowMs(), {
        outMs: 1, holdMs: 200, inMs: 500,
        onBlack: () => {
          spaceWarpFx.active = false;
          loadMap("space");
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

  fade.draw(ctx);

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
      ctx.fillStyle = "#000";
      ctx.fillText(p.text, px + 1, py + 1);
      ctx.fillStyle = p.color ?? "#fff";
      ctx.fillText(p.text, px, py);
      ctx.restore();
      return true;
    });
    ctx.restore();
  }

  // デバッグ：座標表示
  if (DEBUG && !MOBILE) {
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

  // デバッグ：C ホールドで会話/当たり判定・ドアtrigger可視化
  if (DEBUG && input.down("c")) {
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

// ---- Update ----
function updateNpcAnim(t) {
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

  const returnPos = { x: act.x, y: act.y + 26 };
  bgmCtl.setOverride("about:blank");
  startShootingBgm();
  shooting.start((earnedEN, result) => {
    stopShootingBgm();
    bgmCtl.setOverride("about:blank");
    STATE.money = Math.min(STATE.money + earnedEN, 999999);
    if (earnedEN > 0) toast.show(`${earnedEN} EN ゲット！`);
    if (result?.cleared) {
      input.lock();
      playVictory();
      setTimeout(() => {
        STATE.flags[`shootingCleared_${act.name}`] = true;
        const allHellDoorsCleared = Array.from({ length: 7 }, (_, i) =>
          STATE.flags[`shootingCleared_door_${i + 1}`]
        ).every(Boolean);
        if (allHellDoorsCleared) achieveQuest("15");
        act.alpha = 0.82;
        act.markFromImg = act.markImg || SPRITES.door_noclear;
        act.markImg = SPRITES.door_clear;
        act.markAnimStart = nowMs();
        act.markAnimUntil = act.markAnimStart + 500;
        leader.x = returnPos.x;
        leader.y = returnPos.y;
        followers.reset({ leader, p2, p3, p4 });
        startShootingBgm();
        shootingDoorCooldown = nowMs() + 800;
        input.unlock();
      }, 1000);
      return;
    }
    leader.x = returnPos.x;
    leader.y = returnPos.y;
    followers.reset({ leader, p2, p3, p4 });
    startShootingBgm();
    if (!result?.cleared) {
      shootingKnockback = {
        vx: 0,
        vy: 4.6,
        until: nowMs() + 420,
      };
    }
    shootingDoorCooldown = nowMs() + 800;
  }, { autoEndOnClear: true });
  return true;
}

// ★ここを t を受け取る形にする
function tryInteract(t) {
  if (dialog.isActive()) return;
  if (choice.isActive()) return;
  if (fade.isActive()) return;
  if (menu.isOpen()) return;
  if (battle.isActive()) return;
  const a = talkBoxLeader();

  for (let i = 0; i < actors.length; i++) {
    const act = actors[i];
    const b = (current.id === "shooting_lobby" && act.name?.startsWith("door_"))
      ? npcFootBox(act)
      : talkRectActor(act);
    if (!hitRect(a, b)) continue;

    if (act.kind === "npc") {
      if (current.id === "shooting_lobby" && act.name?.startsWith("door_")) {
        if (!STATE.flags.shootingLobbyLuchaTalked) return;
        activateShootingLobbyDoor(act, t);
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
        dialog.open([["ピザを配達した！"]], null, "sign");
        return;
      }
      if (act.showWhenBgm && bgmCtl.getOverrideSrc() !== act.showWhenBgm) continue;
      dialog.setVoice(act.voice || "default");
      const handled = runNpcEvent(act, {
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
                const TARGET_VOL = 0.35;
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
          if ((STATE.flags.pizzaSuccessCount | 0) >= 5) achieveQuest("16");
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
          bgmCtl.setOverride("about:blank");
          startWaterfall();
        },
        startDiving: (onDone) => {
          bgmCtl.setOverride("about:blank");
          setGameResolution(DIVE_W, DIVE_H);
          startDivingBgm();
          diving.start(() => {
            stopDivingBgm();
            bgmCtl.setOverride(null);
            setGameResolution(BASE_W, BASE_H);
            if (!STATE.flags.diveFirstStarted) {
              STATE.flags.diveFirstStarted = true;
              achieveQuest("18");
            }
            if (typeof onDone === "function") onDone();
          });
        },
      });
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
            bgmCtl.setOverride("about:blank"); // フィールドBGMを停止
            startHeartbeat(68, BGM_VOLUME);
            battle.start(input);
          });
        };
        const doWin = (pages) => {
          const winPages = pages || act.battleWinPages || null;
          const isEnding = !!act.battleWinEnding;
          const triggerEnd = () => {
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
            setTimeout(() => { input.unlock(); dialog.open(winPages, isEnding ? triggerEnd : null, "talk"); }, 1000);
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
          const pages = STATE.flags.shootingLobbyLuchaTalked
            ? [["ここが！ジ・ゴ・ク！"], ["サイコーーーーーー！！"]]
            : (act.talkPages || [["……"]]);
          const onClose = STATE.flags.shootingLobbyLuchaTalked
            ? null
            : () => {
                STATE.flags.shootingLobbyLuchaTalked = true;
                achieveQuest("12");
                input.lock();
                setTimeout(() => input.unlock(), 1000);
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

      collectedItems.add(id);
      inventory.addItem(id);
      if (id === "rubber_duck_G" || id === "rubber_duck_G_bad") {
        STATE.flags.duckGCollected = true;
      }
      if (id === "rubber_duck_B") STATE.flags.duckBCollected = true;
      if (id === "rubber_duck_I") STATE.flags.duckICollected = true;
      if (id === "rubber_duck_F") STATE.flags.duckFCollected = true;

      actors.splice(i, 1);

      // クエスト01: ラバーダック取得時だけ判定
      if (String(id).startsWith("rubber_duck_")) checkQuest01();

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
        setTimeout(() => {
          achieveQuest("23");
          input.unlock();
        }, 300);
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

  // fade 最優先
  if (fade.isActive()) {
    fade.update(t, () => mapReady);
    updateCam();
    return;
  }

  // フェードイン完了 → エンディング開始
  if (pendingEndingFadeIn) {
    pendingEndingFadeIn = false;
    bgmCtl.setOverride("assets/audio/bgm_end.mp3");
    bgmCtl.audio.loop = false;
    ending.start(t);
  }

  // ending 中は入力ブロック
  if (ending.isActive()) {
    // Debug: D キーでフィールドに即戻る
    if (DEBUG && input.consume("d")) {
      ending.stop();
      bgmCtl.audio.loop = true;
      bgmCtl.setOverride(null);
      partyVisible = true;
      setGameResolution(BASE_W, BASE_H);
      loadMap("outdoor");
      return;
    }
    ending.update(t);
    updateNpcAnim(t);
    updateCam();

    // フェードアウト完了後、Zでタイトルに戻る
    if (ending.isDone() && (input.consume("z") || input.consume("x") || input.consume("ArrowUp") || input.consume("ArrowDown") || input.consume("ArrowLeft") || input.consume("ArrowRight"))) {
      ending.stop();
      bgmCtl.audio.loop = true;
      bgmCtl.setOverride(null);
      partyVisible = true;
      resetProgress();
      inventory.resetItems(START_INVENTORY_NORMAL);
      loadMap("outdoor");
      setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
      title.start({
        onNewGame()  { startNewGameFlow(); },
        onContinue() { setGameResolution(BASE_W, BASE_H); if (hasSaveData()) loadGame(); else startNewGameFlow(); },
      });
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

  // jumprope
  if (jumprope.isActive()) {
    jumprope.update();
    return;
  }

  if (timeMachineFx.active) {
    if (t >= timeMachineFx.until) {
      const cb = timeMachineFx.onDone;
      timeMachineFx = { active: false, start: 0, until: 0, onDone: null };
      input.unlock();
      if (cb) cb();
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
    for (const act of actors) act.frame = 0;
    updateCam();
    return;
  }

  // dialog
  if (dialog.isActive()) {
    dialog.update();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
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
      bgmCtl.setOverride(null);
      input.lock();
      setTimeout(() => {
        input.unlock();
        dialog.open([
          ["すごいものをみてしまった。"],
        ], () => {
          input.lock();
          setTimeout(() => {
            input.unlock();
            achieveQuest("22");
          }, 1000);
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

  if (input.consume("x")) menu.toggle();
  if (input.consume("z")) tryInteract(t); // ★tを渡す

  // セーブ / ロード
  if (input.consume("s")) { saveGame(); return; }
  if (input.consume("l")) { loadGame(); return; }
  if (input.consume("v")) { setBgmOverrideSafe(null); setBgmMapSafe("assets/audio/bgm0.mp3"); return; }
  if (DEBUG && input.consume("1") && !pageTurnFx.active && !timeMachineTravelFx.active) {
    startTimeMachineTravel("kako", undefined, "ltr");
    return;
  }
  if (DEBUG && input.consume("2") && !pageTurnFx.active && !timeMachineTravelFx.active) {
    startTimeMachineTravel("mirai", undefined, "rtl");
    return;
  }
  if (DEBUG && input.consume("b")) {
    const inv = inventory.getSnapshot();
    if (inv.includes("moon_stone")) inventory.removeItem("moon_stone");
    else inventory.addItem("moon_stone");
    return;
  }

  // D で過去へワープ
  if (DEBUG && input.consume("d")) {
    fade.startCutFade(nowMs(), {
      outMs: 150, holdMs: 80, inMs: 300,
      onBlack: () => { loadMap("kako"); },
    });
  }

  if (shootingKnockback && current.id === "shooting_lobby") {
    const nx = leader.x + shootingKnockback.vx;
    const ny = leader.y + shootingKnockback.vy;
    leader.x = Math.max(0, Math.min(current.bgW - SPR, nx));
    leader.y = Math.max(0, Math.min(current.bgH - SPR, ny));
    followers.reset({ leader, p2, p3, p4 });
    leader.frame = 1;
    shootingKnockback.vx *= 0.88;
    shootingKnockback.vy = shootingKnockback.vy * 0.9 + 0.12;
    if (t >= shootingKnockback.until || (Math.abs(shootingKnockback.vx) < 0.2 && Math.abs(shootingKnockback.vy) < 0.2)) {
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

  let dx = 0,
    dy = 0;

  const spd = SPEED * (input.down("c") ? 5 : 1);

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
        const angSpd = input.down("c") ? 0.05 : 0.032;
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

    const acc = input.down("c") ? 0.12 : 0.06;
    const max = input.down("c") ? 1.9 : 1.25;
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
      if (hasSaveData()) loadGame();
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


if (!window.__rpgLoopStarted) {
  window.__rpgLoopStarted = true;

  function loop(t) {
    update(t);
    draw();
    requestAnimationFrame(loop);
  }

  // フォント読み込み完了後にループ開始（初回テキスト化け防止）
  document.fonts.load("10px PixelMplus10").then(() => {
    requestAnimationFrame(loop);
  });
}

if (DEBUG) {
  window.__bgm = bgmCtl.audio;
  bgmCtl.audio.addEventListener("error", () => console.log("BGM error", bgmCtl.audio.src));
}
