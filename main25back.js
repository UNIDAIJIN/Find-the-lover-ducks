// ===== imports =====
import { SPRITES } from "./sprites.js";
import { MAPS, DOOR_ID_TO_INDOOR } from "./maps.js";
import { makeColStore, scanMarkers } from "./col.js";
import { START_INVENTORY, itemName, itemBgmSrc } from "./items.js";
import { PICKUPS_BY_MAP } from "./pickups.js";

// ===== HTML RPG CORE (256x240 fixed) + 4 PARTY + BGM + RGB COL + INSTANT FADE + INVENTORY =====

const DEBUG = false;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// ---- Fixed resolution ----
const BASE_W = 256;
const BASE_H = 240;
const SCALE = 3;

canvas.width = BASE_W;
canvas.height = BASE_H;
canvas.style.width = BASE_W * SCALE + "px";
canvas.style.height = BASE_H * SCALE + "px";

// ---- Constants ----
const SPR = 16;
const SPEED = 1;
const FRAME_MS = 180;
const GAP2 = 30;
const GAP3 = 60;
const GAP4 = 90;

// ---- Instant Fade (black cut) ----
const FADE_PRE_MS  = 90;
const FADE_POST_MS = 60;
let fadeActive = false;
let fadePhase = 0; // 0=pre, 1=waiting load, 2=post
let fadeUntil = 0;
let fadeNextMap = null;
let fadeNextOpt = null;

function startFade(nextMapId, nextOpt, nowMs){
  fadeActive = true;
  fadePhase = 0;
  fadeUntil = nowMs + FADE_PRE_MS;
  fadeNextMap = nextMapId;
  fadeNextOpt = nextOpt;
  keys.clear();
}

function updateFade(t){
  if (!fadeActive) return;

  if (fadePhase === 0) {
    if (t >= fadeUntil) {
      fadePhase = 1;
      const nm = fadeNextMap;
      const no = fadeNextOpt;
      fadeNextMap = null;
      fadeNextOpt = null;
      if (nm) loadMap(nm, no);
    }
    return;
  }

  if (fadePhase === 1) {
    if (mapReady) {
      fadePhase = 2;
      fadeUntil = t + FADE_POST_MS;
    }
    return;
  }

  if (fadePhase === 2) {
    if (t >= fadeUntil) {
      fadeActive = false;
      fadePhase = 0;
    }
    return;
  }
}

// ---- BGM (map + override) ----
const bgm = new Audio();
// window.__BGM = bgm; // デバッグ用。必要ならDEBUGで
bgm.loop = true;
bgm.volume = 0.35;
bgm.preload = "auto";

let bgmUnlocked = false;

// エリア標準BGM / アイテム上書きBGM
let mapBgmSrc = "assets/audio/bgm0.mp3"; // デフォルト
let overrideBgmSrc = null;

// いま再生してるsrc（同じなら張り替えない）
let currentBgmSrc = null;

function desiredBgmSrc(){
  return overrideBgmSrc || mapBgmSrc;
}

// 差し替えを確実に効かせる版（ログ無し）
function applyBgm(src){
  if(!src) return;

  // 同じsrcなら、止まってる時だけ再生を試す
  if(currentBgmSrc === src){
    if(bgmUnlocked && bgm.paused){
      bgm.play().catch(()=>{});
    }
    return;
  }

  currentBgmSrc = src;

  try{
    bgm.pause();
    bgm.src = src;
    bgm.load();
    bgm.currentTime = 0;

    if(bgmUnlocked){
      bgm.play().catch(()=>{});
    }
  }catch(_e){
    // 無音で握りつぶす（必要ならDEBUGでwarn）
    // if(DEBUG) console.warn("applyBgm failed:", _e, src);
  }
}

function setMapBgm(src){
  mapBgmSrc = src || mapBgmSrc;
  overrideBgmSrc = null;          // エリア移動で上書き解除
  applyBgm(desiredBgmSrc());
}

function setOverrideBgm(src){
  overrideBgmSrc = src || null;
  applyBgm(desiredBgmSrc());
}

// 最初のユーザー操作でアンロック
function unlockBgm(){
  if(bgmUnlocked) return;
  bgmUnlocked = true;
  applyBgm(desiredBgmSrc());
}

