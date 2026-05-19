// title.js
import { playCursor, playConfirm } from "./se.js";

export function createTitle({ BASE_W, BASE_H, input, pocketEdition = false }) {
  let active     = false;
  let cursor     = 0; // 0=new game, 1=continue
  let mode       = "menu";
  let configCursor = 0;
  let listeningKey = null;
  let listeningAt = 0;
  let onNewGame  = null;
  let onContinue = null;

  const MENU_ITEMS = pocketEdition ? ["new game", "continue"] : ["new game", "continue", "config"];
  const CONFIG_ITEMS = [
    { key: "z", label: "talk" },
    { key: "x", label: "menu" },
    { key: "c", label: "dash" },
    { key: "s", label: "save" },
    { key: "l", label: "load" },
    { key: "v", label: "camera" },
    { key: "Enter", label: "start" },
    { key: "__reset", label: "reset default" },
    { key: "__back", label: "back" },
  ];

  const duckImg = new Image();
  duckImg.src = "assets/sprites/duck.png";

  function start(callbacks) {
    active     = true;
    cursor     = 0;
    mode       = "menu";
    configCursor = 0;
    listeningKey = null;
    onNewGame  = callbacks.onNewGame;
    onContinue = callbacks.onContinue;
    input.clear();
  }

  function isActive() { return active; }

  function update() {
    if (!active) return;

    if (mode === "config") {
      if (listeningKey) {
        if (input.consume("x")) {
          listeningKey = null;
          input.clear();
          return;
        }
        if (performance.now() - listeningAt > 180) {
          const idx = input.consumeGamepadButton();
          if (idx != null) {
            input.setGamepadBinding(listeningKey, idx);
            listeningKey = null;
            playConfirm();
            input.clear();
          }
        }
        return;
      }

      if (input.consume("ArrowUp") || input.consume("ArrowLeft")) {
        configCursor = (configCursor + CONFIG_ITEMS.length - 1) % CONFIG_ITEMS.length;
        playCursor();
      }
      if (input.consume("ArrowDown") || input.consume("ArrowRight")) {
        configCursor = (configCursor + 1) % CONFIG_ITEMS.length;
        playCursor();
      }
      if (input.consume("x")) {
        mode = "menu";
        playCursor();
        input.clear();
        return;
      }
      if (input.consume("z") || input.consume("Enter")) {
        const item = CONFIG_ITEMS[configCursor];
        if (item.key === "__back") {
          mode = "menu";
          playCursor();
          input.clear();
        } else if (item.key === "__reset") {
          input.resetGamepadBindings();
          playConfirm();
          input.clear();
        } else {
          listeningKey = item.key;
          listeningAt = performance.now();
          input.beginGamepadCapture();
          playConfirm();
          input.clear();
        }
      }
      return;
    }

    if (input.consume("ArrowUp") || input.consume("ArrowLeft")) {
      cursor = (cursor + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
      playCursor();
    }
    if (input.consume("ArrowDown") || input.consume("ArrowRight")) {
      cursor = (cursor + 1) % MENU_ITEMS.length;
      playCursor();
    }

    if (input.consume("z")) {
      playConfirm();
      if (cursor === 0) {
        active = false;
        onNewGame && onNewGame();
      } else if (cursor === 1) {
        active = false;
        onContinue && onContinue();
      } else {
        mode = "config";
        configCursor = 0;
        input.clear();
      }
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
    if (pocketEdition) {
      const sub = "POCKET EDITION";
      ctx.fillStyle = "#888";
      ctx.fillText(sub, ((BASE_W - ctx.measureText(sub).width) / 2) | 0, titleY + 12);
      ctx.fillStyle = "#fff";
    }

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
    const ver = "v1.2.1";
    ctx.fillText(ver, BASE_W - ctx.measureText(ver).width - 4, 4);

    if (mode === "config") {
      drawConfig(ctx, t);
      return;
    }

    // メニュー
    const menuY = BASE_H - 40 - (MENU_ITEMS.length > 2 ? 16 : 0);
    const blink = Math.sin(t / 350) > 0;

    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const y   = menuY + i * 16;
      const sel = i === cursor;
      ctx.fillStyle = sel ? "#fff" : "#888";
      if (sel && blink) ctx.fillText("▶", ((BASE_W / 2) | 0) - 30, y);
      ctx.fillText(MENU_ITEMS[i], ((BASE_W / 2) | 0) - 18, y);
    }
  }

  function bindingLabel(bindings, key) {
    const indexes = bindings[key] || [];
    if (!indexes.length) return "-";
    return indexes.map((idx) => input.gamepadButtonLabel(idx)).join("/");
  }

  function drawConfig(ctx, t) {
    ctx.font = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";
    ctx.fillText("config", 12, 32);

    const bindings = input.getGamepadBindings();
    const blink = Math.sin(t / 250) > 0;
    const startY = 54;
    for (let i = 0; i < CONFIG_ITEMS.length; i += 1) {
      const item = CONFIG_ITEMS[i];
      const y = startY + i * 14;
      const sel = i === configCursor;
      const waiting = listeningKey && item.key === listeningKey;
      if (waiting) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(10, y - 2, BASE_W - 20, 13);
      }
      ctx.fillStyle = waiting ? "#000" : sel ? "#fff" : "#888";
      const prevSkipShadow = ctx._skipTextShadow;
      if (waiting) ctx._skipTextShadow = true;
      if (sel && blink) ctx.fillText("▶", 12, y);
      ctx.fillText(item.label, 26, y);
      if (!item.key.startsWith("__")) {
        const label = bindingLabel(bindings, item.key);
        ctx.fillText(label, BASE_W - ctx.measureText(label).width - 14, y);
      }
      ctx._skipTextShadow = prevSkipShadow;
    }

    ctx.fillStyle = "#777";
    const help = listeningKey ? "press gamepad button / B cancel" : "A change  B back";
    ctx.fillText(help, ((BASE_W - ctx.measureText(help).width) / 2) | 0, BASE_H - 18);
  }

  return { start, isActive, update, draw };
}
