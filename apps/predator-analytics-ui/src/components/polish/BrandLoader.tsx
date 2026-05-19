/**
 * BrandLoader — Дешифрування замість спіннера
 * v63.0-ELITE · Matrix rain + decryption reveal
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandLoaderProps {
  text?: string;
  subtext?: string;
  onComplete?: () => void;
  duration?: number;
}

const CHARS = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789@#$%&*';
const GLITCH_CHARS = '▓▒░█▄▀■▪▫◘○◙◎●◐◑◒◓◔◕◖◗';

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  text = 'PREDATOR',
  subtext = 'СУВЕРЕННИЙ АКТИВ АКТИВУЄТЬСЯ',
  onComplete,
  duration = 2500,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'decrypt' | 'reveal' | 'done'>('decrypt');
  const [displayText, setDisplayText] = useState('');
  const startRef = useRef(Date.now());

  // Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const cols = Math.floor(W / 14);
    const drops = Array(cols).fill(1);
    const speeds = Array.from({ length: cols }, () => Math.random() * 0.5 + 0.3);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = '12px monospace';
      for (let i = 0; i < drops.length; i++) {
        const char = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        const x = i * 14;
        const y = drops[i] * 14;

        // Gradient color from top (dim) to bottom (bright)
        const brightness = Math.min(1, y / H + 0.3);
        const r = Math.floor(225 * brightness);
        const g = Math.floor(29 * brightness);
        const b = Math.floor(72 * brightness);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness * 0.8})`;
        ctx.fillText(char, x, y);

        drops[i] += speeds[i];
        if (y > H && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };

    let animId = requestAnimationFrame(function loop() {
      draw();
      animId = requestAnimationFrame(loop);
    });

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Decryption typewriter
  useEffect(() => {
    startRef.current = Date.now();
    let frame = 0;
    const totalFrames = Math.floor(duration / 30);

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      if (progress < 0.7) {
        // Decryption phase: scramble characters
        let scrambled = '';
        for (let i = 0; i < text.length; i++) {
          const charProgress = Math.min(1, progress * text.length * 1.8 / (i + 1));
          if (charProgress >= 1) {
            scrambled += text[i];
          } else {
            scrambled += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplayText(scrambled);
      } else if (progress < 0.85) {
        setPhase('reveal');
        setDisplayText(text);
      } else {
        setPhase('done');
        if (onComplete) setTimeout(onComplete, 400);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40" />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px)',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Main decrypt text */}
            <div className="relative">
              <motion.h1
                className="text-5xl md:text-7xl font-black tracking-[0.15em] text-white font-mono"
                style={{
                  textShadow: '0 0 40px rgba(225,29,72,0.5), 0 0 80px rgba(225,29,72,0.2)',
                  letterSpacing: '0.2em',
                }}
              >
                {displayText}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-1.5 h-10 bg-rose-500 ml-2 align-middle"
                />
              </motion.h1>

              {/* Glitch overlay */}
              {phase === 'decrypt' && (
                <motion.div
                  className="absolute inset-0 text-5xl md:text-7xl font-black tracking-[0.15em] text-rose-500/20 font-mono pointer-events-none"
                  style={{ clipPath: 'inset(40% 0 30% 0)' }}
                  animate={{
                    x: [0, -3, 3, 0],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 0.15, repeat: Infinity }}
                >
                  {displayText}
                </motion.div>
              )}
            </div>

            {/* Subtext */}
            <motion.p
              className="text-[11px] font-black uppercase tracking-[0.5em] text-rose-500/60"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {subtext}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-64 h-[2px] bg-slate-900 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-900 via-rose-500 to-rose-400"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-rose-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[9px] font-mono font-black text-slate-700 uppercase tracking-[0.3em]">
            {phase === 'decrypt' ? 'РОЗШИФРУВАННЯ ПРОТОКОЛУ...' : phase === 'reveal' ? 'ВЕРИФІКАЦІЯ ДОСТУПУ...' : 'ГОТОВО'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BrandLoader;

/**
 * BrandLoaderFallback — Спрощена версія для Suspense fallback
 * Без onComplete callback, зменшена тривалість
 */
export const BrandLoaderFallback: React.FC<Pick<BrandLoaderProps, 'text' | 'subtext'>> = ({
  text = 'PREDATOR',
  subtext = 'ЗАВАНТАЖЕННЯ МОДУЛЯ',
}) => (
  <div className="w-full h-full min-h-[300px] bg-black/95 flex flex-col items-center justify-center relative overflow-hidden rounded-2xl">
    {/* Scanlines */}
    <div className="absolute inset-0 pointer-events-none z-[1]"
      style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.1) 2px,rgba(0,0,0,0.1) 4px)' }}
    />
    <div className="relative z-10 text-center space-y-4">
      <h1 className="text-3xl font-black tracking-[0.2em] text-white font-mono"
        style={{ textShadow: '0 0 30px rgba(225,29,72,0.4)' }}>
        {text}
        <span className="inline-block w-1 h-8 bg-rose-500 ml-2 align-middle animate-pulse" />
      </h1>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500/60">
        {subtext}
      </p>
      <div className="w-48 h-[2px] bg-slate-900 rounded-full overflow-hidden mx-auto">
        <motion.div className="h-full bg-gradient-to-r from-rose-900 via-rose-500 to-rose-400"
          initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'linear' }} />
      </div>
    </div>
  </div>
);
