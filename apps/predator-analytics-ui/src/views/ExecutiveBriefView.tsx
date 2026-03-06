/**
 * 👑 Executive Sovereign Brief | v55 Premium Matrix
 * PREDATOR Ранковий Брифінг Керівника
 * 
 * Персоналізований щоденний дайджест для преміум-клієнтів.
 * Включає:
 * - Стрічку критичних метрик
 * - Пріоритетні сповіщення та можливості
 * - AI-генерований резюме-звіт
 * - Спектральний аналіз ризиків
 * 
 * © 2026 PREDATOR Analytics - Повна українізація v55
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Coffee, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Calendar, Zap, Target, Download, Share2, RefreshCw,
  ChevronRight, ChevronDown, Bookmark, Bell, Crown,
  Activity, FileText, ArrowUpRight, Sparkles, Brain, Radio, Play, Pause,
  Layers, Shield, Globe, Terminal, Box, Boxes, Hexagon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { premiumLocales } from '../locales/uk/premium';
import { api } from '../services/api';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { HoloContainer } from '../components/HoloContainer';

// Типи
interface BriefSection {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  items: BriefItem[];
}

interface BriefItem {
  id: string;
  type: 'alert' | 'opportunity' | 'insight' | 'metric' | 'news' | 'action';
  title: string;
  summary: string;
  detail?: string;
  impact?: string;
  value?: string;
  change?: number;
  source?: string;
  timestamp?: string;
  tags?: string[];
  actionable?: boolean;
  bookmarked?: boolean;
}

interface DailyMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  sparkline?: number[];
}

const TYPE_LABELS: Record<string, string> = {
  alert: 'КРИТИЧНО',
  opportunity: 'МОЖЛИВІСТЬ',
  insight: 'ІНСАЙТ',
  metric: 'МЕТРИКА',
  news: 'НОВИНИ',
  action: 'ДІЯ',
};

const ACTIVITY_DATA = [
  { time: '00:00', value: 12 }, { time: '04:00', value: 8 },
  { time: '08:00', value: 45 }, { time: '12:00', value: 78 },
  { time: '16:00', value: 92 }, { time: '20:00', value: 56 },
  { time: '24:00', value: 34 },
];

const ExecutiveBriefView: React.FC = () => {
  const { userRole, persona, setPersona } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedSections, setExpandedSections] = useState<string[]>(['critical', 'opportunities', 'tradeFlow']);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [sections, setSections] = useState<BriefSection[]>([]);
  const [summary, setSummary] = useState<string>('');

  const PERSONA_CONFIG = useMemo(() => ({
    BUSINESS: { icon: Crown, label: premiumLocales.executiveBrief.personas.business, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    GOVERNMENT: { icon: Shield, label: premiumLocales.executiveBrief.personas.government, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    INTELLIGENCE: { icon: Radio, label: premiumLocales.executiveBrief.personas.intelligence, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    BANKING: { icon: Box, label: premiumLocales.executiveBrief.personas.banking, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    MEDIA: { icon: Globe, label: premiumLocales.executiveBrief.personas.media, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  }), []);

  const fetchBrief = useCallback(async () => {
    try {
      setIsLoading(true);
      // Pass persona to API if needed
      const data = await api.getMorningNewspaper();
      setMetrics(Array.isArray(data.metrics) ? data.metrics : []);
      setSections(Array.isArray(data.sections) ? data.sections : []);
      setSummary(data.summary || '');
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch evening brief", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
    if (isAutoRefresh) {
      const interval = setInterval(fetchBrief, 300000); // 5 min
      return () => clearInterval(interval);
    }
  }, [fetchBrief, isAutoRefresh]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isPremium = userRole === 'admin' || userRole === 'premium';

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: premiumLocales.executiveBrief.greetings.morning, icon: Coffee, color: 'text-amber-400' };
    if (hour < 17) return { text: premiumLocales.executiveBrief.greetings.afternoon, icon: Sun, color: 'text-blue-400' };
    return { text: premiumLocales.executiveBrief.greetings.evening, icon: Moon, color: 'text-indigo-400' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const toggleSection = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleItem = (id: string) => {
    setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!isPremium) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-10 max-w-2xl bg-slate-900/60 p-16 rounded-[64px] border border-amber-500/20 backdrop-blur-3xl shadow-2xl"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-amber-500/20 blur-[80px] rounded-full scale-150" />
            <div className="relative w-32 h-32 bg-slate-950 border border-amber-500/40 rounded-[40px] flex items-center justify-center panel-3d mx-auto">
              <Crown className="w-16 h-16 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            </div>
          </div>
          <div>
            <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-6 font-display">{premiumLocales.executiveBrief.premium.title}</h2>
            <p className="text-slate-400 text-base leading-relaxed font-mono uppercase tracking-widest max-w-md mx-auto opacity-70">
              {premiumLocales.executiveBrief.premium.description}
            </p>
          </div>
          <button className="px-12 py-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-[28px] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all uppercase tracking-[0.3em] transform hover:scale-105 flex items-center gap-4 mx-auto group shadow-xl">
            <Crown size={24} className="group-hover:rotate-12 transition-transform" />
            {premiumLocales.executiveBrief.premium.upgrade}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-10 gap-10 relative z-10 pb-32 animate-in fade-in duration-1000">

      {/* Ambient Lighting Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sovereign Header */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-10 p-10 bg-slate-950/40 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="relative group">
            <div className={`absolute inset-0 blur-[80px] rounded-full scale-150 opacity-20 transition-all duration-1000 ${greeting.color.replace('text', 'bg')}`} />
            <div className="relative p-6 bg-slate-900 border border-white/5 rounded-[32px] shadow-2xl panel-3d group-hover:rotate-6 transition-transform duration-700">
              <GreetingIcon size={40} className={cn(greeting.color, "drop-shadow-[0_0_10px_currentColor]")} />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <h2 className={cn("text-4xl font-black tracking-tighter uppercase leading-none font-display", greeting.color)}>
                {greeting.text}
              </h2>
              <div className="flex items-center gap-2">
                {Object.entries(PERSONA_CONFIG).map(([key, config]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPersona(key as any)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all relative overflow-hidden group/p",
                      persona === key
                        ? cn("border-white/20 shadow-lg text-white", config.bg)
                        : "border-white/5 text-slate-600 grayscale hover:grayscale-0"
                    )}
                    title={config.label}
                  >
                    <config.icon size={16} className={cn(persona === key ? config.color : "text-slate-600")} />
                    {persona === key && (
                      <motion.div layoutId="persona-pulse" className={cn("absolute inset-0 blur-lg -z-10", config.bg)} />
                    )}
                  </motion.button>
                ))}
              </div>
              <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest backdrop-blur-xl">
                INTEL_PERSONA: <span className={cn("font-bold", (PERSONA_CONFIG as any)[persona]?.color)}>{(PERSONA_CONFIG as any)[persona]?.label}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-8 text-[11px] text-slate-500 font-mono font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-3">
                <Calendar size={14} className="text-slate-600" />
                {currentTime.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-3 pl-8 border-l border-white/10">
                <Clock size={14} className="text-slate-600" />
                {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 relative z-10 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <div className="text-right mr-6 hidden sm:block">
            <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">{premiumLocales.executiveBrief.ui.lastUpdate}</div>
            <div className="text-[10px] text-slate-400 font-black font-mono">{lastRefresh.toLocaleTimeString('uk-UA')}</div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={cn(
                "p-4 rounded-2xl border transition-all shadow-xl",
                isAutoRefresh
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-slate-500"
              )}
            >
              {isAutoRefresh ? <Play size={20} /> : <Pause size={20} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBrief}
              disabled={isLoading}
              className="p-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl disabled:opacity-50"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-[20px] text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all flex items-center gap-3"
            >
              <Download size={16} />
              {premiumLocales.executiveBrief.ui.exportPdf}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Vital Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {(isLoading && metrics.length === 0 ? Array(4).fill(0) : metrics).map((metric, i) => (
          <motion.div
            key={typeof metric === 'number' ? i : metric.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            {typeof metric === 'number' ? (
              <div className="h-32 bg-slate-950/40 rounded-[32px] border border-white/5 animate-pulse" />
            ) : (
              <div className="p-8 bg-slate-950/40 border border-white/5 rounded-[40px] backdrop-blur-2xl shadow-xl hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden panel-3d">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-amber-500 transition-colors">{metric.label}</span>
                  {metric.change !== undefined && (
                    <div className={cn(
                      "flex items-center gap-2 text-[10px] font-black px-3 py-1 rounded-full border shadow-lg",
                      metric.trend === 'up' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        metric.trend === 'down' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}>
                      {metric.trend === 'up' ? <TrendingUp size={12} /> : metric.trend === 'down' ? <TrendingDown size={12} /> : <Activity size={12} />}
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between relative z-10">
                  <span className="text-4xl font-black text-white font-display tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">{metric.value}</span>
                  {metric.sparkline && (
                    <div className="flex items-end gap-1.5 h-10 pr-2">
                      {metric.sparkline.map((v, j) => (
                        <motion.div
                          key={j}
                          initial={{ height: 0 }}
                          animate={{ height: `${(v / Math.max(...metric.sparkline!)) * 100}%` }}
                          className={cn(
                            "w-2 rounded-full transition-all duration-700",
                            metric.trend === 'up' ? "bg-emerald-500" : metric.trend === 'down' ? "bg-rose-500" : "bg-slate-500"
                          )}
                          style={{ opacity: 0.2 + (j / metric.sparkline!.length) * 0.8 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10 flex-1">

        {/* Core Brief Feed */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">

          {/* 🛡️ ECONOMIC INTELLIGENCE GRAPH - 3 LEVELS HUB */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { id: 'tradeFlow', level: 1, title: premiumLocales.executiveBrief.sections.tradeFlow, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Первинні економічні потоки та трекинґ вантажів' },
              { id: 'registers', level: 2, title: premiumLocales.executiveBrief.sections.registers, icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Інституційні реєстри, ЄДР, власніть та контракти' },
              { id: 'osint', level: 3, title: premiumLocales.executiveBrief.sections.osint, icon: Radio, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Медіа сигнали, санкції та контекстний OSINT' },
            ].map(lvl => (
              <motion.div
                key={lvl.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => toggleSection(lvl.id)}
                className={cn(
                  "p-6 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden group/lvl",
                  expandedSections.includes(lvl.id) ? "bg-slate-900 border-white/20 shadow-2xl" : "bg-slate-950/40 border-white/5"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("p-3 rounded-2xl border transition-colors", lvl.bg, expandedSections.includes(lvl.id) ? "border-white/20 shadow-lg" : "border-white/5")}>
                    <lvl.icon size={20} className={lvl.color} />
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Level_{lvl.level} Graph Node</div>
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-2 font-display">{lvl.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-wide opacity-0 group-hover/lvl:opacity-100 transition-opacity">{lvl.desc}</p>
                {expandedSections.includes(lvl.id) && <motion.div layoutId="lvl-ind" className={cn("absolute bottom-0 inset-x-0 h-1", lvl.color.replace('text', 'bg'))} />}
              </motion.div>
            ))}
          </div>

          {/* AI Synthesis Hub */}
          <TacticalCard variant="holographic" title="NEURAL_SYNTHESIS_REPORT" className="p-10 bg-slate-950/60 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-scanline opacity-[0.03] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              <div className="relative group/orb shrink-0">
                <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full scale-150 group-hover/orb:scale-175 transition-all duration-1000" />
                <CyberOrb size={200} color="#f59e0b" density={0.8} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={40} className="text-amber-400 animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
                  <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                    <Brain size={24} />
                  </div>
                  <span className="text-[12px] font-black text-white uppercase tracking-[0.4em] font-display">{premiumLocales.executiveBrief.ui.aiSummary}</span>
                </div>
                <p className="text-lg md:text-xl text-amber-100/80 leading-relaxed font-serif italic mb-8 drop-shadow-sm">
                  {(() => {
                    if (isLoading && !summary) return 'Синтез даних у реальному часі...';
                    const txt = summary || premiumLocales.executiveBrief.data.summary.replace('{alerts}', '2').replace('{opportunities}', '4');
                    const parts = txt.split('{status}');
                    if (parts.length > 1) {
                      return <>{parts[0]}<span className="text-emerald-400 font-bold">{premiumLocales.executiveBrief.data.statusPositive}</span>{parts[1]}</>;
                    }
                    return txt;
                  })()}
                </p>
                {/* Visual Signal Bars */}
                <div className="flex items-center gap-2 mb-8 justify-center md:justify-start">
                  {[80, 60, 95, 40, 70].map((h, i) => (
                    <div key={i} className="w-1.5 bg-amber-500/20 rounded-full h-8 relative overflow-hidden">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1 + i * 0.1, duration: 2 }}
                        className="absolute bottom-0 inset-x-0 bg-amber-500"
                      />
                    </div>
                  ))}
                  <span className="text-[9px] font-mono text-amber-500/60 uppercase ml-4 tracking-widest">Cross-Signal Arbitration Active</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                  <button className="px-8 py-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-[10px] font-black text-amber-400 uppercase tracking-widest hover:bg-amber-500/30 transition-all flex items-center gap-3 shadow-xl">
                    <Brain size={16} />
                    {premiumLocales.executiveBrief.ui.askAi}
                  </button>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Decision Confidence: 99.1% (High)</span>
                  </div>
                </div>
              </div>
            </div>
          </TacticalCard>

          {/* Detailed Intelligence Sections */}
          <div className="flex flex-col gap-8">
            {(isLoading && sections.length === 0 ? Array(3).fill(0) : sections).map((section, idx) => (
              <motion.div
                key={typeof section === 'number' ? idx : section.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="group"
              >
                {typeof section === 'number' ? (
                  <div className="h-48 bg-slate-950/40 rounded-[48px] border border-white/5 animate-pulse" />
                ) : (
                  <div className={cn(
                    "bg-slate-950/40 border rounded-[48px] overflow-hidden backdrop-blur-3xl shadow-2xl transition-all duration-700",
                    section.priority === 'critical' ? "border-rose-500/30 shadow-rose-500/5 bg-rose-500/5" :
                      section.priority === 'high' ? "border-amber-500/30 shadow-amber-500/5 bg-amber-500/5" : "border-white/5"
                  )}>
                    {/* Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-10 flex items-center justify-between hover:bg-white/5 transition-colors relative group"
                    >
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "p-4 rounded-[20px] transition-all duration-500 group-hover:scale-110 shadow-xl",
                          section.priority === 'critical' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                            section.priority === 'high' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        )}>
                          {section.priority === 'critical' ? <AlertTriangle size={24} className="animate-pulse" /> : section.priority === 'high' ? <TrendingUp size={24} /> : <Zap size={24} />}
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-black text-white uppercase tracking-tighter font-display mb-1">{section.title}</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{section.items.length} {premiumLocales.executiveBrief.ui.itemsCount}</span>
                            <div className={cn("w-1.5 h-1.5 rounded-full", section.priority === 'critical' ? 'bg-rose-500' : section.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500')} />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-all">
                        {expandedSections.includes(section.id) ? <ChevronDown size={24} className="text-slate-400" /> : <ChevronRight size={24} className="text-slate-400" />}
                      </div>
                    </button>

                    {/* Content */}
                    <AnimatePresence>
                      {expandedSections.includes(section.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-10 pb-10 space-y-6">
                            {section.items.map((item) => (
                              <motion.div
                                key={item.id}
                                layout
                                className={cn(
                                  "p-8 bg-slate-900/40 border rounded-[32px] transition-all duration-500 group/item relative overflow-hidden",
                                  expandedItems.includes(item.id) ? "border-amber-500/40 bg-slate-900/80 shadow-2xl scale-[1.02]" : "border-white/5 hover:border-white/20"
                                )}
                              >
                                <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                                <div className="flex items-start gap-8 cursor-pointer relative z-10" onClick={() => toggleItem(item.id)}>
                                  <div className={cn(
                                    "p-4 rounded-2xl shrink-0 shadow-lg transition-transform group-hover/item:scale-110 duration-500",
                                    item.type === 'alert' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                                      item.type === 'opportunity' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                        item.type === 'insight' ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                                          item.type === 'action' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                                            "bg-slate-500/20 text-slate-400 border border-white/10"
                                  )}>
                                    {item.type === 'alert' ? <AlertTriangle size={24} className="animate-pulse" /> :
                                      item.type === 'opportunity' ? <TrendingUp size={24} /> :
                                        item.type === 'insight' ? <Brain size={24} /> :
                                          item.type === 'action' ? <CheckCircle size={24} /> : <Activity size={24} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-4 mb-3">
                                      <span className="text-xl font-black text-white uppercase tracking-tighter group-hover/item:text-amber-400 transition-colors">{item.title}</span>
                                      {item.value && (
                                        <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 rounded-full shadow-lg">
                                          {item.value}
                                        </span>
                                      )}
                                      <div className="px-2 py-0.5 bg-slate-950/60 rounded border border-white/5 text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">{TYPE_LABELS[item.type]}</div>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium mb-4 max-w-3xl">{item.summary}</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                      {item.tags?.map(tag => (
                                        <div key={tag} className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                                          <Hexagon size={10} className="text-slate-600" />
                                          {tag}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center gap-4 shrink-0 justify-center">
                                    <motion.button
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.8 }}
                                      onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                                      className={cn(
                                        "p-3 rounded-2xl transition-all shadow-xl",
                                        bookmarkedItems.includes(item.id)
                                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                          : "bg-white/5 text-slate-500 border border-white/10 hover:text-white"
                                      )}
                                    >
                                      <Bookmark size={18} fill={bookmarkedItems.includes(item.id) ? 'currentColor' : 'none'} />
                                    </motion.button>
                                    <div className={cn("p-2 rounded-full transition-transform duration-500", expandedItems.includes(item.id) && "rotate-180 bg-amber-500/10 text-amber-500")}>
                                      <ChevronDown size={20} className="text-slate-600" />
                                    </div>
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedItems.includes(item.id) && item.detail && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden relative z-10"
                                    >
                                      <div className="mt-8 pt-8 border-t border-white/5">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                          <div className="lg:col-span-8">
                                            <div className="flex items-center gap-3 mb-6">
                                              <div className="w-6 h-px bg-amber-500/50" />
                                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Detailed Analysis</span>
                                            </div>
                                            <p className="text-base text-slate-300 leading-loose mb-8 font-medium">
                                              {item.detail}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-8">
                                              {item.source && (
                                                <span className="text-[10px] text-amber-500/70 font-black uppercase tracking-widest flex items-center gap-3">
                                                  <Radio size={14} className="animate-pulse" /> СИГНАЛ: <span className="text-white">{item.source}</span>
                                                </span>
                                              )}
                                              {item.timestamp && (
                                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest flex items-center gap-2">
                                                  <Clock size={14} /> {item.timestamp}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="lg:col-span-4 flex flex-col gap-6">
                                            {item.impact && (
                                              <div className="p-6 bg-slate-950 border border-amber-500/20 rounded-3xl shadow-inner relative overflow-hidden group/impact">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/impact:opacity-30 transition-opacity">
                                                  <Target size={40} />
                                                </div>
                                                <div className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-3">{premiumLocales.executiveBrief.ui.impact}</div>
                                                <div className="text-sm text-amber-200/80 font-serif italic leading-relaxed">{item.impact}</div>
                                              </div>
                                            )}
                                            {item.actionable && (
                                              <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="w-full py-5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-[24px] text-[11px] font-black text-white uppercase tracking-widest hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-3"
                                              >
                                                {premiumLocales.executiveBrief.ui.takeAction} <ArrowUpRight size={18} />
                                              </motion.button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">

          {/* Activity Spectrum */}
          <TacticalCard variant="holographic" title="DAILY_ACTIVITY_SPECTRUM" className="p-8 bg-slate-950/40 border-white/5 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                <Activity size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">{premiumLocales.executiveBrief.ui.activityToday}</span>
            </div>
            <div className="h-[220px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ACTIVITY_DATA}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    fontSize={8}
                    tick={{ fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    fontSize={8}
                    tick={{ fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '20px',
                      fontSize: '10px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(20px)'
                    }}
                    itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#activityGradient)" strokeWidth={4} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TacticalCard>

          {/* Sovereign Bookmarks */}
          <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                  <Bookmark size={20} />
                </div>
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">{premiumLocales.executiveBrief.ui.bookmarks}</span>
              </div>
              <div className="px-3 py-1 bg-slate-900 rounded-full text-[10px] font-black text-white">{bookmarkedItems.length}</div>
            </div>

            {bookmarkedItems.length > 0 ? (
              <div className="flex flex-col gap-4">
                {sections.flatMap(s => s.items).filter(i => bookmarkedItems.includes(i.id)).map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-5 bg-slate-950/60 border border-white/5 rounded-3xl hover:border-indigo-500/40 hover:bg-slate-900 transition-all duration-500 cursor-pointer shadow-lg group/bm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-white uppercase tracking-tighter line-clamp-1 group-hover/bm:text-indigo-400 transition-colors">{item.title}</span>
                      <ArrowUpRight size={14} className="text-slate-700 group-hover/bm:text-indigo-400 group-hover/bm:translate-x-1 transition-all" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-0.5 bg-slate-900 rounded text-[7px] font-black text-slate-600 uppercase tracking-widest">{TYPE_LABELS[item.type]}</div>
                      <span className="text-[8px] text-slate-700 font-mono">{item.timestamp}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/30 rounded-[40px] border border-dashed border-white/5 opacity-40">
                <Bookmark size={40} className="text-slate-600 mx-auto mb-4" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{premiumLocales.executiveBrief.ui.noBookmarks}</p>
              </div>
            )}
          </div>

          {/* Tactical Quick Actions */}
          <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
                <Zap size={20} />
              </div>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">{premiumLocales.executiveBrief.ui.quickActions}</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Bell, label: premiumLocales.executiveBrief.sidebar.configureAlerts, color: 'hover:text-amber-500 hover:border-amber-500/40' },
                { icon: Target, label: premiumLocales.executiveBrief.sidebar.setGoals, color: 'hover:text-emerald-500 hover:border-emerald-500/40' },
                { icon: FileText, label: premiumLocales.executiveBrief.sidebar.generateReport, color: 'hover:text-blue-500 hover:border-blue-500/40' },
                { icon: Share2, label: premiumLocales.executiveBrief.sidebar.shareBrief, color: 'hover:text-purple-500 hover:border-purple-500/40' },
              ].map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 10 }}
                  className={cn(
                    "w-full p-5 bg-slate-950/60 border border-white/5 rounded-[24px] transition-all duration-500 flex items-center gap-5 group shadow-lg text-left",
                    action.color
                  )}
                >
                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl group-hover:bg-current group-hover:bg-opacity-10 transition-colors">
                    <action.icon size={18} className="transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Global Connectivity Hub */}
          <div className="p-8 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-indigo-500/20 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-all duration-1000 scale-150">
              <Globe size={120} className="animate-spin-slow rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
                  <Globe size={20} />
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Global Signal Nexus</span>
              </div>
              <p className="text-xs text-indigo-100/70 leading-relaxed font-medium mb-8">
                Вузол Омни-синхронізації виявив нові ринкові патерни в регіоні EMEA. Бажаєте провести глибоке сканування?
              </p>
              <button className="w-full py-5 bg-white text-indigo-950 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-100 transition-all group/btn flex items-center justify-center gap-3">
                <Activity size={16} />
                ІНІЦІЮВАТИ_СКАНУВАННЯ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sovereign Mandate Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-20 p-20 rounded-[64px] bg-slate-950/60 border border-white/5 relative overflow-hidden group shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="p-6 bg-slate-900 border border-white/5 rounded-[32px] mb-10 shadow-2xl panel-3d">
            <Shield className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" size={48} />
          </div>
          <p className="text-2xl md:text-3xl text-slate-300 font-serif italic leading-relaxed max-w-5xl mx-auto mb-12 group-hover:text-white transition-colors duration-1000">
            "Стратегія без даних — це галюцинація. Дані без стратегії — це шум. Інтелект Predator — це міст між хаосом ринку та впевненістю вашого рішення."
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 pt-10 border-t border-white/5 w-full">
            <div className="flex items-center gap-4 text-slate-500 hover:text-amber-500 transition-all">
              <Layers size={18} />
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">MULTILAYER_INTELLIGENCE</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 hover:text-indigo-500 transition-all">
              <Shield size={18} />
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">SOVEREIGN_ENFORCEMENT</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 hover:text-cyan-500 transition-all">
              <Globe size={18} />
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">OMNIPRESENT_NEXUS</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExecutiveBriefView;
