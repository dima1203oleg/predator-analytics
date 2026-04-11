/**
 * BootScreen — PREDATOR NEXUS v56.1.4 — SOVEREIGN CORE INITIALIZATION
 * =======================================================================
 * Кінематографічна заставка рівня AAA. Створює атмосферу страху, влади
 * та абсолютного технічного домінування.
 *
 * Фази:
 *  0 → РОЗРИВ ТИШІ    — темрява, низька частота, прорив крізь шум
 *  1 → КВАНТОВЕ РУКОСТИСКАННЯ — математична геометрія, шифрування
 *  2 → ГЛОБАЛЬНЕ СКАНУВАННЯ  — радар, орбіти, перехоплення трафіку
 *  3 → SOVEREIGN REVEAL     — поява PREDATOR, кров'яне світіння
 *  4 → FADE OUT
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GeometricRaptor } from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 0 | 1 | 2 | 3 | 4;

const PHASE_DURATIONS: Record<Phase, number> = {
  0: 1600,  // РОЗРИВ ТИШІ     — стрімкий і агресивний
  1: 2200,  // КВАНТОВЕ РУКОСТИСКАННЯ
  2: 2800,  // ГЛОБАЛЬНЕ СКАНУВАННЯ — достатньо для радару
  3: 5000,  // SOVEREIGN REVEAL — монументальний момент
  4: 1000,  // FADE OUT
};

/* ───────────────────────────────────────────────────────────────────────────
   WEB AUDIO ENGINE — Синтезовані звуки без зовнішніх файлів
   ─────────────────────────────────────────────────────────────────────── */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  /** Підземний гул системи, що пробуджується */
  playAwaken() {
    const ctx = this.getCtx();
    if (!ctx) return;

    // Низький sub-bass удар
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(28, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(18, ctx.currentTime + 1.8);
    filter.type = 'lowpass';
    filter.frequency.value = 80;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.8);

    // Glitch burst — короткий рандомний шум
    setTimeout(() => {
      const ctx2 = this.getCtx();
      if (!ctx2) return;
      const bufSize = ctx2.sampleRate * 0.05;
      const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx2.createBufferSource();
      src.buffer = buf;
      const g = ctx2.createGain();
      g.gain.setValueAtTime(0.15, ctx2.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.05);
      src.connect(g);
      g.connect(ctx2.destination);
      src.start();
    }, 100);
  }

  /** Квантовий тон — математично чистий */
  playQuantumTone() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const freqs = [110, 220, 330];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.1 + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 1.5);
    });
  }

  /** Радарний пінг — механічний і точний */
  playRadarPing() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  /** Масивний удар — SOVEREIGN REVEAL */
  playImpact() {
    const ctx = this.getCtx();
    if (!ctx) return;

    // Головний удар
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
    }
    dist.curve = curve;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(22, ctx.currentTime + 1.2);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(30, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    osc.connect(dist);
    dist.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc2.start();
    osc.stop(ctx.currentTime + 2.8);
    osc2.stop(ctx.currentTime + 2.8);

    // Металевий клацання
    setTimeout(() => {
      const c = this.getCtx();
      if (!c) return;
      const bufSize = c.sampleRate * 0.4;
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.08));
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
      src.connect(g);
      g.connect(c.destination);
      src.start();
    }, 40);
  }

  /** Телеметричний пікселювальний звук */
  playTelemetry(freq = 1200) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /** Безперервний гул обертання */
  startDrone(): (() => void) | null {
    const ctx = this.getCtx();
    if (!ctx) return null;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 40;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    osc.connect(filter);
    filter.connect(gain);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.8);
    gain.connect(ctx.destination);
    osc.start();
    return () => {
      try {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        setTimeout(() => { try { osc.stop(); } catch {} }, 450);
      } catch {}
    };
  }
}

const soundEngine = new SoundEngine();

/* ───────────────────────────────────────────────────────────────────────────
   ГОЛОВНИЙ КОМПОНЕНТ
   ─────────────────────────────────────────────────────────────────────── */
