/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Просторовий Звук (AudioFeedback)
 *
 * Синтезує процедурні звукові ефекти (Web Audio API) для UI подій,
 * наведення, зміни стану ризику та активації Dark Matter.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useCommandStore } from '../store/useCommandStore';

class AudioFeedback {
  private ctx: AudioContext | null = null;
  private unsubscribe: (() => void) | null = null;
  private initialized = false;

  private getContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    // Створюємо аудіо контекст по першому кліку, щоб уникнути блокування бравзером
    const unlock = () => {
      if (this.ctx?.state === 'suspended') {
        this.ctx.resume();
      } else {
        this.getContext();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    // Підписка на події Store для автоматичних ефектів
    this.unsubscribe = useCommandStore.subscribe((state, prevState) => {
      if (state.threatLevel > prevState.threatLevel) {
        this.playRiskAlert(state.threatLevel);
      }
      if (state.isDarkMatter && !prevState.isDarkMatter) {
        this.playDarkMatterTransition();
      }
    });
  }

  public dispose() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
  }

  // Звук наведення на об'єкт (синтезатор частоти)
  public playHover(type: 'COMPANY' | 'PERSON' | 'RISK' | 'DEFAULT' | string = 'DEFAULT') {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Різна частота для різних типів
    let freq = 400;
    switch (type) {
      case 'COMPANY': freq = 300; break;
      case 'PERSON': freq = 500; break;
      case 'RISK': freq = 200; break;
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public playSelect() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  private playRiskAlert(level: number) {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150 * level, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50 * level, ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);

    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  }

  private playDarkMatterTransition() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(20, ctx.currentTime + 2.0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 2.0);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);

    osc.start();
    osc.stop(ctx.currentTime + 3.0);
  }
}

export const audioFeedback = new AudioFeedback();
