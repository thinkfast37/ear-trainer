/**
 * AudioContext lifecycle (D-005, US-1.2): create lazily, resume on the first gesture anywhere,
 * resume again when the page becomes visible or before any playback.
 */
export function createAudioContextManager({ AudioContextCtor = globalThis.AudioContext ?? globalThis.webkitAudioContext, doc = globalThis.document } = {}) {
  let ctx = null;
  let unlocked = false;
  const listeners = [];

  function get() {
    if (!ctx) {
      if (!AudioContextCtor) throw new Error('Web Audio is not supported in this browser');
      ctx = new AudioContextCtor();
    }
    return ctx;
  }

  async function ensureRunning() {
    const c = get();
    if (c.state !== 'running') await c.resume();
    return c;
  }

  function installUnlock() {
    if (!doc) return;
    const events = ['pointerdown', 'touchend', 'keydown', 'click'];
    const handler = async () => {
      await ensureRunning();
      unlocked = true;
      for (const l of listeners) l(ctx);
      for (const e of events) doc.removeEventListener(e, handler, true);
    };
    for (const e of events) doc.addEventListener(e, handler, true);
    doc.addEventListener('visibilitychange', () => {
      if (doc.visibilityState === 'visible' && ctx && ctx.state !== 'running') ctx.resume();
    });
  }

  return {
    get, ensureRunning, installUnlock,
    isUnlocked: () => unlocked,
    onUnlock(fn) { listeners.push(fn); },
    now: () => (ctx ? ctx.currentTime : 0),
  };
}
