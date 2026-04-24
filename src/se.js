// se.js – Web Audio API ベース（モバイルの autoplay 制限を回避）
const SE_PATH = "assets/audio/se/";

let _ctx = null;
let _unlocked = false;
const _buffers = {};
let _rainNoise = null;
let _rainGain = null;
let _rainHp = null;
let _rainLp = null;
let _seasideNodes = null;
let _seasideGain = null;

const SAMPLE_SE_MASTER = 0.72;
const SAMPLE_SE_SCALE = {
  "se_suzu.mp3": 0.35,
  "se_crash.mp3": 2.6,
  "se_encount.mp3": 2.1,
  "se_hit.mp3": 1.45,
  "se_koke.mp3": 0.9,
  "se_battle_in.mp3": 0.8,
  "se_chibi.mp3": 0.8,
};
const GENERATED_SE_MASTER = 0.72;
const GENERATED_BGM_MASTER = 0.72;
const AMBIENT_BGM_MASTER = 0.78;

function sampleSeLevel(name, vol) {
  return Math.min(2.2, vol * SAMPLE_SE_MASTER * (SAMPLE_SE_SCALE[name] ?? 1));
}

function generatedSeLevel(vol) {
  return vol * GENERATED_SE_MASTER;
}

function generatedBgmLevel(vol) {
  return vol * GENERATED_BGM_MASTER;
}

function ambientBgmLevel(vol) {
  return vol * AMBIENT_BGM_MASTER;
}

function getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  }
  return _ctx;
}

function primeUnlock(ctx) {
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (_) {}
}

function gestureUnlock() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  if (!_unlocked) {
    primeUnlock(ctx);
    _unlocked = true;
  }
}

// ユーザー操作で AudioContext を resume（suspended 状態から解除）
["pointerdown", "keydown", "touchstart", "touchend", "click"].forEach((ev) => {
  window.addEventListener(ev, gestureUnlock, { passive: true });
});

export function unlockSeAudio() {
  gestureUnlock();
}

function ensureRainLoop() {
  const ctx = getCtx();
  if (_rainNoise && _rainGain && _rainHp && _rainLp) return ctx;

  const len = ctx.sampleRate * 2;
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.75;

  _rainNoise = ctx.createBufferSource();
  _rainNoise.buffer = noiseBuf;
  _rainNoise.loop = true;

  _rainHp = ctx.createBiquadFilter();
  _rainHp.type = "highpass";
  _rainHp.frequency.value = 900;

  _rainLp = ctx.createBiquadFilter();
  _rainLp.type = "lowpass";
  _rainLp.frequency.value = 5200;

  _rainGain = ctx.createGain();
  _rainGain.gain.value = 0.0001;

  _rainNoise.connect(_rainHp);
  _rainHp.connect(_rainLp);
  _rainLp.connect(_rainGain);
  _rainGain.connect(ctx.destination);
  _rainNoise.start();
  return ctx;
}

export function startRainLoop() {
  const ctx = ensureRainLoop();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  _rainGain.gain.setTargetAtTime(ambientBgmLevel(0.045), ctx.currentTime, 0.45);
}

export function stopRainLoop() {
  if (!_rainGain || !_ctx) return;
  _rainGain.gain.setTargetAtTime(0.0001, _ctx.currentTime, 0.6);
}

