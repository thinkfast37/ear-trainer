/**
 * The persisted Progress document (data-model.md). Schema 2 (2026-08-18, D-007/D-013): levels
 * were renumbered as presentation tiers and sub-stage state removed; a schema-1 document is
 * reset on load, keeping only settings (AC-10.3.4).
 */
export const SCHEMA_VERSION = 2;
/** The oldest schema whose learning state can still be loaded as-is. */
export const MIN_LOADABLE_SCHEMA = 2;
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
    guidance: {}, // per-track first-open guidance dismissed flags (US-4.5), e.g. { scaleDegrees: true }
  };
}

/** Structural validation. Returns [] when valid, else a list of problems. */
export function validateProgress(doc) {
  const errs = [];
  if (!doc || typeof doc !== 'object') return ['not an object'];
  if (typeof doc.schemaVersion !== 'number') errs.push('schemaVersion missing');
  else if (doc.schemaVersion > SCHEMA_VERSION) errs.push(`schemaVersion ${doc.schemaVersion} is newer than supported ${SCHEMA_VERSION}`);
  else if (doc.schemaVersion < MIN_LOADABLE_SCHEMA) errs.push(`schemaVersion ${doc.schemaVersion} is older than the level restructure (needs ${MIN_LOADABLE_SCHEMA})`);
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
  out.guidance = { ...base.guidance, ...(doc.guidance ?? {}) };
  out.schemaVersion = SCHEMA_VERSION;
  return out;
}

/** Whether a stored document predates the restructure and must be reset rather than loaded (AC-10.3.4/1). */
export function needsReset(doc) {
  return Boolean(doc && typeof doc === 'object') && !(typeof doc.schemaVersion === 'number' && doc.schemaVersion >= MIN_LOADABLE_SCHEMA);
}

/** A fresh document carrying only the old document's settings (AC-10.3.4/1). */
export function resetProgress(oldDoc) {
  const fresh = emptyProgress();
  const settings = oldDoc?.settings && typeof oldDoc.settings === 'object' ? oldDoc.settings : {};
  return normaliseProgress({ ...fresh, settings });
}

