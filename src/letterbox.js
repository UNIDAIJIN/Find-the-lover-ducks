// letterbox.js
// シネマティックな上下黒帯エフェクト

const BAR_H  = 32;   // 各帯の最大高さ（px）
const IN_MS  = 400;  // スライドイン時間
const OUT_MS = 320;  // スライドアウト時間

const AUTO_BAR_H  = 32;
const AUTO_IN_MS  = 400;
const AUTO_OUT_MS = 320;

let _phase       = "hidden"; // "hidden" | "in" | "shown" | "out"
let _startMs     = 0;
let _progress    = 0;        // 0=隠れ, 1=全開
let _onShown     = null;
let _onHidden    = null;
let _sepiaActive = true;

let _autoTarget   = 0;
let _autoProgress = 0;
let _lastTickMs   = 0;
let _autoShownCbs = [];

function ease(t) {
  // smoothstep
  return t * t * (3 - 2 * t);
}

export function show(onShown) {
  _phase   = "in";
  _startMs = performance.now();
  _onShown = onShown || null;
}

export function hide(onHidden) {
  if (_phase === "hidden") {
    if (onHidden) onHidden();
    return;
  }
  _phase    = "out";
  _startMs  = performance.now();
  _onHidden = onHidden || null;
}

export function isActive() {
  return _phase !== "hidden";
}

export function disableSepia() {
  _sepiaActive = false;
}

export function reset() {
  _phase       = "hidden";
  _progress    = 0;
  _sepiaActive = true;
  _onShown     = null;
  _onHidden    = null;
  _autoTarget   = 0;
  _autoProgress = 0;
  _lastTickMs   = 0;
  _autoShownCbs = [];
}

export function setAuto(on) {
  _autoTarget = on ? 1 : 0;
  if (!on) _autoShownCbs = [];
}

export function snapAuto(on) {
  _autoTarget = on ? 1 : 0;
  _autoProgress = _autoTarget;
  if (!on) _autoShownCbs = [];
}

export function onAutoShown(cb) {
  if (typeof cb !== "function") return;
  if (_autoTarget === 1 && _autoProgress >= 1) { cb(); return; }
  _autoShownCbs.push(cb);
}

export function getSepiaAmount() {
  return _sepiaActive ? _progress : 0;
}

export function draw(ctx, nowMs) {
  const dt = _lastTickMs ? Math.min(nowMs - _lastTickMs, 100) : 0;
  _lastTickMs = nowMs;
  if (_autoProgress < _autoTarget) {
    _autoProgress = Math.min(_autoTarget, _autoProgress + dt / AUTO_IN_MS);
  } else if (_autoProgress > _autoTarget) {
    _autoProgress = Math.max(_autoTarget, _autoProgress - dt / AUTO_OUT_MS);
  }
  if (_autoTarget === 1 && _autoProgress >= 1 && _autoShownCbs.length > 0) {
    const cbs = _autoShownCbs;
    _autoShownCbs = [];
    for (const cb of cbs) cb();
  }

  if (_phase === "in") {
    const t = Math.min((nowMs - _startMs) / IN_MS, 1);
    _progress = ease(t);
    if (t >= 1) {
      _progress = 1;
      _phase    = "shown";
      if (_onShown) { const cb = _onShown; _onShown = null; cb(); }
    }
  } else if (_phase === "out") {
    const t = Math.min((nowMs - _startMs) / OUT_MS, 1);
    _progress = 1 - ease(t);
    if (t >= 1) {
      _progress = 0;
      _phase    = "hidden";
      if (_onHidden) { const cb = _onHidden; _onHidden = null; cb(); }
    }
  }

  const cinematicH = Math.round(BAR_H * _progress);
  const autoH      = Math.round(AUTO_BAR_H * ease(_autoProgress));
  const h          = Math.max(cinematicH, autoH);
  if (h <= 0) return;

  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle   = "#000";
  ctx.fillRect(0, 0,     W, h);         // 上帯
  ctx.fillRect(0, H - h, W, h);         // 下帯
  ctx.restore();
}
