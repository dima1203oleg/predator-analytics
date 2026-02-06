/**
 * PREDATOR Ранковий Брифінг Керівника
 * Персоналізований щоденний дайджест для преміум клієнтів
 * Повна українська локалізація
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Coffee, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Calendar, Zap, Target, Download, Share2, RefreshCw,
  ChevronRight, ChevronDown, Bookmark, Bell, Crown,
  Activity, FileText, ArrowUpRight, Sparkles, Brain, Radio, Play, Pause
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../utils/cn';
import { premiumLocales } from '../locales/uk/premium';

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

// Українські переклади типів використовуються з premiumLocales, але тут ще може бути мапінг якщо потрібно, або видалити.
// Для сумісності з типами можна залишити, але брати значення з локалі.
const TYPE_LABELS: Record<string, string> = {
  alert: premiumLocales.executiveBrief.sections.critical.replace('🚨 ', ''), // спрощення
  opportunity: premiumLocales.executiveBrief.sections.opportunities.replace('📈 ', ''),
  insight: premiumLocales.executiveBrief.sections.insights.replace('🔮 ', ''),
  metric: premiumLocales.executiveBrief.metrics.riskLevel, // приблизне, але тут тип
  news: premiumLocales.executiveBrief.sections.critical, // заглушка
  action: premiumLocales.executiveBrief.sections.actions.replace('✅ ', ''),
};

// Мок-дані з українськими текстами
const MOCK_METRICS: DailyMetric[] = [
  { label: premiumLocales.executiveBrief.metrics.activeAlerts, value: '7', change: -2, trend: 'down', sparkline: [12, 10, 8, 9, 7, 7] },
  { label: premiumLocales.executiveBrief.metrics.opportunities, value: '12', change: 3, trend: 'up', sparkline: [6, 8, 9, 10, 11, 12] },
  { label: premiumLocales.executiveBrief.metrics.marketScore, value: '78', change: 5, trend: 'up', sparkline: [65, 68, 72, 74, 75, 78] },
  { label: premiumLocales.executiveBrief.metrics.riskLevel, value: 'НИЗЬКИЙ', change: -8, trend: 'down', sparkline: [35, 32, 28, 25, 22, 18] },
];

const MOCK_SECTIONS: BriefSection[] = [
  {
    id: 'critical',
    title: premiumLocales.executiveBrief.sections.critical,
    priority: 'critical',
    items: premiumLocales.executiveBrief.data.sections.critical.items.map((item, i) => ({
      ...item,
      id: `c-${i}`,
      type: 'alert' as const,
      timestamp: i === 0 ? '2 години тому' : '4 години тому',
      tags: i === 0 ? ['конкуренція', 'ціни', 'електроніка'] : ['логістика', 'митниця', 'затримка'],
      actionable: true
    }))
  },
  {
    id: 'opportunities',
    title: premiumLocales.executiveBrief.sections.opportunities,
    priority: 'high',
    items: premiumLocales.executiveBrief.data.sections.opportunities.items.map((item, i) => ({
      ...item,
      id: `o-${i}`,
      type: 'opportunity' as const,
      timestamp: i === 0 ? '6 годин тому' : '1 день тому',
      tags: i === 0 ? ['хімія', 'розширення', 'ринковий-розрив'] : ['логістика', 'економія', 'румунія'],
      value: i === 0 ? '$2.4М' : undefined,
      actionable: true
    }))
  },
  {
    id: 'insights',
    title: premiumLocales.executiveBrief.sections.insights,
    priority: 'medium',
    items: premiumLocales.executiveBrief.data.sections.insights.items.map((item, i) => ({
      ...item,
      id: `i-${i}`,
      type: 'insight' as const,
      timestamp: i === 0 ? 'Сьогодні' : 'Вчора',
      tags: i === 0 ? ['прогноз', 'електроніка', 'Q1-2026'] : ['конкуренція', 'стратегія', 'паливо']
    }))
  },
  {
    id: 'actions',
    title: premiumLocales.executiveBrief.sections.actions,
    priority: 'medium',
    items: premiumLocales.executiveBrief.data.sections.actions.items.map((item, i) => ({
      ...item,
      id: `a-${i}`,
      type: 'action' as const,
      tags: i === 0 ? ['ціни', 'перегляд', 'терміново'] : ['комплаєнс', 'документація'],
      actionable: true
    }))
  }
];

const ACTIVITY_DATA = [
  { time: '00:00', value: 12 },
  { time: '04:00', value: 8 },
  { time: '08:00', value: 45 },
  { time: '12:00', value: 78 },
  { time: '16:00', value: 92 },
  { time: '20:00', value: 56 },
  { time: '24:00', value: 34 },
];

const ExecutiveBriefView: React.FC = () => {
  const { userRole, persona } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedSections, setExpandedSections] = useState<string[]>(['critical', 'opportunities']);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Оновлення часу кожну хвилину
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Перевірка преміум доступу
  const isPremium = userRole === 'admin' || userRole === 'premium';

  // Привітання в залежності від часу доби
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: premiumLocales.executiveBrief.greetings.morning, icon: Coffee };
    if (hour < 17) return { text: premiumLocales.executiveBrief.greetings.afternoon, icon: Sun };
    return { text: premiumLocales.executiveBrief.greetings.evening, icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleItem = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  // Екран для не-преміум користувачів
  if (!isPremium) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center space-y-8 max-w-2xl bg-black/60 p-12 rounded-[64px] border border-amber-500/30 backdrop-blur-3xl"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/50">
            <Crown className="w-12 h-12 text-amber-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">{premiumLocales.executiveBrief.premium.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed font-mono">
              {premiumLocales.executiveBrief.premium.description}
            </p>
          </div>
          <button className="px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black rounded-3xl hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all uppercase tracking-[0.2em] transform hover:scale-105 flex items-center gap-3 mx-auto">
            <Crown size={18} />
            {premiumLocales.executiveBrief.premium.upgrade}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 gap-6 relative z-10 pb-24">
      {/* Заголовок з привітанням */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl border border-amber-500/30">
            <GreetingIcon size={32} className="text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="typewriter-effect text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 tracking-tight inline-block">
                {greeting.text}
              </span>
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-widest">
                {persona}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {currentTime.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <div className="text-[9px] text-slate-600 uppercase tracking-widest">{premiumLocales.executiveBrief.ui.lastUpdate}</div>
            <div className="text-[10px] text-slate-400 font-mono">{lastRefresh.toLocaleTimeString('uk-UA')}</div>
          </div>
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              isAutoRefresh
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-white/5 border-white/10 text-slate-400"
            )}
            title={isAutoRefresh ? premiumLocales.executiveBrief.ui.autoRefreshOn : premiumLocales.executiveBrief.ui.autoRefreshOff}
          >
            {isAutoRefresh ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title={premiumLocales.executiveBrief.ui.refresh}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button title={premiumLocales.executiveBrief.ui.share} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <Share2 size={16} />
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
            <Download size={14} />
            {premiumLocales.executiveBrief.ui.exportPdf}
          </button>
        </div>
      </div>

      {/* Стрічка ключових метрик */}
      <div className="grid grid-cols-4 gap-4">
        {MOCK_METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 backdrop-blur-xl group hover:border-amber-500/20 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{metric.label}</span>
              <div className={cn(
                "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full",
                metric.trend === 'up' ? "bg-emerald-500/10 text-emerald-400" :
                metric.trend === 'down' ? "bg-rose-500/10 text-rose-400" :
                "bg-slate-500/10 text-slate-400"
              )}>
                {metric.trend === 'up' ? <TrendingUp size={10} /> :
                 metric.trend === 'down' ? <TrendingDown size={10} /> :
                 <Activity size={10} />}
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-white">{metric.value}</span>
              {metric.sparkline && (
                <div className="flex items-end gap-0.5 h-8">
                  {metric.sparkline.map((v, j) => (
                    <div
                      key={j}
                      className={cn(
                        "w-1.5 rounded-full transition-all",
                        metric.trend === 'up' ? "bg-emerald-500" :
                        metric.trend === 'down' ? "bg-rose-500" : "bg-slate-500"
                      )}
                      style={{ height: `${(v / Math.max(...metric.sparkline!)) * 100}%`, opacity: 0.3 + (j / metric.sparkline!.length) * 0.7 }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Основний контент брифінгу */}
        <div className="col-span-8 space-y-4">
          {MOCK_SECTIONS.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-slate-900/60 border rounded-[32px] overflow-hidden backdrop-blur-xl transition-all",
                section.priority === 'critical' ? "border-rose-500/20" :
                section.priority === 'high' ? "border-amber-500/20" :
                "border-white/5"
              )}
            >
              {/* Заголовок секції */}
              <button
                onClick={() => toggleSection(section.id)}
                title={section.title}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-white">{section.title}</span>
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded uppercase",
                    section.priority === 'critical' ? "bg-rose-500/20 text-rose-400" :
                    section.priority === 'high' ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-500/20 text-slate-400"
                  )}>
                    {section.items.length} {premiumLocales.executiveBrief.ui.itemsCount}
                  </span>
                </div>
                {expandedSections.includes(section.id) ? (
                  <ChevronDown size={18} className="text-slate-500" />
                ) : (
                  <ChevronRight size={18} className="text-slate-500" />
                )}
              </button>

              {/* Елементи секції */}
              <AnimatePresence>
                {expandedSections.includes(section.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-3">
                      {section.items.map((item) => (
                        <motion.div
                          key={item.id}
                          className={cn(
                            "p-4 bg-black/40 border border-white/5 rounded-2xl transition-all",
                            expandedItems.includes(item.id) && "border-amber-500/20"
                          )}
                        >
                          {/* Заголовок елементу */}
                          <div
                            className="flex items-start gap-4 cursor-pointer"
                            onClick={() => toggleItem(item.id)}
                          >
                            <div className={cn(
                              "p-2 rounded-xl shrink-0",
                              item.type === 'alert' ? "bg-rose-500/10" :
                              item.type === 'opportunity' ? "bg-emerald-500/10" :
                              item.type === 'insight' ? "bg-cyan-500/10" :
                              item.type === 'action' ? "bg-amber-500/10" :
                              "bg-slate-500/10"
                            )}>
                              {item.type === 'alert' ? <AlertTriangle size={16} className="text-rose-500" /> :
                               item.type === 'opportunity' ? <TrendingUp size={16} className="text-emerald-500" /> :
                               item.type === 'insight' ? <Brain size={16} className="text-cyan-500" /> :
                               item.type === 'action' ? <CheckCircle size={16} className="text-amber-500" /> :
                               <Activity size={16} className="text-slate-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-white">{item.title}</span>
                                {item.value && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                    {item.value}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">{item.summary}</p>
                              {item.tags && (
                                <div className="flex items-center gap-2 mt-2">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-[8px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleBookmark(item.id); }}
                                title={premiumLocales.executiveBrief.ui.bookmark}
                                className={cn(
                                  "p-1.5 rounded-lg transition-colors",
                                  bookmarkedItems.includes(item.id)
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-white/5 text-slate-500 hover:text-white"
                                )}
                              >
                                <Bookmark size={12} fill={bookmarkedItems.includes(item.id) ? 'currentColor' : 'none'} />
                              </button>
                              <ChevronRight
                                size={14}
                                className={cn(
                                  "text-slate-600 transition-transform",
                                  expandedItems.includes(item.id) && "rotate-90"
                                )}
                              />
                            </div>
                          </div>

                          {/* Розгорнуті деталі */}
                          <AnimatePresence>
                            {expandedItems.includes(item.id) && item.detail && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-white/5">
                                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                                    {item.detail}
                                  </p>
                                  {item.impact && (
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-3">
                                        <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">{premiumLocales.executiveBrief.ui.impact}</div>
                                      <div className="text-[11px] text-amber-300">{item.impact}</div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      {item.source && (
                                        <span className="text-[9px] text-amber-500/70 flex items-center gap-1">
                                          <Radio size={10} /> {item.source}
                                        </span>
                                      )}
                                      {item.timestamp && (
                                        <span className="text-[9px] text-slate-600 flex items-center gap-1">
                                          <Clock size={10} /> {item.timestamp}
                                        </span>
                                      )}
                                    </div>
                                    {item.actionable && (
                                      <button className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[9px] font-black text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-colors flex items-center gap-2">
                                        {premiumLocales.executiveBrief.ui.takeAction} <ArrowUpRight size={10} />
                                      </button>
                                    )}
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
            </motion.div>
          ))}
        </div>

        {/* Бічна панель */}
        <div className="col-span-4 space-y-6">
          {/* Графік активності */}
          <div className="bg-slate-900/60 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} className="text-amber-500" />
              {premiumLocales.executiveBrief.ui.activityToday}
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={ACTIVITY_DATA}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} />
                <YAxis fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '10px'
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#activityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Закладки */}
          <div className="bg-slate-900/60 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bookmark size={14} className="text-amber-500" />
              {premiumLocales.executiveBrief.ui.bookmarks} ({bookmarkedItems.length})
            </h3>
            {bookmarkedItems.length > 0 ? (
              <div className="space-y-2">
                {MOCK_SECTIONS.flatMap(s => s.items).filter(i => bookmarkedItems.includes(i.id)).map(item => (
                  <div key={item.id} className="p-3 bg-black/40 border border-white/5 rounded-xl">
                    <div className="text-[10px] font-bold text-white line-clamp-1">{item.title}</div>
                    <div className="text-[9px] text-slate-500">{TYPE_LABELS[item.type]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bookmark size={24} className="text-slate-700 mx-auto mb-2" />
                <p className="text-[10px] text-slate-600">{premiumLocales.executiveBrief.ui.noBookmarks}</p>
              </div>
            )}
          </div>

          {/* Швидкі дії */}
          <div className="bg-slate-900/60 border border-white/5 rounded-[32px] p-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} className="text-amber-500" />
              {premiumLocales.executiveBrief.ui.quickActions}
            </h3>
            <div className="space-y-2">
              {[
                { icon: Bell, label: premiumLocales.executiveBrief.sidebar.configureAlerts },
                { icon: Target, label: premiumLocales.executiveBrief.sidebar.setGoals },
                { icon: FileText, label: premiumLocales.executiveBrief.sidebar.generateReport },
                { icon: Share2, label: premiumLocales.executiveBrief.sidebar.shareBrief },
              ].map((action, i) => (
                <button
                  key={i}
                  title={action.label}
                  className="w-full p-3 bg-black/40 border border-white/5 rounded-xl hover:border-amber-500/30 transition-all flex items-center gap-3 group text-left"
                >
                  <action.icon size={14} className="text-slate-500 group-hover:text-amber-500" />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-white">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Підсумок */}
          <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 border border-amber-500/20 rounded-[32px] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Sparkles size={18} className="text-amber-400" />
              </div>
              <div className="text-xs font-black text-white uppercase">{premiumLocales.executiveBrief.ui.aiSummary}</div>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed mb-4">
              {(() => {
                  const txt = premiumLocales.executiveBrief.data.summary.replace('{alerts}', '2').replace('{opportunities}', '4');
                  const parts = txt.split('{status}');
                  if (parts.length > 1) {
                      return <>{parts[0]}<span className="text-emerald-400 font-bold">{premiumLocales.executiveBrief.data.statusPositive}</span>{parts[1]}</>;
                  }
                  return txt;
              })()}
            </p>
            <button className="w-full py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-400 uppercase tracking-widest hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2">
              <Brain size={14} />
              {premiumLocales.executiveBrief.ui.askAi}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveBriefView;
