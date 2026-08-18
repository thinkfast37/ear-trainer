/** Hash router: '#/home', '#/level/intervals/2', '#/session', '#/stats', '#/settings', '#/reference/intervals/3', '#/credits'. */
export function parseHash(hash) {
  const raw = (hash || '#/').replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { name: parts[0] || 'home', parts, params };
}

export function createRouter(win, onRoute) {
  const handler = () => onRoute(parseHash(win.location.hash));
  win.addEventListener('hashchange', handler);
  return {
    go(path) { if (win.location.hash === `#${path}`) handler(); else win.location.hash = path; },
    current() { return parseHash(win.location.hash); },
    start() { handler(); },
    stop() { win.removeEventListener('hashchange', handler); },
  };
}
