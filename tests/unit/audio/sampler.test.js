import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createSampler, nearestSample, playbackRateFor, SAMPLE_MIDIS, sampleFileName } from '../../../src/audio/sampler.js';
import { FakeAudioContext } from './fakeAudioContext.js';

function fakeFetch(calls = []) {
  return async (url) => { calls.push(url); const ab = new ArrayBuffer(8); ab.name = url; return { ok: true, arrayBuffer: async () => ab }; };
}

describe('US-1.1 Piano playback — sampler', () => {
  it('AC-1.1.1/1 — The nearest sample is chosen and pitch-shifted to the target note', async () => {
    const ctx = new FakeAudioContext({ state: 'running' });
    const s = createSampler(ctx, { fetchImpl: fakeFetch() });
    await s.load();
    // C2..C6 every note: nearest sample within ±1 semitone (samples every minor third), rate = 2^(Δ/12)
    for (let midi = 36; midi <= 84; midi++) {
      ctx.log.length = 0;
      s.noteOn(midi, 1, 0.5, 1);
      const start = ctx.log.find((e) => e.kind === 'start');
      const sm = nearestSample(midi);
      expect(Math.abs(sm - midi)).toBeLessThanOrEqual(1);
      expect(start.buffer.name).toContain(sampleFileName(sm));
      expect(start.rate).toBeCloseTo(playbackRateFor(midi, sm), 10);
      expect(start.rate).toBeCloseTo(2 ** ((midi - sm) / 12), 10);
    }
    expect(nearestSample(61)).toBe(60); expect(nearestSample(62)).toBe(63);
  });

  it('AC-1.1.1/3 — The bundled sample set totals at most 5 MB', () => {
    const dir = join(process.cwd(), 'public/samples');
    const files = readdirSync(dir).filter((f) => f.endsWith('.mp3'));
    expect(files.length).toBe(SAMPLE_MIDIS.length);
    for (const m of SAMPLE_MIDIS) expect(files).toContain(sampleFileName(m));
    const total = files.reduce((s, f) => s + statSync(join(dir, f)).size, 0);
    expect(total).toBeLessThanOrEqual(5 * 1024 * 1024);
    expect(readdirSync(dir)).toContain('LICENSE.md');
  });

  it('AC-1.1.2 — Adjacent pitches play without clicks, dropouts or mistuning: envelope and tuning', async () => {
    const ctx = new FakeAudioContext({ state: 'running' });
    const s = createSampler(ctx, { fetchImpl: fakeFetch() });
    await s.load();
    for (let midi = 36; midi < 84; midi++) {
      for (const m of [midi, midi + 1]) {
        ctx.log.length = 0;
        const src = s.noteOn(m, 2, 0.8, 1);
        const gainNode = src.connections[0];
        const ev = gainNode.gain.events;
        // enveloped: starts at 0, ramps up within 2 ms, holds, ramps down to 0 at the note end — no hard edges (clicks)
        expect(ev[0]).toEqual(['set', 0, 2]);
        expect(ev[1][0]).toBe('linear'); expect(ev[1][1]).toBe(1); expect(ev[1][2]).toBeCloseTo(2.002, 6);
        expect(ev[ev.length - 1]).toEqual(['linear', 0, 2.8]);
        // sustained for its full duration (no dropout): source stops only after the note end
        expect(src.stopped).toBeGreaterThanOrEqual(2.8);
        // tuned within 5 cents of equal temperament
        const sm = nearestSample(m);
        const cents = 1200 * Math.log2(src.playbackRate.value / (2 ** ((m - sm) / 12)));
        expect(Math.abs(cents)).toBeLessThan(5);
      }
    }
  });

  it('loads every sample exactly once and refuses to play before loading', async () => {
    const calls = []; const ctx = new FakeAudioContext({ state: 'running' });
    const s = createSampler(ctx, { fetchImpl: fakeFetch(calls) });
    expect(() => s.noteOn(60, 0, 1)).toThrow(/not loaded/);
    await s.load(); await s.load();
    expect(calls.length).toBe(SAMPLE_MIDIS.length); expect(s.loaded).toBe(true);
  });
});
