// ui_choice.js
import { playTypingVoice } from "./se.js";

export function createChoice({ BASE_W, BASE_H, input } = {}) {
  let active = false;
  let options = [];
  let cursor = 0;
  let onSelect = null;
  let question = null;

  // タイプライター
  const CHAR_MS  = 60;
  let charIndex  = 0;
  let lastCharMs = 0;

  // インライン表示時のボックス（ダイアログと同じ位置・サイズ）
  const inlineRect = {
    x: 8,
    y: (BASE_H - 55 - 8) | 0,
    w: (BASE_W - 16) | 0,
    h: 55,
  };

  // デフォルト位置（フローティング小窓、question なし時に使用）
  let anchor = { x: (BASE_W - 8 - 78) | 0, y: (BASE_H - 8 - 60) | 0, w: 78, h: 60 };

  function isActive() {
    return active;
  }

  function setAnchorRect(dialogRect) {
    // 互換用
  }

  function setAnchor(r) {
    if (!r) return;
    anchor = {
      x: (r.x | 0),
      y: (r.y | 0),
      w: (r.w | 0),
      h: (r.h | 0),
    };
  }

  function isTypingDone() {
    if (!question) return true;
    return charIndex >= String(question).length;
  }

  function open(newOptions, cb, q = null) {
    active     = true;
    options    = Array.isArray(newOptions) ? newOptions : [];
    cursor     = 0;
    onSelect   = typeof cb === "function" ? cb : null;
    question   = q || null;
    charIndex  = 0;
    lastCharMs = Date.now();
    input.clear();
  }

  function close() {
    active   = false;
    options  = [];
    cursor   = 0;
    onSelect = null;
    question = null;
  }

  function update() {
    if (!active) return;

    // タイプライター進行
    if (question && !isTypingDone()) {
      const now     = Date.now();
      const elapsed = now - lastCharMs;
      const add     = Math.floor(elapsed / CHAR_MS);
      if (add > 0) {
        charIndex  += add;
        lastCharMs += add * CHAR_MS;
        const total = String(question).length;
        if (charIndex > total) charIndex = total;
        if (!isTypingDone()) playTypingVoice("default");
      }

      // タイプ中は Z で即完了
      if (input.consume("z")) {
        charIndex = String(question).length;
      }
      return;
    }

    if (question) {
      // 横並び：左右キーで選択
      if (input.consume("ArrowLeft"))  cursor = Math.max(0, cursor - 1);
      if (input.consume("ArrowRight")) cursor = Math.min((options.length | 0) - 1, cursor + 1);
    } else {
      if (input.consume("ArrowUp"))   cursor = Math.max(0, cursor - 1);
      if (input.consume("ArrowDown")) cursor = Math.min((options.length | 0) - 1, cursor + 1);
    }

    if (input.consume("z")) {
      const cb  = onSelect;
      const idx = cursor | 0;
      close();
      if (cb) cb(idx);
      return;
    }

    if (input.consume("x")) {
      const cb = onSelect;
      close();
      if (cb) cb(1); // キャンセル＝いいえ
    }
  }

  function drawInline(ctx) {
    const r   = inlineRect;
    const pad = 10;

    // ダイアログと同じスタイルのボックス
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(r.x + 3, r.y + 3, r.w, r.h);
    ctx.fillStyle = "#000";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, 1);
    ctx.fillRect(r.x - 1, r.y + r.h, r.w + 2, 1);
    ctx.fillRect(r.x - 1, r.y - 1, 1, r.h + 2);
    ctx.fillRect(r.x + r.w, r.y - 1, 1, r.h + 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2;
    ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);

    ctx.fillStyle    = "#fff";
    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";

    // 質問テキスト（タイプライター）
    const visible = String(question).slice(0, charIndex);
    ctx.fillText(visible, r.x + pad, r.y + 7);

    // タイプ完了後のみ選択肢を表示
    if (!isTypingDone()) return;

    const cy     = r.y + 7 + 18;
    const hPad   = 6;  // ボックス左右パディング
    const gapW   = 16; // 選択肢間隔
    const labels = options.map(o => String(o ?? ""));
    const widths = labels.map(l => Math.ceil(ctx.measureText(l).width));
    const boxW   = widths.map(w => w + hPad * 2);
    const totalW = boxW.reduce((s, w, i) => s + w + (i < boxW.length - 1 ? gapW : 0), 0);
    let cx       = r.x + ((r.w - totalW) / 2) | 0;

    for (let i = 0; i < options.length; i++) {
      if (i === cursor) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(cx, cy - 1, boxW[i], 13);
        ctx.fillStyle = "#000";
        ctx.fillText(labels[i], cx + hPad, cy);
        ctx.fillStyle = "#fff";
      } else {
        ctx.fillText(labels[i], cx + hPad, cy);
      }
      cx += boxW[i] + (i < boxW.length - 1 ? gapW : 0);
    }
  }

  function draw(ctx) {
    if (!active) return;

    if (question) {
      drawInline(ctx);
      return;
    }

    // フローティング小窓（question なし時の従来表示）
    const x = anchor.x | 0;
    const y = anchor.y | 0;
    const w = anchor.w | 0;

    const pad  = 10;
    const rowH = 14;
    const h    = (pad * 2 + (options.length | 0) * rowH) | 0;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x + 3, y + 3, w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x - 1, y - 1, w + 2, 1);
    ctx.fillRect(x - 1, y + h, w + 2, 1);
    ctx.fillRect(x - 1, y - 1, 1, h + 2);
    ctx.fillRect(x + w, y - 1, 1, h + 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.fillStyle    = "#fff";
    ctx.font         = "10px PixelMplus10";
    ctx.textBaseline = "top";

    for (let i = 0; i < options.length; i++) {
      const yy = y + pad + i * rowH;
      if (i === cursor) ctx.fillText("▶", x + pad, yy);
      ctx.fillText(String(options[i] ?? ""), x + pad + 14, yy);
    }
  }

  return { isActive, setAnchorRect, setAnchor, open, update, draw };
}
