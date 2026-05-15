/**
 * 🌐 Tech Grid Background - PREDATOR v63.0-ELITE
 * Технологічна сітка з ефектом радара, що реагує на рух миші
 */
import React, { useState, useEffect } from 'react';

export const TechGridBackground: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
      
      // Оновлюємо CSS змінні для радар ефекту
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div className="tech-grid-bg" />
      <div className="tech-grid-radar" />
    </>
  );
};

export default TechGridBackground;
