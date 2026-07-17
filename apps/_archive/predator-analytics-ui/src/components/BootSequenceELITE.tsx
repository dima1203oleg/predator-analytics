import { Button } from '@/components/ui/button';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricRaptor } from './Logo';

/**
 * 🦅 PREDATOR Analytics // BOOT SEQUENCE v60.0-ELITE «Sovereign Power»
 * =================================================================
 * Преміальна, страхітлива візуалізація ініціалізації аналітичного ядра.
 * Bloomberg / Palantir Aesthetic | Deep Cosmic Atmospheric Audio
 * 
 * © 2026 PREDATOR Analytics — HR-04 Compliant
 */

/* ─────────────────────────────────────────────────────────────────────────────
   ELITE AUDIO ENGINE (Deep Oscillating Shudders, FM Synthesis, Bass Drops)
   ─────────────────────────────────────────────────────────────────────────── */
class ApexAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeDrone: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null = null;

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();
      
      this.compressor.threshold.setValueAtTime(-40, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(20, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.5, this.ctx.currentTime);

      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
      this.master.gain.value = 0.8;
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  }

  /** Космічний вібруючий гул (Глибока напруга з FM-модуляцією) */
  playSovereignDrone() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    
    // Носій
    const carrier = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    // Модулятор (FM)
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    // LFO для вібрації (Scary Shudder)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(22, now); // Суб-бас
    
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(1.5, now);
    modGain.gain.setValueAtTime(5, now);
    
    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(12, now); // Швидка вібрація
    lfoGain.gain.setValueAtTime(2, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(40, now);
    filter.Q.value = 15;

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.7, now + 6);

    // Patch: Modulator -> modGain -> Carrier Frequency
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    // Patch: LFO -> lfoGain -> modGain (Amplitude modulation of the FM effect)
    lfo.connect(lfoGain);
    lfoGain.connect(modGain.gain);

    carrier.connect(filter);
    filter.connect(g);
    g.connect(this.master);

    carrier.start();
    modulator.start();
    lfo.start();
    
    this.activeDrone = { osc: carrier, gain: g, lfo: lfo };
  }

  /** Тектонічний удар (State Impact) */
  playImpact() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.exponentialRampToValueAtTime(1, now + 3);
    
    g.gain.setValueAtTime(1.8, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3);

    osc.connect(g);
    g.connect(this.master);

    osc.start();
    osc.stop(now + 3.1);
  }

  /** Глибокий резонуючий клік (Sovereign UI) */
  playEliteClick() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(12, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, now);

    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(now + 0.2);
  }

  /** Страхітлива вібрація (Cosmic Shudder) */
  playScaryVibration() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(28, now);
    
    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(18, now); // Дуже швидка вібрація
    lfoG.gain.setValueAtTime(35, now);
    
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + 4);

    osc.connect(g);
    g.connect(this.master);
    osc.start();
    lfo.start();
  }

  /** Голосовий супровід: «Демонічний» баритон */
  speak(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uk-UA';
    utterance.pitch = 0.9;  // Ексклюзивний баритон (було 0.05 - занадто низько)
    utterance.rate = 0.85;  // Оптимальна швидкість (було 0.55 - занадто повільно)
    utterance.volume = 1.0;

    const speakAction = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('uk') || v.lang.includes('UA')) || voices[0];
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speakAction();
        window.speechSynthesis.onvoiceschanged = null;
      };
    } else {
      speakAction();
    }
    
    // Додаємо вібрацію фоном до голосу
    this.playScaryVibration();
  }
}

const sfx = new ApexAudioEngine();

/* ─────────────────────────────────────────────────────────────────────────────
   ANALYTICAL MODULES (Sovereign Ukrainian)
   ─────────────────────────────────────────────────────────────────────────── */
