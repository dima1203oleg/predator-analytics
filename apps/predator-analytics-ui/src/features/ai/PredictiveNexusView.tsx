import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Network,
  Cpu,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Activity,
  Globe,
  Radio,
  Clock,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Lock,
  Trophy,
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// --- Types ---

interface Scenario {
  id: string;
  name: string;
  probability: number;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
  signals: string[];
  recommendation: string;
  eta: string;
}

interface MarketInsight {
  id: string;
  category: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

// --- Mock Data ---

const MOCK_HISTORICAL_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  activity: 40 + Math.random() * 40,
  prediction: 45 + Math.random() * 35,
}));

const SCENARIOS: Scenario[] = [
  {
    id: 'S1',
    name: 'Картельна змова на пальному',
    probability: 82,
    impact: 'High',
    description: 'Аномальна синхронізація цін у 5 найбільших мережах АЗС за останні 48 годин.',
    signals: ['Ціновий паритет', 'Затримка поставок', 'Звʼязки через офшори'],
    recommendation: 'Термінова перевірка АМКУ та ДПС. Блокування податкових накладних.',
    eta: '24-48 годин',
  },
  {
    id: 'S2',
    name: 'Прорив логістичного коридору',
    probability: 65,
    impact: 'Medium',
    description: 'Прогноз зростання трафіку через західний кордон на 40% через нові митні угоди.',
    signals: ['Тиск на КПП', 'Нові експортні контракти'],
    recommendation: 'Збільшити зміну на КПП "Ягодин". Адаптувати чергу вантажівок.',
    eta: '5-7 днів',
  },
  {
    id: 'S3',
    name: 'Ризик дефолту контрагента X',
    probability: 91,
    impact: 'High',
    description: 'Система виявила виведення активів великого імпортера електроніки.',
    signals: ['Масове звільнення', 'Продаж нерухомості', 'Судові позови'],
    recommendation: 'Припинити кредитні лінії. Вимога 100% передоплати.',
    eta: 'Негайно',
  }
];

const INSIGHTS: MarketInsight[] = [
  { id: '1', category: 'Державні закупівлі', value: '7.8 млрд ₴', change: 12.4, trend: 'up', confidence: 94 },
  { id: '2', category: 'Митні надходження', value: '45.2 млрд ₴', change: -3.2, trend: 'down', confidence: 88 },
  { id: '3', category: 'Тіньовий імпорт (ест.)', value: '1.2 млрд ₴', change: 5.1, trend: 'up', confidence: 76 },
];

// --- Components ---

const PredictionCard = ({ scenario }: { scenario: Scenario }) => (
  <TacticalCard
    variant="premium"
    className="group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-4">
      <div className={cn(
        "px-2 py-1 rounded border text-[10px] font-black uppercase tracking-widest",
        scenario.impact === 'High' ? "border-rose-500/40 bg-rose-500/10 text-rose-400" :
        "border-amber-500/40 bg-amber-500/10 text-amber-400"
      )}>
        IMPACT: {scenario.impact}
      </div>
    </div>

    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-rose-500/50 transition-colors">
        <Brain className="w-6 h-6 text-rose-400 animate-pulse" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-white truncate group-hover:text-rose-300 transition-colors">{scenario.name}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mt-1 leading-relaxed">{scenario.description}</p>
      </div>
    </div>

    <div className="mt-6 grid grid-cols-2 gap-4">
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Імовірність</div>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl font-black text-white">{scenario.probability}%</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full mb-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${scenario.probability}%` }}
              className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
            />
          </div>
        </div>
      </div>
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Реакція (ETA)</div>
        <div className="flex items-center gap-2 mt-1 text-white font-bold">
          <Clock size={16} className="text-rose-400" />
          <span>{scenario.eta}</span>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {scenario.signals.map(s => (
        <span key={s} className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-[9px] text-slate-400 font-bold uppercase">
          • {s}
        </span>
      ))}
    </div>

    <div className="mt-6 pt-6 border-t border-white/[0.06] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <Target size={12} className="text-emerald-400" />
        </div>
        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider tooltip" title={scenario.recommendation}>
          Рекомендована дія
        </span>
      </div>
      <Button variant="ghost" size="sm" className="text-rose-400 hover:text-white group-hover:bg-rose-500/20 h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-widest">
        Деталі <ChevronRight size={14} className="ml-1" />
      </Button>
    </div>
  </TacticalCard>
);

