/**
 * 🧠 AI INSIGHTS PANEL | PREDATOR v61.0-ELITE
 * AI-powered insights panel
 * Перевищує Palantir: real-time AI analysis, predictive insights, anomaly detection
 */
import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, AlertTriangle, TrendingUp, Target, Zap, ChevronRight, Lightbulb, Shield, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'prediction' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
  actionable: boolean;
}

export const AIInsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  useEffect(() => {
    // Simulate AI analysis
    const generateInsights = () => {
      const insightTypes: Insight['type'][] = ['anomaly', 'trend', 'prediction', 'alert', 'opportunity'];
      const titles = [
        'Виявлено аномалію в мережевому трафіку',
        'Прогноз зростання навантаження на 25%',
        'Рекомендовано оптимізацію бази даних',
        'Виявлено нову загрозу безпеки',
        'Можливість покращення продуктивності',
        'Аномалія в поведінці користувачів',
        'Прогноз пікового навантаження через 2 години'
      ];

      const newInsight: Insight = {
        id: Date.now().toString(),
        type: insightTypes[Math.floor(Math.random() * insightTypes.length)],
        title: titles[Math.floor(Math.random() * titles.length)],
        description: 'AI-аналітика виявила патерн, що потребує уваги. Рекомендовано перевірити системні логи та налаштування.',
        confidence: 70 + Math.random() * 25,
        timestamp: new Date(),
        actionable: Math.random() > 0.3
      };

      setInsights(prev => [newInsight, ...prev].slice(0, 10));
    };

    // Initial insights
    generateInsights();
    generateInsights();
    generateInsights();

    // Periodic analysis
    const interval = setInterval(() => {
      setIsAnalyzing(true);
      setTimeout(() => {
        generateInsights();
        setIsAnalyzing(false);
      }, 2000);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const typeIcons = {
    anomaly: AlertTriangle,
    trend: TrendingUp,
    prediction: BrainCircuit,
    alert: Shield,
    opportunity: Lightbulb
  };

  const typeColors = {
    anomaly: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
    trend: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    prediction: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
    alert: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    opportunity: 'text-violet-500 bg-violet-500/10 border-violet-500/30'
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <BrainCircuit className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">
              AI ІНСАЙТИ
            </h2>
            <p className="text-sm text-slate-400">НЕЙРОМЕРЕЖА PREDATOR</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-400 uppercase">
                АНАЛІЗ...
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights.map((insight) => {
            const Icon = typeIcons[insight.type];
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  'p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
                  selectedInsight?.id === insight.id
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                )}
                onClick={() => setSelectedInsight(insight)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('p-2 rounded-lg', typeColors[insight.type])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-white">
                        {insight.title}
                      </h3>
                      <span className="text-xs font-bold text-slate-400">
                        {insight.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {insight.timestamp.toLocaleTimeString('uk-UA')}
                      </span>
                      {insight.actionable && (
                        <motion.button
                          className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-rose-400 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Target className="w-3 h-3" />
                          ДІЯ
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Selected insight detail */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ДЕТАЛІ ІНСАЙТУ
              </h3>
              <Button variant="cyber"
                onClick={() => setSelectedInsight(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">
                  Тип: <span className="text-white font-bold">{selectedInsight.type.toUpperCase()}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">
                  Впевненість: <span className="text-white font-bold">{selectedInsight.confidence.toFixed(1)}%</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">
                  Час: <span className="text-white font-bold">{selectedInsight.timestamp.toLocaleString('uk-UA')}</span>
                </span>
              </div>
              {selectedInsight.actionable && (
                <motion.button
                  className="w-full mt-4 p-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-800 text-white font-bold text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Target className="w-4 h-4" />
                  ВИКОНАТИ РЕКОМЕНДАЦІЮ
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{insights.length}</div>
          <div className="text-xs text-slate-400 uppercase">ІНСАЙТИ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {insights.filter(i => i.actionable).length}
          </div>
          <div className="text-xs text-slate-400 uppercase">ДІЇ</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">
            {insights.filter(i => i.type === 'alert').length}
          </div>
          <div className="text-xs text-slate-400 uppercase">АЛЕРТИ</div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;