["pointerdown","keydown","touchstart"].forEach(ev=>{
  window.addEventListener(ev, unlockBgm, { once:true });
});

const bgImg = new Image();
const col = makeColStore();

// ---- Current map ----
const current = {
  id:"outdoor",
  bgW:0,bgH:0,
  markers:{
    spawn:null,
    outdoorDoor:new Map(),
    indoorDoor:new Map(),
    indoorEntry:new Map()
  }
};

let mapReady = false;
let followersReady = false;

// ---- Party ----
const leader={x:0,y:0,frame:0,last:0,dir:{x:0,y:1},img: SPRITES.p1};
const p2={x:0,y:0,frame:0,last:0,img: SPRITES.p2};
const p3={x:0,y:0,frame:0,last:0,img: SPRITES.p3};
const p4={x:0,y:0,frame:0,last:0,img: SPRITES.p4};

// ---- Actors (NPC / Pickup) ----
let actors = [];

// 既に拾ったもの（同じものを復活させない）
const collectedItems = new Set();

// NPCアニメ速度：半分（= 2倍遅い）
const NPC_FRAME_MS = FRAME_MS * 2;

// 会話判定：プレイヤーは16x16（スプライトサイズ）で判定する
function talkBoxLeader(){
  return { x: leader.x, y: leader.y, w: SPR, h: SPR };
}
// actor側は talkHit を使う（actorごとに調整可能）
function talkRectActor(a){
  const th = a.talkHit || { x:0, y:0, w:SPR, h:SPR };
  return { x: a.x + (th.x|0), y: a.y + (th.y|0), w: (th.w|0), h: (th.h|0) };
}

function pickupSpriteFor(itemId){
  if(itemId === "rubber_duck_H") return SPRITES.duck_red;
  return SPRITES.duck;
}

function spawnActorsForMap(mapId){
  actors = [];

  // ---- NPC ----
  if(mapId === "indoor_01"){
    const baseY = 150;

    actors.push(
      {
        kind: "npc",
        name: "ricky",
        x: 120, y: baseY,
        frame: 0, last: 0,
        img: SPRITES.ricky,
        talkHit: { x: 0, y: 0, w: 16, h: 14 },
        talkPages: [
          ["……", "お、きたな。"],
          ["ここは indoor_01。", "外より静かだろ。"],
        ],
        solid: true,
        animMs: NPC_FRAME_MS,
      },
      {
        kind: "npc",
        name: "ohara",
        x: 140, y: baseY,
        frame: 0, last: 0,
        img: SPRITES.ohara,
        talkHit: { x: 0, y: 0, w: 16, h: 14 },
        talkPages: [
          ["……"],
          ["オハラだよ。"],
        ],
        solid: true,
        animMs: NPC_FRAME_MS,
      },
      {
        kind: "npc",
        name: "minami",
        x: 160, y: baseY,
        frame: 0, last: 0,
        img: SPRITES.minami,
        talkHit: { x: 0, y: 0, w: 16, h: 14 },
        talkPages: [
          ["……"],
          ["ミナミです。"],
        ],
        solid: true,
        animMs: NPC_FRAME_MS,
      }
    );
  }

  // ---- Pickup（DB：pickups.js から生成）----
  const list = PICKUPS_BY_MAP?.[mapId] || [];
  for(const p of list){
    const itemId = p?.itemId;
    if(!itemId) continue;
    if(collectedItems.has(itemId)) continue;

    actors.push({
      kind: "pickup",
      name: "pickup",
      itemId,
      x: p.x|0,
      y: p.y|0,
      frame: 0, last: 0,
      img: pickupSpriteFor(itemId),
      talkHit: { x: 0, y: 0, w: 16, h: 16 },
      solid: true,
      animMs: NPC_FRAME_MS,
    });
  }
}

// ---- Followers (ring buffer) ----
const MAX_FOOT = 4096; // 余裕。必要なら増やす（GAP4より十分大きく）

const foot = new Array(MAX_FOOT);
let footW = 0; // write index
let footN = 0; // count (<= MAX_FOOT)

