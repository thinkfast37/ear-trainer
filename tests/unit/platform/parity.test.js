import { describe, it, expect } from 'vitest';
import { FEATURES, featureParity } from '../../../src/platform/capacitor.js';
import { readFileSync } from 'node:fs';

describe('US-10.1 — parity', () => {
  it('AC-10.1.5/2 — The web build has feature parity with the packaged app excluding native-only capabilities', () => {
    const p = featureParity();
    expect(p.ok).toBe(true); expect(p.mismatched).toEqual([]);
    expect(p.nativeOnly).toEqual(['localNotifications']);
    for (const f of FEATURES) if (!f.nativeOnly) expect(f.web).toBe(f.native);
    // main.js wires the same modules on both platforms; only storage adapter and the notification plugin differ by platform
    const main = readFileSync('src/main.js', 'utf8');
    const nativeBranches = main.match(/if \(platform\.isNative\)/g) ?? [];
    expect(nativeBranches.length).toBe(1);
    expect(main).toMatch(/preferencesAdapter\(Preferences\)/); expect(main).toMatch(/LocalNotifications/);
    // no screen module checks the platform
    for (const f of ['homeMap', 'session', 'feedback', 'stats', 'levelScreen', 'reference', 'credits']) expect(readFileSync(`src/ui/${f}.js`, 'utf8')).not.toMatch(/isNative/);
  });
});
