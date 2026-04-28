import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** 
 * 🔥 PREDATOR OS — BOOT SEQUENCE v8.0 «ULTIMATE WAR ROOM»
 * 11.0 Seconds of pure power. Merged with Sovereign Visuals.
 */

// Генератор випадкового hex рядка
const rndHex = (len = 8) =>
  Math.floor(Math.random() * Math.pow(16, len)).toString(16).toUpperCase().padStart(len, '0');

/* ─────────────────────────────────────────────────────────────────────────────
   ULTIMATE AUDIO ENGINE v8.0 (Merged with Sovereign engine)
   ─────────────────────────────────────────────────────────────────────────── */
class SoundtrackEngineV8 {
  private ctx: AudioContext | null = null;
  private masterBus: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterBus = this.ctx.createGain();
    this.masterBus.connect(this.ctx.destination);
  }

  playAwaken() {
    this.init();
    if (!this.ctx || !this.masterBus) return;
    // Main Drone V8
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(32.7, this.ctx.currentTime); // C1
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(33.0, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 11);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 11);

    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.masterBus);
    osc1.start(); osc2.start(); osc1.stop(this.ctx.currentTime + 11.5); osc2.stop(this.ctx.currentTime + 11.5);

    // Old Sovereign Awaken Sub-bass
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(22, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(14, this.ctx.currentTime + 2.2);
    subGain.gain.setValueAtTime(0, this.ctx.currentTime);
    subGain.gain.linearRampToValueAtTime(0.55, this.ctx.currentTime + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.8);
    subOsc.connect(subGain); subGain.connect(this.masterBus);
    subOsc.start(); subOsc.stop(this.ctx.currentTime + 3);
  }

  playSequenceAwake() {
    this.init();
    if (!this.ctx || !this.masterBus) return;
    // V8 server awake
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(40, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.8);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);
    osc.connect(g); g.connect(this.masterBus);
    osc.start(); osc.stop(this.ctx.currentTime + 1.2);
    
    // Sovereign Quantum Tone
    [110, 165, 220, 330].forEach((freq, i) => {
      const qOsc = this.ctx!.createOscillator();
      const qGain = this.ctx!.createGain();
      qOsc.type = 'sine'; qOsc.frequency.value = freq;
      qGain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.12);
      qGain.gain.linearRampToValueAtTime(0.05, this.ctx!.currentTime + i * 0.12 + 0.25);
      qGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.12 + 1.4);
      qOsc.connect(qGain); qGain.connect(this.masterBus!);
      qOsc.start(this.ctx!.currentTime + i * 0.12);
      qOsc.stop(this.ctx!.currentTime + i * 0.12 + 1.6);
    });
  }

  playMetalPing(freq: number = 800) {
    this.init();
    if (!this.ctx || !this.masterBus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(g); g.connect(this.masterBus);
    osc.start(); osc.stop(this.ctx.currentTime + 0.4);
  }

  playFinalImpact() {
    this.init();
    if (!this.ctx || !this.masterBus) return;
    // V8 Final Impact
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 40;
    g.gain.setValueAtTime(1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    noise.connect(f); f.connect(g); g.connect(this.masterBus);
    noise.start();

    // Sovereign Detonation
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine'; sub.frequency.setValueAtTime(45, this.ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(12, this.ctx.currentTime + 0.5);
    sg.gain.setValueAtTime(0.8, this.ctx.currentTime);
    sg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);
    sub.connect(sg); sg.connect(this.masterBus); sub.start(); sub.stop(this.ctx.currentTime + 0.9);
  }
}

const audio = new SoundtrackEngineV8();

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
   ─────────────────────────────────────────────────────────────────────────── */
