// se.js – Web Audio API ベース（モバイルの autoplay 制限を回避）
const SE_PATH = "assets/audio/se/";

let _ctx = null;
const _buffers = {};

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ユーザー操作で AudioContext を resume（suspended 状態から解除）
["pointerdown", "keydown", "touchstart"].forEach((ev) => {
  window.addEventListener(ev, () => {
    if (_ctx && _ctx.state === "suspended") _ctx.resume().catch(() => {});
  });
});

export function unlockSeAudio() {
  if (_ctx) {
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
    return;
  }
  getCtx();
}

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
  if (!buf) {
    loadBuffer(name).then(() => play(name, vol));
    return;
  }
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
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
loadBuffer("se_suzu.mp3");
loadBuffer("se_crash.mp3");

// ---- カーソル音: カチッとした短いクリック ----
export function playCursor() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // ノイズバースト → バンドパスフィルターでカチッ感
  const bufLen = ctx.sampleRate * 0.025 | 0;
  const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3200;
  bp.Q.value = 1.8;

  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.55, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

  noise.connect(bp); bp.connect(ng); ng.connect(ctx.destination);
  noise.start(t); noise.stop(t + 0.025);

  // 音程成分（カチッのボディ感）
  const osc = ctx.createOscillator();
  const og  = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(700, t + 0.018);
  og.gain.setValueAtTime(0.08, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
  osc.start(t); osc.stop(t + 0.02);
}

// ---- 決定音: ピコン（2音の上昇）----
export function playConfirm() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // "ピ"（660Hz）→ "コン"（1047Hz）の2音
  [[660, 0, 0.10], [1047, 0.09, 0.18]].forEach(([freq, delay, decay]) => {
    const st  = t + delay;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.22, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + decay);
    osc.start(st); osc.stop(st + decay + 0.01);
  });
}

// ---- クリック音: カチッ ----
export function playClickOn() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;

  osc.connect(hp);
  hp.connect(g);
  g.connect(ctx.destination);

  osc.type = "square";
  osc.frequency.setValueAtTime(980, t);
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.03);
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

  osc.start(t);
  osc.stop(t + 0.04);
}

export function playTimeMachineShine() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  for (let i = 0; i < 8; i++) {
    const st = t + i * 0.06;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1800 + i * 120, st);
    osc.frequency.exponentialRampToValueAtTime(2600 + i * 140, st + 0.08);
    g.gain.setValueAtTime(0.001, st);
    g.gain.linearRampToValueAtTime(0.07, st + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
    osc.start(st);
    osc.stop(st + 0.13);
  }
}

// ---- 勝利音: 短い上昇ファンファーレ ----
export function playVictory() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  [
    [523.25, 0.00, 0.12],
    [659.25, 0.08, 0.14],
    [783.99, 0.16, 0.16],
    [1046.5, 0.28, 0.28],
  ].forEach(([freq, delay, dur]) => {
    const st = t + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, st);
    g.gain.setValueAtTime(0.16, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st);
    osc.stop(st + dur + 0.01);
  });
}

// ---- ミナミ戦勝利音と同じジングル ----
let _battleWinCtx = null;
export function playBattleWinJingle() {
  try {
    if (!_battleWinCtx) _battleWinCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ac = _battleWinCtx;
    const now = ac.currentTime;

    function tone(freq, start, dur, vol, type = "sine", attack = 0.01, release = 0.15) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.connect(g); g.connect(ac.destination);
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, now + start);
      g.gain.linearRampToValueAtTime(vol, now + start + attack);
      g.gain.setValueAtTime(vol, now + start + dur - release);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    }

    function organ(freq, start, dur, vol) {
      tone(freq,       start, dur, vol,        "triangle", 0.03, 0.5);
      tone(freq * 2,   start, dur, vol * 0.55, "sawtooth", 0.03, 0.5);
      tone(freq * 3,   start, dur, vol * 0.30, "sawtooth", 0.03, 0.5);
      tone(freq * 4,   start, dur, vol * 0.15, "sawtooth", 0.03, 0.5);
      tone(freq * 0.5, start, dur, vol * 0.25, "triangle", 0.03, 0.5);
    }

    function buildChord(notes, step, hold, vol) {
      const total = hold + notes.length * step;
      notes.forEach((f, i) => organ(f, i * step, total - i * step, vol / notes.length));
    }

    buildChord([174.61, 261.63, 349.23, 523.25], 0.28, 1.6, 0.32);
  } catch (_) {}
}