export function startSeasideBgm(fadeMs = 3200) {
  stopSeasideBgm(0);
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.connect(ctx.destination);

  const len = ctx.sampleRate * 3;
  const noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const waves = ctx.createBufferSource();
  waves.buffer = noiseBuf;
  waves.loop = true;
  const waveLp = ctx.createBiquadFilter();
  waveLp.type = "lowpass";
  waveLp.frequency.value = 620;
  const waveHp = ctx.createBiquadFilter();
  waveHp.type = "highpass";
  waveHp.frequency.value = 120;
  const waveGain = ctx.createGain();
  waveGain.gain.value = 0.075;
  const waveLfo = ctx.createOscillator();
  waveLfo.type = "sine";
  waveLfo.frequency.value = 0.08;
  const waveLfoGain = ctx.createGain();
  waveLfoGain.gain.value = 0.035;
  waveLfo.connect(waveLfoGain);
  waveLfoGain.connect(waveGain.gain);
  waves.connect(waveHp);
  waveHp.connect(waveLp);
  waveLp.connect(waveGain);
  waveGain.connect(master);

  const wind = ctx.createBufferSource();
  wind.buffer = noiseBuf;
  wind.loop = true;
  const windBp = ctx.createBiquadFilter();
  windBp.type = "bandpass";
  windBp.frequency.value = 1050;
  windBp.Q.value = 0.65;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.032;
  const windLfo = ctx.createOscillator();
  windLfo.type = "sine";
  windLfo.frequency.value = 0.045;
  const windLfoGain = ctx.createGain();
  windLfoGain.gain.value = 220;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(windBp.frequency);
  wind.connect(windBp);
  windBp.connect(windGain);
  windGain.connect(master);

  waves.start();
  wind.start();
  waveLfo.start();
  windLfo.start();
  const target = ambientBgmLevel(0.50);
  master.gain.setTargetAtTime(target, ctx.currentTime, Math.max(0.05, fadeMs / 3000));
  _seasideGain = master;
  _seasideNodes = [waves, wind, waveLfo, windLfo, master];
}

export function stopSeasideBgm(fadeMs = 900) {
  if (!_seasideNodes || !_ctx) return;
  const ctx = _ctx;
  if (_seasideGain) {
    _seasideGain.gain.setTargetAtTime(0.0001, ctx.currentTime, Math.max(0.03, fadeMs / 3000));
  }
  const nodes = _seasideNodes;
  _seasideNodes = null;
  _seasideGain = null;
  setTimeout(() => {
    for (const n of nodes) {
      try { if (typeof n.stop === "function") n.stop(); } catch (_) {}
      try { if (typeof n.disconnect === "function") n.disconnect(); } catch (_) {}
    }
  }, Math.max(0, fadeMs + 120));
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
    gain.gain.value = sampleSeLevel(name, vol);
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
  ng.gain.setValueAtTime(generatedSeLevel(0.55), t);
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
  og.gain.setValueAtTime(generatedSeLevel(0.08), t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
  osc.start(t); osc.stop(t + 0.02);
}

export function playAlienTypingNoise(seed = 0) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const dur = 0.045;
  const bufLen = Math.max(1, (ctx.sampleRate * dur) | 0);
  const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    const e = 1 - i / bufLen;
    data[i] = (Math.random() * 2 - 1) * e * e;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(360 + (seed % 7) * 90, t);
  bp.frequency.exponentialRampToValueAtTime(180 + (seed % 5) * 45, t + dur);
  bp.Q.value = 8;

  const crush = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.42);
  }
  crush.curve = curve;
  crush.oversample = "none";

  const ng = ctx.createGain();
  ng.gain.setValueAtTime(generatedSeLevel(0.06), t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + dur);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(54 + (seed % 4) * 7, t);
  osc.frequency.exponentialRampToValueAtTime(31 + (seed % 3) * 5, t + dur);
  og.gain.setValueAtTime(generatedSeLevel(0.018), t);
  og.gain.exponentialRampToValueAtTime(0.001, t + dur);

  noise.connect(bp); bp.connect(crush); crush.connect(ng); ng.connect(ctx.destination);
  osc.connect(og); og.connect(ctx.destination);
  noise.start(t); noise.stop(t + dur);
  osc.start(t); osc.stop(t + dur);
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
    g.gain.setValueAtTime(generatedSeLevel(0.22), st);
    g.gain.exponentialRampToValueAtTime(0.001, st + decay);
    osc.start(st); osc.stop(st + decay + 0.01);
  });
}

