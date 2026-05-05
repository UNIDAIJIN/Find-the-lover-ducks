// audio_bgm.js
export function createBgm({
  defaultSrc = "assets/audio/bgm0.mp3",
  volume = 0.35,
  unlockEvents = ["pointerdown", "keydown", "touchstart"],
} = {}) {
  const bgm = new Audio();
  bgm.loop = true;
  bgm.volume = volume;
  bgm.preload = "none";
  // -24 LUFS 揃え値を一律 0.6x（約 -28.4 LUFS 相当）にトリム
  const sourceVolumeScale = {
    "assets/audio/bgm0.mp3":         0.74,
    "assets/audio/bgm_battle.mp3":   0.74,
    "assets/audio/bgm_end.mp3":      0.71,
    "assets/audio/bgm_select.mp3":   0.77,
    "assets/audio/bgm_movie.mp3":    1.72, // 元ファイル -51.3 LUFS なのでこれでも追いつかない
    "assets/audio/duckA.mp3":        0.55, // コンプレッサで実質ラウドネス上昇するため抑え気味
    "assets/audio/duckB.mp3":        0.70,
    "assets/audio/duckC.mp3":        0.77,
    "assets/audio/duckD.mp3":        0.73,
    "assets/audio/duckE.mp3":        0.73,
    "assets/audio/duckF.mp3":        0.71,
    "assets/audio/duckG-good.mp3":   0.69,
    "assets/audio/duckG-bad.mp3":    0.73,
    "assets/audio/duckH.mp3":        0.71,
    "assets/audio/duckI.mp3":        0.71,
    "assets/audio/duckJ.mp3":        0.73,
  };

  function volumeForSrc(src) {
    const scale = sourceVolumeScale[src] ?? 1;
    return Math.min(1, volume * scale);
  }

  function applyVolumeForSrc(src) {
    bgm.volume = volumeForSrc(src);
  }

  let unlocked = false;

  const MAIN_BGM_PREFIX = "assets/audio/";
  const MAIN_BGMS = new Set([
    "assets/audio/bgm0.mp3",
    "assets/audio/duckA.mp3",
    "assets/audio/duckB.mp3",
    "assets/audio/duckC.mp3",
    "assets/audio/duckD.mp3",
    "assets/audio/duckE.mp3",
    "assets/audio/duckF.mp3",
    "assets/audio/duckG-good.mp3",
    "assets/audio/duckG-bad.mp3",
    "assets/audio/duckH.mp3",
    "assets/audio/duckI.mp3",
    "assets/audio/duckJ.mp3",
  ]);

  // エリア標準BGM / 上書きBGM
  let mapSrc = defaultSrc;
  let overrideSrc = null;
  let lastMainSrc = defaultSrc;

  // 実際にAudio要素にロード済みのsrc
  let currentSrc = null;

  function isMainBgm(src) { return MAIN_BGMS.has(src); }

  function desiredSrc() {
    return overrideSrc || mapSrc;
  }

  function apply(src) {
    if (!src) return;

    applyVolumeForSrc(src);

    // ユーザー操作前はダウンロードしない（遅延ロード）
    if (!unlocked) return;

    // WebAudio グラフが組まれていれば src 別のコンプレッサ設定を反映
    ensureAudioGraph();
    applyCompressorForSrc(src);

    // 同じsrcなら、止まってる時だけ再生を試す
    if (currentSrc === src) {
      if (bgm.paused) bgm.play().catch(() => {});
      return;
    }

    currentSrc = src;

    try {
      bgm.pause();
      bgm.muted = false; // unlock primer 由来の muted=true を念のため解除
      bgm.src = src;
      bgm.load();
      bgm.currentTime = 0;
      bgm.play().catch(() => {});
    } catch (_e) {}
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    // ジェスチャー内に呼ばれる前提で、WebAudio グラフを構築 + AudioContext を resume。
    // (compressor 経由で再生する関係で AudioContext が suspended だと無音になる)
    ensureAudioGraph();
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    // iOS Safari は about:blank の play() では <audio> 要素もアンロックされない。
    // ジェスチャー内に有効な src で 1 度ミュート再生して確実にアンロックする。
    const ds = desiredSrc();
    if (!ds || ds === "about:blank") {
      try {
        const wasMuted = bgm.muted;
        bgm.muted = true;
        bgm.src = defaultSrc;
        bgm.load();
        bgm.play().then(() => { bgm.pause(); bgm.muted = wasMuted; }).catch(() => { bgm.muted = wasMuted; });
        currentSrc = null;
      } catch (_e) {}
    }
    apply(ds);
  }

  // 最初のユーザー操作でアンロック
  (unlockEvents || []).forEach((ev) => {
    window.addEventListener(ev, unlock, { once: true });
  });

  // ---- Web Audio underwater filter & per-track compressor ----
  let audioCtx        = null;
  let filter          = null;
  let compressor      = null;
  let compressorGain  = null;

  // ダイナミックレンジが広いトラックだけ動的圧縮を効かせる
  const compressorPresets = {
    "assets/audio/duckA.mp3": {
      threshold: -24, knee: 8, ratio: 4, attack: 0.005, release: 0.12, makeup: 1.0,
    },
  };
  const COMP_BYPASS = { threshold: 0, knee: 0, ratio: 1, attack: 0.003, release: 0.25, makeup: 1.0 };

  function ensureAudioGraph() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(bgm);
      filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 20000;
      filter.Q.value = 2.0;
      compressor = audioCtx.createDynamicsCompressor();
      compressorGain = audioCtx.createGain();
      // 初期はバイパス（ratio=1, threshold=0）
      compressor.threshold.value = COMP_BYPASS.threshold;
      compressor.knee.value      = COMP_BYPASS.knee;
      compressor.ratio.value     = COMP_BYPASS.ratio;
      compressor.attack.value    = COMP_BYPASS.attack;
      compressor.release.value   = COMP_BYPASS.release;
      compressorGain.gain.value  = COMP_BYPASS.makeup;
      source.connect(filter);
      filter.connect(compressor);
      compressor.connect(compressorGain);
      compressorGain.connect(audioCtx.destination);
      return true;
    } catch (_e) { return false; }
  }

  function applyCompressorForSrc(src) {
    if (!compressor || !compressorGain || !audioCtx) return;
    const preset = compressorPresets[src] || COMP_BYPASS;
    const t = audioCtx.currentTime;
    compressor.threshold.setTargetAtTime(preset.threshold, t, 0.01);
    compressor.knee.setTargetAtTime(preset.knee,           t, 0.01);
    compressor.ratio.setTargetAtTime(preset.ratio,         t, 0.01);
    compressor.attack.setTargetAtTime(preset.attack,       t, 0.01);
    compressor.release.setTargetAtTime(preset.release,     t, 0.01);
    compressorGain.gain.setTargetAtTime(preset.makeup,     t, 0.05);
  }

  function setUnderwater(enabled) {
    if (!enabled && !audioCtx) return; // グラフ未初期化なら何もしない
    if (!ensureAudioGraph()) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const target = enabled ? 1200 : 20000;
    filter.frequency.setTargetAtTime(target, audioCtx.currentTime, 0.25);
  }

  // ---- トリップ中ピッチ揺れ ----
  let _tripTimer  = null;
  let _tripStart  = null;
  const TRIP_TOTAL = 60;
  const TRIP_RAMP  = 4;

  function startTripPitch() {
    stopTripPitch();
    _tripStart = performance.now();
    _tripTimer = setInterval(() => {
      const elapsed = (performance.now() - _tripStart) / 1000;
      if (elapsed >= TRIP_TOTAL) { stopTripPitch(); return; }
      const fadeIn  = Math.min(elapsed / TRIP_RAMP, 1);
      const fadeOut = Math.min((TRIP_TOTAL - elapsed) / TRIP_RAMP, 1);
      const ramp    = Math.min(fadeIn, fadeOut);
      const eased   = ramp * ramp * (3 - 2 * ramp);
      // ゆっくりうねる（1.0 ± 0.04）
      bgm.playbackRate = 1 + Math.sin(elapsed * 0.8) * 0.04 * eased;
    }, 50);
  }

  function stopTripPitch() {
    if (_tripTimer) { clearInterval(_tripTimer); _tripTimer = null; }
    bgm.playbackRate = 1;
  }

  // ---- グッドトリップ: ピッチ上げ＋ディレイ ----
  let _goodTripTimer = null;
  let _goodTripStart = null;
  let _delayNode     = null;
  let _delayFeedback = null;
  let _delayWet      = null;

  function ensureDelayGraph() {
    if (_delayNode) return true;
    if (!ensureAudioGraph()) return false;
    try {
      _delayNode     = audioCtx.createDelay(1.0);
      _delayFeedback = audioCtx.createGain();
      _delayWet      = audioCtx.createGain();

      _delayNode.delayTime.value = 0.28;
      _delayFeedback.gain.value  = 0;
      _delayWet.gain.value       = 0;

      // filter → delayNode → delayWet → compressor → makeupGain → destination
      filter.connect(_delayNode);
      _delayNode.connect(_delayWet);
      _delayWet.connect(compressor);
      // フィードバックループ
      _delayWet.connect(_delayFeedback);
      _delayFeedback.connect(_delayNode);
      return true;
    } catch (_e) { return false; }
  }

  function startGoodTripPitch() {
    stopGoodTripPitch();
    if (!ensureDelayGraph()) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    _goodTripStart = performance.now();

    const ATTACK_SEC   = 0.8;  // この秒数でぐいっと上げる
    const TARGET_PITCH = 1.06; // +6%

    // ディレイを即派手に立ち上げる
    const t = audioCtx.currentTime;
    _delayNode.delayTime.value = 0.38;
    _delayWet.gain.setTargetAtTime(0.70, t, 0.25);
    _delayFeedback.gain.setTargetAtTime(0.58, t, 0.25);

    _goodTripTimer = setInterval(() => {
      const elapsed = (performance.now() - _goodTripStart) / 1000;
      if (elapsed >= TRIP_TOTAL) { stopGoodTripPitch(); return; }

      let pitch;
      if (elapsed < ATTACK_SEC) {
        // ぐいっと上げる
        const r = elapsed / ATTACK_SEC;
        const e = r * r * (3 - 2 * r);
        pitch = 1 + (TARGET_PITCH - 1) * e;
      } else if (elapsed < TRIP_TOTAL - TRIP_RAMP) {
        // ホールド
        pitch = TARGET_PITCH;
      } else {
        // 終わり際だけ戻す
        const r = (TRIP_TOTAL - elapsed) / TRIP_RAMP;
        const e = r * r * (3 - 2 * r);
        pitch = 1 + (TARGET_PITCH - 1) * e;
      }
      bgm.playbackRate = pitch;
    }, 50);
  }

  function stopGoodTripPitch() {
    if (_goodTripTimer) { clearInterval(_goodTripTimer); _goodTripTimer = null; }
    bgm.playbackRate = 1;
    if (_delayWet && audioCtx) {
      const t = audioCtx.currentTime;
      _delayWet.gain.setTargetAtTime(0, t, 0.3);
      _delayFeedback.gain.setTargetAtTime(0, t, 0.3);
    }
  }

  // ---- チェンバーリバーブ ----
  let _reverbPreDelay = null;
  let _convolver      = null;
  let _reverbEq       = null;
  let _reverbWet      = null;

  function _makeImpulse(duration, decay) {
    const sr  = audioCtx.sampleRate;
    const len = (sr * duration) | 0;
    const buf = audioCtx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function ensureReverbGraph() {
    if (_convolver) return true;
    if (!ensureAudioGraph()) return false;
    try {
      _reverbPreDelay = audioCtx.createDelay(0.1);
      _reverbPreDelay.delayTime.value = 0;
      _convolver = audioCtx.createConvolver();
      _reverbEq  = audioCtx.createBiquadFilter();
      _reverbEq.frequency.value = 3000;
      _reverbEq.gain.value = 0;
      _reverbWet = audioCtx.createGain();
      _reverbWet.gain.value = 0;
      filter.connect(_reverbPreDelay);
      _reverbPreDelay.connect(_convolver);
      _convolver.connect(_reverbEq);
      _reverbEq.connect(_reverbWet);
      _reverbWet.connect(audioCtx.destination);
      return true;
    } catch (_e) { return false; }
  }

  const REVERB_PRESETS = {
    pool: {
      duration: 1.5, decay: 4.0,
      preDelay: 0,
      eqType: "highshelf", eqFreq: 3000, eqGain: 3,
      wet: 0.40,
    },
    charch: {
      duration: 4.0, decay: 1.5,
      preDelay: 0.02,
      eqType: "lowshelf", eqFreq: 400, eqGain: 4,
      wet: 0.65,
    },
  };

  function setReverb(mapId) {
    const preset = REVERB_PRESETS[mapId];
    if (!preset && !_convolver) return;
    if (!ensureReverbGraph()) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    if (!preset) {
      _reverbWet.gain.setTargetAtTime(0, t, 0.4);
      return;
    }
    _convolver.buffer = _makeImpulse(preset.duration, preset.decay);
    _reverbPreDelay.delayTime.setTargetAtTime(preset.preDelay, t, 0.05);
    _reverbEq.type            = preset.eqType;
    _reverbEq.frequency.value = preset.eqFreq;
    _reverbEq.gain.value      = preset.eqGain;
    _reverbWet.gain.setTargetAtTime(preset.wet, t, 0.4);
  }

  function setMap(src) {
    mapSrc = src || mapSrc;
    overrideSrc = null;
    if (isMainBgm(mapSrc)) lastMainSrc = mapSrc;
    apply(desiredSrc());
  }

  function setOverride(src) {
    if (src) {
      if (isMainBgm(src)) lastMainSrc = src;
      overrideSrc = src;
    } else {
      overrideSrc = null;
      mapSrc = lastMainSrc || mapSrc;
    }
    apply(desiredSrc());
  }

  return {
    audio: bgm, // DEBUG用途
    isUnlocked: () => unlocked,
    unlock,
    setMap,
    setOverride,
    getMapSrc: () => mapSrc,
    getOverrideSrc: () => overrideSrc,
    getCurrentSrc: () => currentSrc,
    getLastMainSrc: () => lastMainSrc,
    getVolumeForSrc: volumeForSrc,
    resetVolumeForCurrentSrc: () => {
      const src = currentSrc || desiredSrc();
      if (src) applyVolumeForSrc(src);
    },
    setUnderwater,
    setReverb,
    startTripPitch,
    stopTripPitch,
    startGoodTripPitch,
    stopGoodTripPitch,
  };
}
