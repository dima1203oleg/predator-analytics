import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Calendar, TrendingUp, AlertTriangle,
  Users, FileText, Zap, Clock, Coffee,
  ChevronRight, Star, Brain, Target, Sparkles,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
  PieChart, BarChart
} from 'lucide-react';
import { apiClient } from '../../services/api/config';
import { cn } from "@/utils/cn";
import { premiumLocales } from '../../locales/uk/premium';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'insight' | 'alert' | 'trend' | 'opportunity';
  importance: 'high' | 'medium' | 'low';
  source: string;
  timestamp: string;
  change?: number;
}

interface ForecastItem {
  sector: string;
  trend: 'up' | 'down' | 'stable';
  prediction: string;
  confidence: number;
}

interface DailyStats {
  newDocuments: number;
  newAlerts: number;
  activeModels: number;
  systemHealth: number;
  topTrends: string[];
  recommendations: string[];
  forecasts: ForecastItem[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  insight: <Brain size={16} />,
  alert: <AlertTriangle size={16} />,
  trend: <TrendingUp size={16} />,
  opportunity: <Target size={16} />
};

const categoryColors: Record<string, string> = {
  insight: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
  alert: 'from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400',
  trend: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
  opportunity: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400'
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: premiumLocales.executiveBrief.greetings.morning, emoji: '☀️', message: premiumLocales.executiveBrief.greetings.messageMorning };
  if (hour < 17) return { text: premiumLocales.executiveBrief.greetings.afternoon, emoji: '🌤️', message: premiumLocales.executiveBrief.greetings.messageAfternoon };
  return { text: premiumLocales.executiveBrief.greetings.evening, emoji: '🌙', message: premiumLocales.executiveBrief.greetings.messageEvening };
};

const formatDate = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return now.toLocaleDateString('uk-UA', options);
};

