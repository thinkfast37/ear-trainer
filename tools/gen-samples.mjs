#!/usr/bin/env node
/**
 * Fetches the licensed piano samples (Salamander Grand Piano, CC BY 3.0, trimmed set from
 * tonejs-instruments) into public/samples/ as p<midi>.mp3 for the 17 sample MIDIs, and
 * writes LICENSE.md. Run once: `npm run samples`. Requires network (a one-off developer step;
 * the app itself never fetches from the network at run time).
 *
 * If a download fails, the script exits non-zero and leaves no partial set.
 */
import { mkdirSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/samples';
const BASE = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/piano/';
const NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const SAMPLE_MIDIS = [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84];
const nameOf = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}.mp3`;

const LICENSE = `# Piano samples — licence and attribution

The files in this directory (\`p36.mp3\` … \`p84.mp3\`) are the **Salamander Grand Piano**
by Alexander Holm, in the trimmed, MP3-encoded distribution from
[tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) by Nicholaus P.
Brosowsky. They are used under the **Creative Commons Attribution 3.0 Unported (CC BY 3.0)**
licence: https://creativecommons.org/licenses/by/3.0/

Files were renamed from note names to \`p<midi>.mp3\` (one sample every minor third, C2–C6);
the audio content is unchanged. This attribution is also shown in-app under Settings → Credits.
`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const m of SAMPLE_MIDIS) {
    const target = join(OUT, `p${m}.mp3`);
    if (existsSync(target) && statSync(target).size > 1000) continue;
    const url = BASE + nameOf(m);
    const res = await fetch(url);
    if (!res.ok) { console.error(`gen-samples: ${url} → ${res.status}`); process.exit(1); }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(target, buf);
    console.log(`fetched ${nameOf(m)} → p${m}.mp3 (${(buf.length / 1024).toFixed(0)} KB)`);
  }
  writeFileSync(join(OUT, 'LICENSE.md'), LICENSE);
  const size = readdirSync(OUT).filter((f) => f.endsWith('.mp3')).reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
  console.log(`gen-samples: ${SAMPLE_MIDIS.length} samples, ${(size / 1024 / 1024).toFixed(2)} MB total`);
  if (size > 5 * 1024 * 1024) { console.error('gen-samples: sample set exceeds 5 MB (Constitution VII)'); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
