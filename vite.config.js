import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// Every deployed build carries a legible version stamp (CLAUDE.md §6): a
// <meta name="build-version"> tag injected into index.html at build time, so
// view-source on the live site (or the Capacitor bundle) answers "which build
// is this?" without spending any screen real estate.
function buildStamp() {
  return {
    name: 'build-stamp',
    apply: 'build',
    transformIndexHtml() {
      const built = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
      let commit = 'uncommitted';
      try {
        commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      } catch {
        // not a git checkout — the timestamp alone still identifies the build
      }
      return [
        {
          tag: 'meta',
          attrs: { name: 'build-version', content: `${built} (${commit})` },
          injectTo: 'head',
        },
      ];
    },
  };
}

// Relative base so the same build runs from any static host path (GitHub Pages) and from
// inside the Capacitor WebView (D-008, AC-10.1.5).
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022', sourcemap: false },
  server: { port: 5173 },
  plugins: [buildStamp()],
});
