// ui_shooting.js – INFIERNO TRIP シューティング

const SPR = 16;
const BULLET_SPD   = 5.5;
const ENEMY_BULLET_SPD = 2.2;
const PLAYER_SPD   = 2.2;
const SHOOT_INTERVAL = 12; // frames
const PLAYER_LIVES  = 3;
const INVINCIBLE_FRAMES = 90;
const SLOW_DURATION = 180; // frames
const SLOW_INTERVAL = 600; // frames between slow triggers
const BOSS_EVERY    = 3;   // N wave ごとにボス

const POPS = ["CALIENTE!!", "VIVA!!", "あつい", "MUERTO!", "INFIERNO!", "ヤバい!!"];

export function drawShootingBackdrop(ctx, BASE_W, BASE_H, tt = 0) {
  const hue = ((tt || 0) * 0.024) % 360;
  const wobblePhase = (tt || 0) * 0.0024;

  const grad = ctx.createLinearGradient(0, 0, 0, BASE_H);
  grad.addColorStop(0,    `hsl(${hue % 360},100%,55%)`);
  grad.addColorStop(0.25, `hsl(${(hue + 60) % 360},100%,60%)`);
  grad.addColorStop(0.5,  `hsl(${(hue + 120) % 360},100%,58%)`);
  grad.addColorStop(0.75, `hsl(${(hue + 200) % 360},100%,55%)`);
  grad.addColorStop(1,    `hsl(${(hue + 280) % 360},100%,52%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let y = 0; y < BASE_H; y += 6) {
    const offset = Math.sin(wobblePhase * 2 + y * 0.08) * 10;
    ctx.fillStyle = `hsl(${(hue + y * 1.2) % 360},100%,80%)`;
    ctx.fillRect(offset, y, BASE_W, 3);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.15;
  const cx = BASE_W / 2 + Math.sin(wobblePhase * 0.5) * 20;
  const cy = BASE_H / 2 + Math.cos(wobblePhase * 0.3) * 15;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + wobblePhase * 0.2;
    ctx.strokeStyle = `hsl(${(hue + i * 30) % 360},100%,90%)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, BASE_W, BASE_H);
  ctx.restore();
}

