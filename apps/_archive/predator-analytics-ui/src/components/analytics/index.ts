/**
 * Barrel exports — PREDATOR Analytics: Аналітичні компоненти
 */

// Перейменовані аліаси для зворотної сумісності
export { AreaChart as PredatorAreaChart, BarChart as PredatorBarChart, LineChart, DonutChart } from './TremorCharts';

// Типи та утиліти
export type { ChartDataPoint } from './TremorCharts';
export { PREDATOR_CHART_COLORS, Sparkline, formatMetricValue, formatDelta, getDeltaType } from './TremorCharts';
export type { DeltaType } from './TremorCharts';

// KPI
export { KPICardGrid } from './KPICardGrid';
export type { KPIMetric } from './KPICardGrid';

// Filters
export { AnalyticsFilters } from './AnalyticsFilters';
export type { FilterRule, FilterGroup, FilterableField, FilterOperator, FilterComparison } from './AnalyticsFilters';
