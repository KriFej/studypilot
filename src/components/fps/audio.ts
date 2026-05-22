export class AudioManager {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private noise(duration: number, freq: number, decay: number, vol = 0.3) {
    const ctx = this.getCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1.5;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  private tone(freq: number, duration: number, vol = 0.2, type: OscillatorType = 'sine') {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  shootAR() {
    this.noise(0.15, 800, 0.12, 0.4);
    this.tone(120, 0.08, 0.15, 'sawtooth');
  }

  shootPistol() {
    this.noise(0.1, 1200, 0.08, 0.3);
    this.tone(200, 0.06, 0.1, 'sawtooth');
  }

  shootSniper() {
    this.noise(0.3, 400, 0.25, 0.6);
    this.tone(80, 0.2, 0.2, 'sawtooth');
  }

  impact() {
    this.noise(0.05, 2000, 0.04, 0.2);
  }

  hitmarker() {
    this.tone(1200, 0.05, 0.15, 'square');
  }

  uiHover() {
    this.tone(800, 0.05, 0.05);
  }

  uiClick() {
    this.tone(1000, 0.08, 0.1);
    this.tone(1200, 0.05, 0.08);
  }

  teleport() {
    const ctx = this.getCtx();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.tone(400 + i * 200, 0.15, 0.15), i * 60);
    }
  }

  countdown() {
    this.tone(880, 0.1, 0.2);
  }

  step() {
    this.noise(0.05, 300, 0.04, 0.08);
  }

  reload() {
    this.tone(600, 0.05, 0.1, 'square');
    setTimeout(() => this.tone(900, 0.08, 0.12, 'square'), 150);
  }

  botDeath() {
    this.noise(0.2, 500, 0.18, 0.3);
    this.tone(200, 0.15, 0.1, 'sawtooth');
  }
}
