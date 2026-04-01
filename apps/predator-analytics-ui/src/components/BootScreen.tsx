/**
 * BootScreen — "ЯДРО NEXUS v56.1" (SOVEREIGN NEXUS CORE)
 * Система стратегічної автономії, квантової аналітики та суверенного контролю.
 * Технологічна домінація, швидкість, майбутнє.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 0 | 1 | 2 | 3;
// 0: КВАНТОВИЙ ПЕРЕХОПЛЕННЯ (Мережа даних)
// 1: ФОРМУВАННЯ ЯДРА NEXUS
// 2: СИНХРОНІЗАЦІЯ (Пошук патернів, неонові спалахи)
// 3: NEXUS ONLINE (Суверенний лог-ін, готовність системи)

// Constants
const PHASE_DURATIONS: Record<Phase, number> = {
  0: 800,  // Грід даних (Швидке сканування)
  1: 500,  // Формування ядра (Стягування)
  2: 700,  // Нейронна реконструкція (Neural Sync)
  3: 3500, // PREDATOR ONLINE (Raptor Reveal)
};

const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  
  const [phase, setPhase] = useState<Phase>(0);
  const phaseStartTimeMs = useRef(Date.now());
  const skipRef = useRef(false);
  
  // HUD Data Generators
  const [threatCount, setThreatCount] = useState(0);
  const [interceptCount, setInterceptCount] = useState(0);

  /* ─ HUD Лічильники ─ */
  useEffect(() => {
    const tInterval = setInterval(() => {
      if (phase >= 1) {
        setThreatCount((p) => p + Math.floor(Math.random() * 85));
      }
    }, 40);
    const iInterval = setInterval(() => {
        setInterceptCount((p) => p + Math.floor(Math.random() * 1420));
    }, 30);
    return () => { clearInterval(tInterval); clearInterval(iInterval); };
  }, [phase]);

  /* ─ Рендер ВСЕБАЧНОГО ОКА ─ */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const now = Date.now();
    const elapsed = now - phaseStartTimeMs.current;
    
    // Pure Black Background (+ residual trails for chaotic effect)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const currentPhase = skipRef.current ? 3 : phase;

    /* ФАЗА 0: SURVEILLANCE GRID */
    if (currentPhase === 0) {
      ctx.strokeStyle = `rgba(34, 211, 238, 0.15)`; // Nexus Cyan
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          if (Math.random() > 0.05) {
             ctx.strokeRect(x, y, gridSize - 4, gridSize - 4);
             // Рандомний шум камери
             if (Math.random() > 0.8) {
               ctx.fillStyle = `rgba(34, 211, 238, ${Math.random() * 0.3})`;
               ctx.fillRect(x + 2, y + 2, gridSize - 8, gridSize - 8);
             }
             // Координати
             ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
             ctx.font = '8px monospace';
             ctx.fillText(`GEO:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*99)}`, x + 2, y + gridSize - 10);
          }
        }
      }
    }

    /* ФАЗА 1: ФОРМУВАННЯ ЯДРА */
    if (currentPhase === 1) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);
      // Центральне ядро стягується
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.3 + p * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 150 * (1 - p * 0.5), 0, Math.PI * 2);
      ctx.stroke();

      // Внутрішній пульс
      ctx.beginPath();
      ctx.arc(cx, cy, 50 + Math.sin(now * 0.005) * 20, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.2 + Math.sin(now * 0.01) * 0.1})`;
      ctx.stroke();
    }

    /* ФАЗА 2: ПІДГОТОВКА СИНХРОНІЗАЦІЇ */
    if (currentPhase === 2) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[2]);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.4 + Math.sin(now * 0.01) * 0.2})`;
      ctx.lineWidth = 1;

      // Замість кілець — енергетичне напруження
      ctx.beginPath();
      ctx.arc(cx, cy, 100 * p, 0, Math.PI * 2);
      ctx.setLineDash([5, 15]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Нейронні спалахи (аналіз ДНК)
      for(let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 150;
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${Math.random()})`;
        ctx.fill();
      }
    }

    /* ФАЗА 3: СИНХРОНІЗАЦІЯ ЗАВЕРШЕНА */
    if (currentPhase === 3) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[3]);
      // Легкий спалах на початку (удар)
      if (p < 0.1) {
        ctx.fillStyle = `rgba(34, 211, 238, ${(0.1 - p) * 5})`;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = `rgba(34, 211, 238, ${p * 0.1})`;
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
      if (phase < 3) {
        setPhase((p) => (p + 1) as Phase);
        phaseStartTimeMs.current = Date.now();
      } else {
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
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
    onComplete();
  };

  return (
    <div 
       ref={containerRef}
       className="fixed inset-0 z-[999] bg-black overflow-hidden font-mono select-none flex items-center justify-center"
       onClick={handleSkip}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ШУМ CRT */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay [background-image:radial-gradient(rgba(255,255,255,0.14)_0.8px,transparent_0.8px)] [background-size:12px_12px]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* HUD (З'являється зФази 1) */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        {/* Верхній лівий: Статуси */}
        <div className="absolute top-6 left-6 text-cyan-500 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-600 animate-pulse shadow-[0_0_10px_#22d3ee]" />
            <span className="text-[10px] font-bold tracking-widest uppercase">SOVEREIGN NEXUS CORE v56.1</span>
          </div>
          <p className="text-[8px] text-cyan-400/50 uppercase">Auth: Overlord</p>
        </div>

        {/* Верхній правий: Загрози */}
        <div className="absolute top-6 right-6 text-right space-y-1">
          <div className="text-[8px] text-slate-500 uppercase">Traffic Processed:</div>
          <div className="text-sm font-black text-cyan-400 font-mono">
            {interceptCount.toLocaleString()} PB
          </div>
        </div>
      </div>

      {/* PREDATOR RECONSTRUCTION (Фаза 3) */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-20 flex flex-col items-center justify-center"
          >
            {/* Impact Shockwave */}
            <motion.div 
               initial={{ scale: 0, opacity: 1 }}
               animate={{ scale: 4, opacity: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="absolute w-40 h-40 border border-cyan-400 rounded-full"
            />
            
            {/* Falling & Spinning Coin Dinosaur */}
            <motion.div 
               initial={{ 
                 scale: 15, 
                 y: -200, 
                 opacity: 0,
                 rotateY: 90,
                 filter: 'blur(20px)' 
               }}
               animate={{ 
                 scale: 2.8, 
                 y: 0, 
                 opacity: 1,
                 rotateY: [90, 0, 360, 720], // Falling rotate then coin spin
                 filter: 'blur(0px)' 
               }}
               transition={{ 
                 duration: 1.2, 
                 times: [0, 0.4, 0.7, 1],
                 ease: "circOut" 
               }}
               className="relative mb-8"
            >
               {/* Inner Coin Glow */}
               <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl animate-pulse" />
               <Logo size="lg" animated={true} />
               
               {/* Metal Sparks on impact (Simplified) */}
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: [0, 1, 0] }}
                 transition={{ duration: 0.2, delay: 0.4 }}
                 className="absolute inset-0 bg-white mix-blend-overlay rounded-full"
               />
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center space-y-4"
            >
              <h1 className="text-4xl md:text-6xl font-black tracking-[0.4em] text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                PREDATOR
              </h1>
              <p className="text-[10px] text-cyan-400 font-bold tracking-[1em] uppercase">
                Sovereign Nexus v56.1
              </p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0, 1] }}
                transition={{ delay: 1.5, duration: 2 }}
                className="pt-6 text-[9px] text-emerald-500/80 font-bold tracking-[0.6em] uppercase"
              >
                — СИСТЕМА ГОТОВА —
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Підказка (клік) */}
      <div className="absolute bottom-6 w-full text-center text-[8px] text-slate-700 tracking-widest animate-pulse uppercase">
         Click to skip initialization
      </div>
    </div>
  );
};

export default BootScreen;
