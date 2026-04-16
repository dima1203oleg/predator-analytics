import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Database, Zap, Activity,
  GitBranch, Eye, ShieldCheck, Cpu,
  Server, Globe, Terminal, Sparkles, ExternalLink, BarChart3, Mic, Volume2,
  Shield, Radar, ZapOff, Fingerprint, Lock, Layers, TrendingUp
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import EvolutionForge from './EvolutionForge';
import { AutonomousLearningStack } from './AutonomousLearningStack';
import GlobalNeuralMesh from './GlobalNeuralMesh';
import { systemApi } from '../../services/api/system';
import { aiApi, AIThought } from '../../services/api/ai';
import { useQuery } from '@tanstack/react-query';
import { useBackendStatus } from '../../hooks/useBackendStatus';

/**
 * 🛡️ SOVEREIGN AZR BRAIN // СУВЕРЕННИЙ МОЗОК AZR | v56.5-ELITE
 * -------------------------------------------------------------
 * Central Intelligence Nexus — Вершина OSINT-архітектури України.
 * Керує автономним навчанням, загоєнням та стратегічним висновком.
 */

const SECTOR_DATA = [
  { name: 'Customs Intelligence', value: 35, color: '#D4AF37' },
  { name: 'Financial Sigint', value: 25, color: '#E11D48' },
  { name: 'Geopolitical Radar', value: 20, color: '#FCD34D' },
  { name: 'Autonomous Forge', value: 20, color: '#10B981' },
];

