// title.js
import { playCursor, playConfirm } from "./se.js";
import { VERSION } from "./config.js";

export function createTitle({ BASE_W, BASE_H, input }) {
  let active     = false;
  let cursor     = 0; // 0=new game, 1=continue
  let onNewGame  = null;
  let onContinue = null;

  const ITEMS = ["new game", "continue"];

  const duckImg = new Image();
  duckImg.src = "assets/sprites/duck.png";

  function start(callbacks) {
    active     = true;
    cursor     = 0;
    onNewGame  = callbacks.onNewGame;
    onContinue = callbacks.onContinue;
    input.clear();
  }

  function isActive() { return active; }

  function update() {
    if (!active) return;

    if (input.consume("ArrowUp") || input.consume("ArrowLeft")) {
      cursor = (cursor + ITEMS.length - 1) % ITEMS.length;
      playCursor();
    }
    if (input.consume("ArrowDown") || input.consume("ArrowRight")) {
      cursor = (cursor + 1) % ITEMS.length;
      playCursor();
    }

    if (input.consume("z")) {
      playConfirm();
      active = false;
      if (cursor === 0) onNewGame  && onNewGame();
      else              onContinue && onContinue();
    }
  }

  function draw(ctx, t) {
    if (!active) return;

    // 背景
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.fillStyle    = "#fff";

    // タイトル（1行）
    const title  = "FIND THE LOVER DUCKS";
    const titleY = 60;
    ctx.fillText(title, ((BASE_W - ctx.measureText(title).width) / 2) | 0, titleY);

    // ダック画像（タイトルの下）
    if (duckImg.complete && duckImg.naturalWidth > 0) {
      const SPR   = 16;
      const SCALE = 3;
      const dw    = SPR * SCALE;
      const dh    = SPR * SCALE;
      const dx    = ((BASE_W - dw) / 2) | 0;
      const dy    = titleY + 20;
      const frame = (Math.floor(t / 400) & 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(duckImg, frame * SPR, 0, SPR, SPR, dx, dy, dw, dh);
    }

    // バージョン（右上）
    ctx.fillStyle = "#555";
    const ver = "v" + VERSION;
    ctx.fillText(ver, BASE_W - ctx.measureText(ver).width - 4, 4);

    // メニュー
    const menuY = BASE_H - 40;
    const blink = Math.sin(t / 350) > 0;

    for (let i = 0; i < ITEMS.length; i++) {
      const y   = menuY + i * 16;
      const sel = i === cursor;
      ctx.fillStyle = sel ? "#fff" : "#888";
      if (sel && blink) ctx.fillText("▶", ((BASE_W / 2) | 0) - 30, y);
      ctx.fillText(ITEMS[i], ((BASE_W / 2) | 0) - 18, y);
    }
  }

  return { start, isActive, update, draw };
}