export function createShooting({ BASE_W, BASE_H, input, sprites, getLeaderImg } = {}) {

  let phase = "idle"; // idle | countdown | playing | result
  const COUNTDOWN_FRAMES = 60; // 1カウントあたりのフレーム数
  let countdownTimer = 0;
  let onEnd = null;

  // ---- state ----
  let player, bullets, enemyBullets, enemies, particles, popTexts;
  let score, wave, waveTimer, shootTimer;
  let lives, hitFlash;
  let boss;
  let hue, wobblePhase, wobbleAmp;
  let slowTimer, slowCooldown;
  let resultTimer;
  let autoEndOnClear = false;
  let cleared = false;
  let playerFrame, playerFrameTimer;
  let enemyFrame, enemyFrameTimer;

  // ---- helpers ----
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return (a + Math.random() * (b - a)) | 0; }

  function spawnParticles(x, y, count, colors) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = rand(0.8, 3.2);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: randInt(18, 36),
        maxLife: 0,
        color: colors[randInt(0, colors.length)],
        r: rand(1.5, 3.5),
      });
    }
    particles.forEach(p => { if (!p.maxLife) p.maxLife = p.life; });
  }

  function spawnPop(x, y) {
    popTexts.push({ text: POPS[randInt(0, POPS.length)], x, y, life: 50 });
  }

  function spawnWave() {
    wave++;
    const count = 3 + Math.min(wave * 2, 14);
    for (let i = 0; i < count; i++) {
      const type = wave <= 1 ? "small"
                 : wave <= 3 ? (Math.random() < 0.4 ? "zigzag" : "small")
                 : (Math.random() < 0.3 ? "shooter" : Math.random() < 0.5 ? "zigzag" : "small");
      enemies.push(makeEnemy(type, i, count));
    }
    waveTimer = 0;
  }

  function makeEnemy(type, idx, total) {
    const x = 12 + (idx / Math.max(total - 1, 1)) * (BASE_W - 24);
    const sprKey = type === "shooter" ? "skull_r" : type === "zigzag" ? "skull_b" : "skull_a";
    return {
      x, y: -SPR - rand(0, 60),
      vx: type === "zigzag" ? rand(0.6, 1.2) * (Math.random() < 0.5 ? 1 : -1) : 0,
      vy: type === "shooter" ? rand(0.5, 0.9) : rand(0.8, 1.5),
      type, sprKey,
      hp: type === "shooter" ? 3 : 1,
      sinePhase: Math.random() * Math.PI * 2,
      shootTimer: randInt(60, 120),
      frame: 0,
      flickerTimer: 0,
    };
  }

  function spawnBoss() {
    boss = {
      x: BASE_W / 2, y: -SPR,
      vx: 1.2, vy: 0.5,
      hp: 20 + wave * 5, maxHp: 20 + wave * 5,
      shootTimer: 40,
      phase: 0,
      flickerTimer: 0,
      size: 2.5,
    };
  }

  function isSlow() { return slowTimer > 0; }
  function dt() { return isSlow() ? 0.35 : 1; }
  function isShielding() { return input.down("c"); }

  // ---- public ----
  function start(cb, opt = {}) {
    onEnd   = cb;
    phase   = "countdown";
    countdownTimer = COUNTDOWN_FRAMES * 3;
    player  = { x: BASE_W / 2, y: BASE_H - 30, invTimer: 0 };
    bullets = []; enemyBullets = []; enemies = []; particles = []; popTexts = [];
    score = 0; wave = 0; waveTimer = 999; shootTimer = 0;
    lives = PLAYER_LIVES; hitFlash = 0;
    boss = null;
    hue = 0; wobblePhase = 0; wobbleAmp = 2;
    slowTimer = 0; slowCooldown = SLOW_INTERVAL;
    resultTimer = 0;
    autoEndOnClear = !!opt.autoEndOnClear;
    cleared = false;
    playerFrame = 0; playerFrameTimer = 0;
    enemyFrame  = 0; enemyFrameTimer  = 0;
  }

  function isActive() { return phase !== "idle"; }

  function update() {
    if (phase === "idle") return;

    if (phase === "countdown") {
      hue = (hue + 0.4) % 360;
      wobblePhase += 0.04;
      countdownTimer--;
      if (countdownTimer <= 0) phase = "playing";
      return;
    }

    if (phase === "result") {
      resultTimer++;
      if (cleared && autoEndOnClear && resultTimer > 45) {
        phase = "idle";
        if (typeof onEnd === "function") onEnd(Math.floor(score / 10), { cleared: true });
        return;
      }
      if (resultTimer > 60 && input.consume("z")) {
        phase = "idle";
        if (typeof onEnd === "function") onEnd(Math.floor(score / 10), { cleared: false });
      }
      return;
    }

    // ---- timers ----
    hue = (hue + 0.4 * dt()) % 360;
    wobblePhase += 0.04 * dt();
    wobbleAmp = 1.5 + Math.sin(wobblePhase * 0.7) * 1.2;
    if (hitFlash > 0) hitFlash--;

    // スプライトアニメ
    if (++playerFrameTimer >= 8) { playerFrame ^= 1; playerFrameTimer = 0; }
    if (++enemyFrameTimer  >= 12) { enemyFrame  ^= 1; enemyFrameTimer  = 0; }

    // slow
    if (slowTimer > 0) slowTimer -= 1;
    if (slowCooldown > 0) slowCooldown -= 1;
    if (slowCooldown <= 0 && enemies.length > 2) {
      slowTimer    = SLOW_DURATION;
      slowCooldown = SLOW_INTERVAL;
    }

    // particles
    for (const p of particles) { p.x += p.vx * dt(); p.y += p.vy * dt(); p.life--; }
    particles = particles.filter(p => p.life > 0);
    for (const t of popTexts) t.life--;
    popTexts = popTexts.filter(t => t.life > 0);

    // DEBUG: B で体力回復
    if (input.consume("b")) lives = PLAYER_LIVES;

    // ---- player ----
    if (input.down("ArrowLeft"))  player.x -= PLAYER_SPD;
    if (input.down("ArrowRight")) player.x += PLAYER_SPD;
    if (input.down("ArrowUp"))    player.y -= PLAYER_SPD;
    if (input.down("ArrowDown"))  player.y += PLAYER_SPD;
    player.x = Math.max(6, Math.min(BASE_W - 6, player.x));
    player.y = Math.max(6, Math.min(BASE_H - 6, player.y));
    if (player.invTimer > 0) player.invTimer--;

    if (shootTimer > 0) shootTimer--;
    if (input.down("z") && shootTimer <= 0) {
      bullets.push({ x: player.x, y: player.y - 10 });
      shootTimer = SHOOT_INTERVAL;
    }

    // ---- bullets ----
    for (const b of bullets) b.y -= BULLET_SPD * dt();
    bullets = bullets.filter(b => b.y > -8);

    for (const b of enemyBullets) { b.x += b.vx * dt(); b.y += b.vy * dt(); }
    enemyBullets = enemyBullets.filter(b => b.x > -8 && b.x < BASE_W + 8 && b.y < BASE_H + 8);

    // ---- wave spawn ----
    if (!boss) {
      waveTimer++;
      const allGone = enemies.length === 0;
      if (allGone && waveTimer > 80) {
        if (wave > 0 && wave % BOSS_EVERY === 0) spawnBoss();
        else spawnWave();
      }
    }

    // ---- enemies ----
    for (const e of enemies) {
      e.sinePhase += 0.05 * dt();
      e.x += (e.vx + Math.sin(e.sinePhase) * 0.8) * dt();
      e.y += e.vy * dt();
      if (e.x < 8 || e.x > BASE_W - 8) e.vx *= -1;
      if (e.flickerTimer > 0) e.flickerTimer--;

      // shooter: 弾を撃つ
      if (e.type === "shooter") {
        e.shootTimer -= dt();
        if (e.shootTimer <= 0) {
          const dx = player.x - e.x, dy = player.y - e.y;
          const len = Math.sqrt(dx*dx + dy*dy) || 1;
          enemyBullets.push({ x: e.x, y: e.y, vx: dx/len * ENEMY_BULLET_SPD, vy: dy/len * ENEMY_BULLET_SPD });
          e.shootTimer = randInt(60, 100);
        }
      }

      // 自機との衝突
      if (player.invTimer <= 0 && !isShielding()) {
        const dx = player.x - e.x, dy = player.y - e.y;
        if (dx*dx + dy*dy < 10*10) { playerHit(); }
      }
    }
    enemies = enemies.filter(e => e.y < BASE_H + SPR);

    // ---- boss ----
    if (boss) {
      boss.x += boss.vx * dt();
      boss.y = Math.min(boss.y + boss.vy * dt(), 48);
      if (boss.x < 16 || boss.x > BASE_W - 16) boss.vx *= -1;
      if (boss.flickerTimer > 0) boss.flickerTimer--;

      boss.shootTimer -= dt();
      if (boss.shootTimer <= 0) {
        const angles = boss.phase === 0 ? [Math.PI/2]
                     : boss.phase === 1 ? [Math.PI/2 - 0.3, Math.PI/2, Math.PI/2 + 0.3]
                     : [Math.PI/2 - 0.5, Math.PI/2 - 0.15, Math.PI/2 + 0.15, Math.PI/2 + 0.5];
        for (const a of angles) {
          enemyBullets.push({ x: boss.x, y: boss.y + SPR, vx: Math.cos(a) * ENEMY_BULLET_SPD * 1.2, vy: Math.sin(a) * ENEMY_BULLET_SPD * 1.2 });
        }
        boss.shootTimer = boss.phase >= 2 ? 25 : 40;
      }

      // ボス×自機衝突
      if (player.invTimer <= 0 && !isShielding()) {
        const dx = player.x - boss.x, dy = player.y - boss.y;
        if (dx*dx + dy*dy < 18*18) playerHit();
      }
    }

    // ---- 弾×敵 ----
    for (const b of bullets) {
      // 雑魚
      for (const e of enemies) {
        if (e.flickerTimer > 0) continue;
        const dx = b.x - e.x, dy = b.y - e.y;
        if (dx*dx + dy*dy < 9*9) {
          b.dead = true; e.hp--;
          e.flickerTimer = 8;
          if (e.hp <= 0) {
            e.dead = true;
            score += e.type === "shooter" ? 300 : 100;
            spawnParticles(e.x, e.y, 10, ["#ff6b35","#ffd700","#ff88ff","#fff"]);
            spawnPop(e.x, e.y - 10);
          }
        }
      }
      // ボス
      if (boss && !b.dead) {
        const dx = b.x - boss.x, dy = b.y - boss.y;
        if (dx*dx + dy*dy < 20*20) {
          b.dead = true;
          boss.hp--;
          boss.flickerTimer = 6;
          boss.phase = boss.hp < boss.maxHp * 0.3 ? 2 : boss.hp < boss.maxHp * 0.6 ? 1 : 0;
          if (boss.hp <= 0) {
            score += 3000;
            spawnParticles(boss.x, boss.y, 30, ["#ff6b35","#ffd700","#ff88ff","#8ef","#fff"]);
            spawnPop(boss.x, boss.y - 20);
            boss = null;
            hitFlash = 20;
            if (autoEndOnClear) {
              cleared = true;
              enemies = [];
              enemyBullets = [];
              phase = "result";
              resultTimer = 0;
              input.clear();
            } else {
              spawnWave();
            }
          }
        }
      }
    }
    bullets      = bullets.filter(b => !b.dead);
    enemies      = enemies.filter(e => !e.dead);

    // ---- 敵弾×自機 ----
    if (player.invTimer <= 0 && !isShielding()) {
      for (const b of enemyBullets) {
        const dx = player.x - b.x, dy = player.y - b.y;
        if (dx*dx + dy*dy < 7*7) { b.dead = true; playerHit(); break; }
      }
      enemyBullets = enemyBullets.filter(b => !b.dead);
    }

    // ゲームオーバー
    if (lives <= 0) { phase = "result"; resultTimer = 0; input.clear(); }
  }

  function playerHit() {
    lives--;
    player.invTimer = INVINCIBLE_FRAMES;
    hitFlash = 15;
    wobbleAmp = 6;
    spawnParticles(player.x, player.y, 8, ["#f44","#f88","#fff"]);
  }

  // ---- draw ----
  function drawBackground(ctx) {
    drawShootingBackdrop(ctx, BASE_W, BASE_H, hue / 0.024);
  }

  function drawEnemies(ctx) {
    for (const e of enemies) {
      if (e.flickerTimer > 0 && Math.floor(e.flickerTimer / 2) % 2) continue;
      const sx = (e.x - SPR / 2) | 0, sy = (e.y - SPR / 2) | 0;
      const img = sprites?.[e.sprKey];
      if (img && img.naturalWidth > 0) {
        ctx.save();
        ctx.filter = `hue-rotate(${(hue + e.sinePhase * 30) % 360}deg)`;
        ctx.drawImage(img, enemyFrame * SPR, 0, SPR, SPR, sx, sy, SPR, SPR);
        ctx.filter = "none";
        ctx.restore();
      } else {
        ctx.fillStyle = `hsl(${(hue + 120) % 360},90%,60%)`;
        ctx.fillRect(sx, sy, SPR, SPR);
      }
    }
  }

  function drawBoss(ctx) {
    if (!boss) return;
    const s = boss.size;
    const sw = SPR * s, sh = SPR * s;
    const sx = (boss.x - sw / 2) | 0, sy = (boss.y - sh / 2) | 0;
    if (boss.flickerTimer > 0 && Math.floor(boss.flickerTimer / 2) % 2) return;
    if (sprites?.skull_r && sprites.skull_r.naturalWidth > 0) {
      ctx.save();
      ctx.filter = `hue-rotate(${hue % 360}deg) brightness(1.4)`;
      ctx.drawImage(sprites.skull_r, enemyFrame * SPR, 0, SPR, SPR, sx, sy, sw, sh);
      ctx.filter = "none";
      ctx.restore();
    } else {
      ctx.fillStyle = `hsl(${hue % 360},100%,60%)`;
      ctx.fillRect(sx, sy, sw, sh);
    }
    // HPバー
    const bw = 60, bh = 5, bx = (BASE_W - bw) / 2, by = 8;
    ctx.fillStyle = "#300"; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = `hsl(${(hue+180)%360},100%,55%)`;
    ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), bh);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, bh + 1);
    ctx.font = "normal 6px monospace";
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.fillText("EL JIGOKU", BASE_W / 2, by - 2);
    ctx.textAlign = "left";
  }

  function drawPlayer(ctx) {
    if (player.invTimer > 0 && Math.floor(player.invTimer / 5) % 2) return;
    const img = typeof getLeaderImg === "function" ? getLeaderImg() : sprites?.p1;
    const sx = (player.x - SPR / 2) | 0, sy = (player.y - SPR / 2) | 0;
    if (isShielding()) {
      ctx.save();
      ctx.strokeStyle = "#8ef";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (img && img.naturalWidth > 0) {
      ctx.drawImage(img, playerFrame * SPR, 0, SPR, SPR, sx, sy, SPR, SPR);
    } else {
      ctx.fillStyle = "#8ef"; ctx.fillRect(sx, sy, SPR, SPR);
    }
  }

  function drawBullets(ctx) {
    // 自機弾：ハート風（黄色い楕円）
    ctx.save();
    ctx.fillStyle = `hsl(${(hue + 60) % 360},100%,70%)`;
    for (const b of bullets) {
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // 敵弾：赤い丸
    ctx.save();
    ctx.fillStyle = `hsl(${hue % 360},100%,60%)`;
    for (const b of enemyBullets) {
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles(ctx) {
    for (const p of particles) {
      const alpha = p.life / (p.maxLife || 30);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawPops(ctx) {
    ctx.save();
    for (const t of popTexts) {
      const alpha = t.life / 50;
      ctx.globalAlpha = alpha;
      ctx.font = "normal 8px PixelMplus10";
      ctx.fillStyle = `hsl(${(hue + 60) % 360},100%,75%)`;
      ctx.textAlign = "center";
      ctx.fillText(t.text, t.x, t.y - (1 - alpha) * 16);
    }
    ctx.textAlign = "left";
    ctx.restore();
  }

  function drawHUD(ctx) {
    // ライフ（唐辛子）
    const pepperSize = 12;
    for (let i = 0; i < PLAYER_LIVES; i++) {
      const px = 4 + i * (pepperSize + 2);
      const pepperImg = i < lives ? sprites?.pepper : (sprites?.pepper_off || sprites?.pepper);
      if (pepperImg && pepperImg.naturalWidth > 0) {
        ctx.drawImage(pepperImg, px, 3, pepperSize, pepperSize);
      }
    }
    // スコア
    ctx.textAlign = "right";
    ctx.fillStyle = `hsl(${(hue+60)%360},100%,70%)`;
    ctx.fillText(`${score}pt`, BASE_W - 4, 4);
    ctx.textAlign = "left";
    // スロー表示
    if (isSlow()) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.3;
      ctx.fillStyle = "#88ffff";
      ctx.font = "normal 8px PixelMplus10";
      ctx.textAlign = "center";
      ctx.fillText("S  L  O  W", BASE_W / 2, BASE_H / 2);
      ctx.textAlign = "left";
      ctx.restore();
    }
    if (isShielding()) {
      ctx.save();
      ctx.fillStyle = "#8ef";
      ctx.font = "normal 8px PixelMplus10";
      ctx.textAlign = "center";
      ctx.fillText("C SHIELD", BASE_W / 2, BASE_H - 12);
      ctx.textAlign = "left";
      ctx.restore();
    }
  }

  function drawCountdown(ctx) {
    const num = Math.ceil(countdownTimer / COUNTDOWN_FRAMES);
    const progress = (countdownTimer % COUNTDOWN_FRAMES) / COUNTDOWN_FRAMES; // 1→0
    const scale = 1 + (1 - progress) * 1.5; // 大きく出てだんだん縮む
    const alpha = Math.min(1, progress * 3);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "normal 10px PixelMplus10";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(BASE_W / 2, BASE_H / 2);
    ctx.scale(scale, scale);

    // 影
    ctx.fillStyle = "#000";
    ctx.fillText(num, 2, 2);
    // 本体
    ctx.fillStyle = `hsl(${(hue + num * 60) % 360},100%,90%)`;
    ctx.fillText(num, 0, 0);

    ctx.restore();
  }

  function drawResult(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(10,0,20,0.85)";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.font = "normal 10px PixelMplus10";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillStyle = lives <= 0 ? "#f66" : `hsl(${hue%360},100%,70%)`;
    ctx.fillText(lives <= 0 ? "MUERTO..." : "VIVA!!", BASE_W / 2, 50);
    ctx.fillStyle = "#fff";
    ctx.fillText(`スコア: ${score} pt`, BASE_W / 2, 68);
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`${Math.floor(score / 10)} EN ゲット！`, BASE_W / 2, 84);
    if (resultTimer > 60) {
      ctx.fillStyle = "#888"; ctx.font = "normal 8px PixelMplus10";
      ctx.fillText("Z でもどる", BASE_W / 2, 104);
    }
    ctx.textAlign = "left";
    ctx.restore();
  }

  function draw(ctx) {
    if (phase === "idle") return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // ドラッギー画面揺れ
    const wobble = Math.sin(wobblePhase) * wobbleAmp;
    ctx.translate(wobble, 0);

    // ヒットフラッシュ
    if (hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = hitFlash / 15 * 0.4;
      ctx.fillStyle = "#f44";
      ctx.fillRect(-wobble, 0, BASE_W, BASE_H);
      ctx.restore();
    }

    drawBackground(ctx);
    if (phase !== "countdown") {
      drawParticles(ctx);
      drawBullets(ctx);
      drawEnemies(ctx);
      drawBoss(ctx);
      drawPlayer(ctx);
      drawPops(ctx);
      drawHUD(ctx);
    }

    if (phase === "countdown") drawCountdown(ctx);
    if (phase === "result")    drawResult(ctx);

    ctx.restore();
  }

  return { start, isActive, update, draw };
}
