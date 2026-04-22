import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskLevelValue } from '@/types/intelligence';
import {
  Brain, Sparkles, AlertTriangle, Target, Lightbulb, Zap,
  Clock, DollarSign, Shield, ArrowRight, TrendingUp, TrendingDown,
  RefreshCw, Bookmark, ThumbsUp, ThumbsDown, Crosshair, Radar,
  Activity, ArrowUpRight, Flame, Layers, Search, BarChart3,
  Rocket, Globe, Cpu, Network, ShieldCheck, Info, Fingerprint,
  ChevronRight, Lock, Eye, X, Terminal, Share2, Download, ZapOff,
  MoreVertical, ShieldAlert, Database, HardDrive, 
  LayoutDashboard, List, Settings, History, Map
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, LineChart, Line 
} from 'recharts';
import { cn } from '@/utils/cn';
import { apiClient as api } from '@/services/api/config';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { HoloContainer } from '@/components/HoloContainer';
import { CyberOrb } from '@/components/CyberOrb';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { SovereignAudio } from '@/utils/sovereign-audio';

// ========================
// Types & Configuration
// ========================

type InsightType = 'prediction' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
type InsightPriority = RiskLevelValue;

interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  category: string;
  createdAt: string;
  actionable: boolean;
  actions?: { label: string; type: 'primary' | 'secondary' }[];
  saved: boolean;
  feedback?: 'positive' | 'negative';
}

// ПАЛІТРА v57.5-ELITE Sovereign: Gold (#e11d48) та Amber (#9f1239)
const TYPE_CONFIG = {
  prediction:     { icon: Brain,       color: '#e11d48', label: 'Прогноз' },
  anomaly:        { icon: Activity,    color: '#9f1239', label: 'Аномалія' },
  opportunity:    { icon: Lightbulb,   color: '#be123c', label: 'Можливість' },
  risk:           { icon: Shield,      color: '#9f1239', label: 'Ризик' },
  recommendation: { icon: Target,      color: '#e11d48', label: 'Рекомендація' }
};

const PRIORITY_CONFIG: Record<InsightPriority, { color: string; label: string }> = {
  critical: { color: '#9f1239', label: 'КРИТИЧНО' },
  high:     { color: '#be123c', label: 'ВИСОКИЙ' },
  medium:   { color: '#e11d48', label: 'СЕРЕДНІЙ' },
  low:      { color: '#475569', label: 'НИЗЬКИЙ' },
  minimal:  { color: '#64748b', label: 'МІНІМАЛЬНИЙ' },
  stable:   { color: '#10b981', label: 'СТАБІЛЬНИЙ' },
  watchlist: { color: '#8b5cf6', label: 'НАГЛЯД' },
  elevated: { color: '#f59e0b', label: 'ПІДВИЩЕНИЙ' },
};

// ── ВИСОКОТЕХНОЛОГІЧНИЙ ПЕРЕКРИТТЯ ──
const WRAITH_Overlay = () => (
    <div className="fixed inset-0 pointer-events-none z-[60]">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
            <div className="w-full h-full animate-scanline bg-gradient-to-b from-transparent via-rose-500/10 to-transparent" 
                 style={{ height: '2px', top: '0' }} />
        </div>
    </div>
);

// ── ХАД СКАНУВАННЯ ──
const ScanningHUD = () => (
    <div className="absolute inset-x-0 top-0 h-1 z-20 overflow-hidden">
        <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_20px_#f43f5e]"
        />
    </div>
);

// ── ТРЕНД ВПЕВНЕНОСТІ ──
const ConfidenceTrend = ({ color }: { color: string }) => {
  const data = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    time: i,
    val: 70 + Math.random() * 25
  })), []);

  return (
    <div className="h-40 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorVal)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── ГОЛОС ОРАКУЛА (Visualization) ──
const OracleVoice = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-1 h-8 px-4 bg-rose-500/5 rounded-full border border-rose-500/10">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        animate={active ? {
          height: [4, 16, 8, 20, 4],
          opacity: [0.3, 1, 0.5, 1, 0.3]
        } : { height: 4, opacity: 0.2 }}
        transition={{
          duration: 1 + Math.random(),
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-1 bg-rose-500 rounded-full shadow-[0_0_8px_#e11d48]"
      />
    ))}
  </div>
);

// ── БІОМЕТРИЧНИЙ СКАНЕР ──
const BiometricScanner = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 pointer-events-none overflow-hidden"
      >
        <motion.div 
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-1 bg-rose-500 shadow-[0_0_30px_#f43f5e] z-50"
        />
        <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
      </motion.div>
    )}
  </AnimatePresence>
);

// ── НЕЙРОННИЙ ГРАФ (Stylized) ──
const NeuralGraph = ({ color }: { color: string }) => (
  <div className="relative w-full h-64 bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden group">
    <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 opacity-20"
    >
      <Network size={400} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color }} />
    </motion.div>
    
    {/* Pulsing Nodes */}
    <div className="absolute inset-0">
       {[...Array(6)].map((_, i) => (
         <motion.div
           key={i}
           initial={{ scale: 0, opacity: 0 }}
           animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.6, 0.2] }}
           transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
           className="absolute w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_15px_#e11d48]"
           style={{
             top: `${20 + Math.random() * 60}%`,
             left: `${20 + Math.random() * 60}%`,
           }}
         />
       ))}
    </div>

    <div className="relative h-full flex flex-col items-center justify-center">
       <Radar size={48} className="text-rose-500 animate-pulse mb-4" />
       <p className="text-[9px] font-black uppercase tracking-[0.5em] text-rose-500/60 italic">NEURAL_MAPPING_ACTIVE</p>
       <div className="absolute bottom-6 left-6 right-6 flex justify-between">
          <div className="space-y-1">
             <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">NODES_DISCOVERED</p>
             <p className="text-[10px] text-white font-black font-mono">1,024</p>
          </div>
          <div className="space-y-1 text-right">
             <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">PATH_SYNERGY</p>
             <p className="text-[10px] text-emerald-500 font-black font-mono">98.2%</p>
          </div>
       </div>
    </div>
  </div>
);

