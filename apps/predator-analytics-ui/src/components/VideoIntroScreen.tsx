import React, { useRef, useEffect, useCallback } from 'react';

/**
 * 🦅 PREDATOR Analytics // VIDEO INTRO SCREEN
 * ============================================
 * Відтворює вступний ролик на весь екран.
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
  src = '/intro.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompleted = useRef(false);

  const complete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Автозапуск без звуку (обхід autoplay-policy браузерів)
    video.muted = true;
    video.playsInline = true;

    const handleEnded = () => complete();
    const handleError = () => complete(); // У разі помилки — переходимо далі

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Клавіша/клік для пропуску
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        complete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Спроба відтворення
    video.play().catch(() => {
      // Якщо автозапуск заблоковано — пропускаємо заставку
      complete();
    });

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [complete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#000',
        cursor: 'none',
      }}
      onClick={complete}
    >
      <video
        ref={videoRef}
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        muted
        playsInline
        preload="auto"
      />

      {/* Підказка пропуску — ледь помітна */}
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
        }}
      >
        натисніть щоб пропустити
      </div>
    </div>
  );
};

export default VideoIntroScreen;
