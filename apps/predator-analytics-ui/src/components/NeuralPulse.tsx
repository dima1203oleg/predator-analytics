import React, { useEffect, useRef } from 'react';

/**
 * PREDATOR v61.0-ELITE NEXUS | NeuralPulse Overlay
 * Цифровий "пульс" системи. Створює ефект сканування нейронних мереж
 * та візуальну динаміку у фоні за допомогою Canvas API.
 */
const NeuralPulse: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Симуляція нейронних вузлів
    const points: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    const count = 40;

    for (let i = 0; i < count; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
      });
    }

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const pulseFactor = Math.sin(time * 0.001) * 0.5 + 0.5;
      
      // Малювання з'єднань
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 243, 255, ${0.05 + pulseFactor * 0.05})`;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < count; i++) {
        const p1 = points[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        for (let j = i + 1; j < count; j++) {
          const p2 = points[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 200) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          }
        }
      }
      ctx.stroke();

      // Малювання вузлів
      points.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 243, 255, ${0.2 + pulseFactor * 0.3})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (pulseFactor > 0.8) {
           ctx.beginPath();
           ctx.shadowBlur = 15;
           ctx.shadowColor = '#00f3ff';
           ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
           ctx.fill();
           ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw(0);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none opacity-40 mix-blend-screen"
    />
  );
};

export default NeuralPulse;
