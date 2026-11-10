export const ambientSounds = [
  { id: 'rain', name: 'Rain', mark: '☂', detail: 'A soft, steady shower' },
  { id: 'ocean', name: 'Ocean', mark: '≈', detail: 'Slow waves rolling ashore' },
  { id: 'wind', name: 'Wind', mark: '≋', detail: 'A breeze through the trees' },
  { id: 'forest', name: 'Forest', mark: '♧', detail: 'Rustling leaves and birds' },
  { id: 'river', name: 'River', mark: '∿', detail: 'A gently flowing stream' },
  { id: 'fire', name: 'Fire', mark: '♨', detail: 'Warm, crackling embers' },
] as const;

export type AmbientId = typeof ambientSounds[number]['id'];
export type AmbientMix = Record<AmbientId, { enabled: boolean; volume: number }>;

export function normalizeMix(value: unknown): AmbientMix {
  const saved = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.fromEntries(ambientSounds.map(({ id }) => {
    const entry = saved[id] as { enabled?: unknown; volume?: unknown } | null;
    return [id, {
      enabled: entry?.enabled === true,
      volume: typeof entry?.volume === 'number' && Number.isFinite(entry.volume)
        ? Math.max(0, Math.min(1, entry.volume)) : 0.35,
    }];
  })) as AmbientMix;
}

interface Voice { gain: GainNode; sources: AudioScheduledSourceNode[]; nodes: AudioNode[] }

// Original procedural soundscapes: no recordings, remote assets, or audio worklets.
// Sources loop continuously; slow modulation and gain ramps avoid abrupt edges.
export class AmbientEngine {
  private context = new AudioContext();
  private master = this.context.createGain();
  private voices = new Map<AmbientId, Voice>();
  private noise?: AudioBuffer;
  private disposed = false;
  private idleTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.master.gain.value = 0.55;
    this.master.connect(this.context.destination);
  }

  async resume() {
    if (this.disposed) return;
    clearTimeout(this.idleTimeout);
    await this.context.resume();
    if (this.context.state !== 'running') throw new Error('Audio is suspended');
  }

  private makeVoice(id: AmbientId): Voice {
    const ctx = this.context;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master);
    const voice: Voice = { gain, sources: [], nodes: [gain] };
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 12, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    const settings = {
      rain: [2300, 0.45, 0.13], ocean: [700, 0.55, 0.09], wind: [380, 0.8, 0.07],
      forest: [1700, 0.35, 0.17], river: [1250, 0.5, 0.23], fire: [650, 0.65, 0.31],
    }[id];
    filter.type = id === 'wind' ? 'bandpass' : 'lowpass';
    filter.frequency.value = settings[0];
    filter.Q.value = 0.6;
    const texture = ctx.createGain();
    texture.gain.value = settings[1];
    source.connect(filter).connect(texture).connect(gain);
    const swell = ctx.createOscillator();
    const depth = ctx.createGain();
    swell.frequency.value = settings[2];
    depth.gain.value = settings[1] * (id === 'ocean' ? 0.8 : 0.3);
    swell.connect(depth).connect(texture.gain);
    voice.sources.push(source, swell);
    voice.nodes.push(filter, texture, depth);

    if (id === 'forest') {
      const bird = ctx.createOscillator();
      bird.type = 'sine';
      bird.frequency.value = 2300;
      const birdGain = ctx.createGain();
      birdGain.gain.value = 0;
      const chirp = ctx.createOscillator();
      chirp.frequency.value = 3.4;
      const pitch = ctx.createGain();
      pitch.gain.value = 650;
      chirp.connect(pitch).connect(bird.frequency);
      // A periodic envelope leaves silence between little clusters of birdsong.
      const envelope = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
      const data = envelope.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        data[i] = t < 1.1 ? 0.035 * Math.sin(Math.PI * t / 1.1) ** 2 * Math.sin(t * 24) ** 8 : 0;
      }
      const calls = ctx.createBufferSource();
      calls.buffer = envelope;
      calls.loop = true;
      calls.connect(birdGain.gain);
      bird.connect(birdGain).connect(gain);
      voice.sources.push(bird, chirp, calls);
      voice.nodes.push(birdGain, pitch);
    }
    if (id === 'fire') {
      const crackle = ctx.createBuffer(1, ctx.sampleRate * 12, ctx.sampleRate);
      const data = crackle.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        if (Math.random() < 0.0003) {
          const length = Math.min(900, data.length - i);
          for (let j = 0; j < length; j++) data[i + j] = (Math.random() * 2 - 1) * Math.exp(-j / 100) * 0.35;
          i += length;
        }
      }
      const pops = ctx.createBufferSource();
      pops.buffer = crackle;
      pops.loop = true;
      pops.connect(gain);
      voice.sources.push(pops);
    }
    for (const node of voice.sources) node.start();
    this.voices.set(id, voice);
    return voice;
  }

  update(mix: AmbientMix, muted: boolean) {
    if (this.disposed) return;
    for (const { id } of ambientSounds) {
      const state = mix[id];
      const target = !muted && state.enabled ? state.volume : 0;
      const voice = this.voices.get(id) ?? (target > 0 ? this.makeVoice(id) : undefined);
      if (!voice) continue;
      const now = this.context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(target, now, 0.12);
    }
    // Release the rendering thread when all channels are silent. Retaining
    // voices keeps repeated toggles bounded without regenerating noise buffers.
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.55, now, 0.12);
    clearTimeout(this.idleTimeout);
    if (muted || !ambientSounds.some(({ id }) => mix[id].enabled && mix[id].volume > 0)) {
      this.idleTimeout = setTimeout(() => { void this.context.suspend().catch(() => {}); }, 1000);
    }
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.idleTimeout);
    for (const voice of this.voices.values()) {
      for (const source of voice.sources) { source.stop(); source.disconnect(); }
      for (const node of voice.nodes) node.disconnect();
    }
    this.voices.clear();
    this.master.disconnect();
    void this.context.close().catch(() => {});
  }
}
