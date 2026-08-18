/** The persisted Progress document (data-model.md). */
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'ear-trainer/progress';

export const DEFAULT_SETTINGS = Object.freeze({
  cadenceFrequency: 'everyQuestion', // everyQuestion | firstOnly | never
  replayLimit: 3,
  arpeggioTempo: 120,
  register: { low: 48, high: 72 },
  labels: { degrees: 'both', chords: 'symbolAndName', intervals: 'short' },
  sessionGoal: { minutes: 10, questions: 30 },
  notifications: { enabled: false, hour: 19 },
});

export function emptyProgress() {
  return {
    schemaVersion: SCHEMA_VERSION,
    items: {},
    levels: {},
    xp: 0,
    streak: { current: 0, best: 0, lastCompletedDay: null },
    days: {},
    sessions: [],
    settings: structuredClone(DEFAULT_SETTINGS),
  };
}

/** Structural validation. Returns [] when valid, else a list of problems. */
export function validateProgress(doc) {
  const errs = [];
  if (!doc || typeof doc !== 'object') return ['not an object'];
  if (typeof doc.schemaVersion !== 'number') errs.push('schemaVersion missing');
  else if (doc.schemaVersion > SCHEMA_VERSION) errs.push(`schemaVersion ${doc.schemaVersion} is newer than supported ${SCHEMA_VERSION}`);
  for (const k of ['items', 'levels', 'days', 'settings']) if (!doc[k] || typeof doc[k] !== 'object') errs.push(`${k} missing`);
  if (typeof doc.xp !== 'number') errs.push('xp missing');
  if (!doc.streak || typeof doc.streak !== 'object') errs.push('streak missing');
  if (!Array.isArray(doc.sessions)) errs.push('sessions missing');
  for (const [id, it] of Object.entries(doc.items ?? {})) {
    if (typeof it.box !== 'number' || it.box < 1 || it.box > 5) errs.push(`item ${id} bad box`);
  }
  return errs;
}

/** Fill in any missing defaults (forward-compatible loading of older documents). */
export function normaliseProgress(doc) {
  const base = emptyProgress();
  const out = { ...base, ...doc };
  out.settings = { ...base.settings, ...(doc.settings ?? {}) };
  out.settings.register = { ...base.settings.register, ...(doc.settings?.register ?? {}) };
  out.settings.labels = { ...base.settings.labels, ...(doc.settings?.labels ?? {}) };
  out.settings.sessionGoal = { ...base.settings.sessionGoal, ...(doc.settings?.sessionGoal ?? {}) };
  out.settings.notifications = { ...base.settings.notifications, ...(doc.settings?.notifications ?? {}) };
  out.streak = { ...base.streak, ...(doc.streak ?? {}) };
  out.schemaVersion = SCHEMA_VERSION;
  return out;
}
