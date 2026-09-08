/**
 * D-pad and keyboard navigation (US-11.1–US-11.3, D-015).
 *
 * One installation over the whole app frame, no per-screen wiring: arrows resolve to the
 * nearest control in that direction by measuring live bounding boxes, Enter activates what is
 * focused, and Escape/Back closes what is open or goes up a screen. A MutationObserver puts
 * focus back on a control whenever a render leaves it on the page body, so "focus is never
 * lost" (AC-11.1.3) is a property of the app rather than something each renderer remembers.
 *
 * Screens opt into a starting point with a single `data-autofocus` attribute, and mark the
 * control that dismisses an overlay with `data-dismiss`. Nothing here branches on platform or
 * form factor (D-008, Constitution VI); pointer and touch paths are untouched (AC-11.3.7).
 */

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Unit vectors for the four arrows; the key set the navigator claims. */
export const ARROWS = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };

/** Keys a TV remote's Back button and a keyboard's Escape both arrive as. */
const BACK_KEYS = new Set(['Escape', 'Esc', 'Backspace', 'GoBack', 'BrowserBack']);

const VALUE_CONTROLS = new Set(['SELECT']);
const TEXTUAL_INPUTS = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);

function isTextual(el) {
  return el?.tagName === 'TEXTAREA' || (el?.tagName === 'INPUT' && TEXTUAL_INPUTS.has(el.type));
}
/** Up/Down belong to the control itself here — a select opens, a number field steps (AC-11.3.6). */
function ownsVerticalKeys(el) {
  return VALUE_CONTROLS.has(el?.tagName) || (el?.tagName === 'INPUT' && el.type === 'number');
}
/** Elements the browser already activates on Enter; pressing them ourselves would fire twice. */
function activatesItself(el) {
  return el?.tagName === 'BUTTON' || el?.tagName === 'SELECT' || el?.tagName === 'TEXTAREA'
    || (el?.tagName === 'A' && el.hasAttribute('href')) || el?.tagName === 'INPUT';
}

/**
 * Visible enough to focus. Deliberately not a geometry test: jsdom lays nothing out, and a
 * zero-sized rect there would hide every control from the unit suites.
 */
function isReachable(el) {
  if (el.hidden || el.classList.contains('hidden') || el.getAttribute('aria-hidden') === 'true') return false;
  if (el.style?.display === 'none' || el.style?.visibility === 'hidden') return false;
  return !el.closest('[hidden], .hidden, [aria-hidden="true"]');
}

/** Every control inside `root` a keyboard may land on, in document order. */
export function focusableWithin(root) {
  if (!root) return [];
  return [...root.querySelectorAll(FOCUSABLE)].filter(isReachable);
}

function metricsOf(rect) {
  return { l: rect.left, r: rect.right, t: rect.top, b: rect.bottom, cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 };
}

function overlaps(aLow, aHigh, bLow, bHigh) { return Math.min(aHigh, bHigh) - Math.max(aLow, bLow) > 0; }

/**
 * The nearest candidate in `direction` from `origin`, or null. Rects are plain
 * `{left, top, right, bottom, width, height}` so the resolver can be reasoned about — and
 * tested — without a layout engine.
 *
 * A candidate must lie strictly forward along the axis. Left and Right additionally require the
 * candidate to overlap the origin's vertical extent — they move along a row, and without that
 * rule a Left press in the top bar walks down to whatever happens to sit further left two rows
 * below, which is not what the screen looks like. Up and Down cross rows by design, so they take
 * anything forward and lean on the score instead.
 *
 * The score is the forward distance plus the sideways offset, weighted eight times heavier when
 * the candidate does not overlap the origin's extent on the other axis. That weighting is what
 * keeps a column: the grid cell directly below scores its forward distance alone, while the one
 * diagonally below pays for every pixel it is off to the side.
 */
