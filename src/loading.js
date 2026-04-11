// loading.js
// Loading screen shown before the title screen.
// Phases: 'loading' → 'ready' → 'confirm' → done (calls onDone)

export function createLoading({ BASE_W, BASE_H }) {
  let active  = false;
  let onDone  = null;

  let phase       = 'loading';
  let phaseTimer  = 0;
  let blinkTimer  = 0;
  let progress    = 0;
  let done        = false;
  let doneTimer   = 0;

  const DONE_WAIT      = 40;
  const READY_WAIT     = 90;
  const CONFIRM_FRAMES = 30;

  const CX    = BASE_W / 2 | 0;
  const TEXT_Y = 108;
  const BAR_W  = 80;
  const BAR_H  = 4;
  const BAR_X  = (BASE_W - BAR_W) / 2 | 0;
  const BAR_Y  = 124;

  // Sound
  let audioCtx    = null;
  let masterGain  = null;
  let completePlayed = false;
  let tickCounter = 0;

  function getAC() {
    if (!audioCtx) {
      audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.5;
      masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function playTick(prog) {
    try {
      const ac = getAC();
      const t   = ac.currentTime;
      // ピッ：進捗に応じて少しだけ音程が上がる
      const freq = 880 + prog * 440; // 880Hz(A5)〜1320Hz(E6)
      const osc  = ac.createOscillator(), g = ac.createGain();
      osc.connect(g); g.connect(masterGain);
      osc.type = 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03); // 30msで切る
      osc.start(t); osc.stop(t + 0.035);
    } catch (_) {}
  }

  function playComplete() {
    try {
      const ac = getAC();
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ac.createOscillator(), g = ac.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.frequency.value = freq; osc.type = 'square';
        const t = ac.currentTime + i * 0.1;
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
      });
    } catch (_) {}
  }

  function playPoink() {
    try {
      const ac = getAC();
      [0, 0.12].forEach((delay) => {
        const osc = ac.createOscillator(), g = ac.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.type = 'sine';
        const t = ac.currentTime + delay;
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.18);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.25);
      });
    } catch (_) {}
  }

  function reset() {
    phase = 'loading'; phaseTimer = 0; blinkTimer = 0;
    progress = 0; done = false; doneTimer = 0;
    completePlayed = false; tickCounter = 0;
  }

  function start(callback) {
    reset();
    active = true;
    onDone = callback;
  }

  function isActive() { return active; }

  function update() {
    if (!active) return;
    blinkTimer++;

    if (!done) {
      const wave    = Math.sin(blinkTimer * 0.04) * 0.0015;
      const stutter = Math.random() < 0.03 ? 0 : 1;
      progress += (0.012 + wave) * stutter;
      if (progress >= 1) {
        progress = 1; done = true;
        if (!completePlayed) {
          completePlayed = true;
          playComplete();
          phase = 'ready'; phaseTimer = 0;
        }
      }
      tickCounter++;
      if (tickCounter % 6 === 0 && audioCtx) playTick(progress);
    }
    if (done) doneTimer++;

    if (phase === 'loading' && done && doneTimer > DONE_WAIT) {
      if (Math.floor(blinkTimer / 20) % 2 !== 0) phase = 'ready';
    }
    if (phase === 'ready') {
      phaseTimer++;
      if (phaseTimer > READY_WAIT) { phase = 'confirm'; phaseTimer = 0; playPoink(); }
    }
    if (phase === 'confirm') {
      phaseTimer++;
      if (phaseTimer >= CONFIRM_FRAMES) { active = false; onDone && onDone(); }
    }
  }

  function draw(ctx) {
    if (!active) return;
    ctx.save();

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, BASE_W, BASE_H);

    const blinkOn = Math.floor(blinkTimer / 20) % 2 === 0;

    // テキスト
    ctx.font = '8px PixelMplus10';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    if (phase === 'loading') {
      if (blinkOn) ctx.fillText('NOW LOADING', CX, TEXT_Y);
    } else if (phase === 'ready') {
      ctx.fillText('READY?', CX, TEXT_Y);
    } else if (phase === 'confirm') {
      if (Math.floor(phaseTimer / 4) % 2 === 0) ctx.fillText('READY?', CX, TEXT_Y);
    }

    // ゲージ
    ctx.fillStyle = '#333';
    ctx.fillRect(BAR_X - 1, BAR_Y - 1, BAR_W + 2, BAR_H + 2);
    const fillW = Math.floor(BAR_W * progress);
    if (fillW > 0) {
      for (let i = 0; i < fillW; i += 3) {
        const wave = Math.sin((i / BAR_W) * Math.PI * 3 - blinkTimer * 0.04) * 20;
        const hue  = ((i / BAR_W) * 360 - blinkTimer * 1.2 + wave) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
        ctx.fillRect(BAR_X + i, BAR_Y, Math.min(3, fillW - i), BAR_H);
      }
    }

    // パーセント
    ctx.font = '8px PixelMplus10';
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.floor(progress * 100) + '%', CX, BAR_Y + BAR_H + 5);

    ctx.restore();
  }

  return { start, isActive, update, draw };
}