const SovereignAZRBrain: React.FC = () => {
  const [cycle, setCycle] = useState(148);
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState("Нейроінтерфейс активовано");
  
  const { isOffline, activeFailover, sourceLabel, nodes } = useBackendStatus();
  
  const { data: stats } = useQuery({
    queryKey: ['system', 'stats'],
    queryFn: systemApi.getStats,
    refetchInterval: 3000
  });

  const { data: diagnostics } = useQuery({
    queryKey: ['system', 'diagnostics'],
    queryFn: systemApi.runDiagnostics,
    refetchInterval: 10000
  });

  const { data: thoughts } = useQuery({
    queryKey: ['ai', 'thoughts'],
    queryFn: () => aiApi.getThoughts(10),
    refetchInterval: 5000
  });

  const cpuLoad = stats?.cpu_percent || 0;
  
  const combinedLogs = useMemo(() => {
    const now = new Date();
    const timeStr = (offset: number) => {
      const d = new Date(now.getTime() - offset * 1000);
      return d.toLocaleTimeString('uk-UA');
    };

    const base = [
      { id: 'v56-log-1', time: timeStr(2), type: 'INFO', msg: `ПОТОЧНИЙ ВУЗОЛ_ID: ${sourceLabel.toUpperCase()}` },
      { id: 'v56-log-2', time: timeStr(1), type: isOffline ? 'THREAT' : 'HEAL', msg: isOffline ? 'ЗВ\'ЄДОК З NVIDIA_SERVER: ПЕРЕРВАНО [!] EMERGENCY_AUTONOMY' : 'ЗВ\'ЄДОК З NVIDIA_SERVER: ВСТАНОВЛЕНО [OK]' },
      { id: 'v56-log-3', time: timeStr(0), type: 'INFO', msg: activeFailover ? 'FAILOVER_STRATEGY: GOOGLE COLAB MIRROR ACTIVE' : 'FAILOVER_STRATEGY: STANDBY_MODE' },
    ];

    if (thoughts) {
      const aiLogs = thoughts.map((t: AIThought) => ({
        id: t.id,
        time: t.timestamp.split('T')[1].split('.')[0],
        type: t.stage === 'action' ? 'HEAL' : t.stage === 'observation' ? 'INFO' : 'INFO',
        msg: `[AI_THOUGHT // ${t.stage.toUpperCase()}]: ${t.content}`
      }));
      return [...base, ...aiLogs].sort((a,b) => b.time.localeCompare(a.time)).slice(0, 20);
    }

    return base.reverse();
  }, [isOffline, activeFailover, sourceLabel, thoughts]);

  useEffect(() => {
    if (isListening) {
      setVoiceHint("Нейроінтерфейс: СЛУХАЮ_ЗАПИТ...");
      const timer = setTimeout(() => {
        setVoiceHint("АНАЛІЗУЮ_АКУСТИЧНИЙ_ПАТЕРН...");
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVoiceHint("Нейроінтерфейс: ГОТОВИЙ_ДО_ВВОДУ");
    }
  }, [isListening]);

  return (
    <div className="min-h-screen bg-black text-slate-200 p-8 font-sans selection:bg-yellow-500/30">
      <div className="max-w-[1800px] mx-auto space-y-12">
        
        {/* --- ELITE TOP HEADER --- */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 border-b border-yellow-500/10 pb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 blur-[120px] pointer-events-none" />
          
          <div className="space-y-4 relative">
            <motion.div 
               initial={{ x: -30, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               className="flex items-center gap-6"
            >
              <div className="p-5 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-[28px] shadow-[0_0_50px_rgba(212,175,55,0.3)] border border-white/20">
                <Cpu className="text-black" size={36} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                  SOVEREIGN <span className="text-yellow-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">AZR BRAIN</span>
                  <span className="text-[11px] bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 px-4 py-1.5 rounded-full not-italic tracking-[0.4em] font-black uppercase shadow-inner">v56.5-ELITE</span>
                </h1>
                <p className="text-sm text-slate-400 font-black uppercase tracking-[0.5em] flex items-center gap-3 mt-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  ГОЛОВНИЙ ОПЕРАТИВНИЙ НЕЙРОННИЙ ВУЗОЛ
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-4 relative">
            {isOffline && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="px-8 py-5 bg-amber-500/10 border border-amber-500/40 rounded-[24px] backdrop-blur-3xl shadow-[0_0_30px_rgba(245,158,11,0.2)] flex flex-col justify-center"
              >
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                  <ZapOff size={12} /> СУВЕРЕННИЙ АВТОНОМНИЙ РЕЖИМ
                </span>
                <div className="text-xl font-black text-white italic">EMERGENCY_LOCAL</div>
              </motion.div>
            )}
            <div className="px-8 py-5 bg-yellow-500/5 border border-yellow-500/20 rounded-[24px] backdrop-blur-3xl shadow-2xl flex flex-col justify-center group/autonomy">
              <span className="text-[10px] text-yellow-600 font-black uppercase tracking-widest mb-1 group-hover/autonomy:text-yellow-400 transition-colors">СИСТЕМНА АВТОНОМНІСТЬ</span>
              <div className="text-3xl font-black text-white italic tabular-nums">{isOffline ? '100.00%' : '99.98%'}</div>
            </div>
            <div className="px-8 py-5 bg-rose-500/5 border border-rose-500/20 rounded-[24px] backdrop-blur-3xl shadow-2xl flex flex-col justify-center group/intel">
              <span className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-1 group-hover/intel:text-rose-400 transition-colors">РІВЕНЬ ІНТЕЛЕКТУ</span>
              <div className="text-3xl font-black text-white italic">ORACLE_T1</div>
            </div>
            <div className={`px-8 py-5 bg-emerald-500/5 border ${isOffline ? 'border-amber-500/20' : 'border-emerald-500/20'} rounded-[24px] backdrop-blur-3xl shadow-2xl flex flex-col justify-center group/cluster`}>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 group-hover/cluster:text-white transition-colors">СТАТУС КЛАСТЕРА</span>
              <div className={`text-3xl font-black ${isOffline ? 'text-amber-500' : 'text-emerald-500'} italic flex items-center gap-3`}>
                 {isOffline ? 'OFFLINE' : 'ONLINE'} <div className={`w-3 h-3 ${isOffline ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'} rounded-full animate-pulse`} />
              </div>
            </div>
          </div>
        </header>

        {/* --- MAIN DASHBOARD GRID --- */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT: CORE COMPUTE & HEALTH */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            
            {/* Sector Health Radar */}
            <div className="p-8 bg-slate-950/60 backdrop-blur-3xl border border-yellow-500/10 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px]" />
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Radar className="text-yellow-500" size={24} />
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] font-mono italic underline decoration-yellow-500/20 underline-offset-8">МОНІТОРИНГ СЕКТОРІВ</h3>
                </div>
                <Layers className="text-slate-800" size={20} />
              </div>

              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SECTOR_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {SECTOR_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px', fontSize: '10px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 text-[10px] font-black uppercase tracking-widest leading-loose">
                {SECTOR_DATA.map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-400">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sovereign Auto-Heal (v56.5) */}
            <div className="p-8 bg-slate-950/60 backdrop-blur-3xl border border-rose-500/10 rounded-[40px] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
               <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-rose-500" size={24} />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] font-mono italic">ЖУРНАЛ СУВЕРЕННОГО ПОТОКУ [ELITE]</h3>
                  </div>
                  <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    NEURAL_STREAM
                  </div>
               </div>
               
               <div className="space-y-3 h-[320px] overflow-y-auto pr-2 custom-scrollbar font-mono text-[11px]">
                  <AnimatePresence mode='popLayout'>
                    {combinedLogs.map((log, i) => (
                      <motion.div 
                        key={log.id}
                        layout
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-2xl border flex items-start gap-4 hover:translate-x-1 transition-transform group/log ${
                          log.type === 'HEAL' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          log.type === 'THREAT' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                          'bg-yellow-500/5 border-yellow-500/10 text-yellow-200'
                        }`}
                      >
                        <span className="opacity-40 font-black shrink-0 text-[10px]">[{log.time}]</span>
                        <div className="flex-1">
                          <span className="font-bold group-hover/log:text-white transition-colors block">{log.msg}</span>
                          {log.id.startsWith('th-') && (
                            <div className="mt-1 text-[9px] opacity-60 flex items-center gap-1 font-black uppercase">
                              <Sparkles size={8} /> INTEGRATED_THOUGHT
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
               </div>
            </div>

          </div>

          {/* MIDDLE: GLOBAL NEURAL MESH & AI BRAIN FOCUS */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <div className="h-[650px] bg-slate-950/40 backdrop-blur-3xl border border-yellow-500/5 rounded-[48px] shadow-2xl relative overflow-hidden p-8 flex flex-col">
               <div className="flex items-center justify-between mb-8 relative z-20">
                  <div className="flex items-center gap-3 px-6 py-3 bg-black/60 border border-yellow-500/20 rounded-2xl backdrop-blur-xl">
                    <Globe className="text-yellow-500 animate-spin-slow" size={20} />
                    <div>
                      <span className="text-sm font-black text-white uppercase tracking-[0.4em]">H100 SOVEREIGN_ELITE 2026</span>
                      <div className="text-[9px] text-yellow-600/80 font-black uppercase">Active Nodes: 12,472 UA_SECURE</div>
                    </div>
                  </div>
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-slate-900 flex items-center justify-center overflow-hidden shadow-xl">
                        <div className={`w-full h-full bg-gradient-to-br ${i % 2 === 0 ? 'from-yellow-500 to-rose-600' : 'from-indigo-500 to-teal-400'} opacity-40 animate-pulse`} />
                      </div>
                    ))}
                  </div>
               </div>

               <div className="flex-1 rounded-[32px] overflow-hidden bg-black/40 border border-white/5 relative group cursor-crosshair">
                  <GlobalNeuralMesh />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                  
                  {/* Holographic Overlays */}
                  <div className="absolute top-10 right-10 text-right opacity-40 pointer-events-none font-mono group-hover:opacity-100 transition-opacity">
                      <div className="text-[10px] text-yellow-500 font-black">LATENCY: 12ms</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">SEC: QUANTUM_V56</div>
                  </div>
               </div>

               {/* Neural Listening Interface */}
               <div className="mt-8 bg-black/60 border border-yellow-500/20 rounded-3xl p-6 flex items-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsListening(!isListening)}
                    className={`relative w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-yellow-500 text-black shadow-[0_0_50px_#d4af37]' : 'bg-slate-900 text-yellow-500 border border-yellow-500/30 hover:border-yellow-500'}`}
                  >
                    <Mic size={28} className={isListening ? 'animate-bounce' : ''} />
                    {isListening && <motion.div animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="absolute inset-0 bg-yellow-500 rounded-3xl" />}
                  </motion.button>
                  <div className="flex-1">
                    <div className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.3em] mb-1">{isListening ? 'СЛУХАЮ...' : 'НЕЙРОІНТЕРФЕЙС ГОТОВИЙ'}</div>
                    <div className="text-sm font-black text-white italic tracking-tight">{voiceHint}</div>
                    {isListening && (
                      <div className="flex gap-1.5 h-6 items-end mt-2">
                        {[1, 2, 4, 3, 5, 2, 4, 1, 3, 4, 2].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [`${h * 20}%`, `${h * 40}%`, `${h * 20}%`] }}
                            transition={{ repeat: Infinity, duration: 0.5 + Math.random(), delay: i * 0.05 }}
                            className="w-1.5 bg-yellow-400 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <Volume2 className="text-slate-800" size={24} />
               </div>
            </div>
          </div>

          {/* RIGHT: EVOLUTION & LEARNING */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <EvolutionForge status={stats} />
            <AutonomousLearningStack />
            
            {/* Elite Info Card */}
            <div className="p-8 bg-gradient-to-br from-yellow-900/10 to-rose-950/10 border border-yellow-500/20 rounded-[40px] shadow-2xl relative overflow-hidden">
               <Fingerprint className="absolute -bottom-4 -right-4 text-yellow-500 opacity-10" size={100} />
               <h4 className="text-[10px] font-black text-yellow-500 tracking-[0.4em] uppercase mb-4">СЕРТИФІКАТ СУВЕРЕНІТЕТУ</h4>
               <p className="text-[11px] text-slate-300 font-bold italic leading-relaxed opacity-70">
                 Платформа PREDATOR Analytics v56.5-ELITE є інтелектуальною власністю суверенної держави. Будь-яка спроба декомпіляції карається згідно з протоколом THREAT-X.
               </p>
               <div className="mt-6 flex justify-between items-center text-[10px] font-black font-mono">
                  <span className="text-yellow-600">ID: SOV-99-AX</span>
                  <span className="text-slate-100 flex items-center gap-1"><Lock size={10} /> ENCRYPTED</span>
               </div>
            </div>
          </div>

        </div>

      </div>

      {/* Background Neural Pulse */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]">
        <div className="absolute inset-0 bg-repeat bg-center" style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
};

export default SovereignAZRBrain;
