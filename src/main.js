// main.js
import { CONFIG } from "./config.js";
import { SPRITES } from "./sprites.js";
import { MAPS } from "./maps.js";
import { makeColStore } from "./col.js";
import { START_INVENTORY, itemName, itemBgmSrc, itemThrowDmg } from "./items.js";
import { PICKUPS_BY_MAP } from "./pickups.js";
import { NPCS_BY_MAP } from "./npcs.js";
import { REGISTRY } from "./registry.js";
const { createInput, createBgm, createSea, createDialog, createChoice, createFade, createInventory, createFollowers, createBattleSystem, runNpcEvent } = REGISTRY;
import { STATE } from "./state.js";
import { createEnding } from "./ending.js";
import { createTitle  } from "./title.js";
import { setupMobileController } from "./mobile_controller.js";
import { playSuzu } from "./se.js";

const DEBUG  = true;
const MOBILE = true;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let uiCtx = null; // UI専用オーバーレイcanvas（後で初期化）

const { SCALE, SPR, SPEED, FRAME_MS, GAP2, GAP3, GAP4, NPC_FRAME_MS, DOOR_COOLDOWN_MS, MAP_FADE_OUT_MS, MAP_FADE_IN_MS } = CONFIG;
// Mobile: render at lower resolution so each pixel appears ~1.2x larger at the same CSS size
const BASE_W = MOBILE ? 192 : CONFIG.BASE_W;
const BASE_H = MOBILE ? 180 : CONFIG.BASE_H;

// Start with title resolution (shared between mobile and desktop)
canvas.width = CONFIG.BASE_W;
canvas.height = CONFIG.BASE_H;
canvas.style.width = CONFIG.BASE_W * SCALE + "px";
canvas.style.height = CONFIG.BASE_H * SCALE + "px";

const input = createInput();

function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}


// UI / FX
const dialog = createDialog({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input });
const choice = createChoice({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input });
const fade = createFade({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input, mapOutMs: MAP_FADE_OUT_MS, mapInMs: MAP_FADE_IN_MS });

// 初期：ダイアログの上にchoiceを積むための基準を渡す
if (typeof dialog.getRect === "function" && typeof choice.setAnchorRect === "function") {
  choice.setAnchorRect(dialog.getRect());
}

// ---- BGM (externalized) ----
const bgmCtl = createBgm({ defaultSrc: "assets/audio/bgm0.mp3", volume: 0.35 });
const BATTLE_BGM_SRC = "assets/audio/bgm_battle.mp3";

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
const bgShrineImg    = new Image();
const bgShrineTopImg = new Image();
const col = makeColStore();

// ---- Shrine state ----
let shrineMode  = false;
let shrineFade  = 0;      // 0.0 (normal) → 1.0 (shrine)
let shrineTriggerActive = false; // 踏み続けている間は再発火しない
const SHRINE_FADE_SPEED = 1 / 15; // ~15フレームでフェード完了

// ---- Water sea overlay (color-masked) ----
const seaTempCanvas = document.createElement("canvas");
seaTempCanvas.width  = CONFIG.BASE_W;
seaTempCanvas.height = CONFIG.BASE_H;
const seaTempCtx = seaTempCanvas.getContext("2d");
let waterMaskCanvas = null;

// Resize canvas (and seaTempCanvas) when switching between title and gameplay
function setGameResolution(w, h) {
  canvas.width = w;
  canvas.height = h;
  seaTempCanvas.width = w;
  seaTempCanvas.height = h;
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

function drawWaterSea(ctx, t) {
  if (!waterMaskCanvas) return;
  seaTempCtx.clearRect(0, 0, seaTempCanvas.width, seaTempCanvas.height);
  sea.draw(seaTempCtx, t, cam, seaTempCanvas.width, seaTempCanvas.height);
  seaTempCtx.globalCompositeOperation = "destination-in";
  seaTempCtx.drawImage(waterMaskCanvas, -(cam.x | 0), -(cam.y | 0));
  seaTempCtx.globalCompositeOperation = "source-over";
  ctx.drawImage(seaTempCanvas, 0, 0);
}

const { current, cam, leader, p2, p3, p4, collectedItems } = STATE;
leader.img = SPRITES.p1;
p2.img = SPRITES.p2;
p3.img = SPRITES.p3;
p4.img = SPRITES.p4;

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

  const list = PICKUPS_BY_MAP?.[mapId] || [];
  for (const p of list) {
    const itemId = p?.itemId;
    if (!itemId) continue;
    if (collectedItems.has(itemId)) continue;

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
    });
  }
}

