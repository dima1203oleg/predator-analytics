/**
 * 🔐 DECIPHER LOADER | PREDATOR v61.0-ELITE
 * Дешифрування замість звичайного loader
 * Перевищує Palantir: кіберпанк естетика, анімація дешифрування, matrix rain
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Shield, Zap, Cpu, Database } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DecipherLoaderProps {
  onComplete?: () => void;
  duration?: number;
  message?: string;
  className?: string;
}

export const DecipherLoader: React.FC<DecipherLoaderProps> = ({
  onComplete,
  duration = 3000,
  message = 'ДЕШИФРУВАННЯ ДАНИХ...',
  className = ''
}) => {
  const [progress, setProgress] = useState(0);
  const [currentChar, setCurrentChar] = useState('');
  const [decryptedText, setDecryptedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const targetText = 'PREDATOR_ANALYTICS_V61_ELITE';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_@#$%&*';

  useEffect(() => {
    const interval = setInterval(() => {
      if (progress < 100) {
        setProgress(prev => Math.min(prev + 1, 100));
      } else {
        clearInterval(interval);
        setIsComplete(true);
        setTimeout(() => onComplete?.(), 500);
      }
    }, duration / 100);

    return () => clearInterval(interval);
  }, [duration, progress, onComplete]);

  useEffect(() => {
    const charInterval = setInterval(() => {
      setCurrentChar(chars[Math.floor(Math.random() * chars.length)]);
    }, 50);

    return () => clearInterval(charInterval);
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    const textInterval = setInterval(() => {
      if (currentIndex < targetText.length) {
        setDecryptedText(prev => prev + targetText[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(textInterval);
      }
    }, 100);

    return () => clearInterval(textInterval);
  }, []);

  return (
    <div className={cn('fixed inset-0 z-[99999] bg-black flex items-center justify-center', className)}>
      {/* Matrix rain background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-rose-500 font-mono text-xs"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px'
            }}
            animate={{
              y: [0, window.innerHeight + 20],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            {chars[Math.floor(Math.random() * chars.length)]}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Lock animation */}
        <motion.div
          className="relative"
          animate={isComplete ? { rotate: 360 } : {}}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-rose-600 to-rose-900 border-2 border-rose-400/50 flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,0.5)]">
            <AnimatePresence mode="wait">
              {!isComplete ? (
                <motion.div
                  key="lock"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Lock className="w-16 h-16 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="unlock"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Unlock className="w-16 h-16 text-emerald-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Decrypted text */}
        <div className="font-mono text-2xl font-bold text-white tracking-widest">
          <span className="text-rose-500">{decryptedText}</span>
          <motion.span
            className="text-emerald-400"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          >
            {currentChar}
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="w-80 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rose-600 to-rose-400"
            style={{ width: `${progress}%` }}
            animate={{
              boxShadow: [
                '0 0 10px rgba(225,29,72,0.5)',
                '0 0 20px rgba(225,29,72,0.8)',
                '0 0 10px rgba(225,29,72,0.5)'
              ]
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Status icons */}
        <div className="flex gap-8">
          {[
            { icon: Shield, label: 'ШИФРУВАННЯ', active: progress > 20 },
            { icon: Database, label: 'БАЗА ДАНИХ', active: progress > 40 },
            { icon: Cpu, label: 'НЕЙРОМЕРЕЖА', active: progress > 60 },
            { icon: Zap, label: 'АКТИВАЦІЯ', active: progress > 80 }
          ].map(({ icon: Icon, label, active }) => (
            <motion.div
              key={label}
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                active ? 'bg-rose-600/20 border border-rose-500/50' : 'bg-slate-800/50 border border-slate-700'
              )}>
                <Icon className={cn(
                  'w-6 h-6',
                  active ? 'text-rose-500' : 'text-slate-500'
                )} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Message */}
        <motion.div
          className="text-sm font-mono text-slate-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.div>

        {/* Completion message */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="text-emerald-400 font-bold text-lg"
            >
              ✓ ДОСТУП РОЗБЛОКОВАНО
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DecipherLoader;
