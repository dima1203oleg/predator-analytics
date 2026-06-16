/**
 * 🤖 AvatarShell v3.0 — Реалістичний аватар PREDATOR ELITE
 *
 * Особливості:
 * - Реалістичне SVG-обличчя з детальними рисами (губи, ніс, контури)
 * - Синхронізація губ (lip-sync) з TTS текстом (віземи) та Web Audio API
 * - Міміка: idle, thinking, speaking, listening, alert
 * - Голографічні та CRT ефекти
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AvatarShellProps } from '../../types';

// ── Віземи для lip-sync (0 = закритий, 1 = широко відкритий) ───────────────
const VISEME_MAP: Record<string, number> = {
  A: 0.8, E: 0.5, I: 0.3, O: 0.7, U: 0.4,
  B: 0.0, P: 0.0, M: 0.0, 
  F: 0.15, V: 0.15,
  S: 0.1, Z: 0.1, T: 0.05, D: 0.05, N: 0.05,
  L: 0.2, R: 0.2,
  G: 0.25, K: 0.25,
};

function amplitudeToMouth(amplitude: number): number {
  const normalized = Math.min(amplitude / 80, 1);
  return normalized * normalized; 
}

const AvatarFace: React.FC<{
  emotion: AvatarShellProps['emotion'];
  mouthOpen: number; 
  blinkState: 'open' | 'closing' | 'closed' | 'opening';
  eyeOffsetX: number;
  eyeOffsetY: number;
  browRaise: number; 
}> = ({ emotion, mouthOpen, blinkState, eyeOffsetX, eyeOffsetY, browRaise }) => {
  const palette = {
    idle:      { glow: '#00d4ff', iris: '#1e90ff', skin: '#1a2035', accent: '#00d4ff' },
    speaking:  { glow: '#00ff9d', iris: '#00cc7a', skin: '#0f1f1a', accent: '#00ff9d' },
    thinking:  { glow: '#c084fc', iris: '#a855f7', skin: '#1a1025', accent: '#c084fc' },
    listening: { glow: '#fbbf24', iris: '#f59e0b', skin: '#1f1a08', accent: '#fbbf24' },
    alert:     { glow: '#ef4444', iris: '#dc2626', skin: '#1f0a0a', accent: '#ef4444' },
  };
  const c = palette[emotion] ?? palette.idle;

  const eyeOpenRatio = blinkState === 'closed' ? 0 :
                       blinkState === 'closing' ? 0.2 :
                       blinkState === 'opening' ? 0.5 : 1;
  const eyeH = 14 * eyeOpenRatio;

  const leftBrowY  = 62 - browRaise * 5;
  const rightBrowY = 62 - browRaise * 5;

  const mouthOpenPx = mouthOpen * 18; 
  
  const upperLipTop = 175 - browRaise * 1 - (mouthOpenPx * 0.1); 
  const upperLipBottom = 182 - (mouthOpenPx * 0.3); 
  const upperLipPath = `M 112,182 C 120,${upperLipTop} 160,${upperLipTop} 168,182 C 160,${upperLipBottom} 120,${upperLipBottom} 112,182 Z`;

  const lowerLipTop = 182 + (mouthOpenPx * 0.8);
  const lowerLipBottom = 190 + (mouthOpenPx * 1.1);
  const lowerLipPath = `M 112,182 C 120,${lowerLipTop} 160,${lowerLipTop} 168,182 C 160,${lowerLipBottom} 120,${lowerLipBottom} 112,182 Z`;

  const mouthInsidePath = `M 112,182 C 120,${upperLipBottom} 160,${upperLipBottom} 168,182 C 160,${lowerLipTop} 120,${lowerLipTop} 112,182 Z`;

  return (
    <svg
      viewBox="0 0 280 340"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ filter: `drop-shadow(0 0 18px ${c.glow}88)` }}
    >
      <defs>
        <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#2a3a5a" />
          <stop offset="60%" stopColor={c.skin} />
          <stop offset="100%" stopColor="#050810" />
        </radialGradient>
        <radialGradient id="irisGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="30%" stopColor={c.iris} />
          <stop offset="100%" stopColor="#000820" />
        </radialGradient>
        <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={c.glow} stopOpacity="0" />
          <stop offset="100%" stopColor={c.glow} stopOpacity="0.35" />
        </radialGradient>
        <clipPath id="leftEyeClip">
          <ellipse cx={`${105 + eyeOffsetX}`} cy="110" rx="18" ry={`${eyeH}`} />
        </clipPath>
        <clipPath id="rightEyeClip">
          <ellipse cx={`${175 + eyeOffsetX}`} cy="110" rx="18" ry={`${eyeH}`} />
        </clipPath>
        <pattern id="scanlines" x="0" y="0" width="1" height="3" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="1" stroke={c.glow} strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>

      <ellipse cx="140" cy="165" rx="135" ry="160" fill="url(#haloGrad)" />

      {/* Шия */}
      <path d="M 100,270 L 100,320 Q 140,335 180,320 L 180,270 Q 140,285 100,270 Z" fill="url(#skinGrad)" />

      {/* Обличчя */}
      <path d="M 50,150 C 50,80 80,60 140,60 C 200,60 230,80 230,150 C 230,210 200,260 170,285 C 150,300 130,300 110,285 C 80,260 50,210 50,150 Z" fill="url(#skinGrad)" />
      <path d="M 50,150 C 50,80 80,60 140,60 C 200,60 230,80 230,150 C 230,210 200,260 170,285 C 150,300 130,300 110,285 C 80,260 50,210 50,150 Z" fill="url(#scanlines)" />

      {/* Тінь над очима */}
      <path d={`M 80,${leftBrowY+3} Q 105,${leftBrowY+8} 130,${leftBrowY+3} Q 105,100 80,${leftBrowY+3}`} fill="#000" fillOpacity="0.2" />
      <path d={`M 200,${rightBrowY+3} Q 175,${rightBrowY+8} 150,${rightBrowY+3} Q 175,100 200,${rightBrowY+3}`} fill="#000" fillOpacity="0.2" />

      {/* Вилиці / Підборіддя */}
      <path d="M 65,190 C 65,220 85,260 140,280 C 195,260 215,220 215,190" fill="none" stroke={c.glow} strokeOpacity="0.1" strokeWidth="1" />

      {/* Брови */}
      <path d={`M 82,${leftBrowY + (emotion === 'alert' ? -4 : 0)} Q 100,${leftBrowY - 8 + (emotion === 'thinking' ? -4 : 0)} 118,${leftBrowY + (emotion === 'alert' ? -2 : 0)}`} stroke={c.accent} strokeWidth="3" strokeLinecap="round" fill="none" style={{ transition: 'd 0.3s ease, stroke 0.5s ease' }} />
      <path d={`M 162,${rightBrowY + (emotion === 'alert' ? -2 : 0)} Q 180,${rightBrowY - 8 + (emotion === 'thinking' ? -4 : 0)} 198,${rightBrowY + (emotion === 'alert' ? -4 : 0)}`} stroke={c.accent} strokeWidth="3" strokeLinecap="round" fill="none" style={{ transition: 'stroke 0.5s ease' }} />

      {/* Очі */}
      <ellipse cx={105 + eyeOffsetX} cy={110 + eyeOffsetY} rx="18" ry={eyeH} fill="#e8f4ff" clipPath="url(#leftEyeClip)" />
      <circle cx={105 + eyeOffsetX} cy={110 + eyeOffsetY} r="9" fill="url(#irisGrad)" clipPath="url(#leftEyeClip)" />
      <circle cx={105 + eyeOffsetX} cy={110 + eyeOffsetY} r="4" fill="#000510" clipPath="url(#leftEyeClip)" />
      <circle cx={108 + eyeOffsetX} cy={107 + eyeOffsetY} r="2.5" fill="white" fillOpacity="0.85" clipPath="url(#leftEyeClip)" />

      <ellipse cx={175 + eyeOffsetX} cy={110 + eyeOffsetY} rx="18" ry={eyeH} fill="#e8f4ff" clipPath="url(#rightEyeClip)" />
      <circle cx={175 + eyeOffsetX} cy={110 + eyeOffsetY} r="9" fill="url(#irisGrad)" clipPath="url(#rightEyeClip)" />
      <circle cx={175 + eyeOffsetX} cy={110 + eyeOffsetY} r="4" fill="#000510" clipPath="url(#rightEyeClip)" />
      <circle cx={178 + eyeOffsetX} cy={107 + eyeOffsetY} r="2.5" fill="white" fillOpacity="0.85" clipPath="url(#rightEyeClip)" />

      <path d={`M 87,${110 - eyeH} Q 105,${102 - eyeH * 0.5} 123,${110 - eyeH}`} stroke="#0a1628" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M 157,${110 - eyeH} Q 175,${102 - eyeH * 0.5} 193,${110 - eyeH}`} stroke="#0a1628" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {eyeOpenRatio > 0.3 && (
        <>
          {[88, 96, 105, 114, 121].map((x, i) => (
            <line key={`ll${i}`} x1={x} y1={110 - eyeH} x2={x - 1 + i * 0.5} y2={110 - eyeH - 5} stroke={c.accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          ))}
          {[158, 166, 175, 184, 192].map((x, i) => (
            <line key={`rl${i}`} x1={x} y1={110 - eyeH} x2={x + 1 - i * 0.5} y2={110 - eyeH - 5} stroke={c.accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
          ))}
        </>
      )}

      {/* Ніс */}
      <path d="M 135,115 C 130,140 125,160 128,165 C 132,170 148,170 152,165 C 155,160 150,140 145,115" fill={c.glow} fillOpacity="0.05" stroke={c.glow} strokeOpacity="0.15" strokeWidth="1" />
      <ellipse cx="140" cy="165" rx="8" ry="6" fill={c.glow} fillOpacity="0.1" />
      <path d="M 125,163 C 122,165 122,168 126,168 C 130,168 132,165 132,165" fill="none" stroke={c.glow} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 155,163 C 158,165 158,168 154,168 C 150,168 148,165 148,165" fill="none" stroke={c.glow} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />

      {/* Рот */}
      <path d={mouthInsidePath} fill="#050202" stroke="none" style={{ transition: 'd 0.05s linear' }} />
      {mouthOpen > 0.1 && (
        <path d={`M 122,${182 + mouthOpenPx * 0.1} C 130,${182 + mouthOpenPx * 0.2} 150,${182 + mouthOpenPx * 0.2} 158,${182 + mouthOpenPx * 0.1} C 150,${upperLipBottom} 130,${upperLipBottom} 122,${182 + mouthOpenPx * 0.1} Z`} fill="#eef2ff" fillOpacity="0.9" />
      )}
      <path d={upperLipPath} fill={c.glow} fillOpacity="0.25" stroke={c.accent} strokeWidth="0.5" strokeOpacity="0.8" style={{ transition: 'd 0.05s linear' }} />
      <path d={lowerLipPath} fill={c.glow} fillOpacity="0.35" stroke={c.accent} strokeWidth="0.5" strokeOpacity="0.8" style={{ transition: 'd 0.05s linear' }} />

      {/* Голографічні деталі */}
      <path d="M 45,130 L 65,120 M 45,145 L 60,138" stroke={c.accent} strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
      <path d="M 235,130 L 215,120 M 235,145 L 220,138" stroke={c.accent} strokeWidth="0.8" strokeOpacity="0.4" strokeLinecap="round" />
      <path d={`M 90,305 L 75,315 L 75,325 L 205,325 L 205,315 L 190,305`} stroke={c.accent} strokeWidth="1" fill="none" strokeOpacity="0.5" />
      <text x="140" y="320" textAnchor="middle" fontSize="8" fill={c.accent} fillOpacity="0.8" fontFamily="monospace" letterSpacing="2">
        {emotion === 'idle' ? 'STANDBY' : emotion === 'speaking' ? 'SPEAKING' : emotion === 'thinking' ? 'PROCESSING' : emotion === 'listening' ? 'LISTENING' : 'ALERT'}
      </text>
      <ellipse cx="140" cy="80" rx="88" ry="20" stroke={c.accent} strokeWidth="1" fill="none" strokeOpacity="0.2" />
      <rect x="40" y="0" width="200" height="1.5" fill={c.accent} fillOpacity="0.15" style={{ transform: 'translateY(0)', animation: 'scan 3s linear infinite' }} />
    </svg>
  );
};

export const AvatarShell: React.FC<AvatarShellProps> = ({
  emotion,
  currentUtterance,
  audioSource,
  onSpeechEnd,
  onError,
  className,
}) => {
  const [mouthOpen, setMouthOpen]           = useState(0);
  const [blinkState, setBlinkState]         = useState<'open' | 'closing' | 'closed' | 'opening'>('open');
  const [eyeOffset, setEyeOffset]           = useState({ x: 0, y: 0 });
  const [browRaise, setBrowRaise]           = useState(0);
  const [glowPulse, setGlowPulse]           = useState(1);
  const [headTilt, setHeadTilt]             = useState(0);
  const [scanY, setScanY]                   = useState(0);

  const audioRef        = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const animFrameRef    = useRef<number>(0);
  const blinkTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eyeTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const lipTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const setupAudioAnalysis = useCallback((audioEl: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avgBand = dataArray.slice(2, 12).reduce((a, b) => a + b, 0) / 10;
        setMouthOpen(amplitudeToMouth(avgBand));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn('[AvatarShell] Web Audio API недоступний:', e);
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setMouthOpen(0);
  }, []);

  useEffect(() => {
    if (!audioSource) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = 'anonymous';
        audioRef.current.onended = () => {
          stopAudioAnalysis();
          if (onSpeechEnd) onSpeechEnd();
        };
        audioRef.current.onerror = () => {
          stopAudioAnalysis();
          if (onError) onError(new Error('Помилка відтворення аудіо'));
        };
      }
      const src = typeof audioSource === 'string' ? audioSource : URL.createObjectURL(audioSource);
      audioRef.current.src = src;

      audioRef.current.play().then(() => {
        setupAudioAnalysis(audioRef.current!);
      }).catch((err) => {
        console.warn('[AvatarShell] Автовідтворення заблоковано:', err);
        if (onError) onError(err);
      });
    } catch (e) {
      if (onError) onError(e as Error);
    }
    return () => stopAudioAnalysis();
  }, [audioSource, onSpeechEnd, onError, setupAudioAnalysis, stopAudioAnalysis]);

  useEffect(() => {
    if (audioSource) return; 
    if (emotion === 'speaking' && currentUtterance) {
      if (lipTimerRef.current) clearInterval(lipTimerRef.current);
      let charIndex = 0;
      let pauseFrames = 0;
      const cleanText = currentUtterance.toUpperCase();

      lipTimerRef.current = setInterval(() => {
        if (pauseFrames > 0) {
           pauseFrames--;
           setMouthOpen(prev => prev * 0.4); 
           return;
        }
        if (charIndex >= cleanText.length) {
            charIndex = 0; 
            pauseFrames = 8; 
            return;
        }

        const char = cleanText[charIndex];
        if (char === ' ' || char === '.' || char === ',' || char === '!' || char === '?') {
            pauseFrames = char === ' ' ? 2 : 5;
            setMouthOpen(prev => prev * 0.3);
        } else {
            let val = VISEME_MAP[char];
            if (val === undefined) {
               if (char === 'А' || char === 'Я') val = 0.8;
               else if (char === 'О') val = 0.7;
               else if (char === 'У' || char === 'Ю') val = 0.4;
               else if (char === 'Е' || char === 'Є') val = 0.5;
               else if (char === 'И' || char === 'І' || char === 'Ї') val = 0.3;
               else if (char === 'Б' || char === 'П' || char === 'М') val = 0.0;
               else if (char === 'Ф' || char === 'В') val = 0.15;
               else if (char === 'С' || char === 'З' || char === 'Ц' || char === 'Ш' || char === 'Ж' || char === 'Ч' || char === 'Щ') val = 0.1;
               else if (char === 'Л' || char === 'Р') val = 0.2;
               else if (char === 'Г' || char === 'К' || char === 'Х') val = 0.25;
               else val = 0.15; 
            }
            setMouthOpen(prev => prev * 0.3 + val * 0.7);
        }
        charIndex++;
      }, 70); 
    } else {
      if (lipTimerRef.current) clearInterval(lipTimerRef.current);
      setMouthOpen(0);
    }
    return () => {
      if (lipTimerRef.current) clearInterval(lipTimerRef.current);
    };
  }, [emotion, audioSource, currentUtterance]);

  const scheduleBlink = useCallback(() => {
    if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    const delay = 2000 + Math.random() * 4000; 
    blinkTimerRef.current = setTimeout(() => {
      setBlinkState('closing');
      setTimeout(() => setBlinkState('closed'), 80);
      setTimeout(() => setBlinkState('opening'), 160);
      setTimeout(() => {
        setBlinkState('open');
        scheduleBlink();
      }, 240);
    }, delay);
  }, []);

  useEffect(() => {
    scheduleBlink();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [scheduleBlink]);

  useEffect(() => {
    if (eyeTimerRef.current) clearInterval(eyeTimerRef.current);
    if (emotion === 'thinking') {
      let t = 0;
      eyeTimerRef.current = setInterval(() => {
        t += 0.08;
        setEyeOffset({ x: Math.sin(t) * 4, y: Math.cos(t * 0.7) * 1.5 });
      }, 50);
    } else if (emotion === 'listening') {
      let t = 0;
      eyeTimerRef.current = setInterval(() => {
        t += 0.03;
        setEyeOffset({ x: Math.sin(t) * 1.5, y: 0 });
      }, 50);
    } else {
      setEyeOffset({ x: 0, y: 0 });
    }
    return () => {
      if (eyeTimerRef.current) clearInterval(eyeTimerRef.current);
    };
  }, [emotion]);

  useEffect(() => {
    switch (emotion) {
      case 'alert': setBrowRaise(-1); setHeadTilt(0); break;
      case 'thinking': setBrowRaise(0.5); setHeadTilt(-3); break;
      case 'listening': setBrowRaise(0.3); setHeadTilt(4); break;
      case 'speaking': setBrowRaise(0.2); setHeadTilt(0); break;
      default: setBrowRaise(0); setHeadTilt(0);
    }
  }, [emotion]);

  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      const base = emotion === 'alert' ? 1.3 : emotion === 'speaking' ? 1.1 : 1.0;
      setGlowPulse(base + Math.sin(t) * 0.15);
    }, 50);
    return () => clearInterval(id);
  }, [emotion]);

  useEffect(() => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    scanTimerRef.current = setInterval(() => {
      setScanY(y => (y + 3) % 340);
    }, 16);
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  const glowColor = {
    idle:      '#00d4ff',
    speaking:  '#00ff9d',
    thinking:  '#c084fc',
    listening: '#fbbf24',
    alert:     '#ef4444',
  }[emotion] ?? '#00d4ff';

  const emotionLabel = {
    idle:      '● ОЧІКУВАННЯ',
    speaking:  '▶ ГОВОРИТЬ',
    thinking:  '◌ ОБРОБКА',
    listening: '◉ СЛУХАЄ',
    alert:     '⚠ УВАГА',
  }[emotion] ?? '';

  return (
    <div
      className={`relative select-none ${className ?? ''}`}
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d1528 0%, #050810 100%)' }}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 0 60px 10px ${glowColor}22, 0 0 80px 20px ${glowColor}11`,
          transform: `scale(${glowPulse})`,
          transition: 'transform 0.1s ease, box-shadow 0.5s ease',
          borderRadius: '50%',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${glowColor}06 1px, transparent 1px),
            linear-gradient(90deg, ${glowColor}06 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      <div style={{ transform: `rotate(${headTilt}deg)`, transition: 'transform 0.4s ease', width: '100%', height: '100%' }}>
        <AvatarFace
          emotion={emotion}
          mouthOpen={mouthOpen}
          blinkState={blinkState}
          eyeOffsetX={eyeOffset.x}
          eyeOffsetY={eyeOffset.y}
          browRaise={browRaise}
        />
      </div>
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: `${scanY}px`,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${glowColor}40, transparent)`,
          transition: 'top 0.016s linear',
        }}
      />
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <span
          className="text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full"
          style={{
            color: glowColor,
            background: `${glowColor}15`,
            border: `1px solid ${glowColor}40`,
            textShadow: `0 0 8px ${glowColor}`,
          }}
        >
          {emotionLabel}
        </span>
      </div>
      {currentUtterance && emotion === 'speaking' && (
        <div className="absolute top-2 left-2 right-2 pointer-events-none">
          <div
            className="text-[10px] leading-relaxed text-center px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${glowColor}30`,
              color: glowColor,
              backdropFilter: 'blur(4px)',
              textShadow: `0 0 6px ${glowColor}80`,
            }}
          >
            «{currentUtterance.slice(0, 80)}{currentUtterance.length > 80 ? '…' : ''}»
          </div>
        </div>
      )}
      <style>{`
        @keyframes avatarScan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
