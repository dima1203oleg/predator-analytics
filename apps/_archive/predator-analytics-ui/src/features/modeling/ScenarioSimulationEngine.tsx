import { Button } from '@/components/ui/button';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RefreshCcw, 
  ShieldAlert, 
  TrendingDown, 
  Globe, 
  Network,
  Zap,
  Layers,
  Activity,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUser } from '../../context/UserContext';
import { UserRole } from '../../config/roles';
import { UpgradePrompt } from '../../components/shared/UpgradePrompt';

interface SimulationParam {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  category: 'market' | 'logistics' | 'geopolitical' | 'financial';
}

interface ImpactNode {
  id: string;
  label: string;
  type: 'entity' | 'flow' | 'region';
  impact: number; // -100 to 100
  reason: string;
}

export const ScenarioSimulationEngine: React.FC = () => {
  const { user } = useUser();
  const isLocked = user?.role === 'terminal';
  
  const [params, setParams] = useState<SimulationParam[]>([
    { id: 'import-tax', label: 'Імпортне мито', value: 10, min: 0, max: 50, unit: '%', category: 'financial' },
    { id: 'border-delay', label: 'Затримка на кордоні', value: 2, min: 0, max: 30, unit: 'днів', category: 'logistics' },
    { id: 'currency-volatility', label: 'Волатильність валюти', value: 5, min: 0, max: 20, unit: '%', category: 'market' },
    { id: 'sanction-pressure', label: 'Санкційний тиск', value: 15, min: 0, max: 100, unit: '%', category: 'geopolitical' },
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<ImpactNode[] | null>(null);

  const runSimulation = () => {
    if (isLocked) return;
    setIsSimulating(true);
    // Імітація роботи Causal AI Engine
    setTimeout(() => {
      setResults([
        { id: '1', label: 'ТОВ "Метал-Трейд"', type: 'entity', impact: -45, reason: 'Критична залежність від імпортної сировини' },
        { id: '2', label: 'Логістичний коридор "Захід"', type: 'flow', impact: -62, reason: 'Пропускна здатність впаде на 40% через затримки' },
        { id: '3', label: 'Кеш-флоу портфеля', type: 'entity', impact: -18, reason: 'Валютні ризики та здорожчання кредитування' },
        { id: '4', label: 'Регіональний ринок ЄС', type: 'region', impact: 12, reason: 'Можливе заміщення імпорту внутрішнім виробництвом' },
      ]);
      setIsSimulating(false);
    }, 2500);
  };

  if (isLocked) {
    return (
      <div className="p-8">
        <UpgradePrompt 
          title="Scenario Simulation Engine" 
          description="Доступ до Causal AI та 'What-if' моделювання каскадних ефектів зарезервований для рівнів PRO та SOVEREIGN."
          requiredRole={UserRole.PRO}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#020617] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/50 bg-slate-900/20 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Layers className="text-indigo-400 w-8 h-8" />
            Scenario Simulation Engine
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest">Causal AI</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-light">
            Моделювання системних ризиків та каскадних ефектів у реальному часі.
          </p>
        </div>
        
        <Button variant="cyber"
          onClick={runSimulation}
          disabled={isSimulating}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300",
            isSimulating 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]"
          )}
        >
          {isSimulating ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          {isSimulating ? 'ЙДЕ МОДЕЛЮВАННЯ...' : 'ЗАПУСТИТИ СИМУЛЯЦІЮ'}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Params Sidebar */}
        <div className="w-80 border-r border-slate-800/50 p-6 overflow-y-auto space-y-8 bg-slate-900/10">
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Параметри середовища
            </h3>
            <div className="space-y-8">
              {params.map(param => (
                <div key={param.id} className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{param.label}</span>
                    <span className="text-indigo-400 font-mono">{param.value}{param.unit}</span>
                  </div>
                  <input 
                    type="range" 
                    min={param.min} 
                    max={param.max} 
                    value={param.value}
                    onChange={(e) => {
                      setParams(prev => prev.map(p => p.id === param.id ? { ...p, value: parseInt(e.target.value) } : p));
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 w-5 h-5 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-500 uppercase">Попередження системи</h4>
                <p className="text-[10px] text-amber-500/70 mt-1 leading-relaxed">
                  Зміни параметрів вплинуть на всю онтологію зв'язків. Результати базуються на імовірнісних моделях.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Simulation View */}
        <div className="flex-1 p-8 overflow-y-auto relative bg-[radial-gradient(circle_at_50%_-20%,rgba(79,70,229,0.1),transparent)]">
          <AnimatePresence mode="wait">
            {!results && !isSimulating && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto"
              >
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                  <Zap className="text-slate-600 w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-white mb-3">Готовність до симуляції</h2>
                <p className="text-slate-500 font-light leading-relaxed">
                  Налаштуйте параметри зліва та запустіть Causal AI Engine для аналізу каскадних наслідків для вашого бізнес-периметра.
                </p>
              </motion.div>
            )}

            {isSimulating && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="text-indigo-400 w-8 h-8" />
                  </div>
                </div>
                <div className="mt-8 space-y-2 text-center">
                  <h3 className="text-lg font-mono text-indigo-400 animate-pulse uppercase tracking-[0.2em]">Прорахунок зв'язків...</h3>
                  <p className="text-slate-500 text-xs font-light">Аналіз 1.4M транзакцій та 240k ребер графа</p>
                </div>
              </motion.div>
            )}

            {results && !isSimulating && (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  {results.map((node, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={node.id}
                      className={cn(
                        "p-5 rounded-2xl border transition-all duration-500",
                        node.impact < 0 
                          ? "bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40" 
                          : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            node.impact < 0 ? "bg-cyan-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {node.type === 'entity' && <Network className="w-5 h-5" />}
                            {node.type === 'flow' && <TrendingDown className="w-5 h-5" />}
                            {node.type === 'region' && <Globe className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{node.label}</h4>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500">{node.type}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "text-xl font-mono font-bold",
                          node.impact < 0 ? "text-cyan-500" : "text-emerald-500"
                        )}>
                          {node.impact > 0 ? '+' : ''}{node.impact}%
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-light leading-relaxed border-t border-slate-800/50 pt-3">
                        {node.reason}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <ShieldAlert className="text-indigo-400 w-4 h-4" /> Стратегічний висновок Oracle
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed font-light">
                    Симуляція вказує на високу вразливість вашого імпортного ланцюга. Найбільш критичний удар отримає <span className="text-indigo-400 font-medium">ТОВ "Метал-Трейд"</span>. Рекомендується диверсифікація через регіональний ринок ЄС, де прогнозується зростання на 12%.
                  </p>
                  <div className="mt-4 flex gap-4">
                    <Button variant="cyber" className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 flex items-center gap-2 hover:text-indigo-300 transition-colors">
                      Завантажити детальний звіт <ArrowRight className="w-3 h-3" />
                    </Button>
                    <Button variant="cyber" className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2 hover:text-slate-400 transition-colors">
                      Експортувати в Кейс-Менеджер <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