const BootSequenceV8: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTime = useRef<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [verdictVisible, setVerdictVisible] = useState(false);
  const [readyTextVisible, setReadyTextVisible] = useState(false);
  const [phase, setPhase] = useState<number>(-1);
  const particlesRef = useRef<{x:number, y:number, s:number, vx:number, vy:number, c:string}[]>([]);

  const LOG_ENTRIES = [
    "[✓] IDENTITY LOCKED: ОБ'ЄКТ 'В' (ПО-БАТЬКОВІ: ВАСИЛЬОВИЧ)",
    "[✓] FINANCIAL FOOTPRINT MAPPED (14 BANKS)",
    "[✓] PARSING RELATIVES: Б АТ (О. ВАСИЛЬОВИЧ) -> ТОП-МЕНЕДЖЕР  БАНКУ",
    "[!] ANOMALY DETECTED: ТЕНДЕ  №481516",
    "[✓] NETWORK GRAPH CONSTRUCTED (47 ACTIVE CONNECTIONS)",
    "[✓] PREDICTIVE BEHAVIOR MODEL: 99.9% ACCURACY",
  ];

  useEffect(() => {
    particlesRef.current = Array.from({length: 120}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      s: Math.random() * 2.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      c: Math.random() > 0.65 ? '#D4AF37' : '#dc2626' // Gold & Red
    }));
  }, []);

  useEffect(() => {
    if (!startTime.current) {
        startTime.current = Date.now();
    }
    let frame: number;

    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width = window.innerWidth;
      const H = canvas.height = window.innerHeight;
      const now = Date.now();
      const rot = now * 0.00028;

      // Shake calculations
      let sx = 0, sy = 0;
      if (elapsed > 8000 && elapsed < 9500) {
        sx = (Math.random() - 0.5) * 15;
        sy = (Math.random() - 0.5) * 15;
      }

      // Background fade to dark red over time
      const bgRed = elapsed > 1800 && elapsed < 8000 ? Math.min(20, (elapsed - 1800) / 50) : 0;
      ctx.fillStyle = `rgba(${bgRed}, 0, 0, ${elapsed < 3200 ? 0.8 : 1})`;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(sx, sy);

      // Sovereign glow
      const ri = elapsed > 8000 ? 0.18 : elapsed > 3200 ? 0.1 : 0.04;
      const cx = W / 2, cy = H / 2;
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
      rg.addColorStop(0, `rgba(200,15,15,${ri})`);
      rg.addColorStop(0.5, `rgba(80,5,5,${ri * 0.25})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

      // GLOBAL GRID (Subtle Background)
      if (elapsed > 1800 && elapsed < 9500) {
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        const offsetX = (elapsed * 0.05) % gridSize;
        const offsetY = (elapsed * 0.05) % gridSize;
        ctx.beginPath();
        for (let x = offsetX; x < W; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let y = offsetY; y < H; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();
      }

      // ──────────────────────────────────────────
      // PHASE LOGIC
      // ──────────────────────────────────────────
      if (elapsed < 1800) {
        // 0.0 - 1.8 | INITIALIZATION (Sovereign Void + Rings)
        if (phase !== 0) { setPhase(0); audio.playAwaken(); }
        const progress = elapsed / 1800;
        
        // Binary rain
        ctx.font = '9px monospace';
        for (let col = 0; col < W; col += 16) {
          for (let row = 0; row < Math.random() * 6 + 1; row++) {
            ctx.fillStyle = `rgba(200,15,15,${(Math.random() * 0.35 + 0.05) * progress})`;
            ctx.fillText('01'[Math.floor(Math.random() * 2)], col, Math.random() * H);
          }
        }
        
        // Glitch lines
        if (Math.random() > 0.6) {
          ctx.fillStyle = `rgba(200,15,15,${(1 - progress) * 0.18})`;
          ctx.fillRect(Math.random() * W * 0.35, Math.random() * H, Math.random() * W * 0.45, Math.random() * 6 + 1);
        }

        ctx.save();
        ctx.translate(W / 2, H / 2);
        for (let i = 0; i < 3; i++) {
            const p = (progress + (i * 0.33)) % 1;
            const radius = p * Math.max(W, H);
            ctx.strokeStyle = `rgba(220, 38, 38, ${0.3 * (1 - p)})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.beginPath();
        ctx.strokeStyle = `rgba(220, 38, 38, ${0.5 * Math.sin(progress * Math.PI)})`;
        ctx.moveTo(-100, 0); ctx.lineTo(100, 0); ctx.moveTo(0, -100); ctx.lineTo(0, 100); ctx.stroke();
        ctx.restore();

      } else if (elapsed < 3200) {
        // 1.8 - 3.2 | AWAKENING (Sovereign Fibonacci & Hexagons)
        if (phase !== 1) { 
          setPhase(1); 
          audio.playSequenceAwake(); 
        }
        const p = Math.min(1, (elapsed - 1800) / 1400);
        ctx.save(); ctx.translate(cx, cy);
        const maxR = Math.min(W, H) * 0.38;

        // Spiral
        ctx.strokeStyle = `rgba(220,38,38,${0.22 * p})`; ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let t = 0; t < 720 * p; t += 2) {
          const r = (maxR / 720) * t;
          const a = (t * Math.PI) / 180 + now * 0.00028;
          t === 0 ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a)) : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.stroke();

        // Hexagons
        for (let row = -4; row <= 4; row++) {
          for (let col = -6; col <= 6; col++) {
            const hx = col * 44 + (row % 2) * 22, hy = row * 38, hr = 14;
            const alpha = (Math.sin(now * 0.0012 + col * 0.28 + row * 0.48) * 0.5 + 0.5) * 0.13 * p;
            ctx.strokeStyle = `rgba(220,38,38,${alpha})`; ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let s = 0; s < 6; s++) {
              const a = (s / 6) * Math.PI * 2;
              s === 0 ? ctx.moveTo(hx + hr * Math.cos(a), hy + hr * Math.sin(a)) : ctx.lineTo(hx + hr * Math.cos(a), hy + hr * Math.sin(a));
            }
            ctx.closePath(); ctx.stroke();
          }
        }
        ctx.restore();

      } else if (elapsed < 8000) {
        // 3.2 - 8.0 | TOTAL PARSING (Globe + Neural Graph + Target HUD)
        if (phase !== 2) setPhase(2);

        const parsingProgress = (elapsed - 3200) / 4800;
        const centerX = W * 0.7;
        const centerY = H * 0.5;
        const globeR = Math.min(W, H) * 0.25;

        // Draw Sovereign Globe
        ctx.save(); ctx.translate(centerX, centerY);
        for (let i = 0; i < 600; i++) {
          const phi = Math.acos(-1 + (2 * i) / 600);
          const theta = Math.sqrt(600 * Math.PI) * phi + rot * 10;
          const mask = Math.sin(phi * 4) * Math.cos(theta * 3) + Math.sin(theta * 2);
          if (mask > 0.28) {
            const gx = globeR * Math.sin(phi) * Math.cos(theta - rot);
            const gy = globeR * Math.cos(phi);
            const gz = globeR * Math.sin(phi) * Math.sin(theta - rot);
            if (gz > 0) {
            const bright = Math.pow(gz / globeR, 0.5);
            // Sovereign Mix: Red/Gold
            ctx.fillStyle = i % 5 === 0 
              ? `rgba(212, 175, 55, ${0.2 + bright * 0.4})` 
              : `rgba(225, 29, 72, ${0.15 + bright * 0.3})`;
            ctx.fillRect(gx, gy, 1.5, 1.5);
            }
          }
        }
        ctx.restore();
        
        // HUD Overlay around the graph
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(elapsed * 0.0005);
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.15)';
        ctx.setLineDash([10, 15, 5, 20]);
        ctx.beginPath(); ctx.arc(0, 0, globeR + 20, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, globeR + 60, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Neural Graph built over time
        const nodes = 18; 
        ctx.save();
        for (let i = 0; i < nodes; i++) {
          const nodeTime = 3200 + (i * 250);
          if (elapsed > nodeTime) {
            const age = elapsed - nodeTime;
            const angle = (i / nodes) * Math.PI * 2 + (elapsed * 0.0001);
            const dist = globeR * 0.7 + Math.sin(elapsed * 0.001 + i) * 30 + (i % 3 === 0 ? 50 : 0);
            const nx = centerX + Math.cos(angle) * dist;
            const ny = centerY + Math.sin(angle) * dist;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = i % 3 === 0 ? `rgba(212, 175, 55, ${Math.min(0.4, age / 1000)})` : `rgba(225, 29, 72, ${Math.min(0.5, age / 1000)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Inter-node connections
            if (i > 0) {
                const prevAngle = ((i-1) / nodes) * Math.PI * 2 + (elapsed * 0.0001);
                const prevDist = globeR * 0.7 + Math.sin(elapsed * 0.001 + (i-1)) * 30 + ((i-1) % 3 === 0 ? 50 : 0);
                const pnx = centerX + Math.cos(prevAngle) * prevDist;
                const pny = centerY + Math.sin(prevAngle) * prevDist;
                
                ctx.beginPath();
                ctx.moveTo(pnx, pny);
                ctx.lineTo(nx, ny);
                if (Math.random() > 0.9) {
                    ctx.strokeStyle = `rgba(250, 250, 250, 0.8)`; ctx.lineWidth = 1.5;
                } else {
                    ctx.strokeStyle = `rgba(220, 38, 38, 0.25)`; ctx.lineWidth = 0.5;
                }
                ctx.stroke();
                
                // Data packet moving along line
                const packetTravel = (elapsed * 0.002 + i) % 1;
                const packetX = pnx + (nx - pnx) * packetTravel;
                const packetY = pny + (ny - pny) * packetTravel;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(packetX, packetY, 1.5, 0, Math.PI * 2); ctx.fill();
            }

            // Node Point
            const nodeGlow = Math.sin(elapsed * 0.005 + i) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(220, 38, 38, ${0.5 + nodeGlow * 0.5})`;
            ctx.beginPath(); ctx.arc(nx, ny, 3 + nodeGlow * 2, 0, Math.PI * 2); ctx.fill();
            
            // Text near node
            if (i % 3 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.font = '10px monospace';
                ctx.fillText(`ID:[0x${((i+1)*13).toString(16).toUpperCase()}]`, nx + 8, ny - 8);
            }
          }
        }
        
        // Final Fixation
        if (parsingProgress > 0.85) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random()})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            const targetNode = Math.floor(Math.random() * nodes);
            const tAngle = (targetNode / nodes) * Math.PI * 2 + (elapsed * 0.0001);
            const tDist = globeR * 0.7 + Math.sin(elapsed * 0.001 + targetNode) * 30 + (targetNode % 3 === 0 ? 50 : 0);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(tAngle) * tDist, centerY + Math.sin(tAngle) * tDist);
            ctx.stroke();
        }
        ctx.restore();

        // Update Logs
        const logIndex = Math.floor(parsingProgress * LOG_ENTRIES.length);
        if (logs.length < logIndex + 1 && LOG_ENTRIES[logIndex]) {
          setLogs(LOG_ENTRIES.slice(0, logIndex + 1));
          audio.playMetalPing(400 + logIndex * 150);
        }

      } else if (elapsed < 9500) {
        // 8.0 - 9.5 | VERDICT (Chromatic Aberration + Sovereign Particles)
        if (phase !== 3) {
          setPhase(3);
          audio.playFinalImpact();
          setVerdictVisible(true);
        }
        
        const flashAlpha = Math.max(0, 1 - (elapsed - 8000) / 1500);
        ctx.fillStyle = `rgba(220, 38, 38, ${flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
        
        // Red overlay glitching
        if (Math.random() > 0.5) {
            ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.3})`;
            ctx.fillRect((Math.random() - 0.5) * 20, Math.random() * H + (Math.random() - 0.5) * 20, W, Math.random() * 50 + 10);
        }

        // Sovereign Detonation Particles
        particlesRef.current.forEach(p => {
          p.x += p.vx * 6;
          p.y += p.vy * 6;
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.c;
          ctx.fill();
        });

      } else if (elapsed < 11000) {
        // 9.5 - 11.0 | DEPLOYMENT
        if (phase !== 4) {
          setPhase(4);
          setVerdictVisible(false);
          setReadyTextVisible(true);
        }
        
        const progress = (elapsed - 9500) / 1500;
        const zoom = Math.max(0.01, 1 - Math.pow(progress, 2) * 0.95);
        ctx.save();
        ctx.translate(W/2, H/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-W/2, -H/2);
        
        ctx.strokeStyle = `rgba(220, 38, 38, ${Math.max(0, 0.3 - progress)})`;
        ctx.lineWidth = 0.5;
        const step = H / 20;
        for(let x=0; x<W*2; x+=step) {
            ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x-W, H*2); ctx.stroke();
        }
        for(let y=-H; y<H*2; y+=step) {
            ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W*2, y+H); ctx.stroke();
        }
        ctx.restore();
        
      } else {
        onComplete();
      }

      ctx.restore(); // restore global shake translate

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete, logs.length, phase]);

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden bg-black font-display select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* 1.8 - 3.2 | PREDATOR CORE ONLINE */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <h1 className="text-white text-5xl md:text-8xl font-black tracking-[0.2em] shadow-[0_0_50px_rgba(220,38,38,0.5)]">
              ЯДРО PREDATOR: ОНЛАЙН
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3.2 - 8.0 | LOGS (Left Side) */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 w-1/3 space-y-4 pointer-events-none">
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            className={`font-mono text-sm md:text-base p-2 border-l-2 bg-gradient-to-r ${
              log.includes('!') ? 'border-amber-500 text-amber-400 from-amber-500/10' : 'border-red-600 text-red-500 from-red-600/10'
            } to-transparent`}
          >
            {log}
          </motion.div>
        ))}
      </div>

      {/* 8.0 - 9.5 | VERDICT */}
      <AnimatePresence>
        {verdictVisible && (
          <motion.div 
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4"
          >
            <h2 className="text-white text-4xl md:text-7xl font-bold bg-red-600 px-6 py-2 mb-4 tracking-tighter italic">
                ЗБІГ ЗАФІКСОВАНО // ЦІЛЬ ПОВНІСТЮ КОМП ОМЕТОВАНА
            </h2>
            <p className="text-red-500 font-mono text-lg md:text-xl uppercase tracking-widest bg-black px-4 py-1">
              Корупційна мережа підтверджена. Активи заблоковано.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 9.5 - 11.0 | FINAL STATE */}
      <AnimatePresence>
        {readyTextVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 left-10 pointer-events-none"
          >
            <div className="text-white/40 text-xs font-mono mb-2">PREDATOR OS v8.0 — АКТИВНО</div>
            <div className="text-white/60 text-xs font-mono mb-2">ВСІ СИСТЕМИ ПРИВЕДЕНІ В БОЙОВУ ГОТОВНІСТЬ</div>
            <div className="text-white text-sm font-bold tracking-[0.5em] uppercase italic">ГОТОВО ДО РОЗГОРТАННЯ</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default BootSequenceV8;