function footPush(x, y){
  foot[footW] = { x, y };
  footW = (footW + 1) & (MAX_FOOT - 1); // MAX_FOOTは2^n前提
  if(footN < MAX_FOOT) footN++;
}

function footGetFromOldest(i){
  // i=0 が最古、i=footN-1 が最新
  const start = (footW - footN) & (MAX_FOOT - 1);
  const idx = (start + i) & (MAX_FOOT - 1);
  return foot[idx];
}

// MAX_FOOTを2^nに固定したいのでガード
if ((MAX_FOOT & (MAX_FOOT - 1)) !== 0) {
  throw new Error("MAX_FOOT must be power of two (e.g., 1024/2048/4096).");
}

function pushFoot(x,y){
  footPush(x,y);
}

// フォロワーは「最新から gap 分だけ古い位置」を参照する
function followerTarget(gap){
  const i = footN - 1 - gap;
  if(i < 0) return null;
  return footGetFromOldest(i);
}

function resetFoot(){
  footW = 0;
  footN = 0;

  // 充分な長さを埋めておく
  for(let i=0;i<GAP4+8;i++) footPush(leader.x, leader.y);

  p2.x=p3.x=p4.x=leader.x;
  p2.y=p3.y=p4.y=leader.y;
  p2.frame=p3.frame=p4.frame=0;
  followersReady=true;
}

function stepFollower(t, gap, c){
  const p = followerTarget(gap);
  if(!p) return;

  if(c.x!==p.x || c.y!==p.y){
    c.x=p.x; c.y=p.y;
    if(t-c.last>FRAME_MS){ c.frame^=1; c.last=t; }
  }else{
    c.frame=0;
  }
}

// ---- Input ----
const keys=new Set();
addEventListener("keydown",e=>{
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)){
    e.preventDefault(); keys.add(e.key);
    return;
  }

  if(e.key === "z" || e.key === "Z"){
    e.preventDefault();

    if(inventoryOpen){
      inventoryConfirmUse();
      return;
    }

    tryTalkOrAdvance();
    return;
  }

  if(e.key === "x" || e.key === "X"){
    e.preventDefault();
    toggleInventory();
    return;
  }
});

addEventListener("keyup",e=>keys.delete(e.key));

// ---- Inventory (two-column) ----
let inventoryOpen = false;

const INVENTORY_VISIBLE_ROWS = 10;
const INVENTORY_VISIBLE = INVENTORY_VISIBLE_ROWS * 2;

const inventory = {
  items: [...START_INVENTORY],
  cursor: 0,
  scrollRow: 0,
};

function openInventory(){
  if (dialogActive) return;
  inventoryOpen = true;
  keys.clear();

  const n = inventory.items.length|0;
  if(n <= 0){
    inventory.cursor = 0;
    inventory.scrollRow = 0;
    return;
  }

  inventory.cursor = Math.max(0, Math.min(n - 1, inventory.cursor|0));
  const row = (inventory.cursor >> 1);
  inventory.scrollRow = Math.max(0, Math.min(row, inventory.scrollRow|0));
  clampInventoryScroll();
}

function closeInventory(){
  inventoryOpen = false;
  keys.clear();
}

function toggleInventory(){
  if (inventoryOpen) closeInventory();
  else openInventory();
}

function clampInventoryScroll(){
  const n = inventory.items.length|0;
  const maxRow = Math.max(0, ((n - 1) >> 1));
  const maxScrollRow = Math.max(0, maxRow - INVENTORY_VISIBLE_ROWS + 1);
  inventory.scrollRow = Math.max(0, Math.min(inventory.scrollRow|0, maxScrollRow));
}

function inventoryMoveCursorTo(idx){
  const n = inventory.items.length|0;
  if(n <= 0){
    inventory.cursor = 0;
    inventory.scrollRow = 0;
    return;
  }
  inventory.cursor = Math.max(0, Math.min(n - 1, idx|0));

  const row = (inventory.cursor >> 1);
  if(row < inventory.scrollRow) inventory.scrollRow = row;
  if(row >= inventory.scrollRow + INVENTORY_VISIBLE_ROWS) inventory.scrollRow = row - INVENTORY_VISIBLE_ROWS + 1;
  clampInventoryScroll();
}

