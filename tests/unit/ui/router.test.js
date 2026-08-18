// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { parseHash, createRouter } from '../../../src/app/router.js';

describe('router', () => {
  it('parses hashes with params', () => {
    expect(parseHash('#/level/intervals/2')).toEqual({ name: 'level', parts: ['level', 'intervals', '2'], params: {} });
    expect(parseHash('#/stats?track=intervals&item=a%3Ab')).toMatchObject({ name: 'stats', params: { track: 'intervals', item: 'a:b' } });
    expect(parseHash('').name).toBe('home');
  });
  it('routes on hashchange and go()', async () => {
    const seen = [];
    const r = createRouter(window, (route) => seen.push(route.name));
    r.start(); r.go('/settings');
    await new Promise((res) => setTimeout(res, 0));
    expect(seen).toEqual(['home', 'settings']);
    r.stop();
  });
});
