/** App frame: top bar, nav, content area; sets data-layout by viewport width (D-008). */
import { h, replace } from './dom.js';

export const PHONE_MAX = 599; // px; ≥ 600 is tablet (desktop presents tablet)

export function layoutFor(width) { return width <= PHONE_MAX ? 'phone' : 'tablet'; }

export function createLayout(root, { go, width = () => globalThis.innerWidth ?? 1024 }) {
  const content = h('main', { class: 'content stack', id: 'content' });
  const frame = h('div', { class: 'frame', dataset: { layout: layoutFor(width()) } },
    h('header', { class: 'topbar' },
      h('h1', {}, 'Ear Trainer'),
      h('nav', { class: 'nav', 'aria-label': 'Main' },
        h('button', { class: 'btn ghost', 'data-nav': 'home', onClick: () => go('/home') }, 'Home'),
        h('button', { class: 'btn ghost', 'data-nav': 'stats', onClick: () => go('/stats') }, 'Stats'),
        h('button', { class: 'btn ghost', 'data-nav': 'settings', onClick: () => go('/settings') }, 'Settings'),
      ),
    ),
    content,
  );
  replace(root, frame);
  const relayout = () => { frame.dataset.layout = layoutFor(width()); };
  return { frame, content, relayout, layout: () => frame.dataset.layout };
}
