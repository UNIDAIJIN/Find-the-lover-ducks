// trip_effect.js — バッドトリップ視覚エフェクト
export function createTripEffect() {
  let active  = false;
  let startMs = 0;
  let _onEnd  = null;
  let _eased  = 0;
  let tmp  = null; // 歪み前スナップショット
  let tmp2 = null; // 歪み後キャプチャ
  let tmpR = null; // 赤チャンネル用
  let tmpB = null; // 青チャンネル用

  function ensureCanvas(c, W, H) {
    if (!c || c.width !== W || c.height !== H) {
      c = document.createElement("canvas");
      c.width = W; c.height = H;
    }
    return c;
  }

  function start(onEnd) {
    active  = true;
    startMs = performance.now();
    _onEnd  = onEnd || null;
  }

  function stop()         { active = false; _eased = 0; }
  function isActive()     { return active; }
  function getIntensity() { return _eased; }

  function applyFX(ctx, canvas, nowMs) {
    if (!active) return;
    const elapsed = (nowMs - startMs) / 1000;
    const W = canvas.width;
    const H = canvas.height;

    const TOTAL_SEC = 60;
    const RAMP_SEC  = 4;

    if (elapsed >= TOTAL_SEC) {
      active = false;
      if (_onEnd) { _onEnd(); _onEnd = null; }
      return;
    }

    // フェードイン（最初4秒）／フェードアウト（最後4秒）
    const fadeIn  = Math.min(elapsed / RAMP_SEC, 1);
    const fadeOut = Math.min((TOTAL_SEC - elapsed) / RAMP_SEC, 1);
    const ramp    = Math.min(fadeIn, fadeOut);
    const eased   = ramp * ramp * (3 - 2 * ramp); // smoothstep
    _eased = eased;

    tmp  = ensureCanvas(tmp,  W, H);
    tmp2 = ensureCanvas(tmp2, W, H);
    tmpR = ensureCanvas(tmpR, W, H);
    tmpB = ensureCanvas(tmpB, W, H);

    // 歪み前スナップショット
    tmp.getContext("2d").drawImage(canvas, 0, 0);

    // 波形歪み: 1px単位で横オフセット（なめらかサイン波）
    ctx.clearRect(0, 0, W, H);
    for (let y = 0; y < H; y++) {
      const ox = (Math.sin(y * 0.22 + elapsed * 3)   * 8
                + Math.sin(y * 0.07 + elapsed * 1.3) * 4) * eased;
      ctx.drawImage(tmp, 0, y, W, 1, ox, y, W, 1);
    }

    // 歪み後フレームをキャプチャ
    tmp2.getContext("2d").drawImage(canvas, 0, 0);

    // 色ズレ（クロマティックアベレーション）
    const shift = 3 * eased;

    const rctx = tmpR.getContext("2d");
    rctx.clearRect(0, 0, W, H);
    rctx.drawImage(tmp2, 0, 0);
    rctx.globalCompositeOperation = "multiply";
    rctx.fillStyle = "rgb(255,0,0)";
    rctx.fillRect(0, 0, W, H);
    rctx.globalCompositeOperation = "source-over";

    const bctx = tmpB.getContext("2d");
    bctx.clearRect(0, 0, W, H);
    bctx.drawImage(tmp2, 0, 0);
    bctx.globalCompositeOperation = "multiply";
    bctx.fillStyle = "rgb(0,80,255)";
    bctx.fillRect(0, 0, W, H);
    bctx.globalCompositeOperation = "source-over";

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.55 * eased;
    ctx.drawImage(tmpR, -shift, 0);
    ctx.drawImage(tmpB,  shift, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // 脈動するカラーオーバーレイ（青紫↔赤紫）
    const hue   = 280 + Math.sin(elapsed * 2.3) * 45;
    const pulse = (Math.sin(elapsed * 5.1) + 1) / 2;
    ctx.globalAlpha = (0.10 + pulse * 0.20) * eased;
    ctx.fillStyle = `hsl(${hue | 0}, 100%, 35%)`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  return { start, stop, isActive, getIntensity, applyFX };
}
