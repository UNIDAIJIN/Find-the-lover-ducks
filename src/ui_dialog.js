// ui_dialog.js
import { playTypingVoice } from "./se.js";

export function createDialog({ BASE_W, BASE_H, input } = {}) {
  let active = false;
  let pages  = [];
  let index  = 0;
  let onClose = null;
  let type    = "talk"; // "talk" | "sign"

  // auto-advance state
  let autoAdvanceMs = 0;  // 0 = 無効
  let autoAdvanceAt = 0;

  // typewriter state
  let charIndex  = 0;
  let lastCharMs = 0;
  const CHAR_MS  = 60; // ms per character

  // ★ページ遷移通知（npc_events 側で choice を出す用）
  let onPageChangeCb  = null;
  // ★タイプ完了通知
  let onTypingDoneCb  = null;
  let typingDoneFired = false;
  // ★タイプライター音声
  let voice = "default";

  // 画面下のメッセージ窓
  const rect = {
    x: 8,
    y: (BASE_H - 55 - 8) | 0,
    w: (BASE_W - 16) | 0,
    h: 55,
  };

  const textCanvas = null; // 未使用
  const textCtx   = null; // 未使用

  function isActive() { return active; }
  function getRect()  { return { ...rect }; }

  function onPageChange(fn) {
    onPageChangeCb = typeof fn === "function" ? fn : null;
  }

  function onTypingDone(fn) {
    onTypingDoneCb  = typeof fn === "function" ? fn : null;
    typingDoneFired = false;
  }

  function setVoice(v) {
    voice = v || "default";
  }

  // ---- typewriter helpers ----
  function pageCharTotal(lines) {
    return lines.reduce((s, l) => s + String(l ?? "").length, 0);
  }

  function currentLines() {
    const page = pages[index] || [];
    return Array.isArray(page) ? page : [String(page)];
  }

  function isTypingDone() {
    if (type !== "talk") return true;
    return charIndex >= pageCharTotal(currentLines());
  }

  function completeTyping() {
    charIndex = pageCharTotal(currentLines());
    if (!typingDoneFired && onTypingDoneCb) {
      typingDoneFired = true;
      onTypingDoneCb();
    }
  }

  function resetTyping() {
    charIndex       = 0;
    lastCharMs      = Date.now();
    typingDoneFired = false;
  }

  // ---- public API ----
  function open(p, onCloseFn = null, dialogType = "talk", autoMs = 0) {
    active         = true;
    pages          = Array.isArray(p) ? p : [];
    index          = 0;
    onClose        = typeof onCloseFn === "function" ? onCloseFn : null;
    type           = dialogType;
    autoAdvanceMs  = autoMs | 0;
    autoAdvanceAt  = autoMs > 0 ? Date.now() + autoMs : 0;
    resetTyping();

    if (onPageChangeCb) onPageChangeCb(index);
    if (input && input.clear) input.clear();
  }

  function close() {
    active = false;
    pages  = [];
    index  = 0;

    const cb = onClose;
    onClose = null;
    if (cb) cb();
  }

  function advance() {
    index++;
    if (onPageChangeCb) onPageChangeCb(index);

    if (index >= pages.length) {
      close();
    } else {
      resetTyping();
      if (autoAdvanceMs > 0) autoAdvanceAt = Date.now() + autoAdvanceMs;
    }
  }

  function update() {
    if (!active) return;
    if (!input)  return;

    // typewriter: advance charIndex over time
    if (type === "talk" && !isTypingDone()) {
      const now     = Date.now();
      const elapsed = now - lastCharMs;
      const add     = Math.floor(elapsed / CHAR_MS);
      if (add > 0) {
        charIndex  += add;
        lastCharMs += add * CHAR_MS;
        const total = pageCharTotal(currentLines());
        if (charIndex > total) charIndex = total;
        if (!isTypingDone()) playTypingVoice(voice);
      }
      if (isTypingDone() && !typingDoneFired && onTypingDoneCb) {
        typingDoneFired = true;
        onTypingDoneCb();
      }
    }

    if (autoAdvanceMs > 0) {
      // Z 無効・時間で自動送り
      if (Date.now() >= autoAdvanceAt) advance();
      return;
    }

    if (input.consume("z")) {
      if (type === "talk" && !isTypingDone()) {
        // 表示中→即時完了
        completeTyping();
      } else {
        advance();
      }
    }
  }

  function wrapText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return [text];
    const result = [];
    const tokens = text.split(" ");
    let line = "";
    for (const word of tokens) {
      const candidate = line ? line + " " + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        if (line) { result.push(line); line = ""; }
        if (ctx.measureText(word).width <= maxWidth) {
          line = word;
        } else {
          // 1語が長すぎる場合は文字単位で折り返す
          for (const char of word) {
            const test = line + char;
            if (ctx.measureText(test).width > maxWidth) {
              if (line) result.push(line);
              line = char;
            } else {
              line = test;
            }
          }
        }
      }
    }
    if (line) result.push(line);
    return result;
  }

  function drawBox(ctx, lines, instant) {
    ctx.save();
    const pad   = 10;
    const maxW  = rect.w - pad * 2;

    // 影
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(rect.x + 3, rect.y + 3, rect.w, rect.h);

    ctx.fillStyle = "#000";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.fillStyle = "#000";
    ctx.fillRect(rect.x - 1, rect.y - 1, rect.w + 2, 1);
    ctx.fillRect(rect.x - 1, rect.y + rect.h, rect.w + 2, 1);
    ctx.fillRect(rect.x - 1, rect.y - 1, 1, rect.h + 2);
    ctx.fillRect(rect.x + rect.w, rect.y - 1, 1, rect.h + 2);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);

    ctx.fillStyle = "#fff";
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";

    const wrappedLines = [];
    for (const line of lines) {
      for (const wl of wrapText(ctx, String(line ?? ""), maxW)) {
        wrappedLines.push(wl);
      }
    }

    let row = 0;
    if (instant) {
      for (const wl of wrappedLines) {
        ctx.fillText(wl, rect.x + pad, rect.y + 8 + row * 16);
        row++;
      }
    } else {
      let remaining = charIndex;
      for (const wl of wrappedLines) {
        if (remaining <= 0) break;
        const visible = wl.slice(0, remaining);
        ctx.fillText(visible, rect.x + pad, rect.y + 8 + row * 16);
        remaining -= wl.length;
        row++;
      }
    }

    // カーソル（右下三角）
    if (autoAdvanceMs <= 0 && (instant || isTypingDone())) {
      const tx = rect.x + rect.w - 10;
      const ty = rect.y + rect.h - 10;
      ctx.beginPath();
      ctx.moveTo(tx - 4, ty);
      ctx.lineTo(tx + 4, ty);
      ctx.lineTo(tx, ty + 5);
      ctx.closePath();
      ctx.strokeStyle = "#000";
      ctx.lineWidth   = 2;
      ctx.lineJoin    = "round";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(ctx) {
    if (!active) return;
    drawBox(ctx, currentLines(), type === "sign");
  }

  return {
    isActive,
    open,
    close,
    update,
    draw,
    getRect,
    onPageChange,
    onTypingDone,
    completeTyping,
    setVoice,
  };
}
