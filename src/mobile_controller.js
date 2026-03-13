// mobile_controller.js
export function setupMobileController(input) {
  const style = document.createElement("style");
  style.textContent = `
    body {
      background: #c45a00;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    #screen-wrap {
      width: 100%;
      max-width: 480px;
      background: #f5a800;
      padding: 16px 0 0;
      box-shadow: inset 0 -4px 12px rgba(0,0,0,0.2);
    }

    #c {
      display: block;
      width: 100% !important;
      height: auto !important;
      max-width: 480px;
    }

    #mobile-ctrl {
      width: 100%;
      max-width: 480px;
      background: #f5a800;
      box-sizing: border-box;
      padding: 18px 24px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-radius: 0 0 48px 48px;
      box-shadow: inset 0 4px 12px rgba(0,0,0,0.25);
    }

    #mobile-ctrl .row-main {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
    }

    /* ---- スティック ---- */
    .stick-wrap {
      position: relative;
      width: 130px;
      height: 130px;
      flex-shrink: 0;
    }
    .stick-base {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #c45a00;
      box-shadow: 0 4px 0 #0d0020, inset 0 2px 6px rgba(0,0,0,0.6);
    }
    .stick-knob {
      position: absolute;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: radial-gradient(circle at 38% 35%, #ffd240, #c45a00);
      box-shadow: 0 4px 0 #8a3a00;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: transform 0.05s;
    }

    /* ---- A/B ---- */
    .ab-group {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;
    }
    .ab-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn-ab {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      border: none;
      background: #c45a00;
      color: #fff3cc;
      font-size: 15px;
      font-weight: bold;
      font-family: sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 0 #8a3a00;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    .btn-ab:active, .btn-ab.pressed {
      box-shadow: 0 1px 0 #0d0020;
      transform: translateY(4px);
      background: #e06800;
    }
    .btn-ab.btn-b { margin-top: 20px; }

    /* ---- 下段 ---- */
    .row-bottom {
      display: flex;
      gap: 20px;
      margin-top: 18px;
    }
    .btn-small {
      width: 72px;
      height: 26px;
      border-radius: 13px;
      border: none;
      background: #c45a00;
      color: #fff3cc;
      font-size: 11px;
      font-family: sans-serif;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 3px 0 #8a3a00;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    .btn-small:active, .btn-small.pressed {
      box-shadow: 0 1px 0 #0d0020;
      transform: translateY(2px);
      background: #e06800;
    }
  `;
  document.head.appendChild(style);

  // canvas を screen-wrap で包む
  const canvas = document.getElementById("c");
  const wrap = document.createElement("div");
  wrap.id = "screen-wrap";
  canvas.parentNode.insertBefore(wrap, canvas);
  wrap.appendChild(canvas);

  const ctrl = document.createElement("div");
  ctrl.id = "mobile-ctrl";
  ctrl.innerHTML = `
    <div class="row-main">
      <div class="stick-wrap" id="stick-wrap">
        <div class="stick-base"></div>
        <div class="stick-knob" id="stick-knob"></div>
      </div>
      <div class="ab-group">
        <div class="ab-row">
          <button class="btn-ab btn-b" data-key="x">B</button>
          <button class="btn-ab btn-a" data-key="z">A</button>
        </div>
      </div>
    </div>
    <div class="row-bottom">
      <button class="btn-small" data-key-tap="s">SAVE</button>
      <button class="btn-small" data-key-tap="l">LOAD</button>
    </div>
  `;
  document.body.appendChild(ctrl);

  // ---- 振動 ----
  function vibrate(ms = 10) {
    try { navigator.vibrate?.(ms); } catch (_) {}
  }

  // ---- スティック ロジック ----
  const stickWrap = ctrl.querySelector("#stick-wrap");
  const stickKnob = ctrl.querySelector("#stick-knob");
  const RADIUS    = 65;   // ベース半径 (px)
  const DEAD      = 18;   // デッドゾーン (px)
  const CLAMP     = 38;   // ノブの最大移動量 (px)

  let stickActive = false;
  let currentKeys = new Set();

  function setKeys(keys) {
    // 新しく押すキー
    for (const k of keys) {
      if (!currentKeys.has(k)) input.press(k);
    }
    // 離すキー
    for (const k of currentKeys) {
      if (!keys.has(k)) input.release(k);
    }
    currentKeys = new Set(keys);
  }

  function onStickMove(cx, cy, touch) {
    const rect = stickWrap.getBoundingClientRect();
    const ox   = rect.left + rect.width  / 2;
    const oy   = rect.top  + rect.height / 2;
    const dx   = touch.clientX - ox;
    const dy   = touch.clientY - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // ノブ位置
    const clampedDist = Math.min(dist, CLAMP);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;
    stickKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;

    // 方向判定（8方向）
    const keys = new Set();
    if (dist >= DEAD) {
      const deg = (angle * 180 / Math.PI + 360) % 360;
      if (deg >= 337.5 || deg < 22.5)   keys.add("ArrowRight");
      else if (deg < 67.5)               { keys.add("ArrowRight"); keys.add("ArrowDown"); }
      else if (deg < 112.5)              keys.add("ArrowDown");
      else if (deg < 157.5)              { keys.add("ArrowLeft");  keys.add("ArrowDown"); }
      else if (deg < 202.5)              keys.add("ArrowLeft");
      else if (deg < 247.5)              { keys.add("ArrowLeft");  keys.add("ArrowUp"); }
      else if (deg < 292.5)              keys.add("ArrowUp");
      else if (deg < 337.5)              { keys.add("ArrowRight"); keys.add("ArrowUp"); }
    }
    setKeys(keys);
  }

  function onStickEnd() {
    stickKnob.style.transform = "translate(-50%, -50%)";
    setKeys(new Set());
    stickActive = false;
  }

  stickWrap.addEventListener("touchstart", e => {
    e.preventDefault();
    stickActive = true;
    vibrate(8);
    onStickMove(0, 0, e.touches[0]);
  }, { passive: false });

  stickWrap.addEventListener("touchmove", e => {
    e.preventDefault();
    if (stickActive) onStickMove(0, 0, e.touches[0]);
  }, { passive: false });

  stickWrap.addEventListener("touchend",    e => { e.preventDefault(); onStickEnd(); }, { passive: false });
  stickWrap.addEventListener("touchcancel", e => { e.preventDefault(); onStickEnd(); }, { passive: false });

  // マウスフォールバック
  stickWrap.addEventListener("mousedown", e => {
    stickActive = true;
    onStickMove(0, 0, e);
    const move = ev => { if (stickActive) onStickMove(0, 0, ev); };
    const up   = ()  => { onStickEnd(); window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   up);
  });

  // ---- A/B ボタン ----
  ctrl.querySelectorAll("[data-key]").forEach(btn => {
    const key = btn.dataset.key;
    const press   = e => { e.preventDefault(); btn.classList.add("pressed");    vibrate(12); input.press(key); };
    const release = e => { e.preventDefault(); btn.classList.remove("pressed"); input.release(key); };
    btn.addEventListener("touchstart",  press,   { passive: false });
    btn.addEventListener("touchend",    release, { passive: false });
    btn.addEventListener("touchcancel", release, { passive: false });
    btn.addEventListener("mousedown",  press);
    btn.addEventListener("mouseup",    release);
    btn.addEventListener("mouseleave", release);
  });

  // ---- SAVE/LOAD ----
  ctrl.querySelectorAll("[data-key-tap]").forEach(btn => {
    const key = btn.dataset.keyTap;
    const tap = e => {
      e.preventDefault();
      btn.classList.add("pressed");
      vibrate(15);
      input.press(key);
      setTimeout(() => { input.release(key); btn.classList.remove("pressed"); }, 80);
    };
    btn.addEventListener("touchstart", tap, { passive: false });
    btn.addEventListener("mousedown",  tap);
  });
}
