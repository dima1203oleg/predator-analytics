/**
 * 🎯 TacticalModal — Military Overlay Modal
- Scan-line noise overlay
- Slide-in з bounce (spring physics)
- Header з blinking cursor перед title
- Type-on effect для тексту
- Close X з glitch effect
 */
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface TacticalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  danger?: boolean;
  variant?: string;
  glitch?: boolean;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export const TacticalModal: React.FC<TacticalModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  confirmLabel,
  cancelLabel,
  onConfirm,
  danger,
}) => {
  const [typedTitle, setTypedTitle] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Typewriter effect для title
  useEffect(() => {
    if (!isOpen) {
      setTypedTitle('');
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < title.length) {
        setTypedTitle(title.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen, title]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scan-line noise overlay */}
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)',
            }}
          />

          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className={cn(
                'relative w-full glass-obsidian rounded-xl overflow-hidden',
                sizeMap[size],
                className
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  {/* Blinking cursor */}
                  <span
                    className={cn(
                      'w-2 h-4 bg-[#c9a227] inline-block',
                      showCursor ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <h2 className="font-display text-lg font-semibold text-[#e8e8e8]">
                    {typedTitle}
                  </h2>
                </div>

                {/* Close button з glitch effect */}
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-[#5a5a5a] hover:text-[#e8e8e8] transition-colors" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-5">
                {children}
              </div>

              {/* Confirm/Cancel Actions */}
              {(confirmLabel || cancelLabel) && (
                <div className="px-5 pb-5 flex gap-3 justify-end">
                  {cancelLabel && (
                    <Button variant="cyber"
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[#8a8a8a] text-sm font-medium hover:bg-white/[0.08] hover:text-[#e8e8e8] transition-all"
                    >
                      {cancelLabel}
                    </Button>
                  )}
                  {confirmLabel && onConfirm && (
                    <Button variant="cyber"
                      onClick={onConfirm}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        danger
                          ? "bg-[#e11d48]/20 border border-[#e11d48]/40 text-[#e11d48] hover:bg-[#e11d48]/30"
                          : "bg-[#c9a227]/20 border border-[#c9a227]/40 text-[#c9a227] hover:bg-[#c9a227]/30"
                      )}
                    >
                      {confirmLabel}
                    </Button>
                  )}
                </div>
              )}

              {/* Bottom accent line */}
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#c9a227]/50 to-transparent" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TacticalModal;
