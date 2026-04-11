// ui_toast.js
// アイテム使用時などに画面中央に表示する1行小型メッセージボックス

const SHOW_MS = 1600;  // 表示時間
const FADE_MS = 350;   // フェードアウト時間
const BOX_H   = 18;
const BOX_W   = 164;
const PAD_V   = 4;     // テキスト縦オフセット

export function createToast({ BASE_W, BASE_H } = {}) {
  let _text    = "";
  let _startMs = -1;
  let _stackKey   = null;
  let _stackCount = 0;

  function show(text) {
    _text      = text;
    _startMs   = performance.now();
    _stackKey   = null;
    _stackCount = 0;
  }

  function showStack(name) {
    const active = _startMs >= 0 && (performance.now() - _startMs) < SHOW_MS;
    if (active && _stackKey === name) {
      _stackCount++;
    } else {
      _stackKey   = name;
      _stackCount = 1;
    }
    _text    = `${name} +${_stackCount}`;
    _startMs = performance.now();
  }

  function isActive() {
    return _startMs >= 0;
  }

  function draw(ctx, nowMs) {
    if (_startMs < 0) return;
    const elapsed = nowMs - _startMs;
    if (elapsed >= SHOW_MS) {
      _startMs = -1;
      return;
    }

    const fadeStart = SHOW_MS - FADE_MS;
    const alpha = elapsed > fadeStart
      ? 1 - (elapsed - fadeStart) / FADE_MS
      : 1;

    const bx = ((BASE_W - BOX_W) / 2) | 0;
    const by = ((BASE_H - BOX_H) / 2) | 0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineJoin    = "miter";

    // 影
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(bx + 3, by + 3, BOX_W, BOX_H);

    // 黒背景
    ctx.fillStyle = "#000";
    ctx.fillRect(bx, by, BOX_W, BOX_H);

    // 白枠（2px）
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 2;
    ctx.strokeRect(bx + 1, by + 1, BOX_W - 2, BOX_H - 2);

    // テキスト（幅を測って整数ピクセルに揃える）
    ctx.fillStyle    = "#fff";
    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.textAlign    = "left";
    const tx = Math.round((BASE_W - ctx.measureText(_text).width) / 2);
    ctx.fillText(_text, tx, by + PAD_V);

    ctx.restore();
  }

  return { show, showStack, isActive, draw };
}
