import { playChambaraHit, playChambaraParry, playChambaraSlash, startChambaraBgm, stopChambaraBgm } from "./se.js";

const GAME_W = 192;
const GAME_H = 180;
const CHAR_W = 16;
const CHAR_H = 16;
const GROUND = 145;
const PLAYER_START_X = 42;
const ENEMY_START_X = 134;
const MOVE_SPEED_PLAYER = 1.15;
const MOVE_SPEED_ENEMY = 0.78;
const ATTACK_TOTAL = 20;
const ATTACK_ACTIVE_START = 8;
const ATTACK_ACTIVE_END = 13;
const PARRY_TOTAL = 18;
const PARRY_ACTIVE_START = 0;
const PARRY_ACTIVE_END = 8;
const STUN_TIME = 30;
const FREEZE_ON_PARRY = 4;
const FREEZE_ON_HIT = 6;
const KNOCKBACK_ON_PARRY = 4;
const MIN_FIGHTER_GAP = 10;

function pointInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function lineSegmentsHit(a, b) {
  const dax = a.x2 - a.x1;
  const day = a.y2 - a.y1;
  const dbx = b.x2 - b.x1;
  const dby = b.y2 - b.y1;
  const den = dax * dby - day * dbx;
  if (den === 0) return false;
  const s = ((a.x1 - b.x1) * dby - (a.y1 - b.y1) * dbx) / den;
  const t = ((a.x1 - b.x1) * day - (a.y1 - b.y1) * dax) / den;
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

function lineHitsRect(line, rect, pad = 1) {
  const r = { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
  if (pointInRect({ x: line.x1, y: line.y1 }, r) || pointInRect({ x: line.x2, y: line.y2 }, r)) return true;
  const left = r.x;
  const right = r.x + r.w;
  const top = r.y;
  const bottom = r.y + r.h;
  return (
    lineSegmentsHit(line, { x1: left, y1: top, x2: right, y2: top }) ||
    lineSegmentsHit(line, { x1: right, y1: top, x2: right, y2: bottom }) ||
    lineSegmentsHit(line, { x1: right, y1: bottom, x2: left, y2: bottom }) ||
    lineSegmentsHit(line, { x1: left, y1: bottom, x2: left, y2: top })
  );
}

function makeFighter(x, dir) {
  return {
    x,
    y: GROUND - CHAR_H,
    dir,
    state: "idle",
    attack: 0,
    parry: 0,
    stun: 0,
    hit: false,
  };
}

function bodyBox(c) {
  return { x: c.x + 2, y: c.y + 1, w: 12, h: 15 };
}

function slashLine(c) {
  const cx = c.x + 8;
  const cy = c.y + 8;
  const side = c.dir === 1 ? 1 : -1;
  const p = Math.max(0, Math.min(1, c.attack / Math.max(1, ATTACK_TOTAL - 1)));
  const startA = -Math.PI * 0.62;
  const endA = Math.PI * 0.22;
  const a = startA + (endA - startA) * p;
  const len = 19;
  const handX = cx + side * 3;
  const handY = cy + 1;
  const tipX = handX + Math.cos(a) * len * side;
  const tipY = handY + Math.sin(a) * len;
  const baseX = handX - Math.cos(a) * 4 * side;
  const baseY = handY - Math.sin(a) * 4;
  return { x1: baseX, y1: baseY, x2: tipX, y2: tipY, handX, handY, len, side, startA, endA, p };
}

function attackLine(c) {
  if (c.state !== "attack" || c.attack < ATTACK_ACTIVE_START || c.attack > ATTACK_ACTIVE_END) return null;
  return slashLine(c);
}

function parryBox(c) {
  if (c.state !== "parry" || c.parry < PARRY_ACTIVE_START || c.parry > PARRY_ACTIVE_END) return null;
  return {
    x: c.dir === 1 ? c.x + 10 : c.x - 12,
    y: c.y - 6,
    w: 18,
    h: 23,
  };
}

function drawSlashLine(ctx, c) {
  const { x1, y1, x2, y2, handX, handY, len, side, startA, endA, p } = slashLine(c);

  ctx.strokeStyle = "#f8fbff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = "#9ba6b4";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1 + 1);
  ctx.lineTo(x2, y2 + 1);
  ctx.stroke();

  if (p >= ATTACK_ACTIVE_START / ATTACK_TOTAL && p <= ATTACK_ACTIVE_END / ATTACK_TOTAL) {
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const steps = 5;
    for (let i = 0; i <= steps; i += 1) {
      const q = i / steps;
      const aa = startA + (endA - startA) * q;
      const x = handX + Math.cos(aa) * len * side;
      const y = handY + Math.sin(aa) * len;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawParryBlade(ctx, c) {
  const side = c.dir === 1 ? 1 : -1;
  const cx = c.x + 8 + side * 5;
  const cy = c.y + 6;
  const lean = side * 7;

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - lean * 0.45, cy + 8);
  ctx.lineTo(cx + lean, cy - 8);
  ctx.stroke();

  ctx.strokeStyle = "#95a6bd";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - lean * 0.45, cy + 9);
  ctx.lineTo(cx + lean, cy - 7);
  ctx.stroke();

  ctx.fillStyle = "#fff6a8";
  ctx.fillRect((cx + side * 7) | 0, (cy - 7) | 0, 2, 2);
  ctx.fillRect((cx + side * 3) | 0, (cy - 3) | 0, 2, 1);
}

function enterAttack(c) {
  if (c.state !== "idle" && c.state !== "walk") return;
  c.state = "attack";
  c.attack = 0;
  playChambaraSlash();
}

function enterParry(c) {
  if (c.state !== "idle" && c.state !== "walk") return;
  c.state = "parry";
  c.parry = 0;
}

function separateFighters(player, enemy) {
  if (player.x <= enemy.x) {
    if (enemy.x - player.x >= MIN_FIGHTER_GAP) return;
    const mid = (player.x + enemy.x) / 2;
    player.x = Math.max(4, Math.min(GAME_W - CHAR_W - 4, mid - MIN_FIGHTER_GAP / 2));
    enemy.x = Math.max(4, Math.min(GAME_W - CHAR_W - 4, mid + MIN_FIGHTER_GAP / 2));
  } else {
    if (player.x - enemy.x >= MIN_FIGHTER_GAP) return;
    const mid = (player.x + enemy.x) / 2;
    enemy.x = Math.max(4, Math.min(GAME_W - CHAR_W - 4, mid - MIN_FIGHTER_GAP / 2));
    player.x = Math.max(4, Math.min(GAME_W - CHAR_W - 4, mid + MIN_FIGHTER_GAP / 2));
  }
}

export function createChambara({ input, getPlayerImg, enemyImg } = {}) {
  let active = false;
  let phase = "play";
  let player = makeFighter(PLAYER_START_X, 1);
  let enemy = makeFighter(ENEMY_START_X, -1);
  let aiWait = 34;
  let freeze = 0;
  let message = "CHAMBARA";
  let messageTimer = 72;
  let sparks = [];
  let onClose = null;
  let exiting = false;
  let wins = 0;
  let losses = 0;

  function resetRound() {
    phase = "play";
    player = makeFighter(PLAYER_START_X, 1);
    enemy = makeFighter(ENEMY_START_X, -1);
    aiWait = 34;
    freeze = 0;
    message = "CHAMBARA";
    messageTimer = 72;
    sparks = [];
    exiting = false;
    input?.clear?.();
  }

  function start(cb) {
    active = true;
    onClose = typeof cb === "function" ? cb : null;
    wins = 0;
    losses = 0;
    resetRound();
    startChambaraBgm();
  }

  function close() {
    if (exiting) return;
    const cb = onClose;
    stopChambaraBgm();
    if (cb && cb() === true) {
      exiting = true;
      return;
    }
    active = false;
    onClose = null;
  }

  function finishClose() {
    active = false;
    exiting = false;
    onClose = null;
    stopChambaraBgm();
  }

  function isActive() {
    return active;
  }

  function setResult(text) {
    phase = text === "YOU WIN" ? "win" : "lose";
    if (phase === "win") wins += 1;
    else losses += 1;
    message = text;
    messageTimer = 9999;
    freeze = FREEZE_ON_HIT;
  }

  function sparkAt(x, y) {
    sparks.push({ x, y, life: 14 });
    if (sparks.length > 8) sparks.shift();
  }

  function parrySuccess(defender, attacker, text) {
    attacker.state = "stun";
    attacker.attack = 0;
    attacker.stun = STUN_TIME;
    attacker.x += defender.dir * KNOCKBACK_ON_PARRY;
    attacker.x = Math.max(8, Math.min(GAME_W - CHAR_W - 8, attacker.x));
    defender.state = "idle";
    defender.parry = 0;
    freeze = FREEZE_ON_PARRY;
    message = text;
    messageTimer = 34;
    playChambaraParry();
    sparkAt(defender.dir === 1 ? defender.x + 17 : defender.x - 1, defender.y + 7);
  }

  function updateFighter(c) {
    if (c.state === "attack") {
      c.attack += 1;
      if (c.attack >= ATTACK_TOTAL) {
        c.state = "idle";
        c.attack = 0;
      }
    } else if (c.state === "parry") {
      c.parry += 1;
      if (c.parry >= PARRY_TOTAL) {
        c.state = "idle";
        c.parry = 0;
      }
    } else if (c.state === "stun") {
      c.stun -= 1;
      if (c.stun <= 0) {
        c.state = "idle";
        c.stun = 0;
      }
    }
  }

  function updatePlayer() {
    if (player.state === "idle" || player.state === "walk") {
      let dx = 0;
      if (input?.down?.("ArrowLeft")) dx -= MOVE_SPEED_PLAYER;
      if (input?.down?.("ArrowRight")) dx += MOVE_SPEED_PLAYER;
      player.x = Math.max(4, Math.min(GAME_W - CHAR_W - 4, player.x + dx));
      player.state = dx ? "walk" : "idle";
    }
    if (input?.consume?.("z") || input?.consume?.(" ")) enterAttack(player);
    if (input?.consume?.("x") || input?.consume?.("Enter")) enterParry(player);
  }

  function updateEnemy() {
    if (enemy.state !== "idle" && enemy.state !== "walk") return;

    const dist = Math.abs(player.x - enemy.x);
    enemy.dir = player.x >= enemy.x ? 1 : -1;

    if (player.state === "attack" && player.attack >= 1 && player.attack <= 4 && dist < 30 && Math.random() < 0.045) {
      enterParry(enemy);
      return;
    }

    aiWait -= 1;
    if (dist > 34) {
      enemy.x += enemy.dir * MOVE_SPEED_ENEMY;
      enemy.state = "walk";
    } else if (dist < 20) {
      enemy.x -= enemy.dir * MOVE_SPEED_ENEMY;
      enemy.state = "walk";
    } else {
      enemy.state = "idle";
      if (aiWait <= 0 && dist < 31) {
        if (Math.random() < 0.72) enterAttack(enemy);
        else enterParry(enemy);
        aiWait = 26 + ((Math.random() * 36) | 0);
      }
    }
    enemy.x = Math.max(4, Math.min(GAME_W - CHAR_W - 4, enemy.x));
  }

  function resolveCombat() {
    const pAtk = attackLine(player);
    const eAtk = attackLine(enemy);
    const pParry = parryBox(player);
    const eParry = parryBox(enemy);

    if (pAtk && eParry && lineHitsRect(pAtk, eParry, 1)) {
      parrySuccess(enemy, player, "ENEMY PARRY");
      return;
    }
    if (eAtk && pParry && lineHitsRect(eAtk, pParry, 1)) {
      parrySuccess(player, enemy, "PARRY!");
      return;
    }
    if (pAtk && lineHitsRect(pAtk, bodyBox(enemy), 1)) {
      enemy.hit = true;
      playChambaraHit();
      setResult("YOU WIN");
      sparkAt(enemy.x + 8, enemy.y + 7);
      return;
    }
    if (eAtk && lineHitsRect(eAtk, bodyBox(player), 1)) {
      player.hit = true;
      playChambaraHit();
      setResult("YOU LOSE");
      sparkAt(player.x + 8, player.y + 7);
    }
  }

  function update() {
    if (!active) return;

    if (phase !== "play") {
      if (exiting) return;
      if (input?.consume?.("ArrowDown") || input?.consume?.("z")) resetRound();
      if (input?.consume?.("x")) close();
      return;
    }

    if (freeze > 0) {
      freeze -= 1;
      return;
    }

    updatePlayer();
    updateEnemy();
    separateFighters(player, enemy);
    resolveCombat();
    updateFighter(player);
    updateFighter(enemy);

    if (messageTimer > 0) messageTimer -= 1;
    for (const s of sparks) s.life -= 1;
    sparks = sparks.filter((s) => s.life > 0);
  }

  function drawFighterFallback(ctx, c, fill, trim) {
    ctx.fillStyle = trim;
    ctx.fillRect(c.x + 4, c.y, 8, 5);
    ctx.fillStyle = fill;
    ctx.fillRect(c.x + 3, c.y + 5, 10, 10);
    ctx.fillStyle = "#fff7e0";
    ctx.fillRect(c.x + 5, c.y + 1, 6, 5);
    ctx.fillStyle = "#111";
    ctx.fillRect(c.dir === 1 ? c.x + 9 : c.x + 5, c.y + 3, 1, 1);
  }

  function drawFighter(ctx, c, fill, trim, img) {
    const blink = c.hit && ((Date.now() / 90) | 0) % 2 === 0;
    if (blink) return;

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect((c.x + 2) | 0, GROUND + 1, 12, 2);

    const bob = c.state === "walk" ? (((Date.now() / 120) | 0) & 1) : 0;
    if (img?.complete && img.naturalWidth > 0) {
      const frameCount = Math.max(1, Math.floor(img.naturalWidth / CHAR_W));
      const frame = c.state === "walk" && frameCount > 1 ? (((Date.now() / 180) | 0) & 1) : 0;
      ctx.drawImage(img, frame * CHAR_W, 0, CHAR_W, CHAR_H, c.x | 0, (c.y + bob) | 0, CHAR_W, CHAR_H);
    } else {
      drawFighterFallback(ctx, c, fill, trim);
      ctx.fillStyle = "#151515";
      ctx.fillRect(c.x + 4, c.y + 15 + bob, 3, 1);
      ctx.fillRect(c.x + 9, c.y + 15 - bob, 3, 1);
    }

    if (c.state === "attack") drawSlashLine(ctx, c);

    const par = parryBox(c);
    if (par) {
      drawParryBlade(ctx, c);
    }
  }

  function drawSparks(ctx) {
    ctx.strokeStyle = "#fff070";
    ctx.lineWidth = 1;
    for (const s of sparks) {
      const a = Math.max(0, s.life / 14);
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.moveTo(s.x - 5, s.y);
      ctx.lineTo(s.x + 5, s.y);
      ctx.moveTo(s.x, s.y - 5);
      ctx.lineTo(s.x, s.y + 5);
      ctx.moveTo(s.x - 3, s.y - 3);
      ctx.lineTo(s.x + 3, s.y + 3);
      ctx.moveTo(s.x - 3, s.y + 3);
      ctx.lineTo(s.x + 3, s.y - 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(ctx) {
    if (!active) return;
    const prevSkipTextShadow = ctx._skipTextShadow;
    ctx._skipTextShadow = true;

    ctx.fillStyle = "#eadfbe";
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    ctx.fillStyle = "#d4c590";
    for (let x = 12; x < GAME_W; x += 12) ctx.fillRect(x, GROUND + 3, 1, 3);
    ctx.fillStyle = "#746744";
    ctx.fillRect(0, GROUND, GAME_W, 1);
    ctx.fillStyle = "#cdbb80";
    ctx.fillRect(0, GROUND + 1, GAME_W, GAME_H - GROUND - 1);

    drawFighter(ctx, player, "#171717", "#3c3c3c", getPlayerImg?.());
    drawFighter(ctx, enemy, "#8d3228", "#5a211c", enemyImg);
    drawSparks(ctx);

    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    const record = `${wins}-${losses}`;
    ctx.fillStyle = "#5c5037";
    ctx.fillText(record, ((GAME_W - ctx.measureText(record).width) / 2) | 0, 7);

    if (messageTimer > 0 || phase !== "play") {
      ctx.fillStyle = phase === "lose" ? "#7a1f1f" : "#3b3222";
      const w = ctx.measureText(message).width;
      ctx.fillText(message, ((GAME_W - w) / 2) | 0, 36);
    }

    if (phase !== "play") {
      const help = "Z RESTART   X EXIT";
      ctx.fillStyle = "#5c5037";
      ctx.fillText(help, ((GAME_W - ctx.measureText(help).width) / 2) | 0, 156);
    }

    ctx._skipTextShadow = prevSkipTextShadow;
  }

  return { start, close, finishClose, isActive, update, draw };
}
