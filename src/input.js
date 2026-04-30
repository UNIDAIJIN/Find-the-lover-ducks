// input.js
// 押しっぱなし(down) と 押した瞬間(consume) を分ける入力ユーティリティ

export function createInput() {
  const downSet = new Set(); // 押されているキー
  const hitSet = new Set(); // 押された瞬間（1回だけ）
  let gamepadDownSet = new Set();
  const gamepadIgnoreSet = new Set();
  let _locked = false;

  function normKey(k) {
    if (k === "Z") return "z";
    if (k === "X") return "x";
    if (k === "C") return "c";
    if (k === "D") return "d";
    if (k === "S") return "s";
    if (k === "L") return "l";
    if (k === "V") return "v";
    if (k === "B") return "b";
    if (k === "P") return "p";
    return k;
  }

  function isArrowKey(k) {
    return k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight";
  }

  function isOurKey(k) {
    return isArrowKey(k) || k === "z" || k === "x" || k === "c" || k === "d" || k === "s" || k === "l" || k === "v" || k === "b" || k === "p" || k === "1" || k === "2" || k === "Enter" || k === " ";
  }

  function onKeyDown(e) {
    const k = normKey(e.key);
    if (!isOurKey(k)) return;
    e.preventDefault();
    if (!downSet.has(k)) hitSet.add(k);
    downSet.add(k);
  }

  function onKeyUp(e) {
    const k = normKey(e.key);
    if (!isOurKey(k)) return;
    downSet.delete(k);
  }

  function onBlur() {
    downSet.clear();
    hitSet.clear();
    gamepadDownSet.clear();
    gamepadIgnoreSet.clear();
  }

  function addPadButton(keys, buttons, idx, key) {
    if (buttons && buttons[idx] && buttons[idx].pressed) keys.add(key);
  }

  function pollGamepads() {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;

    const keys = new Set();
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) continue;
      const buttons = pad.buttons || [];
      const axes = pad.axes || [];
      const ax0 = axes[0] || 0;
      const ax1 = axes[1] || 0;
      const DEAD = 0.45;

      // Mobile controller parity: stick/D-pad, A/B, save/load, and audio toggle.
      addPadButton(keys, buttons, 0, "z"); // A: 決定・話す
      addPadButton(keys, buttons, 1, "x"); // B: キャンセル・メニュー
      addPadButton(keys, buttons, 4, "s"); // L1: セーブ
      addPadButton(keys, buttons, 5, "l"); // R1: ロード
      addPadButton(keys, buttons, 8, "v"); // Select/Back: おんがくていし
      addPadButton(keys, buttons, 12, "ArrowUp");
      addPadButton(keys, buttons, 13, "ArrowDown");
      addPadButton(keys, buttons, 14, "ArrowLeft");
      addPadButton(keys, buttons, 15, "ArrowRight");

      if (ax0 <= -DEAD) keys.add("ArrowLeft");
      if (ax0 >= DEAD) keys.add("ArrowRight");
      if (ax1 <= -DEAD) keys.add("ArrowUp");
      if (ax1 >= DEAD) keys.add("ArrowDown");
    }

    const nextDown = new Set();
    for (const key of keys) {
      if (gamepadIgnoreSet.has(key)) continue;
      nextDown.add(key);
      if (!gamepadDownSet.has(key)) hitSet.add(key);
    }
    for (const key of gamepadIgnoreSet) {
      if (!keys.has(key)) gamepadIgnoreSet.delete(key);
    }
    gamepadDownSet = nextDown;
  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });
  window.addEventListener("blur", onBlur);

  return {
    lock()   {
      pollGamepads();
      for (const key of gamepadDownSet) gamepadIgnoreSet.add(key);
      _locked = true;
      downSet.clear();
      hitSet.clear();
      gamepadDownSet.clear();
    },
    unlock() { _locked = false; },
    isLocked() { return _locked; },
    down(key) {
      if (_locked) return false;
      pollGamepads();
      const k = normKey(key);
      return downSet.has(k) || gamepadDownSet.has(k);
    },
    consume(key) {
      if (_locked) return false;
      pollGamepads();
      const k = normKey(key);
      if (hitSet.has(k)) {
        hitSet.delete(k);
        return true;
      }
      return false;
    },
    // タッチ用：押し始め
    press(key) {
      if (_locked) return;
      const k = normKey(key);
      if (!downSet.has(k)) hitSet.add(k);
      downSet.add(k);
    },
    // タッチ用：離した
    release(key) {
      downSet.delete(normKey(key));
    },
    clear() {
      pollGamepads();
      for (const key of gamepadDownSet) gamepadIgnoreSet.add(key);
      downSet.clear();
      hitSet.clear();
      gamepadDownSet.clear();
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      downSet.clear();
      hitSet.clear();
      gamepadDownSet.clear();
      gamepadIgnoreSet.clear();
    },
  };
}
