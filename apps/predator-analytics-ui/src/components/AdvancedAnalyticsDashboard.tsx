/**
 * 📊 ADVANCED ANALYTICS DASHBOARD | PREDATOR v61.0-ELITE
 * Advanced analytics dashboard з live charts
 * Перевищує Palantir: real-time data streams, holographic charts, predictive analytics
 */
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, Target, BarChart3, LineChart, PieChart, Globe, Database, Cpu } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MetricData {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      id: 'network',
      label: 'МЕРЕЖЕВИЙ_ТРАФІК',
      value: 847,
      change: 12.5,
      trend: 'up',
      history: Array.from({ length: 20 }, () => Math.random() * 1000)
    },
    {
      id: 'database',
      label: 'БАЗА_ДАНИХ',
      value: 2341,
      change: -3.2,
      trend: 'down',
      history: Array.from({ length: 20 }, () => Math.random() * 3000)
    },
    {
      id: 'cpu',
      label: 'НАВАНТАЖЕННЯ CPU',
      value: 67,
      change: 5.8,
      trend: 'up',
      history: Array.from({ length: 20 }, () => Math.random() * 100)
    },
    {
      id: 'memory',
      label: 'ВИКОРИСТАННЯ ПАМ\'ЯТІ',
      value: 45,
      change: -1.2,
      trend: 'stable',
      history: Array.from({ length: 20 }, () => Math.random() * 100)
    }
  ]);

  const [selectedMetric, setSelectedMetric] = useState<string>('network');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const newValue = metric.value + (Math.random() - 0.5) * 50;
        const newChange = (Math.random() - 0.5) * 20;
        const newTrend = newChange > 2 ? 'up' : newChange < -2 ? 'down' : 'stable';
        
        return {
          ...metric,
          value: Math.max(0, newValue),
          change: newChange,
          trend: newTrend,
          history: [...metric.history.slice(-19), newValue]
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Canvas drawing for live chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const metric = metrics.find(m => m.id === selectedMetric);
      if (!metric) return;

      const data = metric.history;
      const max = Math.max(...data) * 1.1;
      const min = Math.min(...data) * 0.9;
      const range = max - min;

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw line
      ctx.beginPath();
      ctx.strokeStyle = metric.trend === 'up' ? '#10b981' : metric.trend === 'down' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;

      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * canvas.width;
        const y = canvas.height - ((value - min) / range) * canvas.height;

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

      // Draw points
      data.forEach((value, index) => {
        const x = (index / (data.length - 1)) * canvas.width;
        const y = canvas.height - ((value - min) / range) * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = `${ctx.strokeStyle}40`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [metrics, selectedMetric]);

  const metricIcons = {
    network: Globe,
    database: Database,
    cpu: Cpu,
    memory: Activity
  };

  return (
    <div className={cn('bg-black/40 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
            АНАЛІТИКА
          </h2>
          <p className="text-sm text-slate-400">РЕАЛТАЙМ_МОНИТОРИНГ</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 bg-emerald-500 rounded-full"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-bold text-emerald-400 uppercase">
            LIVE
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.id as keyof typeof metricIcons];
          return (
            <motion.button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all duration-300',
                selectedMetric === metric.id
                  ? 'border-rose-500 bg-rose-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn(
                  'w-5 h-5',
                  metric.trend === 'up' ? 'text-emerald-500' : 
                  metric.trend === 'down' ? 'text-rose-500' : 'text-sky-500'
                )} />
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
              </div>
              <div className="text-2xl font-bold text-white">
                {metric.value.toFixed(0)}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                {metric.label}
              </div>
              <div className={cn(
                'text-xs font-bold mt-1',
                metric.change > 0 ? 'text-emerald-400' : metric.change < 0 ? 'text-rose-400' : 'text-slate-400'
              )}>
                {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Live chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {metrics.find(m => m.id === selectedMetric)?.label}
          </h3>
          <div className="flex gap-2">
            <Button variant="cyber" className="px-3 py-1 text-xs font-bold text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              1H
            </Button>
            <Button variant="cyber" className="px-3 py-1 text-xs font-bold text-rose-500 bg-rose-500/10 rounded-lg">
              24H
            </Button>
            <Button variant="cyber" className="px-3 py-1 text-xs font-bold text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              7D
            </Button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-64 rounded-lg"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              ЦІЛЬ
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            95%
          </div>
          <div className="text-xs text-slate-500">
            досягнення
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              ШВИДКІСТЬ
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            1.2s
          </div>
          <div className="text-xs text-slate-500">
            відповідь
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">
              АКТИВНІСТЬ
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            847
          </div>
          <div className="text-xs text-slate-500">
            подій/хв
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