const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const droneStopRef = useRef<(() => void) | null>(null);

  const [phase, setPhase] = useState<Phase>(0);
  const phaseStartTimeMs = useRef(Date.now());
  const skipRef = useRef(false);

  /* ─ Лічильники та HUD-дані ─ */
  const [interceptCount, setInterceptCount] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [hexStream, setHexStream] = useState<string[]>([]);
  const [typewriterText, setTypewriterText] = useState('');

  const PHASE_TEXTS: Record<number, string> = {
    0: '',
    1: '> ВСТАНОВЛЕННЯ КВАНТОВОГО КАНАЛУ [AES-512-GCM]...',
    2: '> ГЛОБАЛЬНА РОЗВІДКА: ПЕРЕХОПЛЕННЯ АКТИВОВАНО',
    3: '> СУВЕРЕННИЙ ДОСТУП ПІДТВЕРДЖЕНО — ЛАСКАВО ПРОСИМО',
  };

  /* ─ Typewriter effect для кожної фази ─ */
  useEffect(() => {
    const target = PHASE_TEXTS[phase] ?? '';
    let i = 0;
    setTypewriterText('');
    const id = setInterval(() => {
      i++;
      setTypewriterText(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ─ HUD потоки ─ */
  useEffect(() => {
    const iInterval = setInterval(() => {
      setInterceptCount((p) => p + Math.floor(Math.random() * 12000 + 3000));
      if (phase >= 1 && phase <= 2) soundEngine.playTelemetry(800 + Math.random() * 600);
    }, 60);
    const sInterval = setInterval(() => {
      setScanProgress((p) => Math.min(100, p + Math.random() * 2.5 + 0.5));
    }, 35);
    const hInterval = setInterval(() => {
      const code = `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0')}`;
      setHexStream((prev) => [code, ...prev].slice(0, 12));
    }, 80);
    return () => {
      clearInterval(iInterval);
      clearInterval(sInterval);
      clearInterval(hInterval);
    };
  }, [phase]);

  /* ─ Звуки при зміні фаз ─ */
  useEffect(() => {
    if (phase === 0) soundEngine.playAwaken();
    if (phase === 1) soundEngine.playQuantumTone();
    if (phase === 2) soundEngine.playRadarPing();
    if (phase === 3) {
      soundEngine.playImpact();
      droneStopRef.current = soundEngine.startDrone();
    }
    if (phase === 4) {
      droneStopRef.current?.();
      soundEngine.playTelemetry(400);
    }
  }, [phase]);

  /* ─ Canvas рендер ─ */
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

    /* ── Розрахунок Camera Shake ── */
    let shakeX = 0;
    let shakeY = 0;
    if (currentPhase < 4) {
      const shakeIntensity = currentPhase === 0 ? 0.3 : currentPhase === 1 ? 0.8 : currentPhase === 3 ? 1.5 : 0.2;
      shakeX = (Math.random() - 0.5) * shakeIntensity * 4;
      shakeY = (Math.random() - 0.5) * shakeIntensity * 4;
    }

    /* ── Базове очищення з motion trail ── */
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    const cx = w / 2;
    const cy = h / 2;

    /* ── Атмосферне центральне червоне світіння (завжди) ── */
    if (currentPhase < 4) {
      const intensity = currentPhase === 3 ? 0.12 : 0.03;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
      grd.addColorStop(0, `rgba(180, 10, 10, ${intensity})`);
      grd.addColorStop(0.5, `rgba(60, 5, 5, ${intensity * 0.3})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }

    /* ══ ФАЗА 0: РОЗРИВ ТИШІ ─ цифровий хаос що організується ══ */
    if (currentPhase === 0) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[0]);

      // Хаотичні глітч-рядки
      for (let i = 0; i < 30; i++) {
        const glitchY = Math.random() * h;
        const glitchH = Math.random() * 8 + 1;
        const glitchX = Math.random() * w * 0.3;
        const glitchW = Math.random() * w * 0.4;
        ctx.fillStyle = `rgba(220, 38, 38, ${(1 - p) * 0.15 * Math.random()})`;
        ctx.fillRect(glitchX, glitchY, glitchW, glitchH);
      }

      // Бінарний дощ (вертикальні рядки цифр)
      ctx.font = '9px monospace';
      for (let col = 0; col < w; col += 18) {
        const chars = '01';
        const numChars = Math.floor(Math.random() * 5 + 2);
        for (let row = 0; row < numChars; row++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const alpha = (Math.random() * 0.4 + 0.05) * p;
          ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`;
          ctx.fillText(char, col, (Math.random() * h));
        }
      }

      // Геометрична сітка, що проявляється
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.08 * p})`;
      ctx.lineWidth = 1;
      const gs = 60;
      for (let x = 0; x < w; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Горизонтальна сканлінія — бляск
      const scanY = (elapsed / PHASE_DURATIONS[0]) * h;
      const scanGrd = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
      scanGrd.addColorStop(0, 'rgba(220,38,38,0)');
      scanGrd.addColorStop(0.5, `rgba(220,38,38,${0.6 * p})`);
      scanGrd.addColorStop(1, 'rgba(220,38,38,0)');
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - 3, w, 6);
    }

    /* ══ ФАЗА 1: КВАНТОВЕ РУКОСТИСКАННЯ — математична краса ══ */
    if (currentPhase === 1) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[1]);

      ctx.save();
      ctx.translate(cx, cy);

      // Фіббоначчі спіраль
      ctx.strokeStyle = `rgba(220, 38, 38, ${0.2 * p})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      const maxR = Math.min(w, h) * 0.4;
      for (let t = 0; t < 720 * p; t += 2) {
        const r = (maxR / 720) * t;
        const angle = (t * Math.PI) / 180 + now * 0.0003;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Концентричні кільця з пульсацією
      for (let ring = 1; ring <= 6; ring++) {
        const rr = (maxR / 6) * ring;
        const pulse = Math.sin(now * 0.002 + ring * 0.5) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220, 38, 38, ${(0.06 + pulse * 0.08) * p})`;
        ctx.lineWidth = ring === 6 ? 1.5 : 0.7;
        ctx.stroke();
      }

      // Обертальні зубчасті зовнішні позначки
      const numTicks = 64;
      for (let i = 0; i < numTicks; i++) {
        const angle = ((i / numTicks) * Math.PI * 2) + now * 0.001;
        const isLong = i % 8 === 0;
        const innerR = maxR * (isLong ? 1.08 : 1.04);
        const outerR = maxR * 1.15;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
        ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
        ctx.strokeStyle = `rgba(220,38,38,${(isLong ? 0.5 : 0.25) * p})`;
        ctx.lineWidth = isLong ? 1.5 : 0.7;
        ctx.stroke();
      }

      // Хрест-прицільна мітка по центру
      const crossSize = 25;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * p})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-crossSize, 0); ctx.lineTo(crossSize, 0);
      ctx.moveTo(0, -crossSize); ctx.lineTo(0, crossSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Шестикутники — нанорівень
      for (let row = -3; row <= 3; row++) {
        for (let col = -5; col <= 5; col++) {
          const hx = col * 45 + (row % 2) * 22;
          const hy = row * 40;
          const hr = 15;
          const alpha = (Math.sin(now * 0.0015 + col * 0.3 + row * 0.5) * 0.5 + 0.5) * 0.12 * p;
          ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s / 6) * Math.PI * 2;
            if (s === 0) ctx.moveTo(hx + hr * Math.cos(a), hy + hr * Math.sin(a));
            else ctx.lineTo(hx + hr * Math.cos(a), hy + hr * Math.sin(a));
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    /* ══ ФАЗА 2: ГЛОБАЛЬНЕ СКАНУВАННЯ ══ */
    if (currentPhase === 2) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[2]);
      const globeR = Math.min(w, h) * 0.35;

      ctx.save();
      ctx.translate(cx, cy);

      const rot = now * 0.0003;

      // Стилізовані континенти (хмари точок)
      const numPoints = 800;
      for (let i = 0; i < numPoints; i++) {
        const phi = Math.acos(-1 + (2 * i) / numPoints);
        const theta = Math.sqrt(numPoints * Math.PI) * phi + rot * 10;
        
        // Математична маска континентів (симуляція)
        const continentMask = Math.sin(phi * 4) * Math.cos(theta * 3) + Math.sin(theta * 2);
        if (continentMask > 0.3) {
           const gx = globeR * Math.sin(phi) * Math.cos(theta - rot);
           const gy = globeR * Math.cos(phi);
           const gz = globeR * Math.sin(phi) * Math.sin(theta - rot);
           
           if (gz > 0) { // Лише видима сторона
             const size = Math.random() * 1.5 + 0.5;
             ctx.fillStyle = `rgba(220, 38, 38, ${0.4 * p})`;
             ctx.fillRect(gx, gy, size, size);
           }
        }
      }

      // Земна куля — сітка
      ctx.lineWidth = 0.5;
      for (let i = -5; i <= 5; i++) {
        const yOff = (i / 5) * globeR;
        const rw = Math.sqrt(Math.max(0, globeR * globeR - yOff * yOff));
        if (rw > 0) {
          ctx.beginPath();
          ctx.ellipse(0, yOff, rw, rw * 0.15, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220,38,38,${0.15 * p})`;
          ctx.stroke();
        }
      }
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + rot;
        const cw = globeR * Math.abs(Math.cos(a));
        if (cw > 0.5) {
          ctx.beginPath();
          ctx.ellipse(0, 0, cw, globeR, 0, 0, Math.PI * 2);
          const vis = Math.sin(a) < 0 ? 0.08 : 0.35;
          ctx.strokeStyle = `rgba(220,38,38,${vis * p})`;
          ctx.stroke();
        }
      }

      // Орбітальні кільця
      [1.18, 1.32, 1.50].forEach((factor, idx) => {
        ctx.setLineDash(idx === 1 ? [4, 8] : []);
        const rotOffset = now * (0.0003 + idx * 0.0002) * (idx % 2 === 0 ? 1 : -1);
        ctx.save();
        ctx.rotate(rotOffset);
        ctx.beginPath();
        ctx.ellipse(0, 0, globeR * factor, globeR * factor * 0.28, 0.3 * idx, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220,38,38,${(0.12 - idx * 0.03) * p})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        ctx.setLineDash([]);
      });

      // Радарний промінь
      const radarAngle = now * 0.002;
      ctx.save();
      ctx.rotate(radarAngle);
      const sweepGrd = ctx.createConicGradient(0, 0, 0);
      sweepGrd.addColorStop(0, 'rgba(220,38,38,0)');
      sweepGrd.addColorStop(0.06, `rgba(220,38,38,${0.55 * p})`);
      sweepGrd.addColorStop(0.15, 'rgba(220,38,38,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, globeR * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = sweepGrd;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(globeR * 1.5, 0);
      ctx.strokeStyle = `rgba(255,60,60,${0.85 * p})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Цілі на радарі
      for (let i = 0; i < 10; i++) {
        const tAngle = (i / 10) * Math.PI * 2 + now * 0.00025 * (i % 2 === 0 ? 1 : -1.3);
        const tDist = globeR * (0.25 + 0.6 * Math.abs(Math.sin(now * 0.0006 + i * 1.3)));
        const tx = Math.cos(tAngle) * tDist;
        const ty = Math.sin(tAngle) * tDist;
        const pingAge = ((now * 0.001 + i) % 3) / 3;
        const pingR = pingAge * 14;

        ctx.strokeStyle = `rgba(255,255,255,${(1 - pingAge) * 0.7 * p})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tx, ty, pingR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeRect(tx - 3, ty - 3, 6, 6);

        ctx.fillStyle = `rgba(255,255,255,${0.4 * p})`;
        ctx.font = '6px monospace';
        ctx.fillText(`T${i.toString().padStart(2, '0')}`, tx + 7, ty + 2);
      }

      // АКТИВНІ ВУЗЛИ (Hot-zones)
      for (let i = 0; i < 6; i++) {
        const ha = (i / 6) * Math.PI * 2 + rot * 0.5;
        const hp = Math.sin(ha * 2);
        const hx = Math.cos(ha) * globeR * 0.8;
        const hy = Math.sin(ha) * globeR * 0.6;
        const hSize = (Math.sin(now * 0.005 + i) * 0.5 + 0.5) * 8;
        
        ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * p})`;
        ctx.beginPath();
        ctx.arc(hx, hy, hSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Індикатори активності
        ctx.strokeStyle = `rgba(255, 60, 60, ${0.8 * p})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx - hSize, hy - hSize, hSize * 2, hSize * 2);
      }

      ctx.restore();
    }

    /* ══ ФАЗА 3: SOVEREIGN REVEAL ══ */
    if (currentPhase === 3) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[3]);

      // Спалах на початку
      if (elapsed < 250) {
        const fp = 1 - elapsed / 250;
        ctx.fillStyle = `rgba(255,255,255,${fp * 0.75})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Ударні хвилі що розходяться
      if (elapsed < 1500) {
        const wp = elapsed / 1500;
        for (let ring = 0; ring < 3; ring++) {
          const ringP = Math.max(0, (wp - ring * 0.15));
          if (ringP <= 0) continue;
          const r = ringP * Math.max(w, h) * 0.6;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220,38,38,${(1 - ringP) * 0.35})`;
          ctx.lineWidth = 2 - ring;
          ctx.stroke();
        }
        // Хрестоподібні вектори
        ctx.strokeStyle = `rgba(220,38,38,${(1 - wp) * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - wp * w, cy); ctx.lineTo(cx + wp * w, cy);
        ctx.moveTo(cx, cy - wp * h); ctx.lineTo(cx, cy + wp * h);
        ctx.stroke();
      }

      // Потужне серцебиття (пульсуючий ореол)
      const heartbeat = (Math.sin(now * 0.005) * 0.5 + 0.5);
      const glowR = 220 + heartbeat * 40;

      const outerGrd = ctx.createRadialGradient(cx, cy, glowR * 0.2, cx, cy, glowR * 2.5);
      outerGrd.addColorStop(0, `rgba(220,38,38,${0.18 * p})`);
      outerGrd.addColorStop(0.4, `rgba(180,10,10,${0.07 * p})`);
      outerGrd.addColorStop(0.8, `rgba(80,5,5,${0.02 * p})`);
      outerGrd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = outerGrd;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Декоративні промені з центру — силовий ефект
      ctx.save();
      ctx.translate(cx, cy);
      const numRays = 24;
      for (let i = 0; i < numRays; i++) {
        const a = ((i / numRays) * Math.PI * 2) + now * 0.0004;
        const rayLen = glowR * (1.4 + Math.sin(now * 0.003 + i) * 0.3);
        const rayAlpha = (Math.sin(now * 0.004 + i * 0.8) * 0.5 + 0.5) * 0.08 * p;
        if (i % 3 === 0) {
          const rg = ctx.createLinearGradient(0, 0, Math.cos(a) * rayLen, Math.sin(a) * rayLen);
          rg.addColorStop(0, `rgba(220,38,38,${rayAlpha * 2})`);
          rg.addColorStop(1, 'rgba(220,38,38,0)');
          ctx.strokeStyle = rg;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * rayLen, Math.sin(a) * rayLen);
          ctx.stroke();
        }
      }

      // Зовнішнє обертальне кільце з засічками
      const rimR = glowR * 1.1 + heartbeat * 5;
      ctx.beginPath();
      ctx.arc(0, 0, rimR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(220,38,38,${0.15 * p})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      for (let i = 0; i < 72; i++) {
        const a = ((i / 72) * Math.PI * 2) + now * 0.0006;
        const len = i % 6 === 0 ? 14 : 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rimR, Math.sin(a) * rimR);
        ctx.lineTo(Math.cos(a) * (rimR + len), Math.sin(a) * (rimR + len));
        ctx.strokeStyle = `rgba(220,38,38,${(i % 6 === 0 ? 0.5 : 0.2) * p})`;
        ctx.lineWidth = i % 6 === 0 ? 1.5 : 0.7;
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ══ ФАЗА 4: FADE OUT ══ */
    if (currentPhase === 4) {
      const p = Math.min(1, elapsed / PHASE_DURATIONS[4]);
      ctx.fillStyle = `rgba(1, 4, 9, ${p})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore(); // Закриття Camera Shake

    /* ── Преміальне "Плівкове зерно" (Film Grain) ── */
    if (currentPhase < 4) {
      const grainOpacity = 0.012 + Math.random() * 0.008;
      ctx.fillStyle = `rgba(255, 255, 255, ${grainOpacity})`;
      for (let i = 0; i < 4000; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        ctx.fillRect(gx, gy, 1, 1);
      }
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
        droneStopRef.current?.();
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

  /* ─ Skip ─ */
  const [skipAllowed, setSkipAllowed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSkipAllowed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleSkip = () => {
    if (!skipAllowed) return;
    skipRef.current = true;
    droneStopRef.current?.();
    setPhase(4);
  };

  const fadeVariants = {
    initial: { opacity: 0, scale: 0.95, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(12px)' },
  };
  const smooth = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] bg-[#000000] overflow-hidden font-mono select-none"
      onClick={handleSkip}
    >
      {/* Canvas — основний рендер */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.08) 2px,
            rgba(0,0,0,0.08) 4px
          )`,
        }}
      />

      {/* Шум-текстура */}
      <div
        className="absolute inset-0 pointer-events-none z-[7] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* ══ HUD ОВЕРЛЕЙ (фази 0-3) ══ */}
      <AnimatePresence>
        {phase >= 1 && phase < 4 && (
          <motion.div
            key="hud"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none z-[20]"
          >
            {/* ── Кутові маркери прицілу ── */}
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-20 h-20`}>
                <div
                  className="absolute inset-3 border-red-700/50"
                  style={{
                    borderTopWidth: i < 2 ? '2px' : 0,
                    borderBottomWidth: i >= 2 ? '2px' : 0,
                    borderLeftWidth: i % 2 === 0 ? '2px' : 0,
                    borderRightWidth: i % 2 !== 0 ? '2px' : 0,
                  }}
                />
                <div
                  className="absolute inset-5 border-red-600/20"
                  style={{
                    borderTopWidth: i < 2 ? '1px' : 0,
                    borderBottomWidth: i >= 2 ? '1px' : 0,
                    borderLeftWidth: i % 2 === 0 ? '1px' : 0,
                    borderRightWidth: i % 2 !== 0 ? '1px' : 0,
                  }}
                />
              </div>
            ))}

            {/* ── Верхній лівий: Класифікація ── */}
            <div className="absolute top-7 left-7 space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="relative w-2.5 h-2.5">
                  <div className="w-full h-full bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_#dc2626,0_0_30px_rgba(220,38,38,0.4)]" />
                  <div className="absolute inset-0 w-full h-full bg-red-600 rounded-full animate-ping opacity-25" />
                </div>
                <span className="text-[10px] font-black tracking-[0.5em] text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                  СТРАТЕГІЧНИЙ РІВЕНЬ
                </span>
              </div>
              <p className="text-[7px] text-red-400/50 uppercase tracking-[0.35em] pl-5 font-bold">
                РІВЕНЬ ДОПУСКУ: 5-SOVEREIGN — ТІЛЬКИ АВТОРИЗОВАНИЙ ПЕРСОНАЛ
              </p>
              <p className="text-[6px] text-slate-700 uppercase tracking-widest pl-5">
                КЛАСИФІКАЦІЯ: ЦІЛКОМ ТАЄМНО // БЕЗ РОЗГОЛОШЕННЯ // PREDATOR-ONLY
              </p>
            </div>

            {/* ── Верхній правий: Телеметрія ── */}
            <div className="absolute top-7 right-7 text-right space-y-1">
              <div className="text-[8px] text-slate-600 uppercase tracking-[0.3em]">
                ПЕРЕХОПЛЕНО ТРАНЗАКЦІЙ
              </div>
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-lg font-black text-red-600 font-mono tabular-nums tracking-widest drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]"
              >
                {interceptCount.toLocaleString()}
              </motion.div>
              <div className="text-[7px] text-slate-700 uppercase tracking-widest">
                ВУЗЛІВ АКТИВНО: {(4217 + Math.floor(interceptCount / 10000)).toLocaleString()} / ПОТОКІВ: 892
              </div>
            </div>

            {/* ── Ліво знизу: Hex-потік ── */}
            <div className="absolute bottom-24 left-7 space-y-[3px] hidden md:block">
              {hexStream.slice(0, 8).map((code, idx) => (
                <motion.div
                  key={`${code}-${idx}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: Math.max(0, 0.8 - idx * 0.09) }}
                  className="text-[7px] text-red-500/70 font-mono tracking-wider"
                >
                  [{(() => {
                    const sources = ['P-NET.ЯДРО', 'КВАНТ.КАНАЛ', 'AZR.SENTINEL', 'OSINT.CORE', 'СATOM.FLOW'];
                    return sources[idx % sources.length];
                  })()}] КЛЮ4: {code} ‣ ОК
                </motion.div>
              ))}
            </div>

            {/* ── Право знизу: Прогрес ── */}
            <div className="absolute bottom-24 right-7 w-80 space-y-2 text-right">
              <div className="flex justify-between text-[9px] text-red-600/80 uppercase tracking-[0.3em] font-black">
                <span></span>
                <span className="text-red-400">{Math.floor(scanProgress)}%</span>
              </div>
              <div className="h-[2px] bg-slate-900 overflow-hidden relative rounded-full border border-slate-800/40">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-900 via-red-600 to-red-500"
                  style={{ boxShadow: '0 0 15px #dc2626, 0 0 30px rgba(220,38,38,0.3)' }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3, ease: 'linear' }}
                />
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ left: ['-10%', '110%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="text-[6px] text-slate-700 uppercase tracking-widest">
                AES-512-GCM / КВАНТОСТІЙКИЙ / НУЛЬОВЕ РОЗГОЛОШЕННЯ
              </div>
            </div>

            {/* ── Typewriter термінал (по центру знизу) ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
              <div className="inline-flex items-center gap-2 bg-black/80 border border-red-900/40 px-6 py-2 shadow-[0_0_30px_rgba(220,38,38,0.1),inset_0_0_20px_rgba(0,0,0,0.5)]">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black tracking-[0.3em] text-red-400/90 uppercase">
                  {typewriterText}
                  <span className="animate-[blink_0.8s_step-end_infinite]">▌</span>
                </span>
              </div>
            </div>

            {/* ── Skip ── */}
            {skipAllowed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-7 left-1/2 -translate-x-1/2 text-[8px] text-slate-700 uppercase tracking-[0.3em]"
              >
                НАТИСНІТЬ ДЛЯ ПРОПУСКУ
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          ЦЕНТРАЛЬНИЙ КОНТЕНТ — ФАЗИ
      ════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ФАЗА 0 — РОЗРИВ ТИШІ */}
        {phase === 0 && (
          <motion.div
            key="p0"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smooth}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5], scaleX: [0.95, 1, 0.95] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-[14px] font-black tracking-[0.7em] uppercase text-red-700"
              >
                РОЗРИВ ТИШІ
              </motion.div>
              <motion.div
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 0.4, repeat: Infinity }}
                className="text-[8px] text-red-600/50 tracking-[0.5em] uppercase font-bold"
              >
                ВСТАНОВЛЕННЯ ЗАХИЩЕНОГО КАНАЛУ
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ФАЗА 1 — КВАНТОВЕ РУКОСТИСКАННЯ */}
        {phase === 1 && (
          <motion.div
            key="p1"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smooth}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="text-center space-y-3">
              <div className="text-[12px] font-black tracking-[0.7em] uppercase text-red-700/80">
                КВАНТОВЕ
              </div>
              <motion.div
                animate={{ letterSpacing: ['0.3em', '0.8em', '0.3em'] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[18px] font-black text-white tracking-[0.5em] uppercase drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]"
              >
                РУКОСТИСКАННЯ
              </motion.div>
              <div className="text-[8px] text-slate-600 tracking-widest uppercase">
                256-БІТОВА КРИПТОГРАФІЧНА ВЕРИФІКАЦІЯ
              </div>
            </div>
          </motion.div>
        )}

        {/* ФАЗА 2 — ГЛОБАЛЬНЕ СКАНУВАННЯ */}
        {phase === 2 && (
          <motion.div
            key="p2"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={smooth}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="text-center space-y-3">
              <motion.div
                animate={{ color: ['#ef4444', '#ff6060', '#ef4444'] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                className="text-[11px] font-black tracking-[0.8em] uppercase text-red-500"
              >
                ГЛОБАЛЬНИЙ МОНІТОРИНГ
              </motion.div>
              <div className="text-[8px] text-slate-600 tracking-[0.4em] uppercase">
                СИНХРОНІЗАЦІЯ 47 СУПУТНИКІВ / 892 ВУЗЛІВ АКТИВНО
              </div>
            </div>
          </motion.div>
        )}

        {/* ФАЗА 3 — SOVEREIGN REVEAL */}
        {phase === 3 && (
          <motion.div
            key="p3"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-30"
          >
            {/* ── Логотип ── */}
            <motion.div
              initial={{ scale: 3.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.14, 1, 0.34, 1] }}
              className="relative mb-14 w-44 h-44 md:w-56 md:h-56"
            >
              {/* Зовнішні обертальні кільця */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-5 rounded-full border border-red-800/35"
                style={{ borderStyle: 'dashed' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-9 rounded-full border border-red-900/18"
                style={{ borderStyle: 'dotted' }}
              />
              {/* Пульсуюче зовнішнє світіння */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)',
                }}
              />
              {/* Герб */}
              <div
                className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
                style={{
                  background: 'radial-gradient(circle at 40% 35%, rgba(30,5,5,0.95) 0%, rgba(1,4,9,0.99) 100%)',
                  border: '2px solid rgba(220,38,38,0.7)',
                  boxShadow: '0 0 60px rgba(220,38,38,0.4), 0 0 120px rgba(220,38,38,0.2), inset 0 0 30px rgba(220,38,38,0.08)',
                }}
              >
                {/* Внутрішнє кільце */}
                <div className="absolute inset-3 rounded-full border border-red-700/20" />
                {/* Сканлінія */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to right, transparent, rgba(220,38,38,0.6), transparent)',
                    height: '2px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                  animate={{ scaleX: [0, 1, 0], translateY: ['-200%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                />
                {/* Логотип */}
                <div className="w-[62%] h-[62%] text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
                  <GeometricRaptor className="w-full h-full object-contain" />
                </div>
              </div>
            </motion.div>

            {/* ── Текст ── */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.9, ease: 'easeOut' }}
              className="text-center space-y-6"
            >
              {/* Головний заголовок */}
              <motion.h1
                animate={{
                  textShadow: [
                    '0 0 12px rgba(220,38,38,0.5), 0 0 50px rgba(220,38,38,0.2)',
                    '0 0 25px rgba(220,38,38,1), 0 0 80px rgba(220,38,38,0.4)',
                    '0 0 12px rgba(220,38,38,0.5), 0 0 50px rgba(220,38,38,0.2)',
                  ],
                }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-7xl md:text-9xl font-black tracking-[0.25em] text-white"
              >
                PREDATOR
              </motion.h1>

              {/* Роздільник */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 1.4, duration: 1, ease: 'easeOut' }}
                className="flex items-center justify-center gap-5"
              >
                <div className="h-[1px] w-28 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
                <div className="w-1.5 h-1.5 bg-red-600 rotate-45 shadow-[0_0_8px_#dc2626]" />
                <h2 className="text-[12px] md:text-[14px] font-black tracking-[1.2em] text-red-400/85 uppercase whitespace-nowrap">
                  СТРАТЕГІЧНИЙ РОЗВІДУВАЛЬНИЙ АКТИВ
                </h2>
                <div className="w-1.5 h-1.5 bg-red-600 rotate-45 shadow-[0_0_8px_#dc2626]" />
                <div className="h-[1px] w-28 bg-gradient-to-l from-transparent via-red-600 to-transparent" />
              </motion.div>

              {/* Підзаголовок */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="text-[10px] text-slate-500 tracking-[0.5em] uppercase"
              >
                OSINT · МИТНА АНАЛІТИКА · СУВЕРЕННИЙ КОНТРОЛЬ
              </motion.div>

              {/* ACCESS GRANTED блок */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: [0, 1, 0, 1, 1], scale: [0.92, 1.02, 1] }}
                transition={{ delay: 2.5, duration: 0.7 }}
                className="pt-6"
              >
                <div className="inline-block relative group">
                  <div className="absolute inset-0 bg-red-600 blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div
                    className="relative text-[12px] text-white font-black tracking-[1.2em] uppercase px-10 py-3.5 border border-red-500/60 bg-gradient-to-r from-red-900/80 via-red-700/90 to-red-900/80"
                    style={{
                      boxShadow: '0 0 40px rgba(220,38,38,0.5), 0 0 80px rgba(220,38,38,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      }}
                    />
                    ДОСТУП ДОЗВОЛЕНО
                  </div>
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
