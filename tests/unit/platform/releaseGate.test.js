import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('US-10.2 — release path', () => {
  it('AC-10.2.2 — Desktop-browser verification precedes any store release', () => {
    // The release path is a documented, ordered checklist: browser verification (the e2e suite runs the production build in a desktop
    // Chromium at tablet width) comes before Capacitor sync, device testing and store release.
    const qs = readFileSync('specs/001-ear-trainer/quickstart.md', 'utf8');
    const iBrowser = qs.indexOf('## Validation scenarios');
    const iDevice = qs.indexOf('## Manual device checklist');
    expect(iBrowser).toBeGreaterThan(-1); expect(iDevice).toBeGreaterThan(iBrowser);
    expect(qs.slice(iDevice)).toMatch(/before any store release/);
    expect(qs.slice(iDevice)).toMatch(/npx cap sync/);
    const pw = readFileSync('playwright.config.js', 'utf8');
    expect(pw).toMatch(/name: 'tablet'/); expect(pw).toMatch(/Desktop Chrome/);
    expect(pw).toMatch(/npm run build/); // e2e verifies the production build in a desktop browser
    const constitution = readFileSync('.specify/memory/constitution.md', 'utf8');
    expect(constitution).toMatch(/verified in a desktop browser before it is promoted/);
  });
});
