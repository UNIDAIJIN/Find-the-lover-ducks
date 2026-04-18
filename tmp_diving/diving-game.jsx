import { useState, useEffect, useRef, useCallback } from "react";

// ===== CONSTANTS =====
const TILE = 28;
const COLS = 14;
const GRAVITY = 0.4;
const BASE_SWIM = -2.5;
const BASE_SPEED = 2.8;
const MAX_FALL = 5;

const ZONES = [
  { name: "浅層", ds: 0, de: 8, rate: 0.08, dark: 0, col: "#1a6b8a" },
  { name: "中層", ds: 8, de: 20, rate: 0.15, dark: 0.3, col: "#0d3f5e" },
  { name: "深層", ds: 20, de: 35, rate: 0.28, dark: 0.6, col: "#061a2e" },
  { name: "最深部", ds: 35, de: 999, rate: 0.4, dark: 0.85, col: "#020a14" },
];

const ITEMS_DB = [
  // 浅層: 安いものを多く。深く行ったら出ない
  { name: "貝殻", emoji: "🐚", minD: 0, maxD: 6, val: 15, rare: 0.6 },
  { name: "ヒトデ", emoji: "⭐", minD: 0, maxD: 8, val: 25, rare: 0.5 },
  { name: "サンゴ片", emoji: "🪸", minD: 3, maxD: 10, val: 50, rare: 0.4 },
  // 中層: 中堅、これも深層では出ない
  { name: "真珠", emoji: "🔮", minD: 8, maxD: 18, val: 150, rare: 0.3 },
  { name: "古代コイン", emoji: "🪙", minD: 10, maxD: 22, val: 280, rare: 0.18 },
  { name: "琥珀", emoji: "💎", minD: 15, maxD: 26, val: 450, rare: 0.15 },
  // 深層: 高額帯がここから
  { name: "黒真珠", emoji: "🖤", minD: 20, maxD: 32, val: 900, rare: 0.12 },
  { name: "古代の像", emoji: "🗿", minD: 25, maxD: 40, val: 1600, rare: 0.08 },
  // 最深部: 一気にスケール
  { name: "深海の宝石", emoji: "💠", minD: 35, maxD: 999, val: 3000, rare: 0.06 },
  { name: "竜の涙", emoji: "🐉", minD: 37, maxD: 999, val: 6000, rare: 0.03 },
];

const UPG = [
  { id: "tank", name: "タンク", desc: "酸素量UP", icon: "🫧", bc: 50, cm: 1.5, mx: 15, fn: l => 100 + l * 45 },
  { id: "fin", name: "フィン", desc: "移動速度UP", icon: "🦶", bc: 40, cm: 1.7, mx: 8, fn: l => BASE_SPEED + l * 0.4 },
  { id: "light", name: "ライト", desc: "視界範囲UP", icon: "🔦", bc: 60, cm: 1.8, mx: 8, fn: l => 80 + l * 30 },
  { id: "spear", name: "モリ", desc: "所持本数UP", icon: "🔱", bc: 70, cm: 2.0, mx: 6, fn: l => 1 + l },
  { id: "swim", name: "泳力", desc: "上昇力UP", icon: "🏊", bc: 80, cm: 1.6, mx: 8, fn: l => Math.abs(BASE_SWIM) + l * 0.4 },
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
  // Seabed: open chamber with solid floor
  for (let r = rows - 3; r < rows - 1; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) row.push(c === 0 || c === COLS - 1 ? 1 : 0);
    map.push(row);
  }
  // Bottom floor (all solid)
  const floorRow = [];
  for (let c = 0; c < COLS; c++) floorRow.push(1);
  map.push(floorRow);
  return { map, rows };
}