// ---- ブザー音: 短い下降2音 ----
export function playBuzzer() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  [[220, 0.00, 0.08], [165, 0.07, 0.11]].forEach(([freq, delay, dur]) => {
    const st = t + delay;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, st);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.75), st + dur);
    g.gain.setValueAtTime(0.12, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st);
    osc.stop(st + dur + 0.01);
  });
}

export function playSuzu()    { play("se_suzu.mp3", 0.8); }

// ---- コイン購入音: チャリン ----
export function playCoin() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  [[1480, 0, 0.08], [2093, 0.06, 0.18]].forEach(([freq, delay, decay]) => {
    const st  = t + delay;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.18, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + decay);
    osc.start(st); osc.stop(st + decay + 0.01);
  });
}

// ---- タイプライター音声（キャラ別）----
// baseFreq + Math.random()*spread で抑揚を出す（teaserと同方式）
// voiceType: "m_low"|"m_mid"|"m_high"|"f_low"|"f_mid"|"f_high"|"old"|"robot"|"cat"|"default"
export function playTypingVoice(voiceType = "default") {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  const voices = {
    // 男性
    m_low:   { base:  80, spread:  25, gain: 0.10, dur: 0.08 },
    m_mid:   { base: 300, spread:  80, gain: 0.08, dur: 0.06 },
    m_high:  { base: 500, spread: 120, gain: 0.07, dur: 0.05 },
    // 女性
    f_low:   { base: 400, spread:  90, gain: 0.07, dur: 0.05 },
    f_mid:   { base: 750, spread: 150, gain: 0.06, dur: 0.04 },
    f_high:  { base:1100, spread: 280, gain: 0.05, dur: 0.03 },
    // エイリアス
    m:       { base: 300, spread:  80, gain: 0.08, dur: 0.06 },
    f:       { base: 750, spread: 150, gain: 0.06, dur: 0.04 },
    // その他
    old:     { base:  70, spread:  20, gain: 0.11, dur: 0.09 },
    robot:   { base: 380, spread:  10, gain: 0.07, dur: 0.06 },
    cat:     { base:1400, spread: 400, gain: 0.05, dur: 0.03 },
    default: { base: 500, spread: 120, gain: 0.07, dur: 0.045 },
  };
  const v = voices[voiceType] ?? voices.default;

  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.value = v.base + Math.random() * v.spread;
  g.gain.setValueAtTime(v.gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + v.dur);
  osc.start(t);
  osc.stop(t + v.dur + 0.005);
}

// ---- 穴落下音: ぽいんぽいんぽいん（3回バウンド）----
export function playHoleFall() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const st = t + i * 0.13;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    // 350Hz → 700Hz（ぽい） → 200Hz（ん）
    osc.frequency.setValueAtTime(350, st);
    osc.frequency.linearRampToValueAtTime(700, st + 0.03);
    osc.frequency.exponentialRampToValueAtTime(200, st + 0.12);
    g.gain.setValueAtTime(0.28, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
    osc.start(st); osc.stop(st + 0.13);
  }
}

// ---- 転がり音: ピュー（高音から低音へ下降ホイッスル）----
export function playHoleRoll(durationMs) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t   = ctx.currentTime;
  const dur = durationMs / 1000;

  // メイン：サイン波が高→低に落ちていくピュー
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1100, t);
  osc.frequency.exponentialRampToValueAtTime(110, t + dur);

  const fadeIn  = Math.min(0.3, dur * 0.08);
  const fadeOut = Math.min(0.6, dur * 0.12);
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.22, t + fadeIn);
  g.gain.setValueAtTime(0.22, t + dur - fadeOut);
  g.gain.linearRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur);

  // サブ：少し遅延したビブラート成分でコクを出す
  const osc2 = ctx.createOscillator();
  const g2   = ctx.createGain();
  osc2.connect(g2); g2.connect(ctx.destination);
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1080, t + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(105, t + dur);
  g2.gain.setValueAtTime(0.001, t + 0.05);
  g2.gain.linearRampToValueAtTime(0.08, t + fadeIn + 0.1);
  g2.gain.setValueAtTime(0.08, t + dur - fadeOut);
  g2.gain.linearRampToValueAtTime(0.001, t + dur);
  osc2.start(t + 0.05); osc2.stop(t + dur);
}

