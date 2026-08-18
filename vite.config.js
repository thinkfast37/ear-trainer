import { defineConfig } from 'vite';

// Relative base so the same build runs from any static host path (GitHub Pages) and from
// inside the Capacitor WebView (D-008, AC-10.1.5).
export default defineConfig({
  base: './',
  build: { outDir: 'dist', target: 'es2022', sourcemap: false },
  server: { port: 5173 },
});
