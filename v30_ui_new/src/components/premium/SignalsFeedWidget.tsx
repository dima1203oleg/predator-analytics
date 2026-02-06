import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, AlertTriangle, Crosshair,
  ArrowUpRight, ArrowDownRight, Activity, Filter
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Signal {
  id: string;
  type: 'opportunity' | 'threat' | 'market';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  value?: string;
}

export const SignalsFeedWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState<'all' | 'opportunity' | 'threat'>('all');

  useEffect(() => {
    // Initial mock data - localized for UA context
    const initialSignals: Signal[] = [
      {
        id: '1',
        type: 'opportunity',
        title: premiumLocales.signalsFeed.initial.demandGrowth.title,
        description: premiumLocales.signalsFeed.initial.demandGrowth.desc,
        impact: 'high',
        timestamp: '10:42',
        value: '+450%'
      },
      {
        id: '2',
        type: 'threat',
        title: premiumLocales.signalsFeed.initial.newCompetitor.title,
        description: premiumLocales.signalsFeed.initial.newCompetitor.desc,
        impact: 'medium',
        timestamp: '09:15',
        value: '-15%'
      },
      {
        id: '3',
        type: 'market',
        title: premiumLocales.signalsFeed.initial.logisticsTrend.title,
        description: premiumLocales.signalsFeed.initial.logisticsTrend.desc,
        impact: 'medium',
        timestamp: '08:30',
        value: '▼ 8%'
      },
      {
        id: '4',
        type: 'opportunity',
        title: premiumLocales.signalsFeed.initial.priceArbitrage.title,
        description: premiumLocales.signalsFeed.initial.priceArbitrage.desc,
        impact: 'high',
        timestamp: premiumLocales.signalsFeed.yesterday,
        value: '12%'
      }
    ];

    setSignals(initialSignals);

    // Fetch real alerts from API
    const fetchRealSignals = async () => {
      try {
        const response = await fetch('/api/v1/alerts?limit=5');
        if (response.ok) {
          const data = await response.json();
          const alerts = (data.alerts || data || []).map((alert: any) => ({
            id: alert.id || Date.now().toString(),
            type: alert.severity === 'critical' ? 'threat' :
                  alert.type === 'opportunity' ? 'opportunity' : 'market',
            title: alert.title || alert.message || 'Системне сповіщення',
            description: alert.description || alert.summary || '',
            impact: alert.severity === 'critical' ? 'high' :
                   alert.severity === 'warning' ? 'medium' : 'low',
            timestamp: alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : 'Зараз',
            value: alert.value || ''
          }));

          if (alerts.length > 0) {
            setSignals(prev => {
              // Merge new alerts with existing, avoiding duplicates
              const existingIds = new Set(prev.map((s: Signal) => s.id));
              const newAlerts = alerts.filter((a: Signal) => !existingIds.has(a.id));
              return [...newAlerts, ...prev].slice(0, 10);
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch real alerts:', err);
      }
    };

    // Initial fetch
    fetchRealSignals();

    // Periodic refresh every 30 seconds
    const interval = setInterval(fetchRealSignals, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredSignals = filter === 'all'
    ? signals
    : signals.filter(s => s.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
        case 'opportunity': return <Zap size={14} className="text-amber-400" />;
        case 'threat': return <AlertTriangle size={14} className="text-rose-400" />;
        default: return <Activity size={14} className="text-indigo-400" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
        case 'opportunity': return 'amber';
        case 'threat': return 'rose';
        default: return 'indigo';
    }
  };

  if (persona === 'GUEST') return null;

  return (
    <div className="bg-slate-950/80 border border-amber-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 animate-pulse">
            <Crosshair className="text-amber-400" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
              {premiumLocales.signalsFeed.title}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{premiumLocales.signalsFeed.subtitle}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
            {(['all', 'opportunity', 'threat'] as const).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                        "px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all",
                        filter === f ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    {f === 'all' ? premiumLocales.signalsFeed.all : f === 'opportunity' ? premiumLocales.signalsFeed.opportunity : premiumLocales.signalsFeed.threat}
                </button>
            ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <AnimatePresence mode='popLayout'>
            {filteredSignals.map((signal) => (
                <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className={cn(
                        "relative p-4 rounded-xl border transition-all cursor-pointer group hover:scale-[1.02]",
                        `bg-${getColor(signal.type)}-500/5 border-${getColor(signal.type)}-500/20 hover:border-${getColor(signal.type)}-500/40`
                    )}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "p-1.5 rounded-lg bg-black/40 border border-white/5",
                                `text-${getColor(signal.type)}-400`
                            )}>
                                {getIcon(signal.type)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{signal.timestamp}</span>
                        </div>
                        {signal.value && (
                            <div className={cn(
                                "text-xs font-black px-2 py-1 rounded bg-black/40",
                                `text-${getColor(signal.type)}-400`
                            )}>
                                {signal.value}
                            </div>
                        )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-200 transition-colors">
                        {signal.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        {signal.description}
                    </p>

                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={12} className="text-slate-500" />
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
