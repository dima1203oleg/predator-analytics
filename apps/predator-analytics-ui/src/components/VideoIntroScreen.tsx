import React, { useRef, useEffect, useCallback, useState } from 'react';

/**
 * 🦅 PREDATOR Analytics // VIDEO INTRO SCREEN
 * ============================================
 * Відтворює оригінальний вступний ролик на весь екран.
 * Плавне засвічення з темряви при старті.
 */

interface VideoIntroScreenProps {
  onComplete: () => void;
  src?: string;
}

const VideoIntroScreen: React.FC<VideoIntroScreenProps> = ({
  onComplete,
  src = '/intro.mp4?v=22',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompleted = useRef(false);
  const [isBlocked, setIsBlocked] = useState(false);

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

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

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
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [complete]);

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

        .intro-video-wrapper {
          animation: introFadeIn 2.5s ease-out forwards;
        }
      `}</style>

      {/* Обгортка — засвічується з темряви */}
      <div className="intro-video-wrapper" style={{ position: 'absolute', inset: 0 }}>
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