// ---- ざっざっ（土・砂利を踏む2連スクレイプ）----
export function playZazza() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  function scrape(st) {
    const len = ctx.sampleRate * 0.13 | 0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";  lp.frequency.value = 900;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 180;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.45, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.11);
    src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start(st); src.stop(st + 0.13);
  }

  scrape(t);
  scrape(t + 0.19);
}

// ---- ドア音: がちゃ（金属ラッチ） ----
export function playDoor() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  function metalClick(startT, amp) {
    const len = ctx.sampleRate * 0.04 | 0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp  = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 3500; bp.Q.value = 3;
    const hp  = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1500;
    const g   = ctx.createGain();
    g.gain.setValueAtTime(amp, startT);
    g.gain.exponentialRampToValueAtTime(0.001, startT + 0.035);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start(startT); src.stop(startT + 0.04);
  }

  // 「が」：ラッチが外れる
  metalClick(t, 0.55);
  // 「ちゃ」：跳ね返り
  metalClick(t + 0.055, 0.3);
}

// ---- インド風ショートジングル: シタール風 + タブラ ----
// メロディ: G A B C D C B G# G（全音符均等）
export function playIndianJingle() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // シタール風：ノコギリ波 + アタック瞬間に高めからピッチが落ちるギロっと感
  function sitar(freq, startT, dur, amp = 0.18) {
    const osc  = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); // 少しデチューン
    const bp   = ctx.createBiquadFilter();
    const g    = ctx.createGain();
    osc.connect(bp); osc2.connect(bp); bp.connect(g); g.connect(ctx.destination);
    osc.type  = "sawtooth";
    osc2.type = "sawtooth";
    // ギロっと：アタック時に freq*1.015 から freq へ素早く落とす
    osc.frequency.setValueAtTime(freq * 1.015, startT);
    osc.frequency.exponentialRampToValueAtTime(freq, startT + 0.018);
    osc2.frequency.setValueAtTime(freq * 1.022, startT);
    osc2.frequency.exponentialRampToValueAtTime(freq * 1.007, startT + 0.018);
    // バンドパスで中高域を強調（シタールのざらつき）
    bp.type = "bandpass";
    bp.frequency.value = freq * 2.5;
    bp.Q.value = 0.7;
    // エンベロープ：鋭いアタック → 自然な減衰
    g.gain.setValueAtTime(amp, startT);
    g.gain.exponentialRampToValueAtTime(amp * 0.45, startT + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
    osc.start(startT);  osc.stop(startT + dur + 0.01);
    osc2.start(startT); osc2.stop(startT + dur + 0.01);
  }

  // タブラ（ダヤー）: ドンッ
  function tabla(startT, amp = 0.30) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, startT);
    osc.frequency.exponentialRampToValueAtTime(70, startT + 0.14);
    g.gain.setValueAtTime(amp, startT);
    g.gain.exponentialRampToValueAtTime(0.001, startT + 0.16);
    osc.start(startT); osc.stop(startT + 0.17);
    const len = ctx.sampleRate * 0.03 | 0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(amp * 0.4, startT);
    ng.gain.exponentialRampToValueAtTime(0.001, startT + 0.03);
    src.connect(ng); ng.connect(ctx.destination);
    src.start(startT); src.stop(startT + 0.03);
  }

  // G A B C D C B G# G — 全部均等 0.14s、最後だけ保持
  const N  = 0.14; // 1音の長さ
  const G4  = 392.00;
  const A4  = 440.00;
  const B4  = 493.88;
  const C5  = 523.25;
  const D5  = 587.33;
  const Gs4 = 415.30;

  [G4, A4, B4, C5, D5, C5, B4, Gs4, G4].forEach((freq, i) => {
    const isLast = i === 8;
    sitar(freq, t + i * N, isLast ? 0.55 : N);
  });

  // タブラ: 頭・5拍目(D)・ラスト
  tabla(t,           0.30);
  tabla(t + 4 * N,   0.22);
  tabla(t + 8 * N,   0.28);

  // タンプーラ風ドローン G2
  const total = 9 * N + 0.55;
  const dr = ctx.createOscillator();
  const dg = ctx.createGain();
  dr.connect(dg); dg.connect(ctx.destination);
  dr.type = "sine";
  dr.frequency.value = 98.00;
  dg.gain.setValueAtTime(0.06, t);
  dg.gain.setValueAtTime(0.06, t + total - 0.3);
  dg.gain.linearRampToValueAtTime(0.001, t + total + 0.1);
  dr.start(t); dr.stop(t + total + 0.15);
}

