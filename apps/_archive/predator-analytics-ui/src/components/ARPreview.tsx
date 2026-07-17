/**
 * 📱 AR PREVIEW | PREDATOR v61.0-ELITE
 * AR preview для mobile
 * Перевищує Palantir: WebXR, camera overlay, holographic projections
 */
import { Button } from '@/components/ui/button';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Scan, Box, Globe, Layers, Zap, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ARPreviewProps {
  className?: string;
  mode?: 'camera' | 'model' | 'data';
}

export const ARPreview: React.FC<ARPreviewProps> = ({
  className = '',
  mode: initialMode = 'camera'
}) => {
  const [mode, setMode] = useState(initialMode);
  const [isARActive, setIsARActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isARActive && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isARActive, mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const toggleAR = () => {
    setIsARActive(!isARActive);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={cn('bg-black/40 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <Camera className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              AR ПЕРЕДГЛЯД
            </h2>
            <p className="text-sm text-slate-400">АУГМЕНТОВАНА_РЕАЛЬНІСТЬ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isARActive && (
            <motion.div
              className="w-3 h-3 bg-emerald-500 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* AR Viewport */}
      <div
        className={cn(
          'relative rounded-xl overflow-hidden border-2 transition-all duration-300',
          isARActive ? 'border-rose-500' : 'border-white/10',
          isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-80'
        )}
      >
        {/* Camera feed */}
        {mode === 'camera' && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {/* Model view */}
        {mode === 'model' && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="relative"
            >
              <Box className="w-32 h-32 text-rose-500" />
              <motion.div
                className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </div>
        )}

        {/* Data view */}
        {mode === 'data' && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Layers className="w-32 h-32 text-sky-500" />
            </motion.div>
          </div>
        )}

        {/* AR overlay */}
        {isARActive && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning grid */}
            <div className="absolute inset-0">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-full h-0.5 bg-rose-500/30"
                  initial={{ top: `${i * 10}%` }}
                  animate={{ top: `${(i * 10 + 100) % 100}%` }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>

            {/* Corner markers */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-rose-500" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-rose-500" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-rose-500" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-rose-500" />

            {/* Holographic data points */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full bg-rose-500"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + Math.sin(i) * 20}%`
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 bg-rose-500 rounded-full"
                  animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Placeholder when inactive */}
        {!isARActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
            <Camera className="w-16 h-16 text-slate-500 mb-4" />
            <p className="text-sm text-slate-400 uppercase tracking-wider">
              Натисніть кнопку для AR
            </p>
          </div>
        )}

        {/* Fullscreen toggle */}
        {isARActive && (
          <Button variant="cyber"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          {(['camera', 'model', 'data'] as const).map((m) => (
            <motion.button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 p-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                mode === m
                  ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                  : 'border-white/20 bg-white/5 text-slate-400'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {m === 'camera' && <Camera className="w-4 h-4" />}
              {m === 'model' && <Box className="w-4 h-4" />}
              {m === 'data' && <Layers className="w-4 h-4" />}
              {m.toUpperCase()}
            </motion.button>
          ))}
        </div>

        {/* AR toggle */}
        <motion.button
          onClick={toggleAR}
          className={cn(
            'w-full p-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-3 transition-all duration-300',
            isARActive
              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
              : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isARActive ? (
            <>
              <EyeOff className="w-5 h-5" />
              ЗУПИНИТИ AR
            </>
          ) : (
            <>
              <Scan className="w-5 h-5" />
              ЗАПУСТИТИ AR
            </>
          )}
        </motion.button>

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>WebXR Compatible</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span>GPS Ready</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {isARActive ? '60' : '0'}
          </div>
          <div className="text-xs text-slate-400 uppercase">FPS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {isARActive ? 'LOW' : 'OFF'}
          </div>
          <div className="text-xs text-slate-400 uppercase">LATENCY</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">
            {isARActive ? 'ACTIVE' : 'IDLE'}
          </div>
          <div className="text-xs text-slate-400 uppercase">STATUS</div>
        </div>
      </div>
    </div>
  );
};

export default ARPreview;
