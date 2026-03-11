// ui_inventory.js
export function createInventory({
  BASE_W,
  BASE_H,
  input,
  itemName,
  itemBgmSrc,
  unlockBgm,
  setOverrideBgm,
  dialog, // dialog.open を使う
  startItems = [],
  visibleRows = 10,
} = {}) {
  let open = false;

  const INV_VISIBLE_ROWS = visibleRows | 0;
  const INV_VISIBLE = INV_VISIBLE_ROWS * 2;

  const inv = {
    items: [...(startItems || [])],
    cursor: 0,
    scrollRow: 0,
  };

  function isOpen() {
    return open;
  }

  function clampScroll() {
    const n = inv.items.length | 0;
    const maxRow = Math.max(0, (n - 1) >> 1);
    const maxScrollRow = Math.max(0, maxRow - INV_VISIBLE_ROWS + 1);
    inv.scrollRow = Math.max(0, Math.min(inv.scrollRow | 0, maxScrollRow));
  }

  function moveCursorTo(idx) {
    const n = inv.items.length | 0;
    if (n <= 0) {
      inv.cursor = 0;
      inv.scrollRow = 0;
      return;
    }

    inv.cursor = Math.max(0, Math.min(n - 1, idx | 0));

    const row = inv.cursor >> 1;
    if (row < inv.scrollRow) inv.scrollRow = row;
    if (row >= inv.scrollRow + INV_VISIBLE_ROWS) inv.scrollRow = row - INV_VISIBLE_ROWS + 1;
    clampScroll();
  }

  function openInv() {
    open = true;
    input.clear();

    const n = inv.items.length | 0;
    if (n <= 0) {
      inv.cursor = 0;
      inv.scrollRow = 0;
      return;
    }

    inv.cursor = Math.max(0, Math.min(n - 1, inv.cursor | 0));
    const row = inv.cursor >> 1;
    inv.scrollRow = Math.max(0, Math.min(row, inv.scrollRow | 0));
    clampScroll();
  }

  function closeInv() {
    open = false;
    input.clear();
  }

  function toggle() {
    if (open) closeInv();
    else openInv();
  }

  function confirmUse() {
    const n = inv.items.length | 0;
    if (n <= 0) return;

    const id = inv.items[inv.cursor | 0];
    const name = itemName(id);

    const src = itemBgmSrc(id);
    if (src) {
      unlockBgm();
      setOverrideBgm(src);
    }

    closeInv();
    if (dialog) dialog.open([[`${name} をつかった。`]]);
  }

  function update() {
    if (!open) return;

    const n = inv.items.length | 0;

    if (input.consume("x")) {
      closeInv();
      return;
    }
    if (n <= 0) return;

    if (input.consume("ArrowUp")) moveCursorTo(inv.cursor - 2);
    if (input.consume("ArrowDown")) moveCursorTo(inv.cursor + 2);

    if (input.consume("ArrowLeft")) {
      if ((inv.cursor & 1) === 1) moveCursorTo(inv.cursor - 1);
    }
    if (input.consume("ArrowRight")) {
      if ((inv.cursor & 1) === 0 && inv.cursor + 1 < n) moveCursorTo(inv.cursor + 1);
    }

    if (input.consume("z")) confirmUse();
  }

  function addItem(id) {
    if (!id) return;
    inv.items.push(id);
    inv.cursor = Math.max(0, inv.items.length - 1);
    inv.scrollRow = inv.cursor >> 1;
    clampScroll();
  }

  function getSnapshot() {
    return inv.items.slice();
  }

  function draw(ctx) {
    if (!open) return;

    const x = 8;
    const y = 8;
    const w = BASE_W - 16;
    const h = BASE_H >> 1;

    const pad = 10;
    const titleY = y + pad;
    const listY = y + pad + 16;

    const colGap = 14;
    const col0X = x + pad + 12;
    const colW = Math.floor((w - pad * 2 - 12 - colGap) / 2);
    const col1X = col0X + colW + colGap;

    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = "#fff";
    ctx.font = "10px PixelMplus10";
    ctx.textBaseline = "top";

    ctx.fillText("もちもの", x + pad, titleY);

    const n = inv.items.length | 0;
    if (n <= 0) {
      ctx.fillText("(なし)", x + pad, listY);
      return;
    }

    const startIdx = (inv.scrollRow | 0) * 2;
    const endIdx = Math.min(n, startIdx + INV_VISIBLE);

    for (let idx = startIdx; idx < endIdx; idx++) {
      const row = (idx - startIdx) >> 1;
      const colN = idx & 1;
      const yy = listY + row * 12;

      const name = itemName(inv.items[idx]);
      const xx = colN === 0 ? col0X : col1X;
      const arrowX = colN === 0 ? x + pad : x + pad + colW + colGap;

      if (idx === inv.cursor) ctx.fillText("▶", arrowX, yy);
      ctx.fillText(name, xx, yy);
    }
  }

  return {
    isOpen,
    open: openInv,
    close: closeInv,
    toggle,
    update,
    draw,
    addItem,
    getSnapshot,
  };
}