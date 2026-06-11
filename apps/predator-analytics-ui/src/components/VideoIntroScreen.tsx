import React, { useRef, useEffect, useCallback, useState } from 'react';

/**
 * 🦅 PREDATOR Analytics // VIDEO INTRO SCREEN
 * ============================================
 * - Починається з чорного → плавне засвічення 2.5с
 * - Мерехтіння старої кінопльонки
 * - CRT scanlines + vignette
 * - Вибух (flash + shake) на 7.0с — "Система PREDATOR готова"
 */

interface VideoIntroScreenProps {
  onComplete: () => void;
  src?: string;
  /** Секунда вибуху — коли звучить "Система PREDATOR готова" */
  explosionAt?: number;
}

const VideoIntroScreen: React.FC<VideoIntroScreenProps> = ({
  onComplete,
  src = '/intro.mp4?v=19',
  explosionAt = 7.0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompleted = useRef(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [exploding, setExploding] = useState(false);

  const complete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playsInline = true;

    const handleEnded = () => complete();
    const handleError = () => complete();

    // Слухаємо прогрес відео для активації вибуху
    const handleTimeUpdate = () => {
      if (video.currentTime >= explosionAt && video.currentTime < explosionAt + 0.2) {
        setExploding(true);
        setTimeout(() => setExploding(false), 800);
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        complete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    video.play().catch(() => setIsBlocked(true));

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [complete, explosionAt]);

  const handleContainerClick = () => {
    if (isBlocked && videoRef.current) {
      setIsBlocked(false);
      videoRef.current.play().catch(() => complete());
    } else {
      complete();
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#000', cursor: 'none' }}
      onClick={handleContainerClick}
    >
      <style>{`
        /* Засвічення з темряви — 2.5с */
        @keyframes introFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        /* Мерехтіння старої кінопльонки */
        @keyframes filmFlicker {
          0%   { opacity: 1;    filter: brightness(1)    contrast(1.05); }
          4%   { opacity: 0.88; filter: brightness(0.82) contrast(1.12); transform: translateY(-1px); }
          8%   { opacity: 1;    filter: brightness(1.06) contrast(1);    transform: translateY(0); }
          15%  { opacity: 0.92; filter: brightness(0.9)  contrast(1.08); }
          20%  { opacity: 1;    filter: brightness(1); }
          50%  { opacity: 1;    filter: brightness(1); }
          51%  { opacity: 0.72; filter: brightness(0.78) contrast(1.18); transform: translateY(-2px); }
          53%  { opacity: 1;    filter: brightness(1.03) contrast(1.02); transform: translateY(1px); }
          56%  { opacity: 0.95; filter: brightness(1);   transform: translateY(0); }
          78%  { opacity: 1;    filter: brightness(1); }
          79%  { opacity: 0.80; filter: brightness(0.85) contrast(1.12); transform: translateY(1px); }
          81%  { opacity: 1;    filter: brightness(1);   transform: translateY(0); }
          100% { opacity: 1;    filter: brightness(1)    contrast(1.05); }
        }

        /* Вибух — спалах і трясіння */
        @keyframes explosionFlash {
          0%   { opacity: 0; }
          8%   { opacity: 0.95; }
          25%  { opacity: 0.5; }
          60%  { opacity: 0.2; }
          100% { opacity: 0; }
        }

        @keyframes explosionShake {
          0%   { transform: translate(0, 0) scale(1); }
          10%  { transform: translate(-8px, -5px) scale(1.04); }
          20%  { transform: translate(7px, 4px) scale(0.97); }
          30%  { transform: translate(-5px, 6px) scale(1.02); }
          40%  { transform: translate(4px, -4px) scale(0.98); }
          50%  { transform: translate(-3px, 3px) scale(1.01); }
          65%  { transform: translate(2px, -2px) scale(1); }
          80%  { transform: translate(-1px, 1px) scale(1); }
          100% { transform: translate(0, 0) scale(1); }
        }

        .intro-video-wrapper {
          animation: introFadeIn 2.5s ease-out forwards;
        }

        .intro-video-flicker {
          animation: filmFlicker 0.8s steps(1) infinite;
        }

        .intro-exploding {
          animation: explosionShake 0.8s ease-out forwards !important;
        }

        .explosion-flash {
          animation: explosionFlash 0.8s ease-out forwards;
        }
      `}</style>

      {/* Обгортка — засвічується з темряви */}
      <div
        className={`intro-video-wrapper${exploding ? ' intro-exploding' : ''}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Мерехтіння плівки */}
        <div className="intro-video-flicker" style={{ position: 'absolute', inset: 0 }}>
          <video
            ref={videoRef}
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              cursor: isBlocked ? 'pointer' : 'default',
            }}
            playsInline
            preload="auto"
          />
        </div>

        {/* CRT Scanlines */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
            zIndex: 2,
          }}
        />

        {/* Vignette */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.7) 100%)',
            zIndex: 3,
          }}
        />

        {/* Вибух — червоно-білий спалах */}
        {exploding && (
          <div
            className="explosion-flash"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,80,0,0.7) 40%, rgba(200,0,0,0.3) 70%, transparent 100%)',
              zIndex: 10,
            }}
          />
        )}
      </div>

      {isBlocked && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 20,
          }}
        >
          <div style={{
            color: '#e8888f', fontFamily: 'monospace', fontSize: '18px',
            letterSpacing: '0.2em', border: '1px solid rgba(232,136,143,0.4)',
            padding: '16px 32px', borderRadius: '8px',
            backgroundColor: 'rgba(232,136,143,0.1)', cursor: 'pointer',
          }}>
            НАТИСНІТЬ ДЛЯ ЗАПУСКУ
          </div>
        </div>
      )}

      {!isBlocked && (
        <div
          style={{
            position: 'absolute', bottom: '2rem', right: '2.5rem',
            color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace',
            fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase',
            userSelect: 'none', pointerEvents: 'none', zIndex: 5,
          }}
        >
          натисніть щоб пропустити
        </div>
      )}
    </div>
  );
};

export default VideoIntroScreen;
