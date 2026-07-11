/**
 * 🎙️ Audio Visualizer Component
 * 
 * Реалізація візуалізації аудіо з Web Audio API
 * згідно з технічною специфікацією PREDATOR
 */

import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { useCyberDashboardStore } from '../../store/cyber-dashboard-store';

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { audioData, isListening, audioLevel } = useCyberDashboardStore();
  
  // Кількість барів для візуалізації
  const BAR_COUNT = 30;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Налаштування розмірів canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Функція рендерингу
    const render = () => {
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / BAR_COUNT - 2;
      const barHeightMultiplier = height * 0.8;
      
      // Очистка canvas
      ctx.clearRect(0, 0, width, height);
      
      // Отримання даних аудіо або генерація імітації
      let bars: number[] = [];
      
      if (audioData && audioData.length > 0) {
        // Використовуємо реальні дані з мікрофона
        const step = Math.floor(audioData.length / BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          const value = audioData[i * step] || 0;
          bars.push(value / 255); // Нормалізація до 0-1
        }
      } else if (isListening) {
        // Імітація, якщо мікрофон активний але немає даних
        const time = Date.now() / 1000;
        for (let i = 0; i < BAR_COUNT; i++) {
          const wave = Math.sin(time * 2 + i * 0.2) * 0.3 + 0.3;
          bars.push(Math.max(0, wave));
        }
      } else {
        // Idle анімація (низький рівень)
        const time = Date.now() / 2000;
        for (let i = 0; i < BAR_COUNT; i++) {
          const wave = Math.sin(time + i * 0.5) * 0.1 + 0.05;
          bars.push(Math.max(0, wave));
        }
      }
      
      // Рендеринг барів
      bars.forEach((value, index) => {
        const x = index * (barWidth + 2);
        const barHeight = value * barHeightMultiplier;
        const y = height - barHeight;
        
        // Градієнт для кіберпанк стилю
        const gradient = ctx.createLinearGradient(x, height, x, y);
        gradient.addColorStop(0, '#00F0FF'); // cyber-neon
        gradient.addColorStop(0.5, '#00FF41'); // cyber-green
        gradient.addColorStop(1, '#00F0FF'); // cyber-neon
        
        // Основний бар
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Світіння (glow ефект)
        ctx.shadowColor = '#00F0FF';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.fillRect(x - 1, y - 2, barWidth + 2, barHeight + 4);
        ctx.shadowBlur = 0;
        
        // Піки на вершинах
        if (value > 0.3) {
          ctx.fillStyle = '#00FF41';
          ctx.fillRect(x, y - 2, barWidth, 2);
        }
      });
      
      // Лінія бази
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - 1);
      ctx.lineTo(width, height - 1);
      ctx.stroke();
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    // Запуск анімації
    render();
    
    // Очищення
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isListening]);
  
  // Управління мікрофоном
  const handleToggleMic = async () => {
    const { startListening, stopListening, isListening } = useCyberDashboardStore.getState();
    
    if (isListening) {
      stopListening();
    } else {
      try {
        await startListening();
      } catch (error) {
        console.error('Помилка доступу до мікрофону:', error);
      }
    }
  };
  
  return (
    <div className="flex items-center gap-4 bg-cyber-surface/50 border border-cyber-border/50 p-4 rounded-lg">
      {/* Кнопка мікрофона */}
      <Button variant="cyber"
        onClick={handleToggleMic}
        className={`
          relative p-3 rounded-full transition-all duration-300
          ${isListening 
            ? 'bg-cyber-neon/20 border-2 border-cyber-neon animate-pulse' 
            : 'bg-cyber-border/30 border border-cyber-neon/30 hover:bg-cyber-border/50'
          }
        `}
      >
        {/* Мікрофон іконка (SVG) */}
        <svg
          className={`w-6 h-6 ${isListening ? 'text-cyber-neon' : 'text-cyber-neon/50'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        
        {/* Пульсація при записі */}
        {isListening && (
          <div className="absolute inset-0 rounded-full bg-cyber-neon/20 animate-ping" />
        )}
      </Button>
      
      {/* Візуалізація */}
      <div className="flex-1 h-16 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        
        {/* Статус текст */}
        <div className="absolute top-0 right-0 text-xs font-mono">
          {isListening ? (
            <span className="text-cyber-green animate-pulse">● ЗАПИС</span>
          ) : (
            <span className="text-cyber-neon/50">○ ГОТОВО</span>
          )}
        </div>
      </div>
      
      {/* Рівень аудіо */}
      <div className="w-2 h-12 bg-cyber-border/30 rounded overflow-hidden">
        <div
          className="w-full bg-cyber-neon transition-all duration-75"
          style={{
            height: `${audioLevel * 100}%`,
            backgroundColor: audioLevel > 0.8 ? '#FF3333' : '#00F0FF',
          }}
        />
      </div>
      
      {/* Попередження якщо мікрофон недоступний */}
      {!isListening && (
        <div className="text-xs text-cyber-neon/30 font-mono">
          {navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices ? 'НАЖМІТЬ МІКРОФОН' : 'МІКРОФОН БЛОКОВАНО'}
        </div>
      )}
    </div>
  );
}
