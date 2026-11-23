import { FocusAudioTrack } from '../types/app';

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private cleanupNodes: Array<() => void> = [];
  private activeTrack: FocusAudioTrack = 'off';
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private stopCurrentNodes() {
    for (const fn of this.cleanupNodes) {
      try {
        fn();
      } catch {
        // ignore audio teardown errors
      }
    }
    this.cleanupNodes = [];
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.25, this.ctx.currentTime, 0.08);
    }
  }

  public setTrack(track: FocusAudioTrack) {
    if (track === this.activeTrack && track !== 'off') return;
    this.stopCurrentNodes();
    this.activeTrack = track;

    if (track === 'off') return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (track === 'white-noise' || track === 'rain') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (track === 'rain') {
          // Pink-tinted rain noise
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.09;
        } else {
          data[i] = white * 0.16;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = track === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = track === 'rain' ? 950 : 1800;
      filter.Q.value = track === 'rain' ? 0.65 : 0.7;

      const trackGain = ctx.createGain();
      trackGain.gain.value = track === 'rain' ? 0.85 : 0.35;

      source.connect(filter);
      filter.connect(trackGain);
      trackGain.connect(this.masterGain);
      source.start();

      this.cleanupNodes.push(() => {
        source.stop();
        source.disconnect();
        filter.disconnect();
        trackGain.disconnect();
      });
    } else if (track === 'lofi') {
      // Warm ambient Lo-Fi chord hum (Cmaj9 drone + soft low-pass)
      const freqs = [130.81, 164.81, 196.0, 246.94];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;

      const chordGain = ctx.createGain();
      chordGain.gain.value = 0.18;

      filter.connect(chordGain);
      chordGain.connect(this.masterGain);

      const oscillators = freqs.map((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.22 / freqs.length;
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        return { osc, oscGain };
      });

      this.cleanupNodes.push(() => {
        for (const item of oscillators) {
          item.osc.stop();
          item.osc.disconnect();
          item.oscGain.disconnect();
        }
        filter.disconnect();
        chordGain.disconnect();
      });
    }
  }

  public playSuccessChime() {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.38);
    });
  }

  public stopAll() {
    this.stopCurrentNodes();
    this.activeTrack = 'off';
  }
}

export const focusAudioEngine = new FocusAudioEngine();
