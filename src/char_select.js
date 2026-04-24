// char_select.js
import { playCursor, playConfirm } from "./se.js";

const CHARS = [
  { label: "NINO",    key: "p3", idx: 2, color: "#4af" },
  { label: "NATSUMI", key: "p1", idx: 0, color: "#f44" },
  { label: "RIKU",    key: "p4", idx: 3, color: "#4c4" },
  { label: "MAKI",    key: "p2", idx: 1, color: "#c4f" },
];

// ---- 手書きピクセルフォント (5×7) ----
const GLYPH = {
  'S':["01110","10001","10000","01110","00001","10001","01110"],
  'E':["11110","10000","10000","11100","10000","10000","11110"],
  'L':["10000","10000","10000","10000","10000","10000","11110"],
  'C':["01110","10000","10000","10000","10000","10000","01110"],
  'T':["11111","00100","00100","00100","00100","00100","00100"],
  'Y':["10001","10001","01010","00100","00100","00100","00100"],
  'O':["01110","10001","10001","10001","10001","10001","01110"],
  'U':["10001","10001","10001","10001","10001","10001","01110"],
  'R':["11110","10001","10001","11110","10100","10010","10001"],
  'H':["10001","10001","10001","11111","10001","10001","10001"],
  'A':["01110","10001","10001","11111","10001","10001","10001"],
  'N':["10001","11001","10101","10011","10001","10001","10001"],
  'I':["01110","00100","00100","00100","00100","00100","01110"],
  'K':["10001","10010","10100","11000","10100","10010","10001"],
  'M':["10001","11011","10101","10001","10001","10001","10001"],
  'Z':["11111","00001","00010","00100","01000","10000","11111"],
  'F':["11111","10000","10000","11110","10000","10000","10000"],
  '←':["00010","00100","01000","11111","01000","00100","00010"],
  '→':["01000","00100","00010","11111","00010","00100","01000"],
  ' ':["00000","00000","00000","00000","00000","00000","00000"],
};

const GLYPH_W = 5, GLYPH_H = 7, GLYPH_GAP = 1, SPACE_W = 2;
// 右側に余白が残る文字の実幅を上書き
const CHAR_W = { 'E': 4, 'C': 4 };

export function drawPixelText(ctx, text, x, y, scale, fillColor, shadowColor) {
  let cx = x;
  for (let ci = 0; ci < text.length; ci++) {
    const ch    = text[ci];
    const g     = GLYPH[ch] || GLYPH[' '];
    const charW = ch === ' ' ? SPACE_W : (CHAR_W[ch] ?? GLYPH_W);

    // ドロップシャドウ
    if (shadowColor) {
      ctx.fillStyle = shadowColor;
      for (let row = 0; row < GLYPH_H; row++) {
        for (let col = 0; col < GLYPH_W; col++) {
          if (g[row][col] === '1')
            ctx.fillRect(cx + col * scale + 3, y + row * scale + 3, scale, scale);
        }
      }
    }

    // 黒アウトライン（8方向1px）
    ctx.fillStyle = "#000";
    for (let row = 0; row < GLYPH_H; row++) {
      for (let col = 0; col < GLYPH_W; col++) {
        if (g[row][col] !== '1') continue;
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy === 0) continue;
            ctx.fillRect(cx + col * scale + ox, y + row * scale + oy, scale, scale);
          }
        }
      }
    }

    // 本体
    ctx.fillStyle = fillColor;
    for (let row = 0; row < GLYPH_H; row++) {
      for (let col = 0; col < GLYPH_W; col++) {
        if (g[row][col] === '1')
          ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
      }
    }

    cx += (charW + GLYPH_GAP) * scale;
  }
}

export function pixelTextWidth(text, scale = 1) {
  return [...text].reduce((acc, ch) =>
    acc + ((ch === ' ' ? SPACE_W : (CHAR_W[ch] ?? GLYPH_W)) + GLYPH_GAP) * scale,
  -GLYPH_GAP * scale);
}

// セルが中心からポップインする際のイージング（軽いオーバーシュート）
function popEase(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const s = 1 - t;
  return 1 - s * s * s * s + Math.sin(t * Math.PI) * 0.12;
}

