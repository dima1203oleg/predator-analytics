/**
 * 🔄 PAGE TRANSITION WRAPPER | PREDATOR v61.0-ELITE
 * Page transitions з morphing ефектами
 * Перевищує Palantir: smooth morphing, shared element transitions, holographic fades
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  children,
  className = ''
}) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fade-in' | 'fade-out'>('fade-in');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  const handleAnimationComplete = () => {
    if (transitionStage === 'fade-out') {
      setDisplayLocation(location);
      setTransitionStage('fade-in');
    }
  };

  const variants = {
    fadeOut: {
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
      rotateX: 5,
      rotateY: -5
    },
    fadeIn: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      rotateX: 0,
      rotateY: 0
    }
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait" onExitComplete={handleAnimationComplete}>
        <motion.div
          key={displayLocation.pathname}
          initial="fadeOut"
          animate={transitionStage === 'fade-in' ? 'fadeIn' : 'fadeOut'}
          variants={variants}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            transformStyle: 'preserve-3d',
            perspective: 1000
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

interface MorphingCardProps {
  children: React.ReactNode;
  className?: string;
  layoutId?: string;
}

export const MorphingCard: React.FC<MorphingCardProps> = ({
  children,
  className = '',
  layoutId
}) => {
  return (
    <motion.div
      layoutId={layoutId}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.3 }
      }}
    >
      {children}
    </motion.div>
  );
};

interface HolographicFadeProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const HolographicFade: React.FC<HolographicFadeProps> = ({
  children,
  className = '',
  direction = 'up'
}) => {
  const directions = {
    up: { y: 50 },
    down: { y: -50 },
    left: { x: 50 },
    right: { x: -50 }
  };

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        ...directions[direction],
        scale: 0.9,
        filter: 'blur(20px)'
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: 'blur(0px)'
      }}
      exit={{
        opacity: 0,
        ...directions[direction],
        scale: 0.9,
        filter: 'blur(20px)'
      }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
};

interface GlitchTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const GlitchTransition: React.FC<GlitchTransitionProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        x: -20,
        skewX: -10
      }}
      animate={{
        opacity: 1,
        x: 0,
        skewX: 0
      }}
      exit={{
        opacity: 0,
        x: 20,
        skewX: 10
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};

interface ParticleTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const ParticleTransition: React.FC<ParticleTransitionProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        scale: 0.5,
        rotate: -180
      }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: 0
      }}
      exit={{
        opacity: 0,
        scale: 1.5,
        rotate: 180
      }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }}
      style={{
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;