const PredictiveNexusView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'trends' | 'networks'>('scenarios');
  const [isScanning, setIsScanning] = useState(false);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <PageTransition className="flex-1 p-6 space-y-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-rose-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      <ViewHeader
        title={
          <div>
            <div className="text-3xl font-black">Predictive Nexus v56.1</div>
            <div className="text-sm font-normal text-slate-400 mt-2">Квантовий контур стратегічного прогнозування. Система бачить аномалії до того, як вони стають подіями.</div>
          </div>
        }
        badges={[
          { label: 'ORACLE_CORE_v1.4', color: 'rose', icon: <Cpu size={10} /> },
          { label: 'NEURAL_NETWORK_ACTIVE', color: 'primary', icon: <Brain size={10} /> },
          { label: 'SOVEREIGN_PREDICTION', color: 'success', icon: <ShieldCheck size={10} /> },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              onClick={startScan}
              disabled={isScanning}
              className={cn(
                "relative h-11 px-6 rounded-2xl font-black uppercase tracking-[0.15em] transition-all duration-500",
                isScanning ? "bg-rose-500/20 text-rose-300" : "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              )}
            >
              {isScanning ? (
                <>
                  <Activity size={18} className="mr-2 animate-spin" />
                  Йде сканування...
                </>
              ) : (
                <>
                  <Zap size={18} className="mr-2 fill-current" />
                  Свіжий прогноз
                </>
              )}
              {isScanning && (
                <motion.div 
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              )}
            </Button>
            <Button variant="outline" className="h-11 px-6 border-white/10 bg-white/5 backdrop-blur-md rounded-2xl font-bold uppercase tracking-widest hover:border-rose-500/40">
              Експорт звіту
            </Button>
          </div>
        }
      />

      {/* --- Dashboard Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INSIGHTS.map((insight, idx) => (
          <div key={insight.id} className="relative group">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-5 rounded-[24px] border border-white/[0.06] bg-[#030712]/60 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{insight.category}</span>
                <span className={cn(
                   "flex items-center gap-1 text-[10px] font-black rounded-full px-2 py-0.5 border",
                   insight.trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40" : "bg-rose-500/10 text-rose-400 border-rose-500/40"
                )}>
                  {insight.change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(insight.change)}%
                </span>
              </div>
              <div className="mt-4 text-3xl font-black text-white tracking-tighter">{insight.value}</div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500/60" style={{ width: `${insight.confidence}%` }} />
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Confidence: {insight.confidence}%</span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Predictive Map / Chart --- */}
        <div className="lg:col-span-2 space-y-6">
          <TacticalCard 
            title="Проекція аномальної активності" 
            icon={<Activity size={18} className="text-rose-400" />}
            className="h-[400px]"
          >
            <div className="h-full w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_HISTORICAL_DATA}>
                  <defs>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="activity" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" name="Реальність" />
                  <Area type="monotone" dataKey="prediction" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" name="Прогноз" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TacticalCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-6 rounded-[32px] border border-white/[0.06] bg-gradient-to-br from-rose-500/10 to-indigo-500/10 backdrop-blur-md relative group">
                <div className="absolute top-4 right-6 h-10 w-10 text-rose-500/20 group-hover:text-rose-500/40 transition-colors">
                  <Sparkles size={40} />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter">ШІ-Стратег</h4>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Система рекомендує перерозподілити аналітичні ресурси на моніторинг **Ритейлу побутової техніки**. Ймовірність виявлення махінацій суттєво зросла за останні 12 годин.
                </p>
                <div className="mt-6 flex gap-2">
                  <Button size="sm" className="rounded-full bg-rose-500 shadow-lg shadow-rose-500/20 text-[10px] font-black uppercase">
                    Запустити поглиблений аудит
                  </Button>
                </div>
             </div>

             <div className="p-6 rounded-[32px] border border-white/[0.06] bg-slate-900/40 flex flex-col justify-center">
                <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Статус системи</div>
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-rose-500/20 flex items-center justify-center">
                        <span className="text-lg font-black text-white">98%</span>
                      </div>
                      <svg className="absolute inset-0 h-16 w-16 -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#f43f5e" strokeWidth="4" strokeDasharray="175" strokeDashoffset="10" />
                      </svg>
                   </div>
                   <div>
                     <div className="text-sm font-bold text-white uppercase tracking-tight">Oracle Integrity</div>
                     <div className="text-xs text-slate-500 truncate">Цикл навчання завершено: 14хв тому</div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* --- Side Scenarios --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">Критичні Сценарії</h3>
            <Badge variant="outline" className="border-rose-500/40 text-rose-400 uppercase text-[9px] font-black">
              Top 3 Priority
            </Badge>
          </div>
          
          <div className="space-y-4">
            {SCENARIOS.map(s => (
              <PredictionCard key={s.id} scenario={s} />
            ))}
          </div>

          <Button variant="ghost" className="w-full h-14 rounded-[20px] border border-dashed border-white/10 text-slate-500 hover:text-white hover:border-rose-500/30 hover:bg-rose-500/5 uppercase font-bold text-xs tracking-widest">
            Переглянути всі сценарії (24)
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default PredictiveNexusView;
