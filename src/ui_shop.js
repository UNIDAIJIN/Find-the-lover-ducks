// ui_shop.js
import { playConfirm } from "./se.js";
import { STATE } from "./state.js";

export function createShop({ BASE_W, BASE_H, input } = {}) {
  let active     = false;
  let items      = [];
  let closeLabel = "やめる";
  let shopName   = "";
  let cursor     = 0;
  let scrollRow  = 0;
  let onSelect   = null;

  const WIN_W   = 160;
  const PAD     = 10;
  const TITLE_H = 16;
  const ROW_H   = 14;
  const VISIBLE_ROWS = 6;

  // 所持金小窓
  const MONEY_W = 70;
  const MONEY_H = 20;

  function totalRows() {
    return items.length + 1;
  }

  function visibleRowCount() {
    return Math.min(totalRows(), VISIBLE_ROWS);
  }

  function winRect() {
    const rows = visibleRowCount();
    const h = TITLE_H + PAD + rows * ROW_H + PAD;
    const groupH = h + 4 + MONEY_H; // メイン窓 + 余白 + 所持金小窓
    const x = ((BASE_W - WIN_W) / 2) | 0;
    const y = ((BASE_H - groupH) / 2) | 0;
    return { x, y, w: WIN_W, h };
  }

  function clampScroll() {
    const maxScroll = Math.max(0, totalRows() - VISIBLE_ROWS);
    if (scrollRow < 0) scrollRow = 0;
    if (scrollRow > maxScroll) scrollRow = maxScroll;
  }

  function followCursor() {
    if (cursor < scrollRow) scrollRow = cursor;
    if (cursor >= scrollRow + VISIBLE_ROWS) scrollRow = cursor - VISIBLE_ROWS + 1;
    clampScroll();
  }

  function moneyRect(r) {
    return {
      x: r.x + r.w - MONEY_W,
      y: r.y + r.h + 4,
      w: MONEY_W,
      h: MONEY_H,
    };
  }

  function isActive() { return active; }

  function open(newItems, closeLbl, name, cb, initialCursor = 0) {
    active     = true;
    items      = Array.isArray(newItems) ? newItems : [];
    closeLabel = closeLbl ?? "やめる";
    shopName   = name ?? "";
    cursor     = Math.min(initialCursor, items.length); // clamp（閉じるボタン含む）
    scrollRow  = 0;
    followCursor();
    onSelect   = typeof cb === "function" ? cb : null;
    input.clear();
  }

  function getCursor() { return cursor; }

  function close() {
    active    = false;
    items     = [];
    cursor    = 0;
    scrollRow = 0;
    onSelect  = null;
  }

  function allRows() {
    return [...items, { name: closeLabel, id: null, price: null }];
  }

  function update() {
    if (!active) return;

    const rows = allRows();
    if (input.consume("ArrowUp"))   { cursor = (cursor - 1 + rows.length) % rows.length; followCursor(); }
    if (input.consume("ArrowDown")) { cursor = (cursor + 1) % rows.length;               followCursor(); }

    if (input.consume("z")) {
      const row = rows[cursor];
      if (row.id === null) {
        const cb = onSelect;
        close();
        if (cb) cb(null);
        return;
      }
      if (row.price != null && STATE.money < row.price) return; // 所持金不足
      playConfirm();
      if (row.price != null) STATE.money -= row.price;
      const cb = onSelect;
      const id = row.id;
      const savedCursor = cursor;
      close();
      if (cb) cb(id, savedCursor);
      return;
    }

    if (input.consume("x")) {
      const cb = onSelect;
      close();
      if (cb) cb(null);
    }
  }

  function drawBox(ctx, x, y, w, h) {
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x - 1, y - 1, w + 2, 1);
    ctx.fillRect(x - 1, y + h, w + 2, 1);
    ctx.fillRect(x - 1, y - 1, 1, h + 2);
    ctx.fillRect(x + w, y - 1, 1, h + 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  function draw(ctx) {
    if (!active) return;

    const r    = winRect();
    const rows = allRows();

    // メイン窓
    drawBox(ctx, r.x, r.y, r.w, r.h);

    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";

    // タイトルバー
    ctx.fillStyle = "#fff";
    ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, TITLE_H);
    ctx.fillStyle = "#000";
    const titleW = ctx.measureText(shopName).width;
    const titleX = (r.x + (r.w - titleW) / 2) | 0;
    ctx.fillText(shopName, titleX, r.y + 4);

    // アイテムリスト（スクロール対応）
    const listY  = r.y + TITLE_H + PAD;
    const vis    = visibleRowCount();
    const endIdx = Math.min(rows.length, scrollRow + vis);
    for (let i = scrollRow; i < endIdx; i++) {
      const row       = rows[i];
      const iy        = listY + (i - scrollRow) * ROW_H;
      const canAfford = row.id === null || row.price == null || STATE.money >= row.price;

      const isCur = i === cursor;
      if (isCur) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(r.x + 4, iy - 1, r.w - 8, 13);
        ctx.fillStyle = canAfford ? "#000" : "#888";
      } else {
        ctx.fillStyle = canAfford ? "#fff" : "#666";
      }

      if (isCur) ctx._skipTextShadow = true;

      // アイテム名
      ctx.fillText(String(row.name ?? ""), r.x + PAD, iy);

      // 価格（右寄せ）
      if (row.price != null) {
        ctx.textAlign = "right";
        ctx.fillText(row.price + "EN", r.x + r.w - PAD, iy);
        ctx.textAlign = "left";
      }

      if (isCur) ctx._skipTextShadow = false;
    }

    // スクロールバー
    if (rows.length > vis) {
      const trackX  = r.x + r.w - 5;
      const trackY  = listY;
      const trackH  = vis * ROW_H;
      const thumbH  = Math.max(4, Math.round(trackH * vis / rows.length));
      const maxSR   = rows.length - vis;
      const thumbY  = trackY + Math.round((trackH - thumbH) * scrollRow / maxSR);
      ctx.fillStyle = "#333";
      ctx.fillRect(trackX, trackY, 2, trackH);
      ctx.fillStyle = "#fff";
      ctx.fillRect(trackX, thumbY, 2, thumbH);
    }

    // 所持金小窓
    const m = moneyRect(r);
    drawBox(ctx, m.x, m.y, m.w, m.h);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.fillText(STATE.money + "EN", m.x + m.w - PAD, m.y + 5);
    ctx.textAlign = "left";
  }

  return { isActive, open, close, getCursor, update, draw };
}
