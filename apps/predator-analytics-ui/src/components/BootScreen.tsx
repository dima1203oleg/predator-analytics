/**
 * BootScreen — "ЯДРО NEXUS v56.1" (SOVEREIGN NEXUS CORE)
 * Кінематографічна заставка з:
 * - Суворою військовою/розвідувальною естетикою
 * - Глобальним скануванням та ініціалізацією
 * - Web Audio API звуковими ефектами
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
  0: 1200,
  1: 1500,
  2: 1200,
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
    osc.type = 'square'; // Жорсткіший звук
    osc.frequency.setValueAtTime(45, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
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

  /** Короткий телеметричний писк */
  playTelemetry(freq = 1200) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
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
    ctx.fillStyle = 'rgba(1, 4, 9, 0.4)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    /* DIGITAL RAIN ФОН — Чіткі лінії і координатна сітка */
    if (currentPhase <= 2) {
      const p = currentPhase === 0 ? Math.min(1, elapsed / PHASE_DURATIONS[0]) : 1;
      
      // Геометрична сітка
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.05 * p})`;
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = (now * 0.05) % gridSize; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = (now * 0.05) % gridSize; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Бігучі лінії скану (рандомні горизонтальні глітчі)
      if (Math.random() > 0.8) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.1 * p})`;
        ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 4);
      }
    }

    /* ФАЗА 1: РАДАР ТА СУПУТНИКОВЕ ПЕРЕХОПЛЕННЯ */
    if (currentPhase === 1) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);
      const radarSize = Math.min(w, h) * 0.35;
      
      // Радарна лінія (Sweep)
      const angle = now * 0.003;
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      
      const grad = ctx.createConicGradient(0, 0, 0);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.1, `rgba(34, 211, 238, ${0.4 * p})`);
      grad.addColorStop(0.12, 'rgba(34, 211, 238, 0)');
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarSize, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      
      // Радарний промінь (чіткий)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarSize, 0);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.8 * p})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.rotate(-angle);
      ctx.translate(-cx, -cy);

      // Кільця радара
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radarSize / 3) * i, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 * p})`;
        ctx.lineWidth = i === 3 ? 2 : 1;
        ctx.setLineDash(i % 2 === 0 ? [5, 10] : []);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Геометричні 'цілі' на радарі
      for (let i = 0; i < 5; i++) {
        const tgtAngle = (i * Math.PI * 2) / 5 + (now * 0.0005 * (i % 2 === 0 ? 1 : -1));
        const tgtDist = radarSize * 0.4 + Math.sin(now * 0.001 + i) * radarSize * 0.3;
        const tx = cx + Math.cos(tgtAngle) * tgtDist;
        const ty = cy + Math.sin(tgtAngle) * tgtDist;
        
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 * p})`; // Червоні цілі
        ctx.lineWidth = 1;
        ctx.strokeRect(tx - 4, ty - 4, 8, 8);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.2 * p})`;
        ctx.fillRect(tx - 4, ty - 4, 8, 8);

        // Хрест
        ctx.beginPath();
        ctx.moveTo(tx - 8, ty); ctx.lineTo(tx + 8, ty);
        ctx.moveTo(tx, ty - 8); ctx.lineTo(tx, ty + 8);
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.4 * p})`;
        ctx.stroke();
      }
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
      
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 * p})`;
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
        ctx.fillStyle = `rgba(34, 211, 238, ${0.1 * p})`;
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
        ctx.strokeStyle = `rgba(239, 68, 68, ${(1 - waveP) * 0.5})`;
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
        ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - waveP) * 0.3})`;
        ctx.stroke();
      }

      // Темне глибоке світіння за монетою
      const glowR = 150 + Math.sin(now * 0.002) * 15;
      const ambientGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      ambientGrad.addColorStop(0, `rgba(34, 211, 238, ${0.1 * p})`);
      ambientGrad.addColorStop(0.5, `rgba(1, 4, 9, 0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = ambientGrad;
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
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-40 mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(1,4,9,0.9)_100%)] z-10" />

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
            {/* Верхній лівий: Секретно */}
            <div className="absolute top-6 left-6 text-red-500 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 animate-pulse shadow-[0_0_10px_#dc2626] rounded-full" />
                <span className="text-[10px] font-black tracking-[0.4em]">
                  ТАЄМНО / COSMIC CLEARANCE
                </span>
              </div>
              <p className="text-[7px] text-red-400/60 uppercase tracking-widest pl-4">
                СТРАТЕГІЧНЕ ЯДРО NEXUS v56.1
              </p>
            </div>

            {/* Верхній правий: Телеметрія */}
            <div className="absolute top-6 right-6 text-right space-y-1">
              <div className="text-[8px] text-slate-500 uppercase tracking-widest">
                ПЕРЕХОПЛЕНО (TX):
              </div>
              <div className="text-sm font-black text-cyan-400 font-mono tabular-nums tracking-widest">
                {interceptCount.toLocaleString()} 
              </div>
            </div>

            {/* Зліва знизу: Телеметрія логів */}
            <div className="absolute bottom-16 left-6 space-y-1">
                {hexCodes.map((code, idx) => (
                    <motion.div
                        key={`${code}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1 - idx * 0.15, x: 0 }}
                        className="text-[8px] text-slate-500 font-mono tracking-wider"
                    >
                        [SYS.MEM] ALLOC: {code} ... OK
                    </motion.div>
                ))}
            </div>

            {/* Знизу справа: Прогрес */}
            <div className="absolute bottom-16 right-6 space-y-1.5 w-64 text-right">
              <div className="flex justify-between text-[8px] text-cyan-400/60 uppercase tracking-widest font-bold">
                <span>INTEL_SCAN</span>
                <span>{Math.floor(scanProgress)}%</span>
              </div>
              <div className="h-[2px] bg-slate-900 overflow-hidden relative">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 bg-cyan-500 shadow-[0_0_10px_#22d3ee]"
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                />
              </div>
            </div>
            
            {/* Попередження по центру знизу */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[7px] text-red-500/40 tracking-[0.3em] uppercase">
                НЕСАНКЦІОНОВАНИЙ ДОСТУП ПЕРЕСЛІДУЄТЬСЯ ЗАКОНОМ (СТ. 361 КК)
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
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-[12px] text-cyan-500 tracking-[0.5em] uppercase font-black"
            >
              ВСТАНОВЛЕННЯ З'ЄДНАННЯ
            </motion.div>
            <div className="mt-2 text-[8px] text-cyan-500/50 tracking-widest uppercase">
              ШИФРУВАННЯ ПОТОКІВ AES-512...
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
            <div className="text-[12px] text-cyan-400 tracking-[0.6em] uppercase font-black">
              САТЕЛІТАРНЕ ПЕРЕХОПЛЕННЯ
            </div>
            <div className="mt-2 text-[8px] text-slate-500 tracking-widest uppercase">
              ПОШУК ЦІЛЕЙ У ГЛОБАЛЬНІЙ МЕРЕЖІ
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

        {/* ── ФАЗА 3: RAPTOR REVEAL — 3D крутяча монета (Кругла, як на LoginScreen) ── */}
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
            {/* 3D КРУТЯЧА МОНЕТА (Повністю ідентична до LoginScreen, кругла) */}
            <motion.div
              initial={{
                scale: 10,
                y: -100,
                opacity: 0,
                rotateY: 90,
                filter: 'blur(20px)',
              }}
              animate={{
                scale: 3,
                y: 0,
                opacity: 1,
                rotateY: [90, 0, 360, 720, 1080],
                filter: 'blur(0px)',
              }}
              transition={{
                duration: 3.5,
                times: [0, 0.2, 0.4, 0.7, 1],
                rotateY: { duration: 3.5, ease: 'easeOut' },
                y: { duration: 0.5, ease: 'circOut' },
                scale: { duration: 0.7, ease: 'circOut' },
                filter: { duration: 0.4 },
              }}
              className="relative mb-10 w-36 h-36"
              style={{ perspective: '1000px' }}
            >
                <div
                    className="w-full h-full rounded-full bg-black/80 border-2 border-cyan-500/40 shadow-[0_0_80px_rgba(34,211,238,0.2)] flex items-center justify-center relative overflow-hidden"
                    style={{ clipPath: 'circle(50% at 50% 50%)', transformStyle: 'preserve-3d' }}
                >
                    <motion.div
                        className="w-[70%] h-[70%] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                    >
                        <GeometricRaptor className="w-full h-full object-contain" />
                    </motion.div>
                    
                    {/* Скан лінія в монеті */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] animate-[scan_2s_linear_infinite]" />
                    </div>
                </div>
            </motion.div>

            {/* Текст */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className="text-center space-y-4"
            >
              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 10px rgba(34,211,238,0.3)',
                    '0 0 30px rgba(34,211,238,0.5)',
                    '0 0 10px rgba(34,211,238,0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-4xl md:text-6xl font-black tracking-[0.4em] text-white"
              >
                PREDATOR
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-red-500/50" />
                <h2 className="text-[10px] font-black tracking-[0.6em] text-red-500 uppercase">
                    Глобальна Розвідка
                </h2>
                <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-red-500/50" />
              </motion.div>

              {/* "СИСТЕМА ГОТОВА" — суворо блимає зеленим */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1, 1] }}
                transition={{ delay: 2, duration: 1.5 }}
                className="pt-6"
              >
                  <span className="text-[9px] text-emerald-500 font-bold tracking-[0.8em] uppercase border border-emerald-500/30 px-4 py-1.5 rounded-sm bg-emerald-500/10">
                      СИСТЕМА ГОТОВА
                  </span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BootScreen;
