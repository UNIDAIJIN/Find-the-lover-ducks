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

const DEBUG = false;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const { BASE_W, BASE_H, SCALE, SPR, SPEED, FRAME_MS, GAP2, GAP3, GAP4, NPC_FRAME_MS, DOOR_COOLDOWN_MS, MAP_FADE_OUT_MS, MAP_FADE_IN_MS } = CONFIG;

canvas.width = BASE_W;
canvas.height = BASE_H;
canvas.style.width = BASE_W * SCALE + "px";
canvas.style.height = BASE_H * SCALE + "px";

const input = createInput();

function nowMs() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}


// UI / FX
const dialog = createDialog({ BASE_W, BASE_H, input });
const choice = createChoice({ BASE_W, BASE_H, input });
const fade = createFade({ BASE_W, BASE_H, input, mapOutMs: MAP_FADE_OUT_MS, mapInMs: MAP_FADE_IN_MS });

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
const bgImg    = new Image();
const bgTopImg = new Image();
const col = makeColStore();

// ---- Water sea overlay (color-masked) ----
const seaTempCanvas = document.createElement("canvas");
seaTempCanvas.width  = BASE_W;
seaTempCanvas.height = BASE_H;
const seaTempCtx = seaTempCanvas.getContext("2d");
let waterMaskCanvas = null;

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
  seaTempCtx.clearRect(0, 0, BASE_W, BASE_H);
  sea.draw(seaTempCtx, t, cam, BASE_W, BASE_H);
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
  BASE_W,
  BASE_H,
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
let pendingBattlePages = null; // { win, lose }

const battle = createBattleSystem({
  BASE_W,
  BASE_H,
  itemName,
  itemBgmSrc,
  itemThrowDmg,
  unlockBgm: () => bgmCtl.unlock(),
  setOverrideBgm: (src) => bgmCtl.setOverride(src),
  getFieldInventorySnapshot: () => inventory.getSnapshot(),
  onExitToField: (result) => {
    input.clear();
    bgmCtl.setOverride(null);
    const pages = result === "win"
      ? pendingBattlePages?.win
      : pendingBattlePages?.lose;
    pendingBattlePages = null;
    if (pages && pages.length) dialog.open(pages, null, "talk");
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
  return (
    col.isWallAt(f.x, f.y) ||
    col.isWallAt(f.x + f.w - 1, f.y) ||
    col.isWallAt(f.x, f.y + f.h - 1) ||
    col.isWallAt(f.x + f.w - 1, f.y + f.h - 1)
  );
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
  const maxX = Math.max(0, (current.bgW | 0) - BASE_W);
  const maxY = Math.max(0, (current.bgH | 0) - BASE_H);
  const cx = leader.x + 8 - BASE_W / 2;
  const cy = leader.y + 8 - BASE_H / 2;
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

    if (opt && opt.doorId != null) {
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

    if (def.bgmSrc) bgmCtl.setMap(def.bgmSrc);
    else bgmCtl.setMap(bgmCtl.getMapSrc());

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
  bgTopImg.src = def.bgTopSrc || "";

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
  ctx.clearRect(0, 0, BASE_W, BASE_H);

  if (battle.isActive()) {
    battle.draw(ctx);
    return;
  }

  // ★ここは見た目用なので performance.now() でもOK（ゲーム進行の時間とは別）
  const tt = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  sea.draw(ctx, tt, cam, BASE_W, BASE_H);

  if (bgImg.complete && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, -(cam.x | 0), -(cam.y | 0));
  }

  drawWaterSea(ctx, tt);

  const list = [
    { img: p4.img, x: p4.x, y: p4.y, frame: p4.frame },
    { img: p3.img, x: p3.x, y: p3.y, frame: p3.frame },
    { img: p2.img, x: p2.x, y: p2.y, frame: p2.frame },
    { img: leader.img, x: leader.x, y: leader.y, frame: leader.frame },
  ];
  for (const act of actors) list.push({ img: act.img, x: act.x, y: act.y, frame: act.frame });

  list.sort((a, b) => a.y - b.y);
  list.forEach((o) => drawSprite(o.img, o.frame, o.x, o.y));

  if (bgTopImg.complete && bgTopImg.naturalWidth > 0) {
    ctx.drawImage(bgTopImg, -(cam.x | 0), -(cam.y | 0));
  }

  inventory.draw(ctx);

  dialog.draw(ctx);
  choice.draw(ctx);
  fade.draw(ctx);
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
          win:  act.battleWinPages  || null,
          lose: act.battleLosePages || null,
        };
        dialog.open(act.talkPages || [["……"]], () => {
          bgmCtl.unlock();
          bgmCtl.setOverride(BATTLE_BGM_SRC);
          battle.start(input);
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
  // fade 最優先
  if (fade.isActive()) {
    fade.update(t, () => mapReady);
    updateCam();
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
  updateCam();
}

// ---- Loop ----
loadMap("outdoor");

if (!window.__rpgLoopStarted) {
  window.__rpgLoopStarted = true;

  function loop(t) {
    update(t);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

if (DEBUG) {
  window.__bgm = bgmCtl.audio;
  bgmCtl.audio.addEventListener("error", () => console.log("BGM error", bgmCtl.audio.src));
}