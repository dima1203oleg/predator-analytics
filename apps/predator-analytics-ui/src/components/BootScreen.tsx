/**
 * BootScreen — "ЯДРО NEXUS v56.1.4" (SOVEREIGN NEXUS CORE — PREMIUM)
 * Кінематографічна заставка з:
 * - Суворою військовою/розвідувальною естетикою
 * - Глобальним скануванням та ініціалізацією
 * - Web Audio API звуковими ефектами
 * - Преміальними ефектами глибини та атмосфери
 * - Жодних "святкових" частинок, лише строгі глітчі та графіки
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeometricRaptor } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 0 | 1 | 2 | 3 | 4;
// 0: ВСТАНОВЛЕННЯ ЗАХИЩЕНОГО З'ЄДНАННЯ (Грід + геометрія)
// 1: ПЕРЕХОПЛЕННЯ СУПУТНИКОВИХ ПОТОКІВ (Координати + сканування)
// 2: АВТОРИЗАЦІЯ УРЯДОВОГО РІВНЯ (Строгий червоний/суворий стиль)
// 3: RAPTOR REVEAL (Обертання + фіксація)
// 4: СИСТЕМА ГОТОВА (fade out)

const PHASE_DURATIONS: Record<Phase, number> = {
  0: 1600, // ВСТАНОВЛЕННЯ З'ЄДНАННЯ
  1: 2200, // ГЛОБАЛЬНЕ СКАНУВАННЯ
  2: 1400, // АВТОРИЗАЦІЯ
  3: 4500, // REVEAL
  4: 1000,
};

/* ─── Web Audio — синтезовані звуки без зовнішніх файлів ─── */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  /** Низький гул ядра (глухий резонанс) */
  playCoreDrone() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(32, ctx.currentTime); // Дуже низька частота
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 2);
    
    filter.type = 'lowpass';
    filter.frequency.value = 80;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3);
  }

  /** Жорсткий скан (radar ping) */
  playRadarPing() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  /** Глибокий удар при появі лого */
  playImpact() {
    const ctx = this.getCtx();
    if (!ctx) return;
    
    // Sub bass
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.6);
    g1.gain.setValueAtTime(0.4, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.9);

    // Металевий відзвук (sawtooth)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(150, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
    g2.gain.setValueAtTime(0.15, ctx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.5);

    // Звук перешкод (noise)
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  }

  /** Короткий телеметричний писк (Premium feel) */
  playTelemetry(freq = 1200) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'square';
    osc1.frequency.value = freq;
    
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.5;
    
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.1);
  }

  startCoinSpin(): (() => void) | null {
    const ctx = this.getCtx();
    if (!ctx) return null;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Суворий низькочастотний гул обертання
    osc.type = 'sawtooth';
    osc.frequency.value = 65;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);

    osc.start();

    return () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        osc.stop();
      }, 350);
    };
  }
}

