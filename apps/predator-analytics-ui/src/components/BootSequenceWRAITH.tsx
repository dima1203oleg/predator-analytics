import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricRaptor } from './Logo';

/**
 * 🦅 PREDATOR Analytics // BOOT SEQUENCE v57.5 «APEX PREDATOR»
 * ====================================================
 * Вражаюча, страхітлива візуалізація ініціалізації суверенного ядра аналітики 
 * світового класу (Оціночна вартість системи: > $1.5 Мільярда).
 * v57.5-APEX · Absolute Sovereign Power Design
 * 
 * © 2026 PREDATOR Analytics — HR-04 Compliant
 */

/* ─────────────────────────────────────────────────────────────────────────────
   APEX AUDIO ENGINE (High-Fidelity Synthesized Fear, Bass Drops, Mechanics)
   ─────────────────────────────────────────────────────────────────────────── */
class ApexAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();
      
      // Налаштування для "брутального" звуку
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

  /** Глибокий промисловий гул та хвилюючі вібрації (Суверенне ядро) */
  playQuantumHum() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    
    // Створюємо низькочастотний дрон з амплітудною модуляцією (vibrations)
    const createDrone = (freq: number, type: OscillatorType, gainVal: number, lfoFreq: number = 0) => {
      if (!this.ctx || !this.master) return;
      const osc = this.ctx.createOscillator();
      const mainGain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      
      // Частотна модуляція (дрижання тембру)
      const fm = this.ctx.createOscillator();
      const fmGain = this.ctx.createGain();
      fm.frequency.setValueAtTime(2 + Math.random(), now);
      fmGain.gain.setValueAtTime(3, now);
      fm.connect(fmGain);
      fmGain.connect(osc.frequency);
      fm.start();

      // Амплітудна модуляція (хвилюючі коливання гучності)
      if (lfoFreq > 0) {
        lfo.frequency.setValueAtTime(lfoFreq, now);
        lfoGain.gain.setValueAtTime(0.4, now); // Глибина коливань
        lfo.connect(lfoGain);
        
        const amGain = this.ctx.createGain();
        amGain.gain.setValueAtTime(1, now);
        lfoGain.connect(amGain.gain);
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(gainVal, now + 5);
        
        osc.connect(amGain);
        amGain.connect(this.master);
      } else {
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(gainVal, now + 5);
        osc.connect(mainGain);
        mainGain.connect(this.master);
      }

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.Q.value = 10;

      osc.start();
      lfo.start();
    };

    // Стрій: Суб-бас + Дисонанс (для страху)
    createDrone(30.0, 'sawtooth', 0.5, 0.8); // Глибокий гул з повільним коливанням
    createDrone(31.5, 'square', 0.3, 1.2);   // Дисонуюча частота (біття)
    createDrone(45.0, 'sine', 0.4, 0.5);     // Основна маса
    createDrone(22.0, 'triangle', 0.4, 3.0); // Низькочастотна вібрація (тривожне тремтіння)
  }

  /** Масивний тектонічний удар (State Impact) */
  playHeartbeatImpact() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const noise = this.ctx.createBufferSource();

    // Синтез важкого удару
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, now);
    
    g.gain.setValueAtTime(2.0, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    // Додаємо низькочастотний тріск
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    noise.buffer = buffer;

    osc.connect(filter);
    filter.connect(g);
    noise.connect(g);
    g.connect(this.master);

    osc.start();
    noise.start();
    osc.stop(now + 2.1);
  }

  /** Важкий механічний звук (Heavy Switch / Relay) */
  playTypeclick() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    const bufferSize = 0.1 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.master);

    noise.start();
  }

  /** Прорив системи / Тривожний сигнал (Apex Breakthrough) */
  playApexMatchFlash() {
    this.init();
    if (!this.ctx || !this.master) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(30, now);
    osc.frequency.linearRampToValueAtTime(5, now + 3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.Q.value = 20;

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1.2, now + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + 4);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.master);

    osc.start();
    osc.stop(now + 4);
  }
}

const sfx = new ApexAudioEngine();

/* ─────────────────────────────────────────────────────────────────────────────
   ANALYTICAL MODULES (Ukrainian Localized - Apex Level Intelligence)
   ─────────────────────────────────────────────────────────────────────────── */
