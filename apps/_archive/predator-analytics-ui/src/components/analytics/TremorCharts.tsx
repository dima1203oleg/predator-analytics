import React from 'react';
import { AreaChart as TremorAreaChart, BarChart as TremorBarChart, LineChart as TremorLineChart, DonutChart as TremorDonutChart } from '@tremor/react';

// Типи
export interface ChartDataPoint {
  date?: string;
  label?: string;
  value: number;
  [key: string]: string | number | undefined;
}

export type DeltaType = 'increase' | 'moderateIncrease' | 'decrease' | 'moderateDecrease' | 'unchanged';

// Custom Predator Colors mapped to Tailwind
const PREDATOR_COLORS = ['cyan', 'indigo', 'fuchsia', 'emerald', 'amber'];

export const PREDATOR_CHART_COLORS = PREDATOR_COLORS;

export const AreaChart = (props: React.ComponentProps<typeof TremorAreaChart>) => (
  <TremorAreaChart
    colors={props.colors || PREDATOR_COLORS as any}
    className={`mt-4 h-72 ${props.className || ''}`}
    showAnimation={true}
    {...props}
  />
);

export const BarChart = (props: React.ComponentProps<typeof TremorBarChart>) => (
  <TremorBarChart
    colors={props.colors || PREDATOR_COLORS as any}
    className={`mt-4 h-72 ${props.className || ''}`}
    showAnimation={true}
    {...props}
  />
);

export const LineChart = (props: React.ComponentProps<typeof TremorLineChart>) => (
  <TremorLineChart
    colors={props.colors || PREDATOR_COLORS as any}
    className={`mt-4 h-72 ${props.className || ''}`}
    showAnimation={true}
    {...props}
  />
);

export const DonutChart = (props: React.ComponentProps<typeof TremorDonutChart>) => (
  <TremorDonutChart
    colors={props.colors || PREDATOR_COLORS as any}
    className={`mt-4 h-60 ${props.className || ''}`}
    showAnimation={true}
    {...props}
  />
);

// Sparkline — мініатюрний графік
export const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#00e5ff' }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
};

// Утиліти форматування
export const formatMetricValue = (value: number, unit?: string): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M${unit ? ' ' + unit : ''}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K${unit ? ' ' + unit : ''}`;
  return `${value}${unit ? ' ' + unit : ''}`;
};

export const formatDelta = (current: number, previous: number): string => {
  if (!previous) return '—';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

export const getDeltaType = (current: number, previous: number): DeltaType => {
  if (!previous) return 'unchanged';
  const pct = ((current - previous) / previous) * 100;
  if (pct > 5) return 'increase';
  if (pct > 0) return 'moderateIncrease';
  if (pct < -5) return 'decrease';
  if (pct < 0) return 'moderateDecrease';
  return 'unchanged';
};

// Аліаси для зворотної сумісності
export { AreaChart as PredatorAreaChart, BarChart as PredatorBarChart };