// ---- 波の音: ザザーン（うねり→砕ける→引く）----
export function playWave() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const dur = 2.2;

  const len = ctx.sampleRate * dur | 0;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // 低域を強調してザーン感
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 600;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 60;

  const g = ctx.createGain();
  // うねり上昇(0→0.8s) → 砕ける(0.8s peak) → 引く(〜2.2s)
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.55, t + 0.8);
  g.gain.linearRampToValueAtTime(0.70, t + 1.0);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);

  src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(ctx.destination);
  src.start(t); src.stop(t + dur);
}

// ---- アイテム取得ジングル: 明るい上昇アルペジオ（C→E→G→C）----
export function playItemJingle() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // C5→E5→G5→C6
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const N = 0.09; // 音の間隔

  notes.forEach((freq, i) => {
    const st = t + i * N;
    const isLast = i === notes.length - 1;
    const dur = isLast ? 0.40 : N + 0.03;

    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.20, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st); osc.stop(st + dur + 0.01);
  });
}

// ---- 宿ジングル: ちーん（ベル風、ほっこり） ----
export function playInnJingle() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // G5 → B5 → D6 → G6（上行アルペジオ、最後をベル長めに保持）
  const notes = [783.99, 987.77, 1174.66, 1567.98];
  const N = 0.12;

  notes.forEach((freq, i) => {
    const st = t + i * N;
    const isLast = i === notes.length - 1;
    const dur = isLast ? 1.2 : N + 0.10;

    // 基音（三角波）
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.18, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st); osc.stop(st + dur + 0.02);

    // 倍音（サイン、ベルの煌めき）
    const osc2 = ctx.createOscillator();
    const g2   = ctx.createGain();
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0.08, st);
    g2.gain.exponentialRampToValueAtTime(0.001, st + dur * 0.9);
    osc2.start(st); osc2.stop(st + dur + 0.02);
  });
}

// ---- 道具使用SE: てれれてってってー（軽快カービィ風） ----
export function playUseItemSe() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // て  れ  れ  て  っ  て  っ  てー
  const notes = [
    { f: 659.25,  d: 0.055, gap: 0.055 },
    { f: 783.99,  d: 0.055, gap: 0.055 },
    { f: 880.00,  d: 0.055, gap: 0.060 },
    { f: 659.25,  d: 0.070, gap: 0.080 },
    { f: 783.99,  d: 0.070, gap: 0.080 },
    { f: 987.77,  d: 0.070, gap: 0.080 },
    { f: 1174.66, d: 0.320, gap: 0.320 },
  ];

  let st = t;
  for (const { f, d, gap } of notes) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.10, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + d);
    osc.start(st); osc.stop(st + d + 0.01);
    st += gap;
  }
}

// ---- 心臓の鼓動（ボス戦BGM） ----
let _heartbeatTimer = null;

function _playThump(actx, t, freq, gain, dur) {
  const osc = actx.createOscillator();
  const g   = actx.createGain();
  osc.connect(g); g.connect(actx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.025);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.01);

  // ボディ感（ローノイズパルス）
  const len = actx.sampleRate * 0.04 | 0;
  const nb  = actx.createBuffer(1, len, actx.sampleRate);
  const d   = nb.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const ns = actx.createBufferSource();
  ns.buffer = nb;
  const lp = actx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 120;
  const ng = actx.createGain();
  ng.gain.setValueAtTime(gain * 0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  ns.connect(lp); lp.connect(ng); ng.connect(actx.destination);
  ns.start(t); ns.stop(t + 0.04);
}

