// input_repeat.js
// UIリスト向けの押しっぱなしリピート入力。

export function createInputRepeat(input, {
  initialDelayMs = 260,
  intervalMs = 72,
} = {}) {
  const states = new Map();

  function now() {
    return typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  function reset(key) {
    if (key == null) {
      states.clear();
      return;
    }
    states.delete(key);
  }

  function consume(key) {
    const t = now();
    if (input.consume(key)) {
      states.set(key, { nextAt: t + initialDelayMs });
      return true;
    }

    if (!input.down(key)) {
      states.delete(key);
      return false;
    }

    const st = states.get(key);
    if (!st) {
      states.set(key, { nextAt: t + initialDelayMs });
      return false;
    }

    if (t < st.nextAt) return false;

    const steps = Math.floor((t - st.nextAt) / intervalMs) + 1;
    st.nextAt += steps * intervalMs;
    return true;
  }

  return { consume, reset };
}
