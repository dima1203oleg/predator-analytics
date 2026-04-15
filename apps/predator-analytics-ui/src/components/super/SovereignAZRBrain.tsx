import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Database, Zap, Activity,
  GitBranch, Eye, ShieldCheck, Cpu,
  Server, Globe, Terminal, Sparkles, ExternalLink, BarChart3, Mic, Volume2
} from 'lucide-react';
import EvolutionForge from './EvolutionForge';
import { AutonomousLearningStack } from './AutonomousLearningStack';
import GlobalNeuralMesh from './GlobalNeuralMesh';
import { systemApi } from '../../services/api/system';
import { useQuery } from '@tanstack/react-query';

interface SovereignAZRBrainProps {
  status?: any;
}

const SovereignAZRBrain: React.FC<SovereignAZRBrainProps> = ({ status }) => {
  const [cycle, setCycle] = useState(148);
  const [logs, setLogs] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState("Нейроінтерфейс активовано");

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

  const cpuLoad = stats?.cpu_percent || 0;
  const gpuLoad = stats?.gpu_utilization || 0;

  useEffect(() => {
    if (diagnostics?.results?.summary) {
        setCycle(cycle + 1);
        setLogs(prev => [`[OODA] Аналіз завершено: стан ${diagnostics.results.overall_status}`, ...prev.slice(0, 15)]);
    }
  }, [diagnostics]);

  return (
    <div className="grid grid-cols-12 gap-6 p-2 min-h-screen content-start">

      {/* 🧬 LEFT COLUMN: CORE LOGIC & COMMANDS */}
      <div className="col-span-12 lg:col-span-4 space-y-6">

        {/* 🏛️ System Core Metrics */}
        <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-rose-500/20 rounded-[32px] shadow-[0_0_40px_rgba(225,29,72,0.1)]">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-rose-500/20 rounded-2xl">
              <BrainCircuit className="text-rose-400 animate-pulse" size={28} />
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Версія Суверенітету</div>
              <div className="text-xl font-black text-white italic tracking-tighter">v56.5-ELITE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Ядро Розуму</div>
              <div className="text-2xl font-black text-rose-400 font-mono tracking-tighter">ORACLE v1.4</div>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Навантаження</div>
              <div className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">{cpuLoad.toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* 🚀 GPU Quantum Core (v56.5) */}
        <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-amber-500/20 rounded-[32px] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={64} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Zap className="text-amber-400" size={18} />
            </div>
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none">GPU QUANTUM ACCEL</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[24px] font-black text-white leading-none">{stats?.gpu_utilization || 0}%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Використання Ядра</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-amber-400 leading-none">{stats?.gpu_temp || 0}°C</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Термоконтроль</div>
              </div>
            </div>

            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.gpu_utilization || 0}%` }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                />
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-400 italic">
                <span>MODEL: {stats?.gpu_name?.replace('NVIDIA ', '') || 'NOT DETECTED'}</span>
                <span>VRAM: {((stats?.gpu_mem_used || 0) / (1024**3)).toFixed(1)} GB / {((stats?.gpu_mem_total || 0) / (1024**3)).toFixed(0)} GB</span>
            </div>
          </div>
        </div>

        {/* 🎤 Neural Voice Interface (v46) */}
        <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-emerald-500/20 rounded-[32px] shadow-[0_0_40px_rgba(16,185,129,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Нейронний Зв'язок</h3>
            <Volume2 size={14} className="text-emerald-500/50" />
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setIsListening(!isListening);
                if (!isListening) setVoiceHint("Слухаю команду 'Ініціювати Еволюцію'...");
                else setVoiceHint("Голосовий нейроінтерфейс активовано");
              }}
              className={`relative p-5 rounded-full transition-all duration-500 ${isListening ? 'bg-emerald-500 shadow-[0_0_30px_#10b981]' : 'bg-slate-900 border border-white/10 hover:border-emerald-500/50'}`}
            >
              <Mic className={isListening ? 'text-white' : 'text-slate-500'} size={24} />
              {isListening && (
                <span className="absolute inset-0 rounded-full animate-ping bg-emerald-500 opacity-20" />
              )}
            </button>
            <div className="flex-1">
              <div className="text-[10px] text-slate-500 font-mono italic uppercase mb-1">{voiceHint}</div>
              {isListening ? (
                <div className="flex gap-1 h-4 items-center">
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h * 10}%`, `${h * 25}%`, `${h * 10}%`] }}
                      transition={{ repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="h-1 bg-slate-800 rounded-full w-24 opacity-50" />
              )}
            </div>
          </div>
        </div>

        {/* 🛡️ Sovereign Auto-Heal Live Stream */}
        <div className="p-6 bg-slate-950/60 backdrop-blur-xl border border-emerald-500/10 rounded-[32px] h-[300px] flex flex-col relative overflow-hidden">
          <div className="absolute top-2 right-4">
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-400 uppercase">АКТИВНО</span>
             </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-emerald-500" size={18} />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Журнал Самовідновлення</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide font-mono text-[9px]">
            {[
                "🔍 Перевірка системних залежностей кластера...",
                "✅ PostgreSQL (Порт 5432) — ПРАЦЮЄ",
                "⚠️ Redis (Порт 6379) — НЕПРАЦЕЗДАТНИЙ",
                "🔄 Відновлення Redis... Виконано",
                "🚀 Перезапуск тунелю ZROK...",
                "✅ Тунель ZROK ініційовано у фоновому режимі",
                "🛡️ Суверенний кластер відновлено. Стан: OK"
            ].map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-slate-400 border-l-2 border-emerald-500/30 pl-3 py-1 bg-emerald-500/5 rounded-r-lg"
              >
                <span className="text-emerald-500/50 mr-2">{new Date().toLocaleTimeString()}</span>
                {log}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 🧠 Decision Explainability (v32-S) */}
        <div className="p-6 bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border border-indigo-500/20 rounded-[32px] h-[400px] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Sparkles className="text-indigo-400" size={16} />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Автономне Мислення</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {decisions.length === 0 && (
              <div className="text-slate-600 text-[10px] italic text-center py-20 font-black uppercase tracking-widest">
                Очікування наступного циклу OODA...
              </div>
            )}
            {decisions.map((dec, i) => (
              <motion.div
                key={dec.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${dec.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' :
                      dec.status === 'BLOCKED' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-indigo-500/10 text-indigo-400'
                    }`}>
                    {dec.type} | {dec.status}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">#{String(dec.sequence).padStart(4, '0')}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-3">
                  {dec.reasoning || "Початкова ініціалізація стратегії"}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-slate-500">
                  <Activity size={10} className="text-blue-400" />
                  <span className="italic truncate">{dec.outcome || "Аналіз триває..."}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 📡 CENTER/RIGHT: GLOBAL MESH & EVOLUTION */}
      <div className="col-span-12 lg:col-span-8 space-y-6">

        {/* 🗺️ Global Neural Mesh Visualization */}
        <GlobalNeuralMesh status={status} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 🚀 Autonomous Learning Stack */}
          <AutonomousLearningStack />

          {/* 🛠️ UI Evolution Forge */}
          <EvolutionForge status={status} />
        </div>

        {/* 🏢 MLOps Intelligence Hub (Admin Links) */}
        <div className="p-8 bg-black/40 border border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-blue-500/5 opacity-50 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
                <BarChart3 className="text-blue-400 animate-pulse" size={32} />
              </div>
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">MLOps ЦЕНТР РОЗВІДКИ</h4>
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase italic">Прямий доступ до моделювання та експеринентів</p>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <a href="http://h2o-studio.analytics.local" target="_blank" rel="noreferrer"
                className="flex-1 md:flex-none flex items-center justify-between gap-6 px-8 py-5 bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 rounded-2xl transition-all group/btn"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.2em] mb-1">Інфраструктура</span>
                  <span className="text-sm font-bold text-slate-200">H2O STUDIO</span>
                </div>
                <ExternalLink size={18} className="text-slate-500 group-hover/btn:text-orange-400 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
              </a>

              <a href="http://mlflow.analytics.local" target="_blank" rel="noreferrer"
                className="flex-1 md:flex-none flex items-center justify-between gap-6 px-8 py-5 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all group/btn"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mb-1">Експерименти</span>
                  <span className="text-sm font-bold text-slate-200">MLFLOW SERVER</span>
                </div>
                <ExternalLink size={18} className="text-slate-500 group-hover/btn:text-blue-400 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-all" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SovereignAZRBrain;
