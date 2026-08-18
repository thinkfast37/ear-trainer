#!/usr/bin/env node
/**
 * Project lint rules ESLint cannot express (Constitution VI, IX, X):
 *   1. No `:hover` anywhere in CSS — desktop presents the tablet experience.
 *   2. Bundled data files validate (tools/validate-data.mjs).
 *   3. Every directory under public/ that contains media carries a LICENSE.md.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

let failed = false;
const fail = (msg) => { console.error(`lint-extras: ${msg}`); failed = true; };

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// 1. no :hover
for (const f of walk('src').filter((f) => f.endsWith('.css'))) {
  const src = readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/:hover\b/.test(line)) fail(`${f}:${i + 1} uses :hover (Constitution VI)`);
  });
}

// 2. data validation
const v = spawnSync(process.execPath, ['tools/validate-data.mjs'], { stdio: 'inherit' });
if (v.status !== 0) fail('data validation failed (Constitution IX)');

// 3. licence beside media
const MEDIA = new Set(['.mp3', '.ogg', '.wav', '.m4a', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.svg']);
const dirs = new Set(walk('public').filter((f) => MEDIA.has(extname(f))).map((f) => f.slice(0, f.lastIndexOf('/'))));
for (const d of dirs) {
  if (!existsSync(join(d, 'LICENSE.md'))) fail(`${d} contains media but no LICENSE.md (Constitution X)`);
}

if (failed) process.exit(1);
console.log('lint-extras: OK');
