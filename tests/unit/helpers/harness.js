/** Shared unit harness: real store/tracks/session/renderer over a FakeAudioContext. */
import { createStore } from '../../../src/app/store.js';
import { emptyProgress } from '../../../src/storage/schema.js';
import { createRenderer } from '../../../src/audio/renderer.js';
import { createSession } from '../../../src/learning/session.js';
import { buildTracks } from '../../../src/tracks/index.js';
import { createRng } from '../../../src/learning/random.js';
import { FakeAudioContext, fakeSampler } from '../audio/fakeAudioContext.js';

export function harness({ trackId = 'intervals', levelNo = 1, progress = emptyProgress(), seed = 7, mixed = false, bassFirst = false, now = null } = {}) {
  const ctx = new FakeAudioContext({ state: 'running' });
  const sampler = fakeSampler(ctx);
  const audio = { ensureRunning: async () => ctx, get: () => ctx, now: () => ctx.currentTime };
  const renderer = createRenderer({ audio, sampler });
  const store = createStore(progress);
  const tracks = buildTracks();
  let t = 1_700_000_000_000;
  const clock = now ?? (() => (t += 1000));
  const rng = createRng(seed);
  const session = createSession({ trackId, levelNo, mixed, bassFirst }, { store, tracks, renderer, rng, now: clock });
  return { ctx, sampler, renderer, store, tracks, session, rng, clock, newSession: (opts) => createSession({ trackId, levelNo, mixed, bassFirst, ...opts }, { store, tracks, renderer, rng, now: clock }) };
}

/** Answer n questions; `pick(q, i)` returns the answer (default: correct). */
export async function answerMany(session, n, pick = (q) => q.answer) {
  const results = [];
  if (session.state.phase === 'idle') await session.start();
  for (let i = 0; i < n; i++) {
    const q = session.state.question;
    results.push(session.submit(pick(q, i)));
    if (i < n - 1) await session.next();
  }
  return results;
}

/** A progress document in which every item of a track level sits in `box`, with `history` correct answers. */
export function masteredProgress(tracks, entries, { box = 5 } = {}) {
  const p = emptyProgress();
  for (const { trackId, levelNo } of entries) {
    const t = tracks.byId[trackId];
    const subs = t.def.subStages.length ? t.def.subStages : [null];
    const key = `${trackId}:${levelNo}`;
    p.levels[key] = { mastered: true, masteredAt: 1, subStage: subs[subs.length - 1], subStages: {}, history: [] };
    for (const s of subs) {
      const ids = t.itemsFor(levelNo, s ?? undefined);
      for (const id of ids) p.items[id] = { box, attempts: 10, correct: 9, lastSeen: 1, confusions: {} };
      const hist = Array.from({ length: 20 }, (_, i) => ({ item: ids[i % ids.length], correct: true, at: 1000 + i, replays: 0, score: 1 }));
      if (s) p.levels[key].subStages[s] = { mastered: true, history: hist }; else p.levels[key].history = hist;
    }
  }
  return p;
}

/** Answer correctly until the current sub-stage (or level) masters; returns the answer count. */
export async function answerUntilMastered(session, max = 80) {
  if (session.state.phase === 'idle') await session.start();
  for (let i = 1; i <= max; i++) {
    const r = session.submit(session.state.question.answer);
    if (r.subMastered || r.levelMastered) return i;
    await session.next();
  }
  throw new Error(`not mastered after ${max} answers`);
}
