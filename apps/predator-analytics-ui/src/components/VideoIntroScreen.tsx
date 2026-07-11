import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

/**
 * 🦅 PREDATOR Analytics // VIDEO INTRO SCREEN
 * ============================================
 * Відтворює вступний ролик на весь екран у стилі Sovereign Matrix.
 */

interface VideoIntroScreenProps {
  onComplete: () => void;
  src?: string;
}

const VideoIntroScreen: React.FC<VideoIntroScreenProps> = ({
  onComplete,
  src = '/intro.mp4?v=24',
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 z-[99999] bg-[#020817] cursor-none overflow-hidden font-sans"
      onClick={handleContainerClick}
    >
      {/* Container for Video */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-full object-cover block ${isBlocked ? 'cursor-pointer' : 'cursor-none'}`}
          playsInline
          preload="auto"
        />

        {/* Global CRT Scanlines Overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 opacity-30 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cGF0aCBkPSJNMCAwTDAgNE0yIDBMMiA0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] bg-repeat" />

        {/* Vignette & Corner Shadowing */}
        <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]" />
      </motion.div>

      {/* Autoplay Blocked State */}
      <AnimatePresence>
        {isBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-4 border border-cyan-500/50 bg-cyan-500/10 rounded text-cyan-400 font-mono text-lg tracking-[0.2em] shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer hover:bg-cyan-500/20 hover:border-cyan-400 transition-all"
            >
              <Play className="w-6 h-6" />
              НАТИСНІТЬ ДЛЯ ЗАПУСКУ МАТРИЦІ
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Button (Glassmorphism) */}
      {!isBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 right-12 z-30 pointer-events-none"
        >
          <div className="px-4 py-2 border border-white/10 bg-black/40 backdrop-blur-md text-white/40 font-mono text-[10px] tracking-[0.4em] uppercase rounded flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-ping" />
            натисніть щоб пропустити
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoIntroScreen;
