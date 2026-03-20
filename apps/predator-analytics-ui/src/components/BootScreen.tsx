/**
 * BootScreen — "PREDATOR Neural Awakening"
 * Кінематографічна 5-фазна анімація пробудження системи.
 *
 * Фази:
 *  0 — ТЕМРЯВА: Глітч-мерехтіння, один курсор блимає
 *  1 — НЕЙРОСІТКА: Canvas частинки формують нейронну мережу
 *  2 — HUD АКТИВАЦІЯ: SVG кільця, дуги, статуси модулів
 *  3 — ЛОГОТИП: "PREDATOR" формується з частинок + морфінг тексту
 *  4 — ПЕРЕХІД: Burst-спалах → onComplete
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ─── Типи ─── */
type Phase = 0 | 1 | 2 | 3 | 4;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Цільова X для фази логотипу */
  tx: number;
  ty: number;
  radius: number;
  alpha: number;
  /** Колір у форматі hsl */
  hue: number;
  /** Час життя (для sparkle) */
  life: number;
  maxLife: number;
}

interface BootScreenProps {
  onComplete: () => void;
}

/* ─── Допоміжні константи ─── */
const PARTICLE_COUNT = 220;
const CONNECTION_DIST = 120;
const PHASE_DURATIONS: Record<Phase, number> = {
  0: 1200,   // Темрява
  1: 2800,   // Нейросітка
  2: 2500,   // HUD
  3: 2000,   // Логотип
  4: 1000,   // Перехід
};

/** Кольорова палітра PREDATOR (HSL hue значення) */
const HUES = [187, 210, 260, 36]; // cyan, blue, purple, amber

/** Модулі системи для HUD */
const MODULES = [
  { label: 'ЯДРО', angle: -90, color: '#06b6d4' },
  { label: 'НЕЙРО', angle: 0, color: '#8b5cf6' },
  { label: 'КРИПТО', angle: 90, color: '#f59e0b' },
  { label: 'OSINT', angle: 180, color: '#10b981' },
] as const;

/** Символи для "цифрового дощу" */
const MATRIX_CHARS = 'PREDATORΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ01アイウエオカキクケコ';