function updateInventoryInput(){
  const n = inventory.items.length|0;

  if(keys.has("x") || keys.has("X")){
    keys.delete("x"); keys.delete("X");
    closeInventory();
    return;
  }

  if(n <= 0){
    keys.delete("ArrowUp"); keys.delete("ArrowDown"); keys.delete("ArrowLeft"); keys.delete("ArrowRight");
    return;
  }

  if(keys.has("ArrowUp")){
    keys.delete("ArrowUp");
    inventoryMoveCursorTo(inventory.cursor - 2);
  }

  if(keys.has("ArrowDown")){
    keys.delete("ArrowDown");
    inventoryMoveCursorTo(inventory.cursor + 2);
  }

  if(keys.has("ArrowLeft")){
    keys.delete("ArrowLeft");
    if((inventory.cursor & 1) === 1){
      inventoryMoveCursorTo(inventory.cursor - 1);
    }
  }

  if(keys.has("ArrowRight")){
    keys.delete("ArrowRight");
    if((inventory.cursor & 1) === 0 && inventory.cursor + 1 < n){
      inventoryMoveCursorTo(inventory.cursor + 1);
    }
  }
}

function inventoryConfirmUse(){
  const n = inventory.items.length|0;
  if(n <= 0) return;

  const id = inventory.items[inventory.cursor|0];
  const name = itemName(id);

  const src = itemBgmSrc(id);
  if(src){
    unlockBgm();
    setOverrideBgm(src);
  }

  closeInventory();
  openDialog([[`${name} をつかった。`]]);
}

// ---- Dialog ----
let dialogActive = false;
let dialogPages = [];
let dialogIndex = 0;
let dialogOnClose = null; // ★追加

function openDialog(pages, onClose=null){
  dialogActive = true;
  dialogPages = pages;
  dialogIndex = 0;
  dialogOnClose = (typeof onClose === "function") ? onClose : null; // ★
  keys.clear();
}

function closeDialog(){
  dialogActive = false;
  dialogPages = [];
  dialogIndex = 0;

  const cb = dialogOnClose;   // ★
  dialogOnClose = null;       // ★
  if(cb) cb();                // ★
}

function advanceDialog(){
  dialogIndex++;
  if(dialogIndex >= dialogPages.length){
    closeDialog();
  }
}

