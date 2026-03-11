// battle_ui.js
export function drawBattleScreen(ctx, st, opt) {
  const {
    BASE_W,
    BASE_H,
    bossImg,
    DISPLAY_ORDER,
    itemName,

    uiTheme = "normal",

    flashUntil = st.flashUntil | 0,
    flashColor = st.flashColor || "#0f0",
    flashAlpha = typeof st.flashAlpha === "number" ? st.flashAlpha : 0.22,

    uiKickUntil = st.uiKickUntil | 0,
    uiKickMode = st.uiKickMode || "none",
    uiKickDx = st.uiKickDx | 0,
    uiKickAngle = typeof st.uiKickAngle === "number" ? st.uiKickAngle : 0,

    now = st.now | 0,
    msgSince = st.msgSince | 0,

    // ★ COMMAND PHASE intro anim
    cmdIntroSince = st.cmdIntroSince | 0,
    cmdIntroUntil = st.cmdIntroUntil | 0,
  } = opt || {};

  const THEME =
    uiTheme === "red"
      ? {
          bg: "#000",
          line: "#f00",
          text: "#f00",
          dead: "#f00",
          selectFill: "#f00",
          selectText: "#000",
          hpLow: "#f00",
        }
      : {
          bg: "#000",
          line: "#fff",
          text: "#fff",
          dead: "#f00",
          selectFill: "#fff",
          selectText: "#000",
          hpLow: "#ff0",
        };

  // helpers
  function drawBox(x, y, w, h) {
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = THEME.line;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  function drawText(str, x, y, color = THEME.text) {
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function isAlive(c) {
    return (c.hp | 0) > 0;
  }
  function getCharByName(name) {
    for (const c of st.party) if (c.name === name) return c;
    return null;
  }

  // bg
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, BASE_W, BASE_H);

  ctx.font = "10px PixelMplus10";
  ctx.textBaseline = "top";

  // --- LOG (固定：上) ---
  const logX = 8;
  const logY = 8;
  const logW = BASE_W - 16;
  const logH = 38;

  // --- UI layout (下) ---
  const statX = 8;
  const statY = 120;
  const statW = 150;
  const statH = 76;

  const cmdX = 160;
  const cmdY = 120;
  const cmdW = 88;
  const cmdH = 76;

  // items window（表示中のみ）
  const invX = 160;
  const invY = 44;
  const invW = 88;
  const invH = 68;

  // --- BOSS position ---
  const bossAreaTop = 52;
  const bossAreaBottom = 112;
  const bossAreaH = bossAreaBottom - bossAreaTop;

  // =====================
  // LOG layer (no shake)
  // =====================
  drawBox(logX, logY, logW, logH);

  // ---- LOG CONTENT ----
  if (st.msg && (st.msg.lines || []).length) {
    // 通常ログ（\n は明示改行）
    const rawLines = [];
    for (const s of st.msg.lines || []) {
      const parts = String(s ?? "").split("\n");
      for (const p of parts) rawLines.push(p);
    }
    const visible = rawLines.slice(0, 2);

    // center表示指定なら中央描画＋軽いアニメ
    if (st.msg.center) {
      const text = visible[0] || "";
      const t = Math.max(0, (now | 0) - (msgSince | 0));
      const dur = Math.max(1, st.msg.autoMs | 0);

      // 0→1→0 の山型
      const u = Math.min(1, t / dur);
      const tri = u < 0.5 ? u / 0.5 : (1 - u) / 0.5; // 0..1..0
      const alpha = 0.25 + tri * 0.75;
      const scale = 1 + tri * 0.06;

      ctx.save();
      ctx.globalAlpha = alpha;

      const cx = logX + logW / 2;
      const cy = logY + logH / 2;

      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      ctx.fillStyle = THEME.text;
      const w = ctx.measureText(text).width;
      ctx.fillText(text, (cx - w / 2) | 0, (cy - 6) | 0);
      ctx.restore();
    } else {
      for (let i = 0; i < visible.length; i++) {
        drawText(visible[i], logX + 10, logY + 8 + i * 14, THEME.text);
      }
    }
  } else {
    // st.msg が無いとき：コマンド入力中だけ COMMAND PHASE を出す
    const inCommand = st.phase === "choose" || st.phase === "items";
    if (inCommand) {
      const text = "COMMAND PHASE";
      const cx = logX + logW / 2;
      const cy = logY + logH / 2;

      // 既存：点滅（ほんのりパルス）
      const s = Math.sin((now | 0) / 260);
      const blinkAlpha = 0.45 + (s * 0.5 + 0.5) * 0.35; // 0.45..0.8

      // 追加：表示開始アニメ（指定時間だけ下からスッ＋少し拡大）
      let intro = 1; // 0..1
      if ((cmdIntroUntil | 0) > (now | 0)) {
        const dur = Math.max(1, (cmdIntroUntil | 0) - (cmdIntroSince | 0));
        const tt = Math.max(0, (now | 0) - (cmdIntroSince | 0));
        intro = Math.min(1, tt / dur);
      }
      const e = 1 - Math.pow(1 - intro, 3); // easeOut

      const yOff = (1 - e) * 10; // 下から10px上がる
      const scale = 0.92 + e * 0.08; // 0.92→1.0
      const alpha = blinkAlpha * (0.25 + e * 0.75);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = THEME.text;

      const w = ctx.measureText(text).width;

      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      ctx.fillText(text, (cx - w / 2) | 0, ((cy - 6) + yOff) | 0);
      ctx.restore();
    }
  }

  // =====================
  // Shake params
  // =====================
  const shaking = (st.shakeUntil | 0) > (st.now | 0) && (st.shakeAmp | 0) > 0;
  const mode = st.shakeMode === "ui" ? "ui" : "boss";

  function shakeTranslate() {
    const amp = st.shakeAmp | 0;
    const dx = (((Math.random() * (amp * 2 + 1)) | 0) - amp) | 0;
    const dy = (((Math.random() * (amp * 2 + 1)) | 0) - amp) | 0;
    ctx.translate(dx, dy);
  }

  // =====================
  // Boss layer
  // =====================
  ctx.save();
  if (shaking && mode === "boss") shakeTranslate();

  if (bossImg && bossImg.complete && bossImg.naturalWidth > 0) {
    const bw = bossImg.naturalWidth | 0;
    const bh = bossImg.naturalHeight | 0;
    const x = ((BASE_W - bw) / 2) | 0;
    const y = (bossAreaTop + ((bossAreaH - bh) / 2)) | 0;
    ctx.drawImage(bossImg, x, y);
  }
  ctx.restore();

  // =====================
  // HUD layer (+shake +uiKick)
  // =====================
  ctx.save();

  if (shaking && mode === "ui") shakeTranslate();

  const kickOn = (uiKickUntil | 0) > (now | 0);
  if (kickOn && uiKickMode === "sidestep") {
    ctx.translate(uiKickDx | 0, 0);
  } else if (kickOn && uiKickMode === "tilt") {
    const px = (BASE_W / 2) | 0;
    const py = (BASE_H / 2) | 0;
    ctx.translate(px, py);
    ctx.rotate(uiKickAngle || 0);
    ctx.translate(-px + (uiKickDx | 0), -py);
  }

  // status / command windows
  drawBox(statX, statY, statW, statH);
  drawBox(cmdX, cmdY, cmdW, cmdH);

  // status rows
  for (let i = 0; i < DISPLAY_ORDER.length; i++) {
    const name = DISPLAY_ORDER[i];
    const c = getCharByName(name);
    if (!c) continue;

    const yy = statY + 8 + i * 16;

    const dead = !isAlive(c) || String(c.status || "") === "DEAD";

    const selecting =
      (st.phase === "choose" || st.phase === "items") &&
      !st.msg &&
      i === (st.activeDispIdx | 0) &&
      !dead;

    if (selecting) {
      ctx.fillStyle = THEME.selectFill;
      ctx.fillRect(statX + 3, yy - 1, statW - 6, 14);
      ctx.fillStyle = THEME.selectText;
    } else {
      if (dead) ctx.fillStyle = THEME.dead;
      else {
        const maxHp = c.maxHp | 0;
        const hp = c.hp | 0;
        const low = Math.floor(maxHp * 0.2);
        ctx.fillStyle = hp <= low ? THEME.hpLow : THEME.text;
      }
    }

    ctx.fillText(c.name, statX + 8, yy);

    const hpStr = `HP${String(c.hp).padStart(3, " ")}`;
    ctx.fillText(hpStr, statX + 58, yy);

    // status（6文字固定）
    const stStr = String(c.status ?? "").padEnd(6, " ").slice(0, 6);
    ctx.fillText(stStr, statX + 106, yy);
  }

  // command list
  const cmdList = st.cmds;

  if (st.phase === "items") {
    // 親コマンドはカーソル無し
    for (let i = 0; i < cmdList.length; i++) {
      const yy = cmdY + 8 + i * 14;
      drawText(cmdList[i], cmdX + 18, yy, THEME.text);
    }

    // items window
    drawBox(invX, invY, invW, invH);

    const n = st.invItems.length | 0;
    if (n <= 0) {
      drawText("(なし)", invX + 8, invY + 8, THEME.text);
    } else {
      const visible = 4;
      const start = Math.max(
        0,
        Math.min((st.invCursor | 0) - ((visible / 2) | 0), Math.max(0, n - visible))
      );

      for (let k = 0; k < Math.min(visible, n - start); k++) {
        const idx = start + k;
        const yy = invY + 8 + k * 14;
        if (idx === (st.invCursor | 0)) drawText("▶", invX + 6, yy, THEME.text);

        const id = st.invItems[idx];
        const label = typeof itemName === "function" ? itemName(id) : String(id ?? "");
        drawText(label, invX + 18, yy, THEME.text);
      }
    }
  } else {
    for (let i = 0; i < cmdList.length; i++) {
      const yy = cmdY + 8 + i * 14;
      const sel = st.phase === "choose" && i === (st.menuIdx | 0) && !st.msg;
      if (sel) drawText("▶", cmdX + 6, yy, THEME.text);
      drawText(cmdList[i], cmdX + 18, yy, THEME.text);
    }
  }

  ctx.restore();

  // =====================
  // Flash overlay
  // =====================
  if ((flashUntil | 0) > (now | 0) && flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor || "#0f0";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();
  }
}
