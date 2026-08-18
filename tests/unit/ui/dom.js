/**
 * Mount helper for jsdom-based UI unit tests (tests/unit/ui/*.test.js declare
 * `// @vitest-environment jsdom`).
 */
export function mount(render, ...args) {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  document.body.appendChild(root);
  render(root, ...args);
  return root;
}

export function tap(el) {
  el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

export function text(root, selector) {
  return [...root.querySelectorAll(selector)].map((n) => n.textContent.trim());
}
