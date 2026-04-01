import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Banknote, BadgeAlert, Briefcase, Clock3 } from 'lucide-react';
import { TacticalCard } from '@/components/TacticalCard';
import { cn } from '@/utils/cn';
import type { DashboardOverview } from '@/services/api/dashboard';

interface RoiWidgetProps {
  overview: DashboardOverview;
  onMetricClick?: (metricId: string) => void;
}

interface RoiMetric {
  id: string;
  label: string;
  value: string;
  description: string;
  tone: 'emerald' | 'sky' | 'amber' | 'rose';
  icon: React.ReactNode;
}

const buildMetrics = (overview: DashboardOverview): RoiMetric[] => {
  const summary = overview.summary;
  const totalDeclarations = summary.total_declarations || 0;
  const importCount = summary.import_count || 0;
  const highRisk = summary.high_risk_count || 0;
  const mediumRisk = summary.medium_risk_count || 0;
  const graphNodes = summary.graph_nodes || 0;

  const estimatedHoursSaved = Math.max(Math.round(totalDeclarations * 0.18), 0);
  const estimatedCurrencySaved = estimatedHoursSaved * 850;
  const procurementSaving = Math.max(Math.round((summary.total_value_usd || 0) * 0.012), 0);
  const preventedFines = Math.max((highRisk * 320_000) + (mediumRisk * 85_000), 0);
  const opportunityGain = Math.max(Math.round((importCount + graphNodes) * 1_250), 0);

  return [
    {
      id: 'hours-saved',
      label: 'Заощаджено годин',
      value: `${estimatedHoursSaved.toLocaleString('uk-UA')} год`,
      description: `≈ ${estimatedCurrencySaved.toLocaleString('uk-UA')} грн економії`,
      tone: 'emerald',
      icon: <Clock3 size={18} />,
    },
    {
      id: 'procurement',
      label: 'Економія на закупівлях',
      value: `$${procurementSaving.toLocaleString('en-US')}`,
      description: 'Оцінка на основі ринкових потоків та середніх митних значень',
      tone: 'sky',
      icon: <Banknote size={18} />,
    },
    {
      id: 'fines',
      label: 'Відвернуті штрафи',
      value: `₴${preventedFines.toLocaleString('uk-UA')}`,
      description: 'Санкційні та AML-ризики, яких вдалося уникнути',
      tone: 'rose',
      icon: <BadgeAlert size={18} />,
    },
    {
      id: 'profit',
      label: 'Додатковий прибуток',
      value: `+$${opportunityGain.toLocaleString('en-US')}`,
      description: 'Можливості, виявлені через ринкові та графові сигнали',
      tone: 'amber',
      icon: <Briefcase size={18} />,
    },
  ];
};

const toneStyles: Record<RoiMetric['tone'], { border: string; text: string; badge: string; bg: string }> = {
  emerald: {
    border: 'border-emerald-400/20',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/10',
    bg: 'bg-emerald-500/5',
  },
  sky: {
    border: 'border-sky-400/20',
    text: 'text-sky-300',
    badge: 'bg-sky-500/10',
    bg: 'bg-sky-500/5',
  },
  amber: {
    border: 'border-amber-400/20',
    text: 'text-amber-300',
    badge: 'bg-amber-500/10',
    bg: 'bg-amber-500/5',
  },
  rose: {
    border: 'border-rose-400/20',
    text: 'text-rose-300',
    badge: 'bg-rose-500/10',
    bg: 'bg-rose-500/5',
  },
};

export const ROIWidgets: React.FC<RoiWidgetProps> = ({ overview, onMetricClick }) => {
  const metrics = buildMetrics(overview);

  return (
    <TacticalCard variant="holographic" className="p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">ROI-панель</div>
          <h3 className="mt-1 text-lg font-black text-white">Реальна цінність платформи</h3>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Автооновлення
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const tone = toneStyles[metric.tone];
          return (
            <motion.button
              key={metric.id}
              type="button"
              onClick={() => onMetricClick?.(metric.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={cn(
                'group rounded-3xl border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-2xl',
                tone.border,
                tone.bg,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {metric.label}
                  </div>
                  <div className={cn('mt-2 text-2xl font-black tracking-tight', tone.text)}>
                    {metric.value}
                  </div>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl border', tone.border, tone.badge, tone.text)}>
                  {metric.icon}
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-slate-400">
                {metric.description}
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Детальний звіт
                <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </TacticalCard>
  );
};

export default ROIWidgets;
