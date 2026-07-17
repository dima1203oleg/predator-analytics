/**
 * 🌀 KINETIC SCROLL | PREDATOR v61.0-ELITE
 * Kinetic scrolling з parallax depth та momentum
 * Перевищує Palantir: плавність, інерція, 3D depth
 */
import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/utils/cn';

interface KineticScrollProps {
  children: ReactNode;
  className?: string;
  parallaxSpeed?: number;
  momentum?: number;
}

export const KineticScroll: React.FC<KineticScrollProps> = ({
  children,
  className = '',
  parallaxSpeed = 0.5,
  momentum = 0.95
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: containerRef
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * parallaxSpeed]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  const smoothY = useSpring(y, { stiffness: 100, damping: 30, mass: 0.8 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30, mass: 0.8 });

  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentScroll, setCurrentScroll] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastTimestamp = performance.now();
    let lastY = currentScroll;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (!isDragging && Math.abs(velocity) > 0.1) {
        const newScroll = currentScroll + velocity * deltaTime;
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        if (newScroll >= 0 && newScroll <= maxScroll) {
          setCurrentScroll(newScroll);
          setVelocity(velocity * momentum);
        } else {
          setVelocity(0);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, velocity, currentScroll, momentum]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true);
      setStartY(e.clientY);
      setVelocity(0);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = e.clientY - startY;
      const newScroll = currentScroll - deltaY;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (newScroll >= 0 && newScroll <= maxScroll) {
        setCurrentScroll(newScroll);
        setVelocity(deltaY * 0.5);
        setStartY(e.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newScroll = currentScroll + e.deltaY;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (newScroll >= 0 && newScroll <= maxScroll) {
        setCurrentScroll(newScroll);
        setVelocity(e.deltaY * 0.1);
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, startY, currentScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTop = currentScroll;
  }, [currentScroll]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden cursor-grab active:cursor-grabbing',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{ touchAction: 'none' }}
    >
      <motion.div
        style={{
          y: smoothY,
          scale: smoothScale,
          opacity,
          transformStyle: 'preserve-3d',
          perspective: 1000
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 0.5,
  className = ''
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, speed * 100]);

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

export default KineticScroll;
