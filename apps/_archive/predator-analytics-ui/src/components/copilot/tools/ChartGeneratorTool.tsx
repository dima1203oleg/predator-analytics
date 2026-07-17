/**
 * ChartGeneratorTool — PREDATOR Analytics v63.0-ELITE
 *
 * AG-UI Tool для CopilotKit: AI генерує параметри → фронтенд рендерить Tremor-графік.
 * Підтримує: AreaChart, BarChart, DonutChart, KPI Card.
 */
import React, { type FC } from 'react';
import { PredatorAreaChart, PredatorBarChart, formatMetricValue, type ChartDataPoint } from '../../analytics/TremorCharts';
import { KPICardGrid, type KPIMetric } from '../../analytics/KPICardGrid';

/** Типи графіків, які може згенерувати AI */
export type GeneratedChartType = 'area' | 'bar' | 'donut' | 'kpi';

/** Параметри, які AI передає для рендерингу графіка */
export interface ChartGeneratorParams {
  chartType: GeneratedChartType;
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  categories: string[];
  index: string;
  stack?: boolean;
}

/** Параметри для KPI-блоку */
export interface KPIGeneratorParams {
  metrics: KPIMetric[];
}

/**
 * Компонент для рендерингу графіків, згенерованих AI
 */
export const GeneratedChart: FC<{ params: ChartGeneratorParams }> = ({ params }) => {
  switch (params.chartType) {
    case 'area':
      return (
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
          {params.title && <h4 className="text-lg font-medium text-white">{params.title}</h4>}
          {params.subtitle && <p className="text-sm text-slate-400 mb-4">{params.subtitle}</p>}
          <PredatorAreaChart
            data={params.data}
            categories={params.categories}
            index={params.index}
            className="mt-4 h-[220px]"
          />
        </div>
      );
    case 'bar':
      return (
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
          {params.title && <h4 className="text-lg font-medium text-white">{params.title}</h4>}
          {params.subtitle && <p className="text-sm text-slate-400 mb-4">{params.subtitle}</p>}
          <PredatorBarChart
            data={params.data}
            categories={params.categories}
            index={params.index}
            stack={params.stack}
            className="mt-4 h-[220px]"
          />
        </div>
      );
    case 'donut':
      return (
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
          {params.title && (
            <h3 className="mb-3 text-sm font-semibold text-slate-200">{params.title}</h3>
          )}
          {/* Простий SVG-donut як fallback */}
          <DonutChart data={params.data} categories={params.categories} index={params.index} />
        </div>
      );
    case 'kpi':
      return null; // KPI рендериться окремо
    default:
      return (
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5">
          <p className="text-xs text-slate-500">Невідомий тип графіка: {params.chartType}</p>
        </div>
      );
  }
};

/**
 * Компонент для рендерингу KPI, згенерованих AI
 */
export const GeneratedKPI: FC<{ params: KPIGeneratorParams }> = ({ params }) => (
  <KPICardGrid metrics={params.metrics} columns={params.metrics.length <= 2 ? 2 : 4} />
);

/**
 * Простий Donut-чарт на SVG
 */
const DonutChart: FC<{
  data: ChartDataPoint[];
  categories: string[];
  index: string;
}> = ({ data, categories, index }) => {
  const colors = ['#06b6d4', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316'];
  const total = data.reduce((sum, d) => sum + Number(d[categories[0]] || 0), 0);

  let currentAngle = 0;
  const segments = data.map((d, i) => {
    const value = Number(d[categories[0]] || 0);
    const percentage = total > 0 ? value / total : 0;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // SVG arc path
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);
    const x1 = 50 + 35 * Math.cos(startRad);
    const y1 = 50 + 35 * Math.sin(startRad);
    const x2 = 50 + 35 * Math.cos(endRad);
    const y2 = 50 + 35 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      path: `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[i % colors.length],
      label: String(d[index] || ''),
      value,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="h-32 w-32">
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.8} className="transition-opacity hover:opacity-100" />
        ))}
        {/* Центральне коло (donut hole) */}
        <circle cx="50" cy="50" r="20" fill="#050608" />
        <text x="50" y="48" textAnchor="middle" className="text-[8px] font-bold" fill="#e2e8f0">
          {formatMetricValue(total)}
        </text>
        <text x="50" y="57" textAnchor="middle" className="text-[5px]" fill="#64748b">
          Всього
        </text>
      </svg>

      {/* Легенда */}
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-400">{s.label}</span>
            <span className="font-semibold text-slate-200">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
