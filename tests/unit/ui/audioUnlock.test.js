// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createAudioContextManager } from '../../../src/audio/context.js';
import { createRenderer } from '../../../src/audio/renderer.js';
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
});
