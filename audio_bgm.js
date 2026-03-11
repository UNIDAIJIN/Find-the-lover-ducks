// audio_bgm.js
export function createBgm({
  defaultSrc = "assets/audio/bgm0.mp3",
  volume = 0.35,
  unlockEvents = ["pointerdown", "keydown", "touchstart"],
} = {}) {
  const bgm = new Audio();
  bgm.loop = true;
  bgm.volume = volume;
  bgm.preload = "auto";

  let unlocked = false;

  // エリア標準BGM / 上書きBGM
  let mapSrc = defaultSrc;
  let overrideSrc = null;

  // いま再生してるsrc（同じなら張り替えない）
  let currentSrc = null;

  function desiredSrc() {
    return overrideSrc || mapSrc;
  }

  function apply(src) {
    if (!src) return;

    // 同じsrcなら、止まってる時だけ再生を試す
    if (currentSrc === src) {
      if (unlocked && bgm.paused) bgm.play().catch(() => {});
      return;
    }

    currentSrc = src;

    try {
      bgm.pause();
      bgm.src = src;
      bgm.load();
      bgm.currentTime = 0;
      if (unlocked) bgm.play().catch(() => {});
    } catch (_e) {}
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    apply(desiredSrc());
  }

  // 最初のユーザー操作でアンロック
  (unlockEvents || []).forEach((ev) => {
    window.addEventListener(ev, unlock, { once: true });
  });

  function setMap(src) {
    mapSrc = src || mapSrc;
    overrideSrc = null;
    apply(desiredSrc());
  }

  function setOverride(src) {
    overrideSrc = src || null;
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
  };
}