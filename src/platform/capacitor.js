/** Capacitor bindings (US-10.2): detect native, hand back the Preferences plugin, or null on the web. */
export function detectPlatform(cap = globalThis.Capacitor) {
  const isNative = Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
  return { isNative, platform: isNative ? cap.getPlatform() : 'web' };
}

/** Feature registry — the same list is true on web and native except native-only entries (AC-10.1.5/2, AC-10.2.1). */
export const FEATURES = [
  { id: 'audio', web: true, native: true }, { id: 'tracks', web: true, native: true }, { id: 'leitner', web: true, native: true },
  { id: 'mixedReview', web: true, native: true }, { id: 'stats', web: true, native: true }, { id: 'exportImport', web: true, native: true },
  { id: 'settings', web: true, native: true }, { id: 'layout', web: true, native: true }, { id: 'persistence', web: true, native: true },
  { id: 'localNotifications', web: false, native: true, nativeOnly: true },
];

export function featureParity() {
  const mismatched = FEATURES.filter((f) => f.web !== f.native && !f.nativeOnly);
  return { ok: mismatched.length === 0, mismatched, nativeOnly: FEATURES.filter((f) => f.nativeOnly).map((f) => f.id) };
}
