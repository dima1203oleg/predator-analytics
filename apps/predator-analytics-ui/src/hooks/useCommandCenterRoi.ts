import { useMemo } from 'react';
import {
  Activity,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardSummary } from '@/services/api/dashboard';

type RoiTone = 'amber' | 'cyan' | 'emerald' | 'rose';

interface RoiStat {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: RoiTone;
}

interface OnboardingStep {
  id: string;
  label: string;
  path: string;
  detail: string;
}

const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)} млрд`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)} млн`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)} тис`;
  }

  return `$${value.toLocaleString('uk-UA')}`;
};

const formatHours = (value: number): string => `${value.toLocaleString('uk-UA')} год`;

export const useCommandCenterRoi = (summary: DashboardSummary | null) => {
  const roiStats = useMemo<RoiStat[]>(
    () => [
      {
        id: 'time-saved',
        label: 'Заощаджено часу',
        value: summary
          ? formatHours(Math.round(summary.active_pipelines * 18 + summary.total_declarations / 220))
          : '—',
        hint: 'Автоматизація рутинних операцій',
        icon: Activity,
        tone: 'amber',
      },
      {
        id: 'saved',
        label: 'Заощаджено',
        value: summary ? formatCurrency(Math.round(summary.total_value_usd * 0.0125)) : '—',
        hint: 'Оптимізація цін та логістики',
        icon: TrendingUp,
        tone: 'emerald',
      },
      {
        id: 'earned',
        label: 'Зароблено',
        value: summary ? formatCurrency(summary.medium_risk_count * 125_000) : '—',
        hint: 'реалізовані ринкові можливості',
        icon: Sparkles,
        tone: 'cyan',
      },
      {
        id: 'risks-avoided',
        label: 'Уникнуто ризиків',
        value: summary ? formatCurrency(summary.high_risk_count * 82_500) : '—',
        hint: 'Заблоковані штрафи та санкції',
        icon: ShieldCheck,
        tone: 'rose',
      },
    ],
    [summary],
  );

  const onboardingSteps = useMemo<OnboardingStep[]>(
    () => [
      {
        id: 'find-opportunity',
        label: 'Знайти можливість',
        path: '/opportunities',
        detail: 'Система показує ніші, де можна заробити швидше за конкурентів.',
      },
      {
        id: 'compare-prices',
        label: 'Порівняти ціни',
        path: '/price-compare',
        detail: 'Перевірте закупівельну економіку й знайдіть найкращого постачальника.',
      },
      {
        id: 'order-audit',
        label: 'Замовити аудит',
        path: '/diligence',
        detail: 'Підтвердіть контрагента і закрийте ризик до рішення про угоду.',
      },
    ],
    [],
  );

  return {
    roiStats,
    onboardingSteps,
  };
};
