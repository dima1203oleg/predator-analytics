import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, ServerCrash, Power, Timer, Activity } from 'lucide-react';
import { cn } from '@/utils/cn';
import { factoryApi } from '@/services/api';
import { Button } from '@/components/ui/button';

interface ChaosExperiment {
  name: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const EXPERIMENTS: ChaosExperiment[] = [
  { name: 'db_latency', label: 'DB Latency Injection', description: 'Додає випадкову затримку (2-5 сек) до запитів бази даних', icon: Timer, color: 'yellow' },
  { name: 'cache_failure', label: 'Cache Desync', description: 'Симулює втрату підключення до Redis кешу', icon: Zap, color: 'orange' },
  { name: 'random_errors', label: 'Random HTTP 500', description: 'Генерує випадкові внутрішні помилки (20% вірогідність)', icon: ServerCrash, color: 'rose' },
  { name: 'llm_hallucination', label: 'LLM Hallucinations', description: 'Вприскує некоректні дані в AI-відповіді для перевірки валідації', icon: Activity, color: 'purple' },
];

export const FactoryChaosPanel = () => {
  const [chaosStatus, setChaosStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const status = await factoryApi.getChaosStatus();
      setChaosStatus(status);
    } catch (e) {
      console.error('Failed to fetch chaos status', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleExperiment = async (name: string, currentActive: boolean) => {
    try {
      setLoading(name);
      await factoryApi.triggerChaos(name, !currentActive);
      await fetchStatus();
    } catch (e) {
      console.error('Failed to trigger chaos', e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 relative overflow-hidden p-8 rounded-[3rem] bg-black/40 border border-orange-500/20 ">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 ">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-wider">CHAOS ENGINEERING</h3>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-1">Симуляція відмов та стрес-тестування кластера</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {EXPERIMENTS.map((exp) => {
          const isActive = chaosStatus[exp.name]?.active || false;
          const ttlLeft = chaosStatus[exp.name]?.ttl_left;
          const Icon = exp.icon;
          const isToggling = loading === exp.name;

          return (
            <motion.div
              key={exp.name}
              className={cn(
                "relative p-5 rounded-2xl border transition-all duration-300",
                isActive ? "bg-orange-950/20 border-orange-500/40" : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "p-2 rounded-xl border",
                  isActive ? "bg-orange-500/20 border-orange-500/50 text-orange-400" : "bg-slate-800 border-slate-700 text-slate-400"
                )}>
                  <Icon size={20} />
                </div>
                <Button
                  size="sm"
                  variant={isActive ? "destructive" : "secondary"}
                  onClick={() => toggleExperiment(exp.name, isActive)}
                  disabled={isToggling}
                  className={cn("h-8 px-3 text-[10px] uppercase font-bold", isActive && "bg-orange-600 hover:bg-orange-700")}
                >
                  {isToggling ? "..." : isActive ? "Stop" : "Inject"}
                </Button>
              </div>
              
              <h4 className="text-sm font-bold text-white mb-2">{exp.label}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4 min-h-[30px]">{exp.description}</p>

              <div className="flex items-center justify-between text-[9px] font-mono uppercase border-t border-white/5 pt-3">
                <span className={isActive ? "text-orange-400" : "text-slate-500"}>
                  {isActive ? "ACTIVE" : "STANDBY"}
                </span>
                {isActive && ttlLeft && (
                  <span className="text-orange-300/70 text-[8px] tracking-widest">{ttlLeft.split('.')[0]} TTL</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
