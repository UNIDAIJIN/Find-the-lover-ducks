// interaction_session.js
// Field interaction input gate for conversations, choices, shops, and short scripted waits.

export function createInteractionSession({ input, isUiActive } = {}) {
  let active = false;
  let pendingTimers = 0;
  let releaseCheck = 0;
  const trackedTimeouts = new Set();
  const trackedIntervals = new Set();
  const nativeSetTimeout = globalThis.setTimeout.bind(globalThis);

  function uiActive() {
    return typeof isUiActive === "function" && !!isUiActive();
  }

  function clearInput() {
    if (input && typeof input.clear === "function") input.clear();
  }

  function begin() {
    if (active) {
      clearInput();
      return;
    }
    active = true;
    pendingTimers = 0;
    trackedTimeouts.clear();
    trackedIntervals.clear();
    clearInput();
  }

  function end() {
    active = false;
    pendingTimers = 0;
    trackedTimeouts.clear();
    trackedIntervals.clear();
    if (releaseCheck) {
      globalThis.clearTimeout(releaseCheck);
      releaseCheck = 0;
    }
    clearInput();
  }

  function isActive() {
    return active;
  }

  function scheduleReleaseCheck() {
    if (!active || releaseCheck) return;
    releaseCheck = nativeSetTimeout(() => {
      releaseCheck = 0;
      if (!active) return;
      if (pendingTimers > 0 || uiActive()) return;
      end();
    }, 0);
  }

  function trackSync(fn) {
    if (!active || typeof fn !== "function") return typeof fn === "function" ? fn() : undefined;

    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    const originalSetInterval = globalThis.setInterval;
    const originalClearInterval = globalThis.clearInterval;

    globalThis.setTimeout = (handler, timeout, ...args) => {
      pendingTimers++;
      const id = originalSetTimeout(() => {
        if (!trackedTimeouts.delete(id)) return;
        try {
          if (typeof handler === "function") {
            return trackSync(() => handler(...args));
          }
          return originalSetTimeout(handler, 0);
        } finally {
          pendingTimers = Math.max(0, pendingTimers - 1);
          scheduleReleaseCheck();
        }
      }, timeout);
      trackedTimeouts.add(id);
      return id;
    };

    globalThis.clearTimeout = (id) => {
      if (trackedTimeouts.delete(id)) {
        pendingTimers = Math.max(0, pendingTimers - 1);
        scheduleReleaseCheck();
      }
      return originalClearTimeout(id);
    };

    globalThis.setInterval = (handler, timeout, ...args) => {
      pendingTimers++;
      const id = originalSetInterval(() => {
        if (typeof handler === "function") {
          return trackSync(() => handler(...args));
        }
        return undefined;
      }, timeout);
      trackedIntervals.add(id);
      return id;
    };

    globalThis.clearInterval = (id) => {
      if (trackedIntervals.delete(id)) {
        pendingTimers = Math.max(0, pendingTimers - 1);
        scheduleReleaseCheck();
      }
      return originalClearInterval(id);
    };

    try {
      return fn();
    } finally {
      globalThis.setTimeout = originalSetTimeout;
      globalThis.clearTimeout = originalClearTimeout;
      globalThis.setInterval = originalSetInterval;
      globalThis.clearInterval = originalClearInterval;
      scheduleReleaseCheck();
    }
  }

  function wrapCallback(fn) {
    if (!active || typeof fn !== "function") return fn;
    return (...args) => trackSync(() => fn(...args));
  }

  function blockFieldInput() {
    if (!active) return false;
    scheduleReleaseCheck();
    clearInput();
    return true;
  }

  return {
    begin,
    end,
    isActive,
    blockFieldInput,
    wrapCallback,
    trackSync,
    scheduleReleaseCheck,
  };
}
