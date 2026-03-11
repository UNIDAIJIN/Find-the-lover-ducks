// ui_choice.js
export function createChoice({ BASE_W, BASE_H, input } = {}) {
  let active = false;
  let options = [];
  let cursor = 0;
  let onSelect = null;

  // デフォルト位置（右下）
  let anchor = { x: (BASE_W - 8 - 78) | 0, y: (BASE_H - 8 - 60) | 0, w: 78, h: 60 };

  function isActive() {
    return active;
  }

  function setAnchorRect(dialogRect) {
    // 互換用：今は使わなくてもOK（main側で呼んでた名残）
    // 必要ならここでdialogRectを保持してもよい
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

  function open(newOptions, cb) {
    active = true;
    options = Array.isArray(newOptions) ? newOptions : [];
    cursor = 0;
    onSelect = typeof cb === "function" ? cb : null;
    input.clear();
  }

  function close() {
    active = false;
    options = [];
    cursor = 0;
    onSelect = null;
  }

  function update() {
    if (!active) return;

    if (input.consume("ArrowUp")) cursor = Math.max(0, cursor - 1);
    if (input.consume("ArrowDown")) cursor = Math.min((options.length | 0) - 1, cursor + 1);

    if (input.consume("z")) {
      const cb = onSelect;
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

  function draw(ctx) {
    if (!active) return;

    const x = anchor.x | 0;
    const y = anchor.y | 0;
    const w = anchor.w | 0;

    const pad = 10;
    const rowH = 14;
    const h = (pad * 2 + (options.length | 0) * rowH) | 0;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = "#fff";
    ctx.font = "10px PixelMplus10";
    ctx.textBaseline = "top";

    for (let i = 0; i < options.length; i++) {
      const yy = y + pad + i * rowH;
      if (i === cursor) ctx.fillText("▶", x + pad, yy);
      ctx.fillText(String(options[i] ?? ""), x + pad + 14, yy);
    }
  }

  return { isActive, setAnchorRect, setAnchor, open, update, draw };
}