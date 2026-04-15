/**
 * BootScreen — PREDATOR NEXUS v56.5-ELITE — SOVEREIGN CLASSIFIED INTRO
 * ===============================================================
 * Billion-dollar intelligence platform. Доступ виключно для авторизованого персоналу.
 * Кінематографічна заставка рівня державної розвідки.
 *
 * Фази:
 *  0 → VOID ACTIVATION      — темрява, ультра-низька частота, пробудження ядра
 *  1 → CRYPTOGRAPHIC INIT   — квантова геометрія, шифрування рівня TOP SECRET
 *  2 → GLOBAL DOMINANCE     — планетарне сканування, 47 супутників
 *  3 → TARGET ACQUISITION   — lock-on приціл, AI аналіз, THREAT CONFIRMED
 *  4 → SOVEREIGN REVEAL     — PREDATOR logo, золото + кров, ELITE ACCESS
 *  5 → FADE INTO SYSTEM
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeometricRaptor } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

const PHASE_DURATIONS: Record<Phase, number> = {
  0: 2000,  // VOID ACTIVATION
  1: 2400,  // CRYPTOGRAPHIC INIT
  2: 3500,  // GLOBAL DOMINANCE
  3: 6200,  // TARGET ACQUISITION (SEARCH + LOCK)
  4: 7500,  // SOVEREIGN REVEAL (GOLD & COAL)
  5: 1600,  // FADE OUT
};

/* ─────────────────────────────────────────────────────────────────────────────
   WEB AUDIO ENGINE — Синтезовані звуки без зовнішніх файлів
   ─────────────────────────────────────────────────────────────────────────── */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      } catch { return null; }
    }
    return this.ctx;
  }

  /** Підземний гул ядра що пробуджується */
  playAwaken() {
    const ctx = this.getCtx();
    if (!ctx) return;
    // Sub-bass удар
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(22, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(14, ctx.currentTime + 2.2);
    filter.type = 'lowpass';
    filter.frequency.value = 60;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 3);
    // Metallic glitch
    setTimeout(() => {
      const c = this.getCtx(); if (!c) return;
      const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < buf.length; i++) d[i] = (Math.random() * 2 - 1) * 0.6;
      const src = c.createBufferSource(); src.buffer = buf;
      const g = c.createGain();
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
      src.connect(g); g.connect(c.destination); src.start();
    }, 80);
    // Другий удар
    setTimeout(() => {
      const c = this.getCtx(); if (!c) return;
      const o2 = c.createOscillator();
      const g2 = c.createGain();
      o2.type = 'sine'; o2.frequency.value = 38;
      g2.gain.setValueAtTime(0, c.currentTime);
      g2.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
      o2.connect(g2); g2.connect(c.destination); o2.start(); o2.stop(c.currentTime + 1.4);
    }, 600);
  }

  /** Квантовий ініціалізаційний тон */
  playQuantumTone() {
    const ctx = this.getCtx(); if (!ctx) return;
    [110, 165, 220, 330].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.12 + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 1.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 1.6);
    });
  }

  /** Радарний пінг */
  playRadarPing() {
    const ctx = this.getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  }

  /** Lock-on захоплення цілі */
  playLockOn() {
    const ctx = this.getCtx(); if (!ctx) return;
    [600, 900, 1200, 1600, 2100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + i * 0.2 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.18);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.25);
    });
    setTimeout(() => {
      const c = this.getCtx(); if (!c) return;
      const osc2 = c.createOscillator(); const g2 = c.createGain();
      osc2.type = 'sine'; osc2.frequency.value = 2400;
      g2.gain.setValueAtTime(0.12, c.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2);
      osc2.connect(g2); g2.connect(c.destination);
      osc2.start(); osc2.stop(c.currentTime + 1.4);
    }, 1100);
  }

  /** Digital detonation — TARGET DESTROYED */
  playDetonation() {
    const ctx = this.getCtx(); if (!ctx) return;
    // Вибух — широкополосний шум з компресором
    const bufLen = ctx.sampleRate * 0.8;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++)
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.12));
    const src = ctx.createBufferSource(); src.buffer = buf;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24; comp.ratio.value = 20;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    src.connect(comp); comp.connect(g); g.connect(ctx.destination); src.start();
    // Низький sub-bass удар
    const sub = ctx.createOscillator(); const sg = ctx.createGain();
    sub.type = 'sine'; sub.frequency.setValueAtTime(45, ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(12, ctx.currentTime + 0.5);
    sg.gain.setValueAtTime(0.8, ctx.currentTime);
    sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    sub.connect(sg); sg.connect(ctx.destination); sub.start(); sub.stop(ctx.currentTime + 0.9);
    // Тонкий alarm після детонації
    setTimeout(() => {
      const c = this.getCtx(); if (!c) return;
      [880, 660, 880, 660].forEach((freq, i) => {
        const o = c.createOscillator(); const gn = c.createGain();
        o.type = 'square'; o.frequency.value = freq;
        gn.gain.setValueAtTime(0, c.currentTime + i * 0.15);
        gn.gain.linearRampToValueAtTime(0.06, c.currentTime + i * 0.15 + 0.04);
        gn.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.14);
        o.connect(gn); gn.connect(c.destination);
        o.start(c.currentTime + i * 0.15); o.stop(c.currentTime + i * 0.15 + 0.18);
      });
    }, 400);
  }

  /** Масивний sovereign удар */
  playImpact() {
    const ctx = this.getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 500) * x / (Math.PI + 500 * Math.abs(x));
    }
    dist.curve = curve;
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(32, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(14, ctx.currentTime + 1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.65, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
    osc.connect(dist); dist.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc2.start(); osc.stop(ctx.currentTime + 3.5); osc2.stop(ctx.currentTime + 3.5);
    // Metallic crash
    setTimeout(() => {
      const c = this.getCtx(); if (!c) return;
      const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < buf.length; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buf.length * 0.06));
      const src = c.createBufferSource(); src.buffer = buf;
      const g = c.createGain();
      g.gain.setValueAtTime(0.4, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
      src.connect(g); g.connect(c.destination); src.start();
    }, 30);
  }

  playTelemetry(freq = 1200) {
    const ctx = this.getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.022, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.09);
  }

  startDrone(): (() => void) | null {
    const ctx = this.getCtx(); if (!ctx) return null;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 36;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 180;
    osc.connect(filter); filter.connect(gain);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.2);
    gain.connect(ctx.destination); osc.start();
    return () => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        setTimeout(() => { try { osc.stop(); } catch {} }, 600);
      } catch {}
    };
  }
}

const soundEngine = new SoundEngine();

/* ─────────────────────────────────────────────────────────────────────────────
   УТИЛІТИ
   ─────────────────────────────────────────────────────────────────────────── */
// Генератор випадкового hex рядка
const rndHex = (len = 8) =>
  Math.floor(Math.random() * Math.pow(16, len)).toString(16).toUpperCase().padStart(len, '0');

/* ─────────────────────────────────────────────────────────────────────────────
   ГОЛОВНИЙ КОМПОНЕНТ
   ─────────────────────────────────────────────────────────────────────────── */
