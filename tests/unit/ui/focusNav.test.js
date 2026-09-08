// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { installFocusNav, focusableWithin, pickInDirection } from '../../../src/ui/focusNav.js';
import { backPathFor, parseHash } from '../../../src/app/router.js';

const CSS = readFileSync('src/styles.css', 'utf8');
// The "no such rule" assertions below are about rules, not prose: a comment explaining why the
// stylesheet never says `outline: none` must not read as the stylesheet saying it.
const RULES = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

let nav = null;
afterEach(() => { nav?.stop(); nav = null; });

/** A frame with a permanent top bar and a content area, as `createLayout` builds it. */
function frameWith(html, { overlay = '' } = {}) {
  document.body.innerHTML = `
    <div class="frame">
      <header class="topbar"><nav class="nav"><button data-nav="home">Home</button></nav></header>
      <main class="content" id="content">${html}${overlay}</main>
    </div>`;
  const frame = document.querySelector('.frame');
  return { frame, content: frame.querySelector('.content') };
}

/** jsdom lays nothing out, so tests that care about geometry state it themselves. */
function layOut(root, boxes) {
  for (const [selector, [x, y, w, h]] of Object.entries(boxes)) {
    const el = root.querySelector(selector);
    if (!el) throw new Error(`no element for ${selector}`);
    el.getBoundingClientRect = () => ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y });
  }
}

function install({ frame, content }, onBack = () => false) {
  nav = installFocusNav({ frame, content, onBack });
  return nav;
}

