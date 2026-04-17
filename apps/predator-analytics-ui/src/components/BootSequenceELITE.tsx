import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeometricRaptor } from './Logo';

/**
 * 🦅 PREDATOR OS — BOOT SEQUENCE v57.2 «PREDATOR_WRATH»
 * ====================================================
 * A terrifyingly powerful visualization of mass data parsing and matching.
 * Features: Typewriter audio/visuals, Ominous drones, Cross-registry matching.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   WRATH AUDIO ENGINE (Synthesized Fear & Mechanics)
   ─────────────────────────────────────────────────────────────────────────── */
class WrathAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  /** Deep ominous drone to instill fear */
  playOminousDrone() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(32.70, this.ctx.currentTime); // C1
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(33.22, this.ctx.currentTime); // Detuned
    
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 2);
    
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(100, this.ctx.currentTime);
    lpf.Q.setValueAtTime(10, this.ctx.currentTime);

    osc1.connect(lpf); osc2.connect(lpf);
    lpf.connect(g); g.connect(this.master);
    
    osc1.start(); osc2.start();
  }

  /** Sharp typewriter click */
  playTypeclick() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1500, this.ctx.currentTime);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
    
    g.gain.setValueAtTime(0.05, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
    
    osc.connect(filter); filter.connect(g); g.connect(this.master);
    osc.start(); osc.stop(this.ctx.currentTime + 0.05);
  }

  /** Alert for data match */
  playMatchFlash() {
    this.init();
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.2, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(g); g.connect(this.master);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  }
}

const sfx = new WrathAudioEngine();

/* ─────────────────────────────────────────────────────────────────────────────
   ANALYTICAL MODULES
   ─────────────────────────────────────────────────────────────────────────── */
const RAW_SOURCES = [
  "TCP:192.168.1.104 -> INCOMING_ENCRYPTED_STREAM",
  "DB_DUMP_EXPORT_V4_LTD_CYPRUS",
  "X-REGISTRY_EXPOSURE_LIST_2026",
  "GLOBAL_TRANSIT_MANIFEST_UA_CUSTOMS",
  "ANONYMOUS_LEAK_SWIFT_TRANSFERS_PART_A",
];

