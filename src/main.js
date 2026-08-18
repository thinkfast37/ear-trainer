/**
 * Composition root. Everything the application can reach is wired here (Constitution IV).
 */
import { createAudioContextManager } from './audio/context.js';
import { createSampler } from './audio/sampler.js';
import { createRenderer } from './audio/renderer.js';
import { createStore } from './app/store.js';
import { createRouter } from './app/router.js';
import { getSettings } from './app/settings.js';
import { createStorage, localStorageAdapter, preferencesAdapter } from './storage/storage.js';
import { createRng } from './learning/random.js';
import { createSession } from './learning/session.js';
import { buildTracks } from './tracks/index.js';
import { createLayout } from './ui/layout.js';
import { renderHomeMap } from './ui/homeMap.js';
import { renderLevelScreen } from './ui/levelScreen.js';
import { renderSessionScreen } from './ui/session.js';
import { renderStats } from './ui/stats.js';
import { renderSettings } from './ui/settings.js';
import { renderCredits } from './ui/credits.js';
import { renderReference } from './ui/reference.js';
import { detectPlatform } from './platform/capacitor.js';
import { createNotifications } from './platform/notifications.js';
import { h, replace } from './ui/dom.js';

const TEST_MODE = import.meta.env.MODE === 'test';

async function boot() {
  const root = document.getElementById('app');
  const platform = detectPlatform();
  let adapter = localStorageAdapter();
  let notifPlugin = null;
  if (platform.isNative) {
    const { Preferences } = await import('@capacitor/preferences');
    adapter = preferencesAdapter(Preferences);
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    notifPlugin = LocalNotifications;
  }
  const storage = createStorage(adapter);
  const store = createStore(await storage.load(), { storage });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.flush(); });
  window.addEventListener('pagehide', () => store.flush());

  const audio = createAudioContextManager();
  const audioLog = [];
  const sampler = createSampler(audio.get(), { baseUrl: `${import.meta.env.BASE_URL}samples/` });
  const rng = createRng(TEST_MODE ? 1 : undefined);
  const tracks = buildTracks();
  const notifications = createNotifications({ plugin: notifPlugin, isNative: platform.isNative });

  const renderer = createRenderer({ audio, sampler, onSchedule: (log) => { if (TEST_MODE) audioLog.push(...log); } });
  audio.installUnlock();
  audio.onUnlock(() => sampler.load().catch((e) => showError(`Piano samples failed to load: ${e.message}`)));

  const layout = createLayout(root, { go: (p) => router.go(p) });
  window.addEventListener('resize', layout.relayout);
  window.addEventListener('orientationchange', layout.relayout);

  let session = null;
  const go = (path) => router.go(path);
  const showError = (msg) => replace(layout.content, h('div', { class: 'card error', role: 'alert' }, msg));

  function route(r) {
    if (r.name !== 'session' && session) { session.end(); session = null; }
    switch (r.name) {
      case 'home': return renderHomeMap(layout.content, { store, tracks, go, onLocked: (msg, sec) => {
        let el = sec.querySelector('[data-role="unlock-condition"]');
        if (!el) { el = h('div', { class: 'muted', 'data-role': 'unlock-condition', role: 'status' }); sec.append(el); }
        el.textContent = msg;
      } });
      case 'level': return renderLevelScreen(layout.content, { store, tracks, trackId: r.parts[1], levelNo: Number(r.parts[2]), go });
      case 'reference': return renderReference(layout.content, { tracks, trackId: r.parts[1], levelNo: Number(r.parts[2]), go });
      case 'stats': return renderStats(layout.content, { store, tracks, go, params: r.params });
      case 'settings': return renderSettings(layout.content, { store, go, notifications, isNative: platform.isNative });
      case 'credits': return renderCredits(layout.content, { go });
      case 'session': {
        const mixed = r.parts[1] === 'mixed';
        const opts = mixed ? { mixed: true } : { trackId: r.parts[1], levelNo: Number(r.parts[2]), bassFirst: r.params.bassFirst === '1' };
        session = createSession(opts, { store, tracks, renderer, rng });
        if (TEST_MODE) window.__test.session = session;
        renderSessionScreen(layout.content, { session, store, tracks, go, onEnd: () => go('/home') });
        session.start().catch((e) => showError(`Playback failed: ${e.message}`));
        return null;
      }
      default: return go('/home');
    }
  }
  const router = createRouter(window, route);
  store.subscribe(() => { const r = router.current(); if (r.name === 'home' || r.name === 'level') route(r); });

  if (TEST_MODE) {
    window.__test = {
      ready: false, audioLog, store, session: null,
      seed: (n) => rng.reseed(n),
      clock: { now: () => audio.now() },
      settings: () => getSettings(store.getState()),
      layout: () => layout.layout(),
      tracks,
      platform,
      audio,
      sampler,
    };
  }
  router.start();
  if (TEST_MODE) window.__test.ready = true;
}

boot().catch((e) => {
  const root = document.getElementById('app');
  root.textContent = `Ear Trainer could not start: ${e.message}`;
});
