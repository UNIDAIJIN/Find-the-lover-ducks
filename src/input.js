// input.js
// 押しっぱなし(down) と 押した瞬間(consume) を分ける入力ユーティリティ

export function createInput() {
  const downSet = new Set(); // 押されているキー
  const hitSet = new Set(); // 押された瞬間（1回だけ）
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
    return k;
  }

  function isArrowKey(k) {
    return k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight";
  }

  function isOurKey(k) {
    return isArrowKey(k) || k === "z" || k === "x" || k === "c" || k === "d" || k === "s" || k === "l" || k === "v" || k === "b" || k === "1" || k === "2";
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
  }

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });
  window.addEventListener("blur", onBlur);

  return {
    lock()   { _locked = true;  downSet.clear(); hitSet.clear(); },
    unlock() { _locked = false; },
    down(key) {
      if (_locked) return false;
      return downSet.has(normKey(key));
    },
    consume(key) {
      if (_locked) return false;
      const k = normKey(key);
      if (hitSet.has(k)) {
        hitSet.delete(k);
        return true;
      }
      return false;
    },
    // タッチ用：押し始め
    press(key) {
      const k = normKey(key);
      if (!downSet.has(k)) hitSet.add(k);
      downSet.add(k);
    },
    // タッチ用：離した
    release(key) {
      downSet.delete(normKey(key));
    },
    clear() {
      downSet.clear();
      hitSet.clear();
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      downSet.clear();
      hitSet.clear();
    },
  };
}