// ---- Inventory (externalized) ----
const inventory = createInventory({
  BASE_W: CONFIG.BASE_W,
  BASE_H: CONFIG.BASE_H,
  input,
  itemName,
  itemBgmSrc,
  unlockBgm: () => bgmCtl.unlock(),
  setOverrideBgm: (src) => bgmCtl.setOverride(src),
  dialog,
  startItems: START_INVENTORY,
  visibleRows: 10,
});

// ---- Battle ----
let pendingBattlePages   = null; // { win, lose, winEnding }
let partyVisible         = true;
let pendingEndingFadeIn  = false;

// ---- Encounter transition (画面が砕け散る) ----
let battleTransition = null; // { off, shards, startMs, duration, flashUntil, onDone }
const BT_COLS = 10, BT_ROWS = 8;
const BT_DURATION = 550;

function startBattleTransition(onDone) {
  // 現在のキャンバスをスナップショット
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
const ending = createEnding({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H });
const title  = createTitle({ BASE_W: CONFIG.BASE_W, BASE_H: CONFIG.BASE_H, input });

// ---- Save / Load ----
const SAVE_KEY = "rpg_save";
let saveNotice = null; // { text, until }

function saveGame() {
  const data = {
    mapId:          current.id,
    leaderX:        leader.x,
    leaderY:        leader.y,
    collectedItems: [...collectedItems],
    inventoryItems: inventory.getSnapshot(),
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
    inventory.resetItems(data.inventoryItems || []);
    loadMap(data.mapId || "outdoor", { spawnAt: { x: data.leaderX, y: data.leaderY } });
    saveNotice = { text: "LOADED", until: nowMs() + 1200 };
  } catch (e) {
    saveNotice = { text: "LOAD ERROR", until: nowMs() + 1200 };
  }
}

const battle = createBattleSystem({
  BASE_W: CONFIG.BASE_W,
  BASE_H: CONFIG.BASE_H,
  itemName,
  itemBgmSrc,
  itemThrowDmg,
  unlockBgm: () => bgmCtl.unlock(),
  setOverrideBgm: (src) => bgmCtl.setOverride(src),
  getFieldInventorySnapshot: () => inventory.getSnapshot(),
  onExitToField: (result) => {
    input.clear();
    bgmCtl.setOverride(null);
    const pages      = result === "win" ? pendingBattlePages?.win  : pendingBattlePages?.lose;
    const isEnding   = result === "win" && !!pendingBattlePages?.winEnding;
    pendingBattlePages = null;

    const triggerEnding = () => {
      bgmCtl.setOverride("about:blank");
      fade.startCutFade(nowMs(), {
        outMs:   220,
        holdMs:  3000,
        inMs:    160,
        onBlack: () => { setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H); partyVisible = false; loadMap("vj_room02", { isEnding: true }); },
        onEnd:   () => { pendingEndingFadeIn = true; },
      });
    };

    if (pages && pages.length) {
      setTimeout(() => dialog.open(pages, isEnding ? triggerEnding : null, "talk"), 1000);
    } else if (isEnding) {
      setTimeout(triggerEnding, 1000);
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
  const f = footBox(nx, ny);
  for (let y = f.y; y < f.y + f.h; y++) {
    for (let x = f.x; x < f.x + f.w; x++) {
      if (col.isWallAt(x, y)) return true;
    }
  }
  return false;
}
function hitNpc(nx, ny) {
  if (!actors.length) return false;
  const a = footBox(nx, ny);
  for (const act of actors) {
    if (!act.solid) continue;
    const b = footBox(act.x, act.y);
    if (hitRect(a, b)) return true;
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
  cam.x = Math.max(0, Math.min(maxX, cx));
  cam.y = Math.max(0, Math.min(maxY, cy));
}

// ---- Entry auto-walk ----
let autoWalk = null; // { dx, dy, frames }

// ---- Door warp ----
let doorCooldown = 0;
function doorCheck(t) {
  if (!mapReady || t < doorCooldown) return;
  if (inventory.isOpen()) return;
  if (battle.isActive()) return;
  if (dialog.isActive()) return;
  if (choice.isActive()) return;
  if (fade.isActive()) return;

  const f = footBox(leader.x, leader.y);
  const fx = (f.x + (f.w >> 1)) | 0;
  const fy = (f.y + (f.h >> 1)) | 0;

  const def = MAPS[current.id];
  for (const door of def.doors || []) {
    if (!door.trigger) continue;
    const tr = door.trigger;
    if (fx >= tr.x && fx < tr.x + tr.w && fy >= tr.y && fy < tr.y + tr.h) {
      doorCooldown = t + DOOR_COOLDOWN_MS;
      fade.startMapFade(door.to, { doorId: door.id }, t, loadMap);
      return;
    }
  }
}

// ---- Shrine trigger check ----
function shrineTriggerCheck() {
  if (!mapReady) return;
  const f  = footBox(leader.x, leader.y);
  const fx = (f.x + (f.w >> 1)) | 0;
  const fy = (f.y + (f.h >> 1)) | 0;
  const inZone = col.getZone(fx, fy) === "shrine";

  if (inZone !== shrineTriggerActive) {
    shrineTriggerActive = inZone;
    shrineMode = inZone;
    playSuzu();
    bgmCtl.audio.volume = inZone ? 0 : 0.35;
  }
}

// ---- Load map ----
function loadMap(id, opt = null) {
  mapReady = false;
  current.id = id;

  inventory.close();

  const def = MAPS[id];
  if (!def) throw new Error("Unknown map: " + id);

  let bgOK = false,
    colOK = false;

  function done() {
    if (!bgOK || !colOK) return;

    current.bgW = bgImg.naturalWidth | 0;
    current.bgH = bgImg.naturalHeight | 0;

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

    if (def.waterColor) buildWaterMask(bgImg, def.waterColor);
    else waterMaskCanvas = null;

    spawnActorsForMap(current.id);

    if (opt?.isEnding) {
      // partyVisible/pendingEndingFadeIn は startCutFade の onBlack/onEnd で設定済み
      // BGM は about:blank override で無音のまま維持
    } else if (def.bgmSrc) {
      bgmCtl.setMap(def.bgmSrc);
    } else {
      bgmCtl.setMap(bgmCtl.getMapSrc());
    }

    followers.reset({ leader, p2, p3, p4 });
    updateCam();
    mapReady = true;
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
  bgShrineImg.src      = def.bgShrineSrc    || "";
  bgShrineTopImg.src   = def.bgShrineTopSrc || "";
  shrineMode = false;
  shrineFade = 0;
  shrineTriggerActive = false;

  col.load(def.colSrc, () => {
    colOK = true;
    done();
  });
}

// ---- Draw ----
function drawSprite(img, f, x, y) {
  if (!img) {
    if (DEBUG) {
      ctx.strokeStyle = "#f00";
      ctx.strokeRect((x - cam.x) | 0, (y - cam.y) | 0, SPR, SPR);
    }
    return;
  }
  if (img.naturalWidth <= 0) return;
  ctx.drawImage(img, (f * SPR) | 0, 0, SPR, SPR, (x - cam.x) | 0, (y - cam.y) | 0, SPR, SPR);
}


function draw() {
  // フレーム先頭でコンテキスト状態をリセット（ブラー防止）
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // UIオーバーレイcanvasをリセット
  const uc = uiCtx ?? ctx;
  if (uiCtx) {
    uiCtx.setTransform(1, 0, 0, 1, 0, 0);
    uiCtx.globalAlpha = 1;
    uiCtx.imageSmoothingEnabled = false;
    uiCtx.clearRect(0, 0, CONFIG.BASE_W, CONFIG.BASE_H);
  }

  // タイトル画面
  if (title.isActive()) {
    const tt = typeof performance !== "undefined" ? performance.now() : Date.now();
    title.draw(ctx, tt);
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

    fade.draw(uc);
    return;
  }

  if (battle.isActive()) {
    battle.draw(uc);
    return;
  }

  // ★ここは見た目用なので performance.now() でもOK（ゲーム進行の時間とは別）
  const tt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  sea.draw(ctx, tt, cam, canvas.width, canvas.height);

  // ベースレイヤー：shrine完全移行後はbgImgを省略して描画コスト削減
  if (shrineFade >= 1) {
    if (bgShrineImg.complete && bgShrineImg.naturalWidth > 0)
      ctx.drawImage(bgShrineImg, -(cam.x | 0), -(cam.y | 0));
  } else {
    if (bgImg.complete && bgImg.naturalWidth > 0)
      ctx.drawImage(bgImg, -(cam.x | 0), -(cam.y | 0));
    drawWaterSea(ctx, tt);
    if (shrineFade > 0 && bgShrineImg.complete && bgShrineImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = shrineFade;
      ctx.drawImage(bgShrineImg, -(cam.x | 0), -(cam.y | 0));
      ctx.restore();
    }
  }

  const list = [];
  if (partyVisible) {
    const followerAlpha = 1 - shrineFade;
    list.push(
      { img: p4.img, x: p4.x, y: p4.y, frame: p4.frame, alpha: followerAlpha },
      { img: p3.img, x: p3.x, y: p3.y, frame: p3.frame, alpha: followerAlpha },
      { img: p2.img, x: p2.x, y: p2.y, frame: p2.frame, alpha: followerAlpha },
      { img: leader.img, x: leader.x, y: leader.y, frame: leader.frame },
    );
  }
  for (const act of actors) {
    if (act.hidden) continue;
    list.push({ img: act.img, x: act.x, y: act.y, frame: act.frame });
  }

  list.sort((a, b) => a.y - b.y);
  list.forEach((o) => {
    if (o.alpha !== undefined && o.alpha < 1) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, o.alpha);
      drawSprite(o.img, o.frame, o.x, o.y);
      ctx.restore();
    } else {
      drawSprite(o.img, o.frame, o.x, o.y);
    }
  });

  // トップレイヤー：同様に完全移行後は shrine 側のみ
  if (shrineFade >= 1) {
    if (bgShrineTopImg.complete && bgShrineTopImg.naturalWidth > 0)
      ctx.drawImage(bgShrineTopImg, -(cam.x | 0), -(cam.y | 0));
  } else {
    if (bgTopImg.complete && bgTopImg.naturalWidth > 0)
      ctx.drawImage(bgTopImg, -(cam.x | 0), -(cam.y | 0));
    if (shrineFade > 0 && bgShrineTopImg.complete && bgShrineTopImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = shrineFade;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bgShrineTopImg, -(cam.x | 0), -(cam.y | 0));
      ctx.restore();
    }
  }

  inventory.draw(uc);
  dialog.draw(uc);
  choice.draw(uc);
  ending.draw(uc, tt);
  fade.draw(uc);

  // デバッグ：座標表示
  if (DEBUG) {
    const coord = `${leader.x | 0},${leader.y | 0}`;
    ctx.save();
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(2, 2, ctx.measureText(coord).width + 4, 12);
    ctx.fillStyle = "#fff";
    ctx.fillText(coord, 4, 3);
    ctx.restore();
  }

  // セーブ/ロード通知
  if (saveNotice && tt < saveNotice.until) {
    const alpha = Math.min(1, (saveNotice.until - tt) / 300);
    uc.save();
    uc.globalAlpha = alpha;
    uc.font = "normal 10px PixelMplus10";
    uc.textBaseline = "top";
    uc.fillStyle = "#000";
    uc.fillRect(CONFIG.BASE_W - 70, 4, 66, 14);
    uc.strokeStyle = "#fff";
    uc.strokeRect(CONFIG.BASE_W - 70 + 0.5, 4.5, 65, 13);
    uc.fillStyle = "#fff";
    const tw = uc.measureText(saveNotice.text).width;
    uc.fillText(saveNotice.text, (CONFIG.BASE_W - 70 + (66 - tw) / 2) | 0, 6);
    uc.restore();
  }
}

// ---- Update ----
function updateNpcAnim(t) {
  for (const act of actors) {
    const ms = act.animMs ?? NPC_FRAME_MS;
    if (t - (act.last | 0) > ms) {
      act.frame ^= 1;
      act.last = t;
    }
  }
}

// ★ここを t を受け取る形にする
function tryInteract(t) {
  if (dialog.isActive()) return;
  if (choice.isActive()) return;
  if (fade.isActive()) return;
  if (inventory.isOpen()) return;
  if (battle.isActive()) return;

  const a = talkBoxLeader();

  for (let i = 0; i < actors.length; i++) {
    const act = actors[i];
    const b = talkRectActor(act);
    if (!hitRect(a, b)) continue;

    if (act.kind === "npc") {
      const handled = runNpcEvent(act, {
        nowMs, // ★重要：rAFのtを渡す（freeze防止）
        choice,
        dialog,
        fade,
        sprites: SPRITES,
        party: { leader, p2, p3, p4 },
      });
      if (handled) return;

      if (act.battleTrigger) {
        pendingBattlePages = {
          win:        act.battleWinPages  || null,
          lose:       act.battleLosePages || null,
          winEnding:  !!act.battleWinEnding,
        };
        dialog.open(act.talkPages || [["……"]], () => {
          startBattleTransition(() => {
            bgmCtl.unlock();
            bgmCtl.setOverride(BATTLE_BGM_SRC);
            battle.start(input);
          });
        }, act.talkType ?? "talk");
      } else {
        dialog.open(act.talkPages || [["……"]], null, act.talkType ?? "talk");
      }
      return;
    }

    if (act.kind === "pickup") {
      const id = act.itemId;
      if (!id) return;

      collectedItems.add(id);
      inventory.addItem(id);

      actors.splice(i, 1);

      const name = itemName(id);
      dialog.open([[`${name} をてにいれた。`]], null, "sign");
      return;
    }
  }
}

function update(t) {
  // タイトル画面
  if (title.isActive()) {
    title.update();
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
      collectedItems.clear();
      inventory.resetItems([]);
      loadMap("outdoor");
      setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
      title.start({
        onNewGame()  { setGameResolution(BASE_W, BASE_H); collectedItems.clear(); inventory.resetItems([]); loadMap("outdoor"); },
        onContinue() { setGameResolution(BASE_W, BASE_H); loadGame(); },
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

  // inventory
  if (inventory.isOpen()) {
    inventory.update();
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for (const act of actors) act.frame = 0;
    updateCam();
    return;
  }

  // field
  if (input.consume("x")) inventory.toggle();
  if (input.consume("z")) tryInteract(t); // ★tを渡す

  // セーブ / ロード
  if (input.consume("s")) { saveGame(); return; }
  if (input.consume("l")) { loadGame(); return; }

  // デバッグ：D キーで vj_room02 に即移動
  if (DEBUG && input.consume("d")) {
    setGameResolution(CONFIG.BASE_W, CONFIG.BASE_H);
    partyVisible = false;
    loadMap("vj_room02", { isEnding: true });
    pendingEndingFadeIn = true;
  }

  if (!mapReady) {
    updateCam();
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

  doorCheck(t);
  shrineTriggerCheck();

  // shrine フェードアニメ
  if (shrineMode && shrineFade < 1) shrineFade = Math.min(1, shrineFade + SHRINE_FADE_SPEED);
  else if (!shrineMode && shrineFade > 0) shrineFade = Math.max(0, shrineFade - SHRINE_FADE_SPEED);

  updateCam();
}

// ---- Loop ----
// マップを事前ロードしてからタイトル表示
loadMap("outdoor");
title.start({
  onNewGame() {
    setGameResolution(BASE_W, BASE_H);
    collectedItems.clear();
    inventory.resetItems([]);
    loadMap("outdoor");
  },
  onContinue() {
    setGameResolution(BASE_W, BASE_H);
    loadGame();
  },
});

if (MOBILE) setupMobileController(input);

// ---- UIオーバーレイcanvas ----
{
  const uiEl = document.createElement("canvas");
  uiEl.width  = CONFIG.BASE_W;
  uiEl.height = CONFIG.BASE_H;
  uiEl.style.cssText = "pointer-events:none;image-rendering:pixelated;image-rendering:crisp-edges;";

  if (MOBILE) {
    // #screen-wrap (padding:20px 0) の中にゲームcanvasがある
    const sw = document.getElementById("screen-wrap");
    sw.style.position = "relative";
    uiEl.style.cssText += "position:absolute;top:20px;left:0;width:100%;height:auto;";
    sw.appendChild(uiEl);
  } else {
    // desktop: ゲームcanvasをrelativeラッパーで囲む
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;display:inline-block;line-height:0;";
    canvas.parentNode.insertBefore(wrap, canvas);
    wrap.appendChild(canvas);
    uiEl.style.cssText += "position:absolute;top:0;left:0;width:100%;height:100%;";
    wrap.appendChild(uiEl);
  }

  uiCtx = uiEl.getContext("2d");
  uiCtx.imageSmoothingEnabled = false;
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