export function createCharSelect({ BASE_W, BASE_H, input, sprites }) {
  let active      = false;
  let cursor      = 0;
  let onSelect    = null;

  // トランジション
  let phase       = "idle";   // "idle" | "transition" | "active" | "confirm" | "iris"
  let transStart  = 0;
  let confirmCursor = 0; // 0=はい 1=いいえ
  let irisStart   = -1;
  const IRIS_DUR  = 700; // ms

  const CS       = 8;
  const COLS     = Math.ceil(BASE_W / CS);
  const ROWS     = Math.ceil(BASE_H / CS);
  const CX       = BASE_W / 2;
  const CY       = BASE_H / 2;
  const STAGGER  = 380;   // 端のセルが始まるまでの幅 (ms)
  const CELL_DUR = 160;   // 各セルのポップ時間 (ms)
  const UI_DELAY = STAGGER + CELL_DUR + 60; // UI が出るまでの待ち

  // 各セルの遅延を事前計算
  let maxDist = 0;
  const cellDelay = new Float32Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const dx = c * CS + CS / 2 - CX;
      const dy = r * CS + CS / 2 - CY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > maxDist) maxDist = d;
      cellDelay[r * COLS + c] = d;
    }
  }
  for (let i = 0; i < cellDelay.length; i++) {
    cellDelay[i] = (cellDelay[i] / maxDist) * STAGGER;
  }

  const SPR       = 16;
  const SEL_SCALE = 3;
  const DEF_SCALE = 2;
  const sw        = SPR * SEL_SCALE;
  const GAP       = 6;
  const totalW    = CHARS.length * sw + (CHARS.length - 1) * GAP;
  const startX    = ((BASE_W - totalW) / 2) | 0;
  const sprY      = 95;

  // タイトルをオフスクリーンに1回だけ描画してキャッシュ
  const TSCALE     = 2;
  const TITLE_L1   = "SELECT YOUR CHARACTER";
  const tCacheH    = GLYPH_H * TSCALE + 4; // 影・アウトライン分の余白
  const titleCache = document.createElement("canvas");
  titleCache.width  = BASE_W;
  titleCache.height = tCacheH;
  (() => {
    const oc  = titleCache.getContext("2d");
    oc.imageSmoothingEnabled = false;
    const textW = (str) => [...str].reduce((acc, ch) =>
      acc + ((ch === ' ' ? SPACE_W : (CHAR_W[ch] ?? GLYPH_W)) + GLYPH_GAP) * TSCALE, -GLYPH_GAP * TSCALE);
    drawPixelText(oc, TITLE_L1, ((BASE_W - textW(TITLE_L1)) / 2) | 0, 1, TSCALE, "#fff", "#ff44aa");
  })();

  function start(cb) {
    active     = true;
    cursor     = 1; // NATSUMI
    onSelect   = cb;
    phase      = "transition";
    transStart = -1; // draw() の最初のフレームで rAF の t で初期化
    input.clear();
  }

  function isActive() { return active; }

  function update() {
    if (!active) return;

    if (phase === "confirm") {
      if (input.consume("ArrowLeft") || input.consume("ArrowRight")) {
        confirmCursor ^= 1;
        playCursor();
      }
      if (input.consume("z")) {
        if (confirmCursor === 0) {
          playConfirm();
          phase     = "iris";
          irisStart = -1;
        } else {
          playCursor();
          phase = "active";
        }
      }
      if (input.consume("x")) {
        playCursor();
        phase = "active";
      }
      return;
    }

    if (phase !== "active") return;

    if (input.consume("ArrowLeft")) {
      cursor = (cursor + CHARS.length - 1) % CHARS.length;
      playCursor();
    }
    if (input.consume("ArrowRight")) {
      cursor = (cursor + 1) % CHARS.length;
      playCursor();
    }

    if (input.consume("z")) {
      confirmCursor = 0;
      phase = "confirm";
      playCursor();
    }
  }

  function drawBg(ctx) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#ffe566" : "#ffaacc";
        ctx.fillRect(c * CS, r * CS, CS, CS);
      }
    }
  }

  // 黒アウトライン付きテキスト（グローバル影に移行したため no-op）
  function strokeText(_ctx, _text, _x, _y) {}

  function drawUI(ctx, t, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(titleCache, 0, ((sprY - 3) / 2 - tCacheH / 2) | 0);

    for (let i = 0; i < CHARS.length; i++) {
      const cx    = startX + i * (sw + GAP);
      const img   = sprites[CHARS[i].key];
      const sel   = i === cursor;
      const frame = sel ? (Math.floor(t / 200) & 1) : 0;

      if (img && img.complete && img.naturalWidth > 0) {
        const scale = sel ? SEL_SCALE : DEF_SCALE;
        const dw    = SPR * scale;
        const dh    = SPR * scale;
        const ox    = ((sw - dw) / 2) | 0;
        const oy    = sw - dh;
        ctx.drawImage(img, frame * SPR, 0, SPR, SPR, cx + ox, sprY + oy, dw, dh);
      }

      // コーナーブラケットカーソル
      if (sel) {
        const L  = 5;  // ブラケットの辺の長さ
        const M  = 3;  // キャラとの余白
        const bx = cx - M;
        const by = sprY - M;
        const bw = sw + M * 2;
        const bh = sw + M * 2;
        ctx.strokeStyle = CHARS[cursor].color;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        // 左上
        ctx.moveTo(bx + L, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + L);
        // 右上
        ctx.moveTo(bx + bw - L, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + L);
        // 左下
        ctx.moveTo(bx, by + bh - L); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + L, by + bh);
        // 右下
        ctx.moveTo(bx + bw - L, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - L);
        ctx.stroke();
      }

      const label  = CHARS[i].label;
      const labelW = [...label].reduce((a, ch) => a + ((CHAR_W[ch] ?? GLYPH_W) + GLYPH_GAP), -GLYPH_GAP);
      const lx     = (cx + (sw - labelW) / 2) | 0;
      const ly     = sprY + sw + 5;
      const color  = sel ? CHARS[cursor].color : "#aaa";
      drawPixelText(ctx, label, lx, ly, 1, color, null);

    }

    const hint  = "← → SELECT  Z CONFIRM";
    const hintW = [...hint].reduce((a, ch) => a + ((ch === ' ' ? SPACE_W : (CHAR_W[ch] ?? GLYPH_W)) + GLYPH_GAP), -GLYPH_GAP);
    drawPixelText(ctx, hint, ((BASE_W - hintW) / 2) | 0, BASE_H - 18, 1, "#fff", null);

    // 確認ダイアログ
    if (phase === "confirm") {
      const name = CHARS[cursor].label;
      const msg  = name + " でよろしいですか？";

      const dw = 160, dh = 40;
      const dx = ((BASE_W - dw) / 2) | 0;
      const dy = ((BASE_H - dh) / 2 + 30) | 0;

      // 背景
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = CHARS[cursor].color;
      ctx.lineWidth = 1;
      ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);

      // メッセージ
      const mw = ctx.measureText(msg).width;
      const mx = (dx + (dw - mw) / 2) | 0;
      strokeText(ctx, msg, mx, dy + 7);
      ctx.fillStyle = "#fff";
      ctx.fillText(msg, mx, dy + 7);

      // はい / いいえ
      const opts = ["はい", "いいえ"];
      const optY = dy + 22;
      for (let i = 0; i < opts.length; i++) {
        const ow  = ctx.measureText(opts[i]).width;
        const ox  = i === 0 ? (dx + dw / 2 - ow - 12) | 0 : (dx + dw / 2 + 12) | 0;
        const sel = i === confirmCursor;
        strokeText(ctx, opts[i], ox, optY);
        ctx.fillStyle = sel ? CHARS[cursor].color : "#aaa";
        ctx.fillText(opts[i], ox, optY);
        if (sel) {
          ctx.beginPath();
          ctx.moveTo(ox - 8, optY + 1);
          ctx.lineTo(ox - 8, optY + 9);
          ctx.lineTo(ox - 3, optY + 5);
          ctx.closePath();
          ctx.strokeStyle = "#000";
          ctx.lineWidth   = 2;
          ctx.lineJoin    = "round";
          ctx.stroke();
          ctx.fillStyle = CHARS[cursor].color;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  function draw(ctx, t) {
    if (!active) return;

    if (phase === "transition") {
      if (transStart < 0) transStart = t;
      const elapsed = t - transStart;

      // 黒背景（セルの隙間をふさぐ）
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, BASE_W, BASE_H);

      // 各セルをポップイン
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const delay    = cellDelay[r * COLS + c];
          const cellElap = elapsed - delay;
          const prog     = Math.min(1, Math.max(0, cellElap / CELL_DUR));
          if (prog <= 0) continue;

          const s   = popEase(prog);
          const x   = c * CS;
          const y   = r * CS;
          const pcx = x + CS / 2;
          const pcy = y + CS / 2;
          const hw  = CS / 2 * s;

          ctx.fillStyle = (r + c) % 2 === 0 ? "#ffe566" : "#ffaacc";
          ctx.fillRect(pcx - hw, pcy - hw, hw * 2, hw * 2);
        }
      }

      // トランジション完了チェック
      if (elapsed >= UI_DELAY) {
        phase = "active";
      }

      // UI フェードイン（トランジション終盤から）
      const uiFadeStart = STAGGER + CELL_DUR * 0.5;
      const uiAlpha     = Math.min(1, Math.max(0, (elapsed - uiFadeStart) / 200));
      if (uiAlpha > 0) drawUI(ctx, t, uiAlpha);

      return;
    }

    // アイリスクローズ
    if (phase === "iris") {
      if (irisStart < 0) irisStart = t;
      const prog   = Math.min(1, (t - irisStart) / IRIS_DUR);
      const ease   = prog * prog; // ease-in（加速しながら閉じる）
      const maxR   = Math.sqrt(BASE_W * BASE_W + BASE_H * BASE_H);
      const radius = maxR * (1 - ease);

      const selSlotX = startX + cursor * (sw + GAP);
      const irisCX   = selSlotX + sw / 2;
      const irisCY   = sprY + sw / 2;

      drawBg(ctx);
      drawUI(ctx, t, 1);

      // even-odd で「黒全面 - 円の穴」を描く
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.rect(0, 0, BASE_W, BASE_H);
      if (radius > 0) ctx.arc(irisCX, irisCY, radius, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
      ctx.restore();

      if (prog >= 1) {
        active = false;
        phase  = "idle";
        onSelect && onSelect(CHARS[cursor].idx);
      }
      return;
    }

    // active
    drawBg(ctx);
    drawUI(ctx, t, 1);
  }

  return { start, isActive, update, draw };
}
