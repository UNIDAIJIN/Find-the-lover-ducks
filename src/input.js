// input.js
// 押しっぱなし(down) と 押した瞬間(consume) を分ける入力ユーティリティ

export function createInput() {
  const downSet = new Set(); // 押されているキー
  const hitSet = new Set(); // 押された瞬間（1回だけ）

  function normKey(k) {
    if (k === "Z") return "z";
    if (k === "X") return "x";
    if (k === "C") return "c";
    return k;
  }

  function isArrowKey(k) {
    return k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight";
  }

  function isOurKey(k) {
    return isArrowKey(k) || k === "z" || k === "x" || k === "c";
  }

  function onKeyDown(e) {
    const k = normKey(e.key);
    if (!isOurKey(k)) return;

    e.preventDefault();

    // 押しっぱなし中のリピートで hit を増やさない
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
    down(key) {
      return downSet.has(normKey(key));
    },
    consume(key) {
      const k = normKey(key);
      if (hitSet.has(k)) {
        hitSet.delete(k);
        return true;
      }
      return false;
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