/**
 * BootScreen — "ЯДРО NEXUS v56.1" (SOVEREIGN NEXUS CORE)
 * Кінематографічна заставка з:
 * - Плавними crossfade переходами між фазами
 * - 3D монетою-динозавром, що крутиться безперервно
 * - Web Audio API звуковими ефектами
 * - Частинковою системою та неоновими спалахами
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 0 | 1 | 2 | 3 | 4;
// 0: ІНІЦІАЛІЗАЦІЯ СКАНУВАННЯ (Грід + глітч)
// 1: ПЕРЕХОПЛЕННЯ ДАНИХ (Збір потоків)
// 2: ФОРМУВАННЯ ЯДРА (Стягування до центру)
// 3: RAPTOR REVEAL (Монета з динозавром крутиться + звук)
// 4: СИСТЕМА ГОТОВА (fade out)

const PHASE_DURATIONS: Record<Phase, number> = {
  0: 1200,
  1: 1000,
  2: 800,
  3: 4000,
  4: 800,
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

  /** Низький гул ядра (дрон) */
  playCoreDrone() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  }

  /** Вуш (sweep) */
  playSweep() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  }

  /** Удар приземлення */
  playImpact() {
    const ctx = this.getCtx();
    if (!ctx) return;
    // Sub bass
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    g1.gain.setValueAtTime(0.25, ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.7);

    // Шум удару
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  }

  /** Тихий тональний сигнал (biep) */
  playBeep(freq = 880) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  /** Безперервний гул обертання монети */
  startCoinSpin(): (() => void) | null {
    const ctx = this.getCtx();
    if (!ctx) return null;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = 220;
    lfo.type = 'sine';
    lfo.frequency.value = 3; // 3 Hz wobble
    lfoGain.gain.value = 40;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.5);
    gain.connect(ctx.destination);

    osc.start();
    lfo.start();

    return () => {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      setTimeout(() => {
        osc.stop();
        lfo.stop();
      }, 350);
    };
  }
}

const soundEngine = new SoundEngine();

