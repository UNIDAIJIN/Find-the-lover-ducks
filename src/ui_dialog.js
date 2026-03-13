// ui_dialog.js
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
  const CHAR_MS  = 40; // ms per character

  // ★ページ遷移通知（npc_events 側で choice を出す用）
  let onPageChangeCb = null;

  // 画面下のメッセージ窓
  const rect = {
    x: 8,
    y: (BASE_H - 70 - 8) | 0,
    w: (BASE_W - 16) | 0,
    h: 70,
  };

  function isActive() { return active; }
  function getRect()  { return { ...rect }; }

  function onPageChange(fn) {
    onPageChangeCb = typeof fn === "function" ? fn : null;
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
  }

  function resetTyping() {
    charIndex  = 0;
    lastCharMs = Date.now();
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
    const pad   = 10;
    const maxW  = rect.w - pad * 2;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    ctx.fillStyle = "#fff";
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";

    // 全行を先にラップ確定させる
    const wrappedLines = [];
    for (const line of lines) {
      for (const wl of wrapText(ctx, String(line ?? ""), maxW)) {
        wrappedLines.push(wl);
      }
    }

    let row = 0;
    if (instant) {
      // sign: 全文即時
      for (const wl of wrappedLines) {
        ctx.fillText(wl, rect.x + pad, rect.y + pad + row * 16);
        row++;
      }
    } else {
      // talk: typewriter（折り返し位置は固定済み）
      let remaining = charIndex;
      for (const wl of wrappedLines) {
        if (remaining <= 0) break;
        ctx.fillText(wl.slice(0, remaining), rect.x + pad, rect.y + pad + row * 16);
        remaining -= wl.length;
        row++;
      }
    }

    // カーソル：タイプ完了時のみ表示（auto-advance 時は非表示）
    if (autoAdvanceMs <= 0 && (instant || isTypingDone())) {
      const cursor = index < pages.length - 1 ? "▶" : "▼";
      ctx.fillText(cursor, rect.x + rect.w - 18, rect.y + rect.h - 20);
    }
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
  };
}
