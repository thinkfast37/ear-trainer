// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createLayout, layoutFor } from '../../../src/ui/layout.js';

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
});
