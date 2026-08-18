/**
 * Sample-based piano (D-002, US-1.1): 17 bundled samples every minor third from C2 to C6,
 * decoded once; each note picks the nearest sample and pitch-shifts by playbackRate; a gain
 * envelope avoids clicks.
 */
export const SAMPLE_MIDIS = [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84];
export const SAMPLE_FORMAT = 'mp3';

export function sampleFileName(midi, ext = SAMPLE_FORMAT) { return `p${midi}.${ext}`; }

/** Nearest sample MIDI to `midi`; ties go down (a slight upward shift). */
export function nearestSample(midi, samples = SAMPLE_MIDIS) {
  let best = samples[0];
  for (const s of samples) if (Math.abs(s - midi) < Math.abs(best - midi)) best = s;
  return best;
}

export function playbackRateFor(midi, sampleMidi) { return 2 ** ((midi - sampleMidi) / 12); }

const ATTACK = 0.002;
const RELEASE = 0.06;

/**
 * @param ctx AudioContext (or FakeAudioContext)
 * @param opts.baseUrl where the sample files live; opts.fetchImpl for tests
 */
export function createSampler(ctx, { baseUrl = './samples/', fetchImpl = globalThis.fetch, ext = SAMPLE_FORMAT, sampleMidis = SAMPLE_MIDIS } = {}) {
  const buffers = new Map();
  const active = new Set();
  let master = null;

  function out() {
    if (!master) { master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); }
    return master;
  }

  async function load() {
    if (buffers.size === sampleMidis.length) return;
    await Promise.all(sampleMidis.map(async (m) => {
      const res = await fetchImpl(`${baseUrl}${sampleFileName(m, ext)}`);
      if (!res.ok) throw new Error(`sample ${m} failed to load (${res.status})`);
      const ab = await res.arrayBuffer();
      buffers.set(m, await ctx.decodeAudioData(ab));
    }));
  }

  /** Schedule one note at absolute context time `at`. Returns the source node. */
  function noteOn(midi, at, dur, gain = 1) {
    const sm = nearestSample(midi, sampleMidis);
    const buf = buffers.get(sm);
    if (!buf) throw new Error('samples not loaded');
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = playbackRateFor(midi, sm);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + ATTACK);
    env.gain.setValueAtTime(gain, at + Math.max(ATTACK, dur - RELEASE));
    env.gain.linearRampToValueAtTime(0, at + dur);
    src.connect(env);
    env.connect(out());
    src.start(at);
    src.stop(at + dur + 0.05);
    active.add(src);
    src.onended = () => active.delete(src);
    return src;
  }

  function stopAll() {
    for (const s of active) { try { s.stop(ctx.currentTime); } catch { /* already stopped */ } }
    active.clear();
  }

  return {
    ctx, load, noteOn, stopAll,
    get loaded() { return buffers.size === sampleMidis.length; },
    buffers,
    sampleMidis,
  };
}