// ── МАТРИЦЯ СТРАТЕГІЧНИХ РІШЕНЬ ──
const StrategicDecisionMatrix = () => {
  const decisions = [
    { label: 'БЛОКУВАННЯ', risk: 85, impact: 92, status: 'RECOMMENDED' },
    { label: 'МОНІТОРИНГ', risk: 45, impact: 30, status: 'ACTIVE' },
    { label: 'РОЗСЛІДУВАННЯ', risk: 65, impact: 75, status: 'PENDING' },
    { label: 'АРХІВАЦІЯ', risk: 10, impact: 5, status: 'AVAILABLE' },
  ];

  return (
    <div className="space-y-6">
      <h4 className="text-[11px] font-black text-rose-500/60 uppercase tracking-[0.5em] italic flex items-center gap-4">
        <div className="p-2 bg-rose-500/10 rounded-lg"><Crosshair size={16} /></div> 
        МАТРИЦЯ_СТРАТЕГІЧНИХ_РІШЕНЬ_ELITE
      </h4>
      <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {decisions.map((dec, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(225, 29, 72, 0.05)' }}
              className="p-6 bg-black/60 border border-white/5 rounded-[1.8rem] relative group/item overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[10px] font-black text-slate-400 group-hover/item:text-white transition-colors uppercase tracking-widest">{dec.label}</span>
                <span className={cn(
                  "text-[8px] font-black px-3 py-1 rounded-full border tracking-tighter",
                  dec.status === 'RECOMMENDED' ? "text-rose-500 border-rose-500/40 bg-rose-500/10 shadow-[0_0_15px_rgba(225,29,72,0.2)]" : "text-slate-600 border-white/10"
                )}>
                  {dec.status}
                </span>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center text-[7px] font-black text-slate-600 uppercase tracking-widest">
                     <span>РИЗИК</span>
                     <span className="text-rose-500/80 font-mono">{dec.risk}%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${dec.risk}%` }}
                       transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 }}
                       className="h-full bg-rose-500/60 shadow-[0_0_10px_#e11d48]"
                     />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <div className="flex justify-between items-center text-[7px] font-black text-slate-600 uppercase tracking-widest">
                     <span>ВПЛИВ</span>
                     <span className="text-emerald-500/80 font-mono">{dec.impact}%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${dec.impact}%` }}
                       transition={{ duration: 1.5, ease: "circOut", delay: i * 0.1 + 0.2 }}
                       className="h-full bg-emerald-500/60 shadow-[0_0_10px_#10b981]"
                     />
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 flex justify-between items-center text-[8px] font-black font-mono text-slate-800 uppercase tracking-[0.4em] px-4 italic border-t border-white/5 pt-4">
          <span className="flex items-center gap-2"><Zap size={10} className="text-rose-500" /> OPTIMAL_PATH_FOUND: TRUE</span>
          <span>SYNERGY: 0.982</span>
        </div>
      </div>
    </div>
  );
};

interface AIInsightsHubProps {
  isWidgetMode?: boolean;
}

const AIInsightsHub: React.FC<AIInsightsHubProps> = ({ isWidgetMode = false }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InsightType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isOffline, nodeSource } = useBackendStatus();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/intelligence/insights');
      setInsights(Array.isArray(res.data) ? res.data : []);
      
      // Сигналізуємо про успішний синтез
      SovereignAudio.playImpact();
      
    } catch {
      // КРИТИЧНА ПОМИЛКА: повідомляємо про збій синхронізації
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'AI_Insights',
          message: 'КРИТИЧНА ПОМИЛКА СИНХРОНІЗАЦІЇ ІНСАЙТІВ. Активовано режим симуляції.',
          severity: 'critical',
          timestamp: new Date().toISOString(),
          code: 'INSIGHTS_FAILED'
        }
      }));

      // Fallback mocks
      setInsights([
        {
          id: 'ins-1',
          type: 'anomaly',
          priority: 'critical',
          title: 'Аномальна концентрація експорту в Сінгапур',
          description: 'Виявлено різкий стрибок обсягів (450%) поставок титанових сплавів через групу посередників з нульовим оборотом.',
          confidence: 94,
          impact: '$1.2M Ризику',
          category: 'Контрабанда',
          createdAt: new Date().toISOString(),
          actionable: true,
          actions: [{ label: 'БЛОКУВАТИ_КОД', type: 'primary' }, { label: 'АНАЛІЗ_ГРАФА', type: 'secondary' }],
          saved: false
        },
        {
          id: 'ins-2',
          type: 'prediction',
          priority: 'medium',
          title: 'Прогноз дефіциту паливно-мастильних матеріалів',
          description: 'Аналіз логістичних ланцюгів вказує на ймовірну затримку поставок у порт Одеси на 12 днів.',
          confidence: 82,
          impact: 'Логістичний збій',
          category: 'Енергетика',
          createdAt: new Date().toISOString(),
          actionable: false,
          saved: true
        },
        {
          id: 'ins-3',
          type: 'risk',
          priority: 'high',
          title: 'Офшорна мережа: підозрілий рух $47M через BVI',
          description: 'Виявлено 14 shell-компаній з ідентичними директорами. Транзакції відповідають схемі відмивання через Кіпр→BVI→ОАЕ.',
          confidence: 97,
          impact: '$47M Заблоковано',
          category: 'Фінансові злочини',
          createdAt: new Date().toISOString(),
          actionable: true,
          actions: [{ label: 'FREEZE_INITIATED', type: 'primary' }, { label: 'ПЕРЕДАТИ_ДО_НАБУ', type: 'secondary' }],
          saved: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleRefresh = async () => {
    SovereignAudio.playPulse();
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    SovereignAudio.playImpact();
  };

  const selectedInsight = useMemo(() => 
    insights.find(i => i.id === selectedId), 
  [insights, selectedId]);

  const openDetail = (id: string) => {
    SovereignAudio.playImpact();
    setSelectedId(id);
    setShowDetail(true);
  };

  const closeDetail = () => {
    SovereignAudio.playPulse();
    setShowDetail(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return insights;
    return insights.filter(i => i.type === filter);
  }, [insights, filter]);

  // ── РЕЖИМ ВІДЖЕТА ──────────────────────────────────────────────────────────────
  if (isWidgetMode) {
    return (
      <div className="flex flex-col h-full bg-[#0a0505]/95 backdrop-blur-xl border border-rose-500/20 overflow-hidden rounded-[2rem] shadow-2xl relative">
        <WRAITH_Overlay />
        <div className="p-6 border-b border-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain size={16} className="text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500/80 italic">ІНСАЙТ_ХАБ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[8px] font-mono text-rose-500/50 uppercase tracking-widest">WRAITH_ACTIVE</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <RefreshCw size={24} className="animate-spin text-rose-500" />
              <span className="text-[8px] font-black uppercase tracking-widest">СИНХРОНІЗАЦІЯ_ЯДРА...</span>
            </div>
          ) : filtered.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => openDetail(insight.id)}
              className="p-4 border border-white/5 hover:border-rose-500/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group rounded-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black uppercase tracking-widest italic" style={{ color: TYPE_CONFIG[insight.type]?.color }}>
                  {TYPE_CONFIG[insight.type]?.label}
                </span>
                <span className="text-[8px] font-mono text-slate-500">{insight.confidence}% MATCH</span>
              </div>
              <h4 className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase leading-snug line-clamp-2">
                {insight.title}
              </h4>
            </motion.div>
          ))}
        </div>

        {/* ── ТІКЕР ОПЕРАТИВНИХ ДАНИХ ── */}
        <div className="mt-auto h-8 bg-black/80 border-t border-rose-500/10 flex items-center overflow-hidden">
           <div className="flex items-center gap-4 px-4 whitespace-nowrap animate-marquee text-[7px] font-black text-rose-500/40 uppercase tracking-widest italic">
              <span>SYSTEM_HEARTBEAT: OK</span>
              <span className="w-1 h-1 bg-rose-500/40 rounded-full" />
              <span>NODES_SAMPLED: 1,429,082</span>
              <span className="w-1 h-1 bg-rose-500/40 rounded-full" />
              <span>SYNERGY_COEFFICIENT: 0.994</span>
              <span className="w-1 h-1 bg-rose-500/40 rounded-full" />
              <span>LATENCY: 14ms</span>
           </div>
        </div>
      </div>
    );
  }

  // ── КОРНЕР HUD ──
  const HUDCorners = ({ color = '#e11d48' }) => (
    <>
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 opacity-40" style={{ borderColor: color, borderRadius: '2rem 0 0 0' }} />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 opacity-40" style={{ borderColor: color, borderRadius: '0 2rem 0 0' }} />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 opacity-40" style={{ borderColor: color, borderRadius: '0 0 0 2rem' }} />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 opacity-40" style={{ borderColor: color, borderRadius: '0 0 2rem 0' }} />
    </>
  );

  // ── ДЕТАЛЬНИЙ ОВЕРЛЕЙ ──
  const DetailOverlay = () => (
    <AnimatePresence>
      {showDetail && selectedInsight && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-20 bg-black/95 backdrop-blur-3xl"
        >
          <WRAITH_Overlay />
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="w-full max-w-7xl h-full max-h-[950px] bg-[#0a0505] border border-rose-500/30 rounded-[3rem] sm:rounded-[4rem] shadow-5xl relative overflow-hidden flex flex-col"
          >
             <BiometricScanner active={showDetail} />
             <div className="absolute inset-0 cyber-scan-grid opacity-[0.05] pointer-events-none" />
             <div className="scanline-nexus opacity-10" />
             <HUDCorners color={TYPE_CONFIG[selectedInsight.type].color} />
             
             {/* Header */}
             <div className="p-6 sm:p-10 border-b border-rose-500/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4 sm:gap-8">
                   <div className="p-4 sm:p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-rose-500/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                      {React.createElement(TYPE_CONFIG[selectedInsight.type].icon, {
                        size: 32,
                        className: "relative z-10",
                        style: { color: TYPE_CONFIG[selectedInsight.type].color }
                      })}
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] italic" style={{ color: TYPE_CONFIG[selectedInsight.type].color }}>
                               СИНТЕЗ_ДЕТАЛЕЙ_{selectedInsight.id}
                            </span>
                         </div>
                         <div className="hidden sm:block w-px h-3 bg-white/10" />
                         <span className="hidden sm:inline text-[9px] font-mono text-slate-500 uppercase tracking-widest">{selectedInsight.confidence}% CONFIDENCE_SCORE</span>
                      </div>
                      <h2 className="text-xl sm:text-4xl font-black text-white italic tracking-tighter uppercase chromatic-elite glint-elite">{selectedInsight.title}</h2>
                   </div>
                </div>
                <button 
                  onClick={closeDetail}
                  className="p-4 sm:p-6 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-white transition-all rounded-[1.5rem] group border border-white/5 hover:border-rose-500/30"
                >
                   <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
             </div>
 
             {/* Main Scroll Content */}
             <div className="flex-1 overflow-y-auto p-6 sm:p-12 custom-scrollbar relative z-10">
                
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                   
                   {/* Left Column: Context & Evidence */}
                   <div className="xl:col-span-8 space-y-12">
                      <section className="space-y-6">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] italic flex items-center gap-4">
                               <div className="p-2 bg-rose-500/20 rounded-lg"><Info size={16} /></div> 
                               АНАЛІТИЧНИЙ_ВИСНОВОК
                            </h4>
                            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em]">REF: PREDATOR-X-RAY-99</span>
                         </div>
                         <div className="relative group">
                            <div className="absolute inset-0 bg-rose-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative text-lg sm:text-xl text-slate-300 font-medium leading-relaxed bg-white/[0.02] p-8 sm:p-10 border border-white/5 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl backdrop-blur-xl">
                               {selectedInsight.description}
                               <br /><br />
                               <span className="text-rose-500/80 italic font-black uppercase tracking-widest text-[11px]">Автономна примітка:</span>
                               <span className="ml-3 text-slate-400 italic">
                                 Виявлено перетин з архівом операцій "Z-Vector". Імовірність навмисного ухилення від моніторингу підвищена до 94.2%. 
                                 Вузлові зв'язки вказують на залучення офшорних юрисдикцій.
                               </span>
                            </div>
                         </div>
                      </section>
 
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic flex items-center gap-4">
                               <div className="p-2 bg-white/5 rounded-lg"><Network size={16} /></div>
                               НЕЙРОННЕ_КАРТУВАННЯ
                            </h4>
                            <NeuralGraph color={TYPE_CONFIG[selectedInsight.type].color} />
                         </section>
 
                         <section className="space-y-6">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic flex items-center gap-4">
                               <div className="p-2 bg-white/5 rounded-lg"><TrendingUp size={16} /></div>
                               ДИНАМІКА_ВІДХИЛЕННЯ
                            </h4>
                            <div className="p-6 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden h-64">
                               <ConfidenceTrend color={TYPE_CONFIG[selectedInsight.type].color} />
                               <div className="absolute top-6 right-8 text-right">
                                  <p className="text-[8px] font-black text-rose-500/40 uppercase tracking-widest">THRESHOLD</p>
                                  <p className="text-sm font-black text-rose-500 italic">CRITICAL</p>
                               </div>
                            </div>
                         </section>
                      </div>
 
                      <section className="space-y-6">
                         <h4 className="text-[11px] font-black text-rose-500/60 uppercase tracking-[0.5em] italic flex items-center gap-4">
                            <Database size={16} /> ПОВ'ЯЗАНІ_СУТНОСТІ_ГРАФА
                         </h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {[
                              { name: 'ТОВ "Метал-Трейд-Груп"', id: 'UEID: 40192837', type: 'СУБ\'ЄКТ', status: 'MONITORED' },
                              { name: 'Port of Singapore Authority', id: 'LOC: SG_SIN', type: 'ЛОКАЦІЯ', status: 'VERIFIED' },
                              { name: 'HSBC Global Settlement', id: 'BANK: HS_GLB', type: 'ФІНАНСИ', status: 'FLAGGED' },
                              { name: 'Договір №45/2024-EX', id: 'DOC: CONTRACT', type: 'ДОКУМЕНТ', status: 'AUDITED' },
                            ].map((entity, i) => (
                              <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-[1.8rem] flex items-center justify-between group hover:border-rose-500/30 transition-all cursor-pointer hover:bg-rose-500/[0.02]">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-rose-500 transition-colors">
                                       {i % 2 === 0 ? <Globe size={18} /> : <Fingerprint size={18} />}
                                    </div>
                                    <div>
                                       <p className="text-[12px] font-bold text-white uppercase tracking-tight">{entity.name}</p>
                                       <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{entity.id}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black text-rose-500/40 uppercase tracking-widest">{entity.type}</p>
                                    <p className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-tighter">{entity.status}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </section>
                      
                      <StrategicDecisionMatrix />
                   </div>
 
                   {/* Right Column: Biometrics & Meta */}
                   <div className="xl:col-span-4 space-y-12">
                      <section className="p-10 bg-rose-500/5 border border-rose-500/10 rounded-[3rem] sm:rounded-[4rem] space-y-8 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute -right-10 -bottom-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                            <Target size={240} />
                         </div>
                         
                         <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] text-center italic relative z-10">ОЦІНКА_КРИТИЧНОСТІ</h4>
                         <div className="flex flex-col items-center justify-center py-6 relative z-10">
                            <motion.p 
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-7xl sm:text-8xl font-black text-white italic tracking-tighter drop-shadow-glow chromatic-elite"
                            >
                               {selectedInsight.impact.split(' ')[0]}
                            </motion.p>
                            <p className="text-[11px] font-black text-rose-600/60 uppercase tracking-[0.6em] mt-3 italic">{selectedInsight.impact.split(' ').slice(1).join('_')}</p>
                         </div>
 
                         <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                               <span>CONFIDENCE_GAP</span>
                               <span className="text-rose-500">{selectedInsight.confidence}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <motion.div 
                                  initial={{ width: 0 }} animate={{ width: `${selectedInsight.confidence}%` }}
                                  transition={{ delay: 0.5, duration: 1.5, ease: "circOut" }}
                                  className="h-full bg-rose-500 shadow-[0_0_20px_#e11d48]" 
                               />
                            </div>
                            <div className="flex justify-between text-[7px] font-mono text-slate-700 uppercase tracking-[0.2em]">
                               <span>LOWER_BOUND: 0.82</span>
                               <span>UPPER_BOUND: 0.99</span>
                            </div>
                         </div>
 
                         <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                               <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">РИЗИК_ВЕКТОР</p>
                               <p className="text-[11px] text-rose-500 font-black italic uppercase">ALPHA_RED</p>
                            </div>
                            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                               <p className="text-[8px] text-slate-500 font-bold uppercase mb-1">ТЕРМІНОВІСТЬ</p>
                               <p className="text-[11px] text-white font-black italic uppercase">ЕКСТРЕННО</p>
                            </div>
                         </div>
                      </section>
 
                      <section className="space-y-6">
                         <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] italic flex items-center gap-4">
                            <Terminal size={16} /> ТЕХНІЧНИЙ_ЛОГ_СИНТЕЗУ
                         </h4>
                         <div className="p-8 bg-black/80 border border-rose-500/10 rounded-[2.5rem] font-mono text-[10px] text-emerald-500/50 leading-relaxed uppercase overflow-hidden relative shadow-inner group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity"><Cpu size={64} className="animate-pulse" /></div>
                            <div className="relative z-10 space-y-1">
                               <p className="text-emerald-400">[{new Date().toLocaleTimeString()}] &gt; INITIALIZING_GRAPH_TRAVERSAL...</p>
                               <p className="text-emerald-500/80">&gt; FETCHING_NEO4J_NODES: OK [42ms]</p>
                               <p className="text-emerald-500/60">&gt; RUNNING_WRAITH_SCORING_ALGO...</p>
                               <p className="text-emerald-500/40">&gt; ANOMALY_COEFFICIENT: 0.982</p>
                               <p className="text-rose-500/60">&gt; CRITICAL_MATCH_FOUND: [G-42_PATTERN]</p>
                               <p className="text-emerald-500/40">&gt; GENERATING_NATURAL_LANGUAGE_SUMMARY...</p>
                               <p className="text-emerald-400/90">&gt; STATUS: READY_FOR_SOVEREIGN_DECISION</p>
                               <motion.div 
                                 animate={{ opacity: [1, 0] }}
                                 transition={{ duration: 0.8, repeat: Infinity }}
                                 className="inline-block w-2 h-4 bg-emerald-500 align-middle ml-1"
                               />
                            </div>
                         </div>
                      </section>
 
                      {/* Секція Дій */}
                      <section className="space-y-6">
                         <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] italic flex items-center gap-4">
                            <ShieldAlert size={16} /> ОПЕРАЦІЙНІ_ПРОТОКОЛИ
                         </h4>
                         <div className="space-y-3">
                            <button className="w-full py-5 bg-white/5 border border-white/5 text-slate-300 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-white/10 hover:border-white/20 transition-all rounded-[1.5rem] flex items-center justify-center gap-4 group">
                               <Share2 size={16} className="group-hover:rotate-12 transition-transform" /> ЕКСПОРТУВАТИ_ДО_ЗВІТУ
                            </button>
                            <button className="w-full py-5 bg-white/5 border border-white/5 text-slate-300 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-white/10 hover:border-white/20 transition-all rounded-[1.5rem] flex items-center justify-center gap-4 group">
                               <Download size={16} className="group-hover:-translate-y-1 transition-transform" /> ЗАВАНТАЖИТИ_ДАНІ_ГРАФА
                            </button>
                         </div>
                      </section>
                   </div>
                </div>
 
             </div>
 
             {/* Actions Footer */}
             <div className="p-6 sm:p-10 bg-black/60 border-t border-rose-500/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 backdrop-blur-2xl">
                <div className="flex items-center gap-8 order-2 sm:order-1">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SYSTEM_SECURED</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e]" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ENCRYPTION: AES-GCM</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2 w-full sm:w-auto">
                   <button 
                     onClick={closeDetail}
                     className="flex-1 sm:flex-none px-8 sm:px-12 py-5 bg-black border-2 border-white/10 text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase hover:border-white/40 hover:text-white transition-all rounded-[1.5rem] italic"
                   >
                      ВІДХИЛИТИ
                   </button>
                   {selectedInsight.actionable && selectedInsight.actions?.[0] && (
                      <button className="flex-1 sm:flex-none px-12 sm:px-20 py-5 bg-rose-500 text-black text-[10px] font-black tracking-[0.4em] uppercase shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:brightness-110 transition-all rounded-[1.5rem] italic border-none group relative overflow-hidden">
                         <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                         {selectedInsight.actions[0].label}
                      </button>
                   )}
                </div>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── ПОВНОСТОРІНКОВИЙ РЕЖИМ ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-200 relative overflow-hidden font-sans bg-[#020202]">
      <AdvancedBackground mode="sovereign" />
      <WRAITH_Overlay />
      <DetailOverlay />

      <div className="relative z-10 max-w-[1700px] mx-auto p-6 sm:p-12 space-y-12 pb-32">

        {/* ── ГОЛОВНИЙ ХЕДЕР ── */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="relative group cursor-pointer" onClick={() => SovereignAudio.playPulse()}>
              <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full" />
              <div className="relative p-7 bg-black/60 border border-rose-500/40 shadow-4xl rounded-[2.5rem] transition-all group-hover:border-rose-500/80">
                <Brain size={48} className="text-rose-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full animate-ping border-4 border-black" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#d4af37]" />
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.8em] italic">
                  SOVEREIGN INTEL NEXUS · CLASSIFIED · v57.5-ELITE
                </span>
                <OracleVoice active={loading || refreshing} />
              </div>
              <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
                АНАЛІТИЧНИЙ{' '}
                <span 
                  className="text-rose-500 drop-shadow-[0_0_30px_rgba(225,29,72,0.6)] text-glitch"
                  data-text="ОРАКУЛ"
                >
                  ОРАКУЛ
                </span>
              </h1>
              <p className="mt-4 text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] flex items-center gap-4">
                <Lock size={14} className="text-rose-500" /> АВТОНОМНИЙ_СИНТЕЗ_ДЕРЖАВНОЇ_СТРАТЕГІЇ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-10 py-5 bg-black/40 border-2 border-rose-500/20 text-rose-500 text-[10px] font-black tracking-[0.4em] uppercase hover:border-rose-500/60 hover:text-white transition-all flex items-center gap-4 disabled:opacity-40 rounded-[1.5rem]"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'СИНТЕЗУЄМО...' : 'ГЛИБОКИЙ_СКАН_ЯДРА'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              className="px-12 py-5 bg-gradient-to-r from-rose-600 to-rose-500 text-black text-[10px] font-black tracking-[0.35em] uppercase shadow-[0_0_40px_rgba(225,29,72,0.3)] flex items-center gap-4 rounded-[1.5rem] border-none"
            >
              <Sparkles size={18} />
              СИТУАТИВНИЙ_ДЕКРЕТ
            </motion.button>
          </div>
        </div>

        {/* ── КЛЮЧОВІ МЕТРИКИ ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'СТРАТЕГІЧНИЙ ВПЛИВ',    value: '$2.4B',    sub: 'EFFECT_PROJECTION', icon: DollarSign, color: '#e11d48' },
            { label: 'СИНЕРГІЯ МОДЕЛЕЙ',     value: '99.9%',    sub: 'HYPER_ALIGNMENT',   icon: Cpu,        color: '#9f1239' },
            { label: 'СУВЕРЕННИЙ ГРАФ',     value: '1.4M',     sub: 'NODES_MAPPED',      icon: Network,    color: '#e11d48' },
            { label: 'АВТОНОМНІСТЬ ЯДРА',    value: 'TIER-1',     sub: 'S-LEVEL_PROTOCOL',  icon: ShieldCheck, color: '#9f1239' },
          ].map((stat) => (
            <TacticalCard key={stat.label} variant="holographic" className="p-10 bg-black/60 border-rose-500/10 hover:border-rose-500/30 transition-all rounded-[3rem] group overflow-hidden relative">
               <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none" />
               <div className="absolute right-0 bottom-0 opacity-[0.02] group-hover:opacity-[0.08] transition-all duration-700">
                  <stat.icon size={160} />
               </div>
               <div className="relative z-10 space-y-4">
                  <p className="text-[9px] font-black text-slate-500 tracking-[0.5em] uppercase">{stat.label}</p>
                  <h3 className="text-4xl font-black text-white italic tracking-tighter glint-elite">{stat.value}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-3 bg-rose-500/40" />
                    <p className="text-[10px] text-rose-600/60 font-black uppercase tracking-[0.3em] font-mono">{stat.sub}</p>
                  </div>
               </div>
            </TacticalCard>
          ))}
        </div>

        {/* ── ФІЛЬТРАЦІЯ СЕКТОРІВ ── */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-black/40 border border-white/5 w-fit rounded-[2rem] shadow-2xl backdrop-blur-3xl relative">
          <ScanningHUD />
          <button
            onClick={() => { SovereignAudio.playPulse(); setFilter('all'); }}
            className={cn(
              "px-8 py-3.5 text-[10px] font-black uppercase tracking-[0.4em] transition-all rounded-xl italic",
              filter === 'all'
                ? "bg-rose-500 text-black shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                : "text-slate-600 hover:text-rose-500 hover:bg-rose-500/5"
            )}
          >
            УСІ СИГНАЛИ
          </button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => { SovereignAudio.playPulse(); setFilter(key as InsightType); }}
              className={cn(
                "flex items-center gap-3 px-7 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-2 border-transparent rounded-xl italic",
                filter === key
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-inner"
                  : "text-slate-700 hover:text-white"
              )}
            >
              <config.icon size={16} />
              {config?.label}
            </button>
          ))}
        </div>

        {/* ── ОСНОВНЕ РОБОЧЕ ПОЛЕ ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Контент інсайтів */}
          <div className="lg:col-span-8 space-y-10">
            <AnimatePresence mode="popLayout">
              {loading || refreshing ? (
                <div className="py-72 flex flex-col items-center justify-center text-center space-y-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/5 blur-[120px] rounded-full animate-pulse" />
                    <CyberOrb size={100} color="#e11d48" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-rose-500/60 font-black tracking-[1em] uppercase text-[11px] animate-pulse italic">
                      СИНТЕЗ_ДЕРЖАВНОГО_ВИСНОВКУ_ELITE...
                    </p>
                    <p className="text-[9px] font-mono text-slate-800 tracking-[0.5em] font-black uppercase">
                      ANALYSIS_ITERATION: 0xF72A9
                    </p>
                  </div>
                </div>
              ) : filtered.length > 0 ? (
                filtered.map((insight, idx) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => openDetail(insight.id)}
                    className="cursor-pointer"
                  >
                    <TacticalCard
                      variant="holographic"
                      className={cn(
                        "p-12 group overflow-hidden bg-black/60 relative border-rose-500/5 hover:border-rose-500/20 transition-all rounded-[3.5rem] shadow-4xl",
                        insight.priority === 'critical' && "shimmer-wraith border-rose-500/20"
                      )}
                    >
                      <HUDCorners color={TYPE_CONFIG[insight.type].color} />
                      <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full group-hover:bg-rose-500/10 transition-all duration-1000" />
                      
                      <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-rose-500/40 to-transparent" />
                      
                      <div className="flex flex-col md:flex-row gap-12 relative z-10">
                        {/* Маркер типу */}
                        <div className="flex flex-col items-center gap-6 shrink-0">
                          <div className="relative group-hover:scale-110 transition-transform duration-500">
                             <div className="absolute inset-0 bg-rose-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="w-24 h-24 flex items-center justify-center bg-[#0a0505] border border-rose-500/20 rounded-[2rem] shadow-2xl relative z-10">
                                {React.createElement(TYPE_CONFIG[insight.type].icon, {
                                  size: 44,
                                  style: { color: TYPE_CONFIG[insight.type].color }
                                })}
                             </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60" style={{ color: TYPE_CONFIG[insight.type]?.color }}>
                            {TYPE_CONFIG[insight.type]?.label}
                          </span>
                        </div>

                        {/* Контент */}
                        <div className="flex-1 space-y-8">
                          <div className="flex items-center gap-6 flex-wrap">
                             <span className="bg-rose-500/10 text-rose-500 text-[9px] font-black px-5 py-2 uppercase tracking-[0.4em] border border-rose-500/20 rounded-xl italic">
                               {PRIORITY_CONFIG[insight.priority]?.label}
                             </span>
                             <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600 font-bold uppercase tracking-widest">
                               <Radar size={14} className="text-rose-600" />
                               CONFIDENCE: <span className="text-slate-300">{insight.confidence}%</span>
                             </div>
                             <div className="flex items-center gap-3 text-[10px] font-mono text-slate-700 font-bold">
                               <Clock size={14} />
                               {new Date(insight.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                             </div>
                          </div>

                          <div className="space-y-5">
                            <h3 className="text-4xl font-black text-white italic tracking-tighter group-hover:text-rose-500 transition-colors uppercase leading-tight chromatic-elite glint-elite">
                              {insight.title}
                            </h3>
                            <p className="text-[15px] text-slate-400 font-medium leading-relaxed max-w-3xl">
                              {insight.description}
                            </p>
                          </div>

                          <div className="pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-8">
                             <div className="flex items-center gap-12">
                                <div className="flex items-center gap-3 px-6 py-2 bg-rose-500/5 border border-rose-500/20 rounded-full text-[12px] font-black tracking-tight italic uppercase text-rose-500 shadow-lg">
                                   <DollarSign size={18} />
                                   {insight.impact}
                                </div>
                                <div className="flex items-center gap-3 px-6 py-2 bg-black/40 border border-white/5 rounded-full text-[12px] font-black tracking-tight italic uppercase text-slate-400">
                                   <Layers size={18} className="text-rose-600" />
                                   {insight.category}
                                </div>
                             </div>

                             <div className="flex items-center gap-4">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); SovereignAudio.playPulse(); }}
                                 className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-[1.5rem] italic bg-white/5 text-slate-500 border border-white/10 hover:border-rose-500/40 hover:text-white"
                               >
                                 ДЕТАЛІ_СИНТЕЗУ
                               </button>
                               {insight.actionable && insight.actions?.map((act, i) => (
                                 <button key={i} 
                                   onClick={(e) => { e.stopPropagation(); SovereignAudio.playPulse(); }}
                                   className={cn(
                                   "px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all rounded-[1.5rem] italic",
                                   act.type === 'primary' 
                                     ? "bg-rose-500 text-black hover:brightness-110 shadow-2xl" 
                                     : "bg-black/40 text-slate-500 border border-white/10 hover:border-rose-500/40 hover:text-white"
                                 )}>
                                   {act.label}
                                 </button>
                               ))}
                             </div>
                          </div>
                        </div>

                        {/* Керування */}
                        <div className="flex flex-row md:flex-col gap-5 justify-center md:pl-10 md:border-l border-white/5 shrink-0">
                           <motion.button 
                             whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                             onClick={(e) => {
                               e.stopPropagation();
                               SovereignAudio.playPulse();
                               setInsights(prev => prev.map(i => i.id === insight.id ? { ...i, saved: !i.saved } : i));
                             }}
                             className={cn(
                               "p-6 border-2 transition-all rounded-[2.5rem] shadow-xl",
                               insight.saved ? "bg-rose-500 border-transparent text-black" : "bg-black/60 border-rose-500/10 text-slate-800 hover:text-rose-500 hover:border-rose-500/40"
                             )}
                           >
                             <Bookmark size={24} fill={insight.saved ? "currentColor" : "none"} />
                           </motion.button>
                           <div className="flex flex-row md:flex-col gap-4">
                              <button onClick={(e) => { e.stopPropagation(); SovereignAudio.playPulse(); }} className="p-4 bg-black/40 border-2 border-white/5 text-slate-800 hover:text-emerald-500 hover:border-emerald-500/30 rounded-2xl transition-all">
                                <ThumbsUp size={18} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); SovereignAudio.playPulse(); }} className="p-4 bg-black/40 border-2 border-white/5 text-slate-800 hover:text-rose-500 hover:border-rose-500/30 rounded-2xl transition-all">
                                <ThumbsDown size={18} />
                              </button>
                           </div>
                        </div>
                      </div>
                    </TacticalCard>
                  </motion.div>
                ))
              ) : (
                <div className="py-72 flex flex-col items-center justify-center border-4 border-dashed border-rose-500/5 rounded-[5rem] bg-black/10">
                   <Radar size={80} className="text-rose-900/30 mb-8" />
                   <p className="text-slate-800 font-black uppercase tracking-[1em] text-[14px] italic">ГОРИЗОНТ_ПОДІЙ_ПУСТИЙ</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── ПАНЕЛЬ ДОДАТКОВИХ МОНІТОРІВ ── */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* ЯДРО ОРАКУЛА */}
            <HoloContainer className="p-10 flex flex-col items-center justify-center min-h-[500px] bg-black/80 border-rose-500/20 rounded-[4rem] shadow-4xl relative overflow-hidden group">
               <div className="absolute inset-0 cyber-scan-grid opacity-[0.05]" />
               <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />
               <div className="relative mb-12">
                  <div className="absolute inset-0 bg-rose-500/10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-[3s]" />
                  <CyberOrb size={100} color="#e11d48" />
               </div>
               <div className="text-center space-y-4">
                  <p className="text-[10px] font-black text-rose-600/40 uppercase tracking-[1em]">PREDATOR_CORE</p>
                  <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase glint-elite chromatic-elite">СИНТЕЗ_WRAITH</h3>
                  <div className="flex items-center gap-3 px-6 py-2 bg-rose-500/5 border border-rose-500/20 rounded-full w-fit mx-auto mt-8">
                     <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                     <span className="text-[9px] font-black font-mono text-rose-500 uppercase tracking-widest italic">A-STATUS: SUPREME</span>
                  </div>
               </div>
            </HoloContainer>

            {/* МОНІТОР СИСТЕМ */}
            <TacticalCard variant="cyber" className="p-12 bg-black/60 border-rose-500/5 rounded-[4.5rem] shadow-3xl">
               <h4 className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.7em] mb-10 flex items-center gap-4 italic font-bold">
                 <Activity size={18} className="text-rose-500" />
                 STAT_MONITOR_v57.5
               </h4>
               <div className="space-y-8">
                 {[
                   { label: 'SOVEREIGN_SCAN', status: 'ACTIVE', val: '99.9%', color: '#e11d48' },
                   { label: 'NEURAL_DECODING', status: 'ULTRA', val: '1.4B/s', color: '#9f1239' },
                   { label: 'HYPOTHESIS_GEN', status: 'ELITE', val: 'READY', color: '#e11d48' }
                 ].map(sys => (
                   <div key={sys.label} className="border-b border-white/5 pb-6">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{sys.label}</span>
                         <span className="text-[10px] font-black font-mono text-white tracking-widest italic" style={{ color: sys.color }}>{sys.status}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 overflow-hidden rounded-full">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: sys.val === 'READY' ? '100%' : sys.val }}
                           className="h-full bg-rose-500/60 shadow-[0_0_10px_rgba(225,29,72,0.4)]"
                         />
                      </div>
                   </div>
                 ))}
               </div>
            </TacticalCard>

            {/* ГЛОБАЛЬНИЙ СКАНЕР */}
            <div className="relative h-[380px] bg-black/60 backdrop-blur-3xl border border-rose-500/10 rounded-[4.5rem] overflow-hidden group shadow-4xl flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-rose-500/[0.02] pointer-events-none" />
                <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
                <div className="relative w-64 h-64 flex items-center justify-center">
                   <div className="absolute inset-0 border border-rose-900/30 rounded-full" />
                   <div className="absolute inset-8 border border-white/5 rounded-full" />
                   <div className="absolute inset-16 border border-rose-500/10 rounded-full animate-pulse" />
                   
                   <motion.div 
                     className="absolute inset-0 border-t-2 border-rose-500 rounded-full"
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   />
                   <motion.div 
                     className="absolute inset-4 border-r-2 border-rose-600/40 rounded-full"
                     animate={{ rotate: -360 }}
                     transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                   />
                   <Radar size={64} className="text-rose-500/40 opacity-40 group-hover:opacity-100 transition-all duration-1000 scale-125 chromatic-elite" />
                </div>
                <div className="mt-10 text-center relative z-10">
                   <div className="flex items-center gap-3 justify-center mb-2">
                      <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping" />
                      <p className="text-[11px] font-black text-rose-600/80 uppercase tracking-[1em] italic">SCAN_RADAR_ELITE</p>
                   </div>
                   <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">WRAITH_PROTOCOLS: ACTIVE</p>
                </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── ТІКЕР ОПЕРАТИВНИХ ДАНИХ (Глобальний) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-10 bg-black/90 backdrop-blur-xl border-t border-rose-500/20 flex items-center overflow-hidden">
         <div className="flex items-center gap-12 px-10 whitespace-nowrap animate-marquee-slow text-[9px] font-black text-rose-500/60 uppercase tracking-[0.6em] italic">
            {[...Array(5)].map((_, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                   <span>CORE_STATUS: STABLE</span>
                </div>
                <div className="flex items-center gap-3">
                   <Radar size={12} className="text-rose-400" />
                   <span>INTEL_FLOW: 14.8 GB/S</span>
                </div>
                <div className="flex items-center gap-3">
                   <ShieldAlert size={12} className="text-rose-400" />
                   <span>RISK_VECTORS: MONITORED</span>
                </div>
                <div className="flex items-center gap-3">
                   <Fingerprint size={12} className="text-rose-400" />
                   <span>AUTH_LAYER: SUPREME</span>
                </div>
              </React.Fragment>
            ))}
         </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.2); }
        
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 40s linear infinite;
        }
        
        .chromatic-elite {
           text-shadow: 1.5px 0 rgba(225,29,72,0.4), -1.5px 0 rgba(6,182,212,0.4);
        }

        .text-glitch {
          position: relative;
        }
        .text-glitch::before,
        .text-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .text-glitch::before {
          left: 2px;
          text-shadow: -2px 0 #ff00c1;
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        .text-glitch::after {
          left: -2px;
          text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
          animation: glitch-anim2 1s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
          0% { clip: rect(31px, 9999px, 94px, 0); }
          20% { clip: rect(62px, 9999px, 42px, 0); }
          40% { clip: rect(16px, 9999px, 78px, 0); }
          60% { clip: rect(43px, 9999px, 11px, 0); }
          80% { clip: rect(91px, 9999px, 54px, 0); }
          100% { clip: rect(77px, 9999px, 88px, 0); }
        }
        @keyframes glitch-anim2 {
          0% { clip: rect(65px, 9999px, 100px, 0); }
          20% { clip: rect(30px, 9999px, 50px, 0); }
          40% { clip: rect(10px, 9999px, 60px, 0); }
          60% { clip: rect(80px, 9999px, 90px, 0); }
          80% { clip: rect(20px, 9999px, 40px, 0); }
          100% { clip: rect(0px, 9999px, 10px, 0); }
        }

        .glint-elite {
          background: linear-gradient(110deg, #fff 45%, #e11d48 50%, #fff 55%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glint 4s linear infinite;
        }
        @keyframes glint {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}} />
    </div>
  );
};

export default AIInsightsHub;
