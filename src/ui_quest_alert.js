// ui_quest_alert.js
// クエスト達成時の専用アラート（上中央からポップダウン）

export function createQuestAlert({ BASE_W } = {}) {
  let phase      = "idle"; // idle | in | hold | out
  let phaseStart = 0;
  let questId    = "";
  let title      = "";

  const H        = 22;
  const TARGET_Y = 5;
  const IN_MS    = 200;
  const HOLD_MS  = 1600;
  const OUT_MS   = 200;

  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function easeIn(t)  { return t * t; }

  function show(id, t) {
    questId    = id;
    title      = t;
    phase      = "in";
    phaseStart = performance.now();
  }

  function isActive() { return phase !== "idle"; }

  function update() {
    if (phase === "idle") return;
    const elapsed = performance.now() - phaseStart;
    if      (phase === "in"   && elapsed >= IN_MS)   { phase = "hold"; phaseStart = performance.now(); }
    else if (phase === "hold" && elapsed >= HOLD_MS) { phase = "out";  phaseStart = performance.now(); }
    else if (phase === "out"  && elapsed >= OUT_MS)  { phase = "idle"; }
  }

  function draw(ctx) {
    if (phase === "idle") return;

    const label = `★ ${questId} ${title} ★`;

    ctx.font = "normal 10px PixelMplus10";
    const W  = (ctx.measureText(label).width + 20) | 0;
    const X  = ((BASE_W - W) / 2) | 0;

    const elapsed = performance.now() - phaseStart;
    let y;
    if (phase === "in") {
      y = -H + (TARGET_Y + H) * easeOut(Math.min(elapsed / IN_MS, 1));
    } else if (phase === "hold") {
      y = TARGET_Y;
    } else {
      y = TARGET_Y - (TARGET_Y + H) * easeIn(Math.min(elapsed / OUT_MS, 1));
    }
    y = y | 0;

    ctx.save();
    const prevSkipTextShadow = ctx._skipTextShadow;
    ctx._skipTextShadow = true;

    // 影
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(X + 3, y + 3, W, H);

    // 本体背景（金グラデーション）
    const bg = ctx.createLinearGradient(X, y, X, y + H);
    bg.addColorStop(0,   "#ffe57a");
    bg.addColorStop(0.4, "#e8c000");
    bg.addColorStop(1,   "#9a7200");
    ctx.fillStyle = bg;
    ctx.fillRect(X, y, W, H);

    // 外枠（金メダル）
    ctx.strokeStyle = "#7a5800";
    ctx.lineWidth   = 3;
    ctx.strokeRect(X + 1.5, y + 1.5, W - 3, H - 3);
    ctx.strokeStyle = "#e8c000";
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(X + 3, y + 3, W - 6, H - 6);
    ctx.strokeStyle = "rgba(255,240,130,0.5)";
    ctx.lineWidth   = 1;
    ctx.strokeRect(X + 4.5, y + 4.5, W - 9, H - 9);

    // テキスト
    ctx.font         = "normal 10px PixelMplus10";
    ctx.textBaseline = "top";
    ctx.textAlign    = "left";
    const lx = X + Math.round((W - ctx.measureText(label).width) / 2);
    ctx.fillStyle = "#1a1000";
    ctx.fillText(label, lx, y + 6);

    ctx.textAlign    = "left";
    ctx.textBaseline = "top";
    ctx._skipTextShadow = prevSkipTextShadow;
    ctx.restore();
  }

  return { show, isActive, update, draw };
}
