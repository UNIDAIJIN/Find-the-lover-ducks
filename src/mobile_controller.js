// mobile_controller.js
export function setupMobileController(input) {
  const style = document.createElement("style");
  style.textContent = `
    body {
      background: #2a0a5e;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
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
      background: #3a0e82;
      box-sizing: border-box;
      padding: 18px 24px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      border-radius: 0 0 48px 48px;
      box-shadow: inset 0 4px 12px rgba(0,0,0,0.5);
    }

    #mobile-ctrl .row-main {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
    }

    /* ---- D-pad ---- */
    .dpad {
      position: relative;
      width: 130px;
      height: 130px;
      flex-shrink: 0;
    }
    .dpad button {
      position: absolute;
      background: #1a0040;
      border: none;
      border-radius: 8px;
      color: #888;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
      box-shadow: 0 4px 0 #0d0020;
    }
    .dpad button:active, .dpad button.pressed { background: #2d007a; box-shadow: 0 1px 0 #0d0020; transform: translateY(3px); }
    .dpad .d-up    { top: 0;   left: 43px; width: 44px; height: 44px; border-radius: 8px 8px 0 0; }
    .dpad .d-down  { bottom: 0;left: 43px; width: 44px; height: 44px; border-radius: 0 0 8px 8px; }
    .dpad .d-left  { top: 43px;left: 0;   width: 44px; height: 44px; border-radius: 8px 0 0 8px; }
    .dpad .d-right { top: 43px;right: 0;  width: 44px; height: 44px; border-radius: 0 8px 8px 0; }
    .dpad .d-center{ top: 43px;left: 43px;width: 44px; height: 44px; background: #1a0040; border: none; border-radius: 0; pointer-events: none; box-shadow: none; }

    /* ---- A/B ---- */
    .ab-group {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
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
      background: #1a0040;
      color: #888;
      font-size: 15px;
      font-weight: bold;
      font-family: sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 5px 0 #0d0020;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    .btn-ab:active, .btn-ab.pressed { box-shadow: 0 1px 0 #0d0020; transform: translateY(4px); background: #2d007a; }
    .btn-ab.btn-a { margin-bottom: 0; }
    .btn-ab.btn-b { margin-top: 20px; }

    /* ---- 下段ボタン ---- */
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
      background: #1a0040;
      color: #888;
      font-size: 11px;
      font-family: sans-serif;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 3px 0 #0d0020;
      -webkit-tap-highlight-color: transparent;
      touch-action: none;
    }
    .btn-small:active, .btn-small.pressed { box-shadow: 0 1px 0 #0d0020; transform: translateY(2px); background: #2d007a; }
  `;
  document.head.appendChild(style);

  const ctrl = document.createElement("div");
  ctrl.id = "mobile-ctrl";
  ctrl.innerHTML = `
    <div class="row-main">
      <div class="dpad">
        <div class="d-center"></div>
        <button class="d-up"    data-key="ArrowUp">▲</button>
        <button class="d-down"  data-key="ArrowDown">▼</button>
        <button class="d-left"  data-key="ArrowLeft">◀</button>
        <button class="d-right" data-key="ArrowRight">▶</button>
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

  // 押しっぱなし系
  ctrl.querySelectorAll("[data-key]").forEach(btn => {
    const key = btn.dataset.key;
    const press   = e => { e.preventDefault(); btn.classList.add("pressed");    input.press(key); };
    const release = e => { e.preventDefault(); btn.classList.remove("pressed"); input.release(key); };
    btn.addEventListener("touchstart",  press,   { passive: false });
    btn.addEventListener("touchend",    release, { passive: false });
    btn.addEventListener("touchcancel", release, { passive: false });
    btn.addEventListener("mousedown",  press);
    btn.addEventListener("mouseup",    release);
    btn.addEventListener("mouseleave", release);
  });

  // 瞬間押し系
  ctrl.querySelectorAll("[data-key-tap]").forEach(btn => {
    const key = btn.dataset.keyTap;
    const tap = e => {
      e.preventDefault();
      btn.classList.add("pressed");
      input.press(key);
      setTimeout(() => { input.release(key); btn.classList.remove("pressed"); }, 80);
    };
    btn.addEventListener("touchstart", tap, { passive: false });
    btn.addEventListener("mousedown",  tap);
  });
}
