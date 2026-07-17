import React, { useCallback } from 'react';
import { Cpu, AlertTriangle, Lightbulb, Workflow, RefreshCw, ExternalLink, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// ─── API Hooks ─────────────────────────────────────────────────────────────

const useRisks = () => {
  return useQuery({
    queryKey: ['intelligence-risks'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/alerts?severity=high&limit=5');
      // Підтримка різних форматів відповіді
      if (res.data?.alerts) return res.data.alerts;
      if (Array.isArray(res.data)) return res.data;
      // Моковий fallback
      return [
        { id: 'R-8492', severity: 'HIGH', message: 'Аномальний логістичний маршрут через порт Одеса (ТОВ "Транс-Логістик")', company: 'TRANS-LOG' },
        { id: 'R-8491', severity: 'CRITICAL', message: 'Виявлено підозрілу транзакцію на 590M UAH між офшорами', company: 'SHELL-99' },
      ];
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

const useInsights = () => {
  return useQuery({
    queryKey: ['intelligence-insights'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/insights?limit=3');
      if (res.data?.insights) return res.data.insights;
      if (Array.isArray(res.data)) return res.data;
      // Моковий fallback
      return [
        { id: 'I-001', text: 'Прихований зв\'язок між директором "Транс-Логістик" та офшорною компанією на Кіпрі. Ймовірність схеми: 89%.', action: 'graph' },
        { id: 'I-002', text: 'Нова реєстрація 3 пов\'язаних компаній протягом 48 годин. Признаки номінальних власників.', action: 'search' },
      ];
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });
};

// ─── Компоненти ────────────────────────────────────────────────────────────

const RiskCard: React.FC<{ risk: any; index: number }> = ({ risk, index }) => {
  const navigate = useNavigate();
  const isCritical = risk.severity === 'CRITICAL';

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => navigate('/admin/security')}
      className={`p-3 rounded-lg border cursor-pointer transition-all group hover:scale-[1.01] ${
        isCritical
          ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/20'
          : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20'
      }`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className={`text-[10px] font-mono font-bold ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
          {risk.id || 'R-XXXX'}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
          isCritical
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {risk.severity}
        </span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{risk.message || risk.description}</p>
      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-500">
        <ExternalLink size={10} />
        <span>Деталі</span>
      </div>
    </motion.div>
  );
};

const InsightCard: React.FC<{ insight: any; index: number }> = ({ insight, index }) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (insight.action === 'graph') navigate('/predator');
    else if (insight.action === 'search') navigate('/search');
    else navigate('/admin/osint');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-all"
    >
      <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{insight.text || insight.description}</p>
      <button
        onClick={handleAction}
        className="text-[10px] font-mono text-cyan-400 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 rounded px-2 py-1 transition-colors w-full flex items-center justify-center gap-1.5"
      >
        РОЗГОРНУТИ ГРАФ ЗВ&apos;ЯЗКІВ
        <ChevronRight size={10} />
      </button>
    </motion.div>
  );
};

// ─── Головний компонент ────────────────────────────────────────────────────

export const IntelligencePanel: React.FC = () => {
  const navigate = useNavigate();
  const { data: risks, isLoading: risksLoading, refetch: refetchRisks } = useRisks();
  const { data: insights, isLoading: insightsLoading } = useInsights();

  const handleRefresh = useCallback(() => {
    refetchRisks();
  }, [refetchRisks]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="text-cyan-400" size={16} />
          <h2 className="font-mono text-xs tracking-widest text-slate-200 uppercase">AI Аналітик</h2>
        </div>
        <button
          onClick={handleRefresh}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-white/5"
          title="Оновити"
        >
          <RefreshCw size={13} className={risksLoading ? 'animate-spin text-cyan-500' : ''} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

        {/* ─── Виявлені Ризики ─────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} className="text-amber-500" />
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex-1">
              Виявлені Ризики
            </h3>
            {risks && (
              <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold">
                {risks.length} активних
              </span>
            )}
          </div>

          <AnimatePresence>
            {risksLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(risks || []).slice(0, 3).map((risk: any, i: number) => (
                  <RiskCard key={risk.id || i} risk={risk} index={i} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* ─── AI Інсайти ──────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={13} className="text-cyan-400" />
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Інсайти AI</h3>
          </div>

          <AnimatePresence>
            {insightsLoading ? (
              <div className="h-20 rounded-lg bg-white/5 animate-pulse border border-white/5" />
            ) : (
              <div className="space-y-2">
                {(insights || []).slice(0, 2).map((insight: any, i: number) => (
                  <InsightCard key={insight.id || i} insight={insight} index={i} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* ─── Швидкі Сценарії ─────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Workflow size={13} className="text-emerald-400" />
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Сценарії</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/osint')}
              className="w-full text-left bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-lg p-3 transition-all group"
            >
              <div className="text-xs text-slate-200 group-hover:text-emerald-400 transition-colors mb-1">
                Зібрати повне досьє
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Автоматичний OSINT пошук</div>
            </button>
            <button
              onClick={() => navigate('/predator')}
              className="w-full text-left bg-white/5 border border-white/10 hover:border-blue-500/40 rounded-lg p-3 transition-all group"
            >
              <div className="text-xs text-slate-200 group-hover:text-blue-400 transition-colors mb-1">
                Побудувати мережу зв&apos;язків
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Граф Neo4j + AI-аналіз</div>
            </button>
            <button
              onClick={() => navigate('/admin/forecasting')}
              className="w-full text-left bg-white/5 border border-white/10 hover:border-purple-500/40 rounded-lg p-3 transition-all group"
            >
              <div className="text-xs text-slate-200 group-hover:text-purple-400 transition-colors mb-1">
                Прогноз ризику
              </div>
              <div className="text-[10px] text-slate-500 font-mono">ML-модель + TimescaleDB</div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};
