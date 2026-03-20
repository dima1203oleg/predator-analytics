/**
 * BootScreen — "ОКО ХИЖАКА" (OMNISCIENT PREDATOR EYE)
 * Система масового стеження, перехоплення даних і виявлення загроз.
 * Страх, могуть, військовий / спецслужбовий контроль.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

type Phase = 0 | 1 | 2 | 3;
// 0: ПОТОКОВИЙ ПЕРЕХОПЛЕННЯ (Мережа камер)
// 1: ФОРМУВАННЯ ОКА
// 2: СКАНУВАННЯ (Зіниця шукає, червоні спалахи)
// 3: PREDATOR ONLINE (Кривавий лог-аут, підготовка до входу)

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

  // Constants
  const PHASE_DURATIONS: Record<Phase, number> = {
    0: 2500, // Грід камер та чисел
    1: 1500, // Стягування ока
    2: 3000, // Сканування
    3: 1500, // PREDATOR RED ONLINE
  };

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
      ctx.strokeStyle = `rgba(16, 185, 129, 0.15)`; // toxic green
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          if (Math.random() > 0.05) {
             ctx.strokeRect(x, y, gridSize - 4, gridSize - 4);
             // Рандомний шум камери
             if (Math.random() > 0.8) {
               ctx.fillStyle = `rgba(34, 197, 94, ${Math.random() * 0.3})`;
               ctx.fillRect(x + 2, y + 2, gridSize - 8, gridSize - 8);
             }
             // Координати
             ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
             ctx.font = '8px monospace';
             ctx.fillText(`GEO:${Math.floor(Math.random()*99)}.${Math.floor(Math.random()*99)}`, x + 5, y + gridSize - 10);
          }
        }
      }
      
      // Гігантський скануючий промінь
      const scanY = (elapsed / PHASE_DURATIONS[0]) * h;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // blood red scan
      ctx.fillRect(0, scanY, w, 4);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fillRect(0, scanY - 40, w, 40);
    }

    /* ФАЗА 1: ФОРМУВАННЯ ОКА */
    if (currentPhase === 1 || currentPhase === 2 || currentPhase === 3) {
      let eyeRadius = 0;
      let openRatio = 0; // 0 (закрите) -> 1 (відкрите)

      if (currentPhase === 1) {
        const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);
        const ease = 1 - Math.pow(1 - p, 3);
        openRatio = ease;
        eyeRadius = 150 * ease;
      } else {
        openRatio = 1;
        eyeRadius = 150 + Math.sin(now * 0.002) * 5; // пульсування
      }

      // Малюємо зіницю та райдужку, якщо око "відкривається"
      if (openRatio > 0.1) {
        const pupilX = currentPhase === 2 ? cx + Math.sin(now * 0.003) * 30 * Math.cos(now * 0.001) : cx;
        const pupilY = currentPhase === 2 ? cy + Math.cos(now * 0.0025) * 15 : cy;

        const eyeGradient = ctx.createRadialGradient(pupilX, pupilY, eyeRadius * 0.1, pupilX, pupilY, eyeRadius);
        eyeGradient.addColorStop(0, '#000000'); // чорна зіниця
        // Криваво-помаранчева або токсично-зелена райдужка
        eyeGradient.addColorStop(0.3, currentPhase === 3 ? '#ef4444' : '#f59e0b'); 
        eyeGradient.addColorStop(0.7, currentPhase === 3 ? '#991b1b' : '#1e3a8a');
        eyeGradient.addColorStop(1, '#000000');

        ctx.beginPath();
        ctx.ellipse(cx, cy, eyeRadius * 1.5, eyeRadius * openRatio, 0, 0, Math.PI * 2);
        ctx.fillStyle = eyeGradient;
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = currentPhase === 3 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.5)';
        ctx.stroke();

        // Світлові спалахи від зіниці (шукає жертву)
        if (currentPhase === 2 && Math.random() > 0.9) {
           ctx.beginPath();
           ctx.arc(pupilX, pupilY, eyeRadius * 1.8, 0, Math.PI * 2);
           ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
           ctx.fill();
        }

        // Кровоносні/Нейронні судини навколо ока
        ctx.strokeStyle = currentPhase === 3 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.2)';
        ctx.lineWidth = 1;
        for(let i=0; i<30; i++) {
           const angle = (Math.PI * 2 / 30) * i + now * 0.0001;
           const startR = eyeRadius * 1.1;
           const len = 50 + Math.random() * 150;
           ctx.beginPath();
           ctx.moveTo(cx + Math.cos(angle)*startR, cy + Math.sin(angle)*startR);
           // zigzag
           ctx.lineTo(cx + Math.cos(angle+0.1)*(startR+len/2), cy + Math.sin(angle+0.1)*(startR+len/2));
           ctx.lineTo(cx + Math.cos(angle)*(startR+len), cy + Math.sin(angle)*(startR+len));
           ctx.stroke();
        }
      }
    }

    /* ФАЗА 3: PREDATOR ONLINE (Кривава заливка) */
    if (currentPhase === 3) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[3]);
      ctx.fillStyle = `rgba(220, 38, 38, ${p * 0.3})`;
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
  }, [phase, onComplete, PHASE_DURATIONS]);

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

  const handleSkip = () => {
    skipRef.current = true;
    onComplete();
  };

  return (
    <div 
       ref={containerRef}
       className="fixed inset-0 z-[999] bg-black overflow-hidden font-mono select-none"
       onClick={handleSkip}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ШУМ CRT */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* HUD (З'являється зФази 1) */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        {/* Верхній лівий: Статуси */}
        <div className="absolute top-8 left-8 text-red-500 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase">RESTRICTED PREDATOR CORE</span>
          </div>
          <p className="text-[10px] text-red-400/70">AUTORIZATION LEVEL: BLACK</p>
          <p className="text-[10px] text-red-400/70 mt-4">ОПЕРАТИВНЕ ПЕРЕХОПЛЕННЯ УПРАВЛІННЯ</p>
          <div className="font-mono text-xl text-red-500 font-bold mt-2">
            Z-[{Math.floor(Math.random() * 9999).toString().padStart(4, '0')}] A-SEC
          </div>
        </div>

        {/* Верхній правий: Загрози */}
        <div className="absolute top-8 right-8 text-right space-y-2">
          <div className="text-[10px] text-emerald-500 tracking-widest uppercase mb-1 border-b border-emerald-900/50 pb-1">
            Моніторинг Глобальної Мережі
          </div>
          <div className="text-xs text-slate-400 uppercase">Дані перехоплено:</div>
          <div className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">
            {interceptCount.toLocaleString()} TB
          </div>
          <div className="text-xs text-slate-400 uppercase mt-2">Загроз виявлено:</div>
          <div className="text-3xl font-black text-red-500 font-mono tracking-tighter">
            {threatCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* PREDATOR TEXT (Фаза 3) */}
      <div className={`absolute inset-0 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}>
         <h1 className="text-7xl md:text-9xl font-black tracking-[0.2em] text-transparent bg-clip-text"
             style={{
               backgroundImage: 'linear-gradient(to bottom, #ef4444, #7f1d1d)',
               WebkitTextStroke: '2px #dc2626',
               filter: 'drop-shadow(0 0 30px rgba(220, 38, 38, 0.8))'
             }}>
           PREDATOR
         </h1>
         <p className="mt-4 text-sm md:text-lg text-red-500 font-bold tracking-[0.5em] uppercase"
            style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
           Всебачне Око. Ніхто не сховається.
         </p>
      </div>
      
      {/* Підказка (клік) */}
      <div className="absolute bottom-6 w-full text-center text-[10px] text-slate-600 tracking-widest animate-pulse">
         AUTH OVERRIDE: CLICK TO BYPASS
      </div>
    </div>
  );
};

export default BootScreen;