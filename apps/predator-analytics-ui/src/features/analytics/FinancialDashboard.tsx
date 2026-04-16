/**
 * 💰 FinancialDashboard — Продвинутий фінансовий дашборд компанії
 * Відображає KPI, тренди та історичні дані на основі CERS.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cersService } from '@/services/unified/cers.service';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { useEffect } from 'react';

interface FinancialDashboardProps {
  ueid?: string;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ ueid: propUeid }) => {
  const { ueid: paramUeid } = useParams<{ ueid: string }>();
  const ueid = propUeid || paramUeid;
  const { isOffline, activeFailover, sourceLabel } = useBackendStatus();

  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['financials', ueid],
    queryFn: () => cersService.getFinancialMetrics(ueid!),
    enabled: !!ueid,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  useEffect(() => {
    if (isError) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'FinancialAnalytics',
          action: 'FetchCERSMetrics',
          message: 'Не вдалося отримати фінансові показники CERS для суб\'єкта',
          severity: 'critical'
        }
      }));
    }
  }, [isError]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white">
        <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-bold uppercase tracking-[0.2em] animate-pulse">Завантаження фінансових даних...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white p-8">
        <AlertCircle size={64} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Помилка завантаження</h2>
        <p className="text-slate-400">Не вдалося отримати фінансові показники для даного суб'єкта.</p>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-white p-8 text-center">
        <BarChart3 size={64} className="text-slate-700 mb-6" />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Дані недоступні</h2>
        <p className="text-slate-500 max-w-md">Фінансові звіти за обраний період відсутні в базі даних реєстрів.</p>
      </div>
    );
  }

  // Сортуємо за роком (спадання)
  const sortedMetrics = [...metrics].sort((a, b) => b.year - a.year);
  const latest = sortedMetrics[0];
  const previous = sortedMetrics[1];

  const calculateTrend = (curr: number, prev: number) => {
    if (!prev) return 0;
    return ((curr - prev) / prev) * 100;
  };

  const formatCurrency = (val: number) => {
    return (val / 1000000).toFixed(1);
  };

  return (
    <div className="relative min-h-screen bg-[#020617] p-6 lg:p-12 overflow-hidden">
      <AdvancedBackground />
      <CyberGrid opacity={0.05} />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className={cn("border-blue-500/30 text-blue-400 font-black", isOffline && "border-amber-500/30 text-amber-500")}>
                {isOffline ? 'SOVEREIGN_EMERGENCY' : 'FINANCE_CORE_v56'}
              </Badge>
              <span className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">NODE: {sourceLabel} // ID: {ueid}</span>
              {activeFailover && <Badge className="bg-amber-600 text-black text-[8px] animate-pulse">FAILOVER_MIRROR</Badge>}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">
              💰 Фінансові <span className={cn(isOffline ? "text-amber-500" : "text-blue-500")}>Метрики</span>
            </h1>
          </div>
          <div className="hidden lg:block text-right">
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Останнє оновлення</div>
            <div className="text-white font-mono">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TacticalCard variant="holographic" className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-500/10 rounded-lg"><DollarSign size={20} className="text-blue-400" /></div>
              {previous && (
                <div className={cn(
                  "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full border",
                  latest.revenue >= previous.revenue ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40" : "bg-rose-500/10 text-rose-400 border-rose-500/40"
                )}>
                  {calculateTrend(latest.revenue, previous.revenue).toFixed(1)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Дохід</div>
              <div className="text-3xl font-black text-white mt-1">{formatCurrency(latest.revenue)} <span className="text-xs text-slate-400 ml-1">МЛН ₴</span></div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-500/10 rounded-lg"><TrendingUp size={20} className="text-amber-400" /></div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Витрати</div>
              <div className="text-3xl font-black text-white mt-1">{formatCurrency(latest.expenses)} <span className="text-xs text-slate-400 ml-1">МЛН ₴</span></div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><BarChart3 size={20} className="text-emerald-400" /></div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Прибуток</div>
              <div className="text-3xl font-black text-white mt-1">{formatCurrency(latest.profit)} <span className="text-xs text-slate-400 ml-1">МЛН ₴</span></div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" className="p-6">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><PieChart size={20} className="text-indigo-400" /></div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Рентабельність</div>
              <div className="text-3xl font-black text-white mt-1">{latest.profitMargin.toFixed(1)} <span className="text-xs text-slate-400 ml-1">%</span></div>
            </div>
          </TacticalCard>
        </div>

        {/* History Table */}
        <TacticalCard variant="glass" title="📋 Історичні дані" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Рік</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Дохід (МЛН)</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Витрати (МЛН)</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Прибуток (МЛН)</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedMetrics.map((row) => (
                  <tr key={row.year} role="row" className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-black text-white">{row.year}</td>
                    <td className="p-4 text-right text-slate-300 font-mono">{formatCurrency(row.revenue)}</td>
                    <td className="p-4 text-right text-slate-300 font-mono">{formatCurrency(row.expenses)}</td>
                    <td className="p-4 text-right text-emerald-400 font-black">{formatCurrency(row.profit)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-indigo-300 font-bold">
                        {row.profitMargin.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TacticalCard>

        {/* System Diagnostics */}
        <div className="mt-12">
          <DiagnosticsTerminal className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
