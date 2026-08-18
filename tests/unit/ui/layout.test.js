// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createLayout, layoutFor } from '../../../src/ui/layout.js';
import { readFileSync } from 'node:fs';

describe('layout', () => {
  it('phone below 600, tablet at 600 and above (desktop = tablet)', () => {
    expect(layoutFor(375)).toBe('phone'); expect(layoutFor(599)).toBe('phone'); expect(layoutFor(600)).toBe('tablet'); expect(layoutFor(1440)).toBe('tablet');
  });
  it('renders the frame with nav and content, and relayouts', () => {
    const root = document.createElement('div');
    let w = 375;
    const l = createLayout(root, { go: () => {}, width: () => w });
    expect(root.querySelector('.frame').dataset.layout).toBe('phone');
    expect(root.querySelectorAll('nav button').length).toBe(3);
    w = 900; l.relayout();
    expect(l.layout()).toBe('tablet');
  });
  it('AC-10.1.1/2 — On a phone viewport all controls are visible and touch-friendly with no hover interactions: iOS Home-Screen web app keeps the top bar out of the status-bar dead zone', () => {
    // iOS 26 opens Home-Screen bookmarks as standalone web apps; without these metas the web view starts
    // below an opaque status bar and taps in its top ~50pt do not reach the Home/Stats/Settings buttons (T097).
    // Declaring the web-app metas extends the page under the status bar (viewport-fit=cover) so the
    // safe-area inset pushes the top bar clear; the padding guard keeps clearance where the inset is 0.
    const html = readFileSync('index.html', 'utf8');
    expect(html).toMatch(/<meta name="viewport" content="[^"]*viewport-fit=cover[^"]*"/);
    expect(html).toMatch(/<meta name="apple-mobile-web-app-capable" content="yes"/);
    expect(html).toMatch(/<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/);
    const css = readFileSync('src/styles.css', 'utf8');
    expect(css).toMatch(/\.frame\s*\{[^}]*padding:\s*max\(env\(safe-area-inset-top\),\s*\d+px\)/);
  });
});