const REGISTRY_ENTRIES = [
  "ID: 28491023 | STATUS: ACTIVE_SEARCH",
  "NAME: REDACTED | TAX_ID: 3049103948",
  "ASSET: REAL_ESTATE_LONDON_MAYFAIR",
  "CONNECTION: OFFSHORE_ENTITY_Z",
  "MATCH: CRITICAL_FINANCIAL_FRAUD_FLAG",
];

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
const BootSequenceELITE: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [sourceText, setSourceText] = useState("");
  const [registryText, setRegistryText] = useState("");
  const [matchLine, setMatchLine] = useState(false);
  const startTime = useRef(Date.now());
  const particles = useRef<{ x: number; y: number; z: number; px: number; py: number; c: string }[]>([]);

  // Simulation loop for typewriter effect
  useEffect(() => {
    if (phase === 2) {
      let sIdx = 0;
      let rIdx = 0;
      const sTarget = RAW_SOURCES[Math.floor(Math.random() * RAW_SOURCES.length)];
      const rTarget = REGISTRY_ENTRIES[Math.floor(Math.random() * REGISTRY_ENTRIES.length)];

      const interval = setInterval(() => {
        if (sIdx < sTarget.length) {
          setSourceText(prev => prev + sTarget[sIdx]);
          sIdx++;
          sfx.playTypeclick();
        } else if (rIdx < rTarget.length) {
          setRegistryText(prev => prev + rTarget[rIdx]);
          rIdx++;
          sfx.playTypeclick();
        } else {
          setMatchLine(true);
          sfx.playMatchFlash();
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    particles.current = Array.from({ length: 800 }, () => ({
      x: (Math.random() - 0.5) * 4000,
      y: (Math.random() - 0.5) * 4000,
      z: Math.random() * 4000,
      px: 0,
      py: 0,
      c: Math.random() > 0.9 ? '#FACC15' : '#78350F'
    }));
  }, []);

  useEffect(() => {
    let frame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const elapsed = Date.now() - startTime.current;
      const W = canvas.width = window.innerWidth;
      const H = canvas.height = window.innerHeight;
      const cx = W / 2, cy = H / 2;

      ctx.fillStyle = '#010101';
      ctx.fillRect(0, 0, W, H);

      // Phases control
      if (elapsed < 2000 && phase !== 0) { setPhase(0); sfx.playOminousDrone(); }
      else if (elapsed >= 2000 && elapsed < 4500 && phase !== 1) setPhase(1);
      else if (elapsed >= 4500 && elapsed < 8000 && phase !== 2) setPhase(2);
      else if (elapsed >= 8000 && elapsed < 10000 && phase !== 3) setPhase(3);
      else if (elapsed >= 10000) { onComplete(); return; }

      // 3D Particles + Glitch Lines
      const speed = phase >= 2 ? 40 : 5;
      ctx.save();
      ctx.translate(cx, cy);
      particles.current.forEach((p, i) => {
        p.z -= speed;
        if (p.z <= 0) p.z = 4000;
        const sx = p.x / (p.z / 1000);
        const sy = p.y / (p.z / 1000);
        if (p.px !== 0) {
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = p.c + Math.floor(Math.min(1, 1 - p.z / 4000) * 150).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.stroke();

          if (phase === 2 && Math.random() > 0.999 && matchLine) {
            ctx.beginPath();
            ctx.moveTo(-W/2, sy);
            ctx.lineTo(W/2, sy);
            ctx.strokeStyle = '#D4AF37';
            ctx.stroke();
          }
        }
        p.px = sx; p.py = sy;
      });
      ctx.restore();

      // Matrix-like code curtains
      if (phase === 2) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
        for(let i=0; i<30; i++) {
          ctx.fillText(Math.random().toString(36).substring(7), Math.random()*W, Math.random()*H);
        }
      }

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [onComplete, phase, matchLine]);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#010101] flex items-center justify-center overflow-hidden font-mono select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* SCANNING OVERLAY */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-1 bg-gold-500/10 absolute animate-scan-line shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
      </div>

      {/* HUD: TOP STATUS */}
      <div className="absolute top-10 inset-x-10 flex justify-between items-start opacity-40">
        <div className="border border-gold-900/50 p-2 bg-black">
          <div className="text-[10px] text-gold-500 font-black">X-OSINT // DEEP_PARSER_V8</div>
          <div className="text-[8px] text-gold-700">KERNEL_STATE: AGGRESSIVE_SCAN</div>
        </div>
        <div className="text-right border border-gold-900/50 p-2 bg-black">
          <div className="text-[10px] text-gold-500 font-black tracking-tighter uppercase">Суверенна Система Аналітики</div>
          <div className="text-[8px] text-gold-700 uppercase">Повна Конфіденційність Мережі</div>
        </div>
      </div>

      {/* CORE EXPERIENCE */}
      <AnimatePresence mode="wait">
        {phase === 1 && (
          <motion.div 
            key="logo"
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -100 }}
            className="flex flex-col items-center"
          >
            <GeometricRaptor className="w-32 h-32 mb-8 filter drop-shadow-[0_0_20px_#D4AF37]" />
            <h1 className="text-gold-500 text-5xl font-black tracking-[1em] uppercase">
              Predator
            </h1>
          </motion.div>
        )}

        {phase === 2 && (
          <div className="w-full max-w-6xl flex flex-col items-center gap-12 relative z-10 px-10">
            <div className="w-full flex justify-between gap-10">
              {/* SOURCE A */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 border border-gold-600/30 p-6 bg-black/80 backdrop-blur-xl relative"
              >
                <div className="absolute -top-3 left-4 px-2 bg-gold-600 text-black text-[9px] font-black uppercase">Source_A: Encrypted_LTS</div>
                <div className="text-gold-400 text-sm break-all leading-tight h-20 overflow-hidden font-mono">
                  {sourceText}
                  <span className="animate-pulse">_</span>
                </div>
              </motion.div>

              {/* REGISTRY MATCH */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 border border-gold-600/30 p-6 bg-black/80 backdrop-blur-xl relative"
              >
                <div className="absolute -top-3 left-4 px-2 bg-gold-600 text-black text-[9px] font-black uppercase">Registry_Core: ДРРП_ЄДРПОУ</div>
                <div className="text-gold-400 text-sm break-all leading-tight h-20 overflow-hidden font-mono">
                  {registryText}
                  <span className="animate-pulse">_</span>
                </div>
              </motion.div>
            </div>

            {/* MATCH INDICATOR */}
            <AnimatePresence>
              {matchLine && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="h-20 w-px bg-gold-500 shadow-[0_0_20px_#D4AF37]" />
                  <div className="px-10 py-2 border-2 border-gold-500 bg-gold-500/10 text-gold-500 font-black text-xl tracking-[0.3em] uppercase animate-pulse">
                    Збіг Підтверджено
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {phase === 3 && (
          <motion.div 
            key="final"
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="p-16 border-4 border-gold-600 bg-black relative shadow-[0_0_100px_rgba(212,175,55,0.4)]">
              <div className="absolute inset-2 border border-gold-600/30" />
              <h2 className="text-gold-500 text-6xl font-black uppercase tracking-tighter">
                Доступ Надано
              </h2>
            </div>
            <p className="mt-8 text-gold-600 font-black tracking-[0.5em] uppercase opacity-50 animate-pulse">
              Ніхто не сховається
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes scan-line {
          0% { top: 0% }
          100% { top: 100% }
        }
        .animate-scan-line {
          animation: scan-line 4s linear infinite;
        }
        .text-gold-400 { color: #facc15; }
        .text-gold-500 { color: #D4AF37; }
        .text-gold-600 { color: #ca8a04; }
        .text-gold-700 { color: #a16207; }
        .text-gold-900 { color: #713f12; }
        .bg-gold-500 { background-color: #D4AF37; }
        .bg-gold-600 { background-color: #ca8a04; }
        .bg-gold-900 { background-color: #713f12; }
        .border-gold-500 { border-color: #D4AF37; }
        .border-gold-600 { border-color: #ca8a04; }
        .border-gold-900 { border-color: #713f12; }
      `}</style>
    </div>
  );
};

export default BootSequenceELITE;
