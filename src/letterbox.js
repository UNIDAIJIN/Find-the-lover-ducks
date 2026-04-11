// letterbox.js
// シネマティックな上下黒帯エフェクト

const BAR_H  = 32;   // 各帯の最大高さ（px）
const IN_MS  = 400;  // スライドイン時間
const OUT_MS = 320;  // スライドアウト時間

let _phase       = "hidden"; // "hidden" | "in" | "shown" | "out"
let _startMs     = 0;
let _progress    = 0;        // 0=隠れ, 1=全開
let _onShown     = null;
let _onHidden    = null;
let _sepiaActive = true;

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
}

export function getSepiaAmount() {
  return _sepiaActive ? _progress : 0;
}

export function draw(ctx, nowMs) {
  if (_phase === "hidden") return;

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

  const h = Math.round(BAR_H * _progress);
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
