// fx_fade.js
export function createFade({
  BASE_W,
  BASE_H,
  input,
  mapOutMs = 220,
  mapInMs = 160,
} = {}) {
  let active = false;
  let kind = null; // "map" | "cut"
  let phase = 0;   // 0=out, 1=wait, 2=in
  let t0 = 0;
  let alpha = 0;

  // map
  let nextMapId = null;
  let nextMapOpt = null;
  let onLoadMap = null;

  // cut
  let cutOutMs = 420;
  let cutHoldMs = 3000;
  let cutInMs = 240;
  let holdUntil = 0;
  let onBlack = null;
  let blackDone = false;
  let onEnd = null;

  function dur(ms) {
    ms = ms | 0;
    return ms <= 1 ? 1 : ms;
  }
  function clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }
  function ease01(p) {
    p = clamp01(p);
    return p * p * (3 - 2 * p);
  }

  function reset() {
    active = false;
    kind = null;
    phase = 0;
    t0 = 0;
    alpha = 0;

    nextMapId = null;
    nextMapOpt = null;
    onLoadMap = null;

    holdUntil = 0;
    onBlack = null;
    blackDone = false;
    onEnd = null;
  }

  function isActive() {
    return active;
  }

  function startMapFade(id, opt, nowMs, loadMapFn) {
    active = true;
    kind = "map";
    phase = 0;
    t0 = nowMs;
    alpha = 0;

    nextMapId = id;
    nextMapOpt = opt || null;
    onLoadMap = typeof loadMapFn === "function" ? loadMapFn : null;

    input.clear();
  }

  function startCutFade(nowMs, {
    outMs = 420,
    holdMs = 3000,
    inMs = 240,
    onBlack: onBlackFn = null,
    onEnd: onEndFn = null,
  } = {}) {
    active = true;
    kind = "cut";
    phase = 0;
    t0 = nowMs;
    alpha = 0;

    cutOutMs = dur(outMs);
    cutHoldMs = dur(holdMs);
    cutInMs  = dur(inMs);

    holdUntil = 0;
    onBlack = typeof onBlackFn === "function" ? onBlackFn : null;
    blackDone = false;
    onEnd = typeof onEndFn === "function" ? onEndFn : null;

    input.clear();
  }

  function update(nowMs, getMapReady) {
    if (!active) return;

    if (kind === "map") {
      const outMs = dur(mapOutMs);
      const inMs  = dur(mapInMs);

      if (phase === 0) {
        const p = (nowMs - t0) / outMs;
        alpha = ease01(p);
        if (p >= 1) {
          phase = 1;
          alpha = 1;
          const id = nextMapId;
          const opt = nextMapOpt;
          nextMapId = null;
          nextMapOpt = null;
          if (id && onLoadMap) onLoadMap(id, opt);
        }
        return;
      }
      if (phase === 1) {
        alpha = 1;
        const ready = typeof getMapReady === "function" ? !!getMapReady() : false;
        if (ready) {
          phase = 2;
          t0 = nowMs;
        }
        return;
      }
      if (phase === 2) {
        const p = (nowMs - t0) / inMs;
        alpha = 1 - ease01(p);
        if (p >= 1) {
          alpha = 0;
          reset();
        }
        return;
      }
    }

    if (kind === "cut") {
      if (phase === 0) {
        const p = (nowMs - t0) / cutOutMs;
        alpha = ease01(p);
        if (p >= 1) {
          phase = 1;
          alpha = 1;
          holdUntil = nowMs + cutHoldMs;
          if (!blackDone) {
            blackDone = true;
            if (onBlack) onBlack();
          }
        }
        return;
      }
      if (phase === 1) {
        alpha = 1;
        if (nowMs >= holdUntil) {
          phase = 2;
          t0 = nowMs;
        }
        return;
      }
      if (phase === 2) {
        const p = (nowMs - t0) / cutInMs;
        alpha = 1 - ease01(p);
        if (p >= 1) {
          alpha = 0;
          const cb = onEnd;
          reset();
          if (cb) cb();
        }
        return;
      }
    }
  }

  function draw(ctx) {
    if (!active || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();
  }

  return { isActive, startMapFade, startCutFade, update, draw };
}