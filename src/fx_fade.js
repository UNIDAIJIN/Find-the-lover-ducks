// fx_fade.js
export function createFade({
  BASE_W,
  BASE_H,
  canvas: _canvas = null,
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

  // iris
  let irisRadius = 0;
  let irisCx = 0;
  let irisCy = 0;
  let irisMaxR = 0;
  let irisPauseR = 0;    // 途中停止する半径
  let irisPauseMs = 0;   // 停止時間
  let irisSubPhase = 0;  // 0=縮む前半, 1=停止, 2=縮む後半
  let irisSubT0 = 0;

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
    irisRadius = 0;
    irisCx = 0;
    irisCy = 0;
    irisMaxR = 0;
    irisPauseR = 0;
    irisPauseMs = 0;
    irisSubPhase = 0;
    irisSubT0 = 0;
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

  function startIrisFade(nowMs, {
    outMs = 800,
    holdMs = 500,
    inMs = 300,
    cx = null,
    cy = null,
    pauseR = 28,   // 途中停止する半径（px）
    pauseMs = 400, // 停止時間（ms）
    onBlack: onBlackFn = null,
    onEnd: onEndFn = null,
  } = {}) {
    active = true;
    kind = "iris";
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

    const w = _canvas ? _canvas.width  : BASE_W;
    const h = _canvas ? _canvas.height : BASE_H;
    irisCx = cx != null ? cx : w / 2;
    irisCy = cy != null ? cy : h / 2;
    const corners = [[0,0],[w,0],[0,h],[w,h]];
    irisMaxR = Math.max(...corners.map(([cx2,cy2]) =>
      Math.sqrt((cx2-irisCx)**2+(cy2-irisCy)**2)
    )) + 4;
    irisRadius = irisMaxR;
    irisPauseR  = pauseR;
    irisPauseMs = dur(pauseMs);
    irisSubPhase = 0;
    irisSubT0 = nowMs;

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

    if (kind === "cut" || kind === "iris") {
      if (phase === 0) {
        const p = (nowMs - t0) / cutOutMs;
        if (kind === "iris") {
          alpha = 1; // iris は shape で制御するので常に不透明
          // サブフェーズ 0: maxR → pauseR
          if (irisSubPhase === 0) {
            const half1Ms = cutOutMs * 0.6;
            const sp = Math.min(1, (nowMs - irisSubT0) / half1Ms);
            irisRadius = irisMaxR + (irisPauseR - irisMaxR) * ease01(sp);
            if (sp >= 1) {
              irisSubPhase = 1;
              irisSubT0 = nowMs;
              irisRadius = irisPauseR;
            }
            return; // phaseは0のままキープ
          }
          // サブフェーズ 1: 停止
          if (irisSubPhase === 1) {
            irisRadius = irisPauseR;
            if (nowMs - irisSubT0 >= irisPauseMs) {
              irisSubPhase = 2;
              irisSubT0 = nowMs;
            }
            return;
          }
          // サブフェーズ 2: pauseR → 0
          if (irisSubPhase === 2) {
            const half2Ms = cutOutMs * 0.4;
            const sp = Math.min(1, (nowMs - irisSubT0) / half2Ms);
            irisRadius = irisPauseR * (1 - ease01(sp));
            if (sp < 1) return;
            irisRadius = 0;
            // 通常の phase 1 移行へフォールスルー
          }
        }
        if (kind === "cut") alpha = ease01(p);
        if (p >= 1 || (kind === "iris" && irisSubPhase === 2 && irisRadius <= 0)) {
          phase = 1;
          alpha = 1;
          irisRadius = 0;
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
    const w = _canvas ? _canvas.width  : BASE_W;
    const h = _canvas ? _canvas.height : BASE_H;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";

    if (kind === "iris" && irisRadius > 0) {
      // 黒背景 + 中央に丸穴（evenodd）
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.arc(irisCx, irisCy, irisRadius, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    } else {
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  return { isActive, startMapFade, startCutFade, startIrisFade, update, draw };
}