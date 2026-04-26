/**
 * 🔴 REAL-TIME EVENT MONITOR // МОНІТОРИНГ ПОДІЙ | v61.0-ELITE
 * Live feed від Kafka + WebSocket streaming
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  AlertCircle, CheckCircle, Zap, Filter, Pause, Play, 
  Activity, Radio, ShieldAlert, Cpu, Database, Binary,
  ChevronRight, ArrowRight, RefreshCw, Terminal, Clock,
  Layers, Target, Sparkles, Fingerprint, MapPin, Eye,
  ShieldCheck, Globe, Zap as ZapIcon
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
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
      case 'deleted': return <ShieldAlert className="text-rose-500" />;
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
      <div className="min-h-screen bg-[#050101] text-slate-200 relative overflow-hidden font-sans pb-40">
        <AdvancedBackground mode="sovereign" />
        <CyberGrid opacity={0.05} color="rgba(225, 29, 72, 0.1)" />
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

        <div className="relative z-10 max-w-[1800px] mx-auto px-6 sm:px-12 pt-12 space-y-16">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-600/20 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-8 bg-black/60 backdrop-blur-3xl border-2 border-rose-500/20 rounded-[3rem] shadow-4xl transform -rotate-3 group-hover:rotate-0 transition-all duration-700">
                    <Radio size={48} className="text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                      LIVE_STREAM // ELITE_v61.0
                    </span>
                    <div className="h-[2px] w-12 bg-rose-500/30" />
                    <span className="text-[10px] font-black text-slate-600 font-mono tracking-widest uppercase italic">KAFKA_GATEWAY_ACTIVE</span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter uppercase italic leading-none mb-1 glint-elite chromatic-elite">
                    МОНІТОРИНГ <span className="text-rose-500">ПОДІЙ</span>
                  </h1>
                  <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.4em] italic opacity-80 leading-none">
                    ПРЯМИЙ ЕФІР ТРАНЗАКЦІЙ ТА ОНОВЛЕНЬ ГЛОБАЛЬНИХ РЕЄСТРІВ
                  </p>
                </div>
              </div>
            }
            stats={stats}
            actions={
              <div className="flex gap-6">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className={cn(
                    "px-12 py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] italic transition-all flex items-center gap-4 shadow-4xl group",
                    isPaused 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20" 
                      : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20"
                  )}
                >
                  {isPaused ? <><Play size={22} className="group-hover:scale-125 transition-transform" /> ВІДНОВИТИ</> : <><Pause size={22} className="group-hover:scale-125 transition-transform" /> ПРИЗУПИНИТИ</>}
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-12 gap-12">
            
            {/* FILTERS SIDEBAR */}
            <div className="col-span-12 xl:col-span-3 space-y-10">
               <div className="relative p-10 rounded-[3rem] bg-black/60 backdrop-blur-3xl border-2 border-white/5 shadow-4xl space-y-10 overflow-hidden group">
                  <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                  <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                     <div className="p-3 bg-rose-500/10 rounded-xl">
                        <Filter size={24} className="text-rose-500" />
                     </div>
                     <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">ФІЛЬТРАЦІЯ_ПОТОКУ</h3>
                  </div>

                  <div className="space-y-8 relative z-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-600 uppercase italic tracking-[0.3em] ml-3">ТИП_ПОДІЇ</label>
                        <select
                          value={filter.type}
                          onChange={(e) => setFilter({ ...filter, type: e.target.value as any })}
                          className="w-full bg-white/[0.03] border-2 border-white/5 p-5 rounded-[1.5rem] text-[11px] font-black text-slate-300 italic tracking-widest outline-none focus:border-rose-500/40 transition-all cursor-pointer"
                        >
                          <option value="all">УСІ_ТИПИ</option>
                          <option value="created">СТВОРЕННЯ</option>
                          <option value="updated">ОНОВЛЕННЯ</option>
                          <option value="deleted">ВИДАЛЕННЯ</option>
                          <option value="status_changed">ЗМІНА_СТАТУСУ</option>
                        </select>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-600 uppercase italic tracking-[0.3em] ml-3">ВАЖЛИВІСТЬ</label>
                        <select
                          value={filter.severity}
                          onChange={(e) => setFilter({ ...filter, severity: e.target.value as any })}
                          className="w-full bg-white/[0.03] border-2 border-white/5 p-5 rounded-[1.5rem] text-[11px] font-black text-slate-300 italic tracking-widest outline-none focus:border-rose-500/40 transition-all cursor-pointer"
                        >
                          <option value="all">УСІ_РІВНІ</option>
                          <option value="info">ІНФОРМАЦІЯ</option>
                          <option value="warning">ПОПЕРЕДЖЕННЯ</option>
                          <option value="critical">КРИТИЧНО</option>
                        </select>
                     </div>
                  </div>

                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/5 blur-[50px] rounded-full group-hover:bg-rose-500/10 transition-colors" />
               </div>

               <div className="p-10 rounded-[3rem] bg-rose-600/5 border-2 border-rose-600/10 space-y-8 relative overflow-hidden group">
                  <div className="flex items-center gap-6">
                     <div className={cn(
                       "w-3 h-3 rounded-full shadow-[0_0_15px_currentColor]", 
                       isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                     )} />
                     <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                        {isConnected ? 'NODE_CONNECTION_ACTIVE' : 'NODE_LINK_LOST'}
                     </p>
                  </div>
                  <p className="text-[10px] font-black text-slate-600 uppercase leading-relaxed italic relative z-10">
                     СУВЕРЕННИЙ ШЛЮЗ АВТОМАТИЧНО ПІДКЛЮЧАЄТЬСЯ ДО KAFKA-СТРІМУ ЧЕРЕЗ WEBSOCKET (PORT: 8000). ЦИКЛ ПЕРЕПІДКЛЮЧЕННЯ: 3 СЕКУНДИ.
                  </p>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-10 -bottom-10 opacity-5"
                  >
                    <RefreshCw size={100} className="text-rose-500" />
                  </motion.div>
               </div>
            </div>

            {/* EVENT FEED */}
            <div className="col-span-12 xl:col-span-9 space-y-8">
               <div className="flex items-center justify-between px-10">
                  <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] italic flex items-center gap-6">
                     <Terminal size={18} className="text-rose-600" /> ТЕРМІНАЛ_АКТИВНОСТІ_ЯДРА
                  </h4>
                  <div className="flex items-center gap-6">
                     <div className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-slate-700 italic tracking-widest border border-white/5">
                        ОСТАННЄ_ОНОВЛЕННЯ: {new Date().toLocaleTimeString('uk-UA')}
                     </div>
                  </div>
               </div>

               <div className="space-y-6 max-h-[1000px] overflow-y-auto custom-scrollbar pr-4">
                  <AnimatePresence mode="popLayout">
                    {filteredEvents.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                        className="p-32 text-center border-4 border-dashed border-white/5 rounded-[4rem] bg-black/20"
                      >
                         <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-rose-500/10 blur-3xl rounded-full scale-150" />
                            <Activity className="relative mx-auto text-slate-800" size={64} />
                         </div>
                         <p className="text-[14px] font-black text-slate-700 uppercase tracking-[0.4em] italic">НЕМАЄ ПОДІЙ ДЛЯ ВІДОБРАЖЕННЯ В ПОТОЦІ</p>
                         <p className="text-[9px] font-mono text-slate-800 mt-6 tracking-[0.2em] uppercase">ОЧІКУВАННЯ ПАКЕТІВ ДАНИХ ВІД ГЛОБАЛЬНОЇ ШИНИ ПОДІЙ...</p>
                      </motion.div>
                    ) : (
                      filteredEvents.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, x: -50, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={cn(
                            "group relative p-10 bg-black/60 backdrop-blur-3xl border-2 rounded-[4rem] transition-all duration-500 overflow-hidden shadow-4xl hover:-translate-y-1",
                            event.severity === 'critical' ? "border-rose-950/40 hover:border-rose-600/40" : 
                            event.severity === 'warning' ? "border-amber-950/40 hover:border-amber-600/40" : 
                            "border-white/5 hover:border-white/20"
                          )}
                        >
                           <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform rotate-12 group-hover:rotate-0 duration-700">
                              {getEventIcon(event.type)}
                           </div>
                           
                           {/* Decorative ID mark */}
                           <div className="absolute top-8 left-10 text-[8px] font-mono text-white/10 font-black tracking-[0.5em] uppercase">
                             EVENT_HEX_{event.id.slice(-8).toUpperCase()}
                           </div>

                           <div className="flex items-center justify-between gap-12 relative z-10 mt-2">
                              <div className="flex items-center gap-10">
                                 <div className={cn(
                                   "w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center text-3xl shadow-4xl transform transition-all duration-700 group-hover:rotate-6",
                                   event.severity === 'critical' ? "bg-rose-600/10 border-rose-500 text-rose-500" : 
                                   event.severity === 'warning' ? "bg-amber-600/10 border-amber-500 text-amber-500" : 
                                   "bg-white/[0.03] border-white/10 text-white/40"
                                 )}>
                                    {getEventIcon(event.type)}
                                 </div>
                                 <div className="space-y-3">
                                    <div className="flex items-center gap-6">
                                       <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none glint-elite">{event.company.name}</h3>
                                       <span className="px-4 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-500 italic uppercase tracking-widest">{event.company.ueid}</span>
                                    </div>
                                    <div className="flex items-center gap-8 text-[11px] font-black text-slate-600 uppercase italic tracking-[0.2em]">
                                       <div className="flex items-center gap-3"><MapPin size={14} className="text-rose-500" /> {event.company.region}</div>
                                       <div className="w-1.5 h-1.5 rounded-full bg-white/5 shadow-inner" />
                                       <div className="flex items-center gap-3"><Clock size={14} className="text-rose-500" /> {new Date(event.timestamp).toLocaleTimeString('uk-UA')}</div>
                                       <div className="w-1.5 h-1.5 rounded-full bg-white/5 shadow-inner" />
                                       <div className="flex items-center gap-3"><Globe size={14} className="text-rose-500/40" /> SSOT_VERIFIED</div>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex flex-col items-end gap-3 text-right">
                                 <div className={cn(
                                   "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic border-2 transition-all duration-500 shadow-xl",
                                   event.severity === 'critical' ? "bg-rose-600/10 border-rose-600/30 text-rose-500 shadow-rose-500/20" : 
                                   event.severity === 'warning' ? "bg-amber-600/10 border-amber-600/30 text-amber-500 shadow-amber-500/20" : 
                                   "bg-emerald-600/10 border-emerald-600/30 text-emerald-500 shadow-emerald-500/20"
                                 )}>
                                    {event.severity === 'critical' ? 'КРИТИЧНО' : event.severity === 'warning' ? 'УВАГА' : 'ІНФОРМАЦІЯ'}
                                 </div>
                                 <div className="text-[10px] font-black text-slate-800 uppercase italic tracking-tighter font-mono group-hover:text-rose-500/40 transition-colors">OSINT_TRACE: {event.id.slice(0, 12).toUpperCase()}</div>
                              </div>
                           </div>

                           {event.changes && Object.keys(event.changes).length > 0 && (
                             <div className="mt-10 pt-10 border-t-2 border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                                {Object.entries(event.changes).map(([key, value]) => (
                                  <div key={key} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 group/field hover:bg-white/[0.04] transition-colors">
                                     <p className="text-[9px] font-black text-slate-700 uppercase italic tracking-[0.3em] group-hover/field:text-rose-500/60 transition-colors">{key}</p>
                                     <p className="text-sm font-black text-slate-300 italic truncate tracking-tight">{String(value)}</p>
                                  </div>
                                ))}
                             </div>
                           )}

                           {/* Interactive Indicator */}
                           <div className="absolute bottom-4 right-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={12} className="text-rose-500 cursor-pointer" />
                              <Target size={12} className="text-rose-500 cursor-pointer" />
                           </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
               </div>
            </div>

          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
        `}} />
      </div>
    </PageTransition>
  );
};

export default RealTimeMonitor;
value)}</p>
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