export function playShootingShot() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  osc.connect(hp);
  hp.connect(g);
  g.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(1260, t);
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.04);
  g.gain.setValueAtTime(generatedSeLevel(0.10), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.start(t);
  osc.stop(t + 0.055);

  const len = Math.max(1, (ctx.sampleRate * 0.018) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2800;
  bp.Q.value = 1.6;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(generatedSeLevel(0.045), t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.022);
}

export function playShootingHit(strong = false) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = "triangle";
  const top = strong ? 980 : 860;
  const bot = strong ? 420 : 520;
  osc.frequency.setValueAtTime(top, t);
  osc.frequency.exponentialRampToValueAtTime(bot, t + 0.045);
  g.gain.setValueAtTime(generatedSeLevel(strong ? 0.11 : 0.07), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.start(t);
  osc.stop(t + 0.055);
}

export function playShootingKill() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  [[620, 0, 0.08], [930, 0.012, 0.09], [1240, 0.02, 0.11]].forEach(([freq, delay, dur]) => {
    const st = t + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, st);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, st + dur);
    g.gain.setValueAtTime(generatedSeLevel(0.08), st);
    g.gain.exponentialRampToValueAtTime(0.001, st + dur);
    osc.start(st);
    osc.stop(st + dur + 0.01);
  });

  const len = Math.max(1, (ctx.sampleRate * 0.045) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 700;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(generatedSeLevel(0.065), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(hp);
  hp.connect(lp);
  lp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.055);
}

export function playShootingHurt() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(72, t + 0.12);
  g.gain.setValueAtTime(generatedSeLevel(0.11), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  osc.start(t);
  osc.stop(t + 0.15);

  const len = Math.max(1, (ctx.sampleRate * 0.05) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.2);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 420;
  bp.Q.value = 0.9;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(generatedSeLevel(0.05), t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.065);
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
  g.gain.setValueAtTime(generatedSeLevel(0.16), t);
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
    g.gain.linearRampToValueAtTime(generatedSeLevel(0.07), st + 0.01);
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
    g.gain.setValueAtTime(generatedSeLevel(0.16), st);
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
    g.gain.setValueAtTime(generatedSeLevel(0.12), st);
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
  const mixVolume = generatedBgmLevel(volume);

  function beat() {
    const actx = getCtx();
    if (!actx) return;
    if (actx.state === "suspended") actx.resume().catch(() => {});
    const t = actx.currentTime;
    _playThump(actx, t,        62, mixVolume * 1.57, 0.15); // lub
    _playThump(actx, t + 0.18, 68, mixVolume * 1.09, 0.12); // dub
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
  _jawsAudio.volume = 0.9;
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

export function playGlassShatter() {
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
  const mixVol = generatedBgmLevel(vol);
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);
  g.gain.setValueAtTime(mixVol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.start(t); osc.stop(t + 0.30);

  // punch noise
  const bl  = ctx.sampleRate * 0.04 | 0;
  const nb  = ctx.createBuffer(1, bl, ctx.sampleRate);
  const nd  = nb.getChannelData(0);
  for (let i = 0; i < bl; i++) nd[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource(); ns.buffer = nb;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(generatedBgmLevel(0.3), t);
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
  g.gain.setValueAtTime(generatedBgmLevel(open ? 0.18 : 0.10), t);
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
  g.gain.setValueAtTime(generatedBgmLevel(0.28), t);
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
  g.gain.setValueAtTime(generatedBgmLevel(0.12), t);
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

// ---- ダイビングBGM: 水中ぽこぽこ音 ----
let _divingScheduler = null;

function schedBubble(t, freq) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.15);
  g.gain.setValueAtTime(generatedBgmLevel(0.12), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.start(t); osc.stop(t + 0.22);
}

function schedDrip(t) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(1200 + Math.random() * 600, t);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
  g.gain.setValueAtTime(generatedBgmLevel(0.06), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.start(t); osc.stop(t + 0.12);
}

export function playSpearShot() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t); osc.stop(t + 0.13);
}

export function playDiveHit() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.start(t); osc.stop(t + 0.16);
}

export function playDiveResult(ok) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const notes = ok ? [523, 659, 784, 1047] : [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    const st = t + i * 0.1;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = ok ? "triangle" : "square";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.15, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + (i === 3 ? 0.35 : 0.12));
    osc.start(st); osc.stop(st + 0.4);
  });
}