const soundEngine = new SoundEngine();

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>(0);
  const phaseStartTimeMs = useRef(Date.now());
  const skipRef = useRef(false);
  const coinSpinStopRef = useRef<(() => void) | null>(null);

  const [interceptCount, setInterceptCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [hexCodes, setHexCodes] = useState<string[]>([]);

  /* ─ HUD Лічильники та Телеметрія ─ */
  useEffect(() => {
    const iInterval = setInterval(() => {
      setInterceptCount((p) => p + Math.floor(Math.random() * 8500));
      if (phase === 1 || phase === 2) soundEngine.playTelemetry(1000 + Math.random() * 500);
    }, 80);
    const sInterval = setInterval(() => {
      setScanProgress((p) => Math.min(100, p + Math.random() * 3));
    }, 40);
    const hInterval = setInterval(() => {
      setHexCodes(prev => {
        const newCode = `0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase().padStart(6, '0')}`;
        return [newCode, ...prev].slice(0, 8);
      });
    }, 100);

    return () => {
      clearInterval(iInterval);
      clearInterval(sInterval);
      clearInterval(hInterval);
    };
  }, [phase]);

  /* ─ Звуки при переході фаз ─ */
  useEffect(() => {
    if (phase === 0) soundEngine.playCoreDrone();
    if (phase === 1) soundEngine.playRadarPing();
    if (phase === 2) soundEngine.playRadarPing();
    if (phase === 3) {
      soundEngine.playImpact();
      const stopSpin = soundEngine.startCoinSpin();
      coinSpinStopRef.current = stopSpin;
    }
    if (phase === 4) {
      coinSpinStopRef.current?.();
      soundEngine.playTelemetry(600);
    }
  }, [phase]);

  /* ─ Рендер Canvas (Строгий військовий стиль) ─ */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const now = Date.now();
    const elapsed = now - phaseStartTimeMs.current;
    const currentPhase = skipRef.current ? 4 : phase;

    // Очищення з ефектом motion blur (затемнення)
    ctx.fillStyle = 'rgba(1, 4, 9, 0.45)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Глибока атмосферна підсвітка по центру (subtle dark crimson)
    if (currentPhase <= 3) {
      const atmGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5);
      atmGrad.addColorStop(0, 'rgba(120, 10, 10, 0.04)');
      atmGrad.addColorStop(0.5, 'rgba(30, 5, 5, 0.02)');
      atmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = atmGrad;
      ctx.fillRect(0, 0, w, h);
    }

    /* DIGITAL RAIN ФОН — Чіткі лінії і координатна сітка */
    if (currentPhase <= 2) {
      const p = currentPhase === 0 ? Math.min(1, elapsed / PHASE_DURATIONS[0]) : 1;
      
      // Геометрична сітка (основна — більш тонка)
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.04 * p})`;
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = (now * 0.03) % gridSize; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = (now * 0.03) % gridSize; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Мікро-сітка (додатковий рівень глибини)
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.015 * p})`;
      const microGrid = 25;
      for (let x = 0; x < w; x += microGrid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += microGrid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Бігучі лінії скану (рандомні горизонтальні глітчі)
      if (Math.random() > 0.85) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.06 * p})`;
        ctx.fillRect(0, Math.random() * h, w, 1 + Math.random() * 3);
      }
    }

    /* ФАЗА 1: РАДАР ТА СУПУТНИКОВЕ ПЕРЕХОПЛЕННЯ (ГЛОБАЛЬНИЙ МАСШТАБ) */
    if (currentPhase === 1) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);
      const globeRadius = Math.min(w, h) * 0.38;
      
      ctx.save();
      ctx.translate(cx, cy);

      // 1. Координатна сітка Землі
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.15 * p})`;
      ctx.lineWidth = 1;

      for (let i = -6; i <= 6; i++) {
        const yOffset = (i / 6) * globeRadius;
        const width = Math.sqrt(globeRadius * globeRadius - yOffset * yOffset);
        if (width > 0) {
          ctx.beginPath();
          ctx.ellipse(0, yOffset, width, width * 0.15, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const numLongitudes = 16;
      const rotationSpeed = now * 0.0004; 
      for (let i = 0; i < numLongitudes; i++) {
        const angle = (i / numLongitudes) * Math.PI * 2 + rotationSpeed;
        const cosA = Math.cos(angle);
        const width = globeRadius * Math.abs(cosA);
        if (width > 0.5) {
          ctx.beginPath();
          ctx.ellipse(0, 0, width, globeRadius, 0, 0, Math.PI * 2);
          ctx.strokeStyle = Math.sin(angle) < 0 ? `rgba(220, 38, 38, ${0.05 * p})` : `rgba(220, 38, 38, ${0.4 * p})`;
          ctx.stroke();
        }
      }

      // Цифрові кільця навколо глобуса (Статус супутників)
      // Перше кільце — пунктирне
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, globeRadius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.12 * p})`;
      ctx.stroke();
      ctx.setLineDash([]);

      // Друге кільце — суцільне тонке
      ctx.beginPath();
      ctx.arc(0, 0, globeRadius * 1.25, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.06 * p})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Третє кільце — пунктирне зовнішнє з рухом
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      const outerOrbitAngle = now * 0.0005;
      ctx.save();
      ctx.rotate(outerOrbitAngle);
      ctx.arc(0, 0, globeRadius * 1.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.08 * p})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.setLineDash([]);

      // Мітки секторів на зовнішньому кільці
      for (let s = 0; s < 12; s++) {
        const sAngle = (s / 12) * Math.PI * 2;
        const sx1 = Math.cos(sAngle) * globeRadius * 1.25;
        const sy1 = Math.sin(sAngle) * globeRadius * 1.25;
        const sx2 = Math.cos(sAngle) * globeRadius * 1.3;
        const sy2 = Math.sin(sAngle) * globeRadius * 1.3;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.strokeStyle = `rgba(220, 38, 38, ${0.2 * p})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Радарний промінь
      const angle = now * 0.0025;
      ctx.rotate(angle);
      const grad = ctx.createConicGradient(0, 0, 0);
      grad.addColorStop(0, 'rgba(220, 38, 38, 0)');
      grad.addColorStop(0.08, `rgba(220, 38, 38, ${0.6 * p})`);
      grad.addColorStop(0.12, 'rgba(220, 38, 38, 0)');
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, globeRadius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(globeRadius * 1.3, 0);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * p})`;
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.rotate(-angle);

      // 3. 'Цілі' з лініями зв'язку
      for (let i = 0; i < 8; i++) {
        const tgtAngle = (i * Math.PI * 2) / 8 + (now * 0.0003);
        const tgtDist = globeRadius * (0.3 + 0.6 * Math.abs(Math.sin(now * 0.0005 + i)));
        const tx = Math.cos(tgtAngle) * tgtDist;
        const ty = Math.sin(tgtAngle) * tgtDist;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * p})`;
        ctx.strokeRect(tx - 3, ty - 3, 6, 6);
        
        // Лінія від цілі до центру (Uplink)
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = `rgba(220, 38, 38, ${0.1 * p})`;
        ctx.stroke();

        // Координати цілі біля неї
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * p})`;
        ctx.font = '6px monospace';
        ctx.fillText(`TGT-${i}: ${tx.toFixed(0)}:${ty.toFixed(0)}`, tx + 8, ty);
      }
      ctx.restore();
    }

    /* ФАЗА 2: АВТОРИЗАЦІЯ (Гострі квадрати, червоні тривожні лінії) */
    if (currentPhase === 2) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[2]);
      
      // Сувора геометрія, що фіксується
      const boxSize = 250 - p * 30; // Зменшується і фіксується
      
      ctx.save();
      ctx.translate(cx, cy);
      // Обертання кутів
      ctx.rotate(now * 0.001);
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * p})`;
      ctx.lineWidth = 3;
      
      // Куточки прицілу
      const s = boxSize / 2;
      const l = 40; // довжина куточка
      
      ctx.beginPath();
      // Top left
      ctx.moveTo(-s, -s + l); ctx.lineTo(-s, -s); ctx.lineTo(-s + l, -s);
      // Top right
      ctx.moveTo(s - l, -s); ctx.lineTo(s, -s); ctx.lineTo(s, -s + l);
      // Bottom left
      ctx.moveTo(-s, s - l); ctx.lineTo(-s, s); ctx.lineTo(-s + l, s);
      // Bottom right
      ctx.moveTo(s - l, s); ctx.lineTo(s, s); ctx.lineTo(s, s - l);
      ctx.stroke();
      
      ctx.restore();

      // Швидкі перешкоди (glitch bars)
      if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(220, 38, 38, ${0.1 * p})`;
        ctx.fillRect(cx - boxSize, Math.random() * h, boxSize * 2, 5 + Math.random() * 20);
      }
    }

    /* ФАЗА 3: RAPTOR REVEAL — Грандіозна поява (Темний строгий фон) */
    if (currentPhase === 3) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[3]);
      
      // Початковий спалах (перші 300мс)
      if (elapsed < 300) {
        const flashP = elapsed / 300;
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - flashP) * 0.8})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Строгі червоні лазерні лінії, що розходяться
      if (elapsed < 1200) {
        const waveP = elapsed / 1200;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - waveP) * 0.5})`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        // Від центру до країв по горизонталі
        ctx.moveTo(cx - waveP * w, cy); ctx.lineTo(cx + waveP * w, cy);
        ctx.stroke();
        
        ctx.beginPath();
        // Від центру до країв по вертикалі
        ctx.moveTo(cx, cy - waveP * h); ctx.lineTo(cx, cy + waveP * h);
        ctx.stroke();
        
        // Розширююче коло прицілу
        const r = waveP * Math.max(w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 38, 38, ${(1 - waveP) * 0.3})`;
        ctx.stroke();
      }

      // Темне глибоке світіння за монетою — багатошарове
      const glowR = 200 + Math.sin(now * 0.002) * 20;
      // Зовнішній ореол
      const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * 1.5);
      outerGrad.addColorStop(0, `rgba(220, 38, 38, ${0.06 * p})`);
      outerGrad.addColorStop(0.4, `rgba(120, 10, 10, ${0.03 * p})`);
      outerGrad.addColorStop(1, 'rgba(1, 4, 9, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.fill();
      // Внутрішнє ядро
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * 0.6);
      coreGrad.addColorStop(0, `rgba(220, 38, 38, ${0.15 * p})`);
      coreGrad.addColorStop(0.6, `rgba(180, 20, 20, ${0.05 * p})`);
      coreGrad.addColorStop(1, 'rgba(1, 4, 9, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    /* ФАЗА 4: FADE OUT */
    if (currentPhase === 4) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[4]);
      // Темне строге затухання без зайвих кольорів
      ctx.fillStyle = `rgba(1, 4, 9, ${p})`;
      ctx.fillRect(0, 0, w, h);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [phase]);

  /* ─ Фазовий контролер ─ */
  useEffect(() => {
    if (skipRef.current) return;
    const dur = PHASE_DURATIONS[phase];
    if (!dur) return;

    const timer = setTimeout(() => {
      if (phase < 4) {
        setPhase((p) => (p + 1) as Phase);
        phaseStartTimeMs.current = Date.now();
      } else {
        coinSpinStopRef.current?.();
        onComplete();
      }
    }, dur);

    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  /* ─ Canvas Init ─ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const c = canvas.getContext('2d');
      if (c) c.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  const [skipAllowed, setSkipAllowed] = useState(false);
  useEffect(() => {
    // Швидко можна пропустити (через 1с)
    const t = setTimeout(() => setSkipAllowed(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = () => {
    if (!skipAllowed) return;
    skipRef.current = true;
    coinSpinStopRef.current?.();
    setPhase(4); // Перехід до фази затухання
  };

  /* ── Crossfade variant для AnimatePresence ── */
  const fadeVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
  };

  const transitionSmooth = { duration: 0.5, ease: 'easeOut' };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] bg-[#010409] overflow-hidden font-mono select-none flex items-center justify-center"
      onClick={handleSkip}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Суворий мілітарі-оверлей (Scanlines + Вінетка) */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4xNSIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(1,4,9,0.85)_70%,rgba(1,4,9,0.98)_100%)] z-10" />

      {/* Кутові маркери HUD (завжди видимі — рамка прицілу) */}
      {phase < 4 && (
        <div className="absolute inset-0 pointer-events-none z-[15]">
          {/* Top-Left */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-red-700/40" />
          <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-red-500/20" />
          {/* Top-Right */}
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-red-700/40" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-red-500/20" />
          {/* Bottom-Left */}
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-red-700/40" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-red-500/20" />
          {/* Bottom-Right */}
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-red-700/40" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-red-500/20" />
        </div>
      )}

      {/* HUD — Технічна інформація (завжди видима під час загрузки крім фази 4) */}
      <AnimatePresence mode="wait">
        {phase >= 0 && phase < 4 && (
          <motion.div
            key="hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-20"
          >
            {/* Верхній лівий: Класифікація */}
            <div className="absolute top-8 left-8 text-red-500 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-red-600 animate-pulse shadow-[0_0_12px_#dc2626,0_0_30px_rgba(220,38,38,0.3)] rounded-full" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping opacity-30" />
                </div>
                <span className="text-[10px] font-black tracking-[0.5em] text-red-600 drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]">
                  STRATEGIC ASSET COMMAND / GLOBAL WATCHDOG v56.1.4
                </span>
              </div>
              <p className="text-[7px] text-red-400/50 uppercase tracking-[0.3em] pl-5 font-bold">
                LEVEL 5 CLEARANCE REQUIRED — SOVEREIGN ACCESS ONLY
              </p>
              <p className="text-[6px] text-slate-600 uppercase tracking-widest pl-5">
                CLASSIFICATION: COSMIC TOP SECRET // NOFORN // PREDATOR EYES ONLY
              </p>
            </div>

            {/* Верхній правий: Телеметрія */}
            <div className="absolute top-8 right-8 text-right space-y-1">
              <div className="text-[8px] text-slate-600 uppercase tracking-[0.3em]">
                ПЕРЕХОПЛЕНО ТРАНЗАКЦІЙ
              </div>
              <div className="text-base font-black text-red-600 font-mono tabular-nums tracking-widest drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]">
                {interceptCount.toLocaleString()} 
              </div>
              <div className="text-[7px] text-slate-700 uppercase tracking-widest">
                NODES ACTIVE: 4,217 / SESSIONS: 892
              </div>
            </div>

            {/* Зліва знизу: Телеметрія логів */}
            <div className="absolute bottom-20 left-8 space-y-1 hidden md:block">
                {hexCodes.map((code, idx) => (
                    <motion.div
                        key={`${code}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1 - idx * 0.12, x: 0 }}
                        className="text-[8px] text-red-500/70 font-mono tracking-wider"
                    >
                        [P-NET.CORE] INJECT_KEY: {code} ... SYNCED
                    </motion.div>
                ))}
            </div>

            {/* Знизу справа: Прогрес */}
            <div className="absolute bottom-20 right-8 space-y-2 w-72 text-right">
              <div className="flex justify-between text-[9px] text-red-600/70 uppercase tracking-[0.3em] font-bold">
                <span>STRATCOM_UPLINK</span>
                <span className="text-red-500">{Math.floor(scanProgress)}%</span>
              </div>
              <div className="h-[3px] bg-slate-900/80 overflow-hidden relative rounded-sm border border-slate-800/50">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-700 via-red-600 to-red-500 shadow-[0_0_12px_#dc2626]"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                />
              </div>
              <div className="text-[6px] text-slate-700 uppercase tracking-widest">
                AES-512-GCM / QUANTUM-RESISTANT / ZERO-KNOWLEDGE
              </div>
            </div>
            
            {/* Попередження по центру знизу */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[8px] text-red-600/90 font-black tracking-[0.5em] uppercase bg-black/90 px-6 py-1.5 border border-red-900/40 shadow-[0_0_20px_rgba(220,38,38,0.1),inset_0_0_20px_rgba(0,0,0,0.5)]">
                PROPRIETARY OSINT CORE — PROPERTY OF PREDATOR GROUP — TOP SECRET
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ЦЕНТРАЛЬНІ ФАЗИ (Текст та 3D) ── */}
      <AnimatePresence mode="wait">

        {/* ── ФАЗА 0: Встановлення з'єднання ── */}
        {phase === 0 && (
          <motion.div
            key="phase0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSmooth}
            className="relative z-30 text-center"
          >
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-[14px] text-red-600 tracking-[0.6em] uppercase font-black"
            >
              ВСТАНОВЛЕННЯ З'ЄДНАННЯ З ЯДРОМ...
            </motion.div>
            <div className="mt-2 text-[9px] text-red-600/60 tracking-widest uppercase font-bold">
              QUANTUM-RESISTANT HANDSHAKE (AES-512-GCM)
            </div>
          </motion.div>
        )}

        {/* ── ФАЗА 1: Перехоплення ── */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSmooth}
            className="relative z-30 text-center"
          >
            <div className="text-[12px] text-red-600 tracking-[0.6em] uppercase font-black">
              ГЛОБАЛЬНИЙ МОНІТОРИНГ
            </div>
            <div className="mt-2 text-[8px] text-slate-500 tracking-widest uppercase">
              СИНХРОНІЗАЦІЯ СУПУТНИКІВ ПО ВСЬОМУ СВІТУ
            </div>
          </motion.div>
        )}

        {/* ── ФАЗА 2: Авторизація ── */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSmooth}
            className="relative z-30 text-center"
          >
            <motion.div
                animate={{ color: ['#ef4444', '#f87171', '#ef4444'] }}
                transition={{ duration: 0.2, repeat: Infinity }}
                className="text-[14px] text-red-500 tracking-[0.8em] uppercase font-black"
            >
              РІВЕНЬ ДОСТУПУ: SOVEREIGN
            </motion.div>
            <div className="mt-2 text-[8px] text-red-500/60 tracking-widest uppercase font-bold">
              ПІДТВЕРДЖЕННЯ ПОСАДОВИХ ПОВНОВАЖЕНЬ
            </div>
          </motion.div>
        )}

        {/* ── ФАЗА 3: RAPTOR REVEAL — Строга поява без кружляння ── */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-30 flex flex-col items-center justify-center"
          >
            {/* Масивний логотип з подвійним кільцем */}
            <motion.div
              initial={{
                scale: 4,
                opacity: 0,
                filter: 'blur(12px)',
              }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: 'blur(0px)',
              }}
              transition={{
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="relative mb-12 w-44 h-44 md:w-52 md:h-52"
            >
                {/* Зовнішнє обертальне кільце */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 rounded-full border border-red-800/30"
                  style={{ borderStyle: 'dashed' }}
                />
                {/* Друге зовнішнє кільце — протилежне обертання */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-8 rounded-full border border-red-900/15"
                  style={{ borderStyle: 'dotted' }}
                />
                <div
                    className="w-full h-full rounded-full bg-gradient-to-b from-black via-black/95 to-red-950/20 border-2 border-red-600/80 shadow-[0_0_80px_rgba(220,38,38,0.4),0_0_160px_rgba(220,38,38,0.15),inset_0_0_40px_rgba(220,38,38,0.1)] flex items-center justify-center relative overflow-hidden"
                    style={{ clipPath: 'circle(50% at 50% 50%)' }}
                >
                    <motion.div
                        className="w-[65%] h-[65%] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                    >
                        <GeometricRaptor className="w-full h-full object-contain" />
                    </motion.div>
                    
                    {/* Скан лінія в монеті */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_15px_rgba(220,38,38,1)] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                    {/* Внутрішнє тонке кільце */}
                    <div className="absolute inset-2 rounded-full border border-red-700/20 pointer-events-none" />
                </div>
            </motion.div>

            {/* Текст */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
              className="text-center space-y-5"
            >
              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 10px rgba(220,38,38,0.6), 0 0 40px rgba(220,38,38,0.2)',
                    '0 0 20px rgba(220,38,38,0.9), 0 0 60px rgba(220,38,38,0.3)',
                    '0 0 10px rgba(220,38,38,0.6), 0 0 40px rgba(220,38,38,0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-6xl md:text-8xl font-black tracking-[0.3em] text-white"
              >
                PREDATOR
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.5, duration: 1.2, ease: 'easeOut' }}
                className="flex items-center justify-center gap-4"
              >
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />
                <h2 className="text-[13px] md:text-[15px] font-black tracking-[1.2em] text-red-400/90 uppercase whitespace-nowrap">
                    STRATEGIC INTEL ASSET
                </h2>
                <div className="w-32 h-[1px] bg-gradient-to-l from-transparent via-red-600 to-transparent" />
              </motion.div>

              {/* ДОСТУП ДОЗВОЛЕНО — Преміальний блок */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1, 1] }}
                transition={{ delay: 2.2, duration: 0.8 }}
                className="pt-10"
              >
                  <div className="inline-block relative">
                      <div className="absolute inset-0 bg-red-600 blur-lg opacity-30" />
                      <span className="relative text-[12px] text-white font-black tracking-[1.2em] uppercase border border-red-500/60 px-8 py-2.5 bg-red-600/90 shadow-[0_0_30px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
                          ДОСТУП ДОЗВОЛЕНО
                      </span>
                  </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BootScreen;