export function startHeartbeat(bpm = 68, volume = 0.35) {
  stopHeartbeat();
  const intervalMs = (60 / bpm) * 1000;

  function beat() {
    const actx = getCtx();
    if (!actx) return;
    if (actx.state === "suspended") actx.resume().catch(() => {});
    const t = actx.currentTime;
    _playThump(actx, t,        62, volume * 1.57, 0.15); // lub
    _playThump(actx, t + 0.18, 68, volume * 1.09, 0.12); // dub
  }

  beat();
  _heartbeatTimer = setInterval(beat, intervalMs);
}

export function stopHeartbeat() {
  if (_heartbeatTimer !== null) {
    clearInterval(_heartbeatTimer);
    _heartbeatTimer = null;
  }
}

// ---- ジョーズBGM ----
let _jawsAudio = null;

export function playJaws() {
  stopJaws();
  _jawsAudio = new Audio("assets/audio/bgm_jaws.mp3");
  _jawsAudio.loop = true;
  _jawsAudio.volume = 0.8;
  _jawsAudio.play().catch(() => {});
}

export function stopJaws() {
  if (_jawsAudio) {
    _jawsAudio.pause();
    _jawsAudio.currentTime = 0;
    _jawsAudio = null;
  }
}

// ---- ぐしゃ ----
export function playCrush() {
  play("se_crash.mp3", 1.0);
}

// ---- パンチ音: ドカッ / バキッ / ボコッ ----
export function playPunch(type = 0) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  // ノイズバースト（肉を叩く感）
  const len = ctx.sampleRate * 0.07 | 0;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;

  // タイプ別に帯域を変える
  const freq  = [300, 600, 180][type % 3]; // ドカ/バキ/ボコ
  const bp    = ctx.createBiquadFilter();
  bp.type     = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value  = 1.2;

  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.8, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

  src.connect(bp); bp.connect(ng); ng.connect(ctx.destination);
  src.start(t); src.stop(t + 0.07);

  // 低音ボディ（ドスッ感）
  const osc = ctx.createOscillator();
  const og  = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime([120, 200, 80][type % 3], t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);
  og.gain.setValueAtTime(0.35, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.start(t); osc.stop(t + 0.06);
}

// ---- クエスト達成ジングル ----
// パターンA: ゼルダ風ファンファーレ（E→G#→B→E の上昇、最後はベル余韻）
export function playQuestJingleA() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const notes = [329.63, 415.30, 493.88, 659.26]; // E4 G#4 B4 E5
  const N = 0.11;
  notes.forEach((freq, i) => {
    const st = t + i * N;
    const isLast = i === notes.length - 1;
    const dur = isLast ? 0.6 : N + 0.02;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = isLast ? "sine" : "square";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.22, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st); osc.stop(st + dur + 0.01);
    // ベル倍音
    if (isLast) {
      const osc2 = ctx.createOscillator();
      const g2   = ctx.createGain();
      osc2.connect(g2); g2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.value = freq * 2;
      g2.gain.setValueAtTime(0.08, st);
      g2.gain.exponentialRampToValueAtTime(0.001, st + 0.45);
      osc2.start(st); osc2.stop(st + 0.46);
    }
  });
}

// パターンB: 短いきらめき（高音バースト→余韻、コイン取得系）
export function playQuestJingleB() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  // 素早い上昇 + 2音ロングトーン
  const quick = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  quick.forEach((freq, i) => {
    const st = t + i * 0.06;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.15, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.08);
    osc.start(st); osc.stop(st + 0.09);
  });
  // ラスト余韻ハーモニー
  [783.99, 1046.50].forEach((freq, i) => {
    const st = t + 0.32 + i * 0.04;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.18, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.50);
    osc.start(st); osc.stop(st + 0.51);
  });
}

// パターンC: クラシックRPG達成音（ド〜ミ〜ソ〜ドー ゆっくり、最後に和音）
export function playQuestJingleC() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const melody = [
    [261.63, 0.00], // C4
    [329.63, 0.14], // E4
    [392.00, 0.28], // G4
    [523.25, 0.42], // C5
  ];
  melody.forEach(([freq, delay]) => {
    const st = t + delay;
    const isLast = delay === 0.42;
    const dur = isLast ? 0.70 : 0.16;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.20, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st); osc.stop(st + dur + 0.01);
  });
  // 最後に Cメジャーコード（E5+G5）を重ねる
  [659.25, 783.99].forEach(freq => {
    const st = t + 0.42;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.10, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.70);
    osc.start(st); osc.stop(st + 0.71);
  });
}

