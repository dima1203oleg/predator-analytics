/**
 * 📊 REALTIME DATA VISUALIZER | PREDATOR v61.0-ELITE
 * Реалтайм візуалізація даних з анімацією
 * Перевищує Palantir: живі потоки даних, holographic charts, predictive analytics
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, Zap, Database, Cpu, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DataPoint {
  id: string;
  value: number;
  timestamp: number;
  category: string;
}

interface RealtimeDataVisualizerProps {
  className?: string;
  dataSource?: 'network' | 'database' | 'cpu' | 'global';
}

export const RealtimeDataVisualizer: React.FC<RealtimeDataVisualizerProps> = ({
  className = '',
  dataSource = 'network'
}) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [currentValue, setCurrentValue] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [alerts, setAlerts] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sourceConfig = {
    network: {
      icon: Globe,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      label: 'МЕРЕЖЕВИЙ_ТРАФІК',
      unit: 'MB/s'
    },
    database: {
      icon: Database,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      label: 'БАЗА_ДАНИХ',
      unit: 'req/s'
    },
    cpu: {
      icon: Cpu,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      label: 'НАВАНТАЖЕННЯ CPU',
      unit: '%'
    },
    global: {
      icon: Activity,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      label: 'ГЛОБАЛЬНА_АКТИВНІСТЬ',
      unit: 'users'
    }
  };

  const config = sourceConfig[dataSource];
  const Icon = config.icon;

  useEffect(() => {
    // Simulate realtime data
    const interval = setInterval(() => {
      const newValue = Math.random() * 100;
      const prevValue = currentValue;
      setCurrentValue(newValue);

      if (newValue > prevValue + 5) {
        setTrend('up');
      } else if (newValue < prevValue - 5) {
        setTrend('down');
      } else {
        setTrend('stable');
      }

      const newPoint: DataPoint = {
        id: Date.now().toString(),
        value: newValue,
        timestamp: Date.now(),
        category: dataSource
      };

      setDataPoints(prev => [...prev.slice(-50), newPoint]);

      // Random alerts
      if (Math.random() > 0.95) {
        const alertMessages = [
          'ВИСОКЕ НАВАНТАЖЕННЯ ВУЗЛА',
          'АНОМАЛІЯ В ТРАФІКУ',
          'ПІДТРИМКА НЕОБХІДНА',
          'ОПТИМІЗАЦІЯ РЕКОМЕНДОВАНА'
        ];
        setAlerts(prev => [...prev.slice(-3), alertMessages[Math.floor(Math.random() * alertMessages.length)]]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentValue, dataSource]);

  // Canvas drawing for holographic chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw data line
      if (dataPoints.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = dataSource === 'network' ? '#e11d48' : 
                        dataSource === 'database' ? '#10b981' :
                        dataSource === 'cpu' ? '#f59e0b' : '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 10;

        dataPoints.forEach((point, index) => {
          const x = (index / (dataPoints.length - 1)) * canvas.width;
          const y = canvas.height - (point.value / 100) * canvas.height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Fill area under line
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = `${ctx.strokeStyle}20`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [dataPoints, dataSource]);

  return (
    <div className={cn('relative bg-black/40 backdrop-blur-xl border rounded-2xl p-6', config.borderColor, className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-xl', config.bgColor)}>
            <Icon className={cn('w-6 h-6', config.color)} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {config.label}
            </h3>
            <p className="text-xs text-slate-400">РЕАЛТАЙМ_МОНИТОРИНГ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
          {trend === 'down' && <TrendingUp className="w-4 h-4 text-rose-500 rotate-180" />}
          <Zap className={cn('w-4 h-4', trend === 'stable' ? 'text-slate-500' : 'animate-pulse')} />
        </div>
      </div>

      {/* Current value */}
      <div className="mb-4">
        <motion.div
          key={currentValue}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white"
        >
          {currentValue.toFixed(1)}
          <span className="text-lg text-slate-400 ml-2">{config.unit}</span>
        </motion.div>
      </div>

      {/* Canvas chart */}
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full h-40 rounded-lg"
      />

      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-rose-400">{alert}</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{dataPoints.length}</div>
          <div className="text-xs text-slate-400">ТОЧОК</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {(dataPoints.reduce((sum, p) => sum + p.value, 0) / dataPoints.length).toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">СЕРЕДНЄ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {Math.max(...dataPoints.map(p => p.value)).toFixed(1)}
          </div>
          <div className="text-xs text-slate-400">МАКС</div>
        </div>
      </div>
    </div>
  );
};

export default RealtimeDataVisualizer;
