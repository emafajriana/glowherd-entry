// audio.js — a tiny synthesized soundscape. No audio files: a soft
// pentatonic chime when a firefly is jarred, a low pad under each
// night, a breath of noise for the wind, a papery flutter for moths.
// Everything is built from oscillators and shaped noise, and every
// call is safe before the first user gesture unlocks the context.

const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.padNodes = null;
    this.combo = 0;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (err) {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, at, dur, gain, type) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  chime() {
    this.combo = Math.min(this.combo + 1, CHIME_NOTES.length - 1);
    const base = CHIME_NOTES[this.combo];
    this.tone(base, 0, 0.5, 0.16, "sine");
    this.tone(base * 2, 0.02, 0.3, 0.05, "sine");
  }

  resetCombo() {
    this.combo = 0;
  }

  clap() {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = 0.09;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    const env = this.ctx.createGain();
    env.gain.value = 0.35;
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(t0);
    this.tone(140, 0, 0.18, 0.12, "sine");
  }

  gust() {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = 1.4;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, t0);
    filter.frequency.linearRampToValueAtTime(900, t0 + len * 0.5);
    filter.frequency.linearRampToValueAtTime(240, t0 + len);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(0.06, t0 + len * 0.4);
    env.gain.linearRampToValueAtTime(0, t0 + len);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(t0);
    src.stop(t0 + len + 0.05);
  }

  flutter() {
    for (let i = 0; i < 4; i++) this.tone(2100 + Math.random() * 600, i * 0.07, 0.05, 0.02, "triangle");
  }

  singe() {
    this.tone(1560, 0, 0.16, 0.07, "sawtooth");
    this.tone(2340, 0.03, 0.12, 0.04, "sawtooth");
  }

  startPad(nightIndex) {
    this.stopPad();
    if (!this.ctx || this.muted) return;
    try {
      const roots = [110, 98, 87.31, 82.41, 98, 87.31, 73.42];
      const root = roots[nightIndex % roots.length];
      const gains = [];
      const oscs = [];
      for (const mult of [1, 1.5, 2]) {
        const osc = this.ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = root * mult;
        osc.detune.value = Math.random() * 6 - 3;
        const gain = this.ctx.createGain();
        gain.gain.value = mult === 1 ? 0.035 : 0.016;
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        oscs.push(osc);
        gains.push(gain);
      }
      this.padNodes = { oscs, gains };
    } catch (err) {
      this.padNodes = null;
    }
  }

  stopPad() {
    if (!this.padNodes) return;
    for (const osc of this.padNodes.oscs) {
      try {
        osc.stop();
      } catch (err) {
        /* already stopped */
      }
    }
    this.padNodes = null;
  }
}