export function startDivingBgm() {
  stopDivingBgm();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const stepDur = 0.18;
  let nextTime = ctx.currentTime + 0.05;
  let stepIdx = 0;
  const bubbleFreqs = [320, 400, 480, 360, 520, 280];
  _divingScheduler = setInterval(() => {
    const ctx2 = getCtx();
    while (nextTime < ctx2.currentTime + 0.15) {
      const s = stepIdx % 16;
      if (s === 0 || s === 6 || s === 10 || s === 14) {
        schedBubble(nextTime, bubbleFreqs[stepIdx % bubbleFreqs.length]);
      }
      if (s === 3 || s === 11) {
        schedDrip(nextTime);
      }
      nextTime += stepDur;
      stepIdx++;
    }
  }, 80);
}

export function stopDivingBgm() {
  if (_divingScheduler !== null) {
    clearInterval(_divingScheduler);
    _divingScheduler = null;
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
  g.gain.setValueAtTime(generatedBgmLevel(0.9), t);
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
  g.gain.setValueAtTime(generatedBgmLevel(0.22), t);
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

// ---- 恐竜シーン SE ----
export function playDinoStep(vol = 1) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  // 低音ドシン
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(55, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
  g.gain.setValueAtTime(0.25 * vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t); osc.stop(t + 0.32);
  // ノイズ成分
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15 | 0, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const ns = ctx.createBufferSource();
  const ng = ctx.createGain();
  ns.buffer = buf; ns.connect(ng); ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.12 * vol, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  ns.start(t); ns.stop(t + 0.16);
}

export function playBirdCall() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const freqs = [2200, 2600, 2400];
  freqs.forEach((f, i) => {
    const st = t + i * 0.12;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, st);
    osc.frequency.exponentialRampToValueAtTime(f * 0.85, st + 0.08);
    g.gain.setValueAtTime(0.06, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.1);
    osc.start(st); osc.stop(st + 0.12);
  });
}

let waterfallNode = null;
let waterfallGain = null;
export function startWaterfall(vol = 0.12) {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  if (waterfallNode) return;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource();
  ns.buffer = buf;
  ns.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 1200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  ns.start();
  waterfallNode = ns;
  waterfallGain = g;
}
export function setWaterfallVol(vol) {
  if (waterfallGain) {
    const ctx = getCtx();
    waterfallGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
  }
}
export function stopWaterfall() {
  if (waterfallNode) {
    waterfallNode.stop();
    waterfallNode = null;
    waterfallGain = null;
  }
}

// ---- 電話着信音: プルルルルル ----
let _phoneRingTimer = null;
let _phoneRingGain = null;
export function startPhoneRing() {
  stopPhoneRing();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const master = ctx.createGain();
  master.connect(ctx.destination);
  _phoneRingGain = master;
  const ring = () => {
    if (!_phoneRingGain) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const st = t + i * 0.12;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); osc2.connect(g); g.connect(master);
      osc.type = "sine";
      osc2.type = "sine";
      osc.frequency.value = 480;
      osc2.frequency.value = 620;
      g.gain.setValueAtTime(0.12, st);
      g.gain.setValueAtTime(0.12, st + 0.05);
      g.gain.setValueAtTime(0.001, st + 0.06);
      osc.start(st); osc.stop(st + 0.06);
      osc2.start(st); osc2.stop(st + 0.06);
    }
  };
  ring();
  _phoneRingTimer = setInterval(ring, 1400);
}
export function stopPhoneRing() {
  if (_phoneRingTimer !== null) {
    clearInterval(_phoneRingTimer);
    _phoneRingTimer = null;
  }
  if (_phoneRingGain) {
    _phoneRingGain.gain.setValueAtTime(0, getCtx().currentTime);
    _phoneRingGain = null;
  }
}

// ---- 電話応答: ピ ----
export function playPhonePick() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 1800;
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t); osc.stop(t + 0.13);
}

