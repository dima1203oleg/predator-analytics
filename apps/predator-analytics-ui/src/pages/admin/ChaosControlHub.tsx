import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Flame, 
  Wind, 
  ExternalLink,
  ZapOff,
  Clock,
  Skull,
  ShieldCheck,
  Power,
  Zap,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useAdminApi';
import { cn } from '@/lib/utils';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';

interface Experiment {
  active: boolean;
  ttl_left: string;
}

/**
 * ⚡️ CHAOS CONTROL HUB // ЦЕНТР КЕРУВАННЯ ХАОСОМ | v58.2-WRAITH
 * PREDATOR Analytics — System Resilience Injection
 */
const ChaosControlHub: React.FC = () => {
  const [experiments, setExperiments] = useState<Record<string, Experiment>>({});
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/chaos/status');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setExperiments(data);
    } catch (err) {
      // Fallback or silent fail
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleExperiment = async (name: string, active: boolean) => {
    setLoading(true);
    try {
      await fetch('http://localhost:8000/api/v1/admin/chaos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experiment_name: name, active })
      });
      await fetchStatus();
    } catch (err) {
      console.error("Failed to toggle experiment");
    } finally {
      setLoading(false);
    }
  };

  const experimentConfigs = [
    { id: 'db_latency', name: 'Ін\'єкція затримки БД', desc: 'Додає випадкову затримку 2-5с до SQL запитів', icon: <Clock /> },
    { id: 'cache_failure', name: 'Обхід кешу Redis', desc: 'Ігнорує кеш та змушує систему йти в DB', icon: <ZapOff /> },
    { id: 'random_errors', name: 'Випадкові помилки 500', desc: 'Вкидає помилки з імовірністю 20%', icon: <AlertTriangle /> },
    { id: 'llm_hallucination', name: 'Галюцинація ШІ', desc: 'Симулює некоректні відповіді LLM', icon: <Wind /> },
    { id: 'agent_timeout', name: 'Дрейф Агента', desc: 'Блокує виконання задач AGI-агентами', icon: <Skull /> },
  ];

  const { data: systemStatus } = useSystemStatus();
  const avgLatency = systemStatus?.services?.[0]?.latency_ms || 0;

  return (
    <div className="space-y-10 relative overflow-hidden p-8 rounded-[3rem] bg-[#050101] border-2 border-rose-950/30">
      <AdvancedBackground mode="sovereign" />
      <CyberGrid opacity={0.05} color="rgba(225, 29, 72, 0.1)" />
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-950/20 via-transparent to-transparent pointer-events-none" />
      <motion.div 
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.05),transparent_70%)] pointer-events-none"
      />

      {/* Header Section */}
      <header className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-black/60 backdrop-blur-3xl border-2 border-rose-500/20 rounded-[3rem] shadow-[0_0_100px_rgba(225,29,72,0.15)]">
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-rose-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
            <div className="relative p-6 bg-rose-600 rounded-[2rem] shadow-4xl transform -rotate-3 group-hover:rotate-0 transition-all duration-700">
              <Flame size={48} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className="px-4 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-[0.4em] italic rounded-lg">
                DANGER_ZONE // PROTOCOL_CHAOS
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
              ЦЕНТР <span className="text-rose-600 chromatic-elite">КЕРУВАННЯ ХАОСОМ</span>
            </h1>
            <p className="text-rose-400/40 font-mono text-[11px] tracking-[0.3em] uppercase mt-6 italic border-l-4 border-rose-900/50 pl-6 leading-relaxed max-w-xl">
              Керування цілеспрямованим деградуванням системи для верифікації механізмів відмовостійкості та самовідновлення.
            </p>
          </div>
        </div>
        <button 
          onClick={() => Object.keys(experiments).forEach(k => toggleExperiment(k, false))}
          className="group relative px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[12px] hover:bg-rose-700 transition-all flex items-center gap-4 italic shadow-[0_0_50px_rgba(225,29,72,0.4)]"
        >
          <Power size={22} className="group-hover:scale-110 transition-transform" /> 
          ЕКСТРЕНА_ЗУПИНКА
          <div className="absolute inset-0 rounded-[2rem] border-2 border-white/20 animate-pulse" />
        </button>
      </header>

      {/* Experiment Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {experimentConfigs.map((cfg, idx) => {
          const isActive = experiments[cfg.id]?.active;
          return (
            <motion.div 
              key={cfg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={cn(
                "group relative p-10 rounded-[3rem] border-2 transition-all duration-700 overflow-hidden",
                isActive 
                  ? 'bg-gradient-to-br from-rose-600/[0.15] to-transparent border-rose-500 shadow-[0_0_80px_rgba(225,29,72,0.2)]' 
                  : 'bg-black/60 border-white/5 hover:border-rose-500/30'
              )}
            >
              <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className={cn(
                  "p-5 rounded-[1.5rem] border shadow-2xl transition-all duration-500",
                  isActive ? "bg-rose-600 border-rose-400 text-white scale-110 rotate-3" : "bg-white/5 border-white/5 text-slate-500"
                )}>
                  {React.cloneElement(cfg.icon as React.ReactElement, { size: 32 })}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] italic",
                    isActive ? "text-rose-500 animate-pulse" : "text-slate-600"
                  )}>
                    {isActive ? 'АКТИВНО_X' : 'СТАНД_БАЙ'}
                  </span>
                  <button
                    onClick={() => toggleExperiment(cfg.id, !isActive)}
                    disabled={loading}
                    className={cn(
                      "w-16 h-8 rounded-full relative transition-all duration-500 border-2",
                      isActive ? "bg-rose-600 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)]" : "bg-white/10 border-white/5"
                    )}
                  >
                    <motion.div 
                      animate={{ x: isActive ? 34 : 6 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tighter relative z-10">{cfg.name}</h3>
              <p className="text-[11px] text-slate-500 font-bold mb-10 leading-relaxed uppercase italic tracking-widest relative z-10">{cfg.desc}</p>

              {isActive && (
                <div className="pt-6 border-t border-rose-500/20 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 text-rose-500">
                    <Clock size={14} className="animate-spin-slow" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">ЗАЛИШОК_TTL:</span>
                  </div>
                  <span className="text-lg font-black text-white italic font-mono tabular-nums">{experiments[cfg.id]?.ttl_left.split('.')[0]}</span>
                </div>
              )}
              
              {!isActive && (
                <div className="pt-6 border-t border-white/5 flex items-center justify-between opacity-30 relative z-10">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic text-center w-full">СИСТЕМА_В_БЕЗПЕЦІ</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Metrics & Analytics */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 p-12 rounded-[4rem] bg-black/60 border-2 border-white/5 backdrop-blur-3xl shadow-4xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={200} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-6 mb-10 border-l-4 border-emerald-500 pl-8">
            <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">МЕТРИКИ СТІЙКОСТІ</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2 italic">ВЕРИФІКАЦІЯ_ВІДМОВОСТІЙКОСТІ_SLA</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <MetricRow label="ЧАС_ВІДГУКУ_P95" value={`${avgLatency}ms`} target="< 2.0s" status={avgLatency < 2000 ? "success" : "danger"} icon={Activity} />
             <MetricRow label="РІВЕНЬ_ПОМИЛОК" value={systemStatus?.overall_status === 'optimal' ? '0.00%' : 'Н/Д'} target="< 1.0%" status={systemStatus?.overall_status === 'optimal' ? "success" : "warning"} icon={Zap} />
             <MetricRow label="СТАН_ЗАПОБІЖНИКА" value={systemStatus?.healthy ? "ЗАКРИТО" : "ВІДКРИТО"} target="HEALTHY" status={systemStatus?.healthy ? "success" : "danger"} icon={ShieldAlert} />
             <div className="p-8 bg-white/5 rounded-3xl border border-white/5 flex flex-col justify-center gap-2 italic">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">СТАТУС_КЛАСТЕРА</span>
               <span className="text-xl font-black text-white uppercase tracking-tighter italic">СТАБІЛЬНИЙ // ELITE</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 p-12 rounded-[4rem] bg-gradient-to-br from-rose-600/[0.1] to-transparent border-2 border-rose-500/20 flex flex-col items-center justify-center text-center shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="p-8 bg-rose-500/20 rounded-[2.5rem] border border-rose-500/30 text-rose-500 mb-8 shadow-3xl"
            >
              <ExternalLink size={48} />
            </motion.div>
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">ЗВІТ_ВІДПОВІДНОСТІ</h4>
            <p className="text-xs text-rose-300/40 font-bold uppercase tracking-[0.2em] mb-10 italic leading-relaxed max-w-xs">
              Автоматично згенерований звіт на основі останніх k6 стрес-тестів та ін'єкцій хаосу.
            </p>
            <button className="w-full py-6 bg-rose-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-rose-700 transition-all shadow-4xl italic">
              АНАЛІТИКА_SLA
            </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-4xl { box-shadow: 0 40px 100px -20px rgba(225,29,72,0.3); }
        .shadow-3xl { box-shadow: 0 20px 50px -10px rgba(225,29,72,0.2); }
        .chromatic-elite {
          text-shadow: 2px 0 #ff000030, -2px 0 #0000ff30;
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

const MetricRow = ({ label, value, target, status, icon: Icon }: any) => (
  <div className="flex items-center justify-between p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group/metric">
    <div className="flex items-center gap-6">
      <div className={cn(
        "p-4 rounded-2xl border transition-all duration-500",
        status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
      )}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] italic mb-1">{label}</div>
        <div className="text-2xl font-black text-white italic tracking-tighter">{value}</div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-[9px] text-slate-600 uppercase font-black tracking-widest italic mb-1">TARGET_BCH</div>
      <div className={cn(
        "text-sm font-black italic tracking-widest",
        status === 'success' ? 'text-emerald-500' : 'text-rose-500'
      )}>{target}</div>
    </div>
  </div>
);

export default ChaosControlHub;

