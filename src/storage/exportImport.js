/** Export/import of the Progress document (US-10.3, D-007). */
import { SCHEMA_VERSION, validateProgress, normaliseProgress } from './schema.js';

export function exportFileName(now = Date.now()) {
  const d = new Date(now); const p = (n) => String(n).padStart(2, '0');
  return `ear-trainer-progress-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export function exportProgress(doc) { return JSON.stringify(doc, null, 2); }

/** @returns {{ok:true, doc}|{ok:false, error:string}} */
export function parseImport(text) {
  let doc;
  try { doc = JSON.parse(text); } catch { return { ok: false, error: 'That file is not valid JSON.' }; }
  const errs = validateProgress(doc);
  if (errs.length) {
    const v = errs.find((e) => e.startsWith('schemaVersion'));
    if (v && v.includes('newer')) return { ok: false, error: `This file was made by a newer version (schema ${doc.schemaVersion}); this app supports up to ${SCHEMA_VERSION}.` };
    return { ok: false, error: `That file is not an Ear Trainer export (${errs[0]}).` };
  }
  return { ok: true, doc: normaliseProgress(doc) };
}

/** Merge `incoming` into `local`: newest-per-item wins; mastery ORed; xp/streak max; days union; sessions union; local settings kept. */
export function mergeProgress(local, incoming) {
  const out = structuredClone(local);
  for (const [id, it] of Object.entries(incoming.items ?? {})) {
    const cur = out.items[id];
    if (!cur || (it.lastSeen ?? 0) > (cur.lastSeen ?? 0)) out.items[id] = structuredClone(it);
  }
  for (const [key, lvl] of Object.entries(incoming.levels ?? {})) {
    const cur = out.levels[key];
    if (!cur) { out.levels[key] = structuredClone(lvl); continue; }
    cur.mastered = cur.mastered || lvl.mastered;
    cur.masteredAt = cur.masteredAt ?? lvl.masteredAt ?? null;
    const seen = new Set(cur.history.map((h) => `${h.item}|${h.at}`));
    for (const hh of lvl.history ?? []) if (!seen.has(`${hh.item}|${hh.at}`)) cur.history.push(hh);
    cur.history.sort((a, b) => a.at - b.at);
    if (cur.history.length > 200) cur.history.splice(0, cur.history.length - 200);
    for (const [sid, ss] of Object.entries(lvl.subStages ?? {})) {
      const cs = cur.subStages[sid] ?? (cur.subStages[sid] = { mastered: false, history: [] });
      cs.mastered = cs.mastered || ss.mastered;
      const sseen = new Set(cs.history.map((h) => `${h.item}|${h.at}`));
      for (const hh of ss.history ?? []) if (!sseen.has(`${hh.item}|${hh.at}`)) cs.history.push(hh);
      cs.history.sort((a, b) => a.at - b.at);
    }
  }
  out.xp = Math.max(out.xp ?? 0, incoming.xp ?? 0);
  out.streak.best = Math.max(out.streak.best ?? 0, incoming.streak?.best ?? 0);
  if ((incoming.streak?.lastCompletedDay ?? '') > (out.streak.lastCompletedDay ?? '')) out.streak = { ...out.streak, ...incoming.streak, best: out.streak.best };
  for (const [day, d] of Object.entries(incoming.days ?? {})) {
    const cur = out.days[day];
    out.days[day] = cur ? { questions: Math.max(cur.questions, d.questions), seconds: Math.max(cur.seconds, d.seconds), complete: cur.complete || d.complete } : structuredClone(d);
  }
  const ids = new Set(out.sessions.map((s) => s.id));
  for (const s of incoming.sessions ?? []) if (!ids.has(s.id)) out.sessions.push(structuredClone(s));
  out.sessions.sort((a, b) => a.startedAt - b.startedAt);
  return out;
}
