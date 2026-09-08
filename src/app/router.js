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

/**
 * Where a Back/Escape press goes from `route` when nothing is open (AC-11.3.5): one screen up,
 * and nowhere from the home map. Kept beside the parser because it is the routing table read
 * backwards, and pure so the whole rule is unit-testable without a DOM.
 */
export function backPathFor(route) {
  const [name, a, b] = route.parts;
  switch (name) {
    case 'level': return '/home';
    case 'session': return a && a !== 'mixed' && b ? `/level/${a}/${b}` : '/home';
    case 'reference': return a && b ? `/level/${a}/${b}` : '/home';
    case 'credits': return '/settings';
    case 'stats':
      if (route.params.item) return `/stats?track=${route.params.track ?? ''}`;
      if (route.params.track) return '/stats';
      return '/home';
    case 'settings': return '/home';
    default: return null; // home, and anything that resolves to it
  }
}
