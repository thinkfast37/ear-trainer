import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { schedule, LOOKAHEAD } from '../../../src/audio/scheduler.js';
import { createRenderer } from '../../../src/audio/renderer.js';
import { FakeAudioContext, fakeSampler } from './fakeAudioContext.js';
import { renderOnsets } from './offlineRender.js';

const audioFor = (ctx) => ({ ensureRunning: async () => { await ctx.resume(); return ctx; }, get: () => ctx, now: () => ctx.currentTime });

describe('US-1.2 — scheduling', () => {
  it('AC-1.2.2/1 — Every note is scheduled via the Web Audio clock, never a timer', async () => {
    const ctx = new FakeAudioContext({ currentTime: 10 });
    const sampler = fakeSampler(ctx);
    const events = [{ midi: 60, at: 0, dur: 0.5 }, { midi: 64, at: 0.6, dur: 0.5 }, { midi: 67, at: 1.2, dur: 0.5 }];
    const r = createRenderer({ audio: audioFor(ctx), sampler });
    const { log } = await r.play({ events });
    // every onset is an absolute time on the context clock, derived from currentTime + offset
    expect(log.map((e) => e.at)).toEqual([10 + LOOKAHEAD, 10.6 + LOOKAHEAD, 11.2 + LOOKAHEAD].map((x) => expect.closeTo(x, 9)));
    expect(sampler.notes.filter((n) => n.midi).length).toBe(3);
    // and the audio path source contains no timers at all
    const dir = join(process.cwd(), 'src/audio');
    for (const f of readdirSync(dir)) {
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src).not.toMatch(/\bsetTimeout\s*\(/); expect(src).not.toMatch(/\bsetInterval\s*\(/);
    }
    expect(schedule(sampler, events, 5).map((e) => e.at)).toEqual([5, 5.6, 6.2].map((x) => expect.closeTo(x, 9)));
  });

  it('AC-1.2.2/2 — Note onsets are accurate within 10 ms of the scheduled time', async () => {
    const ctx = new FakeAudioContext({ currentTime: 0.123 });
    const sampler = fakeSampler(ctx);
    const events = Array.from({ length: 16 }, (_, i) => ({ midi: 60 + i, at: i * 0.2137, dur: 0.15 }));
    const r = createRenderer({ audio: audioFor(ctx), sampler });
    const { log, start } = await r.play({ events });
    const onsets = renderOnsets(log, { sampleRate: 44100 });
    expect(onsets.length).toBe(16);
    onsets.forEach((t, i) => expect(Math.abs(t - (start + events[i].at))).toBeLessThan(0.010));
  });
});