export function pickInDirection(origin, candidates, direction) {
  const axis = ARROWS[direction];
  if (!axis || !origin) return null;
  const [ax, ay] = axis;
  const o = metricsOf(origin);
  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const m = metricsOf(c.rect);
    const dx = m.cx - o.cx;
    const dy = m.cy - o.cy;
    const forward = dx * ax + dy * ay;
    if (forward <= 1) continue;
    const sideways = Math.abs(dx * ay + dy * ax);
    const aligned = ax ? overlaps(o.t, o.b, m.t, m.b) : overlaps(o.l, o.r, m.l, m.r);
    if (ax && !aligned) continue; // horizontal movement stays on the row
    const score = forward + sideways * (aligned ? 0.5 : 8);
    if (score < bestScore) { bestScore = score; best = c; }
  }
  return best ? best.el : null;
}

/**
 * Install the navigator.
 *
 * @param {object} opts
 * @param {Element} opts.frame    the app frame — the scope arrows move within
 * @param {Element} opts.content  the screen area — where a restored focus looks first
 * @param {() => boolean} opts.onBack  handle a Back/Escape press; returns whether it did
 * @param {Document} [opts.doc]
 */
export function installFocusNav({ frame, content, onBack, doc = document }) {
  /** An open modal owns the keyboard entirely, so focus cannot leave it (AC-11.1.4/2). */
  const topOverlay = () => {
    const overlays = frame.querySelectorAll('.modal-overlay');
    return overlays.length ? overlays[overlays.length - 1] : null;
  };
  const navScope = () => topOverlay() ?? frame;
  const focusScope = () => topOverlay() ?? content;

  /** The control a screen wants pressed next, else its first control, else the way out. */
  function preferred() {
    const scope = focusScope();
    const marked = [...scope.querySelectorAll('[data-autofocus]')].find(isReachable);
    if (marked) return marked;
    const first = focusableWithin(scope)[0];
    if (first) return first;
    // A screen with nothing focusable (an error card) still leaves somewhere to press:
    // the top bar is always mounted.
    return focusableWithin(frame)[0] ?? null;
  }

  function restoreFocus() {
    const active = doc.activeElement;
    if (active && active !== doc.body && focusScope().contains(active)) return;
    preferred()?.focus();
  }

  function move(direction) {
    const scope = navScope();
    const active = doc.activeElement;
    const all = focusableWithin(scope);
    const origin = active && scope.contains(active) ? active : null;
    if (!origin) { all[0]?.focus(); return; }
    const candidates = all.filter((el) => el !== origin).map((el) => ({ el, rect: el.getBoundingClientRect() }));
    pickInDirection(origin.getBoundingClientRect(), candidates, direction)?.focus();
  }

  function onKeyDown(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const active = doc.activeElement;
    if (ARROWS[e.key]) {
      const vertical = e.key === 'ArrowUp' || e.key === 'ArrowDown';
      // A select or number field keeps its own Up/Down, and a text caret keeps Left/Right
      // (AC-11.3.6) — otherwise the desktop and tablet behaviour of every setting changes.
      if (vertical && ownsVerticalKeys(active)) return;
      if (!vertical && isTextual(active)) return;
      e.preventDefault(); // AC-11.3.3: handled either way, so the page never scrolls under us
      move(e.key);
      return;
    }
    if (e.key === 'Enter') {
      if (!active || active === doc.body || activatesItself(active)) return;
      e.preventDefault();
      active.click();
      return;
    }
    if (BACK_KEYS.has(e.key)) {
      if (e.key === 'Backspace' && isTextual(active)) return;
      e.preventDefault();
      onBack();
    }
  }

  doc.addEventListener('keydown', onKeyDown);
  const observer = new MutationObserver(restoreFocus);
  observer.observe(frame, { childList: true, subtree: true });
  restoreFocus();

  return {
    restoreFocus,
    /** Click whatever dismisses the topmost overlay or panel; true when there was one. */
    dismissTop() {
      const overlay = topOverlay();
      const targets = (overlay ?? frame).querySelectorAll('[data-dismiss]');
      const target = targets.length ? targets[targets.length - 1] : null;
      if (!target) return false;
      target.click();
      return true;
    },
    stop() { doc.removeEventListener('keydown', onKeyDown); observer.disconnect(); },
  };
}