function placeEnts(map, rows) {
  const items = [], jelly = [], urchins = [], currents = [];
  // Seabed zone (the last open rows before the solid floor)
  const seabedStart = rows - 3;
  for (let r = 4; r < rows; r++) {
    // Skip the seabed chamber - no hazards there
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
  // Place the Seabed Treasure: guaranteed in the seabed chamber
  const treasureX = Math.floor(COLS / 2) * TILE + TILE / 2;
  const treasureY = (rows - 2) * TILE + TILE / 2;
  items.push({
    name: "海底の王冠", emoji: "👑", val: 8000, rare: 1, minD: 0, maxD: 999,
    x: treasureX, y: treasureY, col: false, bp: 0, isTreasure: true,
  });
  return { items, jelly, urchins, currents };
}

export default function DeepDive() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const frameRef = useRef(0);
  const keysRef = useRef({});
  const padRef = useRef({ dist: 0, angle: 0, tid: null, swimOn: false, swimTid: null, spearOn: false, spearTid: null });

  const initGame = useCallback(() => ({
    state: "title", money: 0, dives: 0,
    upg: { tank: 0, fin: 0, light: 0, spear: 0, swim: 0 },
    map: [], mapRows: 0, player: null, cam: { y: 0 },
    oxy: 100, maxOxy: 100, items: [], collected: [],
    spears: 0, maxSpears: 1, jelly: [], urchins: [], currents: [],
    particles: [], bubbles: [], sproj: [], result: null,
    surfY: 0, resTimer: 0, flashT: 0, flashC: null, spearCD: false,
    // records
    bestDepth: 0, currentMaxDepth: 0, newRecordTimer: 0,
    // picking up animation
    pickingUp: null, // { item, t } during pickup
    // pulse for low oxygen
    heartbeat: 0,
    // pad input state
    tL: false, tR: false, tU: false, tS: false,
  }), []);

  useEffect(() => {
    gameRef.current = initGame();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w, h;

    function resize() {
      w = canvas.width = canvas.parentElement.clientWidth;
      h = canvas.height = canvas.parentElement.clientHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Keyboard
    const kd = e => { keysRef.current[e.code] = true; };
    const ku = e => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // --- PAD LAYOUT ---
    function padLayout() {
      return {
        cx: 80, cy: h - 100, r: 50,
        swimX: w - 75, swimY: h - 120, swimR: 34,
        spearX: w - 140, spearY: h - 70, spearR: 28,
      };
    }

    function padHit(tx, ty) {
      const L = padLayout();
      let dx = tx - L.swimX, dy = ty - L.swimY;
      if (Math.sqrt(dx * dx + dy * dy) < L.swimR + 12) return "swim";
      dx = tx - L.spearX; dy = ty - L.spearY;
      if (Math.sqrt(dx * dx + dy * dy) < L.spearR + 12) return "spear";
      if (tx < w * 0.45 && ty > h * 0.45) return "dpad";
      return null;
    }

    function syncPad() {
      const g = gameRef.current, p = padRef.current;
      g.tL = false; g.tR = false; g.tU = false; g.tS = p.spearOn;
      if (p.dist > 12) {
        const ax = Math.cos(p.angle);
        if (ax < -0.4) g.tL = true;
        if (ax > 0.4) g.tR = true;
      }
      if (p.swimOn) g.tU = true;
    }

    function handleClick(x, y) {
      const g = gameRef.current;
      if (g.state === "title") { g.state = "shop"; return; }
      if (g.state === "result" && g.resTimer > 60) { g.state = "shop"; g.resTimer = 0; return; }
      if (g.state === "shop") {
        const pw = Math.min(340, w - 30), px = (w - pw) / 2;
        const btnW = pw * 0.6, btnX = (w - btnW) / 2, btnY = h - 65;
        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + 42) { startDive(); return; }
        UPG.forEach((u, i) => {
          const uy = 125 + i * 64;
          const lv = g.upg[u.id], cost = Math.floor(u.bc * Math.pow(u.cm, lv));
          if (lv < u.mx && g.money >= cost && x >= px && x <= px + pw && y >= uy && y <= uy + 54) {
            g.money -= cost; g.upg[u.id]++;
          }
        });
      }
    }

    // Touch events
    function onTS(e) {
      e.preventDefault();
      const g = gameRef.current;
      if (g.state !== "diving") {
        const t = e.changedTouches[0];
        if (t) handleClick(t.clientX - canvas.getBoundingClientRect().left, t.clientY - canvas.getBoundingClientRect().top);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      for (let t of e.changedTouches) {
        const tx = t.clientX - rect.left, ty = t.clientY - rect.top;
        const hit = padHit(tx, ty);
        const p = padRef.current;
        if (hit === "swim") { p.swimOn = true; p.swimTid = t.identifier; }
        else if (hit === "spear") { p.spearOn = true; p.spearTid = t.identifier; }
        else if (hit === "dpad") {
          p.tid = t.identifier;
          const L = padLayout();
          const dx = tx - L.cx, dy = ty - L.cy;
          p.dist = Math.min(Math.sqrt(dx * dx + dy * dy), L.r);
          p.angle = Math.atan2(dy, dx);
        }
      }
      syncPad();
    }
    function onTM(e) {
      e.preventDefault();
      if (gameRef.current.state !== "diving") return;
      const rect = canvas.getBoundingClientRect();
      const p = padRef.current;
      for (let t of e.changedTouches) {
        if (t.identifier === p.tid) {
          const L = padLayout();
          const tx = t.clientX - rect.left, ty = t.clientY - rect.top;
          const dx = tx - L.cx, dy = ty - L.cy;
          p.dist = Math.min(Math.sqrt(dx * dx + dy * dy), L.r);
          p.angle = Math.atan2(dy, dx);
        }
      }
      syncPad();
    }
    function onTE(e) {
      e.preventDefault();
      const p = padRef.current;
      for (let t of e.changedTouches) {
        if (t.identifier === p.tid) { p.tid = null; p.dist = 0; }
        if (t.identifier === p.swimTid) { p.swimOn = false; p.swimTid = null; }
        if (t.identifier === p.spearTid) { p.spearOn = false; p.spearTid = null; }
      }
      syncPad();
    }

    canvas.addEventListener("touchstart", onTS, { passive: false });
    canvas.addEventListener("touchmove", onTM, { passive: false });
    canvas.addEventListener("touchend", onTE, { passive: false });
    canvas.addEventListener("click", e => {
      const rect = canvas.getBoundingClientRect();
      handleClick(e.clientX - rect.left, e.clientY - rect.top);
    });

    // ===== GAME LOGIC =====
    function startDive() {
      const g = gameRef.current;
      const { map, rows } = genMap();
      const ents = placeEnts(map, rows);
      g.maxOxy = UPG[0].fn(g.upg.tank); g.oxy = g.maxOxy;
      g.maxSpears = UPG[3].fn(g.upg.spear); g.spears = g.maxSpears;
      g.map = map; g.mapRows = rows;
      g.items = ents.items; g.jelly = ents.jelly; g.urchins = ents.urchins; g.currents = ents.currents;
      g.collected = []; g.sproj = []; g.particles = []; g.bubbles = [];
      g.surfY = 2 * TILE;
      g.player = { x: (COLS / 2) * TILE, y: g.surfY, vx: 0, vy: 0, w: 16, h: 20, f: 1 };
      g.cam.y = 0; g.state = "diving"; g.dives++; g.spearCD = false;
      g.currentMaxDepth = 0; g.newRecordTimer = 0;
      g.pickingUp = null; g.heartbeat = 0;
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

    function endDive(ok) {
      const g = gameRef.current;
      let kept = [], lost = [];
      if (ok) { kept = [...g.collected]; }
      else if (g.collected.length > 0) {
        const idx = Math.floor(Math.random() * g.collected.length);
        kept = [g.collected[idx]]; lost = g.collected.filter((_, i) => i !== idx);
      }
      const earn = kept.reduce((s, i) => s + i.val, 0);
      const lostVal = lost.reduce((s, i) => s + i.val, 0);
      g.money += earn;
      // Update best depth record
      const newRecord = g.currentMaxDepth > g.bestDepth;
      if (newRecord) g.bestDepth = g.currentMaxDepth;
      g.result = { ok, kept, lost, earn, lostVal, depth: g.currentMaxDepth, newRecord };
      g.state = "result"; g.resTimer = 0;
    }

    function updateDive() {
      const g = gameRef.current, p = g.player, k = keysRef.current;
      const spd = UPG[1].fn(g.upg.fin), sw = -UPG[4].fn(g.upg.swim);
      const left = k.ArrowLeft || k.KeyA || g.tL;
      const right = k.ArrowRight || k.KeyD || g.tR;
      const up = k.ArrowUp || k.KeyW || k.Space || g.tU;
      const shoot = k.KeyX || k.ShiftRight || g.tS;

      if (left) { p.vx = -spd; p.f = -1; }
      else if (right) { p.vx = spd; p.f = 1; }
      else p.vx *= 0.7;

      p.vy += GRAVITY * 0.4;
      if (up) p.vy = Math.max(p.vy + sw * 0.15, sw);
      p.vy = Math.min(p.vy, MAX_FALL);
      p.vy *= 0.92;

      if (shoot && g.spears > 0 && !g.spearCD) {
        g.sproj.push({ x: p.x, y: p.y, vx: p.f * 7, vy: 0, life: 35 });
        g.spears--; g.spearCD = true;
        setTimeout(() => { if (gameRef.current) gameRef.current.spearCD = false; }, 300);
      }

      p.x += p.vx; colX(p, g.map, g.mapRows);
      p.y += p.vy; colY(p, g.map, g.mapRows);

      g.cam.y += ((p.y - h * 0.4) - g.cam.y) * 0.1;

      const dr = Math.floor(p.y / TILE);
      const z = ZONES.find(z => dr / 3 >= z.ds && dr / 3 < z.de) || ZONES[3];
      g.oxy -= z.rate;

      // Track depth & new record
      const depthM = Math.max(0, Math.floor((dr - 3) * 1.5));
      if (depthM > g.currentMaxDepth) {
        g.currentMaxDepth = depthM;
        if (depthM > g.bestDepth && depthM > 0 && depthM % 5 === 0) {
          g.newRecordTimer = 90; // show "NEW RECORD" briefly
        }
      }

      // Heartbeat intensity (0-1) ramps up when oxygen low
      const oxyP = g.oxy / g.maxOxy;
      const targetBeat = oxyP < 0.35 ? (0.35 - oxyP) / 0.35 : 0;
      g.heartbeat += (targetBeat - g.heartbeat) * 0.05;
      if (g.newRecordTimer > 0) g.newRecordTimer--;

      if (Math.random() < 0.15) g.bubbles.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y - 8, s: 1 + Math.random() * 2.5, vy: -0.5 - Math.random(), life: 50 });
      g.bubbles = g.bubbles.filter(b => { b.y += b.vy; b.x += Math.sin(b.life * 0.1) * 0.3; b.life--; return b.life > 0; });

      // Pickup animation: when picking up, player is locked
      if (g.pickingUp) {
        g.pickingUp.t++;
        p.vx *= 0.5; // mostly frozen
        if (g.pickingUp.t >= 18) {
          const it = g.pickingUp.item;
          it.col = true;
          g.collected.push(it);
          g.flashT = 8; g.flashC = "#ffdd44";
          for (let i = 0; i < 6; i++) g.particles.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 18, c: "#ffdd44", s: 2 + Math.random() * 2 });
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
        j.ph += 0.02; j.x = j.bx + Math.sin(j.ph * j.sp) * j.rng; j.y -= Math.sin(j.ph * 0.5) * 0.3;
        const dx = p.x - j.x, dy = p.y - j.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          g.oxy -= 8; g.flashT = 10; g.flashC = "#ff4444"; p.vy = -3; p.vx = (dx > 0 ? 1 : -1) * 4;
          g.pickingUp = null; // interrupted
          for (let i = 0; i < 6; i++) g.particles.push({ x: j.x, y: j.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 12, c: "#ff6688", s: 2 });
        }
      });

      g.urchins.forEach(u => {
        const dx = p.x - u.x, dy = p.y - u.y;
        if (Math.sqrt(dx * dx + dy * dy) < 16) { g.oxy -= 5; g.flashT = 8; g.flashC = "#ff4444"; p.vy = -4; g.pickingUp = null; }
      });

      g.currents.forEach(c => {
        if (p.x > c.x - c.w / 2 && p.x < c.x + c.w / 2 && p.y > c.y && p.y < c.y + c.h)
          p.vx += c.dir * c.str * 0.15;
      });

      g.sproj = g.sproj.filter(s => {
        s.x += s.vx; s.life--;
        g.jelly.forEach(j => {
          if (!j.alive) return;
          if (Math.sqrt((s.x - j.x) ** 2 + (s.y - j.y) ** 2) < 18) {
            j.alive = false; s.life = 0;
            for (let i = 0; i < 8; i++) g.particles.push({ x: j.x, y: j.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 18, c: "#88ddff", s: 3 });
          }
        });
        const tc = Math.floor(s.x / TILE), tr = Math.floor(s.y / TILE);
        if (tc >= 0 && tc < COLS && tr >= 0 && tr < g.mapRows && g.map[tr][tc] === 1) s.life = 0;
        return s.life > 0;
      });

      g.particles = g.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; pt.vx *= 0.95; pt.vy *= 0.95; return pt.life > 0; });
      if (g.flashT > 0) g.flashT--;

      if (p.y <= g.surfY && g.collected.length > 0) endDive(true);
      if (g.oxy <= 0) { g.oxy = 0; endDive(false); }
    }

    // ===== RENDER =====
    function rr(x, y, ww, hh, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + ww - r, y);
      ctx.quadraticCurveTo(x + ww, y, x + ww, y + r); ctx.lineTo(x + ww, y + hh - r);
      ctx.quadraticCurveTo(x + ww, y + hh, x + ww - r, y + hh); ctx.lineTo(x + r, y + hh);
      ctx.quadraticCurveTo(x, y + hh, x, y + hh - r); ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill();
    }

    function drawTitle(f) {
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#0a2a4a"); grd.addColorStop(1, "#020a14");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 15; i++) {
        const bx = (Math.sin(f * 0.01 + i * 1.3) * 0.5 + 0.5) * w;
        const by = h - ((f * 0.5 + i * 60) % (h + 30));
        ctx.globalAlpha = 0.2; ctx.fillStyle = "#88ccff";
        ctx.beginPath(); ctx.arc(bx, by, 2 + Math.sin(i) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = "#44ddff";
      ctx.font = 'bold 36px "Courier New",monospace'; ctx.textAlign = "center";
      ctx.fillText("DEEP DIVE", w / 2, h * 0.33);
      ctx.fillStyle = "#6688aa"; ctx.font = '14px "Courier New",monospace';
      ctx.fillText("深海探索ダイビングゲーム", w / 2, h * 0.33 + 32);
      ctx.fillStyle = "#aaccdd"; ctx.font = '16px "Courier New",monospace';
      if (Math.sin(f * 0.05) > 0) ctx.fillText("タップしてスタート", w / 2, h * 0.6);
    }

    function drawShop() {
      const g = gameRef.current;
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#0a1a2a"); grd.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#44ddff"; ctx.font = 'bold 20px "Courier New",monospace'; ctx.textAlign = "center";
      ctx.fillText("🏪 ショップ", w / 2, 35);
      ctx.fillStyle = "#ffdd44"; ctx.font = '18px "Courier New",monospace';
      ctx.fillText("💰 " + g.money + " G", w / 2, 65);
      ctx.fillStyle = "#6688aa"; ctx.font = '12px "Courier New",monospace';
      ctx.fillText("ダイブ回数: " + g.dives + (g.bestDepth > 0 ? "  ／  最深: -" + g.bestDepth + "m" : ""), w / 2, 88);
      const pw = Math.min(340, w - 30), px = (w - pw) / 2;
      ctx.textAlign = "left";
      UPG.forEach((u, i) => {
        const uy = 125 + i * 64;
        const lv = g.upg[u.id], cost = Math.floor(u.bc * Math.pow(u.cm, lv));
        const max = lv >= u.mx, can = !max && g.money >= cost;
        ctx.fillStyle = can ? "#1a2a3a" : "#111a24"; rr(px, uy, pw, 52, 6);
        ctx.strokeStyle = can ? "#44ddff44" : "#333"; ctx.lineWidth = 1;
        ctx.beginPath(); rr(px, uy, pw, 52, 6); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = '16px "Courier New",monospace';
        ctx.fillText(u.icon + " " + u.name, px + 10, uy + 22);
        ctx.fillStyle = "#88aacc"; ctx.font = '11px "Courier New",monospace';
        ctx.fillText(u.desc + "  Lv." + lv + "/" + u.mx, px + 10, uy + 40);
        ctx.textAlign = "right";
        if (max) { ctx.fillStyle = "#66aa66"; ctx.font = '13px "Courier New",monospace'; ctx.fillText("MAX", px + pw - 10, uy + 32); }
        else { ctx.fillStyle = can ? "#ffdd44" : "#664422"; ctx.font = '13px "Courier New",monospace'; ctx.fillText(cost + " G", px + pw - 10, uy + 32); }
        ctx.textAlign = "left";
      });
      ctx.textAlign = "center";
      const btnW = pw * 0.6, btnX = (w - btnW) / 2, btnY = h - 65;
      ctx.fillStyle = "#1166aa"; rr(btnX, btnY, btnW, 42, 10);
      ctx.strokeStyle = "#44ddff"; ctx.lineWidth = 2;
      ctx.beginPath(); rr(btnX, btnY, btnW, 42, 10); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = 'bold 18px "Courier New",monospace';
      ctx.fillText("🌊 ダイブ！", w / 2, btnY + 28);
    }

    function drawDive(f) {
      const g = gameRef.current, p = g.player, cy = g.cam.y;
      const ox = (w - COLS * TILE) / 2;
      const dr = Math.floor(p.y / TILE);
      const z = ZONES.find(z => dr / 3 >= z.ds && dr / 3 < z.de) || ZONES[3];
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, z.col); grd.addColorStop(1, "#020810");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);

      const sr = Math.max(0, Math.floor(cy / TILE) - 1);
      const er = Math.min(g.mapRows - 1, Math.floor((cy + h) / TILE) + 1);
      for (let r = sr; r <= er; r++) for (let c = 0; c < COLS; c++) {
        if (g.map[r] && g.map[r][c] === 1) {
          const tx = ox + c * TILE, ty = r * TILE - cy;
          ctx.fillStyle = "#2a3a4a"; ctx.fillRect(tx, ty, TILE, TILE);
          ctx.strokeStyle = "#3a4a5a"; ctx.lineWidth = 0.5; ctx.strokeRect(tx, ty, TILE, TILE);
        }
      }

      g.currents.forEach(c => {
        const ccy = c.y - cy;
        if (ccy > -c.h && ccy < h) {
          ctx.globalAlpha = 0.15; ctx.fillStyle = "#44aaff";
          ctx.fillRect(ox + c.x - c.w / 2, ccy, c.w, c.h);
          ctx.globalAlpha = 0.4; ctx.fillStyle = "#88ddff"; ctx.font = "14px monospace"; ctx.textAlign = "center";
          ctx.fillText(c.dir > 0 ? "→→→" : "←←←", ox + c.x, ccy + c.h / 2 + 4); ctx.globalAlpha = 1;
        }
      });

      g.items.forEach(it => {
        if (it.col) return;
        const ix = ox + it.x, iy = it.y - cy + Math.sin(f * 0.05 + it.bp) * 3;
        if (iy < -20 || iy > h + 20) return;
        // Golden aura for treasure
        if (it.isTreasure) {
          const pulse = (Math.sin(f * 0.08) + 1) / 2;
          // Outer halo
          const hg = ctx.createRadialGradient(ix, iy, 0, ix, iy, 45);
          hg.addColorStop(0, `rgba(255,220,100,${0.4 + pulse * 0.3})`);
          hg.addColorStop(0.5, `rgba(255,180,60,${0.15 + pulse * 0.15})`);
          hg.addColorStop(1, "rgba(255,180,60,0)");
          ctx.fillStyle = hg;
          ctx.beginPath(); ctx.arc(ix, iy, 45, 0, Math.PI * 2); ctx.fill();
          // Sparkles
          for (let i = 0; i < 4; i++) {
            const a = f * 0.02 + i * Math.PI / 2;
            const sx = ix + Math.cos(a) * 20;
            const sy = iy + Math.sin(a) * 20;
            ctx.fillStyle = `rgba(255,240,180,${0.6 + pulse * 0.4})`;
            ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.font = "26px serif";
        } else {
          ctx.font = "18px serif";
        }
        ctx.textAlign = "center"; ctx.fillText(it.emoji, ix, iy + 6);
      });

      g.urchins.forEach(u => {
        const ux = ox + u.x, uy = u.y - cy;
        if (uy < -15 || uy > h + 15) return;
        ctx.font = "14px serif"; ctx.textAlign = "center"; ctx.fillText("🦔", ux, uy + 4);
      });

      g.jelly.forEach(j => {
        if (!j.alive) return;
        const jx = ox + j.x, jy = j.y - cy;
        if (jy < -20 || jy > h + 20) return;
        ctx.font = "18px serif"; ctx.textAlign = "center";
        ctx.fillText("🪼", jx, jy + Math.sin(f * 0.08 + j.ph) * 2);
      });

      g.sproj.forEach(s => {
        const sx = ox + s.x, sy = s.y - cy;
        ctx.strokeStyle = "#ffaa44"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx - s.vx * 1.5, sy); ctx.lineTo(sx, sy); ctx.stroke();
        ctx.fillStyle = "#ffcc66"; ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
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
      const px = ox + p.x, py = p.y - cy;
      ctx.fillStyle = "#ffcc44"; ctx.beginPath(); ctx.arc(px, py - 5, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2288cc"; ctx.fillRect(px - 5, py + 2, 10, 12);
      ctx.fillStyle = "#44eeff"; ctx.fillRect(px + p.f * 2 - 3, py - 8, 6, 5);
      ctx.fillStyle = "#ff6644";
      const fk = Math.sin(f * 0.15) * 3;
      ctx.fillRect(px - 3, py + 14, 2.5, 5 + fk); ctx.fillRect(px + 0.5, py + 14, 2.5, 5 - fk);

      // Pickup ring animation
      if (g.pickingUp) {
        const it = g.pickingUp.item;
        const ix = ox + it.x, iy = it.y - cy;
        const prog = g.pickingUp.t / 18;
        ctx.strokeStyle = "#ffdd44";
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(ix, iy, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(ix, iy, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Darkness from depth zone
      if (z.dark > 0) {
        const lr = UPG[2].fn(g.upg.light);
        const lg = ctx.createRadialGradient(px, py, 0, px, py, lr);
        lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(0.7, `rgba(0,0,0,${z.dark * 0.3})`);
        lg.addColorStop(1, `rgba(0,0,0,${z.dark * 0.85})`);
        ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      }

      // Heartbeat vignette when oxygen low
      if (g.heartbeat > 0.05) {
        const beat = (Math.sin(f * 0.25) + 1) / 2; // 0..1
        const intensity = g.heartbeat * (0.5 + beat * 0.5);
        // Red edge vignette
        const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
        vg.addColorStop(0, "rgba(255,0,0,0)");
        vg.addColorStop(0.5, `rgba(120,0,0,${intensity * 0.15})`);
        vg.addColorStop(1, `rgba(180,0,0,${intensity * 0.55})`);
        ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
      }

      if (g.flashT > 0) { ctx.globalAlpha = g.flashT / 10 * 0.3; ctx.fillStyle = g.flashC; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }

      // ===== HUD =====
      const barW = Math.min(160, w * 0.4), barX = 15, barY = 15;
      const op = g.oxy / g.maxOxy;
      ctx.fillStyle = "#000000aa"; ctx.fillRect(barX - 2, barY - 2, barW + 4, 18);
      // Pulse the bar color when low
      const beatPulse = g.heartbeat > 0.1 ? (Math.sin(f * 0.25) + 1) / 2 : 0;
      const barColor = op > 0.5 ? "#44ddff" : op > 0.25 ? "#ffaa44" : "#ff4444";
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, barW * op, 14);
      if (beatPulse > 0) {
        ctx.globalAlpha = beatPulse * g.heartbeat * 0.6;
        ctx.fillStyle = "#fff";
        ctx.fillRect(barX, barY, barW * op, 14);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "#fff"; ctx.font = '11px "Courier New",monospace'; ctx.textAlign = "left";
      ctx.fillText("🫧 O₂ " + Math.ceil(g.oxy), barX + 3, barY + 12);
      const dm = Math.max(0, Math.floor((dr - 3) * 1.5));
      ctx.fillStyle = "#aaccdd"; ctx.font = '12px "Courier New",monospace';
      ctx.fillText("深度:" + dm + "m", barX, barY + 32);
      ctx.fillStyle = "#6688aa"; ctx.fillText(z.name, barX + 90, barY + 32);
      ctx.fillText("🔱×" + g.spears, barX, barY + 48);

      // Best depth indicator
      if (g.bestDepth > 0) {
        ctx.fillStyle = "#88aacc"; ctx.font = '10px "Courier New",monospace';
        ctx.fillText("ベスト:" + g.bestDepth + "m", barX, barY + 64);
      }

      // Surface distance gauge (right edge)
      const distToSurface = Math.max(0, p.y - g.surfY);
      const distM = Math.floor(distToSurface / TILE * 1.5);
      const gaugeX = w - 28, gaugeTop = 75, gaugeBot = h - 200;
      const gaugeH = gaugeBot - gaugeTop;
      // Background track
      ctx.fillStyle = "#000000aa";
      ctx.fillRect(gaugeX - 2, gaugeTop - 2, 14, gaugeH + 4);
      // Surface marker (top)
      ctx.fillStyle = "#44ddff";
      ctx.fillRect(gaugeX, gaugeTop, 10, 3);
      // Player position on gauge (proportional, capped)
      const maxGaugeDepth = Math.max(60, g.currentMaxDepth + 20);
      const playerGaugeY = gaugeTop + Math.min(gaugeH, (distM / maxGaugeDepth) * gaugeH);
      ctx.fillStyle = "#ffdd44";
      ctx.beginPath();
      ctx.moveTo(gaugeX - 4, playerGaugeY);
      ctx.lineTo(gaugeX + 14, playerGaugeY - 4);
      ctx.lineTo(gaugeX + 14, playerGaugeY + 4);
      ctx.closePath();
      ctx.fill();
      // Surface label
      ctx.fillStyle = "#aaccdd"; ctx.font = '9px "Courier New",monospace'; ctx.textAlign = "right";
      ctx.fillText("地上", gaugeX - 4, gaugeTop + 4);
      // Distance to surface text
      ctx.fillStyle = "#88ccdd"; ctx.font = 'bold 11px "Courier New",monospace'; ctx.textAlign = "right";
      ctx.fillText("↑" + distM + "m", gaugeX + 12, gaugeBot + 16);

      // Items count (right top)
      ctx.textAlign = "right"; ctx.fillStyle = "#ffdd44"; ctx.font = '12px "Courier New",monospace';
      ctx.fillText("📦 " + g.collected.length + "個", w - 15, 30);
      if (g.collected.length > 0) {
        ctx.fillStyle = "#aaccdd"; ctx.font = '11px "Courier New",monospace';
        ctx.fillText("(" + g.collected.reduce((s, i) => s + i.val, 0) + "G)", w - 15, 45);
      }

      // NEW RECORD popup
      if (g.newRecordTimer > 0) {
        const t = g.newRecordTimer;
        const fadeIn = t > 75 ? (90 - t) / 15 : t < 15 ? t / 15 : 1;
        ctx.globalAlpha = fadeIn;
        const yPos = h * 0.32 + (1 - fadeIn) * 10;
        ctx.fillStyle = "#000000aa";
        ctx.fillRect(0, yPos - 30, w, 60);
        ctx.fillStyle = "#ffdd44"; ctx.font = 'bold 22px "Courier New",monospace'; ctx.textAlign = "center";
        ctx.fillText("🏆 最深記録更新", w / 2, yPos);
        ctx.fillStyle = "#fff"; ctx.font = 'bold 18px "Courier New",monospace';
        ctx.fillText("-" + g.currentMaxDepth + "m", w / 2, yPos + 22);
        ctx.globalAlpha = 1;
      }

      // Virtual pad
      drawPad(f);
    }

    function drawPad(f) {
      const g = gameRef.current, pd = padRef.current, L = padLayout();
      ctx.save();
      // D-pad
      ctx.globalAlpha = 0.18; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(L.cx, L.cy, L.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.3; ctx.strokeStyle = "#88ccff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(L.cx, L.cy, L.r, 0, Math.PI * 2); ctx.stroke();
      let kx = L.cx, ky = L.cy;
      if (pd.dist > 5) { kx = L.cx + Math.cos(pd.angle) * pd.dist * 0.7; ky = L.cy + Math.sin(pd.angle) * pd.dist * 0.7; }
      ctx.globalAlpha = 0.45; ctx.fillStyle = "#44ddff";
      ctx.beginPath(); ctx.arc(kx, ky, 18, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.6; ctx.strokeStyle = "#88eeff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(kx, ky, 18, 0, Math.PI * 2); ctx.stroke();

      // Swim btn
      ctx.globalAlpha = pd.swimOn ? 0.45 : 0.22; ctx.fillStyle = pd.swimOn ? "#44ddff" : "#2288aa";
      ctx.beginPath(); ctx.arc(L.swimX, L.swimY, L.swimR, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = pd.swimOn ? 0.7 : 0.35; ctx.strokeStyle = "#44ddff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(L.swimX, L.swimY, L.swimR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = pd.swimOn ? 0.85 : 0.55; ctx.fillStyle = "#fff";
      ctx.font = 'bold 13px "Courier New",monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("泳ぐ", L.swimX, L.swimY);

      // Spear btn
      const has = g.spears > 0;
      ctx.globalAlpha = !has ? 0.1 : pd.spearOn ? 0.45 : 0.22;
      ctx.fillStyle = pd.spearOn ? "#ffaa44" : "#886622";
      ctx.beginPath(); ctx.arc(L.spearX, L.spearY, L.spearR, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = !has ? 0.18 : pd.spearOn ? 0.7 : 0.35;
      ctx.strokeStyle = "#ffaa44"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(L.spearX, L.spearY, L.spearR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = !has ? 0.25 : 0.55; ctx.fillStyle = "#fff";
      ctx.font = "16px serif"; ctx.fillText("🔱", L.spearX, L.spearY - 2);
      ctx.font = '9px "Courier New",monospace'; ctx.fillText("×" + g.spears, L.spearX, L.spearY + 14);
      ctx.restore();
    }

    function drawResult(f) {
      const g = gameRef.current, r = g.result;
      if (!r) return;
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, r.ok ? "#0a2a1a" : "#2a0a0a"); grd.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.fillStyle = r.ok ? "#44ff88" : "#ff4444";
      ctx.font = 'bold 24px "Courier New",monospace';
      ctx.fillText(r.ok ? "🎉 帰還成功！" : "💀 酸素切れ...", w / 2, 50);

      // Depth & new record
      ctx.fillStyle = r.newRecord ? "#ffdd44" : "#88aacc";
      ctx.font = '13px "Courier New",monospace';
      ctx.fillText("最深: -" + r.depth + "m" + (r.newRecord ? "  🏆 新記録!" : ""), w / 2, 73);

      // Kept items
      ctx.fillStyle = "#fff"; ctx.font = '15px "Courier New",monospace'; ctx.fillText("持ち帰り:", w / 2, 105);
      if (r.kept.length === 0) { ctx.fillStyle = "#666"; ctx.font = '13px "Courier New",monospace'; ctx.fillText("なし", w / 2, 130); }
      else r.kept.forEach((it, i) => {
        const fa = Math.min(1, (g.resTimer - i * 12) / 15);
        if (fa <= 0) return;
        ctx.globalAlpha = fa; ctx.fillStyle = "#ffdd44";
        ctx.font = '14px "Courier New",monospace';
        ctx.fillText(it.emoji + " " + it.name + " (" + it.val + "G)", w / 2, 128 + i * 22);
      });
      ctx.globalAlpha = 1;

      // Lost items - emphasize value
      if (r.lost.length > 0) {
        const ly = 136 + r.kept.length * 22 + 18;
        // "失ったもの" header with total lost value
        ctx.fillStyle = "#ff6666";
        ctx.font = 'bold 15px "Courier New",monospace';
        ctx.fillText("失ったもの: -" + r.lostVal + " G", w / 2, ly);

        // Sort lost items by value descending so high-value loss is most visible
        const sorted = [...r.lost].sort((a, b) => b.val - a.val);
        const showCount = Math.min(4, sorted.length);
        for (let i = 0; i < showCount; i++) {
          const it = sorted[i];
          // The most valuable lost item gets bigger, brighter
          if (i === 0) {
            ctx.fillStyle = "#ff8888";
            ctx.font = 'bold 14px "Courier New",monospace';
            ctx.fillText(it.emoji + " " + it.name + "  -" + it.val + "G", w / 2, ly + 22);
          } else {
            ctx.fillStyle = "#996666";
            ctx.font = '12px "Courier New",monospace';
            ctx.fillText(it.emoji + " " + it.name + "  -" + it.val + "G", w / 2, ly + 22 + i * 18);
          }
        }
        if (r.lost.length > showCount) {
          ctx.fillStyle = "#664444"; ctx.font = '11px "Courier New",monospace';
          ctx.fillText("...他" + (r.lost.length - showCount) + "個", w / 2, ly + 22 + showCount * 18);
        }
      }

      // Earnings
      const ey = h - 95;
      ctx.fillStyle = "#ffdd44"; ctx.font = 'bold 20px "Courier New",monospace';
      ctx.fillText("+" + r.earn + " G", w / 2, ey);
      ctx.fillStyle = "#aaccdd"; ctx.font = '13px "Courier New",monospace';
      ctx.fillText("所持金: " + g.money + " G", w / 2, ey + 24);
      if (g.resTimer > 60 && Math.sin(f * 0.05) > 0) {
        ctx.fillStyle = "#aaccdd"; ctx.font = '13px "Courier New",monospace';
        ctx.fillText("タップして続ける", w / 2, h - 30);
      }
    }

    // Loop
    let animId;
    function loop() {
      const g = gameRef.current, f = ++frameRef.current;
      if (g.state === "diving") updateDive();
      if (g.state === "result") g.resTimer++;
      ctx.clearRect(0, 0, w, h);
      if (g.state === "title") drawTitle(f);
      else if (g.state === "shop") drawShop();
      else if (g.state === "diving") drawDive(f);
      else if (g.state === "result") drawResult(f);
      animId = requestAnimationFrame(loop);
    }
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      canvas.removeEventListener("touchstart", onTS);
      canvas.removeEventListener("touchmove", onTM);
      canvas.removeEventListener("touchend", onTE);
    };
  }, [initGame]);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a1a", overflow: "hidden", touchAction: "none" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
}
