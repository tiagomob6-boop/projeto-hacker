import * as THREE from 'three';
import { dom } from './state.js';

export const AudioManager = {
  ctx: null,
  masterGain: null,
  muted: false,
  musicTimer: null,
  musicStep: 0,
  currentBpm: 96,
  alertBeepCooldown: 0,
  noiseBuffer: null,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.75;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  _createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.75, this.ctx.currentTime, 0.02);
    }
    if (dom.btnMute) {
      dom.btnMute.textContent = this.muted ? '[M] OFF' : '[M] ON';
      dom.btnMute.classList.toggle('muted', this.muted);
    }
  },

  _tone(freq, endFreq, duration, type, volume, filterFreq = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== null && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    if (filterFreq) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  },

  playKeyBeep() {
    const freq = 960 + Math.random() * 220;
    this._tone(freq, freq * 0.96, 0.045, 'square', 0.055, 2400);
  },

  playTerminalSuccess() {
    this._tone(523.25, 523.25, 0.09, 'triangle', 0.14, null, 0);
    this._tone(659.25, 659.25, 0.09, 'triangle', 0.14, null, 0.08);
    this._tone(783.99, 880.0, 0.18, 'triangle', 0.16, null, 0.16);
  },

  playTerminalError() {
    this._tone(230, 125, 0.22, 'sawtooth', 0.14, 900);
  },

  playNetHackPulse(active) {
    if (active) {
      this._tone(85, 195, 0.24, 'sine', 0.2, 600);
      this._tone(170, 340, 0.2, 'triangle', 0.08, 900);
    } else {
      this._tone(190, 75, 0.22, 'sine', 0.18, 550);
    }
  },

  playGateMechanical() {
    if (!this.ctx || this.muted) return;
    this._tone(72, 46, 0.75, 'sawtooth', 0.15, 280);
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(360, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 0.72);
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.78);
  },

  playElectricZap() {
    if (!this.ctx || this.muted) return;
    this._tone(1450, 260, 0.14, 'square', 0.11, 3200);
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.16);
  },

  updateAlertTick(dt, level) {
    if (level <= 2) {
      this.alertBeepCooldown = 0;
      return;
    }
    this.alertBeepCooldown -= dt;
    if (this.alertBeepCooldown <= 0) {
      const ratio = THREE.MathUtils.clamp(level / 100, 0, 1);
      const freq = THREE.MathUtils.lerp(520, 1080, ratio);
      this._tone(freq, freq * 1.04, 0.07, 'sine', 0.09 + ratio * 0.06);
      this.alertBeepCooldown = THREE.MathUtils.lerp(0.62, 0.15, ratio);
    }
  },

  playGameOverSiren() {
    this._tone(740, 340, 0.42, 'sawtooth', 0.16, 1400, 0);
    this._tone(700, 280, 0.48, 'sawtooth', 0.16, 1200, 0.42);
  },

  playVictoryChime() {
    this._tone(523.25, 523.25, 0.12, 'triangle', 0.15, null, 0);
    this._tone(659.25, 659.25, 0.12, 'triangle', 0.15, null, 0.1);
    this._tone(783.99, 783.99, 0.14, 'triangle', 0.15, null, 0.2);
    this._tone(1046.5, 1046.5, 0.35, 'triangle', 0.18, null, 0.32);
  },

  playTaserShot() {
    this._tone(1650, 320, 0.13, 'square', 0.11, 3600);
    this._tone(920, 440, 0.11, 'sawtooth', 0.08, 2200, 0.02);
  },

  playEmpPulse() {
    this._tone(140, 38, 0.55, 'sawtooth', 0.22, 480);
    this._tone(980, 120, 0.4, 'sine', 0.15, 1800, 0.02);
  },

  playSilencedShot() {
    this._tone(520, 140, 0.08, 'triangle', 0.11, 1400);
  },

  playRifleShot() {
    this._tone(240, 75, 0.1, 'sawtooth', 0.14, 1900);
  },

  playGuardShot() {
    this._tone(200, 65, 0.11, 'sawtooth', 0.11, 1500);
  },

  playPlayerHit() {
    this._tone(160, 55, 0.16, 'square', 0.16, 700);
  },

  playBaseAlertSiren() {
    this._tone(620, 880, 0.28, 'sawtooth', 0.16, 1500, 0);
    this._tone(880, 540, 0.32, 'sawtooth', 0.16, 1500, 0.28);
  },

  playExplosion() {
    if (!this.ctx || this.muted) return;
    this._tone(115, 26, 0.85, 'sine', 0.32, 300);
    if (!this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.85);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.92);
  },

  startMusic(bpm = 96) {
    this.stopMusic();
    this.currentBpm = bpm;
    this.musicStep = 0;
    this._scheduleMusicLoop();
  },

  setMusicTempo(bpm) {
    if (this.currentBpm === bpm && this.musicTimer) return;
    this.currentBpm = bpm;
    if (this.musicTimer) {
      this._scheduleMusicLoop();
    }
  },

  _scheduleMusicLoop() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    const stepMs = (60 / this.currentBpm / 2) * 1000;
    const bassPattern = [55.0, 55.0, 43.65, 43.65, 49.0, 49.0, 41.2, 49.0];

    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      const freq = bassPattern[this.musicStep % bassPattern.length];
      const accent = this.musicStep % 2 === 0 ? 0.068 : 0.045;
      this._tone(freq, freq, 0.19, 'sawtooth', accent, 340);
      this.musicStep = (this.musicStep + 1) % bassPattern.length;
    }, stepMs);
  },

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  },

  engineOsc: null,
  engineGain: null,

  updateEngineSound(speedAbs, isBoat = false) {
    if (!this.ctx || this.muted) {
      this.stopEngineSound();
      return;
    }
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = isBoat ? 190 : 260;
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.05;
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = isBoat ? 38 : 48;
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
    }
    const base = isBoat ? 36 : 46;
    const targetFreq = base + Math.min(speedAbs, 22) * (isBoat ? 3.2 : 4.5);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.06);
  },

  stopEngineSound() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (_) {}
      this.engineOsc = null;
      this.engineGain = null;
    }
  }
};

// ==========================================
// INICIALIZAÇÃO DA CENA THREE.JS