// パターンD: 短いトランペット風ファンファーレ（タタタター）
export function playQuestJingleD() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  // タ タ タ ター（付点リズム）
  const pattern = [
    [392.00, 0.00, 0.07], // G4 短
    [392.00, 0.09, 0.07], // G4 短
    [392.00, 0.18, 0.07], // G4 短
    [523.25, 0.27, 0.50], // C5 長
  ];
  pattern.forEach(([freq, delay, dur]) => {
    const st = t + delay;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sawtooth";
    // 金管っぽく: ピッチを少し上から落とす
    osc.frequency.setValueAtTime(freq * 1.02, st);
    osc.frequency.exponentialRampToValueAtTime(freq, st + 0.02);
    // 倍音をハイパスで削って整える
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 200;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 2200;
    osc.connect(hp); hp.connect(lp);
    lp.disconnect(); // osc→g の直接接続と切り替え
    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(freq * 1.02, st);
    osc2.frequency.exponentialRampToValueAtTime(freq, st + 0.02);
    osc2.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, st);
    g.gain.linearRampToValueAtTime(0.18, st + 0.015);
    g.gain.setValueAtTime(0.18, st + dur - 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc2.start(st); osc2.stop(st + dur + 0.01);
  });
}

// ---- カレー調理音: ぐつぐつ沸騰 + 泡ぽこぽこ ----
export function playCooking(durationMs = 2400) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const dur = durationMs / 1000;

  // 沸騰ノイズ（低域）
  const len = ctx.sampleRate * dur | 0;
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;

  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.001, t);
  ng.gain.linearRampToValueAtTime(0.32, t + 0.5);
  ng.gain.setValueAtTime(0.32, t + dur - 0.4);
  ng.gain.linearRampToValueAtTime(0.001, t + dur);

  noise.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
  noise.start(t); noise.stop(t + dur);

  // 泡ぽこぽこ（ランダムタイミング）
  const bubbles = Math.floor(dur * 5);
  for (let i = 0; i < bubbles; i++) {
    const st = t + 0.4 + Math.random() * (dur - 0.6);
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(110 + Math.random() * 90, st);
    osc.frequency.exponentialRampToValueAtTime(70, st + 0.09);
    g.gain.setValueAtTime(0.20, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.09);
    osc.start(st); osc.stop(st + 0.1);
  }
}

// ---- INFIERNO TRIP テクノBGM ----
let _shootingScheduler = null;
let _shootingGain = null;
let _afloClubScheduler = null;
let _afloClubKickAt = 0;

const BPM        = 138;
const STEP_DUR   = (60 / BPM) / 4;   // 16分音符の長さ
const LOOKAHEAD  = 0.12;              // 先読み時間 (s)
const SCHED_INT  = 60;                // スケジューラ呼び出し間隔 (ms)

// Phrygian on E: E2 F2 G2 A2 B2 C3 D3 E3
const BASS_NOTES = [82.41, 87.31, 98.00, 110.00, 123.47, 130.81, 146.83, 164.81];
// 16step bassパターン（インデックス, -1=rest）
const BASS_PAT = [0,-1,-1,0, -1,-1,2,-1, 3,-1,-1,3, -1,2,-1,0];
// 16step leadパターン（BASS_NOTESの4倍音, -1=rest）
const LEAD_PAT = [-1,-1,4,-1, -1,6,-1,-1, -1,4,-1,-1, 7,-1,-1,-1];

function schedKick(t, vol = 0.7) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.start(t); osc.stop(t + 0.30);

  // punch noise
  const bl  = ctx.sampleRate * 0.04 | 0;
  const nb  = ctx.createBuffer(1, bl, ctx.sampleRate);
  const nd  = nb.getChannelData(0);
  for (let i = 0; i < bl; i++) nd[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource(); ns.buffer = nb;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.3, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  ns.connect(ng); ng.connect(ctx.destination);
  ns.start(t); ns.stop(t + 0.04);
}

