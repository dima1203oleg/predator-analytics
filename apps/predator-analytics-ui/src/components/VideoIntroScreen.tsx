import React, { useRef, useEffect, useCallback } from 'react';

/**
 * 🦅 PREDATOR Analytics // VIDEO INTRO SCREEN
 * ============================================
 * Відтворює вступний ролик на весь екран.
 * CRT-ефект (scanlines + vignette) для кіберпанк-атмосфери.
 * Після завершення або натискання клавіші — перехід на заставку.
 */

interface VideoIntroScreenProps {
  /** Викликається після завершення відео або пропуску */
  onComplete: () => void;
  /** Шлях до відео файлу (відносно public/) */
  src?: string;
}

const VideoIntroScreen: React.FC<VideoIntroScreenProps> = ({
  onComplete,
  src = '/intro.mp4?v=14',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompleted = useRef(false);
  const [isBlocked, setIsBlocked] = React.useState(false);

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

    video.play().catch(() => {
      setIsBlocked(true);
    });

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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#000',
        cursor: 'none',
      }}
      onClick={handleContainerClick}
    >
      {/* Відео без нав'язливих ефектів — чисте відтворення */}
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

      {/* CRT Scanline overlay — тонкі горизонтальні лінії */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          zIndex: 2,
        }}
      />

      {/* Vignette — затемнення країв для кінематографічності */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          zIndex: 3,
        }}
      />

      {isBlocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
        >
          <div style={{
            color: '#e8888f',
            fontFamily: 'monospace',
            fontSize: '18px',
            letterSpacing: '0.2em',
            border: '1px solid rgba(232, 136, 143, 0.4)',
            padding: '16px 32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(232, 136, 143, 0.1)',
            cursor: 'pointer',
          }}>
            НАТИСНІТЬ ДЛЯ ЗАПУСКУ
          </div>
        </div>
      )}

      {/* Підказка пропуску — ледь помітна */}
      {!isBlocked && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2.5rem',
            color: 'rgba(255,255,255,0.18)',
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        >
          натисніть щоб пропустити
        </div>
      )}
    </div>
  );
};

export default VideoIntroScreen;