function hitRect(a,b){
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function tryTalkOrAdvance(){
  if(dialogActive){
    advanceDialog();
    return;
  }

  const a = talkBoxLeader();

  for(let i=0;i<actors.length;i++){
    const act = actors[i];
    const b = talkRectActor(act);

    if(!hitRect(a,b)) continue;

    if(act.kind === "npc"){
      openDialog(act.talkPages || [["……"]]);
      return;
    }

    if(act.kind === "pickup"){
      const id = act.itemId;
      if(!id) return;

      collectedItems.add(id);
      inventory.items.push(id);

      inventory.cursor = Math.max(0, inventory.items.length - 1);
      inventory.scrollRow = (inventory.cursor >> 1);
      clampInventoryScroll();

      actors.splice(i,1);

      const name = itemName(id);
      openDialog([[`${name} をてにいれた。`]]);
      return;
    }
  }
}

// ---- Collision ----
function footBox(x,y){ return { x:x+3, y:y+10, w:10, h:6 }; }

function hitBg(nx,ny){
  const f=footBox(nx,ny);
  return (
    col.isWallAt(f.x,          f.y) ||
    col.isWallAt(f.x+f.w-1,    f.y) ||
    col.isWallAt(f.x,          f.y+f.h-1) ||
    col.isWallAt(f.x+f.w-1,    f.y+f.h-1)
  );
}

function hitNpc(nx, ny){
  if(!actors.length) return false;
  const a = footBox(nx, ny);

  for(const act of actors){
    if(!act.solid) continue;
    const b = footBox(act.x, act.y);
    if(hitRect(a,b)) return true;
  }
  return false;
}

// ---- Camera ----
const cam={x:0,y:0};
function updateCam(){
  const maxX = Math.max(0, (current.bgW|0) - BASE_W);
  const maxY = Math.max(0, (current.bgH|0) - BASE_H);
  const cx = Math.floor(leader.x+8-BASE_W/2);
  const cy = Math.floor(leader.y+8-BASE_H/2);
  cam.x = Math.max(0, Math.min(maxX, cx));
  cam.y = Math.max(0, Math.min(maxY, cy));
}

// ---- Door warp (fade) ----
let doorCooldown=0;
function doorCheck(t){
  if(!mapReady||t<doorCooldown) return;
  if(inventoryOpen) return;

  const f=footBox(leader.x,leader.y);
  const {r,g,b}=col.read((f.x+(f.w>>1))|0,(f.y+(f.h>>1))|0);

  if(current.id==="outdoor" && r===255 && g===0 && b>0){
    const next = DOOR_ID_TO_INDOOR[b|0];
    if(!next) return;
    doorCooldown=t+220;
    startFade(next, {mode:"in", id:(b|0)}, t);
    return;
  }

  if(current.id!=="outdoor" && r===0 && g===255 && b>0){
    doorCooldown=t+220;
    startFade("outdoor", {mode:"out", id:(b|0)}, t);
    return;
  }
}

// ---- Load map ----
function loadMap(id,opt=null){
  mapReady=false;
  followersReady=false;
  current.id=id;

  inventoryOpen = false;
  dialogActive = false;

  const def=MAPS[id];
  if(!def) throw new Error("Unknown map: "+id);

  let bgOK=false,colOK=false;
  function done(){
    if(!bgOK||!colOK) return;

    current.bgW=bgImg.naturalWidth|0;
    current.bgH=bgImg.naturalHeight|0;

    current.markers = scanMarkers(col);

    let sx=current.bgW>>1, sy=current.bgH>>1;

    if(opt&&opt.mode==="in"){
      const p=current.markers.indoorEntry.get(opt.id)||current.markers.indoorDoor.get(opt.id);
      if(p){sx=p.x;sy=p.y;}
    }else if(opt&&opt.mode==="out"){
      const p=current.markers.outdoorDoor.get(opt.id);
      if(p){sx=p.x;sy=p.y;}
    }else if(current.markers.spawn){
      sx=current.markers.spawn.x; sy=current.markers.spawn.y;
    }

    leader.x=sx; leader.y=sy;
    leader.frame=0; leader.last=0;

    spawnActorsForMap(current.id);

    if(def.bgmSrc){
      setMapBgm(def.bgmSrc);
    }else{
      setMapBgm(mapBgmSrc);
    }

    resetFoot();
    updateCam();
    mapReady=true;
  }

  bgImg.onload=()=>{bgOK=true;done();};
  bgImg.onerror=()=>{bgOK=true;done();};
  bgImg.src=def.bgSrc;

  col.load(def.colSrc,()=>{colOK=true;done();});
}

// ---- Draw ----
function drawSprite(img, f, x, y){
  if(!img){
    if(DEBUG){
      ctx.strokeStyle = "#f00";
      ctx.strokeRect(((x-cam.x)|0), ((y-cam.y)|0), SPR, SPR);
    }
    return;
  }

  if(img.naturalWidth <= 0) return;

  ctx.drawImage(
    img,
    ((f*SPR)|0), 0, SPR, SPR,
    ((x-cam.x)|0), ((y-cam.y)|0), SPR, SPR
  );
}

function drawDialogBox(lines){
  const pad = 10;
  const boxH = 70;
  const x = 8;
  const y = BASE_H - boxH - 8;
  const w = BASE_W - 16;
  const h = boxH;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);

  ctx.fillStyle = "#fff";
  ctx.font = "10px PixelMplus10";
  ctx.textBaseline = "top";

  for(let i=0;i<lines.length;i++){
    ctx.fillText(lines[i], x + pad, y + pad + i*16);
  }

  ctx.fillText("▶", x + w - 18, y + h - 20);
}

