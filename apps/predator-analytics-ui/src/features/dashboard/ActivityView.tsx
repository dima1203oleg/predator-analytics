/**
 * Predator v56.5-ELITE | Sovereign Activity Ledger — Журнал Подій
 * Хронологічна матриця всіх системних маневрів та нейронних зсувів.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, FileText, User, Search, Database,
  AlertCircle, CheckCircle, AlertTriangle, Bot, Zap,
  Filter, RefreshCw, ChevronDown, Eye, Shield, Boxes,
  Target, Globe, Cpu, Radio, Network, Binary
} from 'lucide-react';
import { useAgents } from '@/context/AgentContext';
import { api } from '@/services/api';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';

type EventType = 'case' | 'data' | 'user' | 'ai' | 'system' | 'security';
type EventLevel = 'info' | 'success' | 'warning' | 'error';

interface ActivityEvent {
  id: string;
  type: EventType;
  level: EventLevel;
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
  metadata?: Record<string, any>;
}

const EVENT_TYPE_CONFIG = {
  case: { icon: FileText, label: 'КЕЙС', color: '#60a5fa' },
  data: { icon: Database, label: 'ДАНІ', color: '#22d3ee' },
  user: { icon: User, label: 'КОРИСТУВАЧ', color: '#c084fc' },
  ai: { icon: Bot, label: 'AI_SYNTH', color: '#fbbf24' },
  system: { icon: Zap, label: 'СИСТЕМА', color: '#94a3b8' },
  security: { icon: Shield, label: 'БЕЗПЕКА', color: '#f87171' },
};

const EVENT_LEVEL_CONFIG = {
  info: { icon: Activity, color: '#94a3b8' },
  success: { icon: CheckCircle, color: '#10b981' },
  warning: { icon: AlertTriangle, color: '#f59e0b' },
  error: { icon: AlertCircle, color: '#ef4444' },
};

const EventCard: React.FC<{ event: ActivityEvent }> = ({ event }) => {
  const typeConfig = EVENT_TYPE_CONFIG[event.type];
  const levelConfig = EVENT_LEVEL_CONFIG[event.level];
  const TypeIcon = typeConfig.icon;

  const formatTime = (date: Date) => {
    const diff = (new Date()).getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'ТІЛЬКИ_ЩО';
    if (minutes < 60) return `${minutes} ХВ ТОМУ`;
    if (hours < 24) return `${hours} ГОД ТОМУ`;
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative flex gap-8 pl-12 pb-10 last:pb-0"
    >
      {/* Timeline Connector */}
      <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/5 group-last:bottom-auto group-last:h-10" />

      {/* Vertical Indicator */}
      <div className="absolute left-[14px] top-4 w-5 h-5 rounded-full border border-white/10 bg-slate-900 flex items-center justify-center z-10 shadow-3xl">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeConfig.color }} />
      </div>

      <TacticalCard variant="holographic" className="flex-1 panel-3d group-hover:bg-slate-900/40 p-0 overflow-hidden border-white/5" noPadding>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 relative">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl border border-white/5 bg-black/40 text-slate-400 group-hover:text-white transition-colors">
              <TypeIcon size={24} style={{ color: typeConfig.color }} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: typeConfig.color }}>
                  {typeConfig.label}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="text-[10px] font-bold text-slate-500 font-mono">
                  {event.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <h4 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
                {event.title}
              </h4>
              {event.description && (
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-2xl">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="px-4 py-1.5 rounded-xl bg-black/40 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {formatTime(event.timestamp)}
            </div>
            {event.actor && (
              <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                <User size={12} /> {event.actor}
              </div>
            )}
          </div>
        </div>

        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </TacticalCard>
    </motion.div>
  );
};

const ActivityView: React.FC = () => {
  const { logs } = useAgents();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const [notifications, audit] = await Promise.all([
          api.v45.getNotifications(),
          api.v45.azr.getAudit(50)
        ]);

        const realEvents: ActivityEvent[] = [];

        if (Array.isArray(notifications)) {
          notifications.forEach((n: any) => {
            realEvents.push({
              id: n.id || Math.random().toString(),
              type: n.type === 'error' ? 'security' : (n.type === 'ai' ? 'ai' : 'system'),
              level: n.type as EventLevel || 'info',
              title: n.title,
              description: n.message,
              timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
              actor: 'СИСТЕМНИЙ_МОНІТОР'
            });
          });
        }

        if (Array.isArray(audit)) {
          audit.forEach((a: any) => {
            realEvents.push({
              id: a.id || Math.random().toString(),
              type: 'ai',
              level: 'success',
              title: a.intent || 'ЕВОЛЮЦІЙНИЙ_КРОК',
              description: a.request_text,
              timestamp: new Date(a.created_at),
              actor: 'GLM-5.1 AGENTIC POOL'
            });
          });
        }

        setEvents(realEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      } catch (e) {
        console.error("Failed to load real activity events", e);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [logs]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter(e => e.type === activeFilter);
  }, [events, activeFilter]);

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: ActivityEvent[] } = {};
    filteredEvents.forEach(event => {
      const dateKey = event.timestamp.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [filteredEvents]);

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-32">
      <AdvancedBackground />

      <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-10 space-y-12">
        <ViewHeader
          title="ЛОГ_СУВЕРЕННОЇ_АКТИВНОСТІ"
          icon={<Activity size={24} className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" />}
          breadcrumbs={['PREDATOR', 'СИСТЕМА', 'АКТИВНІСТЬ']}
          stats={[
            { label: 'ПОДІЙ_СЬОГОДНІ', value: String(events.length), color: 'primary', icon: <Boxes size={14} /> },
            { label: 'КРИТИЧНО', value: String(events.filter(e => e.level === 'error').length), color: 'danger', icon: <AlertCircle size={14} /> },
            { label: 'AI_ВТРУЧАННЯ', value: String(events.filter(e => e.type === 'ai').length), color: 'primary', icon: <Bot size={14} /> }
          ]}
          actions={
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
            >
              <RefreshCw size={16} /> ОНОВИТИ_ДАНІ
            </button>
          }
        />

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3 p-1.5 bg-slate-900/40 backdrop-blur-3xl rounded-[28px] border border-white/5 w-fit">
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              "px-6 py-3 rounded-[22px] text-[10px] font-black tracking-widest uppercase transition-all",
              activeFilter === 'all' ? "bg-white text-black shadow-2xl scale-105" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            УСІ_ПОДІЇ
          </button>
          <div className="w-px h-8 bg-white/10 mx-1" />
          {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-[22px] text-[10px] font-black tracking-widest uppercase transition-all border border-transparent",
                  activeFilter === type
                    ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30 scale-105"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                )}
              >
                <Icon size={14} />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Feed */}
        <div className="relative">
          <div className="absolute top-0 left-[23px] bottom-0 w-px bg-white/5" />

          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center text-center space-y-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw size={48} className="text-indigo-500 opacity-20" />
              </motion.div>
              <p className="text-indigo-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse font-mono">СКАНОГРАМУВАННЯ_ЧАСУ...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center bg-slate-900/10 rounded-[48px] border-2 border-dashed border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 z-0"><CyberGrid opacity={0.3} /></div>
              <Activity size={64} className="text-slate-800 mb-6 relative z-10" />
              <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest relative z-10">СИГНАЛИ_ВІДСУТНІ</h3>
              <p className="text-xs text-slate-600 font-medium mt-2 relative z-10 italic">У вибраній хромосфері подій не виявлено</p>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date} className="relative">
                  {/* Date Separator */}
                  <div className="flex items-center gap-6 mb-12 sticky top-4 z-20">
                    <div className="px-6 py-2.5 bg-slate-950 border border-indigo-500/30 rounded-2xl shadow-3xl">
                      <span className="text-xs font-black text-indigo-400 tracking-[0.2em] font-mono">{date}</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/20 to-transparent" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">{dayEvents.length} ПОДІЙ</span>
                  </div>

                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .panel-3d {
          transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .panel-3d:hover {
          transform: translateX(10px) scale(1.005);
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
      `}} />
    </div>
  );
};

export default ActivityView;

