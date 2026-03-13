// mobile_controller.js
export function setupMobileController(input) {
  // ---- スタイル ----
  const style = document.createElement("style");
  style.textContent = `
    #mobile-ctrl {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #111;
      padding: 12px 16px;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      box-sizing: border-box;
      width: 100%;
    }
    #mobile-ctrl .dpad {
      display: grid;
      grid-template-columns: repeat(3, 44px);
      grid-template-rows: repeat(3, 44px);
      gap: 2px;
    }
    #mobile-ctrl .dpad button {
      background: #333;
      border: 1px solid #555;
      border-radius: 6px;
      color: #fff;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    #mobile-ctrl .dpad button:active { background: #555; }
    #mobile-ctrl .dpad .center { background: transparent; border-color: transparent; pointer-events: none; }

    #mobile-ctrl .actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
    }
    #mobile-ctrl .ab-row {
      display: flex;
      gap: 10px;
    }
    #mobile-ctrl .btn-ab {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 1px solid #555;
      background: #333;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    #mobile-ctrl .btn-ab:active { background: #555; }
    #mobile-ctrl .sl-row {
      display: flex;
      gap: 8px;
    }
    #mobile-ctrl .btn-sl {
      width: 52px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid #555;
      background: #222;
      color: #aaa;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    #mobile-ctrl .btn-sl:active { background: #444; color: #fff; }
  `;
  document.head.appendChild(style);

  // ---- HTML ----
  const ctrl = document.createElement("div");
  ctrl.id = "mobile-ctrl";
  ctrl.innerHTML = `
    <div class="dpad">
      <button class="center"></button>
      <button data-key="ArrowUp">▲</button>
      <button class="center"></button>
      <button data-key="ArrowLeft">◀</button>
      <button class="center"></button>
      <button data-key="ArrowRight">▶</button>
      <button class="center"></button>
      <button data-key="ArrowDown">▼</button>
      <button class="center"></button>
    </div>
    <div class="actions">
      <div class="ab-row">
        <button class="btn-ab" data-key="x">B</button>
        <button class="btn-ab" data-key="z">A</button>
      </div>
      <div class="sl-row">
        <button class="btn-sl" data-key-tap="s">SAVE</button>
        <button class="btn-sl" data-key-tap="l">LOAD</button>
      </div>
    </div>
  `;
  document.body.appendChild(ctrl);

  // ---- イベント登録 ----
  // 押しっぱなし系（十字・AB）
  ctrl.querySelectorAll("[data-key]").forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener("touchstart", e => { e.preventDefault(); input.press(key); },   { passive: false });
    btn.addEventListener("touchend",   e => { e.preventDefault(); input.release(key); }, { passive: false });
    btn.addEventListener("touchcancel",e => { e.preventDefault(); input.release(key); }, { passive: false });
    // マウスフォールバック
    btn.addEventListener("mousedown", () => input.press(key));
    btn.addEventListener("mouseup",   () => input.release(key));
    btn.addEventListener("mouseleave",() => input.release(key));
  });

  // 瞬間押し系（SAVE/LOAD）
  ctrl.querySelectorAll("[data-key-tap]").forEach(btn => {
    const key = btn.dataset.keyTap;
    btn.addEventListener("touchstart", e => { e.preventDefault(); input.press(key); setTimeout(() => input.release(key), 80); }, { passive: false });
    btn.addEventListener("mousedown",  () => { input.press(key); setTimeout(() => input.release(key), 80); });
  });
}
