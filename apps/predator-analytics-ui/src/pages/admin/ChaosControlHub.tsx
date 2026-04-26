import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Flame, 
  Wind, 
  ExternalLink,
  ZapOff,
  Clock,
  Skull,
  ShieldCheck,
  Power
} from 'lucide-react';
import { useSystemStatus } from '@/hooks/useAdminApi';
import { cn } from '@/lib/utils';

interface Experiment {
  active: boolean;
  ttl_left: string;
}

const ChaosControlHub: React.FC = () => {
  const [experiments, setExperiments] = useState<Record<string, Experiment>>({});
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/chaos/status');
      const data = await response.json();
      setExperiments(data);
    } catch (err) {
      console.error("Failed to fetch chaos status");
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
  const avgLatency = systemStatus?.services[0]?.latency_ms || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ... header remains ... */}
      <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter italic flex items-center gap-3">
            <Flame className="animate-pulse" /> Центр Керування Хаосом
          </h2>
          <p className="text-xs text-rose-300 font-mono mt-1 uppercase mt-2 opacity-60">
            Керування цілеспрямованим деградуванням системи для тестування стабільності
          </p>
        </div>
        <button 
          onClick={() => Object.keys(experiments).forEach(k => toggleExperiment(k, false))}
          className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-600 transition-all flex items-center gap-2"
        >
          <Power size={14} /> Екстрена Зупинка
        </button>
      </div>

      {/* ... experiment cards remain ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experimentConfigs.map((cfg) => {
          const isActive = experiments[cfg.id]?.active;
          return (
            <motion.div 
              key={cfg.id}
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-3xl border transition-all duration-300 ${
                isActive 
                  ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${isActive ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/40'}`}>
                  {React.cloneElement(cfg.icon as React.ReactElement, { size: 24 })}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase ${isActive ? 'text-rose-500' : 'text-slate-500'}`}>
                    {isActive ? 'Активно' : 'Очікування'}
                  </span>
                  <button
                    onClick={() => toggleExperiment(cfg.id, !isActive)}
                    disabled={loading}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isActive ? 'bg-rose-500' : 'bg-white/20'}`}
                  >
                    <motion.div 
                      animate={{ x: isActive ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{cfg.name}</h3>
              <p className="text-xs text-white/40 mb-6 leading-relaxed">{cfg.desc}</p>

              {isActive && (
                <div className="pt-4 border-t border-rose-500/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-rose-300 uppercase">Залишилося часу (TTL):</span>
                  <span className="text-xs font-mono text-white">{experiments[cfg.id]?.ttl_left.split('.')[0]}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 font-black uppercase tracking-widest text-[#f43f5e]">
            <ShieldCheck size={20} /> Метрики Стійкості
          </div>
          <div className="space-y-6">
             <MetricRow label="Час відгуку API (P95)" value={`${avgLatency}ms`} target="< 2.0s" status={avgLatency < 2000 ? "success" : "danger"} />
             <MetricRow label="Рівень помилок" value={systemStatus?.overall_status === 'optimal' ? '0.00%' : 'Н/Д'} target="< 1.0%" status={systemStatus?.overall_status === 'optimal' ? "success" : "warning"} />
             <MetricRow label="Стан Запобіжника" value={systemStatus?.healthy ? "ЗАКРИТО" : "ВІДКРИТО"} target="HEALTHY" status={systemStatus?.healthy ? "success" : "danger"} />
          </div>
        </div>

        <div className="p-8 rounded-[3rem] bg-rose-500/5 border border-rose-500/10 flex flex-col items-center justify-center text-center">
            <ExternalLink className="text-rose-500 mb-4" size={32} />
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Звіт про відповідність SLA</h4>
            <p className="text-xs text-white/40 max-w-xs mb-6 font-mono uppercase tracking-tighter">
              Автоматично згенерований звіт на основі останніх k6 стрес-тестів.
            </p>
            <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white transition-all">
              Переглянути Аналітику
            </button>
        </div>
      </div>
    </div>
  );
};

const MetricRow = ({ label, value, target, status }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5">
    <div>
      <div className="text-[10px] text-white/30 uppercase font-mono tracking-widest">{label}</div>
      <div className="text-lg font-black text-white italic">{value}</div>
    </div>
    <div className="text-right">
      <div className="text-[9px] text-white/30 uppercase font-mono tracking-widest">Ціль</div>
      <div className={`text-xs font-bold ${status === 'success' ? 'text-emerald-400' : 'text-rose-500'}`}>{target}</div>
    </div>
  </div>
);

export default ChaosControlHub;
