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

  /*
   * A context can refuse to come back — iPadOS sometimes leaves one permanently
   * 'interrupted' after backgrounding, and TV browsers can create one that a
   * resume never starts — and scheduling into a dead context is silence with no
   * error (AC-1.2.3). So a context still not running after the resume attempt is
   * closed and replaced; consumers reach the context through get()/ensureRunning()
   * rather than holding one, so they follow the replacement.
   */
  async function ensureRunning() {
    let c = get();
    if (c.state !== 'running') {
      try { await c.resume(); } catch { /* replaced below */ }
    }
    if (c.state !== 'running') {
      try { await c.close?.(); } catch { /* a dead context may refuse even close() */ }
      ctx = null;
      c = get();
      if (c.state !== 'running') {
        try { await c.resume(); } catch { /* the caller's gesture has done all it can */ }
      }
    }
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
