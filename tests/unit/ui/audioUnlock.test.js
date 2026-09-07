// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createAudioContextManager } from '../../../src/audio/context.js';
import { createRenderer } from '../../../src/audio/renderer.js';
import { createSampler } from '../../../src/audio/sampler.js';
import { FakeAudioContext, fakeSampler } from '../audio/fakeAudioContext.js';

describe('US-1.2 Mobile-safe audio initialization', () => {
  it('AC-1.2.1 — The AudioContext is resumed on the first tap', async () => {
    let ctx;
    const Ctor = function () { ctx = new FakeAudioContext({ state: 'suspended' }); return ctx; };
    const audio = createAudioContextManager({ AudioContextCtor: Ctor, doc: document });
    audio.installUnlock();
    audio.get();
    expect(ctx.state).toBe('suspended');
    // first tap anywhere in the app
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.state).toBe('running');
    expect(ctx.resumeCalls).toBe(1);
    expect(audio.isUnlocked()).toBe(true);
    // playback afterwards does not need another resume, and the renderer guards anyway
    const r = createRenderer({ audio, sampler: fakeSampler(ctx) });
    await r.play({ events: [{ midi: 60, at: 0, dur: 0.3 }] });
    expect(ctx.log.some((e) => e.kind === 'note')).toBe(true);
  });

  it('AC-1.2.3 — Audio recovers after backgrounding without a reload', async () => {
    let ctx;
    const Ctor = function () { ctx = new FakeAudioContext({ state: 'suspended' }); return ctx; };
    const audio = createAudioContextManager({ AudioContextCtor: Ctor, doc: document });
    audio.installUnlock();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.state).toBe('running');
    // background: the OS suspends the context
    await ctx.suspend();
    expect(ctx.state).toBe('suspended');
    // return and tap any control → next playback works, same page, no reload
    const button = document.createElement('button'); document.body.appendChild(button);
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    const r = createRenderer({ audio, sampler: fakeSampler(ctx) });
    const before = ctx.log.length;
    await r.play({ events: [{ midi: 62, at: 0, dur: 0.3 }] });
    expect(ctx.state).toBe('running');
    expect(ctx.log.length).toBeGreaterThan(before);
    // becoming visible again also resumes
    await ctx.suspend();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r2) => setTimeout(r2, 0));
    expect(ctx.state).toBe('running');
  });

  it('AC-1.2.3 — Audio recovers after backgrounding without a reload: an interrupted context resumes like a suspended one', async () => {
    // iPadOS Safari parks a backgrounded context in the non-standard
    // 'interrupted' state rather than 'suspended'.
    let ctx;
    const Ctor = function () { ctx = new FakeAudioContext({ state: 'suspended' }); return ctx; };
    const audio = createAudioContextManager({ AudioContextCtor: Ctor, doc: document });
    audio.get();
    ctx.state = 'interrupted';
    const c = await audio.ensureRunning();
    expect(c).toBe(ctx);
    expect(ctx.state).toBe('running');
    expect(ctx.resumeCalls).toBe(1);
  });

  it('AC-1.2.3 — Audio recovers after backgrounding without a reload: a context that refuses to resume is replaced, and the sampler follows it', async () => {
    const made = [];
    const Ctor = function () { const c = new FakeAudioContext({ state: 'suspended' }); made.push(c); return c; };
    const audio = createAudioContextManager({ AudioContextCtor: Ctor, doc: document });
    const fetchImpl = async (url) => { const ab = new ArrayBuffer(8); ab.name = url; return { ok: true, arrayBuffer: async () => ab }; };
    const sampler = createSampler(audio.get, { fetchImpl });
    await sampler.load(); // decoded AudioBuffers are context-independent and survive replacement

    // A dead context: resume() resolves without ever leaving the stuck state.
    const first = made[0];
    first.state = 'interrupted';
    first.resume = async () => { first.resumeCalls++; };
    let closed = false;
    first.close = async () => { closed = true; first.state = 'closed'; };

    const c = await audio.ensureRunning();
    expect(made.length).toBe(2);
    expect(c).toBe(made[1]);
    expect(c.state).toBe('running');
    expect(closed).toBe(true);

    // The next note schedules on the replacement, never the dead context.
    sampler.noteOn(60, 0.1, 0.3);
    expect(made[1].log.some((e) => e.kind === 'start')).toBe(true);
    expect(first.log.some((e) => e.kind === 'start')).toBe(false);
  });
});
