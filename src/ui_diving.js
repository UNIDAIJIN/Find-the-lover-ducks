// ui_diving.js — DEEP DIVE minigame (vanilla JS, no React)
import { controlPrompt } from "./control_prompts.js";
import { STATE } from "./state.js";
import { playCoin, playCursor, playConfirm, playBuzzer, playSpearShot, playDiveHit, playDiveResult } from "./se.js";

const TILE = 28;
const COLS = 14;
const GRAVITY = 0.8;
const BASE_SWIM = -5;
const BASE_SPEED = 5.6;
const MAX_FALL = 10;

const ZONES = [
  { name: "浅層", ds: 0, de: 8, rate: 0.08, dark: 0, col: "#1a6b8a" },
  { name: "中層", ds: 8, de: 20, rate: 0.15, dark: 0.3, col: "#0d3f5e" },
  { name: "深層", ds: 20, de: 35, rate: 0.28, dark: 0.6, col: "#061a2e" },
  { name: "最深部", ds: 35, de: 999, rate: 0.4, dark: 0.85, col: "#020a14" },
];

const ITEMS_DB = [
  { name: "かいがら", emoji: "◇", spriteKey: "dive_kaigara", minD: 0, maxD: 6, val: 15, rare: 0.6 },
  { name: "ヒトデ", emoji: "☆", spriteKey: "dive_hitode", minD: 0, maxD: 8, val: 25, rare: 0.5 },
  { name: "サンゴ", emoji: "▽", spriteKey: "dive_sango", minD: 3, maxD: 10, val: 50, rare: 0.4 },
  { name: "しんじゅ", emoji: "○", spriteKey: "dive_shinju", minD: 8, maxD: 18, val: 150, rare: 0.3 },
  { name: "コイン", emoji: "●", spriteKey: "dive_coin", minD: 10, maxD: 22, val: 280, rare: 0.18 },
  { name: "こはく", emoji: "◆", spriteKey: "dive_kohaku", minD: 15, maxD: 26, val: 450, rare: 0.15 },
  { name: "くろしんじゅ", emoji: "★", spriteKey: "dive_kuroshinju", minD: 20, maxD: 32, val: 900, rare: 0.12 },
  { name: "こだいのぞう", emoji: "▲", spriteKey: "dive_kodaizo", minD: 25, maxD: 40, val: 1600, rare: 0.08 },
  { name: "しんかいほうせき", emoji: "◎", spriteKey: "dive_houseki", minD: 35, maxD: 999, val: 3000, rare: 0.06 },
  { name: "りゅうのなみだ", emoji: "♦", spriteKey: "dive_ryunonamida", minD: 37, maxD: 999, val: 6000, rare: 0.03 },
];

const UPG = [
  { id: "tank", name: "タンク", desc: "酸素量UP", bc: 50, cm: 1.5, mx: 15, fn: l => 100 + l * 45 },
  { id: "fin", name: "フィン", desc: "速度UP", bc: 40, cm: 1.7, mx: 8, fn: l => BASE_SPEED + l * 0.8 },
  { id: "light", name: "ライト", desc: "視界UP", bc: 60, cm: 1.8, mx: 8, fn: l => 80 + l * 30 },
  { id: "spear", name: "モリ", desc: "本数UP", bc: 70, cm: 2.0, mx: 6, fn: l => 1 + l },
  { id: "swim", name: "泳力", desc: "上昇力UP", bc: 80, cm: 1.6, mx: 8, fn: l => Math.abs(BASE_SWIM) + l * 0.8 },
];

function genMap() {
  const rows = 120;
  const map = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(c === 0 || c === COLS - 1 ? 1 : 0);
    map.push(row);
  }
  let oL = 2, oR = COLS - 3;
  for (let r = 3; r < rows - 3; r++) {
    if (Math.random() < 0.3) oL += Math.random() < 0.5 ? 1 : -1;
    if (Math.random() < 0.3) oR += Math.random() < 0.5 ? 1 : -1;
    oL = Math.max(1, Math.min(oL, COLS / 2 - 2));
    oR = Math.min(COLS - 2, Math.max(oR, COLS / 2 + 1));
    const row = [];
    for (let c = 0; c < COLS; c++) {
      if (c <= oL || c >= oR) row.push(1);
      else if (Math.random() < 0.1 && c > oL + 1 && c < oR - 1) row.push(1);
      else row.push(0);
    }
    map.push(row);
  }
  for (let r = rows - 3; r < rows - 1; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(c === 0 || c === COLS - 1 ? 1 : 0);
    map.push(row);
  }
  const floorRow = [];
  for (let c = 0; c < COLS; c++) floorRow.push(1);
  map.push(floorRow);
  return { map, rows };
}

function placeEnts(map, rows) {
  const items = [], jelly = [], urchins = [], currents = [];
  const seabedStart = rows - 3;
  for (let r = 4; r < rows; r++) {
    if (r >= seabedStart) continue;
    const dz = Math.floor(r / 3);
    for (let c = 1; c < COLS - 1; c++) {
      if (map[r][c] !== 0) continue;
      const el = ITEMS_DB.filter(i => dz >= i.minD && dz <= i.maxD);
      if (el.length > 0 && Math.random() < 0.045) {
        const it = el[Math.floor(Math.random() * el.length)];
        if (Math.random() < it.rare) {
          items.push({ ...it, x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, col: false, bp: Math.random() * Math.PI * 2 });
        }
      }
      if (dz > 4 && Math.random() < 0.008 + dz * 0.002) {
        jelly.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2, bx: c * TILE + TILE / 2, ph: Math.random() * Math.PI * 2, sp: 0.3 + Math.random() * 0.5, rng: 30 + Math.random() * 30, alive: true });
      }
      if (map[r][c] === 0 && r + 1 < rows && map[r + 1][c] === 1 && Math.random() < 0.04) {
        urchins.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE - 4 });
      }
    }
    if (dz > 6 && Math.random() < 0.02) {
      currents.push({ x: Math.floor(COLS / 2) * TILE, y: r * TILE, w: (COLS - 4) * TILE, h: TILE * 2, dir: Math.random() < 0.5 ? -1 : 1, str: 1 + Math.random() * 1.5 });
    }
  }
  const treasureX = Math.floor(COLS / 2) * TILE + TILE / 2;
  const treasureY = (rows - 2) * TILE + TILE / 2;
  items.push({
    name: "おうかん", emoji: "W", spriteKey: "dive_treasure", val: 8000, rare: 1, minD: 0, maxD: 999,
    x: treasureX, y: treasureY, col: false, bp: 0, isTreasure: true,
  });
  return { items, jelly, urchins, currents };
}