// ---- 電話切断: ガチャン ----
export function playPhoneHang() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const len = ctx.sampleRate * 0.06 | 0;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 2800; bp.Q.value = 2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  src.connect(bp); bp.connect(g); g.connect(ctx.destination);
  src.start(t); src.stop(t + 0.06);
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.connect(og); og.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
  og.gain.setValueAtTime(0.2, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.start(t); osc.stop(t + 0.05);
}

// ---- メロスピBGM ----
let _metalScheduler = null;

const FACTORY_BPM = 100;
const FACTORY_STEP = 60 / FACTORY_BPM / 4;
let _factoryNodes = null;

export function startMetalBgm() {
  stopMetalBgm();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const master = ctx.createGain();
  master.gain.value = generatedBgmLevel(0.3);
  master.connect(ctx.destination);

  // low drone hum (electrical)
  const drone = ctx.createOscillator();
  const droneG = ctx.createGain();
  drone.type = "sawtooth";
  drone.frequency.value = 55;
  const droneLp = ctx.createBiquadFilter();
  droneLp.type = "lowpass"; droneLp.frequency.value = 200;
  drone.connect(droneLp); droneLp.connect(droneG); droneG.connect(master);
  droneG.gain.value = 0.12;
  drone.start();

  // filtered noise (machinery hiss)
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf; noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 2;
  const noiseG = ctx.createGain();
  noiseG.gain.value = 0.04;
  noise.connect(bp); bp.connect(noiseG); noiseG.connect(master);
  noise.start();

  // dissonant tritone swell (tension)
  const tens1 = ctx.createOscillator();
  const tens2 = ctx.createOscillator();
  const tensG = ctx.createGain();
  tens1.type = "sine"; tens1.frequency.value = 82.41;
  tens2.type = "sine"; tens2.frequency.value = 116.54;
  const tensLfo = ctx.createOscillator();
  const tensLfoG = ctx.createGain();
  tensLfo.type = "sine"; tensLfo.frequency.value = 0.15;
  tensLfoG.gain.value = 0.04;
  tensLfo.connect(tensLfoG); tensLfoG.connect(tensG.gain);
  tens1.connect(tensG); tens2.connect(tensG); tensG.connect(master);
  tensG.gain.value = 0.0;
  tens1.start(); tens2.start(); tensLfo.start();

  // rhythmic clank
  let nextTime = ctx.currentTime + 0.05;
  let stepIdx = 0;
  const pattern = [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1];

  _metalScheduler = setInterval(() => {
    const ctx2 = getCtx();
    while (nextTime < ctx2.currentTime + LOOKAHEAD) {
      const s = stepIdx % 16;
      if (pattern[s]) {
        const bl = ctx2.sampleRate * 0.03 | 0;
        const cb = ctx2.createBuffer(1, bl, ctx2.sampleRate);
        const cd = cb.getChannelData(0);
        for (let i = 0; i < bl; i++) cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bl, 3);
        const cs = ctx2.createBufferSource(); cs.buffer = cb;
        const hp = ctx2.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
        const cg = ctx2.createGain();
        cg.gain.setValueAtTime(0.15, nextTime);
        cg.gain.exponentialRampToValueAtTime(0.001, nextTime + 0.03);
        cs.connect(hp); hp.connect(cg); cg.connect(master);
        cs.start(nextTime); cs.stop(nextTime + 0.035);
      }
      if (s === 0 || s === 8) {
        const osc = ctx2.createOscillator();
        const g = ctx2.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, nextTime);
        osc.frequency.exponentialRampToValueAtTime(40, nextTime + 0.08);
        osc.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.1, nextTime);
        g.gain.exponentialRampToValueAtTime(0.001, nextTime + 0.15);
        osc.start(nextTime); osc.stop(nextTime + 0.16);
      }
      // warning pulse (every 32 steps on step 12)
      if (stepIdx % 32 === 12) {
        const wo = ctx2.createOscillator();
        const wg = ctx2.createGain();
        wo.type = "square";
        wo.frequency.setValueAtTime(440, nextTime);
        wo.frequency.exponentialRampToValueAtTime(220, nextTime + 0.12);
        wo.connect(wg); wg.connect(master);
        wg.gain.setValueAtTime(0.04, nextTime);
        wg.gain.exponentialRampToValueAtTime(0.001, nextTime + 0.12);
        wo.start(nextTime); wo.stop(nextTime + 0.13);
      }
      nextTime += FACTORY_STEP;
      stepIdx++;
    }
  }, SCHED_INT);

  _factoryNodes = [drone, noise, tens1, tens2, tensLfo, master];
}