const RAW_SOURCES = [
  "RTGS:X-LINK // СИНХРОНІЗАЦІЯ_БАНКІВСЬКИХ_РЕЗЕРВІВ_TIER-1",
  "SIGINT:ОКЕАНІЧНИЙ_КАБЕЛЬ_A12 // ГЛОБАЛЬНЕ_ПЕРЕХОПЛЕННЯ_G7",
  "GEO-TEL:СУПУТНИК_ELITE-X // ДОСТУП_ДО_ТЕЛЕМЕТРІЇ_NVIDIA_GRID",
  "NEURAL:PARSER-v14 // АНАЛІЗ_КОГНІТИВНИХ_ВІДХИЛЕНЬ_БОРЖНИКІВ",
  "QUANTUM:L-BIT // ДЕКРИПТАЦІЯ_SWIFT_MT103_РЕАЛЬНИЙ_ЧАС",
  "OSINT:DARK-FEED-8 // МОНІТОРИНГ_КРИПТО-АРХІПЕЛАГІВ",
  "K-API:G6-ACCESS // МАГІСТРАЛЬ_ДФС_ТА_МИТНОЇ_СЛУЖБИ",
  "HYPER-DATA:DEEP_LIQUIDITY // ВІДСТЕЖЕННЯ_ОФШОРНИХ_ХАБІВ",
];

