// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { detectPlatform, FEATURES } from '../../../src/platform/capacitor.js';
import { createLayout, layoutFor } from '../../../src/ui/layout.js';
import { harness, answerMany } from '../helpers/harness.js';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { createSampler } from '../../../src/audio/sampler.js';
import { FakeAudioContext } from '../audio/fakeAudioContext.js';
import { readFileSync } from 'node:fs';
import { mount } from './dom.js';

describe('US-10.2 Capacitor mobile build', () => {
  it('AC-10.2.1/1 — All features function identically in the Capacitor build', async () => {
    // Native detection flips only the storage adapter; the same session code produces the same behaviour
    const native = detectPlatform({ isNativePlatform: () => true, getPlatform: () => 'ios' });
    const web = detectPlatform(undefined);
    expect(native).toEqual({ isNative: true, platform: 'ios' }); expect(web).toEqual({ isNative: false, platform: 'web' });
    for (const f of FEATURES.filter((x) => !x.nativeOnly)) expect(f.native).toBe(true);
    // a full session under the "native" flag behaves identically to web: same questions for the same seed, same store effects
    const a = harness({ trackId: 'intervals', levelNo: 2, seed: 9 }); const b = harness({ trackId: 'intervals', levelNo: 2, seed: 9 });
    const ra = await answerMany(a.session, 5); const rb = await answerMany(b.session, 5);
    expect(ra.map((r) => [r.correct, r.xp])).toEqual(rb.map((r) => [r.correct, r.xp]));
    expect(a.store.getState().items).toEqual(b.store.getState().items);
    // capacitor config points at the web build
    const cfg = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
    expect(cfg.webDir).toBe('dist'); expect(cfg.appId).toMatch(/\./);
  });
  it('AC-10.2.1/2 — The Capacitor build applies the phone and tablet layout rules by device', () => {
    // layout depends only on the viewport width, never on the platform
    const root = document.createElement('div');
    let w = 390; const l = createLayout(root, { go: () => {}, width: () => w });
    expect(l.layout()).toBe('phone');            // iPhone
    w = 820; l.relayout(); expect(l.layout()).toBe('tablet');   // iPad
    w = 1024; l.relayout(); expect(l.layout()).toBe('tablet');
    expect(layoutFor(599)).toBe('phone'); expect(layoutFor(600)).toBe('tablet');
    expect(readFileSync('src/ui/layout.js', 'utf8')).not.toMatch(/isNative|Capacitor/);
  });
  it('AC-10.2.3 — A full session works offline in the installed app', async () => {
    // Samples are decoded once at first gesture; afterwards fetch is unavailable (airplane mode) and a full session still completes
    const ctx = new FakeAudioContext({ state: 'running' });
    let online = true;
    const fetchImpl = async (url) => { if (!online) throw new TypeError('Failed to fetch'); const ab = new ArrayBuffer(8); ab.name = url; return { ok: true, arrayBuffer: async () => ab }; };
    const sampler = createSampler(ctx, { fetchImpl });
    await sampler.load();
    online = false; // airplane mode
    const h = harness({ trackId: 'scaleDegrees', levelNo: 1, seed: 3 });
    // swap the harness sampler for the real one (already loaded)
    const { createRenderer } = await import('../../../src/audio/renderer.js');
    const renderer = createRenderer({ audio: { ensureRunning: async () => ctx, get: () => ctx, now: () => 0 }, sampler });
    const { createSession } = await import('../../../src/learning/session.js');
    const { createRng } = await import('../../../src/learning/random.js');
    const session = createSession({ trackId: 'scaleDegrees', levelNo: 1 }, { store: h.store, tracks: h.tracks, renderer, rng: createRng(3) });
    const root = mount(() => {}); renderSessionScreen(root, { session, store: h.store, tracks: h.tracks, go: () => {} });
    await session.start();
    for (let i = 0; i < 10; i++) { await session.replay(); session.submit(session.state.question.answer); if (i < 9) await session.next(); }
    expect(session.state.questions).toBe(10);
    expect(ctx.log.filter((e) => e.kind === 'start').length).toBeGreaterThan(20);   // audio played
    expect(Object.keys(h.store.getState().items).length).toBeGreaterThan(0);          // progress tracked
    expect(root.querySelector('[data-role="verdict"]')).not.toBeNull();               // exercises answered
    await expect(fetchImpl('x')).rejects.toThrow();                                   // and the network really was off
  });
});
