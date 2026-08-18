/** Daily goal and streak (US-9.2). Day boundary is local midnight. */
export function dayKey(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function previousDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d - 1);
  return dayKey(dt.getTime());
}

export function goalMet(day, goal) {
  return (day.questions ?? 0) >= goal.questions || (day.seconds ?? 0) >= goal.minutes * 60;
}

/**
 * Record activity for today on a draft document. Returns {justCompleted:boolean}.
 * `questions` and `seconds` are increments.
 */
export function recordActivity(draft, { questions = 0, seconds = 0 }, now, goal) {
  const key = dayKey(now);
  const day = draft.days[key] ?? (draft.days[key] = { questions: 0, seconds: 0, complete: false });
  day.questions += questions;
  day.seconds += seconds;
  let justCompleted = false;
  if (!day.complete && goalMet(day, goal)) {
    day.complete = true;
    justCompleted = true;
    const s = draft.streak;
    s.current = s.lastCompletedDay === previousDay(key) ? s.current + 1 : 1;
    s.best = Math.max(s.best ?? 0, s.current);
    s.lastCompletedDay = key;
  }
  return { justCompleted, day };
}

/** Streak as displayed: broken if yesterday and today are both incomplete. */
export function currentStreak(progress, now) {
  const s = progress.streak;
  if (!s.lastCompletedDay) return 0;
  const today = dayKey(now);
  if (s.lastCompletedDay === today || s.lastCompletedDay === previousDay(today)) return s.current;
  return 0;
}