const REGISTRY_ENTRIES = [
  "UEID: 0x9F2E-44 // АРХІВ: ЦИТАДЕЛЬ // КЛАСИФІКОВАНО",
  "АКТИВ: ТЕРМІНАЛ_ПОРТ_ОДЕСА // СТАТУС: ПОВНИЙ_КОНТРОЛЬ",
  "ОБ'ЄКТ: СИНДИКАТ_ВОСТОК // РИЗИК: 9.9/10 // ЛІКВІДАЦІЯ",
  "ТРАНЗАКЦІЯ: $1.42B // ВЕКТОР: ЖЕНЕВА-СІНГАТУР",
  "ЗВ'ЯЗОК: 42_ФРОНТ-КОМПАНІЇ_ВИЯВЛЕНО [МЕРЕЖЕВИЙ_ГРАФ]",
  "ПРОТОКОЛ: КОНФІСКАЦІЯ_АКТИВІВ_ЗА_ПРОТОКОЛОМ_7",
  "HUB: DUBAI_INTELLIGENCE // SYNC: СТАБІЛЬНО",
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
const BootSequenceWRAITH: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<0 | 1 | 1.5 | 2 | 2.5 | 3 | 4>(0);
  const [sourceText, setSourceText] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [matchLine, setMatchLine] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const startTime = useRef(Date.now());
  const particles = useRef<{ x: number; y: number; z: number; px: number; py: number; c: string }[]>([]);

  // Legal Warning Component
  const renderLegalWarning = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      className="max-w-5xl p-16 border border-[#222] bg-black/95 backdrop-blur-3xl relative overflow-hidden shadow-[0_0_150px_rgba(0,0,0,1)]"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/30" />
      <div className="flex items-center gap-6 mb-12">
        <div className="w-12 h-12 border-4 border-red-600 animate-pulse flex items-center justify-center font-black text-red-600">!</div>
        <div className="text-red-600 font-bold text-4xl tracking-[0.3em] uppercase">
          СУВЕРЕННИЙ ЦЕНТР: ЗАСТЕРЕЖЕННЯ
        </div>
      </div>
      
      <div className="space-y-8 text-white/50 font-mono text-base leading-relaxed border-l border-white/10 pl-10">
        <p>
          ВИ ВХОДИТЕ В ЕКОСИСТЕМУ <span className="text-white font-bold">PREDATOR Analytics v57.5-APEX</span>. 
          ЦЯ СИСТЕМА ПРИЗНАЧЕНА ДЛЯ СТРАТЕГІЧНОГО МОНІТОРИНГУ ДЕРЖАВНОЇ БЕЗПЕКИ ТА ФІНАНСОВОГО СУВЕРЕНІТЕТУ.
        </p>
        <p className="text-red-500/80 font-bold italic">
          ПРОТОКОЛ "ЯСНОВИДЕЦЬ" АКТИВОВАНО. КОЖЕН БІТ ВАШОЇ ТРАЕКТОРІЇ ПІДПОРЯДКОВАНИЙ НЕЙРОННОМУ АНАЛІЗУ. 
          НЕАВТОРИЗОВАНІ ДІЇ ПРИЗВЕДУТЬ ДО НЕГАЙНОЇ БЛОКИРОВКИ ТА ПЕРЕДАЧІ ДАНИХ ДО ВІДПОВІДНИХ СЛУЖБ.
        </p>
        <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] tracking-widest text-white/20 uppercase">
          <div>INFRA_COST: $1,570,000,000 USD</div>
          <div>AUTH_METHOD: NEURAL_SIGNATURE_v4</div>
          <div>ENCRYPTION: QUANTUM_LATTICE_2048</div>
          <div>NODE: KYIV_CENTRAL_HUB</div>
        </div>
      </div>
      
      <div className="mt-16 flex justify-between items-center">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-red-600 animate-ping" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-white font-mono text-sm tracking-[0.5em]"
        >
          ЧЕКАЙТЕ... ІНІЦІАЛІЗАЦІЯ ЯДРА
        </motion.div>
      </div>
    </motion.div>
  );
  
  // Ініціалізація Grid та вузлів розвідки
  useEffect(() => {
    particles.current = Array.from({ length: 1200 }, () => ({
      x: (Math.random() - 0.5) * 5000,
      y: (Math.random() - 0.5) * 5000,
      z: Math.random() * 5000,
      px: 0, py: 0,
      c: Math.random() > 0.95 ? '#D4AF37' : '#222'
    }));
  }, []);

  // Суворий потік логів
  useEffect(() => {
    const logs = [
      "BOOT: PRIMARY_KERNELS_LOADED [v57.5.0]",
      "STORAGE: ATTACHING NEURAL_STORAGE // 12.8 EB",
      "CORE: SYNCING WITH GLOBAL_INTEL_H100 [READY]",
      "NETWORK: SECURE_TUNNEL_ESTABLISHED (AES-Q)",
      "SIGINT: SCANNING GLOBAL_CASH_FLOWS...",
      "AUTH: OMEGA_ELITE CLEARANCE VERIFIED",
      "SYSTEM: SOVEREIGN_OVERRIDE_ACTIVE",
      "READY: PREDATOR_AWAKENED.",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setBootLogs(prev => [...prev.slice(-12), logs[i]]);
        sfx.playTypeclick();
        if (i % 3 === 0) sfx.playHeartbeatImpact();
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    let frame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPhase = phase;

    const drawGrid = (w: number, h: number, opacity: number) => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.05})`;
      ctx.lineWidth = 0.5;
      const step = 60;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    };

    const drawMap = (elapsed: number, w: number, h: number) => {
      const cx = w / 2, cy = h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(elapsed / 10000);
      
      // Draw world-like points
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const dist = 300 + Math.sin(elapsed / 1000 + i) * 20;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = i % 5 === 0 ? '#D4AF37' : 'rgba(255,255,255,0.2)';
        ctx.fill();
        
        if (i % 8 === 0) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(x, y); ctx.stroke();
        }
      }
      ctx.restore();
    };

    const render = () => {
      const elapsed = Date.now() - startTime.current;
      const W = canvas.width = window.innerWidth;
      const H = canvas.height = window.innerHeight;
      const cx = W / 2, cy = H / 2;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, W, H);

      // Phases control (Sovereign Pacing)
      if (elapsed < 8000 && localPhase !== 0) { localPhase = 0; setPhase(0); sfx.playQuantumHum(); }
      else if (elapsed >= 8000 && elapsed < 20000 && localPhase !== 1) { localPhase = 1; setPhase(1); }
      else if (elapsed >= 20000 && elapsed < 45000 && localPhase !== 1.5) { localPhase = 1.5; setPhase(1.5); }
      else if (elapsed >= 45000 && elapsed < 75000 && localPhase !== 2) { localPhase = 2; setPhase(2); }
      else if (elapsed >= 75000 && elapsed < 100000 && localPhase !== 2.5) { localPhase = 2.5; setPhase(2.5); sfx.playApexMatchFlash(); }
      else if (elapsed >= 100000 && localPhase < 3) { localPhase = 3; setPhase(3); sfx.playApexMatchFlash(); }
      
      if (elapsed >= 130000 && localPhase < 4) { onComplete(); }

      drawGrid(W, H, 0.4);

      if (localPhase === 1.5) {
        drawMap(elapsed, W, H);
      }

      // Starfield / Data points
      const speed = localPhase >= 2 ? (localPhase === 3 ? 150 : 80) : 8;
      ctx.save();
      ctx.translate(cx, cy);
      particles.current.forEach((p) => {
        p.z -= speed;
        if (p.z <= 0) p.z = 5000;
        const sx = p.x / (p.z / 1000);
        const sy = p.y / (p.z / 1000);
        if (Math.abs(sx) < W && Math.abs(sy) < H && p.px !== 0) {
          ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(sx, sy);
          ctx.strokeStyle = p.c + Math.floor(Math.min(1, 1-p.z/5000)*40).toString(16).padStart(2,'0');
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        p.px = sx; p.py = sy;
      });
      ctx.restore();

      // Noise grain
      ctx.fillStyle = `rgba(255,255,255,${0.02 * Math.random()})`;
      ctx.fillRect(0, 0, W, H);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [onComplete, phase]);

  // Target Label updates
  useEffect(() => {
    if (phase === 1.5) {
      const labels = ["NODE_SCAN: ZURICH", "AUTH: OMEGA_ELITE", "DATA: 12.8 EB", "TARGET: GLOBAL_SHADOW", "HUB: SINGAPORE"];
      let i = 0;
      const interval = setInterval(() => {
        setTargetLabel(labels[i % labels.length]);
        i++;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Parsing Text updates
  useEffect(() => {
    if (phase === 2) {
      let sIdx = 0;
      const sTarget = RAW_SOURCES[Math.floor(Math.random() * RAW_SOURCES.length)];
      const interval = setInterval(() => {
        if (sIdx < sTarget.length) {
          setSourceText(prev => prev + sTarget[sIdx]);
          sIdx++;
          sfx.playTypeclick();
        } else {
          setMatchLine(true);
          sfx.playApexMatchFlash();
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className={`fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center overflow-hidden font-mono select-none ${matchLine ? 'animate-subtle-shake' : ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* SCANNING OVERLAY */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.95)_100%)] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none z-10" />
        <div className="scanline" />
        <div className="crt-overlay" />
        
        {/* STATUS MARKINGS */}
        <div className="absolute top-10 left-12 flex flex-col gap-2 z-50 opacity-40">
           <div className="text-white font-black text-xl tracking-[0.5em] italic drop-shadow-[0_0_10px_white]">SOVEREIGN // v57.5-APEX</div>
           <div className="h-[2px] w-64 bg-white/20" />
           <div className="text-white/40 text-[10px] tracking-widest uppercase font-bold">Absolute Intelligence Command</div>
        </div>
        
        <div className="absolute top-10 right-12 flex flex-col items-end gap-2 z-50 opacity-40 text-right">
           <div className="text-yellow-600 font-black text-sm tracking-widest uppercase">CLEARANCE: OMEGA_ELITE</div>
           <div className="text-white/40 font-mono text-[9px] uppercase tracking-tighter">Cluster Security: 100.0% // NEURAL_LOCKED</div>
        </div>
      </div>

      {/* HUD: DATA STREAM */}
      <div className="absolute top-24 inset-x-28 flex justify-between items-start z-40">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-l border-white/10 pl-10 py-6 bg-black/60 backdrop-blur-2xl max-w-sm border-y border-white/5"
        >
          <div className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.4em] mb-6">Системний Лог Ядра:</div>
          <div className="space-y-3">
            {bootLogs.map((log, i) => (
              <div key={i} className="text-[10px] font-mono text-white/40 tracking-widest italic truncate flex items-center gap-3">
                <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                {`> ${log || ''}`}
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-right border-r border-white/10 pr-10 py-6 bg-black/60 backdrop-blur-2xl border-y border-white/5"
        >
          <div className="text-[11px] text-white/40 font-black tracking-[0.3em] mb-6 uppercase">Статус Когнітивного Кластера:</div>
          <div className="text-[10px] text-white/20 font-mono text-right space-y-2 italic">
             <div>H100_NODES: 16,384 [ONLINE]</div>
             <div>COGNITIVE_SYNC: 0.0004ms</div>
             <div>THERMAL_STATE: CRYOGENIC</div>
             <div>DATA_FLOW: 12.8 Tbit/s</div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 0 && (
          <div key="legal" className="flex items-center justify-center min-h-screen z-[100]">
            {renderLegalWarning()}
          </div>
        )}

        {phase === 1 && (
          <motion.div 
            key="logo"
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '4em' }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(30px)' }}
            transition={{ duration: 5 }}
            className="flex flex-col items-center z-10"
          >
            <div className="mb-20 opacity-50 scale-110 grayscale brightness-200">
               <GeometricRaptor className="w-48 h-48 text-white" />
            </div>
            <h1 className="text-white text-9xl font-thin uppercase tracking-inherit drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              PREDATOR
            </h1>
            <div className="h-[1px] w-[800px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-16" />
            <p className="text-white/30 text-[12px] mt-10 tracking-[2em] uppercase font-light">
               Sovereign Intelligence Domain
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
             <div className="relative w-[600px] h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 border-[2px] border-white/5 rounded-full animate-spin-slow" />
                <div className="absolute inset-20 border border-white/10 rounded-full animate-spin-reverse" />
                <div className="absolute inset-40 border-[4px] border-yellow-700/20 rounded-full animate-pulse" />
                
                <div className="text-center bg-black/80 p-12 backdrop-blur-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)]">
                   <div className="text-[14px] text-yellow-600 font-black tracking-[0.8em] uppercase mb-6 drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                     ГЛОБАЛЬНЕ ТАРГЕТУВАННЯ
                   </div>
                   <div className="text-white text-5xl font-thin tracking-[0.3em] uppercase mb-8 h-16 flex items-center justify-center">
                      {targetLabel}
                   </div>
                   <div className="text-white/30 text-[10px] tracking-widest font-mono uppercase">
                      HUB_SYNC: 100% // SCANNING_VECTOR_Z
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {phase === 2 && (
          <div className="w-full max-w-[95vw] flex flex-col items-center gap-16 relative z-10 px-12">
            <div className="text-red-600/90 bg-red-950/20 border border-red-900/40 px-12 py-3 text-[16px] tracking-[2.5em] uppercase font-black rounded backdrop-blur-xl shadow-[0_0_100px_rgba(255,0,0,0.1)]">
               КРИТИЧНА КОНВЕРГЕНЦІЯ ДАНИХ
            </div>
            
            <div className="w-full grid grid-cols-2 gap-24">
              <motion.div 
                initial={{ opacity: 0, x: -400, skewX: 10 }}
                animate={{ opacity: 1, x: 0, skewX: 0 }}
                className="flex-1 border-[4px] border-red-900/40 p-16 bg-black flex flex-col gap-10 relative overflow-hidden rounded-3xl"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-red-600 shadow-[0_0_30px_red]" />
                <div className="text-red-500 font-black tracking-widest text-[14px] uppercase opacity-50 border-b border-red-900/30 pb-4"> RAW_INTEL_STREAM:</div>
                <div className="text-red-500 text-3xl font-mono font-bold leading-tight h-80 overflow-hidden break-all tracking-tighter italic">
                  {sourceText}
                  <span className="inline-block w-4 h-8 bg-red-500 ml-2 animate-pulse" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 400, skewX: -10 }}
                animate={{ opacity: 1, x: 0, skewX: 0 }}
                className="flex-1 border-[4px] border-yellow-900/40 p-16 bg-black flex flex-col gap-10 relative overflow-hidden rounded-3xl"
              >
                <div className="absolute top-0 right-0 w-2 h-full bg-yellow-600 shadow-[0_0_30px_gold]" />
                <div className="text-yellow-600 font-black tracking-widest text-[14px] uppercase opacity-50 border-b border-yellow-900/30 pb-4"> CROSS_REFERENCE_SYNC:</div>
                <div className="text-yellow-600 text-3xl font-mono leading-relaxed h-80 overflow-hidden italic space-y-2 opacity-80">
                  {REGISTRY_ENTRIES.map((entry, idx) => (
                    <div key={idx} className="border-l-2 border-yellow-900/50 pl-4 mb-3">
                       {`> ${entry}`}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {matchLine && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1.2, filter: 'blur(0px)' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-12"
              >
                <div className="h-48 w-[4px] bg-red-600 shadow-[0_0_50px_red]" />
                <div className="px-32 py-16 bg-black border-[10px] border-red-600 text-red-600 font-black text-7xl tracking-[0.4em] uppercase text-center backdrop-blur-3xl shadow-[0_0_200px_red] skew-x-[-10deg]">
                   ЦІЛЬ<br/>ВИЯВЛЕНО
                </div>
                <div className="h-48 w-[4px] bg-red-600 shadow-[0_0_50px_red]" />
              </motion.div>
            )}
          </div>
        )}

        {phase === 2.5 && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-24 z-50"
          >
            <div className="text-center">
               <h2 className="text-white text-7xl font-thin tracking-[1em] uppercase mb-4 drop-shadow-[0_0_20px_white]">ВИБІР ВЕКТОРА</h2>
               <div className="h-1 w-[600px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto" />
            </div>
            
            <div className="grid grid-cols-3 gap-12 w-full max-w-7xl">
              {[
                { id: 'OPERATIONAL', label: 'ОПЕРАТИВНИЙ', desc: 'ПОВНИЙ КОНТРОЛЬ ПОЛЕПШЕННЯ' },
                { id: 'STRATEGIC', label: 'СТРАТЕГІЧНИЙ', desc: 'АНАЛІТИКА ВИЩОГО РІВНЯ' },
                { id: 'SIGINT', label: 'SIGINT', desc: 'ГЛОБАЛЬНЕ ПЕРЕХОПЛЕННЯ' }
              ].map((m) => (
                <motion.button
                  key={m.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(212,175,55,0.4)', scale: 1.05 }}
                  onClick={() => {
                    sfx.playApexMatchFlash();
                    setPhase(3);
                  }}
                  className="bg-black/80 border border-white/5 p-20 text-center transition-all duration-700 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-white/10 italic">NODE_ALPHA_{Math.floor(Math.random()*99)}</div>
                  <div className="text-white font-light tracking-[0.6em] text-2xl mb-6">{m.label}</div>
                  <div className="text-white/20 text-[10px] tracking-[0.4em] uppercase font-bold">{m.desc}</div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-white opacity-0 group-hover:opacity-100 transition-all duration-700" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 3 && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center z-10"
          >
            <div className="p-40 border-[20px] border-double border-red-700 bg-black relative shadow-[0_0_300px_rgba(255,0,0,0.6)] skew-x-[-8deg]">
              <motion.div 
                animate={{ opacity: [0.1, 0.5, 0.1] }}
                transition={{ repeat: Infinity, duration: 0.1 }}
                className="absolute inset-0 bg-red-600/20"
              />
              <h2 className="text-white text-[15rem] font-black tracking-tighter leading-none text-center italic">
                ДОСТУП<br/>
                <span className="text-yellow-600 drop-shadow-[5px_5px_0_#000]">НАДАНО</span>
              </h2>
            </div>
            <div className="mt-20 text-yellow-600 text-2xl font-black tracking-[1.5em] uppercase animate-pulse">
               PREDATOR ONLINE // WELCOME COMMANDER
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 w-full bg-[#050505] border-t border-white/5 h-12 flex items-center overflow-hidden z-[70] px-12">
        <div className="bg-[#111] text-red-600 font-black px-6 h-full flex items-center tracking-widest text-[11px] border-r border-white/10 skew-x-[-15deg] mr-8">
           CENTRAL_OSINT_NODE
        </div>
        <div className="flex animate-ticker whitespace-nowrap gap-20 text-white/20 font-mono text-[10px] tracking-widest items-center">
          {[...Array(5)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="text-yellow-600/50">KYIV_HUB: {8000 + i * 12} NODES SYNCED</span>
              <span>ENTITY_SHOCK: DETECTED IN PORT_ODESA</span>
              <span className="text-red-600/50">TRANS_ALERT: $4.2B CRYPTO_EXIT v.9.41</span>
              <span>LATENCY: 0.0042ms</span>
              <span>UPTIME: 1,442 DAYS</span>
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
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 12s linear infinite;
        }
        .scanline {
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.03);
          position: absolute;
          top: 0;
          z-index: 100;
          animation: scanline 6s linear infinite;
          pointer-events: none;
        }
        @keyframes scanline {
          0% { top: -100%; }
          100% { top: 100%; }
        }
        .crt-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.01), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.01));
          background-size: 100% 3px, 3px 100%;
          z-index: 95;
          pointer-events: none;
          opacity: 0.4;
        }
        @keyframes subtle-shake {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, -2px); }
          100% { transform: translate(0, 0); }
        }
        .animate-subtle-shake {
          animation: subtle-shake 0.1s infinite;
        }
        .authoritative-text {
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
          letter-spacing: 0.4em;
        }
      `}</style>
    </div>
  );
};

export default BootSequenceWRAITH;