export function stopMetalBgm() {
  if (_metalScheduler !== null) {
    clearInterval(_metalScheduler);
    _metalScheduler = null;
  }
  if (_factoryNodes) {
    _factoryNodes.forEach(n => { try { n.stop(); } catch(e) {} n.disconnect(); });
    _factoryNodes = null;
  }
}

let _chaosMetalScheduler = null;
let _chaosMetalNodes = null;

export function startChaosMetalBgm() {
  stopChaosMetalBgm();
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const master = ctx.createGain();
  master.gain.value = generatedBgmLevel(0.22);
  master.connect(ctx.destination);

  const droneA = ctx.createOscillator();
  const droneB = ctx.createOscillator();
  const droneG = ctx.createGain();
  const droneLp = ctx.createBiquadFilter();
  droneA.type = "sine";
  droneB.type = "triangle";
  droneA.frequency.value = 55;
  droneB.frequency.value = 82.5;
  droneLp.type = "lowpass";
  droneLp.frequency.value = 260;
  droneA.connect(droneLp); droneB.connect(droneLp); droneLp.connect(droneG); droneG.connect(master);
  droneG.gain.value = 0.085;
  droneA.start(); droneB.start();

  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.18;
  lfoG.gain.value = 0.014;
  lfo.connect(lfoG); lfoG.connect(droneG.gain);
  lfo.start();

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1900;
  bp.Q.value = 0.85;
  const noiseG = ctx.createGain();
  noiseG.gain.value = 0.018;
  noise.connect(bp); bp.connect(noiseG); noiseG.connect(master);
  noise.start();

  const tone = ctx.createOscillator();
  const toneG = ctx.createGain();
  const toneBp = ctx.createBiquadFilter();
  tone.type = "sine";
  tone.frequency.value = 330;
  toneBp.type = "bandpass";
  toneBp.frequency.value = 330;
  toneBp.Q.value = 8;
  toneG.gain.value = 0.01;
  tone.connect(toneBp); toneBp.connect(toneG); toneG.connect(master);
  tone.start();

  _chaosMetalNodes = [droneA, droneB, lfo, noise, tone, droneLp, droneG, lfoG, bp, noiseG, toneBp, toneG, master];
}

export function stopChaosMetalBgm() {
  if (_chaosMetalScheduler !== null) {
    clearInterval(_chaosMetalScheduler);
    _chaosMetalScheduler = null;
  }
  if (_chaosMetalNodes) {
    _chaosMetalNodes.forEach(n => { try { n.stop(); } catch(e) {} try { n.disconnect(); } catch(e) {} });
    _chaosMetalNodes = null;
  }
}

// ---- だだーん！（重厚な登場音）----
export function playDadaan() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  // 低音ドン×2
  [[0, 80], [0.15, 60]].forEach(([delay, freq]) => {
    const st = t + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, st);
    osc.frequency.exponentialRampToValueAtTime(30, st + 0.3);
    g.gain.setValueAtTime(0.4, st);
    g.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
    osc.start(st); osc.stop(st + 0.42);
  });
  // ノイズバースト
  const len = ctx.sampleRate * 0.2 | 0;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = 400;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.3, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  src.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
  src.start(t); src.stop(t + 0.2);
}

export function playWingFlap() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08 | 0, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const ns = ctx.createBufferSource();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  lp.type = "bandpass"; lp.frequency.value = 800; lp.Q.value = 1.5;
  ns.buffer = buf; ns.connect(lp); lp.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  ns.start(t); ns.stop(t + 0.1);
}