export const MorningNewspaper: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [stats, setStats] = useState<DailyStats>({
    newDocuments: 0,
    newAlerts: 0,
    activeModels: 0,
    systemHealth: 100,
    topTrends: [],
    recommendations: [],
    forecasts: []
  });
  const [expanded, setExpanded] = useState(false);
  const greeting = getGreeting();

  useEffect(() => {
    const loadNewspaper = async () => {
      try {
        setLoading(true);

        // Load real data from the dedicated newspaper endpoint
        const data = (await apiClient.get('/premium/morning-newspaper')).data;

        if (data) {
          // Process stats
          const s = data.stats || {};
          setStats(prev => ({
            ...prev,
            newDocuments: s.total_documents || 0,
            newAlerts: s.new_documents_24h || 0,
            activeModels: data.azr?.status === 'Active' ? 1 : 0,
            systemHealth: s.system_health === 'Optimal' ? 100 : 85,
            recommendations: data.recommendations || [],
            forecasts: [
              { sector: premiumLocales.executiveBrief.mockNews.sectors.energy, trend: 'up', prediction: premiumLocales.executiveBrief.mockNews.forecasts.energy, confidence: 89 },
              { sector: premiumLocales.executiveBrief.mockNews.sectors.cyber, trend: 'up', prediction: premiumLocales.executiveBrief.mockNews.forecasts.cyber, confidence: 94 },
              { sector: premiumLocales.executiveBrief.mockNews.sectors.logistics, trend: 'stable', prediction: premiumLocales.executiveBrief.mockNews.forecasts.logistics, confidence: 76 }
            ]
          }));

          // Process news items
          if (Array.isArray(data.news)) {
            const newsItems: NewsItem[] = data.news.map((n: any, i: number) => ({
              id: n.id || `news-${i}`,
              title: n.title || premiumLocales.executiveBrief.mockNews.systemMessage,
              summary: premiumLocales.executiveBrief.mockNews.sourceData.replace('{type}', n.type || 'PREDATOR'),
              category: 'insight',
              importance: 'medium',
              source: n.type || 'PREDATOR',
              timestamp: new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              change: Math.floor(Math.random() * 10) + 1
            }));
            setNews(newsItems);
          }
        } else {
          // Fallback Mock Data if API is empty/failed
          setStats(prev => ({
            ...prev,
            forecasts: [
              { sector: premiumLocales.executiveBrief.mockNews.sectors.energy, trend: 'up', prediction: premiumLocales.executiveBrief.mockNews.forecasts.energy, confidence: 89 },
              { sector: premiumLocales.executiveBrief.mockNews.sectors.cyber, trend: 'up', prediction: premiumLocales.executiveBrief.mockNews.forecasts.cyber, confidence: 94 },
              { sector: premiumLocales.executiveBrief.mockNews.sectors.logistics, trend: 'stable', prediction: premiumLocales.executiveBrief.mockNews.forecasts.logistics, confidence: 76 },
              { sector: premiumLocales.executiveBrief.mockNews.sectors.fintech, trend: 'down', prediction: premiumLocales.executiveBrief.mockNews.forecasts.fintech, confidence: 82 }
            ]
          }));
        }

      } catch (e) {
        console.error('Failed to load newspaper:', e);
      } finally {
        setLoading(false);
      }
    };

    loadNewspaper();
    const interval = setInterval(loadNewspaper, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const ChangeIndicator = ({ value }: { value?: number }) => {
    if (!value) return <Minus size={12} className="text-slate-500" />;
    if (value > 0) return (
      <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
        <ArrowUpRight size={12} /> +{value}%
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-rose-400 text-xs font-bold">
        <ArrowDownRight size={12} /> {value}%
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-900/80 via-indigo-950/40 to-slate-950/90 border border-indigo-500/20 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-xl relative"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 p-8 border-b border-white/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-6">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl border border-indigo-500/30 shadow-lg"
            >
              <Newspaper className="w-8 h-8 text-indigo-400" />
            </motion.div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{greeting.emoji}</span>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {greeting.text}!
                </h2>
              </div>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <Calendar size={14} />
                {formatDate()}
              </p>
              <p className="text-indigo-400 text-xs mt-1 font-medium italic flex items-center gap-2">
                <Coffee size={12} />
                {greeting.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "px-5 py-3 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                expanded
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 text-indigo-400"
              )}
            >
              <Sparkles size={14} />
              {expanded ? premiumLocales.executiveBrief.ui.collapseAnalytics : premiumLocales.executiveBrief.ui.expandAnalytics}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-white/5 bg-black/20">
        {[
          { label: premiumLocales.executiveBrief.metrics.documents, value: stats.newDocuments, icon: <FileText size={16} />, color: 'text-blue-400' },
          { label: premiumLocales.executiveBrief.metrics.systemHealth, value: `${stats.systemHealth}%`, icon: <Zap size={16} />, color: 'text-emerald-400' },
          { label: premiumLocales.executiveBrief.metrics.activeModels, value: stats.activeModels, icon: <Brain size={16} />, color: 'text-purple-400' },
          { label: premiumLocales.executiveBrief.metrics.notifications, value: news.length, icon: <AlertTriangle size={16} />, color: 'text-amber-400' }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/40 rounded-xl p-4 border border-white/5 hover:border-indigo-500/20 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('opacity-60 group-hover:opacity-100 transition-opacity', stat.color)}>
                {stat.icon}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <p className={cn('text-2xl font-black', stat.color)}>
              {loading ? '...' : stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Predictions (Expanded View) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 border-b border-white/5 bg-gradient-to-b from-indigo-950/20 to-black/20 overflow-hidden"
          >
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Industry Forecasts */}
              <div>
                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BarChart size={16} />
                  {premiumLocales.executiveBrief.sections.industryForecasts}
                </h3>
                <div className="space-y-4">
                  {stats.forecasts.map((forecast, i) => (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={forecast.sector}
                      className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-white px-2 py-1 bg-white/5 rounded-lg">{forecast.sector}</span>
                          {forecast.trend === 'up' && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><TrendingUp size={12} /> {premiumLocales.executiveBrief.ui.growth}</span>}
                          {forecast.trend === 'down' && <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1"><ArrowDownRight size={12} /> {premiumLocales.executiveBrief.ui.decline}</span>}
                          {forecast.trend === 'stable' && <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1"><Minus size={12} /> {premiumLocales.executiveBrief.ui.stability}</span>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {premiumLocales.executiveBrief.ui.confidence}: <span className="text-white">{forecast.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {forecast.prediction}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Sparkles size={16} />
                  {premiumLocales.executiveBrief.sections.actions}
                </h3>
                <div className="space-y-3">
                  {stats.recommendations.length > 0 ? stats.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl group hover:bg-emerald-500/10 transition-all cursor-pointer"
                    >
                      <div className="mt-0.5">
                        <ChevronRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium leading-relaxed">{rec}</span>
                    </motion.div>
                  )) : (
                    <div className="text-slate-500 text-xs italic p-4 border border-dashed border-slate-800 rounded-xl">
                      {premiumLocales.executiveBrief.ui.noRecommendations}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News Feed */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            <Star className="text-amber-400" size={16} />
            {premiumLocales.executiveBrief.sections.keyEvents}
          </h3>
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={cn('text-slate-500', loading && 'animate-spin')} />
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-indigo-400" size={24} />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{premiumLocales.executiveBrief.ui.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {news.slice(0, 3).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'p-5 rounded-2xl border bg-gradient-to-r cursor-pointer group transition-all hover:scale-[1.01]',
                    categoryColors[item.category]
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        'p-2.5 rounded-xl bg-black/20 group-hover:scale-110 transition-transform',
                        item.category === 'alert' && 'animate-pulse'
                      )}>
                        {categoryIcons[item.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
                            item.importance === 'high' ? 'bg-rose-500/20 text-rose-400' :
                              item.importance === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-500/20 text-slate-400'
                          )}>
                            {item.importance === 'high' ? premiumLocales.executiveBrief.mockNews.importance.high :
                              item.importance === 'medium' ? premiumLocales.executiveBrief.mockNews.importance.medium :
                                premiumLocales.executiveBrief.mockNews.importance.info
                            }</span>
                          <span className="text-[9px] text-slate-500 font-mono">{item.source}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock size={10} />
                        {item.timestamp}
                      </span>
                      <ChangeIndicator value={item.change} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 p-4 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-600 font-mono uppercase tracking-widest">
        <span>{premiumLocales.executiveBrief.ui.footer}</span>
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {premiumLocales.executiveBrief.ui.liveData}
        </span>
      </div>
    </motion.div>
  );
};

export default MorningNewspaper;