/* ─── Частинкова система ─── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const [phase, setPhase] = useState<Phase>(0);
  const phaseStartTimeMs = useRef(Date.now());
  const skipRef = useRef(false);
  const coinSpinStopRef = useRef<(() => void) | null>(null);

  const [interceptCount, setInterceptCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  /* ─ HUD Лічильники ─ */
  useEffect(() => {
    const iInterval = setInterval(() => {
      setInterceptCount((p) => p + Math.floor(Math.random() * 1420));
    }, 30);
    const sInterval = setInterval(() => {
      setScanProgress((p) => Math.min(100, p + Math.random() * 2));
    }, 50);
    return () => {
      clearInterval(iInterval);
      clearInterval(sInterval);
    };
  }, []);

  /* ─ Звуки при переході фаз ─ */
  useEffect(() => {
    if (phase === 0) soundEngine.playCoreDrone();
    if (phase === 1) soundEngine.playSweep();
    if (phase === 2) soundEngine.playBeep(1200);
    if (phase === 3) {
      soundEngine.playImpact();
      const stopSpin = soundEngine.startCoinSpin();
      coinSpinStopRef.current = stopSpin;
    }
    if (phase === 4) {
      coinSpinStopRef.current?.();
      soundEngine.playBeep(660);
    }
  }, [phase]);

  /* ─ Спавн частинок ─ */
  const spawnParticles = useCallback((cx: number, cy: number, count: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      newParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 3,
        color,
      });
    }
    particlesRef.current.push(...newParticles);
  }, []);

  /* ─ Рендер Canvas ─ */
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

    // Фон з шлейфом
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    /* ФАЗА 0: DIGITAL RAIN — Ініціалізація сканування */
    if (currentPhase === 0) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[0]);
      // Вертикальні потоки даних
      ctx.font = '10px monospace';
      for (let col = 0; col < w; col += 20) {
        const chars = '01アイウエオカキクケコ█▓▒░';
        const speed = 0.5 + Math.random() * 0.5;
        const yOffset = (now * speed * 0.05 + col * 7) % h;
        for (let row = 0; row < 8; row++) {
          const y = (yOffset + row * 16) % h;
          const alpha = (1 - row / 8) * 0.4 * p;
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], col, y);
        }
      }

      // Грід сканування
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.08 * p})`;
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    /* ФАЗА 1: ЗБІР ПОТОКІВ — лінії до центру */
    if (currentPhase === 1) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);
      const lineCount = 24;
      for (let i = 0; i < lineCount; i++) {
        const angle = (Math.PI * 2 * i) / lineCount + now * 0.001;
        const outerR = Math.max(w, h);
        const innerR = outerR * (1 - p * 0.7);
        const ox = cx + Math.cos(angle) * outerR;
        const oy = cy + Math.sin(angle) * outerR;
        const ix = cx + Math.cos(angle) * innerR;
        const iy = cy + Math.sin(angle) * innerR;

        const g = ctx.createLinearGradient(ox, oy, ix, iy);
        g.addColorStop(0, 'rgba(34, 211, 238, 0)');
        g.addColorStop(0.6, `rgba(34, 211, 238, ${0.25 * p})`);
        g.addColorStop(1, `rgba(34, 211, 238, ${0.6 * p})`);

        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ix, iy);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Центральний вузол
      ctx.beginPath();
      ctx.arc(cx, cy, 8 + Math.sin(now * 0.008) * 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34, 211, 238, ${0.4 * p})`;
      ctx.fill();
    }

    /* ФАЗА 2: СТЯГУВАННЯ ЯДРА — орбітальні кільця */
    if (currentPhase === 2) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[2]);

      // Орбітальні кільця
      for (let ring = 0; ring < 3; ring++) {
        const r = 200 * (1 - p * 0.6) - ring * 30;
        if (r <= 0) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${(0.15 + ring * 0.1) * p})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4 + ring * 2, 8 + ring * 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Нейронні спалахи при стягуванні
      if (Math.random() > 0.7) {
        spawnParticles(
          cx + (Math.random() - 0.5) * 200,
          cy + (Math.random() - 0.5) * 200,
          2,
          'rgba(34, 211, 238, 0.8)'
        );
      }

      // Яскрава точка в центрі, що зростає
      const glowR = 4 + p * 20;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      coreGrad.addColorStop(0, `rgba(34, 211, 238, ${0.8 * p})`);
      coreGrad.addColorStop(0.5, `rgba(34, 211, 238, ${0.2 * p})`);
      coreGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();
    }

    /* ФАЗА 3: RAPTOR REVEAL — спалах */
    if (currentPhase === 3) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[3]);
      // Початковий спалах (перші 200мс)
      if (elapsed < 200) {
        const flashP = elapsed / 200;
        ctx.fillStyle = `rgba(34, 211, 238, ${(1 - flashP) * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        spawnParticles(cx, cy, 5, 'rgba(255, 255, 255, 0.9)');
      }

      // Розбіжні хвилі (shockwaves)
      if (elapsed < 1500) {
        const waveP = elapsed / 1500;
        for (let ring = 0; ring < 3; ring++) {
          const r = waveP * Math.max(w, h) * 0.5 * (1 + ring * 0.3);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - waveP) * 0.2 / (ring + 1)})`;
          ctx.lineWidth = 2 - ring * 0.5;
          ctx.stroke();
        }
      }

      // Ambient glow навколо монети
      const glowR = 120 + Math.sin(now * 0.003) * 20;
      const ambientGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      ambientGrad.addColorStop(0, `rgba(34, 211, 238, ${0.15 * p})`);
      ambientGrad.addColorStop(0.5, `rgba(34, 211, 238, ${0.05 * p})`);
      ambientGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = ambientGrad;
      ctx.fill();
    }

    /* ФАЗА 4: FADE OUT */
    if (currentPhase === 4) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[4]);
      ctx.fillStyle = `rgba(34, 211, 238, ${p * 0.15})`;
      ctx.fillRect(0, 0, w, h);
    }

    /* ─── Частинки ─── */
    const dt = 0.016;
    particlesRef.current = particlesRef.current.filter((prt) => {
      prt.x += prt.vx;
      prt.y += prt.vy;
      prt.vx *= 0.98;
      prt.vy *= 0.98;
      prt.life -= dt / prt.maxLife;
      if (prt.life <= 0) return false;

      ctx.beginPath();
      ctx.arc(prt.x, prt.y, prt.size * prt.life, 0, Math.PI * 2);
      ctx.fillStyle = prt.color.replace(/[\d.]+\)$/, `${prt.life * 0.8})`);
      ctx.fill();
      return true;
    });

    animFrameRef.current = requestAnimationFrame(render);
  }, [phase, spawnParticles]);

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
    const t = setTimeout(() => setSkipAllowed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = () => {
    if (!skipAllowed) return;
    skipRef.current = true;
    coinSpinStopRef.current?.();
    onComplete();
  };

  /* ── Crossfade variant для AnimatePresence ── */
  const fadeVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(8px)' },
  };

  const transitionSmooth = { duration: 0.8, ease: [0.16, 1, 0.3, 1] };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] bg-black overflow-hidden font-mono select-none flex items-center justify-center"
      onClick={handleSkip}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* CRT noise overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.14)_0.8px,transparent_0.8px)] [background-size:12px_12px]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_3px] opacity-20" />

      {/* HUD — з'являється поступово */}
      <AnimatePresence mode="wait">
        {phase >= 1 && phase < 4 && (
          <motion.div
            key="hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {/* Верхній лівий: Статус */}
            <div className="absolute top-6 left-6 text-cyan-500 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 animate-pulse shadow-[0_0_10px_#22d3ee] rounded-full" />
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase">
                  КЕРУЮЧЕ ЯДРО NEXUS v56.1
                </span>
              </div>
              <p className="text-[8px] text-cyan-400/50 uppercase tracking-wider">
                Авт: Overlord • Доступ: COSMIC
              </p>
            </div>

            {/* Верхній правий: Дані */}
            <div className="absolute top-6 right-6 text-right space-y-1">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest">
                Обʼєм аналізу:
              </div>
              <div className="text-sm font-black text-cyan-400 font-mono tabular-nums">
                {interceptCount.toLocaleString()} PB
              </div>
            </div>

            {/* Нижній лівий: Прогрес */}
            <div className="absolute bottom-16 left-6 space-y-1.5 w-48">
              <div className="flex justify-between text-[8px] text-cyan-400/60 uppercase tracking-widest">
                <span>Сканування:</span>
                <span>{Math.floor(scanProgress)}%</span>
              </div>
              <div className="h-[2px] bg-cyan-950 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ФАЗА 0: Текст ініціалізації ── */}
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="phase0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSmooth}
            className="relative z-20 text-center"
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] text-cyan-500/70 tracking-[0.6em] uppercase font-bold"
            >
              ⟡ ІНІЦІАЛІЗАЦІЯ NEXUS ⟡
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mt-3 h-[1px] w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
            />
          </motion.div>
        )}

        {/* ── ФАЗА 1: Збір даних ── */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSmooth}
            className="relative z-20 text-center"
          >
            <div className="text-[10px] text-cyan-400/80 tracking-[0.5em] uppercase font-bold">
              ПЕРЕХОПЛЕННЯ ПОТОКІВ
            </div>
            <div className="mt-2 text-[8px] text-slate-500 tracking-widest">
              Зʼєднання з серверами розвідки...
            </div>
          </motion.div>
        )}

        {/* ── ФАЗА 2: Формування ядра ── */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitionSmooth}
            className="relative z-20 text-center"
          >
            <div className="text-[10px] text-cyan-300 tracking-[0.5em] uppercase font-bold">
              ФОРМУВАННЯ ЯДРА
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="mt-4 w-3 h-3 mx-auto rounded-full bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)]"
            />
          </motion.div>
        )}

        {/* ── ФАЗА 3: RAPTOR REVEAL — 3D крутяча монета ── */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 flex flex-col items-center justify-center"
          >
            {/* Імпульсна хвиля */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute w-32 h-32 border border-cyan-400/60 rounded-full"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: 'easeOut' }}
              className="absolute w-32 h-32 border border-cyan-300/40 rounded-full"
            />

            {/* 3D КРУТЯЧА МОНЕТА */}
            <motion.div
              initial={{
                scale: 12,
                y: -300,
                opacity: 0,
                rotateY: 90,
                rotateZ: -30,
                filter: 'blur(30px)',
              }}
              animate={{
                scale: 2.8,
                y: 0,
                opacity: 1,
                rotateY: [90, 0, 360, 720, 1080, 1440, 1800],
                rotateZ: [-30, 0, 0, 0, 0, 0, 0],
                filter: 'blur(0px)',
              }}
              transition={{
                duration: 3.5,
                times: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1],
                rotateY: {
                  duration: 3.5,
                  times: [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1],
                  ease: [0.16, 1, 0.3, 1],
                },
                y: { duration: 0.6, ease: 'circOut' },
                scale: { duration: 0.8, ease: 'circOut' },
                filter: { duration: 0.5 },
              }}
              className="relative mb-8"
              style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            >
              {/* Outer coin glow ring */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(34,211,238,0.3), 0 0 80px rgba(34,211,238,0.1)',
                    '0 0 60px rgba(34,211,238,0.5), 0 0 120px rgba(34,211,238,0.2)',
                    '0 0 40px rgba(34,211,238,0.3), 0 0 80px rgba(34,211,238,0.1)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
              />

              <Logo size="lg" animated={true} />

              {/* Мікро-спалах при приземленні */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.15, delay: 0.55 }}
                className="absolute inset-0 bg-white/30 mix-blend-overlay rounded-xl"
              />
            </motion.div>

            {/* Текст */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-5"
            >
              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 20px rgba(34,211,238,0.4)',
                    '0 0 40px rgba(34,211,238,0.7)',
                    '0 0 20px rgba(34,211,238,0.4)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-4xl md:text-7xl font-black tracking-[0.4em] text-white"
              >
                PREDATOR
              </motion.h1>

                <motion.p
                initial={{ opacity: 0, letterSpacing: '0.3em' }}
                animate={{ opacity: 1, letterSpacing: '1em' }}
                transition={{ delay: 0.8, duration: 1.2 }}
                className="text-[10px] text-cyan-400 font-bold uppercase"
              >
                Соверенний Nexus v56.1
              </motion.p>

              {/* "СИСТЕМА ГОТОВА" — пульсуючий текст */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.3, 1] }}
                transition={{ delay: 2, duration: 2 }}
                className="pt-4 text-[9px] text-emerald-400/80 font-bold tracking-[0.6em] uppercase"
              >
                — СИСТЕМА ГОТОВА —
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Підказка (клік) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 w-full text-center text-[8px] text-slate-600 tracking-widest uppercase z-30"
      >
        натисніть для пропуску ініціалізації
      </motion.div>
    </div>
  );
};

export default BootScreen;
