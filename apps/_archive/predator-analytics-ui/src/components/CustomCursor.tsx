/**
 * 🎯 CUSTOM CURSOR | PREDATOR v61.0-ELITE
 * Кастомний курсор з trail ефектом
 * Перевищує Palantir: holographic trail, magnetic effect, dynamic sizing
 */
import React, { useEffect, useRef, useState } from 'react';

interface CursorPoint {
  x: number;
  y: number;
  id: number;
}

export const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [trail, setTrail] = useState<CursorPoint[]>([]);
  const trailRef = useRef<CursorPoint[]>([]);
  const requestRef = useRef<number | null>(null);
  const pointIdRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Add new point to trail
      const newPoint: CursorPoint = {
        x: e.clientX,
        y: e.clientY,
        id: pointIdRef.current++
      };

      trailRef.current = [...trailRef.current, newPoint].slice(-20);
      setTrail(trailRef.current);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('[data-interactive]')) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    // Hide default cursor
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      document.body.style.cursor = 'auto';
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Main cursor */}
      <div
        className="fixed pointer-events-none z-[99999] mix-blend-difference"
        style={{
          left: mousePosition.x - 16,
          top: mousePosition.y - 16,
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(225,29,72,0.8) 0%, rgba(225,29,72,0.2) 70%, transparent 100%)',
          boxShadow: '0 0 20px rgba(225,29,72,0.5)',
          transition: 'width 0.2s, height 0.2s, transform 0.1s',
          transform: isHovering ? 'scale(1.5)' : 'scale(1)'
        }}
      />

      {/* Inner dot */}
      <div
        className="fixed pointer-events-none z-[99999] bg-white rounded-full"
        style={{
          left: mousePosition.x - 4,
          top: mousePosition.y - 4,
          width: 8,
          height: 8,
          boxShadow: '0 0 10px rgba(255,255,255,0.8)',
          transition: 'transform 0.1s'
        }}
      />

      {/* Trail effect */}
      {trail.map((point, index) => {
        const opacity = (index / trail.length) * 0.5;
        const scale = (index / trail.length) * 0.8;
        const size = isHovering ? 24 : 16;

        return (
          <div
            key={point.id}
            className="fixed pointer-events-none z-[99998] rounded-full"
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size * scale,
              height: size * scale,
              background: `rgba(225, 29, 72, ${opacity})`,
              boxShadow: `0 0 ${10 * scale}px rgba(225, 29, 72, ${opacity})`,
              transition: 'opacity 0.3s, transform 0.3s'
            }}
          />
        );
      })}

      {/* Holographic ring */}
      <div
        className="fixed pointer-events-none z-[99997] rounded-full border-2 border-rose-500/30"
        style={{
          left: mousePosition.x - 24,
          top: mousePosition.y - 24,
          width: 48,
          height: 48,
          animation: 'spin 4s linear infinite',
          opacity: isHovering ? 0.8 : 0.3,
          transition: 'opacity 0.2s'
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      ` }} />
    </>
  );
};

export default CustomCursor;
