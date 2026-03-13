// ending.js
export function createEnding({ BASE_W, BASE_H }) {
  let active         = false;
  let phase          = "waiting"; // "waiting" | "credits" | "fadeout"
  let startMs        = 0;
  let creditsStartMs = 0;
  let fadeOutStartMs = 0;

  const CREDITS_DELAY_MS  = 8000;
  const DIM_ALPHA         = 0.5;
  const DIM_FADE_MS       = 1500; // 暗転フェードイン時間
  const SCROLL_PX_PER_SEC = 24;
  const LINE_H            = 22;
  const FADEOUT_MS        = 2500; // 最後の真っ暗フェードアウト時間

  const CREDITS = [
    "MoritaSaki in the pool 2nd Album",
    "KIDCORE SCULPTURE bonus game",
    "",
    "[FIND THE LOVER DUCKS]",
    "",
    "",
    "Game Director",
    "RIKU ISHIHARA",
    "",
    "Game Design",
    "RIKU ISHIHARA",
    "",
    "Programming",
    "RIKU ISHIHARA",
    "",
    "Art / Graphics",
    "RIKU ISHIHARA",
    "YUI YAHIRO",
    "",
    "Character Design",
    "RIKU ISHIHARA",
    "YUI YAHIRO",
    "",
    "Animation",
    "RIKU ISHIHARA",
    "",
    "Music",
    "RIKU ISHIHARA",
    "",
    "Writing",
    "RIKU ISHIHARA",
    "",
    "",
    "Thank you for playing",
    "",
    "",
    "",
  ];

  const FIXED_LINE = "Thank you for playing";
  const FIXED_Y    = (BASE_H / 2 - 5) | 0;

  function ease(p) {
    p = Math.max(0, Math.min(1, p));
    return p * p * (3 - 2 * p);
  }

  function start(ms) {
    active         = true;
    phase          = "waiting";
    startMs        = ms;
    creditsStartMs = 0;
    fadeOutStartMs = 0;
  }

  function isActive() { return active; }
  function isDone()   { return active && phase === "done"; }

  function update(t) {
    if (!active) return;

    if (phase === "waiting" && t - startMs >= CREDITS_DELAY_MS) {
      phase          = "credits";
      creditsStartMs = t;
    }

    if (phase === "credits") {
      // 最後のクレジット行が画面上端を越えたらフェードアウト開始
      const elapsed  = t - creditsStartMs;
      const scrolled = elapsed * SCROLL_PX_PER_SEC / 1000;
      const lastY    = BASE_H - scrolled + (CREDITS.length - 1) * LINE_H;
      if (lastY < -LINE_H) {
        phase          = "fadeout";
        fadeOutStartMs = t;
      }
    }

    if (phase === "fadeout") {
      const p = ease((t - fadeOutStartMs) / FADEOUT_MS);
      if (p >= 1) phase = "done";
    }
  }

  function draw(ctx, t) {
    if (!active || phase === "waiting") return;

    const elapsed  = t - creditsStartMs;
    const scrolled = elapsed * SCROLL_PX_PER_SEC / 1000;

    // --- 暗転オーバーレイ（フェードイン） ---
    const dimP    = ease(elapsed / DIM_FADE_MS);
    const dimAlpha = DIM_ALPHA * dimP;

    ctx.save();
    ctx.globalAlpha = dimAlpha;
    ctx.fillStyle   = "#000";
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.restore();

    // --- スクロールクレジット ---
    ctx.save();
    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.textAlign    = "left";
    ctx.fillStyle    = "#fff";

    for (let i = 0; i < CREDITS.length; i++) {
      const naturalY = BASE_H - scrolled + i * LINE_H;
      const y = CREDITS[i] === FIXED_LINE
        ? Math.max(Math.round(naturalY), FIXED_Y)
        : Math.round(naturalY);
      if (y > -LINE_H && y < BASE_H + LINE_H) {
        ctx.font = "normal 10px PixelMplus10";
        const x = Math.round((BASE_W - ctx.measureText(CREDITS[i]).width) / 2);
        ctx.fillText(CREDITS[i], x, y);
      }
    }
    ctx.restore();

    // --- 最後の真っ暗フェードアウト ---
    if (phase === "fadeout" || phase === "done") {
      const p = phase === "done" ? 1 : ease((t - fadeOutStartMs) / FADEOUT_MS);
      ctx.save();
      ctx.globalAlpha = p;
      ctx.fillStyle   = "#000";
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.restore();

      // "Thank you for playing" だけ残す
      ctx.save();
      ctx.globalAlpha  = 1;
      ctx.font         = "normal 10px PixelMplus10";
      ctx.textBaseline = "top";
      ctx.textAlign    = "left";
      ctx.fillStyle    = "#fff";
      const x = Math.round((BASE_W - ctx.measureText(FIXED_LINE).width) / 2);
      ctx.fillText(FIXED_LINE, x, FIXED_Y);
      ctx.restore();

      // done 後：Zを促すテキスト（点滅）
      if (phase === "done") {
        const blink = Math.sin(t / 400) > 0;
        if (blink) {
          const prompt = "press any button";
          ctx.save();
          ctx.font         = "normal 10px PixelMplus10";
          ctx.textBaseline = "top";
          ctx.textAlign    = "left";
          ctx.fillStyle    = "#fff";
          const px = Math.round((BASE_W - ctx.measureText(prompt).width) / 2);
          ctx.fillText(prompt, px, FIXED_Y + 20);
          ctx.restore();
        }
      }
    }
  }

  function stop() { active = false; phase = "waiting"; }

  return { start, isActive, isDone, stop, update, draw };
}
