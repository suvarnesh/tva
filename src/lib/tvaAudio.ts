// TVA Retro CRT Procedural Audio Engine (Web Audio API)
// Synthesizes authentic 1970s mainframe and CRT monitor acoustics with ZERO downloaded assets.

class TvaAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  
  // Ambient CRT Hum nodes
  private humGain: GainNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;
  private isHumRunning: boolean = false;

  // Geiger Counter nodes
  private geigerTimer: number | null = null;
  private geigerRate: number = 0; // clicks per second

  // Listeners for mute state change
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tva_audio_muted");
        this.isMuted = saved === "true";
      } catch {
        this.isMuted = false;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public subscribe(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tva_audio_muted", String(muted));
      } catch {}
    }
    if (muted) {
      this.stopAmbientHum();
      this.stopGeiger();
    } else {
      this.startAmbientHum();
    }
    this.listeners.forEach((fn) => fn(muted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    if (!this.isMuted) {
      this.playBeep(980, 0.08);
    }
    return this.isMuted;
  }

  // Ensure AudioContext is initialized upon first user interaction
  public unlock() {
    const ctx = this.getContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    if (!this.isMuted && !this.isHumRunning) {
      this.startAmbientHum();
    }
  }

  // 1. Terminal Boot Sound: Power-up capacitor whine + 60Hz magnetic surge
  public playCrtBoot() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Power surge thump (60Hz sine dropping to 35Hz)
    const thumpOsc = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thumpOsc.type = "sine";
    thumpOsc.frequency.setValueAtTime(75, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    thumpGain.gain.setValueAtTime(0.001, now);
    thumpGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.4);

    // CRT Flyback capacitor charge-up sweep (rising from 400Hz to 11kHz whistle)
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = "sine";
    sweepOsc.frequency.setValueAtTime(350, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(9500, now + 0.55);

    sweepGain.gain.setValueAtTime(0.001, now);
    sweepGain.gain.linearRampToValueAtTime(0.06, now + 0.15);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.75);

    // High phosphor ignition pop (short bandpassed noise burst)
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3500;
    filter.Q.value = 2.0;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.08);
    noise.stop(now + 0.25);

    // Start gentle background hum after boot
    setTimeout(() => {
      if (!this.isMuted) this.startAmbientHum();
    }, 600);
  }

  // 2. Ambient CRT Hum (Subtle 60Hz and 120Hz phosphor mains frequency)
  public startAmbientHum() {
    if (this.isMuted || this.isHumRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.humGain = ctx.createGain();
      this.humGain.gain.setValueAtTime(0.0001, now);
      this.humGain.gain.linearRampToValueAtTime(0.008, now + 1.5); // Very soft, unobtrusive background

      this.humOsc1 = ctx.createOscillator();
      this.humOsc1.type = "sine";
      this.humOsc1.frequency.setValueAtTime(60, now);

      this.humOsc2 = ctx.createOscillator();
      this.humOsc2.type = "triangle";
      this.humOsc2.frequency.setValueAtTime(120, now);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 160;

      this.humOsc1.connect(filter);
      this.humOsc2.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(ctx.destination);

      this.humOsc1.start();
      this.humOsc2.start();
      this.isHumRunning = true;
    } catch {
      // AudioContext could still need user gesture
    }
  }

  public stopAmbientHum() {
    if (!this.isHumRunning) return;
    try {
      if (this.humGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.humGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      }
      setTimeout(() => {
        this.humOsc1?.stop();
        this.humOsc2?.stop();
        this.humOsc1?.disconnect();
        this.humOsc2?.disconnect();
        this.humGain?.disconnect();
        this.humOsc1 = null;
        this.humOsc2 = null;
        this.humGain = null;
        this.isHumRunning = false;
      }, 250);
    } catch {
      this.isHumRunning = false;
    }
  }

  // 3. Mechanical Teletype / Terminal Key Click
  public playTeletypeClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Fast filtered noise transient (solenoid strike)
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    // Slightly randomize pitch for realistic acoustic variety
    filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    const vol = 0.035 + Math.random() * 0.015;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.03);

    // Subtle low-frequency chassis thump
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "triangle";
    thump.frequency.setValueAtTime(160 + Math.random() * 30, now);
    thumpGain.gain.setValueAtTime(0.03, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.025);
  }

  // 4. Phosphor Terminal UI Beep
  public playBeep(freq = 980, duration = 0.07, type: OscillatorType = "sine") {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Branch Selection Two-Tone Confirm
  public playBranchSelect(variance: number = 80) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const baseFreq = variance > 90 ? 1240 : 880;
    this.playBeep(baseFreq, 0.05, "sine");
    setTimeout(() => {
      this.playBeep(baseFreq * 1.33, 0.06, "sine");
    }, 55);
  }

  // 5. Geiger Counter Temporal Anomaly Simulation
  // Dynamically ticks faster based on branch variance score!
  private playGeigerClick(volume = 0.04) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2600 + Math.random() * 800, now);
    filter.Q.setValueAtTime(4.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.01);
  }

  public setGeigerIntensity(variance: number | null) {
    if (this.isMuted || variance === null || variance <= 0) {
      this.stopGeiger();
      return;
    }

    // Variance 70% -> ~3 clicks/sec
    // Variance 85% -> ~10 clicks/sec
    // Variance 95%+ -> ~35 clicks/sec (frantic Geiger alert!)
    const targetRate = variance >= 95 ? 36 : variance >= 90 ? 22 : variance >= 80 ? 9 : 3;
    this.startGeiger(targetRate);
  }

  public startGeiger(rate: number) {
    if (this.isMuted) return;
    this.geigerRate = rate;

    if (this.geigerTimer) return;

    const scheduleNext = () => {
      if (this.geigerRate <= 0 || this.isMuted) {
        this.geigerTimer = null;
        return;
      }
      this.playGeigerClick(this.geigerRate > 20 ? 0.05 : 0.035);
      
      // Poisson jitter for natural radiation click timing
      const baseInterval = 1000 / this.geigerRate;
      const jitteredInterval = baseInterval * (0.4 + Math.random() * 1.2);
      this.geigerTimer = window.setTimeout(scheduleNext, jitteredInterval);
    };

    scheduleNext();
  }

  public stopGeiger() {
    this.geigerRate = 0;
    if (this.geigerTimer) {
      clearTimeout(this.geigerTimer);
      this.geigerTimer = null;
    }
  }

  // 6. Branch Sprout Harmonic Bloom Chime
  public playBranchBloom(index: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Harmonic chords for the 4 sprouting branches
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const freq = notes[index % notes.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }
}

// Global Singleton Export
export const tvaAudio = new TvaAudioEngine();
