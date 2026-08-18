// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderFeedback } from '../../../src/ui/feedback.js';
import { harness } from '../helpers/harness.js';
import { mount } from './dom.js';

describe('US-8.2 — feedback', () => {
  it('AC-8.2.3 — Named progressions show their name in feedback', async () => {
    const h = harness({ trackId: 'progressions', levelNo: 4, seed: 6 });
    await h.session.start(); let guard = 0;
    while (h.session.state.question.meta.name !== 'Andalusian cadence' && guard++ < 500) await h.session.next();
    expect(h.session.state.question.meta.name).toBe('Andalusian cadence');
    h.session.submit(h.session.state.question.answer);
    const root = mount(() => {});
    renderFeedback(root, { session: h.session, track: h.tracks.byId.progressions, settings: h.store.getState().settings, onNext: () => {} });
    expect(root.querySelector('[data-role="progression-name"]').textContent).toContain('Andalusian cadence');
    expect(root.querySelector('[data-role="correct-answer"]').textContent).toContain('i – VII – VI – V');
    // Axis too
    const h2 = harness({ trackId: 'progressions', levelNo: 2, seed: 2 });
    await h2.session.start(); guard = 0;
    while (h2.session.state.question.meta.name !== 'Axis' && guard++ < 500) await h2.session.next();
    h2.session.submit([]);
    const r2 = mount(() => {}); renderFeedback(r2, { session: h2.session, track: h2.tracks.byId.progressions, settings: h2.store.getState().settings, onNext: () => {} });
    expect(r2.querySelector('[data-role="progression-name"]').textContent).toContain('Axis');
  });
});
