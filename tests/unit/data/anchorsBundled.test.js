import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import anchors from '../../../src/data/anchors.json';

describe('US-3.4 — data', () => {
  it('AC-3.4.5 — Anchor-song data ships as bundled static JSON', () => {
    // the file is static JSON under src/data and is imported (bundled) by the UI, never fetched
    expect(existsSync('src/data/anchors.json')).toBe(true);
    expect(() => JSON.parse(readFileSync('src/data/anchors.json', 'utf8'))).not.toThrow();
    expect(Object.keys(anchors).length).toBe(20);
    const ui = readFileSync('src/ui/anchors.js', 'utf8');
    expect(ui).toMatch(/import anchors from '\.\.\/data\/anchors\.json'/);
    expect(ui).not.toMatch(/fetch\(/);
    // no module in src/ fetches anchor data over the network
    expect(readFileSync('src/ui/reference.js', 'utf8')).not.toMatch(/fetch\(/);
  });
});
