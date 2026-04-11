// ui_jumprope.js
import { playConfirm } from "./se.js";
import { STATE } from "./state.js";

export function createJumprope({ BASE_W, BASE_H, input, getParty, yahhyImg } = {}) {
  let active          = false;
  let angle           = 0;
  let speed           = 0.055;
  let count           = 0;
  let phase           = "idle"; // idle | ready | countdown | playing | miss
  let jumpFrame       = 0;
  let hitChecked      = false;
  let missTimer       = 0;
  let onEnd           = null;
  let cdStep          = 0;   // 0=3, 1=2, 2=1, 3=スタート
  let cdTimer         = 0;

  const CD_FRAMES = 52; // 1ステップあたりのフレーム数

  const BASE_SPEED  = 0.055;
  const JUMP_FRAMES = 22;
  const SPR         = 16;

  // キャラクター4体の横並び
  const GAP      = 2;
  const GROUP_W  = SPR * 4 + GAP * 3;   // 70px
  const GROUP_X  = ((BASE_W - GROUP_W) / 2) | 0; // 各キャラの左端x
  const CHARS    = [0, 1, 2, 3].map(i => GROUP_X + i * (SPR + GAP));

  // レイアウト
  const CX       = (BASE_W / 2) | 0;
  const POLE_LX  = 30;
  const POLE_RX  = BASE_W - 30;
  const ANCHOR_Y = 68;
  const AMP      = 92;
  const FLOOR_Y  = ANCHOR_Y + AMP;       // 160
  const PLY      = FLOOR_Y - SPR;        // 立ち時の上端y (144)
  const JUMP_H   = 32;

  // 縄の描画専用アンカー（ポール・キャラ位置とは独立）
  const ROPE_Y   = FLOOR_Y - 44;         // 116
  const ROPE_AMP = 55;

  const HIT_MARGIN = 0.14;

  function isActive() { return active; }

  function start(cb) {
    active     = true;
    angle      = 0;
    speed      = BASE_SPEED;
    count      = 0;
    phase      = "ready";
    jumpFrame  = 0;
    hitChecked = false;
    missTimer  = 0;
    cdStep     = 0;
    cdTimer    = CD_FRAMES;
    onEnd      = typeof cb === "function" ? cb : null;
    input.clear();
  }

  function close() {
    active = false;
    phase  = "idle";
  }

  function groupY() {
    if (jumpFrame <= 0) return PLY;
    const t    = jumpFrame / JUMP_FRAMES;
    const lift = Math.sin(t * Math.PI) * JUMP_H;
    return (PLY - lift) | 0;
  }

  function update() {
    if (!active || phase === "idle") return;

    if (phase === "ready") {
      if (input.consume("z") || input.consume("x")) {
        phase   = "countdown";
        cdStep  = 0;
        cdTimer = CD_FRAMES;
      }
      return;
    }

    if (phase === "miss") {
      missTimer--;
      if (missTimer <= 0) {
        if (count > (STATE.flags.jumpropeBest ?? 0)) STATE.flags.jumpropeBest = count;
        const cb = onEnd;
        const c  = count;
        close();
        if (cb) cb(c);
      }
      return;
    }

    if (phase === "countdown") {
      if (cdStep >= 2) {
        angle += speed;
        if (angle >= Math.PI * 2) angle -= Math.PI * 2;
      }
      cdTimer--;
      if (cdTimer <= 0) {
        cdStep++;
        if (cdStep >= 3) {
          phase = "playing";
        } else {
          cdTimer = CD_FRAMES;
        }
      }
      return;
    }

    angle += speed;
    if (angle >= Math.PI * 2) angle -= Math.PI * 2;

    if (jumpFrame > 0) jumpFrame--;

    if (Math.abs(angle - Math.PI) > HIT_MARGIN + 0.15) hitChecked = false;

    if (!hitChecked && Math.abs(angle - Math.PI) <= HIT_MARGIN) {
      hitChecked = true;
      if (jumpFrame > 0) {
        count++;
        speed = BASE_SPEED + Math.min(count * 0.0018, 0.07);
        playConfirm();
      } else {
        phase     = "miss";
        missTimer = 90;
      }
    }

    if (phase === "playing" && input.consume("z") && jumpFrame <= 0) {
      jumpFrame = JUMP_FRAMES;
    }
  }

  function drawRope(ctx) {
    const cpY  = ROPE_Y + (-Math.cos(angle)) * ROPE_AMP;
    const sinA = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(POLE_LX, ROPE_Y);
    ctx.quadraticCurveTo(CX, cpY, POLE_RX, ROPE_Y);
    ctx.strokeStyle = sinA >= 0 ? "#fff" : "#555";
    ctx.lineWidth   = sinA >= 0 ? 2 : 1;
    ctx.stroke();
  }

  function drawChars(ctx, py) {
    const p = getParty ? getParty() : {};
    const members = [p.leader, p.p2, p.p3, p.p4];

    if (phase === "miss") ctx.globalAlpha = 0.5;

    for (let i = 0; i < 4; i++) {
      const m = members[i];
      const x = CHARS[i];
      if (m?.img) {
        ctx.drawImage(m.img, 0, 0, SPR, SPR, x, py, SPR, SPR);
      } else {
        // フォールバック：白矩形
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, py, SPR, SPR);
      }
    }

    ctx.globalAlpha = 1;
  }

  function draw(ctx) {
    if (!active) return;

    // 背景：青空 + 砂浜
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, BASE_W, FLOOR_Y);
    ctx.fillStyle = "#f5dfa0";
    ctx.fillRect(0, FLOOR_Y, BASE_W, BASE_H - FLOOR_Y);

    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";


    const sinA = Math.sin(angle);
    const py   = groupY();

    // yahhy（縄回し役）：支点から5px外・5px上
    if (yahhyImg) {
      const sy       = (ROPE_Y - SPR / 2 - 5) | 0;
      const feetY    = sy + SPR;
      const floorY   = FLOOR_Y + 6;
      const platW    = SPR;
      const platH    = floorY - feetY;

      // 台（足元〜床）
      ctx.fillStyle = "#fff";
      ctx.fillRect(POLE_LX - platW / 2 - 5, feetY, platW, platH);
      ctx.fillRect(POLE_RX - platW / 2 + 5, feetY, platW, platH);
      // 左：5px外（左）へ
      ctx.drawImage(yahhyImg, 0, 0, SPR, SPR, POLE_LX - SPR / 2 - 5, sy, SPR, SPR);
      // 右：5px外（右）へ、左右反転
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(yahhyImg, 0, 0, SPR, SPR, -(POLE_RX + SPR / 2 + 5), sy, SPR, SPR);
      ctx.restore();
    }

    if (sinA < 0) drawRope(ctx);
    drawChars(ctx, py);
    if (sinA >= 0) drawRope(ctx);

    // カウント（暗背景で文字くっきり）
    ctx.fillStyle = "#000";
    ctx.fillRect(CX - 12, 10, 24, 14);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(String(count), CX, 12);
    ctx.textAlign = "left";

    // ハイスコア（右下）
    const hsText = "BEST " + (STATE.flags.jumpropeBest ?? 0);
    const hsW    = ctx.measureText(hsText).width + 6;
    const hsH    = 14;
    const hsX    = BASE_W - hsW - 4;
    const hsY    = BASE_H - hsH - 4;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(hsX, hsY, hsW, hsH);
    ctx.fillStyle = "#ffe";
    ctx.fillText(hsText, hsX + 3, hsY + 2);

    if (phase === "miss") {
      const mw = 48, mh = 14;
      const mx = CX - mw / 2, my = (BASE_H / 2 + 14) | 0;
      ctx.fillStyle    = "#000";
      ctx.fillRect(mx, my, mw, mh);
      ctx.fillStyle    = "#f55";
      ctx.textAlign    = "center";
      ctx.textBaseline = "top";
      ctx.fillText("MISS!", CX, my + 2);
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
    }

    if (phase === "ready") {
      ctx.fillStyle    = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.font         = "normal 16px PixelMplus10";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle    = "#fff";
      ctx.fillText("なわとび", CX, (BASE_H / 2) | 0);
      ctx.font         = "normal 10px PixelMplus10";
      ctx.fillStyle    = "#ffe";
      ctx.fillText("Z でジャンプ", CX, ((BASE_H / 2) | 0) + 20);
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
    }

    if (phase === "countdown") {
      const labels = ["3", "2", "1"];
      const label  = labels[cdStep] ?? "";

      ctx.fillStyle    = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.font         = "normal 32px PixelMplus10";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle    = "#fff";
      ctx.fillText(label, CX, (BASE_H / 2) | 0);
      ctx.textAlign    = "left";
      ctx.textBaseline = "top";
    }
  }

  return { isActive, start, close, update, draw };
}