const RAW_SOURCES = [
  "SIGINT:ПОТОК_ЦЕНТ АЛЬНИЙ // ПЕРЕХОПЛЕННЯ_АКТИВНЕ",
  "NEURAL:PARSER-ELITE // СТАТИСТИЧНИЙ_ВИСНОВОК",
  "QUANTUM:LEO-SYNC // ТЕЛЕМЕТ ІЯ_КЛУСТЕ У",
  "GLOBAL:REWRITE-PROTOCOL // ВСТАНОВЛЕННЯ_ДИКТАТУ И_ДАНИХ",
];

export const BootSequenceELITE: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [targetLabel, setTargetLabel] = useState("ІНІЦІАЛІЗАЦІЯ...");
  const [sourceText, setSourceText] = useState("");
  const [matchLine, setMatchLine] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const startTime = useRef(Date.now());

  // Strict Legal Warning (Bloomberg Elite Style)
  const renderLegalWarning = () => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(30px)' }}
      transition={{ duration: 2 }}
      className="max-w-5xl w-full mx-auto p-2 sm:p-3 bg-gradient-to-br from-[#D4AF37]/40 via-transparent to-black border border-[#D4AF37]/30 relative z-50"
    >
      <div className="bg-black p-6 sm:p-10 lg:p-16 xl:p-20 border border-[#D4AF37]/20 relative overflow-hidden flex flex-col justify-center">
        <div className="absolute top-0 right-0 p-4 sm:p-6">
           <div className="text-[#D4AF37] font-mono text-[9px] sm:text-[10px] tracking-widest opacity-30">ВЛАСНИЙ_ПРОТОКОЛ_60.0</div>
        </div>

        <div className="flex flex-col gap-8 sm:gap-14 lg:gap-20">
          <div className="space-y-3 sm:space-y-6">
             <div className="text-[#D4AF37] font-black text-[9px] sm:text-xs tracking-[0.8em] sm:tracking-[1.5em] uppercase opacity-60">рівень_Суверенної_Авторизації</div>
             <h2 className="text-white text-3xl sm:text-5xl lg:text-7xl font-light tracking-[0.15em] sm:tracking-[0.2em] uppercase leading-tight">
               Правовий <span className="text-[#D4AF37] font-medium">Суверенітет</span>
             </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 border-t border-white/5 pt-8 sm:pt-12 lg:pt-16">
            <div className="text-white/40 font-mono text-xs sm:text-sm leading-relaxed space-y-4 sm:space-y-6">
              <p>
                ДОСТУП ДО <span className="text-[#D4AF37]">PREDATOR ELITE</span> ОБМЕЖЕНИЙ.
                ВИ ПОГОДЖУЄТЕСЬ НА ПОВНУ ПРОЗОРІСТЬ ВАШИХ ДІЙ ПЕРЕД АВТОНОМНИМ ЯДРОМ.
              </p>
              <div className="h-[1px] w-32 sm:w-48 bg-[#D4AF37]/30" />
              <p className="text-[9px] sm:text-[10px] tracking-widest text-white/20 uppercase italic">
                Всі операції логуються в незмінному реєстрі WORM.
              </p>
            </div>
            <div className="flex flex-col justify-end items-start sm:items-end gap-6 sm:gap-10">
               <div className="flex gap-1 sm:gap-1.5">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, 18, 8] }}
                      transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: "easeInOut" }}
                      className="w-0.5 sm:w-1 bg-[#D4AF37]/40"
                    />
                  ))}
               </div>
               <div className="text-[9px] sm:text-[11px] text-[#D4AF37] tracking-[0.5em] sm:tracking-[0.8em] uppercase font-bold">
                 АНАЛІЗ БІОМЕТРИЧНОГО ВІДБИТКУ...
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Initialize Particle Field
  useEffect(() => {
    particles.current = Array.from({ length: 2000 }, () => ({
      x: (Math.random() - 0.5) * 8000,
      y: (Math.random() - 0.5) * 8000,
      z: Math.random() * 5000,
      px: 0, py: 0,
      c: Math.random() > 0.98 ? '#D4AF37' : '#222'
    }));
  }, []);

  // System Log Stream
  useEffect(() => {
    const logs = [
      "BOOT: ЗАВАНТАЖЕННЯ_ЕЛІТНИХ_СИСТЕМНИХ_ВИКЛИКІВ",
      "CORE: ПРИЄДНАННЯ_НЕЙ ОННИХ_СИНАПСІВ_v60",
      "SIGINT: СКАНУВАННЯ_ГЛОБАЛЬНИХ_ ЕЗЕ ВІВ [КИЇВ_СИНХ О]",
      "AUTH: ВСТАНОВЛЕНО_ДОПУСК_ОМЕГА",
      "STATUS:ПРОБУДЖЕННЯ_PREDATORА [СУВЕРЕННИЙ_РЕЖИМ]",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        const nextLog = logs[i];
        if (nextLog) {
          setBootLogs(prev => [...prev.slice(-12), nextLog]);
          sfx.playEliteClick();
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Render Loop Implementation
  useEffect(() => {
    let frame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = phase;

    const drawGrid = (w: number, h: number, opacity: number) => {
      ctx.strokeStyle = `rgba(212, 175, 55, ${opacity * 0.15})`;
      ctx.lineWidth = 0.5;
      const step = 100;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    };

    const render = () => {
      const elapsed = Date.now() - startTime.current;
      const W = canvas.width = window.innerWidth;
      const H = canvas.height = window.innerHeight;
      const cx = W / 2, cy = H / 2;

      ctx.fillStyle = '#010101';
      ctx.fillRect(0, 0, W, H);

      // Phase Control (Optimized Speed)
      if (elapsed < 3000 && localPhase !== 0) { 
        localPhase = 0; setPhase(0); 
        sfx.playSovereignDrone(); 
        sfx.speak("Протоколл ініціалізаціі. Визначення повноважень.");
      }
      else if (elapsed >= 3000 && elapsed < 6000 && localPhase !== 1) { 
        localPhase = 1; setPhase(1); 
        sfx.playImpact();
        sfx.speak("Ядро ідентифіковано. Завантаження когнітивних стеків.");
      }
      else if (elapsed >= 6000 && elapsed < 9000 && localPhase !== 1.5) { 
        localPhase = 1.5; setPhase(1.5); 
        sfx.speak("Створення нейронних зв'язків. Глобальний моніторинг активовано.");
      }
      else if (elapsed >= 9000 && elapsed < 12000 && localPhase !== 2) { 
        localPhase = 2; setPhase(2); 
        sfx.speak("Перевірка цілісності даних. Синхронізація з хабом.");
      }
      else if (elapsed >= 12000 && localPhase < 3) { 
        localPhase = 3; setPhase(3); 
        sfx.playImpact();
        sfx.speak("Система готова. Повний суверенітет підтверджено.");
        setTimeout(onComplete, 2500);
      }
      
      // Phase 3 & Completion is handled by selection
      
      drawGrid(W, H, 0.4);

      // Advanced Starfield (Hyper-speed during transitions)
      const speed = localPhase >= 2.5 ? 200 : (localPhase >= 1 ? 25 : 8);
      ctx.save();
      ctx.translate(cx, cy);
      particles.current.forEach((p) => {
        p.z -= speed;
        if (p.z <= 0) {
          p.z = 5000;
          p.x = (Math.random() - 0.5) * 8000;
          p.y = (Math.random() - 0.5) * 8000;
        }
        const sx = p.x / (p.z / 1000);
        const sy = p.y / (p.z / 1000);
        if (Math.abs(sx) < W && Math.abs(sy) < H && p.px !== 0) {
          ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(sx, sy);
          ctx.strokeStyle = p.c + Math.floor(Math.min(1, 1-p.z/5000)*80).toString(16).padStart(2,'0');
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        p.px = sx; p.py = sy;
      });
      ctx.restore();

      // Atmospheric Vignette
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H));
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.8, 'rgba(0,0,0,0.8)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  return (
    <div className={`fixed inset-0 z-[99999] bg-[#010101] flex items-center justify-center overflow-hidden px-4 py-0 font-mono select-none sm:px-8 ${matchLine ? 'animate-subtle-shake' : ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      
      {/* HUD OVERLAYS */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="scanline" />
        <div className="crt-overlay" />
        
        {/* CORNER DATA */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 lg:top-16 lg:left-16 flex flex-col gap-2 sm:gap-4 z-50 opacity-60">
           <div className="text-white font-black text-lg sm:text-2xl lg:text-3xl tracking-[0.4em] sm:tracking-[0.8em] italic filter">
             PREDATOR <span className="text-[#D4AF37]">ELITE</span>
           </div>
           <div className="h-[1px] w-32 sm:w-64 lg:w-96 bg-gradient-to-r from-[#D4AF37] to-transparent shadow-[0_0_10px_#D4AF37]" />
           <div className="text-white/30 text-[7px] sm:text-[10px] tracking-[0.6em] sm:tracking-[1em] uppercase font-bold">Кластер_Абсолютного_Інтелекту // v60.0</div>
        </div>

        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 lg:top-16 lg:right-16 flex flex-col items-end gap-1 sm:gap-2 z-50 opacity-40 text-right">
           <div className="text-[#D4AF37] font-black text-[8px] sm:text-xs tracking-[0.6em] sm:tracking-[1em] uppercase">ДОСТУП: ВЕХОВНИЙ_СУВЕРЕН</div>
           <div className="text-white/20 font-mono text-[7px] sm:text-[9px] uppercase tracking-widest italic">НЕЙРОННИЙ_ЩИТ_АКТИВНИЙ // 2048-Q Шифрування</div>
        </div>

        <Button variant="cyber" 
          onClick={() => {
            setPhase(3);
            sfx.playImpact();
            setTimeout(onComplete, 1000);
          }}
          className="absolute bottom-8 right-4 sm:bottom-16 sm:right-8 lg:bottom-32 lg:right-16 px-4 sm:px-6 py-2 border border-[#D4AF37]/30 text-[#D4AF37]/40 hover:text-[#D4AF37] hover:border-[#D4AF37] text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] uppercase transition-all z-50 pointer-events-auto bg-black/50"
        >
         ПРОПУСТИТИ ЗАСТАВКУ
        </Button>
      </div>

      {/* LEFT SIDE LOG STREAM */}
      <div className="absolute inset-y-0 left-4 sm:left-8 lg:left-20 flex items-center z-40 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-l border-[#D4AF37]/20 pl-3 sm:pl-6 lg:pl-10 space-y-3 sm:space-y-6"
        >
          <div className="text-[8px] sm:text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] mb-4 sm:mb-12 italic opacity-40">Журнал_Ініціалізації_Системи:</div>
          <div className="space-y-4">
            {bootLogs.map((log, i) => (
              <div key={i} className="text-[9px] font-mono text-white/20 tracking-[0.4em] flex items-center gap-5">
                <span className="w-1 h-4 bg-[#D4AF37]/30" />
                {`> ${log}`}
                <motion.span 
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-[#D4AF37]/40"
                >[ACK]</motion.span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 0 && (
          <div key="legal" className="flex h-full w-full items-center justify-center z-[100] px-4 sm:px-10">
            {renderLegalWarning()}
          </div>
        )}

        {phase === 1 && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(40px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(50px)', scale: 1.1 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="flex h-full w-full max-w-[92vw] flex-col items-center justify-center z-10 text-center"
          >
            <div className="mb-10 brightness-150 filter sm:mb-16">
               <GeometricRaptor className="h-[min(28vmin,14rem)] w-[min(28vmin,14rem)] text-[#D4AF37]" />
            </div>
            <h1 className="relative mb-8 max-w-full text-center text-[clamp(2rem,8vw,12rem)] font-thin uppercase leading-none tracking-[clamp(0.05em,1.2vw,0.5em)] text-white">
              PREDATOR
              <motion.div
                animate={{ opacity: [0.1, 0.4, 0.1], width: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-x-0 bottom-0 h-1 bg-[#D4AF37] blur-md mx-auto"
              />
            </h1>
            <p className="max-w-[90vw] text-center text-[clamp(0.5rem,1.2vw,0.875rem)] font-black uppercase tracking-[clamp(0.2em,1.5vw,2em)] text-[#D4AF37] opacity-20 italic">
               Світ — це дані. Ми — Предатори.
            </p>
          </motion.div>
        )}

        {phase === 1.5 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
          >
             <div className="relative flex h-[min(78vmin,800px)] w-[min(78vmin,800px)] items-center justify-center">
                <div className="absolute inset-0 border-[0.5px] border-[#D4AF37]/10 rounded-full animate-spin-slow opacity-10" />
                <div className="absolute inset-[clamp(60px,15vmin,160px)] sm:inset-40 border-[0.5px] border-[#D4AF37]/20 rounded-full animate-spin-reverse opacity-20" />
                <div className="absolute inset-[clamp(100px,25vmin,320px)] sm:inset-[160px] lg:inset-[320px] border-2 border-[#D4AF37]/40 rounded-full opacity-30" />
                
                <div className="relative max-w-[88vw] overflow-hidden border border-[#D4AF37]/20 bg-black/80 p-[clamp(2rem,7vmin,8rem)] text-center">
                   <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                   <div className="mb-8 text-[clamp(0.45rem,1.1vw,0.7rem)] font-black uppercase tracking-[clamp(0.45em,2.2vw,2em)] text-[#D4AF37] opacity-40 italic sm:mb-12">
                     Синхронізація_Нейронного_Ядра
                   </div>
                   <div className="mb-8 flex min-h-20 items-center justify-center text-[clamp(2rem,6vw,4.5rem)] font-light uppercase tracking-[clamp(0.16em,1.4vw,0.4em)] text-white sm:mb-10">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3], x: [-10, 0, 10] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                      >{targetLabel}</motion.span>
                   </div>
                   <div className="text-[#D4AF37]/30 text-[10px] tracking-[1em] font-mono uppercase italic border-t border-white/5 pt-8">
                      ЗАВАНТАЖЕННЯ: 3.42% // КЛАСТЕ : ГОТОВИЙ
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {phase === 2 && (
          <div className="w-full max-w-[92vw] h-full flex flex-col items-center justify-center gap-12 sm:gap-24 relative z-10 px-4 sm:px-24 overflow-y-auto py-8">
            <div className="text-[#D4AF37] text-sm tracking-[3em] uppercase font-black opacity-30 pb-12 border-b border-[#D4AF37]/10 w-full text-center italic">
               Глобальні_Протоколи_Вилучення
            </div>
            
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-32">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 sm:p-20 bg-black/70 border border-[#D4AF37]/10 flex flex-col gap-6 sm:gap-12 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]/60 shadow-[0_0_30px_#D4AF37]" />
                <div className="text-[#D4AF37] font-black tracking-[0.8em] text-[12px] uppercase opacity-40 italic"> [ ПОТІК_RAW_SIGINT ] </div>
                <div className="text-white font-mono text-lg sm:text-2xl leading-normal h-80 overflow-hidden break-all tracking-tight opacity-60 italic">
                  {sourceText}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="inline-block w-4 h-8 bg-[#D4AF37] ml-4 shadow-[0_0_20px_#D4AF37]"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-8 sm:p-20 bg-black/70 border border-[#D4AF37]/10 flex flex-col gap-6 sm:gap-12 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-1.5 h-full bg-[#D4AF37]/60 shadow-[0_0_30px_#D4AF37]" />
                <div className="text-[#D4AF37] font-black tracking-[0.8em] text-[12px] uppercase opacity-40 italic"> [ ВЕ ИФІКОВАНІ_ДАНІ ] </div>
                <div className="text-white font-mono text-lg sm:text-2xl leading-[2.5] h-80 overflow-hidden space-y-4 opacity-40 italic">
                  {["АНАЛІЗ ТРАНЗАКЦІЙ: ПРІОРИТЕТ 1", "МОНІТОРИНГ КО ДОНІВ: АКТИВНО", "ПОШУКрАНОМАЛІЙ: 0.042ms", "РИЗИК-П ОФІЛЮВАННЯ: ОМЕГА"].map((entry, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="flex items-center gap-4 sm:gap-8 border-b border-white/5 pb-4"
                    >
                       <span className="w-3 h-3 bg-[#D4AF37]/40 rotate-45" />
                       {entry}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Phase 2.5 removal: directly to final phase */}

        {phase === 3 && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full w-full max-w-[92vw] flex-col items-center justify-center z-10 text-center"
          >
            <div className="relative max-w-full overflow-hidden border-[0.5px] border-[#D4AF37]/30 bg-black p-[clamp(2.5rem,8vmin,12rem)]">
               <motion.div 
                animate={{ x: ['-200%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent skew-x-[-30deg]"
              />
              <h2 className="relative text-center text-[clamp(2.4rem,9vw,12rem)] font-thin uppercase leading-none tracking-[clamp(0.1em,1.7vw,0.6em)] text-white mix-blend-difference">
                 СИСТЕМА <span className="text-[#D4AF37]">ГОТОВА</span>
              </h2>
            </div>
            <div className="mt-12 max-w-[90vw] text-center text-[clamp(0.45rem,1.2vw,0.7rem)] font-black uppercase tracking-[clamp(0.3em,2.2vw,4em)] text-[#D4AF37] opacity-40 italic sm:mt-20">
               Протокол_Суверенітету_Активовано
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL FOOTER SYNC TICKER */}
      <div className="absolute bottom-0 w-full bg-black border-t border-[#D4AF37]/10 h-12 sm:h-16 flex items-center overflow-hidden z-[70] px-4 sm:px-8 lg:px-20 shadow-[0_-30px_60px_rgba(0,0,0,0.8)]">
        <div className="bg-[#050505] text-[#D4AF37] font-black px-3 sm:px-6 lg:px-10 h-full flex items-center tracking-[0.3em] sm:tracking-[0.6em] text-[9px] sm:text-[11px] border-r border-[#D4AF37]/30 skew-x-[-20deg] mr-4 sm:mr-8 lg:mr-16 shadow-[10px_0_30px_rgba(0,0,0,0.8)]">
           ЦЕНТРАЛЬНЕ_ЯДРО_КИЇВ
        </div>
        <div className="flex animate-ticker whitespace-nowrap gap-32 text-white/20 font-mono text-[10px] tracking-[0.6em] items-center italic">
          {[...Array(5)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="text-[#D4AF37]/80">КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО</span>
              <span>GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ...</span>
              <span className="text-white/40">НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48%</span>
              <span className="text-[#D4AF37]/80">ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ</span>
              <span>ЗАТрИМКА: 0.000042ms</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 40s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 25s linear infinite;
        }
        .scanline {
          width: 100%;
          height: 4px;
          background: rgba(212, 175, 55, 0.05);
          position: absolute;
          top: 0;
          z-index: 100;
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }
        @keyframes scanline {
          0% { top: -100%; }
          100% { top: 100%; }
        }
        .crt-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.01), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.01));
          background-size: 100% 4px, 4px 100%;
          z-index: 95;
          pointer-events: none;
          opacity: 0.3;
        }
        @keyframes subtle-shake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-3px, 3px); }
          50% { transform: translate(3px, -3px); }
          75% { transform: translate(-3px, -3px); }
          100% { transform: translate(0, 0); }
        }
        .animate-subtle-shake {
          animation: subtle-shake 0.15s infinite;
        }
      `}</style>
    </div>
  );
};

export default BootSequenceELITE;
