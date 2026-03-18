// se.js – Web Audio API ベース（モバイルの autoplay 制限を回避）
const SE_PATH = "assets/audio/se/";

let _ctx = null;
const _buffers = {};

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

// ユーザー操作で AudioContext を resume（suspended 状態から解除）
["pointerdown", "keydown", "touchstart"].forEach((ev) => {
  window.addEventListener(ev, () => {
    if (_ctx && _ctx.state === "suspended") _ctx.resume().catch(() => {});
  });
});

async function loadBuffer(name) {
  if (_buffers[name]) return;
  try {
    const res = await fetch(SE_PATH + name);
    const ab  = await res.arrayBuffer();
    _buffers[name] = await getCtx().decodeAudioData(ab);
  } catch (_) {}
}

function play(name, vol) {
  const buf = _buffers[name];
  if (!buf) return;
  const ctx = getCtx();
  if (ctx.state !== "running") return;
  try {
    const src  = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch (_) {}
}

// 起動時にプリロード
loadBuffer("se_cursor.mp3");
loadBuffer("se_confirm.mp3");
loadBuffer("se_suzu.mp3");

export function playCursor()  { play("se_cursor.mp3",  0.5); }
export function playConfirm() { play("se_confirm.mp3", 0.5); }
export function playSuzu()    { play("se_suzu.mp3",    0.8); }
