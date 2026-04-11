// trip_effect_good.js — グッドトリップ視覚エフェクト（チキンカレー）
export function createGoodTripEffect() {
  let active  = false;
  let startMs = 0;
  let _onEnd  = null;
  let _eased  = 0;
  let tmp     = null;

  // スパークル用の固定乱数列（初期化時に確定）
  const SPARKS = Array.from({ length: 28 }, () => ({
    x:     Math.random(),
    y:     Math.random(),
    phase: Math.random() * Math.PI * 2,
    hue:   Math.random() * 360,
    hueSpeed: (Math.random() - 0.5) * 40,
    speed: 1.0 + Math.random() * 1.5,
  }));

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

    const fadeIn  = Math.min(elapsed / RAMP_SEC, 1);
    const fadeOut = Math.min((TOTAL_SEC - elapsed) / RAMP_SEC, 1);
    const ramp    = Math.min(fadeIn, fadeOut);
    const eased   = ramp * ramp * (3 - 2 * ramp); // smoothstep
    _eased = eased;

    tmp = ensureCanvas(tmp, W, H);
    tmp.getContext("2d").drawImage(canvas, 0, 0);

    // 呼吸するズーム（±2%、ゆっくり）＋彩度ガツ上げ
    const breathe  = Math.sin(elapsed * 1.2) * 0.02 * eased;
    const scale    = 1 + breathe;
    const brightness = 1 + 0.35 * eased;
    const contrast   = 1 + 0.25 * eased;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    const saturate   = 1 + 1.2 * eased;
    ctx.filter = `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)})`;
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();

    // スパークル（細かく点滅・サイケデリックカラー）
    for (const s of SPARKS) {
      const bright = (Math.sin(elapsed * s.speed + s.phase) + 1) / 2;
      if (bright < 0.4) continue;
      const hue = (s.hue + elapsed * s.hueSpeed) % 360;
      ctx.globalAlpha = bright * 0.9 * eased;
      ctx.fillStyle = `hsl(${hue | 0}, 100%, 75%)`;
      const r = 0.6 + bright * 0.9;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  return { start, stop, isActive, getIntensity, applyFX };
}