const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef= useRef<HTMLDivElement>(null);
  const animFrameRef= useRef<number>(0);
  const droneStopRef= useRef<(() => void) | null>(null);

  const [phase, setPhase]         = useState<Phase>(0);
  const phaseStart                = useRef(Date.now());
  const skipRef                   = useRef(false);

  // HUD стани
  const [interceptCount, setInterceptCount] = useState(0);
  const [scanPct, setScanPct]               = useState(0);
  const [hexStream, setHexStream]           = useState<string[]>([]);
  const [typeText, setTypeText]             = useState('');
  const [targetLocked, setTargetLocked]     = useState(false);
  const [dbLines, setDbLines]               = useState<string[]>([]);
  const [threatLevel, setThreatLevel]       = useState(0); // 0-100
  const particlesRef = useRef<{x:number, y:number, s:number, vx:number, vy:number, c:string}[]>([]);

  // Initialize Particles (Sovereign Essence)
  useEffect(() => {
    particlesRef.current = Array.from({length: 120}, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      s: Math.random() * 2.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      c: Math.random() > 0.65 ? '#D4AF37' : '#dc2626' // Gold & Rose
    }));
  }, []);

  // Фазові тексти
  const PHASE_TEXTS: Record<number, string> = {
    0: '',
    1: '> ІНІЦІАЛІЗАЦІЯ СУВЕРЕННОГО КВАНТОВОГО ПРОТОКОЛУ [v56.5-ELITE]...',
    2: '> ГЛОБАЛЬНИЙ СПЕКТР: 47 СУПУТНИКІВ / 1,217 ВУЗЛІВ / 42 КРАЇНИ',
    3: '> NEURAL CORE: ПЕРЕХРЕСНА ВЕРИФІКАЦІЯ... РІВЕНЬ ЗАГРОЗИ: НЕВІДВОРОТНИЙ',
    4: '> SOVEREIGN PREDATOR: ДОСТУП ТІР-1 ПІДТВЕРДЖЕНО — ВІТАЄМО В ЕЛІТІ',
  };

  const DB_SCAN_LINES = [
    'PARSING MULTI-JURISDICTIONAL DATABASES...',
    'GLOBAL DATACENTERS ONLINE [12.4 EXABYTES]...',
    'SCANNING UA_CUSTOMS_ASYCUDA: SEARCHING...',
    'INTERCEPTING BANKING SWIFT/SEPA TRAFFIC...',
    'SCANNING INTERPOL & OFAC RED NOTICES...',
    'NEO4J_GRAPH: DEEP TRAVERSAL [L15]...',
    'DE-ANONYMIZING OFFSHORE BENEFICIARIES...',
    'AI HUNTER-KILLER PROTOCOL: LOCKING...',
    'TARGET SIGNATURE MATCH: 99.99%',
    'COORDINATES: LAT 50.4501 LON 30.5234',
    '▌ PREPARING DIGITAL DETONATION...',
    '▌ TARGET IDENTIFIED. ВІД НАС НЕ СХОВАЄШСЯ.',
  ];

  /* ── Typewriter ── */
  useEffect(() => {
    const target = PHASE_TEXTS[phase] ?? '';
    let i = 0; setTypeText('');
    const id = setInterval(() => {
      i++; setTypeText(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── DB scan lines (фаза 3) ── */
  useEffect(() => {
    if (phase !== 3) { setDbLines([]); setTargetLocked(false); setThreatLevel(0); return; }
    let idx = 0; setDbLines([]);
    const addLine = () => {
      if (idx >= DB_SCAN_LINES.length) return;
      const line = DB_SCAN_LINES[idx];
      setDbLines(p => [...p, line]);
      if (line.includes('ВІД НАС НЕ СХОВАЄШСЯ')) setTargetLocked(true);
      idx++;
      const delay =
        line.includes('NOWHERE TO HIDE')   ? 700 :
        line.includes('DETONATION')        ? 550 :
        line.includes('HUNTER-KILLER')     ? 400 :
        280 + Math.random() * 180;
      setTimeout(addLine, delay);
    };
    const t = setTimeout(addLine, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── Threat level (фаза 3) ── */
  useEffect(() => {
    if (phase !== 3) return;
    const id = setInterval(() => setThreatLevel(p => Math.min(100, p + 2.5)), 60);
    return () => clearInterval(id);
  }, [phase]);

  /* ── HUD counters ── */
  useEffect(() => {
    const iId = setInterval(() => {
      setInterceptCount(p => p + Math.floor(Math.random() * 15000 + 5000));
      if (phase >= 1 && phase <= 3) soundEngine.playTelemetry(700 + Math.random() * 700);
    }, 55);
    const sId = setInterval(() =>
      setScanPct(p => Math.min(100, p + Math.random() * 2.2 + 0.8)), 30);
    const hId = setInterval(() =>
      setHexStream(p => [`0x${rndHex(8)}`, ...p].slice(0, 10)), 75);
    return () => { clearInterval(iId); clearInterval(sId); clearInterval(hId); };
  }, [phase]);

  /* ── Звуки ── */
  useEffect(() => {
    if (phase === 0) soundEngine.playAwaken();
    if (phase === 1) soundEngine.playQuantumTone();
    if (phase === 2) soundEngine.playRadarPing();
    if (phase === 3) soundEngine.playLockOn();
    if (phase === 4) { soundEngine.playImpact(); droneStopRef.current = soundEngine.startDrone(); }
    if (phase === 5) { droneStopRef.current?.(); soundEngine.playTelemetry(350); }
  }, [phase]);

  /* ── Детонація при lock-on ── */
  useEffect(() => {
    if (targetLocked) soundEngine.playDetonation();
  }, [targetLocked]);

  /* ──────────────────────────────────────────────────────────────────────────
     CANVAS RENDER
     ────────────────────────────────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    const now = Date.now();
    const elapsed = now - phaseStart.current;
    const cp = skipRef.current ? 5 : phase;
    const rot = now * 0.00028;

    // Camera shake
    let sx = 0, sy = 0;
    if (cp < 5) {
      const si = cp === 0 ? 0.4 : cp === 1 ? 1.0 : cp === 3 ? 3.2 : cp === 4 ? 1.8 : 0.3;
      sx = (Math.random() - 0.5) * si * 3.5;
      sy = (Math.random() - 0.5) * si * 3.5;
    }

    // Motion trail
    ctx.fillStyle = cp === 4 ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(sx, sy);

    // Detonation Flash
    if (targetLocked) {
      const flashAlpha = Math.sin(now * 0.05) * 0.3 + 0.4;
      ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
      // Chromatic anomaly
      ctx.translate((Math.random()-0.5)*15, (Math.random()-0.5)*15);
    }

    const cx = W / 2, cy = H / 2;

    /* ── Атмосферне світіння (завжди) ── */
    if (cp < 5) {
      // Червоне центральне
      const ri = cp === 4 ? 0.18 : cp === 3 ? 0.1 : 0.04;
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
      rg.addColorStop(0, `rgba(200,15,15,${ri})`);
      rg.addColorStop(0.5, `rgba(80,5,5,${ri * 0.25})`);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      // Холодний синій акцент зверху
      if (cp >= 2) {
        const bg = ctx.createRadialGradient(W * 0.12, H * 0.12, 0, W * 0.12, H * 0.12, W * 0.45);
        bg.addColorStop(0, `rgba(5,20,120,${cp === 3 ? 0.05 : 0.025})`);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      }
      // Золотий мерехтливий ефект (фаза 4)
      if (cp === 4) {
        const t = (Math.sin(now * 0.0008) * 0.5 + 0.5);
        const gg = ctx.createRadialGradient(cx, cy - H * 0.25, 0, cx, cy, H * 0.7);
        gg.addColorStop(0, `rgba(180,140,20,${t * 0.06})`);
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
      }

      // Particle Field (Sovereign Essence)
      if (cp >= 3) {
        particlesRef.current.forEach(p => {
          p.x += p.vx * (cp === 4 ? 6 : 1.5);
          p.y += p.vy * (cp === 4 ? 6 : 1.5);
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * (cp === 4 ? 2 : 1), 0, Math.PI * 2);
          ctx.fillStyle = cp === 4 ? p.c : `${p.c}33`;
          ctx.fill();
        });
      }
    }

    /* ══ ФАЗА 0: VOID ACTIVATION ══ */
    if (cp === 0) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[0]);
      // Хаотичні глітч-рядки
      for (let i = 0; i < 35; i++) {
        ctx.fillStyle = `rgba(200,15,15,${(1 - p) * 0.18 * Math.random()})`;
        ctx.fillRect(Math.random() * W * 0.35, Math.random() * H, Math.random() * W * 0.45, Math.random() * 6 + 1);
      }
      // Бінарний дощ
      ctx.font = '9px monospace';
      for (let col = 0; col < W; col += 16) {
        for (let row = 0; row < Math.random() * 6 + 1; row++) {
          ctx.fillStyle = `rgba(200,15,15,${(Math.random() * 0.35 + 0.05) * p})`;
          ctx.fillText('01'[Math.floor(Math.random() * 2)], col, Math.random() * H);
        }
      }
      // Сітка що проявляється
      ctx.strokeStyle = `rgba(200,15,15,${0.07 * p})`; ctx.lineWidth = 0.8;
      for (let x = 0; x < W; x += 55) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y < H; y += 55) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
      // Сканлінія
      const sy2 = (elapsed / PHASE_DURATIONS[0]) * H;
      const sg = ctx.createLinearGradient(0, sy2 - 4, 0, sy2 + 4);
      sg.addColorStop(0, 'rgba(220,38,38,0)');
      sg.addColorStop(0.5, `rgba(220,38,38,${0.7 * p})`);
      sg.addColorStop(1, 'rgba(220,38,38,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, sy2 - 4, W, 8);
    }

    /* ══ ФАЗА 1: CRYPTOGRAPHIC INIT ══ */
    if (cp === 1) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);
      ctx.save(); ctx.translate(cx, cy);
      const maxR = Math.min(W, H) * 0.38;

      // Фіббоначчі спіраль
      ctx.strokeStyle = `rgba(220,38,38,${0.22 * p})`; ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let t = 0; t < 720 * p; t += 2) {
        const r = (maxR / 720) * t;
        const a = (t * Math.PI) / 180 + now * 0.00028;
        t === 0 ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a)) : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.stroke();

      // Концентричні кільця
      for (let ring = 1; ring <= 7; ring++) {
        const rr = (maxR / 7) * ring;
        const pulse = Math.sin(now * 0.0018 + ring * 0.6) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220,38,38,${(0.05 + pulse * 0.09) * p})`;
        ctx.lineWidth = ring === 7 ? 1.8 : 0.7; ctx.stroke();
      }

      // Зубчасті позначки (ticks)
      for (let i = 0; i < 72; i++) {
        const a = ((i / 72) * Math.PI * 2) + now * 0.0008;
        const isLong = i % 9 === 0;
        const ir2 = maxR * (isLong ? 1.06 : 1.02), or2 = maxR * 1.14;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * ir2, Math.sin(a) * ir2);
        ctx.lineTo(Math.cos(a) * or2, Math.sin(a) * or2);
        ctx.strokeStyle = `rgba(220,38,38,${(isLong ? 0.55 : 0.22) * p})`;
        ctx.lineWidth = isLong ? 1.8 : 0.7; ctx.stroke();
      }

      // Центральний хрест-приціл
      ctx.strokeStyle = `rgba(255,255,255,${0.65 * p})`; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-28, 0); ctx.lineTo(28, 0); ctx.moveTo(0, -28); ctx.lineTo(0, 28); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.stroke();

      // Шестикутники
      for (let row = -4; row <= 4; row++) {
        for (let col = -6; col <= 6; col++) {
          const hx = col * 44 + (row % 2) * 22, hy = row * 38, hr = 14;
          const alpha = (Math.sin(now * 0.0012 + col * 0.28 + row * 0.48) * 0.5 + 0.5) * 0.13 * p;
          ctx.strokeStyle = `rgba(220,38,38,${alpha})`; ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s / 6) * Math.PI * 2;
            s === 0 ? ctx.moveTo(hx + hr * Math.cos(a), hy + hr * Math.sin(a))
                    : ctx.lineTo(hx + hr * Math.cos(a), hy + hr * Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ══ ФАЗА 2: GLOBAL DOMINANCE ══ */
    if (cp === 2) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[2]);
      const globeR = Math.min(W, H) * 0.3;
      ctx.save(); ctx.translate(cx, cy);

      // Точки континентів
      for (let i = 0; i < 1200; i++) {
        const phi = Math.acos(-1 + (2 * i) / 1200);
        const theta = Math.sqrt(1200 * Math.PI) * phi + rot * 10;
        const mask = Math.sin(phi * 4) * Math.cos(theta * 3) + Math.sin(theta * 2);
        if (mask > 0.28) {
          const gx = globeR * Math.sin(phi) * Math.cos(theta - rot);
          const gy = globeR * Math.cos(phi);
          const gz = globeR * Math.sin(phi) * Math.sin(theta - rot);
          if (gz > 0) {
            const bright = Math.pow(gz / globeR, 0.5);
            ctx.fillStyle = `rgba(220,38,38,${(0.25 + bright * 0.4) * p})`;
            ctx.fillRect(gx, gy, 1.6, 1.6);
          }
        }
      }

      // Сітка глобуса
      ctx.lineWidth = 0.45;
      for (let i = -6; i <= 6; i++) {
        const yOff = (i / 6) * globeR;
        const rw = Math.sqrt(Math.max(0, globeR * globeR - yOff * yOff));
        if (rw > 0) {
          ctx.beginPath(); ctx.ellipse(0, yOff, rw, rw * 0.14, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220,38,38,${0.18 * p})`; ctx.stroke();
        }
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + rot;
        const cw = globeR * Math.abs(Math.cos(a));
        if (cw > 0.5) {
          ctx.beginPath(); ctx.ellipse(0, 0, cw, globeR, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220,38,38,${(Math.sin(a) < 0 ? 0.07 : 0.32) * p})`; ctx.stroke();
        }
      }

      // Орбіти + супутники
      [[1.20, 0.26, [5,10], '#64A8FF'], [1.36, 0.22, [3,8], '#FF6464'], [1.55, 0.18, [], '#A0A0FF']].forEach(
        ([factor, tilt, dash, color], idx) => {
          const fr = factor as number, ti = tilt as number;
          const d = dash as number[];
          const clr = color as string;
          const rotOff = now * (0.00025 + idx * 0.00018) * (idx % 2 === 0 ? 1 : -1);
          ctx.save();
          ctx.rotate(rotOff);
          if (d.length) ctx.setLineDash(d);
          ctx.beginPath(); ctx.ellipse(0, 0, globeR * fr, globeR * fr * ti, 0.28 * idx, 0, Math.PI * 2);
          ctx.strokeStyle = `${clr}${Math.round(0.18 * p * 255).toString(16).padStart(2,'0')}`; ctx.lineWidth=0.9; ctx.stroke();
          ctx.setLineDash([]);
          // Супутник
          const satX = Math.cos(rotOff) * globeR * fr;
          const satY = Math.sin(rotOff) * globeR * fr * ti;
          ctx.fillStyle = `${clr}CC`; ctx.fillRect(satX-2,satY-2,4,4);
          // Ореол супутника
          ctx.strokeStyle = `${clr}44`; ctx.lineWidth=1;
          ctx.beginPath(); ctx.arc(satX, satY, 6, 0, Math.PI*2); ctx.stroke();
          ctx.restore();
        }
      );

      // Радарний промінь
      ctx.save(); ctx.rotate(now * 0.0018);
      const sg = ctx.createConicGradient(0, 0, 0);
      sg.addColorStop(0, 'rgba(220,38,38,0)');
      sg.addColorStop(0.055, `rgba(220,38,38,${0.6 * p})`);
      sg.addColorStop(0.14, 'rgba(220,38,38,0)');
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,globeR*1.6,0,Math.PI*2);
      ctx.fillStyle = sg; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(globeR*1.6,0);
      ctx.strokeStyle = `rgba(255,50,50,${0.95*p})`; ctx.lineWidth=1.8; ctx.stroke();
      ctx.restore();

      // Цілі на радарі
      for (let i = 0; i < 12; i++) {
        const ta = (i/12)*Math.PI*2 + now*0.0002*(i%2===0?1:-1.4);
        const td = globeR*(0.22+0.65*Math.abs(Math.sin(now*0.0005+i*1.4)));
        const tx = Math.cos(ta)*td, ty = Math.sin(ta)*td;
        const pa = ((now*0.001+i)%3)/3;
        ctx.strokeStyle =`rgba(255,255,255,${(1-pa)*0.65*p})`; ctx.lineWidth=0.9;
        ctx.beginPath(); ctx.arc(tx,ty,pa*15,0,Math.PI*2); ctx.stroke();
        ctx.strokeRect(tx-3,ty-3,6,6);
        ctx.fillStyle=`rgba(255,255,255,${0.35*p})`; ctx.font='5px monospace';
        ctx.fillText(`TGT-${String(i).padStart(2,'0')}`,tx+8,ty+2);
      }

      // Потоки даних між вузлами
      for (let i = 0; i < 10; i++) {
        const aFrom = (i/10)*Math.PI*2+rot, aTo = ((i+4)/10)*Math.PI*2+rot;
        const r=globeR*0.68;
        const fx=Math.cos(aFrom)*r, fy=Math.sin(aFrom)*r*0.62;
        const tx=Math.cos(aTo)*r, ty=Math.sin(aTo)*r*0.62;
        const pls = (now*0.0018+i*0.45)%1;
        ctx.strokeStyle=`rgba(100,160,255,${0.1*p})`; ctx.lineWidth=0.5;
        ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(tx,ty); ctx.stroke();
        const dpx = fx+(tx-fx)*pls, dpy = fy+(ty-fy)*pls;
        ctx.fillStyle=`rgba(140,210,255,${0.7*p})`;
        ctx.beginPath(); ctx.arc(dpx,dpy,1.8,0,Math.PI*2); ctx.fill();
      }

      ctx.restore();
    }

    /* ══ ФАЗА 3: TARGET ACQUISITION ══ */
    if (cp === 3) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[3]);
      const lockP = Math.min(1, elapsed / 4400);

      ctx.save(); ctx.translate(cx, cy);

      // HUD сітка
      ctx.strokeStyle=`rgba(220,38,38,${0.055*p})`; ctx.lineWidth=0.5;
      for (let x=-W/2; x<W/2; x+=44) { ctx.beginPath(); ctx.moveTo(x,-H/2); ctx.lineTo(x,H/2); ctx.stroke(); }
      for (let y=-H/2; y<H/2; y+=44) { ctx.beginPath(); ctx.moveTo(-W/2,y); ctx.lineTo(W/2,y); ctx.stroke(); }

      // Кутовий приціл (4 L-маркери)
      const outerS = 130 * lockP;
      const armL = 36 * lockP;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx2,sy2]) => {
        const bx = sx2*outerS, by = sy2*outerS;
        ctx.strokeStyle=`rgba(220,38,38,${0.9*p})`; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx,by-sy2*armL); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx-sx2*armL,by); ctx.stroke();
        // Точка на куті
        ctx.fillStyle=`rgba(255,50,50,${0.8*p})`;
        ctx.fillRect(bx-2,by-2,4,4);
      });

      // Звужуюче зовнішнє кільце
      const outerR = 155 - lockP * 100;
      ctx.beginPath(); ctx.arc(0,0,outerR,0,Math.PI*2);
      ctx.strokeStyle=`rgba(220,38,38,${0.3*p})`; ctx.lineWidth=1;
      ctx.setLineDash([6,10]); ctx.stroke(); ctx.setLineDash([]);

      // Внутрішнє кільце
      ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2);
      ctx.strokeStyle=`rgba(220,38,38,${0.6*p})`; ctx.lineWidth=1.5; ctx.stroke();

      // Обертальні сегменти
      ctx.save(); ctx.rotate(now*0.0022);
      for (let i=0;i<8;i++) {
        const a=(i/8)*Math.PI*2;
        if (i%2===0) {
          ctx.beginPath(); ctx.arc(0,0,67,a,a+Math.PI/10);
          ctx.strokeStyle=`rgba(220,38,38,${0.45*lockP*p})`; ctx.lineWidth=14; ctx.stroke();
        }
      }
      ctx.restore();

      // Обертальне ліве кільце (проти)
      ctx.save(); ctx.rotate(-now*0.0016);
      for (let i=0;i<12;i++) {
        const a=(i/12)*Math.PI*2;
        if (i%3===0) {
          ctx.beginPath(); ctx.arc(0,0,90,a,a+Math.PI/18);
          ctx.strokeStyle=`rgba(100,160,255,${0.25*lockP*p})`; ctx.lineWidth=8; ctx.stroke();
        }
      }
      ctx.restore();

      // Хрестоподібні прицільні лінії
      const gap=38;
      ctx.strokeStyle=`rgba(220,38,38,${0.28*p})`; ctx.lineWidth=0.8;
      ctx.setLineDash([4,7]);
      ctx.beginPath();
      ctx.moveTo(-W/2,0); ctx.lineTo(-gap,0);
      ctx.moveTo(gap,0);  ctx.lineTo(W/2,0);
      ctx.moveTo(0,-H/2); ctx.lineTo(0,-gap);
      ctx.moveTo(0,gap);  ctx.lineTo(0,H/2);
      ctx.stroke(); ctx.setLineDash([]);

      // ─── NEW: SEARCH VISUALIZATION (DYNAMIC GRAPH) ───
      const numNodes = 14;
      ctx.save();
      for (let i = 0; i < numNodes; i++) {
        const appearT = i * 280; // Each node appears over time
        if (elapsed > appearT) {
           const np = Math.min(1, (elapsed - appearT) / 500); // 0 to 1 scale
           const ang = (i * 137.5) * (Math.PI / 180) + now * 0.00015;
           const dist = 45 + (i % 6) * 45;
           const isTarget = i === numNodes - 1;
           const randOsc = Math.sin(now * 0.002 + i) * 15;
           
           const nx = Math.cos(ang) * (dist + randOsc);
           const ny = Math.sin(ang) * (dist + randOsc);
           
           const tnX = isTarget ? 0 : nx;
           const tnY = isTarget ? 0 : ny;

           // Links to previous nodes
           if (i > 0 && !isTarget) {
             const prevAng = ((i - 1) * 137.5) * (Math.PI / 180) + now * 0.00015;
             const prevDist = 45 + ((i - 1) % 6) * 45;
             const pRand = Math.sin(now * 0.002 + (i - 1)) * 15;
             const px = Math.cos(prevAng) * (prevDist + pRand);
             const py = Math.sin(prevAng) * (prevDist + pRand);

             ctx.strokeStyle = `rgba(220, 20, 20, ${0.35 * np})`;
             ctx.lineWidth = 0.8;
             if (Math.random() > 0.03) { // Slight flicker
               ctx.beginPath();
               ctx.moveTo(px, py);
               ctx.lineTo(tnX, tnY);
               ctx.stroke();
             }
           }

           if (isTarget && lockP > 0.85) {
               // Final fixation connection lines
               for(let j = 0; j < numNodes - 1; j++) {
                   const jAng = (j * 137.5) * (Math.PI / 180) + now * 0.00015;
                   const jDist = 45 + (j % 6) * 45;
                   const jRand = Math.sin(now * 0.002 + j) * 15;
                   const jx = Math.cos(jAng) * (jDist + jRand);
                   const jy = Math.sin(jAng) * (jDist + jRand);

                   const flash = Math.random() > 0.2 ? 0.8 : 0.2;
                   ctx.strokeStyle = `rgba(255, 30, 30, ${flash * np})`;
                   ctx.lineWidth = 1.2;
                   ctx.beginPath();
                   ctx.moveTo(jx, jy);
                   ctx.lineTo(tnX, tnY);
                   ctx.stroke();
               }
           }
           
           // Node circle
           const pulse = (Math.sin(now * 0.006 + i * 2) * 0.5 + 0.5) * 0.5;
           ctx.fillStyle = isTarget ? `rgba(255, 0, 0, ${0.45 * np + pulse})` : `rgba(200, 15, 15, ${0.15 * np + pulse*0.5})`;
           ctx.beginPath();
           ctx.arc(tnX, tnY, isTarget ? 15 + pulse*12 : 3.5 + pulse*3, 0, Math.PI * 2);
           ctx.fill();
           ctx.strokeStyle = `rgba(255, 40, 40, ${np})`;
           ctx.lineWidth = isTarget ? 2 : 1;
           ctx.stroke();

           // Floating signatures overlay
           if (np > 0.5) {
             const lblA = (np - 0.5) * 2;
             ctx.fillStyle = isTarget ? `rgba(255, 255, 255, ${lblA})` : `rgba(255, 100, 100, ${lblA * 0.65})`;
             ctx.font = isTarget ? '8px monospace' : '5px monospace';
             const scrmbl = Math.random() > 0.85 ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : '0';
             const sigId = `O.ID-${(i * 991).toString(16).toUpperCase()}-${scrmbl}`;
             const sig = isTarget ? `[ TGT-LOCK / MATCH ]` : sigId;
             
             ctx.fillText(sig, tnX + (isTarget ? -38 : 7), tnY - (isTarget ? 38 : 5));
             if (isTarget) {
                 ctx.fillStyle = `rgba(255, 80, 80, ${lblA})`;
                 ctx.fillText(`CONFIDENCE: 99.98%`, tnX - 38, tnY - 26);
             }
           }
        }
      }
      ctx.restore();

      // Пульсуюче ядро при lock
      if (lockP > 0.75) {
        const la = (lockP - 0.75) / 0.25;
        const pulse = Math.sin(now * 0.014) * 0.5 + 0.5;
        ctx.fillStyle=`rgba(220,38,38,${0.5*la*pulse})`;
        ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
        // Flash overlay
        ctx.fillStyle=`rgba(220,38,38,${0.12*la*(Math.sin(now*0.018)*0.3+0.7)})`;
        ctx.fillRect(-W/2,-H/2,W,H);
      }
      ctx.restore();
    }

    /* ══ ФАЗА 4: SOVEREIGN REVEAL ══ */
    if (cp === 4) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[4]);

      // Вхідний спалах
      if (elapsed < 320) {
        ctx.fillStyle=`rgba(255,255,255,${(1-elapsed/320)*0.85})`; ctx.fillRect(0,0,W,H);
      }

      // Ударні хвилі
      if (elapsed < 2000) {
        const wp=elapsed/2000;
        for (let ring=0;ring<4;ring++) {
          const rp=Math.max(0,wp-ring*0.12); if(rp<=0) continue;
          const r=rp*Math.max(W,H)*0.65;
          ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
          ctx.strokeStyle=`rgba(220,38,38,${(1-rp)*0.4})`; ctx.lineWidth=2.5-ring*0.5; ctx.stroke();
        }
        ctx.strokeStyle=`rgba(220,38,38,${(1-elapsed/2000)*0.35})`; ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(cx-(elapsed/2000)*W,cy); ctx.lineTo(cx+(elapsed/2000)*W,cy);
        ctx.moveTo(cx,cy-(elapsed/2000)*H); ctx.lineTo(cx,cy+(elapsed/2000)*H);
        ctx.stroke();
      }

      // Пульсуючий ореол
      const hb = Math.sin(now * 0.005) * 0.5 + 0.5;
      const glR = 210 + hb * 45;
      const og = ctx.createRadialGradient(cx,cy,glR*0.15,cx,cy,glR*2.6);
      og.addColorStop(0,`rgba(220,38,38,${0.2*p})`);
      og.addColorStop(0.35,`rgba(180,10,10,${0.08*p})`);
      og.addColorStop(0.75,`rgba(60,3,3,${0.02*p})`);
      og.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=og; ctx.beginPath(); ctx.arc(cx,cy,glR*2.6,0,Math.PI*2); ctx.fill();

      // Промені з центру
      ctx.save(); ctx.translate(cx,cy);
      for (let i=0;i<28;i++) {
        const a=((i/28)*Math.PI*2)+now*0.00038;
        const rl=glR*(1.5+Math.sin(now*0.0025+i)*0.35);
        const ra=(Math.sin(now*0.0038+i*0.75)*0.5+0.5)*0.09*p;
        if (i%3===0) {
          const rg2=ctx.createLinearGradient(0,0,Math.cos(a)*rl,Math.sin(a)*rl);
          rg2.addColorStop(0,`rgba(220,38,38,${ra*2})`); rg2.addColorStop(1,'rgba(220,38,38,0)');
          ctx.strokeStyle=rg2; ctx.lineWidth=2.2;
          ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*rl,Math.sin(a)*rl); ctx.stroke();
        }
      }
      // Золоті промені (додатково)
      for (let i=0;i<14;i++) {
        const a=((i/14)*Math.PI*2)+now*0.00022+Math.PI/14;
        const rl=glR*(1.2+Math.sin(now*0.0015+i)*0.2);
        const ra=(Math.sin(now*0.002+i)*0.5+0.5)*0.04*p;
        const rg3=ctx.createLinearGradient(0,0,Math.cos(a)*rl,Math.sin(a)*rl);
        rg3.addColorStop(0,`rgba(200,160,20,${ra*2})`); rg3.addColorStop(1,'rgba(180,130,0,0)');
        ctx.strokeStyle=rg3; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*rl,Math.sin(a)*rl); ctx.stroke();
      }

      // Зовнішнє кільце з засічками
      const rimR=glR*1.12+hb*6;
      ctx.beginPath(); ctx.arc(0,0,rimR,0,Math.PI*2);
      ctx.strokeStyle=`rgba(220,38,38,${0.18*p})`; ctx.lineWidth=1; ctx.stroke();
      for (let i=0;i<90;i++) {
        const a=((i/90)*Math.PI*2)+now*0.0005;
        const len=i%9===0?16:i%3===0?9:5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*rimR,Math.sin(a)*rimR);
        ctx.lineTo(Math.cos(a)*(rimR+len),Math.sin(a)*(rimR+len));
        ctx.strokeStyle=`rgba(220,38,38,${(i%9===0?0.6:i%3===0?0.3:0.15)*p})`;
        ctx.lineWidth=i%9===0?2:0.8; ctx.stroke();
      }
      ctx.restore();
    }

    /* ══ ФАЗА 5: FADE OUT ══ */
    if (cp === 5) {
      const p=Math.min(1,elapsed/PHASE_DURATIONS[5]);
      ctx.fillStyle=`rgba(1,4,9,${p})`; ctx.fillRect(0,0,W,H);
    }

    ctx.restore();

    /* ── Плівкове зерно ── */
    if (cp < 5) {
      ctx.fillStyle=`rgba(255,255,255,${0.011+Math.random()*0.007})`;
      for (let i=0;i<4500;i++) ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [phase]);

  /* ── Фазовий контролер ── */
  useEffect(() => {
    if (skipRef.current) return;
    const dur = PHASE_DURATIONS[phase];
    if (!dur) return;
    const t = setTimeout(() => {
      if (phase < 5) { setPhase(p => (p + 1) as Phase); phaseStart.current = Date.now(); }
      else { droneStopRef.current?.(); onComplete(); }
    }, dur);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  /* ── Canvas init ── */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const c = canvas.getContext('2d'); if (c) c.scale(dpr, dpr);
    };
    resize(); window.addEventListener('resize', resize);
    animFrameRef.current = requestAnimationFrame(render);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animFrameRef.current); };
  }, [render]);

  /* ── Skip ── */
  const [skipAllowed, setSkipAllowed] = useState(true); // Always allowed in dev/mirror mode
  useEffect(() => { const t = setTimeout(() => setSkipAllowed(true), 1500); return () => clearTimeout(t); }, []);
  const handleSkip = () => {
    if (!skipAllowed) return;
    skipRef.current = true; droneStopRef.current?.(); setPhase(5);
  };

  const fadeV = {
    initial: { opacity: 0, scale: 0.96, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit:    { opacity: 0, scale: 1.04, filter: 'blur(14px)' },
  };
  const smooth = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] };

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] bg-black overflow-hidden font-mono select-none cursor-default"
      onClick={handleSkip}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-[5]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.09) 2px,rgba(0,0,0,0.09) 4px)',
      }}/>

      {/* Noise */}
      <div className="absolute inset-0 pointer-events-none z-[6] opacity-[0.035] mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
      }}/>

      {/* Vignette — сильна рамкова темрява для кінематографічності */}
      <div className="absolute inset-0 pointer-events-none z-[8]" style={{
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.85) 100%)',
      }}/>

      {/* ══ HUD ОВЕРЛЕЙ (фази 1-4) ══ */}
      <AnimatePresence>
        {phase >= 1 && phase < 5 && (
          <motion.div
            key="hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none z-[25]"
          >
            {/* ─── КУТОВІ L-МАРКЕРИ ПРИЦІЛУ ─── */}
            {([['top-0 left-0',0],['top-0 right-0',1],['bottom-0 left-0',2],['bottom-0 right-0',3]] as [string,number][]).map(([pos,i]) => (
              <div key={i} className={`absolute ${pos} w-24 h-24`}>
                <div className="absolute inset-3 border-red-700/60" style={{
                  borderTopWidth:    i < 2  ? '1.5px' : 0,
                  borderBottomWidth: i >= 2 ? '1.5px' : 0,
                  borderLeftWidth:   i%2===0 ? '1.5px' : 0,
                  borderRightWidth:  i%2!==0 ? '1.5px' : 0,
                }}/>
                <div className="absolute inset-6 border-red-800/25" style={{
                  borderTopWidth:    i < 2  ? '1px' : 0,
                  borderBottomWidth: i >= 2 ? '1px' : 0,
                  borderLeftWidth:   i%2===0 ? '1px' : 0,
                  borderRightWidth:  i%2!==0 ? '1px' : 0,
                }}/>
              </div>
            ))}

            {/* ─── ВЕРХНІЙ ЛІВИЙ БЛОК — КЛАСИФІКАЦІЯ ─── */}
            <div className="absolute top-8 left-8 space-y-2">
              {/* Статус LIVE */}
              <div className="flex items-center gap-2.5 mb-1">
                <div className="relative w-2 h-2">
                  <div className="w-full h-full bg-red-600 rounded-full shadow-[0_0_12px_#dc2626,0_0_24px_rgba(220,38,38,0.5)]"/>
                  <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-30"/>
                </div>
                <span className="text-[9px] font-black tracking-[0.6em] text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.7)] uppercase">
                  АКТИВНА СЕСІЯ
                </span>
              </div>

              {/* Рівень допуску */}
              <div className="space-y-[3px] pl-4 border-l border-red-900/40">
                <p className="text-[7px] font-black tracking-[0.45em] text-red-500/80 uppercase">
                  РІВЕНЬ ДОПУСКУ: LEVEL-5 / SOVEREIGN
                </p>
                <p className="text-[6px] text-slate-600 tracking-[0.35em] uppercase">
                  КЛАСИФІКАЦІЯ: ЦІЛКОМ ТАЄМНО // PREDATOR-ONLY
                </p>
                <p className="text-[6px] text-slate-700 tracking-[0.3em] uppercase">
                  ЛІЦЕНЗІЯ: ENTERPRISE CLASSIFIED · SERIAL #{rndHex(6)}
                </p>
              </div>

              {/* Tier badge */}
              <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-900/20 via-yellow-800/10 to-transparent border border-yellow-600/20 px-3 py-1">
                <span className="text-[6px] font-black tracking-[0.4em] text-yellow-600/90 uppercase">
                  ◆ TIER-1 INTELLIGENCE ASSET ◆
                </span>
              </div>
            </div>

            {/* ─── ВЕРХНІЙ ПРАВИЙ БЛОК — ТЕЛЕМЕТРІЯ ─── */}
            <div className="absolute top-8 right-8 text-right space-y-1.5">
              <div className="text-[7px] text-slate-600 uppercase tracking-[0.35em] font-bold">
                ПЕРЕХОПЛЕНО / ПРОАНАЛІЗОВАНО
              </div>
              <motion.div
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 0.28, repeat: Infinity }}
                className="text-2xl font-black text-red-600 font-mono tabular-nums tracking-widest"
                style={{ textShadow:'0 0 20px rgba(220,38,38,0.8),0 0 40px rgba(220,38,38,0.3)' }}
              >
                {interceptCount.toLocaleString()}
              </motion.div>
              <div className="space-y-0.5">
                <div className="text-[6px] text-slate-700 uppercase tracking-widest">
                  ВУЗЛІВ: {(4217+Math.floor(interceptCount/8000)).toLocaleString()} · ПОТОКІВ: 1,247
                </div>
                <div className="text-[6px] text-slate-700 uppercase tracking-widest">
                  БАЗ ДАНИХ: 23 · КРАЇНИ: 47 · СУПУТНИКИ: 47
                </div>
              </div>
              {/* Міні-sparkline */}
              <div className="flex items-end gap-0.5 justify-end h-4 mt-1">
                {Array.from({length:12},(_,i)=>(
                  <motion.div
                    key={i}
                    className="w-1 bg-red-800/60 rounded-sm"
                    animate={{ height: ['4px',`${8+Math.random()*8}px`,'4px'] }}
                    transition={{ duration:0.4+i*0.05, repeat:Infinity, delay:i*0.06 }}
                  />
                ))}
              </div>
            </div>

            {/* ─── ЛІВИЙ НИЖНІЙ: HEX STREAM ─── */}
            <div className="absolute bottom-28 left-8 space-y-[2px] hidden md:block">
              <div className="text-[6px] text-slate-800 uppercase tracking-[0.4em] mb-2 font-black">
                P-NET ENCRYPTED STREAM
              </div>
              {hexStream.slice(0,7).map((code, idx) => (
                <motion.div
                  key={`${code}-${idx}`}
                  initial={{ opacity:0, x:-6 }}
                  animate={{ opacity: Math.max(0, 0.75-idx*0.1) }}
                  className="text-[6.5px] text-red-600/60 font-mono tracking-wider"
                >
                  {['P-NET.ЯДРО','КВАНТ.', 'AZR.CORE','OSINT.','ATOM.FLOW'][idx%5]} ▸ {code} ▸ AUTH:OK
                </motion.div>
              ))}
            </div>

            {/* ─── ПРАВИЙ НИЖНІЙ: ПРОГРЕС ─── */}
            <div className="absolute bottom-28 right-8 w-76 space-y-2.5 text-right">
              {/* Threat level bar (фаза 3) */}
              {phase === 3 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[7px] uppercase tracking-[0.3em]">
                    <span className="text-slate-700">THREAT INDEX</span>
                    <motion.span
                      animate={{ color: threatLevel>80 ? ['#ef4444','#ff0000','#ef4444'] : ['#f97316','#ef4444'] }}
                      transition={{ duration: 0.3, repeat: Infinity }}
                      className="font-black"
                    >{Math.floor(threatLevel).toString().padStart(3,'0')}/100</motion.span>
                  </div>
                  <div className="h-[2px] bg-slate-900 overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600"
                      style={{ width:`${threatLevel}%`, boxShadow:'0 0 8px #ef4444' }}
                    />
                  </div>
                </div>
              )}
              {/* Scan progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-[7px] text-slate-700 uppercase tracking-[0.3em] font-black">
                  <span>GLOBAL SCAN</span>
                  <span className="text-red-500">{Math.floor(scanPct)}%</span>
                </div>
                <div className="h-[2px] bg-slate-900/80 overflow-hidden relative rounded-full border border-slate-800/30">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-900 via-red-600 to-red-400"
                    style={{ boxShadow:'0 0 12px #dc2626,0 0 24px rgba(220,38,38,0.25)' }}
                    animate={{ width:`${scanPct}%` }}
                    transition={{ duration:0.25, ease:'linear' }}
                  />
                  <motion.div
                    className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                    animate={{ left:['-12%','112%'] }}
                    transition={{ duration:1.6, repeat:Infinity, ease:'linear' }}
                  />
                </div>
                <div className="text-[5.5px] text-slate-800 uppercase tracking-widest">
                  CRYSTALS-KYBER-1024 · QUANTUM-SAFE · ZERO-KNOWLEDGE
                </div>
              </div>
            </div>

            {/* ─── ВЕРХНІЙ ЦЕНТР: TIMESTAMP / ВЕРСІЯ ─── */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center space-y-0.5">
              <div className="text-[6px] text-slate-800 uppercase tracking-[0.5em]">
                PREDATOR ANALYTICS · SOVEREIGN INTELLIGENCE ASSET
              </div>
              <div className="text-[5.5px] text-yellow-600/70 tracking-[0.4em] uppercase font-black">
                VERSION 56.5-ELITE · BUILD {rndHex(6)} · {new Date().toISOString().slice(0,10)}
              </div>
            </div>

            {/* ─── ТЕРМІНАЛ ВНИЗУ ─── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <div className="inline-flex items-center gap-2.5 bg-black/90 border border-red-900/35 px-7 py-2.5"
                style={{ boxShadow:'0 0 30px rgba(220,38,38,0.08),inset 0 0 20px rgba(0,0,0,0.6)' }}>
                <motion.span
                  animate={{ opacity:[0,1,0] }}
                  transition={{ duration:0.8, repeat:Infinity }}
                  className="w-1.5 h-1.5 bg-red-500 rounded-full"
                />
                <span className="text-[8px] font-black tracking-[0.28em] text-red-400/90 uppercase">
                  {typeText}
                  <span className="animate-[blink_0.75s_step-end_infinite]">▌</span>
                </span>
              </div>
            </div>

            {/* ─── Skip ─── */}
            {skipAllowed && (
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ delay:0.6 }}
                className="absolute top-8 left-1/2 -translate-x-1/2 text-[6.5px] text-slate-800 uppercase tracking-[0.45em]"
              >
                ◀ НАТИСНІТЬ ДЛЯ ПРОПУСКУ ▶
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════════
          ЦЕНТРАЛЬНИЙ КОНТЕНТ — ФАЗИ
      ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ▌ФАЗА 0 — VOID ACTIVATION */}
        {phase === 0 && (
          <motion.div key="p0" variants={fadeV} initial="initial" animate="animate" exit="exit"
            transition={smooth} className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center space-y-5">
              <motion.div
                animate={{ opacity:[0.4,1,0.4], letterSpacing:['0.5em','0.8em','0.5em'] }}
                transition={{ duration:0.7, repeat:Infinity }}
                className="text-[11px] font-black tracking-[0.6em] uppercase text-red-800"
              >ЯДРО АКТИВУЄТЬСЯ</motion.div>
              <motion.div
                animate={{ opacity:[0.2,0.6,0.2] }}
                transition={{ duration:0.5, repeat:Infinity }}
                className="text-[7px] text-red-900/60 tracking-[0.5em] uppercase font-black"
              >SOVEREIGN INTELLIGENCE CORE · INITIALIZING</motion.div>
            </div>
          </motion.div>
        )}

        {/* ▌ФАЗА 1 — CRYPTOGRAPHIC INIT */}
        {phase === 1 && (
          <motion.div key="p1" variants={fadeV} initial="initial" animate="animate" exit="exit"
            transition={smooth} className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center space-y-3">
              <div className="text-[10px] font-black tracking-[0.8em] uppercase text-red-800/70">
                КВАНТОВИЙ ПРОТОКОЛ
              </div>
              <motion.div
                animate={{ letterSpacing:['0.4em','1em','0.4em'] }}
                transition={{ duration:1.8, repeat:Infinity }}
                className="text-[16px] font-black text-white tracking-[0.6em] uppercase"
                style={{ textShadow:'0 0 25px rgba(220,38,38,0.9)' }}
              >ІНІЦІАЛІЗАЦІЯ</motion.div>
              <div className="text-[7px] text-slate-700 tracking-widest uppercase">
                CRYSTALS-KYBER-1024 · NSA SUITE-B COMPLIANT
              </div>
            </div>
          </motion.div>
        )}

        {/* ▌ФАЗА 2 — GLOBAL DOMINANCE */}
        {phase === 2 && (
          <motion.div key="p2" variants={fadeV} initial="initial" animate="animate" exit="exit"
            transition={smooth} className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center space-y-2">
              <motion.div
                animate={{ opacity:[0.7,1,0.7] }}
                transition={{ duration:0.35, repeat:Infinity }}
                className="text-[10px] font-black tracking-[0.9em] uppercase text-red-600"
              >ПЛАНЕТАРНИЙ МОНІТОРИНГ</motion.div>
              <div className="text-[7px] text-slate-700 tracking-[0.45em] uppercase">
                47 СУПУТНИКІВ · 892 ВУЗЛИ · 23 ДЕРЖРЕЄСТРИ · 1.2 PB/ГОД
              </div>
            </div>
          </motion.div>
        )}

        {/* ▌ФАЗА 3 — TARGET ACQUISITION */}
        {phase === 3 && (
          <motion.div key="p3" variants={fadeV} initial="initial" animate="animate" exit="exit"
            transition={smooth} className="absolute inset-0 flex items-center justify-center z-30">

            {/* Ліва панель — DB scan */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-80 hidden lg:block">
              <div className="border border-red-900/30 bg-black/60 p-4 space-y-2"
                style={{ backdropFilter:'blur(8px)' }}>
                <div className="flex items-center gap-2 pb-2 border-b border-red-900/30">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"/>
                  <span className="text-[7px] font-black text-red-700 tracking-[0.45em] uppercase">
                    INTEL QUERY ENGINE
                  </span>
                </div>
                {dbLines.map((line, idx) => (
                  <motion.div key={idx}
                    initial={{ opacity:0, x:-10 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ duration:0.18 }}
                    className={`text-[7px] font-mono tracking-wider flex items-start gap-1.5 ${
                      line.includes('TARGET IDENTIFIED')
                        ? 'text-red-500 font-black animate-pulse'
                        : line.includes('CRITICAL')
                        ? 'text-orange-500 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    <span className="mt-px opacity-50 text-[6px]">
                      {line.includes('TARGET') || line.includes('CRITICAL') ? '●' : '›'}
                    </span>
                    <span style={line.includes('TARGET IDENTIFIED')
                      ? {textShadow:'0 0 12px rgba(255,0,0,0.8)'} : {}}>
                      {line}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Центр */}
            <div className="text-center space-y-4 z-10">
              {targetLocked ? (
                <motion.div
                  initial={{ scale:0.7, opacity:0 }}
                  animate={{ scale:1, opacity:1 }}
                  transition={{ duration:0.25, ease:'backOut' }}
                  className="space-y-3"
                >
                  <motion.div
                    animate={{
                      opacity:[0.85,1,0.85],
                      textShadow:['0 0 40px rgba(255,0,0,0.8)','0 0 80px rgba(255,0,0,1)','0 0 40px rgba(255,0,0,0.8)'],
                      scale:[1, 1.05, 1]
                    }}
                    transition={{ duration:0.25, repeat:Infinity }}
                    className="text-[24px] font-black tracking-[0.35em] text-red-600 uppercase"
                  >
                    ✛ ЦІЛЬ ЗНИЩЕНО. ВІД НАС НЕ СХОВАЄШСЯ.
                  </motion.div>
                  <div className="text-[10px] font-black tracking-[0.65em] text-white/90 uppercase animate-pulse">
                    THREAT NEUTRALIZED · DIGITAL DETONATION CONFIRMED
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity:[0.5,1,0.5] }}
                  transition={{ duration:0.5, repeat:Infinity }}
                  className="text-[11px] font-black tracking-[0.6em] text-red-800 uppercase"
                >АНАЛІЗ ЦІЛІ...</motion.div>
              )}
            </div>

            {/* Права панель — AI метрики */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-68 hidden lg:block">
              <div className="border border-blue-900/25 bg-black/60 p-4 space-y-3"
                style={{ backdropFilter:'blur(8px)' }}>
                <div className="flex items-center gap-2 pb-2 border-b border-blue-900/25">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"/>
                  <span className="text-[7px] font-black text-blue-700/80 tracking-[0.4em] uppercase">
                    AI NEURAL ENGINE
                  </span>
                </div>
                {([
                  {l:'MATCHING ACCURACY', v:'97.4%',  c:'text-green-500'},
                  {l:'RISK SCORE',         v:'9.8/10', c:'text-red-500'},
                  {l:'DATA SOURCES',       v:'1,847',  c:'text-blue-400'},
                  {l:'CROSS-REFERENCES',   v:'12,394', c:'text-slate-400'},
                  {l:'AI CONFIDENCE',      v:'99.1%',  c:'text-yellow-500'},
                  {l:'EXPOSURE $USD',      v:'$42.7M', c:'text-orange-400'},
                ] as {l:string,v:string,c:string}[]).map((item,idx)=>(
                  <motion.div key={idx}
                    initial={{ opacity:0, x:10 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:idx*0.14+0.4 }}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[6.5px] text-slate-700 uppercase tracking-wider">{item.l}</span>
                    <motion.span
                      animate={{ opacity:[0.7,1,0.7] }}
                      transition={{ duration:0.35, repeat:Infinity, delay:idx*0.09 }}
                      className={`text-[8px] font-black font-mono ${item.c}`}
                      style={item.c.includes('red') ? {textShadow:'0 0 8px rgba(220,38,38,0.6)'} : {}}
                    >{item.v}</motion.span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ▌ФАЗА 4 — SOVEREIGN REVEAL */}
        {phase === 4 && (
          <motion.div key="p4" variants={fadeV} initial="initial" animate="animate" exit="exit"
            transition={{ duration:0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-30">

            {/* Логотип */}
            <motion.div
              initial={{ scale:4, opacity:0, filter:'blur(24px)' }}
              animate={{ scale:1, opacity:1, filter:'blur(0px)' }}
              transition={{ duration:1.3, ease:[0.12,1,0.32,1] }}
              className="relative mb-16 w-48 h-48 md:w-60 md:h-60"
            >
              {/* Зовнішні кільця */}
              <motion.div animate={{ rotate:360 }} transition={{ duration:20, repeat:Infinity, ease:'linear' }}
                className="absolute -inset-6 rounded-full border border-red-800/30" style={{ borderStyle:'dashed' }}/>
              <motion.div animate={{ rotate:-360 }} transition={{ duration:32, repeat:Infinity, ease:'linear' }}
                className="absolute -inset-11 rounded-full border border-red-900/15" style={{ borderStyle:'dotted' }}/>
              {/* Золоте кільце */}
              <motion.div
                animate={{ rotate:360, opacity:[0.3,0.6,0.3] }}
                transition={{ duration:15, repeat:Infinity, ease:'linear' }}
                className="absolute -inset-3 rounded-full"
                style={{ border:'1px solid rgba(180,140,20,0.25)' }}
              />
              {/* Пульсуюча аура */}
              <motion.div
                animate={{ scale:[1,1.1,1], opacity:[0.35,0.75,0.35] }}
                transition={{ duration:2.2, repeat:Infinity }}
                className="absolute -inset-4 rounded-full"
                style={{ background:'radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)' }}
              />
              {/* Герб */}
              <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background:'radial-gradient(circle at 38% 32%, rgba(35,5,5,0.97) 0%, rgba(1,4,9,0.99) 100%)',
                  border:'2px solid rgba(220,38,38,0.75)',
                  boxShadow:'0 0 70px rgba(220,38,38,0.45),0 0 140px rgba(220,38,38,0.2),inset 0 0 40px rgba(220,38,38,0.07)',
                }}>
                {/* Внутрішні деталі */}
                <div className="absolute inset-3 rounded-full border border-red-700/18"/>
                <div className="absolute inset-6 rounded-full border border-red-900/10"/>
                {/* Золота горизонтальна лінія */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px opacity-20" style={{
                    background:'linear-gradient(to right,transparent,rgba(180,140,20,0.8),transparent)'
                  }}/>
                </div>
                {/* Сканлінія */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background:'linear-gradient(to right,transparent,rgba(220,38,38,0.55),transparent)', height:'1.5px', top:'50%' }}
                  animate={{ scaleX:[0,1,0], translateY:['-220%','220%'] }}
                  transition={{ duration:2.8, repeat:Infinity, ease:'linear' }}
                />
                {/* Логотип */}
                <div className="w-[60%] h-[60%] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.55)]">
                  <GeometricRaptor className="w-full h-full object-contain"/>
                </div>
              </div>
            </motion.div>

            {/* Текст */}
            <motion.div
              initial={{ y:55, opacity:0 }}
              animate={{ y:0, opacity:1 }}
              transition={{ delay:0.85, duration:1, ease:'easeOut' }}
              className="text-center space-y-7"
            >
              {/* Головний заголовок */}
              <motion.h1
                animate={{
                  textShadow:[
                    '0 0 15px rgba(220,38,38,0.6),0 0 60px rgba(220,38,38,0.2)',
                    '0 0 40px rgba(180,140,20,0.8), 0 0 100px rgba(180,140,20,0.4)',
                    '0 0 30px rgba(220,38,38,1),0 0 100px rgba(220,38,38,0.45)',
                    '0 0 15px rgba(220,38,38,0.6),0 0 60px rgba(220,38,38,0.2)',
                  ],
                  scale: [1, 1.02, 0.98, 1],
                }}
                transition={{ duration:4, repeat:Infinity }}
                className="text-8xl md:text-[12rem] font-black tracking-[-0.05em] text-white uppercase italic"
              >PREDATOR</motion.h1>

              {/* Роздільник з ромбом */}
              <motion.div
                initial={{ opacity:0, scaleX:0 }}
                animate={{ opacity:1, scaleX:1 }}
                transition={{ delay:1.35, duration:1.1, ease:'easeOut' }}
                className="flex items-center justify-center gap-4"
              >
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-700 to-transparent"/>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-yellow-600/60 rotate-45"/>
                  <h2 className="text-[11px] md:text-[16px] font-black tracking-[0.8em] text-yellow-500/90 uppercase whitespace-nowrap italic skew-x-[-12deg]">
                    СУВЕРЕННИЙ ПРЕДАТОР · ELITE ASSET
                  </h2>
                  <div className="w-1 h-1 bg-yellow-600/60 rotate-45"/>
                </div>
                <div className="h-px w-32 bg-gradient-to-l from-transparent via-red-700 to-transparent"/>
              </motion.div>

              {/* Підзаголовок */}
              <motion.div
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ delay:1.85, duration:0.9 }}
                className="space-y-1.5"
              >
                <div className="text-[9px] text-slate-600 tracking-[0.55em] uppercase">
                  OSINT · МИТНА РОЗВІДКА · КОРПОРАТИВНИЙ КОНТРОЛЬ · СУВЕРЕННИЙ ПРЕДАТОР
                </div>
                <div className="text-[7px] text-slate-800 tracking-[0.4em] uppercase">
                  12.4 EXABYTE · 47 SATELLITE FEEDS · 23 STATE REGISTRIES · NEURAL CORE v56.5-ELITE
                </div>
              </motion.div>

              {/* СЛОГАН */}
              <motion.div
                initial={{ opacity:0, y:12 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:2.3, duration:0.9 }}
                className="space-y-4"
              >
                <motion.p
                  animate={{
                    opacity:[0.8,1,0.8],
                    textShadow:[
                      '0 0 20px rgba(180,140,20,0.6)',
                      '0 0 40px rgba(220,38,38,1)',
                      '0 0 20px rgba(180,140,20,0.6)',
                    ],
                  }}
                  transition={{ duration:2, repeat:Infinity }}
                  className="text-[20px] md:text-[32px] font-black tracking-[0.3em] text-white uppercase italic"
                >
                  НІХТО НЕ ЗМІГ СХОВАТИСЯ.
                </motion.p>
                <div className="flex items-center justify-center gap-6">
                  <div className="h-px w-20 bg-red-900/30"/>
                  <motion.p
                    animate={{ opacity:[0.4,0.9,0.4] }}
                    transition={{ duration:3, repeat:Infinity, delay:0.8 }}
                    className="text-[10px] text-red-100 tracking-[0.65em] uppercase font-black italic"
                  >
                    TOTAL VISIBILITY · ZERO UNCERTAINTY
                  </motion.p>
                  <div className="h-px w-20 bg-red-900/30"/>
                </div>
                <motion.p
                  animate={{ opacity:[0.4,0.8,0.4] }}
                  transition={{ duration:3.5, repeat:Infinity, delay:0.8 }}
                  className="text-[9px] text-red-800/70 tracking-[0.55em] uppercase font-black"
                >
                  TOTAL VISIBILITY &nbsp;◊&nbsp; ZERO UNCERTAINTY &nbsp;◊&nbsp; ABSOLUTE PRECISION
                </motion.p>
                <p className="text-[7px] text-slate-700 tracking-[0.5em] uppercase font-bold">
                  FOR AUTHORIZED EYES ONLY &nbsp;·&nbsp; CLASSIFIED INTEL PLATFORM &nbsp;·&nbsp; TIER-1
                </p>
              </motion.div>

              {/* Фінальна мітка + кнопка */}
              <motion.div
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:[0,1,0,1,1], scale:[0.9,1.03,1] }}
                transition={{ delay:2.9, duration:0.7 }}
                className="pt-3 space-y-4"
              >
                {/* Encrypted badge — золото з анімацією */}
                <motion.div
                  animate={{ opacity:[0.5,1,0.5] }}
                  transition={{ duration:2, repeat:Infinity }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="h-px w-20 bg-gradient-to-r from-transparent to-yellow-800/40"/>
                  <span className="text-[7px] text-yellow-700/70 tracking-[0.55em] uppercase font-black">
                    ■ CLASSIFIED — ACCESS GRANTED ■
                  </span>
                  <div className="h-px w-20 bg-gradient-to-l from-transparent to-yellow-800/40"/>
                </motion.div>

                {/* Кнопка входу */}
                <div className="inline-block relative group" onClick={onComplete}>
                  <div className="absolute inset-0 bg-red-700 blur-2xl opacity-25 group-hover:opacity-55 transition-opacity duration-500"/>
                  {/* Золота рамка */}
                  <div className="absolute -inset-px bg-gradient-to-r from-yellow-900/35 via-red-600/50 to-yellow-900/35"/>
                  <div
                    className="relative text-[11px] text-white font-black tracking-[1.4em] uppercase px-14 py-4 bg-gradient-to-r from-slate-950 via-red-950/90 to-slate-950 cursor-pointer border border-red-700/60 group-hover:border-red-500/90 transition-all duration-400"
                    style={{ boxShadow:'0 0 60px rgba(220,38,38,0.5),0 0 120px rgba(220,38,38,0.2),inset 0 1px 0 rgba(255,255,255,0.08)' }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity:[0,0.3,0] }}
                      transition={{ duration:1.6, repeat:Infinity }}
                      style={{ background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)' }}
                    />
                    УВІЙТИ ДО СИСТЕМИ
                  </div>
                </div>

                {/* Додатковий рядок — таємна мітка */}
                <motion.div
                  animate={{ opacity:[0.2,0.5,0.2] }}
                  transition={{ duration:4, repeat:Infinity }}
                  className="text-[5.5px] text-slate-900 tracking-[0.6em] uppercase font-black text-center"
                >
                  PREDATOR ANALYTICS · SOVEREIGN INTELLIGENCE CORE · BUILD {rndHex(6)} · TIER-1 CLASSIFIED
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default BootScreen;
