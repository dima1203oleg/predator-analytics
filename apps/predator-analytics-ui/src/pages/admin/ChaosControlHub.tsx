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
  ShieldAlert,
  Target,
  RefreshCw,
  Box,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useAdminApi';
import { cn } from '@/lib/utils';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

interface Experiment {
  active: boolean;
  ttl_left: string;
}

/**
 * 🦅 CHAOS CONTROL HUB | v61.0-ELITE
 * ЦЕНТР_КЕРУВАННЯ_ХАОСОМ: Верифікація стійкості через ін'єкцію аномалій.
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
      // Fallback
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
      console.error("[PREDATOR] Chaos trigger error:", err);
    } finally {
      setLoading(false);
    }
  };

  const experimentConfigs = [
    { id: 'db_latency', name: 'ІН\'ЄКЦІЯ_ЗАТРИМКИ_БД', desc: 'ДОДАЄ_ВИПАДКОВУ_ЗАТРИМКУ_2-5с_ДО_SQL_ЗАПИТІВ', icon: <Clock /> },
    { id: 'cache_failure', name: 'ОБХІД_КЕШУ_REDIS', desc: 'ІГНОРУЄ_КЕШ_ТА_ЗМУШУЄ_СИСТЕМУ_ЙТИ_В_DB', icon: <ZapOff /> },
    { id: 'random_errors', name: 'ВИПАДКОВІ_ПОМИЛКИ_500', desc: 'ВКИДАЄ_ПОМИЛКИ_HTTP_З_ІМОВІРНІСТЮ_20%', icon: <AlertTriangle /> },
    { id: 'llm_hallucination', name: 'ГАЛЮЦИНАЦІЯ_ШІ', desc: 'СИМУЛЮЄ_НЕКОРЕКТНІ_АБО_ТОКСИЧНІ_ВІДПОВІДІ_LLM', icon: <Wind /> },
    { id: 'agent_timeout', name: 'ДРЕЙФ_ШІ_АГЕНТА', desc: 'БЛОКУЄ_ВИКОНАННЯ_ЗАДАЧ_AGI-АГЕНТАМИ_ПО_TTL', icon: <Skull /> },
  ];

  const { data: systemStatus } = useSystemStatus();
  const avgLatency = systemStatus?.services?.[0]?.latency_ms || 0;

  return (
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <AdvancedBackground mode="sovereign" />
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-10 justify-between items-start lg:items-center relative z-10">
        <div className="flex flex-col gap-3 border-l-4 border-rose-600 pl-10 py-2">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
              ЦЕНТР <span className="text-rose-500">КЕРУВАННЯ ХАОСОМ</span>
            </h2>
            <div className="px-4 py-1.5 bg-rose-600/10 border-2 border-rose-600/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.4em] uppercase italic shadow-2xl">
              DANGER_ZONE_v61.0_ELITE
            </div>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
              <span className="text-rose-500">ПРОТОКОЛ_ХАОСУ: АКТИВНИЙ_ОЧІКУВАННЯ</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3">
               <RefreshCw size={14} className="text-rose-500/60" />
               <span>ВЕРЕФІКАЦІЯ_SLA: ТРИВАЄ</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3 text-rose-500/40">
               <ShieldAlert size={14} />
               <span>РЕЖИМ: АГРЕСИВНИЙ_СТРЕС_ТЕСТ</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => Object.keys(experiments).forEach(k => toggleExperiment(k, false))}
          className="group relative px-12 py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-[0.5em] text-[13px] hover:bg-rose-700 transition-all duration-700 flex items-center gap-6 italic shadow-4xl border-2 border-rose-400/50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Power size={24} className="group-hover:scale-110 transition-transform relative z-10" /> 
          <span className="relative z-10">ЕКСТРЕНА_ЗУПИНКА_ЯДРА</span>
          <div className="absolute inset-0 rounded-[2rem] border-2 border-white/10 animate-pulse pointer-events-none" />
        </button>
      </div>

      {/* Experiment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 relative z-10">
        {experimentConfigs.map((cfg, idx) => {
          const isActive = experiments[cfg.id]?.active;
          return (
            <motion.div 
              key={cfg.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={cn(
                "group relative p-10 rounded-[3.5rem] border-2 transition-all duration-700 overflow-hidden shadow-4xl",
                isActive 
                  ? 'bg-rose-600/10 border-rose-500 shadow-rose-500/20' 
                  : 'glass-wraith border-white/5 hover:border-rose-500/40'
              )}
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className={cn(
                  "p-6 rounded-[2rem] border-2 shadow-inner transition-all duration-1000",
                  isActive ? "bg-rose-600 border-rose-400 text-white scale-110 rotate-3 shadow-rose-500/40" : "bg-white/5 border-white/5 text-rose-500/40"
                )}>
                  {React.cloneElement(cfg.icon as React.ReactElement, { size: 32 })}
                </div>
                <div className="flex flex-col items-end gap-4">
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-[0.3em] italic",
                    isActive ? "text-rose-500 animate-pulse" : "text-white/10"
                  )}>
                    {isActive ? 'АКТИВНА_ІН\'ЄКЦІЯ' : 'СТАНД_БАЙ'}
                  </span>
                  <button
                    onClick={() => toggleExperiment(cfg.id, !isActive)}
                    disabled={loading}
                    className={cn(
                      "w-20 h-10 rounded-full relative transition-all duration-700 border-2 p-1",
                      isActive ? "bg-rose-600 border-rose-400 shadow-rose-500/40" : "bg-white/5 border-white/5 hover:border-rose-500/20"
                    )}
                  >
                    <motion.div 
                      animate={{ x: isActive ? 40 : 0 }}
                      className="w-7 h-7 bg-white rounded-full shadow-2xl relative z-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-white/10 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter glint-elite relative z-10">{cfg.name}</h3>
              <p className="text-[12px] text-white/30 font-black mb-12 leading-relaxed uppercase italic tracking-widest relative z-10">{cfg.desc}</p>

              {isActive ? (
                <div className="pt-8 border-t-2 border-rose-500/20 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4 text-rose-500">
                    <Clock size={16} className="animate-spin-slow" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">ЗАЛИШОК_TTL:</span>
                  </div>
                  <span className="text-2xl font-black text-white italic font-mono tabular-nums glint-elite">{experiments[cfg.id]?.ttl_left.split('.')[0]}</span>
                </div>
              ) : (
                <div className="pt-8 border-t-2 border-white/5 flex items-center justify-center opacity-20 relative z-10">
                  <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">СИСТЕМА_В_ПЕРІМЕТРІ_БЕЗПЕКИ</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Metrics & Analytics */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 p-12 glass-wraith border-2 border-white/5 rounded-[4rem] shadow-4xl relative overflow-hidden group hover:border-rose-500/20 transition-all duration-1000">
          <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-10 transition-all duration-1000">
            <ShieldCheck size={240} className="text-emerald-500" />
          </div>
          <div className="flex items-center gap-8 mb-12 border-l-4 border-emerald-500 pl-10">
            <div className="p-5 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500/20 shadow-emerald-500/10">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none glint-elite">МЕТРИКИ СТІЙКОСТІ_SLA</h2>
              <p className="text-[11px] text-white/20 font-black uppercase tracking-[0.5em] mt-3 italic">ВЕРИФІКАЦІЯ_ВІДМОВОСТІЙКОСТІ_ЯДРА</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <MetricRow label="ЧАС_ВІДГУКУ_P95" value={`${avgLatency}мс`} target="< 2.0с" status={avgLatency < 2000 ? "success" : "danger"} icon={Activity} />
             <MetricRow label="РІВЕНЬ_ПОМИЛОК_ERR" value={systemStatus?.overall_status === 'optimal' ? '0.00%' : 'Н/Д'} target="< 1.0%" status={systemStatus?.overall_status === 'optimal' ? "success" : "warning"} icon={Zap} />
             <MetricRow label="СТАН_ЗАПОБІЖНИКА" value={systemStatus?.healthy ? "ЗАКРИТО" : "ВІДКРИТО"} target="HEALTHY_L7" status={systemStatus?.healthy ? "success" : "danger"} icon={ShieldAlert} />
             <div className="p-10 glass-wraith border-2 border-white/5 rounded-[2.5rem] flex flex-col justify-center gap-4 italic group/inner shadow-inner hover:border-rose-500/20 transition-all duration-700">
                <span className="text-[11px] font-black text-white/10 uppercase tracking-[0.4em] italic group-hover/inner:text-rose-500/40 transition-colors">СТАТУС_КЛАСТЕРА_OODA</span>
                <span className="text-3xl font-black text-white uppercase tracking-tighter italic glint-elite">СТАБІЛЬНИЙ // ELITE_v61</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 p-12 glass-wraith border-2 border-rose-500/20 rounded-[4rem] flex flex-col items-center justify-center text-center shadow-4xl relative group overflow-hidden hover:border-rose-500/60 transition-all duration-1000">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="p-10 bg-rose-600/10 rounded-[3rem] border-2 border-rose-500/30 text-rose-500 mb-10 shadow-4xl group-hover:bg-rose-600/20 transition-all duration-700"
            >
              <ExternalLink size={64} className="glint-elite" />
            </motion.div>
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-6 glint-elite">ЗВІТ_ВІДПОВІДНОСТІ</h4>
            <p className="text-[13px] text-white/20 font-black uppercase tracking-[0.2em] mb-12 italic leading-relaxed max-w-xs">
              Автоматично згенерований звіт на основі останніх k6 стрес-тестів та ін'єкцій хаосу.
            </p>
            <button className="w-full py-8 bg-rose-600 text-white rounded-[2rem] text-[13px] font-black uppercase tracking-[0.5em] hover:bg-rose-500 hover:scale-[1.02] transition-all duration-700 shadow-4xl italic border-2 border-rose-400/50 group/btn relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
               <span className="relative z-10">ГЕНЕРУВАТИ_АНАЛІТИКУ_SLA</span>
            </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
        .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