function drawInventoryWindow(){
  const x = 8;
  const y = 8;
  const w = BASE_W - 16;
  const h = (BASE_H>>1);

  const pad = 10;
  const titleY = y + pad;
  const listY = y + pad + 16;

  const colGap = 14;
  const col0X = x + pad + 12;
  const colW = Math.floor((w - pad*2 - 12 - colGap) / 2);
  const col1X = col0X + colW + colGap;

  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);

  ctx.fillStyle = "#fff";
  ctx.font = "10px PixelMplus10";
  ctx.textBaseline = "top";

  ctx.fillText("もちもの", x + pad, titleY);

  const n = inventory.items.length | 0;
  if(n <= 0){
    ctx.fillText("(なし)", x + pad, listY);
    return;
  }

  const startIdx = (inventory.scrollRow|0) * 2;
  const endIdx = Math.min(n, startIdx + INVENTORY_VISIBLE);

  for(let idx = startIdx; idx < endIdx; idx++){
    const row = ((idx - startIdx) >> 1);
    const colN = (idx & 1);
    const yy = listY + row * 12;

    const name = itemName(inventory.items[idx]);
    const xx = (colN === 0) ? col0X : col1X;
    const arrowX = (colN === 0) ? (x + pad) : (x + pad + colW + colGap);

    if(idx === inventory.cursor){
      ctx.fillText("▶", arrowX, yy);
    }
    ctx.fillText(name, xx, yy);
  }
}

function draw(){
  ctx.clearRect(0,0,BASE_W,BASE_H);

  if(bgImg.complete && bgImg.naturalWidth>0){
    ctx.drawImage(bgImg,-cam.x,-cam.y);
  }

  const list = [
    { img: p4.img,     x:p4.x,     y:p4.y,     frame:p4.frame },
    { img: p3.img,     x:p3.x,     y:p3.y,     frame:p3.frame },
    { img: p2.img,     x:p2.x,     y:p2.y,     frame:p2.frame },
    { img: leader.img, x:leader.x, y:leader.y, frame:leader.frame },
  ];
  for(const act of actors){
    list.push({ img: act.img, x: act.x, y: act.y, frame: act.frame });
  }
  list.sort((a,b)=>a.y-b.y);
  list.forEach(o=>drawSprite(o.img,o.frame,o.x,o.y));

  if(dialogActive){
    drawDialogBox(dialogPages[dialogIndex]);
  }
  if(inventoryOpen){
    drawInventoryWindow();
  }

  if(fadeActive){
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,BASE_W,BASE_H);
  }
}

// ---- Update ----
function updateNpcAnim(t){
  for(const act of actors){
    const ms = act.animMs ?? NPC_FRAME_MS;
    if(t - (act.last|0) > ms){
      act.frame ^= 1;
      act.last = t;
    }
  }
}

function update(t){
  if(fadeActive){
    updateFade(t);
    updateCam();
    return;
  }

  if(inventoryOpen){
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for(const act of actors){ act.frame = 0; }

    updateInventoryInput();
    updateCam();
    return;
  }

  if(dialogActive){
    leader.frame = 0;
    p2.frame = p3.frame = p4.frame = 0;
    for(const act of actors){ act.frame = 0; }
    updateCam();
    return;
  }

  if(!mapReady){
    updateCam();
    return;
  }

  updateNpcAnim(t);

  let dx=0,dy=0;
  if(keys.has("ArrowLeft")) dx=-SPEED;
  else if(keys.has("ArrowRight")) dx=SPEED;
  else if(keys.has("ArrowUp")) dy=-SPEED;
  else if(keys.has("ArrowDown")) dy=SPEED;

  const nx=leader.x+dx, ny=leader.y+dy;

  if(dx||dy){
    if(!hitBg(nx,ny) && !hitNpc(nx,ny)){
      leader.x=nx; leader.y=ny;
      pushFoot(nx,ny);
      if(t-leader.last>FRAME_MS){leader.frame^=1;leader.last=t;}
    }
  }else{
    leader.frame=0;
  }

  if(followersReady){
  stepFollower(t, GAP2, p2);
  stepFollower(t, GAP3, p3);
  stepFollower(t, GAP4, p4);
}

  doorCheck(t);
  updateCam();
}

// ---- Loop ----
loadMap("outdoor");
function loop(t){
  update(t);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// デバッグ用のフック（必要なら）
if(DEBUG){
  window.__bgm = bgm;
  bgm.addEventListener("error", () => console.log("BGM error", bgm.src));
}