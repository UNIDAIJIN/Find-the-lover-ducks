// ui_dialog.js
export function createDialog({ BASE_W, BASE_H, input } = {}) {
  let active = false;
  let pages  = [];
  let index  = 0;
  let onClose = null;
  let type    = "talk"; // "talk" | "sign"

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
  function open(p, onCloseFn = null, dialogType = "talk") {
    active  = true;
    pages   = Array.isArray(p) ? p : [];
    index   = 0;
    onClose = typeof onCloseFn === "function" ? onCloseFn : null;
    type    = dialogType;
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

    if (input.consume("z")) {
      if (type === "talk" && !isTypingDone()) {
        // 表示中→即時完了
        completeTyping();
      } else {
        advance();
      }
    }
  }

  function drawBox(ctx, lines, instant) {
    const pad = 10;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    ctx.fillStyle = "#fff";
    ctx.font = "10px PixelMplus10";
    ctx.textBaseline = "top";

    if (instant) {
      // sign: 全文即時
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], rect.x + pad, rect.y + pad + i * 16);
      }
    } else {
      // talk: typewriter
      let remaining = charIndex;
      for (let i = 0; i < lines.length; i++) {
        const line = String(lines[i] ?? "");
        if (remaining <= 0) break;
        ctx.fillText(line.slice(0, remaining), rect.x + pad, rect.y + pad + i * 16);
        remaining -= line.length;
      }
    }

    // カーソル：タイプ完了時のみ表示
    if (instant || isTypingDone()) {
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
