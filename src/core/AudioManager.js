// Efectos de sonido sintetizados con WebAudio (sin archivos de audio).

export class AudioManager {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
  }

  /** El contexto de audio solo puede crearse tras una interacción del usuario. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  tone(type, f0, f1, dur, vol = 1, delay = 0) {
    const ctx = this.ctx;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(dur, vol = 1) {
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.buffer = buffer;
    src.connect(gain).connect(this.master);
    src.start();
  }

  play(name, vol = 1) {
    if (!this.enabled || !this.ctx || vol <= 0.02) return;
    switch (name) {
      case 'shoot': this.tone('square', 520, 180, 0.09, 0.35 * vol); break;
      case 'hit': this.noise(0.07, 0.5 * vol); break;
      case 'hurt': this.tone('sawtooth', 220, 90, 0.12, 0.5 * vol); break;
      case 'super': this.tone('sawtooth', 180, 900, 0.35, 0.5 * vol); this.tone('square', 360, 1400, 0.3, 0.25 * vol, 0.05); break;
      case 'boom': this.noise(0.35, 0.9 * vol); this.tone('sine', 140, 40, 0.3, 0.8 * vol); break;
      case 'death': this.tone('sawtooth', 320, 50, 0.45, 0.5 * vol); break;
      case 'pickup': this.tone('sine', 660, 1320, 0.15, 0.5 * vol); break;
      case 'click': this.tone('sine', 880, 660, 0.06, 0.4); break;
      case 'coin': this.tone('sine', 988, 988, 0.08, 0.4); this.tone('sine', 1319, 1319, 0.2, 0.4, 0.08); break;
      case 'error': this.tone('square', 160, 120, 0.15, 0.3); break;
      case 'ready': this.tone('sine', 523, 1046, 0.2, 0.4 * vol); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => this.tone('square', f, f, 0.18, 0.3, i * 0.12)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone('triangle', f, f, 0.22, 0.4, i * 0.16)); break;
      default: break;
    }
  }
}
