/** Tiny DOM helpers: h(tag, props, ...children), clear(), on(). */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function replace(el, ...children) { clear(el); el.append(...children.flat(Infinity).filter(Boolean)); return el; }

/** Tap = pointerdown-first activation with click fallback; the first tap anywhere unlocks audio. */
export function onTap(el, fn) {
  el.addEventListener('click', fn);
  return el;
}

/** SVG element helper. */
export function svg(tag, props = {}, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(props)) el.setAttribute(k, v);
  for (const c of children.flat()) if (c) el.append(c);
  return el;
}
