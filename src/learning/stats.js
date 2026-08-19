/** Weakness dashboard data (US-9.4) and session stats (US-7.3). */
import { accuracyOf } from './leitner.js';

export function itemStats(items, prefix = null) {
  return Object.entries(items)
    .filter(([id]) => !prefix || id.startsWith(prefix))
    .map(([id, it]) => ({ id, accuracy: accuracyOf(it), attempts: it.attempts, box: it.box, correct: it.correct, confusions: it.confusions ?? {} }));
}

/** Lowest-accuracy items with at least `minAttempts`, weakest first. */
export function weakestItems(items, { minAttempts = 5, limit = 10, prefix = null } = {}) {
  return itemStats(items, prefix)
    .filter((s) => s.attempts >= minAttempts)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, limit);
}

/** Wrong answers most frequently chosen for an item, descending. */
export function confusionDetail(items, id) {
  const it = items[id];
  if (!it) return [];
  return Object.entries(it.confusions ?? {}).map(([answer, count]) => ({ answer, count })).sort((a, b) => b.count - a.count);
}

/** Per-day accuracy for a track from level histories (dated answers). */
export function accuracyTrend(progress, trackId) {
  const byDay = {};
  for (const [key, level] of Object.entries(progress.levels)) {
    if (!key.startsWith(`${trackId}:`)) continue;
    for (const h of level.history) {
      const d = new Date(h.at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const b = byDay[k] ?? (byDay[k] = { day: k, correct: 0, total: 0 });
      b.total++;
      if (h.correct) b.correct++;
    }
  }
  return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).map((b) => ({ ...b, accuracy: b.total ? b.correct / b.total : 0 }));
}

export function daysOfHistory(progress) {
  return Object.keys(progress.days).length;
}

export function sessionSummary(session) {
  const q = session.questions || 0;
  return {
    questions: q,
    correct: session.correct || 0,
    accuracy: q ? (session.correct || 0) / q : 0,
    avgReplays: q ? (session.replays || 0) / q : 0,
    seconds: Math.round(((session.endedAt ?? session.startedAt) - session.startedAt) / 1000),
  };
}
