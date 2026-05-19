/**
 * AnimatedPage — Кінематографічні переходи між сторінками
 * v63.0-ELITE · Framer Motion · Tactical fade + slide
 */
import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedPageProps {
  children: ReactNode;
  pageKey: string;
  variant?: 'fade' | 'slideUp' | 'slideLeft' | 'tactical' | 'decrypt';
  className?: string;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  slideUp: {
    initial: { opacity: 0, y: 40, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.98 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  slideLeft: {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  tactical: {
    initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  decrypt: {
    initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
    animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
    exit: { opacity: 0, clipPath: 'inset(0 0 0 100%)' },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  pageKey,
  variant = 'tactical',
  className,
}) => {
  const v = variants[variant];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={v.transition}
        className={className ? `${className} w-full h-full` : 'w-full h-full'}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedPage;