const MetricRow = ({ label, value, target, status, icon: Icon }: any) => (
  <div className="flex items-center justify-between p-10 glass-wraith border-2 border-white/5 rounded-[2.5rem] hover:border-white/20 transition-all duration-700 group/metric shadow-4xl relative overflow-hidden">
    <div className="absolute inset-0 bg-cyber-grid opacity-[0.01] pointer-events-none" />
    <div className="flex items-center gap-8 relative z-10">
      <div className={cn(
        "p-5 rounded-[1.5rem] border-2 transition-all duration-700 shadow-inner",
        status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
      )}>
        <Icon size={28} />
      </div>
      <div>
        <div className="text-[11px] text-white/20 uppercase font-black tracking-[0.4em] italic mb-2 group-hover/metric:text-white/40 transition-colors">{label}</div>
        <div className="text-3xl font-black text-white italic tracking-tighter glint-elite">{value}</div>
      </div>
    </div>
    <div className="text-right relative z-10">
      <div className="text-[10px] text-white/10 uppercase font-black tracking-widest italic mb-2">ЦІЛЬ_SLA</div>
      <div className={cn(
        "text-lg font-black italic tracking-[0.2em] uppercase",
        status === 'success' ? 'text-emerald-500' : 'text-rose-500'
      )}>{target}</div>
    </div>
  </div>
);

export default ChaosControlHub;