function schedHihat(t, open = false) {
  const ctx = getCtx();
  const dur = open ? 0.10 : 0.025;
  const bl  = ctx.sampleRate * dur | 0;
  const nb  = ctx.createBuffer(1, bl, ctx.sampleRate);
  const nd  = nb.getChannelData(0);
  for (let i = 0; i < bl; i++) nd[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource(); ns.buffer = nb;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
  const g  = ctx.createGain();
  g.gain.setValueAtTime(open ? 0.18 : 0.10, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  ns.connect(hp); hp.connect(g); g.connect(ctx.destination);
  ns.start(t); ns.stop(t + dur + 0.005);
}

function schedBass(t, freq) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const lp  = ctx.createBiquadFilter();
  const g   = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(800, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + STEP_DUR * 1.8);
  lp.Q.value = 8;
  g.gain.setValueAtTime(0.28, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + STEP_DUR * 1.9);
  osc.connect(lp); lp.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + STEP_DUR * 2);
}

function schedLead(t, freq) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq * 4; // 4倍音（高域）
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + STEP_DUR * 1.5);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + STEP_DUR * 1.6);
}

export function startShootingBgm() {
  stopShootingBgm();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  let nextStepTime = ctx.currentTime + 0.05;
  let stepIdx = 0;
  let bar = 0;

  _shootingScheduler = setInterval(() => {
    const ctx2 = getCtx();
    while (nextStepTime < ctx2.currentTime + LOOKAHEAD) {
      const s = stepIdx % 16;

      // キック：4つ打ち（0,4,8,12）
      if (s % 4 === 0) schedKick(nextStepTime);

      // クラップ/スネア：2,10
      if (s === 2 || s === 10) {
        schedHihat(nextStepTime, true);
      } else {
        schedHihat(nextStepTime, false);
      }

      // ベース
      const bi = BASS_PAT[s];
      if (bi >= 0) schedBass(nextStepTime, BASS_NOTES[bi]);

      // リード
      const li = LEAD_PAT[s];
      if (li >= 0) schedLead(nextStepTime, BASS_NOTES[li]);

      nextStepTime += STEP_DUR;
      stepIdx++;
      if (stepIdx % 16 === 0) bar++;
    }
  }, SCHED_INT);
}

export function stopShootingBgm() {
  if (_shootingScheduler !== null) {
    clearInterval(_shootingScheduler);
    _shootingScheduler = null;
  }
}

const AFLO_BASS_NOTES = [55.0, 65.41, 73.42, 82.41];
const AFLO_BASS_PAT   = [0,-1,0,-1, 1,-1,0,-1, 2,-1,1,-1, 3,-1,1,-1];

function schedAfloKick(t) {
  _afloClubKickAt = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(28, t + 0.09);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
  osc.start(t); osc.stop(t + 0.36);
}

function schedAfloBass(t, freq) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(320, t);
  lp.frequency.exponentialRampToValueAtTime(120, t + STEP_DUR * 1.8);
  lp.Q.value = 10;
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + STEP_DUR * 1.9);
  osc.connect(lp); lp.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + STEP_DUR * 2);
}

export function startAfloClubBgm() {
  stopAfloClubBgm();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  let nextStepTime = ctx.currentTime + 0.05;
  let stepIdx = 0;

  _afloClubScheduler = setInterval(() => {
    const ctx2 = getCtx();
    while (nextStepTime < ctx2.currentTime + LOOKAHEAD) {
      const s = stepIdx % 16;

      if (s % 4 === 0) schedAfloKick(nextStepTime);
      if (s % 4 === 0) schedHihat(nextStepTime, false);
      if (s % 4 === 2) schedHihat(nextStepTime, true);

      const bi = AFLO_BASS_PAT[s];
      if (bi >= 0) schedAfloBass(nextStepTime, AFLO_BASS_NOTES[bi]);

      nextStepTime += STEP_DUR;
      stepIdx++;
    }
  }, SCHED_INT);
}

export function stopAfloClubBgm() {
  if (_afloClubScheduler !== null) {
    clearInterval(_afloClubScheduler);
    _afloClubScheduler = null;
  }
}

export function getAfloClubKickPulseMs() {
  if (!_afloClubKickAt) return 999999;
  const now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  return now - _afloClubKickAt;
}