/* ═══════════════════════════════════════════════════════════════════════════ */

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const phaseStartRef = useRef(Date.now());
  const skipRef = useRef(false);
  const completedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const [moduleStatuses, setModuleStatuses] = useState<boolean[]>([false, false, false, false]);
  const [masterAlpha, setMasterAlpha] = useState(1);
  const [showSkipHint, setShowSkipHint] = useState(false);

  /* ─── Ініціалізація частинок ─── */
  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const hue = HUES[Math.floor(Math.random() * HUES.length)];
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        tx: w / 2 + (Math.random() - 0.5) * 300,
        ty: h / 2 + (Math.random() - 0.5) * 100,
        radius: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
        hue,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 200,
      });
    }
    particlesRef.current = particles;
  }, []);

  /* ─── Позиції літер PREDATOR для морфінгу ─── */
  const letterPositions = useMemo(() => {
    // Генеруємо точки для кожної літери "PREDATOR"
    const text = 'PREDATOR';
    const positions: Array<{ x: number; y: number }> = [];

    // Створюємо прихований canvas для тексту
    if (typeof document === 'undefined') return positions;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = 600;
    tmpCanvas.height = 120;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) return positions;

    tmpCtx.fillStyle = '#fff';
    tmpCtx.font = '900 80px Inter, sans-serif';
    tmpCtx.textAlign = 'center';
    tmpCtx.textBaseline = 'middle';
    tmpCtx.fillText(text, 300, 60);

    // Збираємо позиції пікселів
    const imageData = tmpCtx.getImageData(0, 0, 600, 120);
    const step = 4; // Щільність точок
    for (let py = 0; py < 120; py += step) {
      for (let px = 0; px < 600; px += step) {
        const i = (py * 600 + px) * 4;
        if (imageData.data[i + 3] > 128) {
          positions.push({ x: px - 300, y: py - 60 });
        }
      }
    }
    return positions;
  }, []);

  /* ─── Присвоєння цільових позицій (для фази ЛОГОТИП) ─── */
  const assignLetterTargets = useCallback(
    (w: number, h: number) => {
      const particles = particlesRef.current;
      const lp = letterPositions;
      if (!lp.length) return;

      const centerX = w / 2;
      const centerY = h / 2 - 40;
      const scale = Math.min(w / 800, 1.2);

      for (let i = 0; i < particles.length; i++) {
        if (i < lp.length) {
          particles[i].tx = centerX + lp[i].x * scale;
          particles[i].ty = centerY + lp[i].y * scale;
        } else {
          // Зайві частинки — розсіяти навколо
          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * 300;
          particles[i].tx = centerX + Math.cos(angle) * dist;
          particles[i].ty = centerY + Math.sin(angle) * dist;
        }
      }
    },
    [letterPositions],
  );

  /* ─── Матричний дощ (overlay canvas) ─── */
  const drawMatrixRain = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) => {
      ctx.clearRect(0, 0, w, h);
      if (intensity <= 0) return;

      ctx.font = '12px JetBrains Mono, monospace';
      const cols = Math.floor(w / 14);
      const rows = Math.floor(h / 16);

      for (let c = 0; c < cols; c++) {
        if (Math.random() > intensity * 0.3) continue;
        const rowCount = Math.floor(Math.random() * rows * 0.3);
        for (let r = 0; r < rowCount; r++) {
          const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const alpha = (1 - r / rowCount) * intensity * 0.15;
          ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.fillText(ch, c * 14, (Math.floor(Math.random() * rows)) * 16);
        }
      }
    },
    [],
  );

  /* ─── Головний рендер-цикл ─── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');
    if (!ctx || !octx) return;

    const w = canvas.width;
    const h = canvas.height;
    const now = Date.now();
    const elapsed = now - phaseStartRef.current;
    const particles = particlesRef.current;
    const currentPhase = skipRef.current ? 4 : phase;

    // Фон з trail-ефектом
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    /* ─ Фаза 0: Темрява ─ */
    if (currentPhase === 0) {
      // Мерехтіння
      if (Math.random() < 0.05) {
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.random() * 0.03})`;
        ctx.fillRect(0, 0, w, h);
      }
      // Курсор
      if (Math.sin(now * 0.005) > 0) {
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(w / 2 - 5, h / 2 - 8, 10, 16);
      }
      // Рідкісні глітч лінії
      if (Math.random() < 0.03) {
        const y = Math.random() * h;
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.random() * 0.1})`;
        ctx.fillRect(0, y, w, 1 + Math.random() * 3);
      }
    }

    /* ─ Фаза 1: Нейросітка ─ */
    if (currentPhase >= 1 && currentPhase <= 3) {
      const fadeIn = currentPhase === 1 ? Math.min(1, elapsed / 800) : 1;

      // Оновлення позицій
      for (const p of particles) {
        if (currentPhase === 3) {
          // Притягування до цілі
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          p.vx += dx * 0.02;
          p.vy += dy * 0.02;
          p.vx *= 0.92;
          p.vy *= 0.92;
        } else {
          // Вільний рух + м'яке притягування до центру
          const dx = w / 2 - p.x;
          const dy = h / 2 - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 350) {
            p.vx += (dx / dist) * 0.05;
            p.vy += (dy / dist) * 0.05;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Границі
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        p.life += 1;
        if (p.life > p.maxLife) p.life = 0;
      }

      // З'єднання між частинками
      if (currentPhase <= 2) {
        const maxConns = Math.min(particles.length, 160);
        for (let i = 0; i < maxConns; i++) {
          for (let j = i + 1; j < maxConns; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECTION_DIST) {
              const alpha = (1 - dist / CONNECTION_DIST) * 0.2 * fadeIn;
              ctx.beginPath();
              ctx.strokeStyle = `hsla(${particles[i].hue}, 80%, 60%, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Малюємо частинки
      for (const p of particles) {
        const pulse = 0.5 + 0.5 * Math.sin(p.life * 0.05);
        const r = p.radius * (currentPhase === 3 ? 1.5 : 1);
        const a = p.alpha * fadeIn * (0.6 + pulse * 0.4);

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${a})`;
        ctx.fill();

        // Glow
        if (r > 1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${a * 0.15})`;
          ctx.fill();
        }
      }
    }

    /* ─ Фаза 2: HUD пульс (центральні кільця на canvas) ─ */
    if (currentPhase === 2) {
      const cx = w / 2;
      const cy = h / 2;
      const t = elapsed / 1000;

      // Зовнішнє кільце (обертається)
      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Внутрішнє кільце (пульсує)
      const innerR = 100 + Math.sin(t * 3) * 10;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Радарний sweep
      const sweepAngle = t * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 160, sweepAngle, sweepAngle + 0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fill();

      // Дуги сегментів
      for (let i = 0; i < 4; i++) {
        const startAngle = (Math.PI / 2) * i + t * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 130, startAngle, startAngle + 0.8);
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + 0.1 * Math.sin(t * 2 + i)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Центральна точка
      ctx.beginPath();
      ctx.arc(cx, cy, 4 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.fill();
    }

    /* ─ Фаза 3: Логотип + фінал ─ */
    if (currentPhase === 3 && elapsed > 1200) {
      // Підзаголовок з'явиться після морфінгу
      const subAlpha = Math.min(1, (elapsed - 1200) / 600);
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(148, 163, 184, ${subAlpha * 0.7})`;
      ctx.letterSpacing = '8px';
      ctx.fillText('Н Е Й Р О Н Н А   А Н А Л І Т И К А', w / 2, h / 2 + 35);
    }

    /* ─ Фаза 4: Burst + fadeout ─ */
    if (currentPhase === 4) {
      const burstProgress = Math.min(1, elapsed / 600);
      // Розширюючий білий спалах
      const radius = burstProgress * Math.max(w, h);
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, radius);
      gradient.addColorStop(0, `rgba(6, 182, 212, ${0.3 * (1 - burstProgress)})`);
      gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.15 * (1 - burstProgress)})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    // Матричний дощ (фонова текстура)
    const matrixIntensity =
      currentPhase === 0 ? 0.2 :
      currentPhase === 1 ? 0.6 :
      currentPhase === 2 ? 0.4 :
      currentPhase === 3 ? 0.2 : 0;
    drawMatrixRain(octx, w, h, matrixIntensity);

    animFrameRef.current = requestAnimationFrame(render);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, drawMatrixRain]);

  /* ─── Управління фазами ─── */
  useEffect(() => {
    if (completedRef.current) return;

    const duration = PHASE_DURATIONS[phase];
    const timer = setTimeout(() => {
      if (completedRef.current) return;

      if (phase < 4) {
        const next = (phase + 1) as Phase;
        setPhase(next);
        phaseStartRef.current = Date.now();

        // При переході на фазу 3 — присвоїти цільові позиції
        if (next === 3 && canvasRef.current) {
          assignLetterTargets(canvasRef.current.width, canvasRef.current.height);
        }
      } else {
        // Фінал
        completedRef.current = true;
        setMasterAlpha(0);
        setTimeout(() => onComplete(), 500);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [phase, assignLetterTargets, onComplete]);

  /* ─── Глітч-ефект (рандомні спалахи) ─── */
  useEffect(() => {
    if (phase > 2) return;
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [phase]);

  /* ─── Активація модулів (фаза 2) ─── */
  useEffect(() => {
    if (phase !== 2) return;
    MODULES.forEach((_, i) => {
      setTimeout(() => {
        setModuleStatuses((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 400 + i * 500);
    });
  }, [phase]);

  /* ─── Підказка пропуску ─── */
  useEffect(() => {
    const timer = setTimeout(() => setShowSkipHint(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  /* ─── Пропуск анімації ─── */
  const handleSkip = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    skipRef.current = true;
    setMasterAlpha(0);
    setTimeout(() => onComplete(), 300);
  }, [onComplete]);

  /* ─── Setup Canvas ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      overlay.width = w * dpr;
      overlay.height = h * dpr;
      overlay.style.width = `${w}px`;
      overlay.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      const octx = overlay.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      if (octx) octx.scale(dpr, dpr);

      initParticles(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    // Запуск рендер-циклу
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Перезапуск рендер-циклу при зміні фази ─── */
  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  /* ─── Прогрес (загальний) ─── */
  const totalDuration = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);
  const elapsedTotal =
    Object.entries(PHASE_DURATIONS)
      .filter(([k]) => Number(k) < phase)
      .reduce((a, [, v]) => a + v, 0) +
    Math.min(PHASE_DURATIONS[phase], Date.now() - phaseStartRef.current);
  const progress = Math.min(100, (elapsedTotal / totalDuration) * 100);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden select-none cursor-wait"
      style={{
        opacity: masterAlpha,
        transition: 'opacity 0.5s ease-out',
        background: '#000',
      }}
      onClick={handleSkip}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSkip(); }}
      role="button"
      tabIndex={0}
      aria-label="Натисніть для пропуску завантаження"
    >
      {/* Canvas: Частинки + нейросітка */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Canvas: Матричний дощ */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 z-5 pointer-events-none opacity-60"
        style={{ width: '100%', height: '100%', mixBlendMode: 'screen' }}
      />

      {/* Глітч-оверлей */}
      {glitchActive && (
        <div
          className="absolute inset-0 z-40 pointer-events-none"
          style={{
            background: `linear-gradient(${Math.random() * 360}deg, rgba(6,182,212,0.03) 0%, transparent 100%)`,
            transform: `translateX(${Math.random() * 4 - 2}px)`,
          }}
        />
      )}

      {/* Сканлайн */}
      <div
        className="absolute left-0 right-0 z-30 pointer-events-none"
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)',
          boxShadow: '0 0 20px rgba(6,182,212,0.5)',
          animation: 'boot-scanline 3s linear infinite',
          top: '0',
        }}
      />

      {/* SVG HUD (фаза 2+) */}
      {phase >= 2 && !skipRef.current && (
        <svg
          className="absolute inset-0 z-20 pointer-events-none"
          viewBox={`0 0 ${typeof window !== 'undefined' ? window.innerWidth : 1920} ${typeof window !== 'undefined' ? window.innerHeight : 1080}`}
          style={{
            opacity: phase === 4 ? 0 : 1,
            transition: 'opacity 0.5s',
          }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Зовнішнє кільце */}
          <circle
            cx="50%"
            cy="50%"
            r="180"
            fill="none"
            stroke="rgba(6,182,212,0.15)"
            strokeWidth="1"
            strokeDasharray="8 4"
            style={{
              animation: 'boot-ring-spin 20s linear infinite',
              transformOrigin: '50% 50%',
            }}
          />

          {/* Середнє кільце */}
          <circle
            cx="50%"
            cy="50%"
            r="140"
            fill="none"
            stroke="rgba(139,92,246,0.12)"
            strokeWidth="1.5"
            strokeDasharray="20 10 5 10"
            style={{
              animation: 'boot-ring-spin-reverse 15s linear infinite',
              transformOrigin: '50% 50%',
            }}
          />

          {/* Внутрішнє кільце */}
          <circle
            cx="50%"
            cy="50%"
            r="100"
            fill="none"
            stroke="rgba(6,182,212,0.1)"
            strokeWidth="0.5"
            style={{
              animation: 'boot-ring-pulse 2s ease-in-out infinite',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
      )}

      {/* Текстовий HUD: мітки модулів (фаза 2+) */}
      {phase >= 2 && !skipRef.current && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
          {MODULES.map((mod, i) => {
            const rad = (mod.angle * Math.PI) / 180;
            const dist = 220;
            const x = Math.cos(rad) * dist;
            const y = Math.sin(rad) * dist;
            return (
              <div
                key={mod.label}
                className="absolute flex items-center gap-2 transition-all duration-700"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  opacity: moduleStatuses[i] ? 1 : 0,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: moduleStatuses[i] ? mod.color : '#334155',
                    boxShadow: moduleStatuses[i] ? `0 0 12px ${mod.color}` : 'none',
                    transition: 'all 0.5s',
                  }}
                />
                <span
                  className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase"
                  style={{ color: mod.color, opacity: 0.8 }}
                >
                  {mod.label}
                </span>
                <span className="text-[9px] font-mono text-emerald-500 opacity-70">
                  {moduleStatuses[i] ? 'ACTIVE' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Центральна інформація */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
        {/* Логотип "PREDATOR" (фаза 0–1: мерехтіння, фаза 3: яскравий) */}
        {phase >= 1 && (
          <div
            className="transition-all duration-1000"
            style={{
              opacity: phase === 1 ? 0.15 : phase >= 3 ? 1 : 0.3,
              transform: phase >= 3 ? 'scale(1)' : 'scale(0.9)',
              filter: phase < 3 ? 'blur(2px)' : 'none',
            }}
          >
            <h1
              className="text-6xl sm:text-7xl md:text-8xl font-black tracking-[-0.05em] text-transparent bg-clip-text select-none"
              style={{
                backgroundImage:
                  'linear-gradient(135deg, #06b6d4 0%, #3b82f6 30%, #8b5cf6 60%, #d946ef 100%)',
                textShadow: phase >= 3
                  ? '0 0 60px rgba(6,182,212,0.4), 0 0 120px rgba(139,92,246,0.2)'
                  : 'none',
                WebkitTextStroke: phase >= 3 ? 'none' : '1px rgba(6,182,212,0.2)',
              }}
            >
              PREDATOR
            </h1>
          </div>
        )}

        {/* Підзаголовок */}
        {phase >= 3 && (
          <div
            className="mt-4 flex items-center gap-3 transition-opacity duration-1000"
            style={{ opacity: phase >= 3 ? 0.7 : 0 }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/50" />
            <span className="text-[11px] font-mono text-slate-400 tracking-[0.4em] uppercase">
              Нейронна Аналітика
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>
        )}

        {/* Версія */}
        {phase >= 2 && (
          <div
            className="mt-6 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/30 transition-opacity duration-700"
            style={{ opacity: phase >= 2 ? 0.6 : 0 }}
          >
            <span className="text-[9px] font-mono text-cyan-400 tracking-widest">
              v55.1 • CLASSIFIED • LEVEL-5
            </span>
          </div>
        )}
      </div>

      {/* Прогрес-бар внизу */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-8 pb-8">
        {/* Кроки */}
        <div className="flex justify-between mb-3 px-1">
          {['ІНІЦІАЛІЗАЦІЯ', 'НЕЙРОСІТКА', 'МОДУЛІ', 'АКТИВАЦІЯ'].map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-1.5 transition-all duration-500"
              style={{ opacity: phase >= i ? 1 : 0.3 }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: phase > i ? '#10b981' : phase === i ? '#06b6d4' : '#1e293b',
                  boxShadow:
                    phase > i
                      ? '0 0 8px rgba(16,185,129,0.6)'
                      : phase === i
                        ? '0 0 8px rgba(6,182,212,0.6)'
                        : 'none',
                }}
              />
              <span className="text-[9px] font-mono text-slate-500 tracking-wider">{label}</span>
            </div>
          ))}
        </div>

        {/* Бар */}
        <div className="relative h-1 bg-slate-900/80 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)',
              boxShadow: '0 0 20px rgba(6,182,212,0.6), 0 0 40px rgba(139,92,246,0.3)',
            }}
          />
          {/* Ковзний блік на прогрес-барі */}
          <div
            className="absolute inset-y-0 w-20 rounded-full pointer-events-none"
            style={{
              left: `${Math.max(0, progress - 8)}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'boot-shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* Підказка пропуску */}
        {showSkipHint && !skipRef.current && (
          <div className="mt-4 text-center pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-600 tracking-wider animate-pulse">
              натисніть будь-де для швидкого старту
            </span>
          </div>
        )}
      </div>

      {/* CSS анімації */}
      <style>{`
        @keyframes boot-scanline {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes boot-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes boot-ring-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes boot-ring-pulse {
          0%, 100% { r: 100; opacity: 0.1; }
          50% { r: 105; opacity: 0.2; }
        }
        @keyframes boot-shimmer {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BootScreen;