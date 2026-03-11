// ui_dialog.js
export function createDialog({ BASE_W, BASE_H, input } = {}) {
  let active = false;
  let pages = [];
  let index = 0;
  let onClose = null;

  // ★ページ遷移通知（npc_events 側で choice を出す用）
  let onPageChangeCb = null;

  // 画面下のメッセージ窓
  const rect = {
    x: 8,
    y: (BASE_H - 70 - 8) | 0,
    w: (BASE_W - 16) | 0,
    h: 70,
  };

  function isActive() {
    return active;
  }

  function getRect() {
    // choice 側がアンカー計算に使う
    return { ...rect };
  }

  function onPageChange(fn) {
    onPageChangeCb = typeof fn === "function" ? fn : null;
  }

  function open(p, onCloseFn = null) {
    active = true;
    pages = Array.isArray(p) ? p : [];
    index = 0;
    onClose = typeof onCloseFn === "function" ? onCloseFn : null;

    // open 直後のページ index=0 を通知しておく（必要なら使える）
    if (onPageChangeCb) onPageChangeCb(index);

    if (input && input.clear) input.clear();
  }

  function close() {
    active = false;
    pages = [];
    index = 0;

    const cb = onClose;
    onClose = null;

    if (cb) cb();
  }

  function advance() {
    index++;

    // ★ページが変わった瞬間に通知
    if (onPageChangeCb) onPageChangeCb(index);

    if (index >= pages.length) close();
  }

  function update() {
    if (!active) return;
    if (!input) return;

    if (input.consume("z")) {
      advance();
      return;
    }
    // 必要なら x で閉じる等もここに足せるが、今は z のみ
  }

  function drawBox(ctx, lines) {
    const pad = 10;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    ctx.fillStyle = "#fff";
    ctx.font = "10px PixelMplus10";
    ctx.textBaseline = "top";

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], rect.x + pad, rect.y + pad + i * 16);
    }

    // 次ページがあるときだけ ▶
    if (index < pages.length - 1) {
      ctx.fillText("▶", rect.x + rect.w - 18, rect.y + rect.h - 20);
    }
  }

  function draw(ctx) {
    if (!active) return;

    const page = pages[index] || [];
    const lines = Array.isArray(page) ? page : [String(page)];
    drawBox(ctx, lines);
  }

  return {
    isActive,
    open,
    close,
    update,
    draw,
    getRect,
    onPageChange, // ★追加
  };
}