function press(key) {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  document.dispatchEvent(ev);
  return ev;
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('US-11.1 — Focus lands on the next action', () => {
  it('AC-11.1.3/1 — The first screen after load has focus on a control', () => {
    const f = frameWith('<button data-role="a">A</button><button data-role="b">B</button>');
    install(f);
    expect(document.activeElement).toBe(f.content.querySelector('[data-role="a"]'));
    expect(document.activeElement).not.toBe(document.body);
  });

  it('AC-11.1.3/1 — The first screen after load has focus on a control: a screen with nothing focusable falls back to the top bar', () => {
    const f = frameWith('<div class="card error" role="alert">Playback failed</div>');
    install(f);
    expect(document.activeElement).toBe(f.frame.querySelector('[data-nav="home"]'));
  });

  it("AC-11.1.3/2 — A re-render that removes the focused control moves focus to that screen's primary control", async () => {
    const f = frameWith('<button data-role="a">A</button>');
    install(f);
    expect(document.activeElement.dataset.role).toBe('a');
    f.content.innerHTML = '<button data-role="x">X</button><button data-autofocus data-role="next">Next</button>';
    await settle();
    expect(document.activeElement.dataset.role).toBe('next');
  });

  it("AC-11.1.3/3 — Navigating to another screen moves focus to that screen's primary control", async () => {
    const f = frameWith('<button data-role="a">A</button>');
    install(f);
    // A route change replaces the content wholesale, exactly as `replace(layout.content, …)` does.
    f.content.replaceChildren();
    f.content.append(Object.assign(document.createElement('button'), { textContent: 'Back' }));
    const start = document.createElement('button');
    start.setAttribute('data-autofocus', '');
    start.textContent = 'Start';
    f.content.append(start);
    await settle();
    expect(document.activeElement).toBe(start);
  });

  it('AC-11.1.4/1 — An opened dialog focuses its primary action', async () => {
    const f = frameWith('<button data-role="a">A</button>');
    install(f);
    f.content.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay"><div class="card"><button data-autofocus data-role="menu">Return to menu</button><button data-dismiss data-role="stay">Keep practising</button></div></div>');
    await settle();
    expect(document.activeElement.dataset.role).toBe('menu');
  });

  it('AC-11.1.4/2 — Arrow keys inside an open dialog never focus a control outside it', () => {
    const f = frameWith('<button data-role="outside">Outside</button>',
      { overlay: '<div class="modal-overlay"><div class="card"><button data-autofocus data-role="menu">Menu</button><button data-role="stay">Stay</button></div></div>' });
    layOut(f.frame, {
      '[data-nav="home"]': [300, 0, 80, 44],
      '[data-role="outside"]': [0, 100, 100, 44],
      '[data-role="menu"]': [100, 300, 120, 44],
      '[data-role="stay"]': [240, 300, 120, 44],
    });
    install(f);
    expect(document.activeElement.dataset.role).toBe('menu');
    for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowUp', 'ArrowLeft']) press(key);
    expect(document.activeElement.closest('.modal-overlay')).not.toBeNull();
    press('ArrowRight');
    expect(document.activeElement.dataset.role).toBe('stay');
    press('ArrowRight');
    expect(document.activeElement.dataset.role).toBe('stay');
  });

  it('AC-11.1.5 — Focus never moves while the learner is already using a screen', async () => {
    const f = frameWith('<button data-autofocus data-role="a">A</button><button data-role="b">B</button>');
    install(f);
    f.content.querySelector('[data-role="b"]').focus();
    f.content.insertAdjacentHTML('beforeend', '<div class="muted">Q3 · 2 correct</div>');
    await settle();
    expect(document.activeElement.dataset.role).toBe('b');
  });
});

describe('US-11.2 — Visible focus indicator', () => {
  const focusBlock = RULES.slice(RULES.indexOf('.btn:focus'));

  it('AC-11.2.1/1 — The focus indicator is drawn on plain `:focus`, not gated behind `:focus-visible`', () => {
    expect(RULES).toMatch(/\.btn:focus\b/);
    expect(RULES).not.toContain(':focus-visible');
  });

  it("AC-11.2.1/2 — The focus indicator is at least 3 px thick and offset clear of the control's edge", () => {
    const width = Number(RULES.match(/--focus-width:\s*(\d+)px/)[1]);
    const offset = Number(RULES.match(/--focus-offset:\s*(\d+)px/)[1]);
    expect(width).toBeGreaterThanOrEqual(3);
    expect(offset).toBeGreaterThan(0);
    expect(focusBlock).toMatch(/outline:\s*var\(--focus-width\)\s+solid\s+var\(--focus\)/);
    expect(focusBlock).toMatch(/outline-offset:\s*var\(--focus-offset\)/);
  });

  it('AC-11.2.1/3 — No rule anywhere removes the focus outline', () => {
    expect(RULES).not.toMatch(/outline:\s*(none|0)\b/);
  });

  it('AC-11.2.1/1 — The focus indicator is drawn on plain `:focus`, not gated behind `:focus-visible`: it reaches every kind of control', () => {
    for (const selector of ['.btn:focus', '.node:focus', 'a:focus', 'select:focus', 'input:focus', 'textarea:focus']) {
      expect(focusBlock).toContain(selector);
    }
  });

  it('AC-11.2.2 — A control that already carries an outline still shows its focus indicator', () => {
    // The selected answer and the sequence cursor mark themselves with an inset shadow, leaving
    // `outline` free for the focus ring — otherwise focusing a selected answer erased its mark.
    expect(RULES).toMatch(/\.btn\.selected\s*\{\s*box-shadow:\s*inset[^}]*var\(--accent-2\)/);
    expect(RULES).toMatch(/\.seq \.tok\.cursor\s*\{\s*box-shadow:\s*inset/);
    expect(RULES).not.toMatch(/\.btn\.selected\s*\{[^}]*outline:/);
  });
});

describe('US-11.3 — Arrow-key navigation', () => {
  /** Three answer choices per row, two rows, then a Next button beneath the grid. */
  function grid() {
    const f = frameWith(`
      <div class="grid">
        <button data-option="1">1</button><button data-option="2">2</button><button data-option="3">3</button>
        <button data-option="4">4</button><button data-option="5">5</button><button data-option="6">6</button>
      </div>
      <button data-action="end">End</button>`);
    layOut(f.frame, {
      '[data-nav="home"]': [300, 0, 80, 44],
      '[data-option="1"]': [0, 100, 90, 44], '[data-option="2"]': [100, 100, 90, 44], '[data-option="3"]': [200, 100, 90, 44],
      '[data-option="4"]': [0, 160, 90, 44], '[data-option="5"]': [100, 160, 90, 44], '[data-option="6"]': [200, 160, 90, 44],
      '[data-action="end"]': [0, 240, 120, 44],
    });
    return f;
  }
  const at = () => document.activeElement.dataset.option ?? document.activeElement.dataset.action ?? document.activeElement.dataset.nav;

  it('AC-11.3.1/1 — Right and Left move along a row of answer choices', () => {
    const f = grid();
    install(f);
    f.content.querySelector('[data-option="1"]').focus();
    press('ArrowRight'); expect(at()).toBe('2');
    press('ArrowRight'); expect(at()).toBe('3');
    press('ArrowLeft'); expect(at()).toBe('2');
  });

  it('AC-11.3.1/2 — Down and Up move between rows of the answer grid, keeping the column', () => {
    const f = grid();
    install(f);
    f.content.querySelector('[data-option="2"]').focus();
    press('ArrowDown'); expect(at()).toBe('5');
    press('ArrowUp'); expect(at()).toBe('2');
  });

  it('AC-11.3.1/3 — Arrows move out of a group of choices to the controls around it: down from the last row to the control beneath the grid', () => {
    const f = grid();
    install(f);
    f.content.querySelector('[data-option="5"]').focus();
    press('ArrowDown'); expect(at()).toBe('end');
  });

  it('AC-11.3.1/4 — An arrow with no control in that direction leaves focus where it is', () => {
    const f = grid();
    install(f);
    f.content.querySelector('[data-option="1"]').focus();
    press('ArrowLeft'); expect(at()).toBe('1');
    f.content.querySelector('[data-action="end"]').focus();
    press('ArrowDown'); expect(at()).toBe('end');
  });

  it('AC-11.3.2 — Enter activates the focused control: a control the browser does not activate itself is clicked exactly once', () => {
    const f = frameWith('<div tabindex="0" data-role="custom">Custom</div>');
    install(f);
    let clicks = 0;
    f.content.querySelector('[data-role="custom"]').addEventListener('click', () => { clicks += 1; });
    f.content.querySelector('[data-role="custom"]').focus();
    press('Enter');
    expect(clicks).toBe(1);
  });

  it('AC-11.3.2 — Enter activates the focused control: a button is left to the browser, so it never fires twice', () => {
    const f = grid();
    install(f);
    f.content.querySelector('[data-option="1"]').focus();
    // jsdom does not implement native button activation; what matters is that the navigator
    // stands back, so that in a real browser the click happens once rather than twice.
    expect(press('Enter').defaultPrevented).toBe(false);
  });

  it('AC-11.3.3 — A key the app handles does not scroll the page', () => {
    const f = grid();
    install(f);
    f.content.querySelector('[data-option="1"]').focus();
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']) {
      expect(press(key).defaultPrevented).toBe(true);
    }
    // Including when nothing moves — AC-11.3.1/4's "stays put" must not become a page scroll.
    f.content.querySelector('[data-option="1"]').focus();
    expect(press('ArrowLeft').defaultPrevented).toBe(true);
  });

  it('AC-11.3.6 — Arrow keys inside a value control still change its value', () => {
    const f = frameWith('<select data-setting="a"><option value="1">1</option><option value="2">2</option></select><button data-action="export">Export</button>');
    layOut(f.frame, {
      '[data-nav="home"]': [300, 0, 80, 44],
      '[data-setting="a"]': [0, 100, 120, 44],
      '[data-action="export"]': [140, 100, 120, 44],
    });
    install(f);
    f.content.querySelector('select').focus();
    // Up and Down belong to the select; the app must not swallow them or move focus.
    expect(press('ArrowDown').defaultPrevented).toBe(false);
    expect(document.activeElement.tagName).toBe('SELECT');
    expect(press('ArrowUp').defaultPrevented).toBe(false);
    expect(document.activeElement.tagName).toBe('SELECT');
    // Left and Right are the way out of it.
    expect(press('ArrowRight').defaultPrevented).toBe(true);
    expect(document.activeElement.dataset.action).toBe('export');
  });

  it('AC-11.3.6 — Arrow keys inside a value control still change its value: a number field keeps its own steppers', () => {
    const f = frameWith('<input type="number" data-setting="n" value="3"><button data-action="x">X</button>');
    install(f);
    f.content.querySelector('input').focus();
    expect(press('ArrowDown').defaultPrevented).toBe(false);
    expect(document.activeElement.tagName).toBe('INPUT');
  });

  it('AC-11.3.4/1 — Escape closes the mastery dialog and the session continues: the navigator clicks what the overlay marks as its dismissal', () => {
    const f = frameWith('<button data-role="a">A</button>',
      { overlay: '<div class="modal-overlay"><div class="card"><button data-autofocus>Return to menu</button><button data-dismiss data-role="stay">Keep practising</button></div></div>' });
    let dismissed = 0;
    const n = install(f, () => n.dismissTop());
    f.content.querySelector('[data-role="stay"]').addEventListener('click', () => { dismissed += 1; });
    expect(press('Escape').defaultPrevented).toBe(true);
    expect(dismissed).toBe(1);
  });

  it('AC-11.3.5/4 — Escape on the home map does nothing', () => {
    expect(backPathFor(parseHash('#/home'))).toBeNull();
    expect(backPathFor(parseHash('#/'))).toBeNull();
  });

  it("AC-11.3.5/1 — Escape in a session returns to that level's screen and ends the session: the route it goes to", () => {
    expect(backPathFor(parseHash('#/session/intervals/4'))).toBe('/level/intervals/4');
    expect(backPathFor(parseHash('#/session/intervals/4?bassFirst=1'))).toBe('/level/intervals/4');
    expect(backPathFor(parseHash('#/session/mixed'))).toBe('/home');
  });

  it('AC-11.3.5/2 — Escape on a level screen returns to the home map: the route it goes to', () => {
    expect(backPathFor(parseHash('#/level/intervals/4'))).toBe('/home');
  });

  it('AC-11.3.5/3 — Escape on the reference, stats, settings and credits screens returns to the screen that opens them', () => {
    expect(backPathFor(parseHash('#/reference/intervals/3'))).toBe('/level/intervals/3');
    expect(backPathFor(parseHash('#/credits'))).toBe('/settings');
    expect(backPathFor(parseHash('#/settings'))).toBe('/home');
    expect(backPathFor(parseHash('#/stats'))).toBe('/home');
    expect(backPathFor(parseHash('#/stats?track=intervals'))).toBe('/stats');
    expect(backPathFor(parseHash('#/stats?track=intervals&item=interval:m3:asc'))).toBe('/stats?track=intervals');
  });

  it("Back arrives as Escape, Backspace or a TV remote's GoBack — but Backspace in a text field still deletes", () => {
    const f = frameWith('<input type="text" data-role="t"><button data-role="b">B</button>');
    let backs = 0;
    install(f, () => { backs += 1; return true; });
    f.content.querySelector('[data-role="b"]').focus();
    for (const key of ['Escape', 'Backspace', 'GoBack', 'BrowserBack']) press(key);
    expect(backs).toBe(4);
    f.content.querySelector('[data-role="t"]').focus();
    expect(press('Backspace').defaultPrevented).toBe(false);
    expect(backs).toBe(4);
  });
});

describe('focusNav internals', () => {
  const box = (x, y, w = 90, h = 44) => ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h });

  it('pickInDirection prefers an aligned neighbour over a nearer diagonal one', () => {
    const origin = box(100, 100);
    const cands = [
      { el: 'below', rect: box(100, 200) },
      { el: 'diagonal', rect: box(280, 160) },
    ];
    expect(pickInDirection(origin, cands, 'ArrowDown')).toBe('below');
  });

  it('pickInDirection ignores everything not strictly forward, and returns null at an edge', () => {
    const origin = box(100, 100);
    expect(pickInDirection(origin, [{ el: 'left', rect: box(0, 100) }], 'ArrowRight')).toBeNull();
    expect(pickInDirection(origin, [{ el: 'same', rect: box(100, 100) }], 'ArrowDown')).toBeNull();
    expect(pickInDirection(origin, [], 'ArrowUp')).toBeNull();
  });

  it('pickInDirection keeps Left and Right on the row, while Down may cross to a control off to the side', () => {
    const origin = box(300, 0); // a top-bar button; the only thing further left is two rows down
    const offRow = [{ el: 'below-left', rect: box(0, 200) }];
    expect(pickInDirection(origin, offRow, 'ArrowLeft')).toBeNull();
    expect(pickInDirection(origin, offRow, 'ArrowDown')).toBe('below-left');
  });

  it('focusableWithin skips disabled and hidden controls', () => {
    const f = frameWith('<button>A</button><button disabled>B</button><input type="file" class="hidden"><div hidden><button>D</button></div>');
    expect(focusableWithin(f.content).map((e) => e.textContent)).toEqual(['A']);
  });
});
