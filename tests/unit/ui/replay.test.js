// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderSessionScreen } from '../../../src/ui/session.js';
import { harness } from '../helpers/harness.js';
import { mount, tap } from './dom.js';

describe('US-1.3 — replay', () => {
  it('AC-1.3.3 — Replay uses identical rendering', async () => {
    const h = harness({ trackId: 'chordQualities', levelNo: 4 });
    const root = mount(() => {});
    renderSessionScreen(root, { session: h.session, store: h.store, tracks: h.tracks, go: () => {} });
    await h.session.start();
    const first = h.sampler.notes.filter((n) => n.midi).map((n) => n.midi);
    const firstRel = h.sampler.notes.filter((n) => n.midi).map((n) => n.at);
    h.sampler.notes.length = 0;
    h.ctx.advance(3.7);
    tap(root.querySelector('[data-action="replay"]'));
    await new Promise((r) => setTimeout(r, 0));
    const again = h.sampler.notes.filter((n) => n.midi);
    expect(again.map((n) => n.midi)).toEqual(first);
    // same voicing and register, same relative timing
    const rel = again.map((n) => n.at - again[0].at); const relFirst = firstRel.map((t) => t - firstRel[0]);
    expect(rel.map((x) => x.toFixed(6))).toEqual(relFirst.map((x) => x.toFixed(6)));
  });
});
