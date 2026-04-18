/**
 * 🔴 REAL-TIME EVENT MONITOR // МОНІТОРИНГ ПОДІЙ | v57.2-WRAITH
 * Live feed від Kafka + WebSocket streaming
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  AlertCircle, CheckCircle, Zap, Filter, Pause, Play, 
  Activity, Radio, ShieldAlert, Cpu, Database, Binary,
  ChevronRight, ArrowRight, RefreshCw, Terminal, Clock,
  Layers, Target, Sparkles, Fingerprint, MapPin
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

// ─── TYPES ────────────────────────────────────────────────────────────

interface RealTimeEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'updated' | 'deleted' | 'status_changed';
  company: {
    name: string;
    ueid: string;
    region: string;
  };
  changes?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
}

interface EventFilter {
  type: 'all' | 'created' | 'updated' | 'deleted' | 'status_changed';
  severity: 'all' | 'info' | 'warning' | 'critical';
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────

export const RealTimeMonitor: React.FC = () => {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<EventFilter>({
    type: 'all',
    severity: 'all'
  });
  const [eventCount, setEventCount] = useState({ total: 0, active: 0 });

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/api/v1/stream/realtime');

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newEvent: RealTimeEvent = {
              id: data.id || Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: data.type || 'updated',
              company: data.company || { name: 'Невідомий субʼєкт', ueid: 'Н/Д', region: 'Н/Д' },
              changes: data.changes,
              severity: determineSeverity(data.type, data.changes)
            };

            if (!isPaused) {
              setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
              setEventCount((prev) => ({
                ...prev,
                total: prev.total + 1,
                active: prev.active + 1
              }));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = () => setIsConnected(false);
        ws.onclose = () => {
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };

        return ws;
      } catch (error) {
        return null;
      }
    };

    const ws = connectWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, [isPaused]);

  const determineSeverity = (type: string, changes?: Record<string, any>) => {
    if (type === 'deleted') return 'critical';
    if (type === 'status_changed') return 'warning';
    if (changes?.['status'] === 'liquidated') return 'critical';
    return 'info';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created': return <Sparkles className="text-emerald-500" />;
      case 'updated': return <RefreshCw className="text-cyan-500" />;
      case 'deleted': return <ShieldAlert className="text-amber-500" />;
      case 'status_changed': return <AlertCircle className="text-amber-500" />;
      default: return <Activity className="text-slate-500" />;
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter.type !== 'all' && event.type !== filter.type) return false;
      if (filter.severity !== 'all' && event.severity !== filter.severity) return false;
      return true;
    });
  }, [events, filter]);

  const stats = useMemo(() => ([
    { label: 'СТАТУС_ЗʼЄДНАННЯ', value: isConnected ? 'АКТИВНЕ' : 'ОФЛАЙН', icon: <Radio size={14} />, color: (isConnected ? 'success' : 'danger') as any, animate: isConnected },
    { label: 'ВСЬОГО_ПОДІЙ', value: String(eventCount.total), icon: <Database size={14} />, color: 'primary' as any },
    { label: 'АКТИВНИЙ_ФІД', value: String(filteredEvents.length), icon: <Activity size={14} />, color: 'primary' as any }
  ]), [isConnected, eventCount.total, filteredEvents.length]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-32">
        <AdvancedBackground />
        <CyberGrid color="rgba(220, 38, 38, 0.03)" />

        <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-12 space-y-12">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-150 animate-pulse" />
                  <div className="relative p-7 bg-black border border-red-900/40 rounded-[2.5rem] shadow-2xl">
                    <Radio size={42} className="text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="badge-v2 bg-red-600/10 border border-red-600/20 text-red-500 px-3 py-1 text-[10px] font-black tracking-[0.3em] uppercase italic">
                      LIVE_MONITORING // TITAN_v57.2
                    </span>
                    <div className="h-px w-10 bg-red-600/20" />
                    <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">REALTIME_SCAN</span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none mb-1">
                    МОНІТОРИНГ <span className="text-red-600 underline decoration-red-600/20 decoration-8 italic uppercase">ПОДІЙ</span>
                  </h1>
                  <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                    ПРЯМИЙ ЕФІР ТРАНЗАКЦІЙ ТА ОНОВЛЕНЬ CERS
                  </p>
                </div>
              </div>
            }
            stats={stats}
            actions={
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className={cn(
                    "px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all flex items-center gap-4 shadow-2xl",
                    isPaused ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-amber-700 hover:bg-amber-600 text-white"
                  )}
                >
                  {isPaused ? <><Play size={20} /> ВІДНОВИТИ</> : <><Pause size={20} /> ПРИЗУПИНИТИ</>}
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-12 gap-10">
            
            {/* FILTERS SIDEBAR */}
            <div className="col-span-12 xl:col-span-3 space-y-8">
               <TacticalCard variant="cyber" className="p-8 rounded-[2.5rem] bg-black border-2 border-white/[0.04] shadow-3xl space-y-8">
                  <div className="flex items-center gap-4 border-b border-white/[0.04] pb-6">
                     <Filter size={20} className="text-red-500" />
                     <h3 className="text-sm font-black text-white italic tracking-widest uppercase">ФІЛЬТРАЦІЯ_ПОТОКУ</h3>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest ml-2">ТИП_ПОДІЇ</label>
                        <select
                          value={filter.type}
                          onChange={(e) => setFilter({ ...filter, type: e.target.value as any })}
                          className="w-full bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl text-[10px] font-black text-slate-300 italic tracking-widest outline-none focus:border-red-500/40"
                        >
                          <option value="all">УСІ_ТИПИ</option>
                          <option value="created">СТВОРЕННЯ</option>
                          <option value="updated">ОНОВЛЕННЯ</option>
                          <option value="deleted">ВИДАЛЕННЯ</option>
                          <option value="status_changed">ЗМІНА_СТАТУСУ</option>
                        </select>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-700 uppercase italic tracking-widest ml-2">ВАЖЛИВІСТЬ</label>
                        <select
                          value={filter.severity}
                          onChange={(e) => setFilter({ ...filter, severity: e.target.value as any })}
                          className="w-full bg-white/[0.02] border border-white/[0.05] p-4 rounded-xl text-[10px] font-black text-slate-300 italic tracking-widest outline-none focus:border-red-500/40"
                        >
                          <option value="all">УСІ_РІВНІ</option>
                          <option value="info">ІНФОРМАЦІЯ</option>
                          <option value="warning">ПОПЕРЕДЖЕННЯ</option>
                          <option value="critical">КРИТИЧНО</option>
                        </select>
                     </div>
                  </div>
               </TacticalCard>

               <div className="p-8 rounded-[2.5rem] bg-red-600/[0.02] border border-red-600/10 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                        {isConnected ? 'NODE_CONNECTION_ACTIVE' : 'NODE_LINK_LOST'}
                     </p>
                  </div>
                  <p className="text-[9px] font-black text-slate-700 uppercase leading-relaxed italic">
                     Система автоматично підключається до Kafka-стріму через WebSocket шлюз на порту 8000.
                  </p>
               </div>
            </div>

            {/* EVENT FEED */}
            <div className="col-span-12 xl:col-span-9 space-y-6">
               <div className="flex items-center justify-between px-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic flex items-center gap-4">
                     <Terminal size={14} className="text-red-600" /> ТЕРМІНАЛ_АКТИВНОСТІ
                  </h4>
                  <div className="flex items-center gap-4">
                     <div className="text-[10px] font-black text-slate-700 italic">ОСТАННЄ_ОНОВЛЕННЯ: {new Date().toLocaleTimeString('uk-UA')}</div>
                  </div>
               </div>

               <div className="space-y-4 max-h-[850px] overflow-y-auto no-scrollbar pr-2">
                  <AnimatePresence mode="popLayout">
                    {filteredEvents.length === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center border-2 border-dashed border-white/[0.02] rounded-[3rem]">
                         <Activity className="mx-auto mb-6 text-slate-800" size={48} />
                         <p className="text-[12px] font-black text-slate-600 uppercase tracking-widest italic">НЕМАЄ ПОДІЙ ДЛЯ ВІДОБРАЖЕННЯ</p>
                      </motion.div>
                    ) : (
                      filteredEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "p-8 bg-black border-2 rounded-[3.5rem] transition-all relative overflow-hidden group",
                            event.severity === 'critical' ? "border-amber-900/30 hover:border-amber-600/40" : 
                            event.severity === 'warning' ? "border-amber-900/30 hover:border-amber-600/40" : 
                            "border-white/[0.04] hover:border-white/10"
                          )}
                        >
                           <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                              {getEventIcon(event.type)}
                           </div>

                           <div className="flex items-center justify-between gap-10 relative z-10">
                              <div className="flex items-center gap-6">
                                 <div className={cn(
                                   "w-16 h-16 rounded-[1.5rem] border flex items-center justify-center text-2xl shadow-2xl",
                                   event.severity === 'critical' ? "bg-amber-600/10 border-amber-600/20" : 
                                   event.severity === 'warning' ? "bg-amber-600/10 border-amber-600/20" : 
                                   "bg-white/[0.02] border-white/[0.05]"
                                 )}>
                                    {getEventIcon(event.type)}
                                 </div>
                                 <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                       <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{event.company.name}</h3>
                                       <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[9px] font-black text-slate-500 italic uppercase">{event.company.ueid}</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-[9px] font-black text-slate-700 uppercase italic tracking-widest">
                                       <div className="flex items-center gap-2"><MapPin size={10} className="text-red-500" /> {event.company.region}</div>
                                       <div className="h-1 w-1 rounded-full bg-slate-800" />
                                       <div className="flex items-center gap-2"><Clock size={10} className="text-red-500" /> {new Date(event.timestamp).toLocaleTimeString('uk-UA')}</div>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex flex-col items-end gap-2 text-right">
                                 <div className={cn(
                                   "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                                   event.severity === 'critical' ? "bg-amber-600/10 border-amber-600/20 text-amber-500" : 
                                   event.severity === 'warning' ? "bg-amber-600/10 border-amber-600/20 text-amber-500" : 
                                   "bg-emerald-600/10 border-emerald-600/20 text-emerald-500"
                                 )}>
                                    {event.severity.toUpperCase()}
                                 </div>
                                 <div className="text-[10px] font-black text-slate-800 uppercase italic tracking-tighter">EVENT_ID: {event.id.slice(-8).toUpperCase()}</div>
                              </div>
                           </div>

                           {event.changes && Object.keys(event.changes).length > 0 && (
                             <div className="mt-8 pt-8 border-t border-white/[0.03] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                {Object.entries(event.changes).map(([key, value]) => (
                                  <div key={key} className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.02] space-y-1">
                                     <p className="text-[8px] font-black text-slate-700 uppercase italic tracking-widest">{key}</p>
                                     <p className="text-xs font-black text-slate-300 italic truncate">{String(value)}</p>
                                  </div>
                                ))}
                             </div>
                           )}
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
               </div>
            </div>

          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 60px 100px -30px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
};

export default RealTimeMonitor;
