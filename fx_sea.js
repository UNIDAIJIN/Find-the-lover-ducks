// fx_sea.js
export function createSea({
  rgb = "rgb(61,209,195)",
  grid = 6,
  alpha = 0.22,
  twSpeed = 0.0045,
  driftX = 0.9,
  driftY = 0.6,
  density = 0.45,
} = {}) {
  function hash2i(x, y) {
    let n = (x * 374761393 + y * 668265263) | 0;
    n = (n ^ (n >> 13)) | 0;
    n = (n * 1274126177) | 0;
    return (n ^ (n >> 16)) >>> 0;
  }
  function hash01(x, y) {
    return (hash2i(x, y) & 1023) / 1023;
  }

  function draw(ctx, t, cam, w, h) {
    // 1) 海ベース
    ctx.fillStyle = rgb;
    ctx.fillRect(0, 0, w, h);

    // 2) きらめき
    ctx.save();
    ctx.fillStyle = "#fff";

    const dx = Math.sin(t * 0.0012) * driftX;
    const dy = Math.cos(t * 0.0009) * driftY;

    const g = grid | 0;
    const cols = ((w / g) | 0) + 2;
    const rows = ((h / g) | 0) + 2;

    const baseGX = (((cam.x / g) | 0) - 1) | 0;
    const baseGY = (((cam.y / g) | 0) - 1) | 0;

    const offX = (cam.x % g) | 0;
    const offY = (cam.y % g) | 0;

    const tt = t * twSpeed;

    for (let ry = 0; ry < rows; ry++) {
      const gy = (baseGY + ry) | 0;
      const y = (ry * g - offY + dy) | 0;

      for (let rx = 0; rx < cols; rx++) {
        const gx = (baseGX + rx) | 0;
        const x = (rx * g - offX + dx) | 0;

        // 出現率
        const r0 = hash01(gx, gy);
        if (r0 > density) continue;

        // 点滅
        const phase = hash01(gx + 11, gy - 7) * 6.2831853;
        const tw = 0.5 + 0.5 * Math.sin(tt + phase);

        // 透明度
        const a = alpha * (0.25 + 0.75 * tw);
        if (a < 0.02) continue;

        ctx.globalAlpha = a;
        ctx.fillRect(x, y, 3, 1);
        ctx.fillRect(x + 1, y + 1, 2, 1);
      }
    }

    ctx.restore();
  }

  return { draw };
}