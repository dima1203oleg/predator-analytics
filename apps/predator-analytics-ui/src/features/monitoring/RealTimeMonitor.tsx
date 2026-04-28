/**
 * 🔴 REAL-TIME EVENT MONITOR | v61.0-ELITE
 * МОНІТОРИНГ_ПОДІЙ: Прямий ефір від Kafka + WebSocket streaming.
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  AlertCircle, CheckCircle, Zap, Filter, Pause, Play, 
  Activity, Radio, ShieldAlert, Cpu, Database, Binary,
  ChevronRight, ArrowRight, RefreshCw, Terminal, Clock,
  Layers, Target, Sparkles, Fingerprint, MapPin, Eye,
  ShieldCheck, Globe, Zap as ZapIcon, Atom, Orbit
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { API_BASE_URL } from '@/services/api/config';

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
        const wsUrl = API_BASE_URL.replace('http', 'ws') + '/stream/realtime';
        const ws = new WebSocket(wsUrl);

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
            console.error('[PREDATOR] Failed to parse WebSocket message:', error);
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
    { label: 'СТАТУС_ЗʼЄДНАННЯ', value: isConnected ? 'АКТИВНЕ_L7' : 'ОФЛАЙН', icon: <Radio size={14} />, color: (isConnected ? 'success' : 'danger') as any, animate: isConnected },
    { label: 'ВСЬОГО_ПОДІЙ_KAFKA', value: String(eventCount.total), icon: <Database size={14} />, color: 'primary' as any },
    { label: 'АКТИВНИЙ_ФІД_ELITE', value: String(filteredEvents.length), icon: <Activity size={14} />, color: 'primary' as any }
  ]), [isConnected, eventCount.total, filteredEvents.length]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-slate-200 relative overflow-hidden font-sans pb-40">
        <AdvancedBackground mode="sovereign" />
        <CyberGrid opacity={0.03} color="rgba(225, 29, 72, 0.1)" />
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

        <div className="relative z-10 max-w-[1850px] mx-auto px-10 pt-16 space-y-20">
          
          <ViewHeader
            title={
              <div className="flex items-center gap-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-rose-600/20 blur-[60px] rounded-full scale-150 animate-pulse" />
                  <div className="relative p-10 bg-black/60 backdrop-blur-3xl border-2 border-rose-500/30 rounded-[3.5rem] shadow-4xl transform -rotate-3 group-hover:rotate-0 transition-all duration-700">
                    <Radio size={56} className="text-rose-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center gap-6">
                    <span className="px-5 py-1.5 bg-rose-600/10 border-2 border-rose-600/30 rounded-xl text-[11px] font-black text-rose-500 tracking-[0.5em] uppercase italic shadow-2xl">
                       KAFKA_GATEWAY // v61.0-ELITE
                    </span>
                    <div className="h-[2px] w-16 bg-rose-500/40" />
                    <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] italic font-mono">STREAMING_ENGINE_ACTIVE</span>
                  </div>
                  <h1 className="text-8xl font-black text-white tracking-tighter uppercase italic leading-none glint-elite chromatic-elite">
                    МОНІТОРИНГ <span className="text-rose-500">ПОДІЙ</span>
                  </h1>
                  <p className="text-[13px] text-white/40 font-black uppercase tracking-[0.6em] italic leading-none border-l-4 border-rose-900/50 pl-8">
                    П ЯМИЙ_ЕФІ _ТРАНЗАКЦІЙ_ТА_ОНОВЛЕНЬ_ГЛОБАЛЬНИХ_РЕЄСТРІВ_L7
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
                    "px-14 py-7 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] italic transition-all duration-700 flex items-center gap-5 shadow-4xl group border-2",
                    isPaused 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-500/20" 
                      : "bg-amber-600 hover:bg-amber-500 text-white border-amber-400/50 shadow-amber-500/20"
                  )}
                >
                  {isPaused ? <><Play size={24} className="group-hover:scale-125 transition-transform duration-700" /> ВІДНОВИТИ_ПОТІК</> : <><Pause size={24} className="group-hover:scale-125 transition-transform duration-700" /> ПРИЗУПИНИТИ_ПОТІК</>}
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-12 gap-16">
            
            {/* FILTERS SIDEBAR */}
            <div className="col-span-12 xl:col-span-3 space-y-12">
               <div className="relative p-12 rounded-[4rem] glass-wraith border-2 border-white/5 shadow-4xl space-y-12 overflow-hidden group hover:border-rose-500/20 transition-all duration-1000">
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                  <div className="flex items-center gap-8 border-b-2 border-white/5 pb-10">
                     <div className="p-4 bg-rose-600/10 rounded-2xl border-2 border-rose-500/20 shadow-2xl">
                        <Filter size={28} className="text-rose-500 glint-elite" />
                     </div>
                     <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase glint-elite">ФІЛЬТ АЦІЯ_ПОТОКУ</h3>
                  </div>

                  <div className="space-y-10 relative z-10">
                     <div className="space-y-5">
                        <label className="text-[11px] font-black text-white/20 uppercase italic tracking-[0.4em] ml-4">ТИП_ПОДІЇ_L7</label>
                        <select
                          value={filter.type}
                          onChange={(e) => setFilter({ ...filter, type: e.target.value as any })}
                          className="w-full bg-white/[0.03] border-2 border-white/5 p-6 rounded-[2rem] text-[12px] font-black text-white/80 italic tracking-widest outline-none focus:border-rose-500/40 transition-all duration-700 cursor-pointer shadow-inner hover:bg-white/[0.06]"
                        >
                          <option value="all">УСІ_ТИПИ_ПОДІЙ</option>
                          <option value="created">СТВО ЕННЯ_СУБ'ЄКТА</option>
                          <option value="updated">ОНОВЛЕННЯ_ДАТА_СЕТУ</option>
                          <option value="deleted">ВИДАЛЕННЯ_ПЕ ИМЕТ У</option>
                          <option value="status_changed">ЗМІНА_СТАТУСУ_SLA</option>
                        </select>
                     </div>

                     <div className="space-y-5">
                        <label className="text-[11px] font-black text-white/20 uppercase italic tracking-[0.4em] ml-4">РІВЕНЬ_ВАЖЛИВОСТІ</label>
                        <select
                          value={filter.severity}
                          onChange={(e) => setFilter({ ...filter, severity: e.target.value as any })}
                          className="w-full bg-white/[0.03] border-2 border-white/5 p-6 rounded-[2rem] text-[12px] font-black text-white/80 italic tracking-widest outline-none focus:border-rose-500/40 transition-all duration-700 cursor-pointer shadow-inner hover:bg-white/[0.06]"
                        >
                          <option value="all">УСІ_ ІВНІ_ВАЖЛИВОСТІ</option>
                          <option value="info">ІНФОРМАЦІЯ // ЗВИЧАЙНИЙ</option>
                          <option value="warning">ПОПЕ ЕДЖЕННЯ // УВАГА</option>
                          <option value="critical">КРИТИЧНО // ЗАГРОЗА</option>
                        </select>
                     </div>
                  </div>

                  <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full group-hover:bg-rose-500/15 transition-all duration-1000" />
               </div>

               <div className="p-12 rounded-[4rem] glass-wraith border-2 border-rose-600/10 space-y-10 relative overflow-hidden group hover:border-rose-500/40 transition-all duration-1000">
                  <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
                  <div className="flex items-center gap-8">
                     <div className={cn(
                       "w-4 h-4 rounded-full shadow-[0_0_20px_currentColor] transition-all duration-1000", 
                       isConnected ? "bg-emerald-500 animate-pulse shadow-emerald-500/60" : "bg-rose-500 shadow-rose-500/60"
                     )} />
                     <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em] italic group-hover:text-white transition-colors duration-700">
                        {isConnected ? 'NODE_CONNECTION_ACTIVE_L7' : 'NODE_LINK_LOST_RECONNECTING'}
                     </p>
                  </div>
                  <p className="text-[11px] font-black text-white/20 uppercase leading-relaxed italic relative z-10 tracking-widest">
                     СУВЕРЕННИЙ ШЛЮЗ АВТОМАТИЧНО ПІДКЛЮЧАЄТЬСЯ ДО KAFKA-СТ ІМУ ЧЕ ЕЗ WEBSOCKET_v61. ЦИКЛ ПЕ ЕПІДКЛЮЧЕННЯ: 3 СЕКУНДИ. ШИФ : CHACHA20.
                  </p>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-16 -bottom-16 opacity-5 group-hover:opacity-20 transition-all duration-1000"
                  >
                    <RefreshCw size={180} className="text-rose-500" />
                  </motion.div>
               </div>
            </div>

            {/* EVENT FEED */}
            <div className="col-span-12 xl:col-span-9 space-y-12">
               <div className="flex items-center justify-between px-12">
                  <h4 className="text-[14px] font-black text-white/30 uppercase tracking-[0.6em] italic flex items-center gap-8">
                     <Terminal size={24} className="text-rose-600 glint-elite" /> ТЕРМІНАЛ_АКТИВНОСТІ_ЯД А_OODA
                  </h4>
                  <div className="flex items-center gap-8">
                     <div className="px-6 py-2 bg-white/5 rounded-2xl text-[11px] font-black text-white/20 italic tracking-[0.3em] border border-white/5 shadow-inner">
                        ОСТАННІЙ_ПАКЕТ_UTC: {new Date().toLocaleTimeString('uk-UA')}
                     </div>
                  </div>
               </div>

               <div className="space-y-10 max-h-[1200px] overflow-y-auto custom-scrollbar pr-6 pb-20">
                  <AnimatePresence mode="popLayout">
                    {filteredEvents.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                        className="p-40 text-center border-4 border-dashed border-white/5 rounded-[5rem] glass-wraith flex flex-col items-center justify-center gap-12"
                      >
                         <div className="relative">
                            <div className="absolute inset-0 bg-rose-500/10 blur-[100px] rounded-full scale-150 animate-pulse" />
                            <Orbit size={120} className="relative mx-auto text-white/10 animate-spin-slow" style={{ animationDuration: '40s' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                               <Activity size={48} className="text-rose-600/40 animate-pulse" />
                            </div>
                         </div>
                         <div className="space-y-6">
                            <p className="text-2xl font-black text-white/20 uppercase tracking-[0.6em] italic glint-elite">НЕМАЄ ПОДІЙ В ПОТОЦІ</p>
                            <p className="text-[11px] font-black text-white/10 mt-6 tracking-[0.4em] uppercase italic">ОЧІКУВАННЯ ПАКЕТІВ ДАНИХ ВІД ГЛОБАЛЬНОЇ ШИНИ ПОДІЙ_L7...</p>
                         </div>
                      </motion.div>
                    ) : (
                      filteredEvents.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          layout
                          initial={{ opacity: 0, x: -60, filter: 'blur(10px)' }}
                          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)', transition: { duration: 0.3 } }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className={cn(
                            "group relative p-12 glass-wraith border-2 rounded-[4.5rem] transition-all duration-700 overflow-hidden shadow-4xl hover:-translate-y-2",
                            event.severity === 'critical' ? "border-rose-950/60 hover:border-rose-600/60 shadow-rose-950/20" : 
                            event.severity === 'warning' ? "border-amber-950/60 hover:border-amber-600/60 shadow-amber-950/20" : 
                            "border-white/5 hover:border-rose-500/30"
                          )}
                        >
                           <div className="absolute inset-0 bg-cyber-grid opacity-[0.01] pointer-events-none" />
                           <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.1] transition-all transform rotate-12 group-hover:rotate-0 duration-1000">
                              {React.cloneElement(getEventIcon(event.type) as React.ReactElement, { size: 160 })}
                           </div>
                           
                           {/* Decorative ID mark */}
                           <div className="absolute top-10 left-16 text-[9px] font-black font-mono text-white/10 tracking-[0.6em] uppercase italic">
                             EVENT_HEX_NODE_{event.id.slice(-12).toUpperCase()}
                           </div>

                           <div className="flex items-center justify-between gap-16 relative z-10 mt-6">
                              <div className="flex items-center gap-14">
                                 <div className={cn(
                                   "w-24 h-24 rounded-[2.5rem] border-2 flex items-center justify-center text-5xl shadow-4xl transform transition-all duration-1000 group-hover:rotate-6 group-hover:scale-110",
                                   event.severity === 'critical' ? "bg-rose-600/10 border-rose-500 text-rose-500 shadow-rose-500/30" : 
                                   event.severity === 'warning' ? "bg-amber-600/10 border-amber-500 text-amber-500 shadow-amber-500/30" : 
                                   "bg-white/[0.03] border-white/10 text-white/30"
                                 )}>
                                    {getEventIcon(event.type)}
                                 </div>
                                 <div className="space-y-5">
                                    <div className="flex items-center gap-8">
                                       <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none glint-elite group-hover:text-rose-500 transition-colors duration-700">{event.company.name}</h3>
                                       <span className="px-6 py-2 bg-white/5 border-2 border-white/10 rounded-2xl text-[12px] font-black text-white/40 italic uppercase tracking-widest shadow-inner group-hover:border-rose-500/20 transition-all">{event.company.ueid}</span>
                                    </div>
                                    <div className="flex items-center gap-10 text-[12px] font-black text-white/20 uppercase italic tracking-[0.3em]">
                                       <div className="flex items-center gap-4 group-hover:text-rose-500/60 transition-colors"><MapPin size={18} className="text-rose-600" /> {event.company.region}</div>
                                       <div className="w-2 h-2 rounded-full bg-white/5 shadow-inner" />
                                       <div className="flex items-center gap-4 group-hover:text-rose-500/60 transition-colors"><Clock size={18} className="text-rose-600" /> {new Date(event.timestamp).toLocaleTimeString('uk-UA')}</div>
                                       <div className="w-2 h-2 rounded-full bg-white/5 shadow-inner" />
                                       <div className="flex items-center gap-4 text-emerald-500/40"><Globe size={18} className="text-emerald-500" /> SSOT_ВЕ ИФІКОВАНО</div>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex flex-col items-end gap-5 text-right">
                                 <div className={cn(
                                   "px-10 py-3 rounded-full text-[12px] font-black uppercase tracking-[0.5em] italic border-2 transition-all duration-700 shadow-4xl glint-elite",
                                   event.severity === 'critical' ? "bg-rose-600/10 border-rose-600/50 text-rose-500 shadow-rose-500/30" : 
                                   event.severity === 'warning' ? "bg-amber-600/10 border-amber-600/50 text-amber-500 shadow-amber-500/30" : 
                                   "bg-emerald-600/10 border-emerald-600/50 text-emerald-500 shadow-emerald-500/30"
                                 )}>
                                    {event.severity === 'critical' ? 'КРИТИЧНО' : event.severity === 'warning' ? 'УВАГА_РИЗИК' : 'ІНФОРМАЦІЯ_L7'}
                                 </div>
                                 <div className="text-[11px] font-black text-white/10 uppercase italic tracking-widest font-mono group-hover:text-rose-500/40 transition-colors duration-700">OSINT_TRACE_ID: {event.id.slice(0, 16).toUpperCase()}</div>
                              </div>
                           </div>

                           {event.changes && Object.keys(event.changes).length > 0 && (
                             <div className="mt-14 pt-14 border-t-2 border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
                                {Object.entries(event.changes).map(([key, value]) => (
                                  <div key={key} className="p-8 rounded-[2.5rem] bg-white/[0.02] border-2 border-white/5 space-y-3 group/field hover:bg-rose-500/5 hover:border-rose-500/20 transition-all duration-700 shadow-inner">
                                     <p className="text-[10px] font-black text-white/20 uppercase italic tracking-[0.4em] group-hover/field:text-rose-500/60 transition-colors duration-700">{key.toUpperCase()}</p>
                                     <p className="text-lg font-black text-white italic truncate tracking-tight glint-elite group-hover/field:text-rose-500 transition-colors">{String(value)}</p>
                                  </div>
                                ))}
                             </div>
                           )}

                           {/* Interactive Indicator */}
                           <div className="absolute bottom-6 right-16 flex gap-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-10 group-hover:translate-x-0">
                              <button className="flex items-center gap-3 text-[10px] font-black text-rose-500 uppercase tracking-widest italic hover:text-white transition-colors">
                                <Eye size={18} /> ПЕ ЕГЛЯНУТИ_СУТНІСТЬ
                              </button>
                              <button className="flex items-center gap-3 text-[10px] font-black text-rose-500 uppercase tracking-widest italic hover:text-white transition-colors">
                                <Target size={18} /> ВІДСТЕЖИТИ_В_ГРАФІ
                              </button>
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
            .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
            .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.3); }
            .chromatic-elite { text-shadow: 1px 0 0 rgba(255,0,0,0.2), -1px 0 0 rgba(0,255,0,0.2); }
            .animate-spin-slow { animation: spin 20s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225,29,72,0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225,29,72,0.3); }
        `}} />
      </div>
    </PageTransition>
  );
};

export default RealTimeMonitor;