function getSave() {
  const f = STATE.flags;
  return {
    money: STATE.money | 0,
    dives: f.diveDives || 0,
    bestDepth: f.diveBestDepth || 0,
    upg: {
      tank: f.diveUpgTank || 0,
      fin: f.diveUpgFin || 0,
      light: f.diveUpgLight || 0,
      spear: f.diveUpgSpear || 0,
      swim: f.diveUpgSwim || 0,
    },
  };
}

function writeSave(g) {
  STATE.money = Math.min(g.money | 0, 999999);
  STATE.flags.diveDives = g.dives;
  STATE.flags.diveBestDepth = g.bestDepth;
  STATE.flags.diveUpgTank = g.upg.tank;
  STATE.flags.diveUpgFin = g.upg.fin;
  STATE.flags.diveUpgLight = g.upg.light;
  STATE.flags.diveUpgSpear = g.upg.spear;
  STATE.flags.diveUpgSwim = g.upg.swim;
}

export const DIVE_W = 576;
export const DIVE_H = 540;

const DIVE_ICONS = ["dive_tank", "dive_fin", "dive_light", "dive_spear", "dive_swim", "dive_go"];

export function createDiving({ BASE_W: _origW, BASE_H: _origH, input, getLeaderImg, getHeadwearImg, sprites, mobile = false }) {
  const BASE_W = DIVE_W;
  const BASE_H = DIVE_H;
  let phase = "idle";
  let onEnd = null;
  let g = null;
  let frame = 0;

  function initGame() {
    const s = getSave();
    return {
      state: "title",
      money: s.money,
      dives: s.dives,
      bestDepth: s.bestDepth,
      upg: { ...s.upg },
      map: [], mapRows: 0, player: null, cam: { y: 0 },
      oxy: 100, maxOxy: 100, items: [], collected: [],
      spears: 0, maxSpears: 1, jelly: [], urchins: [], currents: [],
      particles: [], bubbles: [], sproj: [], result: null,
      surfY: 0, resTimer: 0, flashT: 0, flashC: null, spearCDTimer: 0,
      bestDepthSession: s.bestDepth, currentMaxDepth: 0, newRecordTimer: 0,
      pickingUp: null, heartbeat: 0,
      shopCursor: UPG.length, shopConfirm: false, sonarSweep: 0,
      helpPage: 0,
    };
  }

  function start(cb) {
    onEnd = cb;
    phase = "active";
    g = initGame();
    frame = 0;
  }

  function isActive() { return phase !== "idle"; }

  function exitToField() {
    if (g) writeSave(g);
    phase = "idle";
    g = null;
    if (typeof onEnd === "function") onEnd();
    onEnd = null;
  }

  function startDive() {
    const { map, rows } = genMap();
    const ents = placeEnts(map, rows);
    g.maxOxy = UPG[0].fn(g.upg.tank); g.oxy = g.maxOxy;
    g.maxSpears = UPG[3].fn(g.upg.spear); g.spears = g.maxSpears;
    g.map = map; g.mapRows = rows;
    g.items = ents.items; g.jelly = ents.jelly; g.urchins = ents.urchins; g.currents = ents.currents;
    g.collected = []; g.sproj = []; g.particles = []; g.bubbles = [];
    g.surfY = 2 * TILE;
    g.player = { x: (COLS / 2) * TILE, y: g.surfY, vx: 0, vy: 0, w: 16, h: 20, f: 1 };
    g.cam.y = 0; g.state = "diving"; g.dives++; input.clear();
    g.spearCDTimer = 0; g.currentMaxDepth = 0; g.newRecordTimer = 0;
    g.pickingUp = null; g.heartbeat = 0;
    writeSave(g);
  }

  function endDive(ok) {
    let kept = [], lost = [];
    if (ok) {
      kept = [...g.collected];
    } else if (g.collected.length > 0) {
      const candidates = g.collected.filter(it => !it.isTreasure);
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        kept = [pick];
        lost = g.collected.filter(it => it !== pick);
      } else {
        lost = [...g.collected];
      }
    }
    const earn = kept.reduce((s, i) => s + i.val, 0);
    const lostVal = lost.reduce((s, i) => s + i.val, 0);
    g.money += earn;
    const newRecord = g.currentMaxDepth > g.bestDepth;
    if (newRecord) g.bestDepth = g.currentMaxDepth;
    g.result = { ok, kept, lost, earn, lostVal, depth: g.currentMaxDepth, newRecord };
    g.state = "result"; g.resTimer = 0; input.clear();
    playDiveResult(ok);
    writeSave(g);
  }

  function colX(p, map, rows) {
    const l = Math.floor((p.x - p.w / 2) / TILE), r = Math.floor((p.x + p.w / 2) / TILE);
    const t = Math.floor((p.y - p.h / 2) / TILE), b = Math.floor((p.y + p.h / 2) / TILE);
    for (let rr = t; rr <= b; rr++) for (let cc = l; cc <= r; cc++) {
      if (rr < 0 || rr >= rows || cc < 0 || cc >= COLS) continue;
      if (map[rr][cc] === 1) {
        if (p.vx > 0) p.x = cc * TILE - p.w / 2 - 0.1;
        else if (p.vx < 0) p.x = (cc + 1) * TILE + p.w / 2 + 0.1;
        p.vx = 0;
      }
    }
  }

  function colY(p, map, rows) {
    const l = Math.floor((p.x - p.w / 2) / TILE), r = Math.floor((p.x + p.w / 2) / TILE);
    const t = Math.floor((p.y - p.h / 2) / TILE), b = Math.floor((p.y + p.h / 2) / TILE);
    for (let rr = t; rr <= b; rr++) for (let cc = l; cc <= r; cc++) {
      if (rr < 0 || rr >= rows || cc < 0 || cc >= COLS) continue;
      if (map[rr][cc] === 1) {
        if (p.vy > 0) { p.y = rr * TILE - p.h / 2 - 0.1; p.vy = 0; }
        else if (p.vy < 0) { p.y = (rr + 1) * TILE + p.h / 2 + 0.1; p.vy = 0; }
      }
    }
  }

  function updateDive() {
    const p = g.player;
    const left = input.down("ArrowLeft");
    const right = input.down("ArrowRight");
    const up = input.down("ArrowUp") || input.down("z");
    const shoot = input.consume("x");

    const spd = UPG[1].fn(g.upg.fin);
    const sw = -UPG[4].fn(g.upg.swim);

    if (left) { p.vx = -spd; p.f = -1; }
    else if (right) { p.vx = spd; p.f = 1; }
    else p.vx *= 0.7;

    p.vy += GRAVITY * 0.4;
    if (up) p.vy = Math.max(p.vy + sw * 0.15, sw);
    p.vy = Math.min(p.vy, MAX_FALL);
    p.vy *= 0.92;

    if (g.spearCDTimer > 0) g.spearCDTimer--;
    if (shoot && g.spears > 0 && g.spearCDTimer <= 0) {
      g.sproj.push({ x: p.x, y: p.y, vx: 0, vy: 14, life: 35 });
      g.spears--; g.spearCDTimer = 18;
      playSpearShot();
    }

    p.x += p.vx; colX(p, g.map, g.mapRows);
    p.y += p.vy; colY(p, g.map, g.mapRows);

    g.cam.y += ((p.y - BASE_H * 0.4) - g.cam.y) * 0.1;

    const dr = Math.max(0, Math.floor(p.y / TILE));
    const z = ZONES.find(z => dr / 3 >= z.ds && dr / 3 < z.de) || ZONES[3];
    g.oxy -= z.rate;

    const depthM = Math.max(0, Math.floor((dr - 3) * 1.5));
    if (depthM > g.currentMaxDepth) {
      g.currentMaxDepth = depthM;
      if (depthM > g.bestDepth && depthM > 0 && depthM % 5 === 0) {
        g.newRecordTimer = 90;
      }
    }

    const oxyP = g.oxy / g.maxOxy;
    const targetBeat = oxyP < 0.35 ? (0.35 - oxyP) / 0.35 : 0;
    g.heartbeat += (targetBeat - g.heartbeat) * 0.05;
    if (g.newRecordTimer > 0) g.newRecordTimer--;

    if (Math.random() < 0.15) g.bubbles.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y - 16, s: 2 + Math.random() * 5, vy: -1 - Math.random() * 2, life: 50 });
    g.bubbles = g.bubbles.filter(b => { b.y += b.vy; b.x += Math.sin(b.life * 0.1) * 0.3; b.life--; return b.life > 0; });

    if (g.pickingUp) {
      g.pickingUp.t++;
      p.vx *= 0.5;
      if (g.pickingUp.t >= 18) {
        const it = g.pickingUp.item;
        it.col = true;
        g.collected.push(it);
        g.flashT = 8; g.flashC = "#ffdd44";
        playCoin();
        for (let i = 0; i < 4; i++) g.particles.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 18, c: "#ffdd44", s: 2 + Math.random() * 2 });
        g.pickingUp = null;
      }
    } else {
      g.items.forEach(it => {
        if (it.col) return;
        const dx = p.x - it.x, dy = p.y - it.y;
        if (Math.sqrt(dx * dx + dy * dy) < 18) {
          g.pickingUp = { item: it, t: 0 };
        }
      });
    }

    g.jelly.forEach(j => {
      if (!j.alive) return;
      j.ph += 0.02; j.x = j.bx + Math.sin(j.ph * j.sp) * j.rng; j.y -= Math.sin(j.ph * 0.5) * 0.15;
      const dx = p.x - j.x, dy = p.y - j.y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        g.oxy -= 8; g.flashT = 10; g.flashC = "#ff4444"; p.vy = -3; p.vx = (dx > 0 ? 1 : -1) * 4; playDiveHit();
        g.pickingUp = null;
        for (let i = 0; i < 4; i++) g.particles.push({ x: j.x, y: j.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 12, c: "#ff6688", s: 2 });
      }
    });

    g.urchins.forEach(u => {
      const dx = p.x - u.x, dy = p.y - u.y;
      if (Math.sqrt(dx * dx + dy * dy) < 16) { g.oxy -= 5; g.flashT = 8; g.flashC = "#ff4444"; p.vy = -4; g.pickingUp = null; playDiveHit(); }
    });

    g.currents.forEach(c => {
      if (p.x > c.x - c.w / 2 && p.x < c.x + c.w / 2 && p.y > c.y && p.y < c.y + c.h)
        p.vx += c.dir * c.str * 0.15;
    });

    g.sproj = g.sproj.filter(s => {
      s.x += s.vx; s.y += s.vy; s.life--;
      g.jelly.forEach(j => {
        if (!j.alive) return;
        if (Math.sqrt((s.x - j.x) ** 2 + (s.y - j.y) ** 2) < 18) {
          j.alive = false; s.life = 0;
          for (let i = 0; i < 4; i++) g.particles.push({ x: j.x, y: j.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 18, c: "#88ddff", s: 3 });
        }
      });
      const tc = Math.floor(s.x / TILE), tr = Math.floor(s.y / TILE);
      if (tc >= 0 && tc < COLS && tr >= 0 && tr < g.mapRows && g.map[tr][tc] === 1) s.life = 0;
      return s.life > 0;
    });

    g.particles = g.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; pt.vx *= 0.95; pt.vy *= 0.95; return pt.life > 0; });
    if (g.flashT > 0) g.flashT--;

    if (p.y <= g.surfY) endDive(true);
    if (g.oxy <= 0) { g.oxy = 0; endDive(false); }
  }

  function update() {
    if (phase !== "active" || !g) return;
    frame++;

    if (g.state === "title") {
      if (input.consume("z")) { g.state = "shop"; input.clear(); }
      if (input.consume("x")) { g.state = "help"; g.helpPage = 0; input.clear(); playCursor(); }
      return;
    }
    if (g.state === "help") {
      if (input.consume("ArrowLeft")) { g.helpPage = (g.helpPage + 2) % 3; playCursor(); }
      if (input.consume("ArrowRight")) { g.helpPage = (g.helpPage + 1) % 3; playCursor(); }
      if (input.consume("z") || input.consume("x")) { g.state = "title"; input.clear(); playCursor(); }
      return;
    }
    if (g.state === "shop") {
      const upCount = UPG.length;
      if (input.down("ArrowUp")) { if (!g._upHeld) { g.shopCursor = (g.shopCursor - 1 + upCount + 1) % (upCount + 1); g._upHeld = true; playCursor(); } } else g._upHeld = false;
      if (input.down("ArrowDown")) { if (!g._dnHeld) { g.shopCursor = (g.shopCursor + 1) % (upCount + 1); g._dnHeld = true; playCursor(); } } else g._dnHeld = false;
      g.sonarSweep += 0.03;

      if (input.consume("z")) {
        if (g.shopCursor < upCount) {
          const u = UPG[g.shopCursor];
          const lv = g.upg[u.id], cost = Math.floor(u.bc * Math.pow(u.cm, lv));
          if (lv < u.mx && g.money >= cost) {
            g.money -= cost; g.upg[u.id]++;
            writeSave(g);
            playConfirm();
          } else {
            playBuzzer();
          }
        } else {
          playConfirm();
          startDive();
        }
      }

      if (input.consume("x")) { exitToField(); return; }
      return;
    }
    if (g.state === "diving") {
      updateDive();
      return;
    }
    if (g.state === "result") {
      g.resTimer++;
      if (input.consume("z") && g.resTimer > 30) { g.state = "shop"; g.resTimer = 0; }
      return;
    }
  }

  function draw(ctx) {
    if (phase !== "active" || !g) return;
    ctx.save();

    if (g.state === "title") drawTitle(ctx);
    else if (g.state === "help") drawHelp(ctx);
    else if (g.state === "shop") drawShop(ctx);
    else if (g.state === "diving") drawDiveScene(ctx);
    else if (g.state === "result") drawResult(ctx);

    ctx.restore();
  }

  function drawTitle(ctx) {
    ctx.fillStyle = "#0a1a2a";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    for (let i = 0; i < 10; i++) {
      const bx = (Math.sin(frame * 0.01 + i * 1.3) * 0.5 + 0.5) * BASE_W;
      const by = BASE_H - ((frame * 0.3 + i * 30) % (BASE_H + 15));
      ctx.globalAlpha = 0.25; ctx.fillStyle = "#88ccff";
      ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#44ddff";
    ctx.font = '28px PixelMplus10'; ctx.textAlign = "center";
    ctx.fillText("DEEP DIVE", BASE_W / 2, BASE_H * 0.35);
    ctx.fillStyle = "#6688aa"; ctx.font = '20px PixelMplus10';
    ctx.fillText("しんかいたんさくダイビング", BASE_W / 2, BASE_H * 0.35 + 28);
    ctx.fillStyle = "#aaccdd"; ctx.font = '20px PixelMplus10';
    if (Math.sin(frame * 0.05) > 0) ctx.fillText(controlPrompt("z", { mobile }) + "でスタート", BASE_W / 2, BASE_H * 0.6);
    ctx.fillStyle = "#6688aa"; ctx.font = '16px PixelMplus10';
    ctx.fillText(controlPrompt("x", { mobile }) + "であそびかた", BASE_W / 2, BASE_H * 0.6 + 34);
  }

  function drawHelp(ctx) {
    ctx.fillStyle = "#061425";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#44ddff";
    ctx.font = '24px PixelMplus10';
    ctx.fillText("あそびかた", BASE_W / 2, 48);

    const tabs = ["そうさ", "てき", "たからもの"];
    ctx.font = '16px PixelMplus10';
    for (let i = 0; i < tabs.length; i++) {
      const x = BASE_W / 2 - 116 + i * 116;
      ctx.fillStyle = i === g.helpPage ? "#ffdd44" : "#6688aa";
      ctx.fillText((i === g.helpPage ? ">" : " ") + tabs[i] + (i === g.helpPage ? "<" : " "), x, 82);
    }

    ctx.textAlign = "left";
    if (g.helpPage === 0) drawHelpControls(ctx);
    else if (g.helpPage === 1) drawHelpEnemies(ctx);
    else drawHelpTreasures(ctx);

    ctx.textAlign = "center";
    ctx.fillStyle = "#6688aa";
    ctx.font = '16px PixelMplus10';
    ctx.fillText("← → ページ  " + controlPrompt("x", { mobile }) + "/" + controlPrompt("z", { mobile }) + " もどる", BASE_W / 2, BASE_H - 28);
  }

  function drawHelpControls(ctx) {
    const rows = [
      [controlPrompt("move", { mobile }), "左右にいどう"],
      [controlPrompt("z", { mobile }), "上へおよぐ・けってい"],
      [controlPrompt("x", { mobile }), "モリをうつ・もどる"],
      ["水面", "上まで戻るともちかえり"],
      ["酸素0", "一部をのこしてロスト"],
    ];
    drawHelpRows(ctx, rows, 122);
  }

  function drawHelpEnemies(ctx) {
    drawHelpIconRow(ctx, "dive_jelly", "~", "クラゲ", "ふれると酸素ダメージ。モリで倒せる", 128, "#cc88ff");
    drawHelpIconRow(ctx, "dive_urchin", "*", "ウニ", "岩の上にいる。ふれると酸素ダメージ", 184, "#aa6644");
    drawHelpIconRow(ctx, null, ">>>", "海流", "横に流される。深い場所ほど出やすい", 240, "#88ddff");
  }

  function drawHelpTreasures(ctx) {
    const rows = [
      ["dive_kaigara", "◇", "かいがら", "15EN"],
      ["dive_hitode", "☆", "ヒトデ", "25EN"],
      ["dive_sango", "▽", "サンゴ", "50EN"],
      ["dive_shinju", "○", "しんじゅ", "150EN"],
      ["dive_coin", "●", "コイン", "280EN"],
      ["dive_kohaku", "◆", "こはく", "450EN"],
      ["dive_kuroshinju", "★", "くろしんじゅ", "900EN"],
      ["dive_kodaizo", "▲", "こだいのぞう", "1600EN"],
      ["dive_houseki", "◎", "しんかいほうせき", "3000EN"],
      ["dive_ryunonamida", "♦", "りゅうのなみだ", "6000EN"],
      ["dive_treasure", "W", "おうかん", "8000EN"],
    ];
    for (let i = 0; i < rows.length; i++) {
      const [spr, fallback, name, value] = rows[i];
      const y = 112 + i * 34;
      if (!drawSpr(ctx, spr, 172, y - 5, spr === "dive_treasure" ? 28 : 18)) {
        ctx.fillStyle = "#aaddff"; ctx.font = '16px PixelMplus10'; ctx.textAlign = "center"; ctx.fillText(fallback, 172, y);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#e8f6ff"; ctx.font = '16px PixelMplus10'; ctx.fillText(name, 200, y);
      ctx.fillStyle = "#ffdd44"; ctx.font = '15px PixelMplus10'; ctx.fillText(value, 370, y);
    }
  }

  function drawHelpRows(ctx, rows, startY) {
    ctx.font = '18px PixelMplus10';
    rows.forEach(([key, desc], i) => {
      const y = startY + i * 42;
      ctx.fillStyle = "#ffdd44";
      ctx.fillText(key, 134, y);
      ctx.fillStyle = "#e8f6ff";
      ctx.fillText(desc, 232, y);
    });
  }

  function drawHelpIconRow(ctx, spr, fallback, name, desc, y, color) {
    if (!spr || !drawSpr(ctx, spr, 148, y - 8, 30)) {
      ctx.fillStyle = color; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center"; ctx.fillText(fallback, 148, y);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffdd44"; ctx.font = '18px PixelMplus10'; ctx.fillText(name, 182, y - 8);
    ctx.fillStyle = "#e8f6ff"; ctx.font = '16px PixelMplus10'; ctx.fillText(desc, 182, y + 16);
  }

  function drawShop(ctx) {
    ctx.fillStyle = "#0a1220"; ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.fillStyle = "#ffdd44"; ctx.font = '20px PixelMplus10';
    ctx.fillText(g.money + " EN", BASE_W / 2, 60);
    ctx.fillStyle = "#6688aa";
    ctx.fillText("ダイブ:" + g.dives + (g.bestDepth > 0 ? "  最深:-" + g.bestDepth + "m" : ""), BASE_W / 2, 82);

    const cx = BASE_W / 2, cy = 280, R = 140;
    const total = UPG.length + 1;

    ctx.strokeStyle = "#1a3a2a"; ctx.lineWidth = 1;
    for (let r = 1; r <= 3; r++) { ctx.beginPath(); ctx.arc(cx, cy, R * r / 3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

    const sw = g.sonarSweep % (Math.PI * 2);
    const grad = ctx.createConicalGradient ? null : null;
    ctx.save();
    ctx.globalAlpha = 0.15; ctx.fillStyle = "#44ff88";
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sw - 0.5, sw); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = "#44ff88"; ctx.lineWidth = 2; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); ctx.stroke();
    ctx.restore();

    for (let i = 0; i < total; i++) {
      const a = -Math.PI / 2 + ((i + 1) / total) * Math.PI * 2;
      const dist = R * 0.6;
      const bx = cx + Math.cos(a) * dist;
      const by = cy + Math.sin(a) * dist;
      const sel = g.shopCursor === i;
      const isDive = i >= UPG.length;

      let diff = sw - a; while (diff < 0) diff += Math.PI * 2; while (diff > Math.PI * 2) diff -= Math.PI * 2;
      const freshness = diff < Math.PI ? 1 - diff / Math.PI : 0;
      const alpha = sel ? 1 : 0.3 + freshness * 0.5;

      ctx.save(); ctx.globalAlpha = alpha;
      const iconKey = DIVE_ICONS[i];
      const icon = sprites && sprites[iconKey];
      const hasIcon = icon && icon.naturalWidth > 0;
      if (sel) {
        const D = 32;
        ctx.strokeStyle = "#88ffbb"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, 20 + Math.sin(frame * 0.1) * 2, 0, Math.PI * 2); ctx.stroke();
        if (hasIcon) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(icon, (bx - D / 2) | 0, (by - D / 2) | 0, D, D);
          ctx.imageSmoothingEnabled = true;
        } else {
          ctx.fillStyle = isDive ? "#44ffaa" : "#44ff88";
          ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "#fff"; ctx.font = '14px PixelMplus10'; ctx.textAlign = "center";
        ctx.fillText(isDive ? "DIVE!" : UPG[i].name, bx, by - 24);
      } else {
        ctx.fillStyle = "#22aa44";
        ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    ctx.textAlign = "center"; ctx.font = '20px PixelMplus10';
    if (g.shopCursor < UPG.length) {
      const u = UPG[g.shopCursor];
      const lv = g.upg[u.id], cost = Math.floor(u.bc * Math.pow(u.cm, lv));
      ctx.fillStyle = "#44ff88";
      ctx.fillText(u.name + "  Lv." + lv + " — " + u.desc, cx, cy + R + 30);
      if (lv >= u.mx) { ctx.fillStyle = "#66aa66"; ctx.fillText("MAX", cx, cy + R + 54); }
      else { ctx.fillStyle = g.money >= cost ? "#ffdd44" : "#664422"; ctx.fillText(cost + " EN", cx, cy + R + 54); }
    } else {
      ctx.fillStyle = "#44ffaa";
      ctx.fillText("しんかいへ！", cx, cy + R + 30);
    }

    ctx.fillStyle = "#556677"; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center";
    ctx.fillText(controlPrompt("x", { mobile }) + ":もどる", BASE_W / 2, BASE_H - 20);
  }

  function drawSpr(ctx, key, x, y, size) {
    const img = sprites && sprites[key];
    if (img && img.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, (x - size / 2) | 0, (y - size / 2) | 0, size, size);
      ctx.imageSmoothingEnabled = true;
      return true;
    }
    return false;
  }

  function drawDiveScene(ctx) {
    const p = g.player, cy = g.cam.y;
    const ox = (BASE_W - COLS * TILE) / 2;
    const dr = Math.max(0, Math.floor(p.y / TILE));
    const z = ZONES.find(z => dr / 3 >= z.ds && dr / 3 < z.de) || ZONES[3];

    ctx.fillStyle = z.col;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.fillStyle = "#2a3a4a";
    ctx.fillRect(0, 0, ox, BASE_H);
    ctx.fillRect(ox + COLS * TILE, 0, ox, BASE_H);

    const sr = Math.max(0, Math.floor(cy / TILE) - 1);
    const er = Math.min(g.mapRows - 1, Math.floor((cy + BASE_H) / TILE) + 1);
    const wallImg = sprites && sprites.dive_wall;
    const hasWallImg = wallImg && wallImg.naturalWidth > 0;
    if (hasWallImg) ctx.imageSmoothingEnabled = false;
    for (let r = sr; r <= er; r++) for (let c = 0; c < COLS; c++) {
      if (g.map[r] && g.map[r][c] === 1) {
        const tx = ox + c * TILE, ty = r * TILE - cy;
        if (hasWallImg) ctx.drawImage(wallImg, tx | 0, ty | 0, TILE, TILE);
        else { ctx.fillStyle = "#2a3a4a"; ctx.fillRect(tx | 0, ty | 0, TILE, TILE); }
      }
    }
    if (hasWallImg) ctx.imageSmoothingEnabled = true;

    g.currents.forEach(c => {
      const ccy = c.y - cy;
      if (ccy > -c.h && ccy < BASE_H) {
        ctx.globalAlpha = 0.15; ctx.fillStyle = "#44aaff";
        ctx.fillRect(ox + c.x - c.w / 2, ccy, c.w, c.h);
        ctx.globalAlpha = 0.5; ctx.fillStyle = "#88ddff"; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center";
        ctx.fillText(c.dir > 0 ? ">>>" : "<<<", ox + c.x, ccy + c.h / 2 + 3); ctx.globalAlpha = 1;
      }
    });

    g.items.forEach(it => {
      if (it.col) return;
      const ix = ox + it.x, iy = it.y - cy + Math.sin(frame * 0.05 + it.bp) * 3;
      if (iy < -20 || iy > BASE_H + 20) return;
      if (it.isTreasure) {
        const pulse = (Math.sin(frame * 0.08) + 1) / 2;
        ctx.globalAlpha = 0.3 + pulse * 0.2;
        ctx.fillStyle = "#ffdd44";
        ctx.beginPath(); ctx.arc(ix, iy, 16, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        if (!drawSpr(ctx, "dive_treasure", ix, iy, 32)) {
          ctx.fillStyle = "#ffdd44"; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center";
          ctx.fillText(it.emoji, ix, iy + 3);
        }
      } else {
        if (!it.spriteKey || !drawSpr(ctx, it.spriteKey, ix, iy, 16)) {
          ctx.fillStyle = "#aaddff"; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center";
          ctx.fillText(it.emoji, ix, iy + 3);
        }
      }
    });

    g.urchins.forEach(u => {
      const ux = ox + u.x, uy = u.y - cy;
      if (uy < -8 || uy > BASE_H + 8) return;
      if (!drawSpr(ctx, "dive_urchin", ux, uy, 32)) {
        ctx.fillStyle = "#aa6644"; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center";
        ctx.fillText("*", ux, uy + 3);
      }
    });

    g.jelly.forEach(j => {
      if (!j.alive) return;
      const jx = ox + j.x, jy = j.y - cy + Math.sin(frame * 0.08 + j.ph);
      if (jy < -10 || jy > BASE_H + 10) return;
      if (!drawSpr(ctx, "dive_jelly", jx, jy, 32)) {
        ctx.fillStyle = "#cc88ff"; ctx.font = '20px PixelMplus10'; ctx.textAlign = "center";
        ctx.fillText("~", jx, jy + 3);
      }
    });

    g.sproj.forEach(s => {
      const sx = ox + s.x, sy = s.y - cy;
      ctx.strokeStyle = "#ffaa44"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy - s.vy * 2); ctx.lineTo(sx, sy); ctx.stroke();
    });

    g.particles.forEach(pt => {
      ctx.globalAlpha = pt.life / 20; ctx.fillStyle = pt.c;
      ctx.beginPath(); ctx.arc(ox + pt.x, pt.y - cy, pt.s, 0, Math.PI * 2); ctx.fill();
    }); ctx.globalAlpha = 1;

    g.bubbles.forEach(b => {
      ctx.globalAlpha = b.life / 50 * 0.4; ctx.strokeStyle = "#aaddff"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(ox + b.x, b.y - cy, b.s, 0, Math.PI * 2); ctx.stroke();
    }); ctx.globalAlpha = 1;

    // Player
    const oxyRatio = g.oxy / g.maxOxy;
    const panic = oxyRatio <= 0.25;
    const pox = panic ? ((Math.sin(frame / 2.5) * 3) | 0) : 0;
    const poy = panic ? ((Math.sin(frame / 1.8) > 0 ? 1 : -1)) : 0;
    const px = ox + p.x + pox, py = p.y - cy + poy;
    const SPR = 16, DRAW = 32;
    const pf = panic ? Math.floor(frame / 4) % 2 : Math.floor(frame / 10) % 2;
    const leaderImg = typeof getLeaderImg === "function" ? getLeaderImg() : null;
    const hwImg = typeof getHeadwearImg === "function" ? getHeadwearImg() : null;
    if (leaderImg && leaderImg.naturalWidth > 0) {
      ctx.save();
      if (p.f < 0) { ctx.translate(px, py - DRAW / 2); ctx.scale(-1, 1); ctx.drawImage(leaderImg, pf * SPR, 0, SPR, SPR, -DRAW / 2, 0, DRAW, DRAW); }
      else { ctx.drawImage(leaderImg, pf * SPR, 0, SPR, SPR, (px - DRAW / 2) | 0, (py - DRAW / 2) | 0, DRAW, DRAW); }
      ctx.restore();
      if (hwImg && hwImg.naturalWidth > 0) {
        ctx.save();
        if (p.f < 0) { ctx.translate(px, py - DRAW / 2); ctx.scale(-1, 1); ctx.drawImage(hwImg, pf * SPR, 0, SPR, SPR, -DRAW / 2, 0, DRAW, DRAW); }
        else { ctx.drawImage(hwImg, pf * SPR, 0, SPR, SPR, (px - DRAW / 2) | 0, (py - DRAW / 2) | 0, DRAW, DRAW); }
        ctx.restore();
      }
    } else {
      ctx.fillStyle = "#ffcc44"; ctx.beginPath(); ctx.arc(px, py - 5, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2288cc"; ctx.fillRect(px - 5, py + 2, 10, 12);
    }
    if (panic) {
      const st = frame / 2.2;
      const s1x = px + ((Math.sin(st * 1.7) * 10) | 0);
      const s1y = py - 12 + ((Math.cos(st * 2.1) * 8) | 0);
      const s2x = px + ((Math.cos(st * 1.3) * 10) | 0);
      const s2y = py - 8 + ((Math.sin(st * 1.9) * 8) | 0);
      ctx.fillStyle = "#88ddff"; ctx.globalAlpha = 0.8;
      ctx.fillRect(s1x, s1y, 3, 6); ctx.fillRect(s1x + 4, s1y + 2, 3, 6);
      ctx.fillRect(s2x, s2y, 3, 6); ctx.fillRect(s2x + 4, s2y + 2, 3, 6);
      ctx.globalAlpha = 1;
    }

    if (g.pickingUp) {
      const it = g.pickingUp.item;
      const ix = ox + it.x, iy = it.y - cy;
      const prog = g.pickingUp.t / 18;
      ctx.strokeStyle = "#ffdd44"; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(ix, iy, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (z.dark > 0) {
      const lr = UPG[2].fn(g.upg.light);
      const lg = ctx.createRadialGradient(px, py, 0, px, py, lr);
      lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(0.7, `rgba(0,0,0,${z.dark * 0.3})`);
      lg.addColorStop(1, `rgba(0,0,0,${z.dark * 0.85})`);
      ctx.fillStyle = lg; ctx.fillRect(0, 0, BASE_W, BASE_H);
    }

    if (g.heartbeat > 0.05) {
      const beat = (Math.sin(frame * 0.25) + 1) / 2;
      const intensity = g.heartbeat * (0.5 + beat * 0.5);
      ctx.globalAlpha = intensity * 0.3;
      ctx.fillStyle = "#aa0000";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.globalAlpha = 1;
    }

    if (g.flashT > 0) { ctx.globalAlpha = g.flashT / 10 * 0.3; ctx.fillStyle = g.flashC; ctx.fillRect(0, 0, BASE_W, BASE_H); ctx.globalAlpha = 1; }

    // HUD — space-style O2 meter
    const op = g.oxy / g.maxOxy;
    const danger = op <= 0.25;
    const mcx = BASE_W >> 1;
    const mcy = 18;
    const lineW = 120;
    const lineH = 4;
    const lineX = mcx - (lineW >> 1);
    const lineY = mcy + 12;
    const fillW = Math.round(lineW * op);

    ctx.save();
    ctx.fillStyle = danger ? "rgba(255,80,80,0.35)" : "rgba(255,255,255,0.22)";
    ctx.fillRect(lineX, lineY, lineW, lineH);
    ctx.fillStyle = danger ? "#ff6060" : op > 0.5 ? "#44ddff" : "#ffaa44";
    ctx.fillRect(lineX, lineY, fillW, lineH);
    if (g.heartbeat > 0.1) {
      const bp = (Math.sin(frame * 0.25) + 1) / 2;
      ctx.globalAlpha = bp * g.heartbeat * 0.6; ctx.fillStyle = "#fff"; ctx.fillRect(lineX, lineY, fillW, lineH); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = danger ? "#ff8080" : "#ffffff";
    ctx.font = "20px PixelMplus10"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("O2", mcx, mcy);
    ctx.restore();

    ctx.font = '20px PixelMplus10'; ctx.textAlign = "left";
    const dm = Math.max(0, Math.floor((dr - 3) * 1.5));
    ctx.fillStyle = "#aaccdd";
    ctx.fillText(dm + "m " + z.name, 8, BASE_H - 36);
    ctx.fillText("モリx" + g.spears, 8, BASE_H - 14);
    if (g.bestDepth > 0) {
      ctx.fillStyle = "#88aacc"; ctx.textAlign = "right";
      ctx.fillText("ベスト:" + g.bestDepth + "m", BASE_W - 8, BASE_H - 14);
    }

    ctx.textAlign = "right"; ctx.fillStyle = "#ffdd44";
    ctx.fillText(g.collected.length + "個", BASE_W - 8, 28);
    if (g.collected.length > 0) {
      ctx.fillStyle = "#aaccdd";
      ctx.fillText("(" + g.collected.reduce((s, i) => s + i.val, 0) + "EN)", BASE_W - 8, 50);
    }

    if (g.newRecordTimer > 0) {
      const t = g.newRecordTimer;
      const fadeIn = t > 75 ? (90 - t) / 15 : t < 15 ? t / 15 : 1;
      ctx.globalAlpha = fadeIn;
      ctx.fillStyle = "#000000aa";
      ctx.fillRect(0, BASE_H * 0.35 - 14, BASE_W, 36);
      ctx.fillStyle = "#ffdd44"; ctx.textAlign = "center";
      ctx.fillText("最深記録更新 -" + g.currentMaxDepth + "m", BASE_W / 2, BASE_H * 0.35 + 8);
      ctx.globalAlpha = 1;
    }
  }

  function drawResultRow(ctx, it, text, y) {
    const ICON = 16, GAP = 4;
    const tw = ctx.measureText(text).width;
    const totalW = ICON + GAP + tw;
    const startX = BASE_W / 2 - totalW / 2;
    const drewIcon = it.spriteKey ? drawSpr(ctx, it.spriteKey, startX + ICON / 2, y - 8, ICON) : false;
    const prevAlign = ctx.textAlign;
    ctx.textAlign = "left";
    if (drewIcon) {
      ctx.fillText(text, startX + ICON + GAP, y);
    } else {
      ctx.fillText(it.emoji + " " + text, startX, y);
    }
    ctx.textAlign = prevAlign;
  }

  function drawResult(ctx) {
    const r = g.result;
    if (!r) return;
    ctx.fillStyle = r.ok ? "#0a1a0a" : "#1a0a0a";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.textAlign = "center"; ctx.font = '24px PixelMplus10';
    ctx.fillStyle = r.ok ? "#44ff88" : "#ff4444";
    ctx.fillText(r.ok ? "帰還成功！" : "酸素切れ...", BASE_W / 2, 50);

    ctx.font = '20px PixelMplus10';
    ctx.fillStyle = r.newRecord ? "#ffdd44" : "#88aacc";
    ctx.fillText("最深:-" + r.depth + "m" + (r.newRecord ? " 新記録!" : ""), BASE_W / 2, 78);

    ctx.fillStyle = "#fff";
    ctx.fillText("もちかえり:", BASE_W / 2, 110);
    if (r.kept.length === 0) { ctx.fillStyle = "#666"; ctx.fillText("なし", BASE_W / 2, 136); }
    else r.kept.forEach((it, i) => {
      const fa = Math.min(1, (g.resTimer - i * 8) / 12);
      if (fa <= 0) return;
      ctx.globalAlpha = fa; ctx.fillStyle = "#ffdd44";
      drawResultRow(ctx, it, it.name + " " + it.val + "EN", 136 + i * 26);
    });
    ctx.globalAlpha = 1;

    if (r.lost.length > 0) {
      const ly = 152 + r.kept.length * 26;
      ctx.fillStyle = "#ff6666";
      ctx.fillText("ロスト: -" + r.lostVal + "EN", BASE_W / 2, ly);
      const sorted = [...r.lost].sort((a, b) => b.val - a.val);
      const showCount = Math.min(3, sorted.length);
      for (let i = 0; i < showCount; i++) {
        ctx.fillStyle = i === 0 ? "#ff8888" : "#996666";
        drawResultRow(ctx, sorted[i], sorted[i].name + " -" + sorted[i].val + "EN", ly + 26 + i * 24);
      }
    }

    const ey = BASE_H - 90;
    ctx.fillStyle = "#ffdd44";
    ctx.fillText("+" + r.earn + " EN", BASE_W / 2, ey);
    ctx.fillStyle = "#aaccdd";
    ctx.fillText("所持金: " + g.money + " EN", BASE_W / 2, ey + 26);
    if (g.resTimer > 30 && Math.sin(frame * 0.05) > 0) {
      ctx.fillStyle = "#aaccdd";
      ctx.fillText(controlPrompt("z", { mobile }) + "でつづける", BASE_W / 2, BASE_H - 20);
    }
  }

  return { start, isActive, update, draw };
}
