/**
 * A recording stand-in for AudioContext (D-004). Every `source.start(t)` is logged so tests
 * can assert what was scheduled and when, without a real audio device.
 */
export class FakeAudioParam {
  constructor(v = 1) { this.value = v; this.events = []; }
  setValueAtTime(v, t) { this.events.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v, t) { this.events.push(['linear', v, t]); return this; }
  exponentialRampToValueAtTime(v, t) { this.events.push(['exp', v, t]); return this; }
  cancelScheduledValues(t) { this.events.push(['cancel', t]); return this; }
}

export class FakeNode {
  constructor(ctx) { this.ctx = ctx; this.connections = []; }
  connect(n) { this.connections.push(n); return n; }
  disconnect() { this.connections = []; }
}

export class FakeGainNode extends FakeNode {
  constructor(ctx) { super(ctx); this.gain = new FakeAudioParam(1); }
}

export class FakeBufferSource extends FakeNode {
  constructor(ctx) {
    super(ctx);
    this.buffer = null;
    this.playbackRate = new FakeAudioParam(1);
    this.started = null;
    this.stopped = null;
    this.onended = null;
  }
  start(t = this.ctx.currentTime, offset = 0) {
    this.started = { at: t, offset };
    this.ctx.log.push({ kind: 'start', at: t, buffer: this.buffer, rate: this.playbackRate.value, node: this });
  }
  stop(t = this.ctx.currentTime) { this.stopped = t; this.ctx.log.push({ kind: 'stop', at: t, node: this }); }
}

export class FakeAudioBuffer {
  constructor({ sampleRate = 44100, length = 44100, name = 'buf' } = {}) {
    this.sampleRate = sampleRate; this.length = length; this.name = name; this.duration = length / sampleRate;
    this.numberOfChannels = 1;
  }
  getChannelData() { return new Float32Array(this.length); }
}

export class FakeAudioContext {
  constructor({ sampleRate = 44100, state = 'suspended', currentTime = 0 } = {}) {
    this.sampleRate = sampleRate; this.state = state; this.currentTime = currentTime;
    this.destination = new FakeNode(this);
    this.log = [];
    this.resumeCalls = 0;
    this.decodeCalls = [];
  }
  async resume() { this.resumeCalls++; this.state = 'running'; }
  async suspend() { this.state = 'suspended'; }
  createGain() { return new FakeGainNode(this); }
  createBufferSource() { return new FakeBufferSource(this); }
  async decodeAudioData(arrayBuffer) {
    this.decodeCalls.push(arrayBuffer);
    return new FakeAudioBuffer({ sampleRate: this.sampleRate, length: this.sampleRate * 2, name: arrayBuffer.name ?? 'decoded' });
  }
  advance(seconds) { this.currentTime += seconds; }
}

/** A sampler-shaped stand-in: records noteOn calls, no buffers needed. */
export function fakeSampler(ctx) {
  const notes = [];
  return {
    ctx,
    notes,
    loaded: true,
    async load() { this.loaded = true; },
    noteOn(midi, at, dur, gain = 1) { notes.push({ midi, at, dur, gain }); ctx.log.push({ kind: 'note', midi, at, dur, gain }); },
    stopAll() { notes.push({ stopAll: true }); },
  };
}
