import type { DashboardOverview } from '@/services/api/dashboard';
import type { SystemStatsResponse, SystemStatusResponse } from '@/services/api/system';

export type SegmentKey = 'business' | 'banking' | 'government' | 'law' | 'regulators' | 'legal';
export type ClientPersona = 'BUSINESS' | 'BANKING' | 'GOVERNMENT' | 'INTELLIGENCE';
export type ClientsHubTone = 'emerald' | 'amber' | 'sky' | 'slate';

export interface ClientsHubMetric {
  label: string;
  value: string;
  hint: string;
}

export interface ClientsHubSummaryCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: ClientsHubTone;
}

export interface ClientsHubSegmentSnapshot {
  metrics: ClientsHubMetric[];
  statusLabel: string;
  note: string;
  tone: ClientsHubTone;
}

export interface ClientsHubSnapshot {
  lastUpdatedLabel: string | null;
  summary: ClientsHubSummaryCard[];
  segments: Record<SegmentKey, ClientsHubSegmentSnapshot>;
  hasAnyData: boolean;
}

const formatCount = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatCurrency = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value).toLocaleString('uk-UA')} $`;

const formatLatency = (value?: number | null): string =>
  value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} мс`;

const formatPair = (left?: number | null, right?: number | null): string =>
  left == null || right == null || !Number.isFinite(left) || !Number.isFinite(right)
    ? 'Н/д'
    : `${Math.round(left).toLocaleString('uk-UA')} / ${Math.round(right).toLocaleString('uk-UA')}`;

const formatDateTime = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const resolveTone = (metrics: ClientsHubMetric[]): ClientsHubTone => {
  const confirmed = metrics.filter((metric) => metric.value !== 'Н/д').length;

  if (confirmed === metrics.length) {
    return 'emerald';
  }

  if (confirmed > 0) {
    return 'amber';
  }

  return 'slate';
};

const resolveStatusLabel = (metrics: ClientsHubMetric[]): string => {
  const confirmed = metrics.filter((metric) => metric.value !== 'Н/д').length;

  if (confirmed === metrics.length) {
    return 'Підтверджено';
  }

  if (confirmed > 0) {
    return 'Частково підтверджено';
  }

  return 'Немає підтвердження';
};

const buildSegment = (metrics: ClientsHubMetric[], note: string): ClientsHubSegmentSnapshot => ({
  metrics,
  note,
  tone: resolveTone(metrics),
  statusLabel: resolveStatusLabel(metrics),
});

export const normalizeClientsHubSnapshot = (
  overview: DashboardOverview | null,
  systemStatus: SystemStatusResponse | null,
  systemStats: SystemStatsResponse | null,
): ClientsHubSnapshot => {
  const summary = overview?.summary;
  const serviceSummary = systemStatus?.summary;
  const topRiskCompanies = overview?.top_risk_companies.length ?? null;
  const alertsCount = overview?.alerts.length ?? null;
  const lastUpdatedLabel =
    formatDateTime(overview?.generated_at) ??
    formatDateTime(systemStatus?.timestamp) ??
    formatDateTime(systemStats?.timestamp);

  const segments: Record<SegmentKey, ClientsHubSegmentSnapshot> = {
    business: buildSegment(
      [
        {
          label: 'Декларацій',
          value: formatCount(summary?.total_declarations),
          hint: 'Підтверджено `/dashboard/overview.summary.total_declarations`.',
        },
        {
          label: 'Вартість потоку',
          value: formatCurrency(summary?.total_value_usd),
          hint: 'Підтверджено `/dashboard/overview.summary.total_value_usd`.',
        },
        {
          label: 'Документів пошуку',
          value: formatCount(summary?.search_documents ?? systemStats?.documents_total),
          hint: 'Підтверджено `/dashboard/overview.summary.search_documents` або `/system/stats.documents_total`.',
        },
      ],
      'Сегмент бізнесу спирається на реальний торговельний обсяг, індекс пошуку та фінансовий потік.',
    ),
    banking: buildSegment(
      [
        {
          label: 'Високий ризик',
          value: formatCount(summary?.high_risk_count),
          hint: 'Підтверджено `/dashboard/overview.summary.high_risk_count`.',
        },
        {
          label: 'Середній ризик',
          value: formatCount(summary?.medium_risk_count),
          hint: 'Підтверджено `/dashboard/overview.summary.medium_risk_count`.',
        },
        {
          label: 'Швидкість пошуку',
          value: formatCount(systemStats?.search_rate),
          hint: 'Підтверджено `/system/stats.search_rate`.',
        },
      ],
      'Фінансовий контур показує лише фактичні ризикові сигнали та темп пошуку з бекенду.',
    ),
    government: buildSegment(
      [
        {
          label: 'Імпортних записів',
          value: formatCount(summary?.import_count),
          hint: 'Підтверджено `/dashboard/overview.summary.import_count`.',
        },
        {
          label: 'Експортних записів',
          value: formatCount(summary?.export_count),
          hint: 'Підтверджено `/dashboard/overview.summary.export_count`.',
        },
        {
          label: 'Активних пайплайнів',
          value: formatCount(summary?.active_pipelines),
          hint: 'Підтверджено `/dashboard/overview.summary.active_pipelines`.',
        },
      ],
      'Державний контур опирається на митні агрегати й поточний стан обробки пайплайнів.',
    ),
    law: buildSegment(
      [
        {
          label: 'Вузлів графа',
          value: formatCount(summary?.graph_nodes),
          hint: 'Підтверджено `/dashboard/overview.summary.graph_nodes`.',
        },
        {
          label: 'Звʼязків графа',
          value: formatCount(summary?.graph_edges),
          hint: 'Підтверджено `/dashboard/overview.summary.graph_edges`.',
        },
        {
          label: 'Алертів',
          value: formatCount(alertsCount),
          hint: 'Підтверджено `/dashboard/overview.alerts`.',
        },
      ],
      'Правоохоронний контур використовує тільки графові агрегати та реальний список алертів.',
    ),
    regulators: buildSegment(
      [
        {
          label: 'Стан сервісів',
          value: formatPair(serviceSummary?.healthy, serviceSummary?.total),
          hint: 'Підтверджено `/system/status.summary`.',
        },
        {
          label: 'Завершених пайплайнів',
          value: formatCount(summary?.completed_pipelines),
          hint: 'Підтверджено `/dashboard/overview.summary.completed_pipelines`.',
        },
        {
          label: 'Індексів',
          value: formatCount(systemStats?.total_indices),
          hint: 'Підтверджено `/system/stats.total_indices`.',
        },
      ],
      'Контрольний контур показує технічну готовність системи й завершені цикли обробки без локальних оцінок.',
    ),
    legal: buildSegment(
      [
        {
          label: 'Ризикових компаній',
          value: formatCount(topRiskCompanies),
          hint: 'Підтверджено `/dashboard/overview.top_risk_companies`.',
        },
        {
          label: 'Векторів',
          value: formatCount(summary?.vectors),
          hint: 'Підтверджено `/dashboard/overview.summary.vectors`.',
        },
        {
          label: 'Середня затримка',
          value: formatLatency(systemStats?.avg_latency),
          hint: 'Підтверджено `/system/stats.avg_latency`.',
        },
      ],
      'Юридичний контур відображає лише підтверджені ризикові списки, векторну базу й затримку відповіді.',
    ),
  };

  const summaryCards: ClientsHubSummaryCard[] = [
    {
      id: 'declarations',
      label: 'Декларації',
      value: formatCount(summary?.total_declarations),
      hint: 'Сумарний обсяг з оглядового дашборду.',
      tone: 'sky',
    },
    {
      id: 'high-risk',
      label: 'Високий ризик',
      value: formatCount(summary?.high_risk_count),
      hint: 'Кількість високоризикових записів.',
      tone: 'amber',
    },
    {
      id: 'graph',
      label: 'Граф звʼязків',
      value: formatCount(summary?.graph_nodes),
      hint: 'Поточна кількість вузлів графа.',
      tone: 'amber',
    },
    {
      id: 'services',
      label: 'Справні сервіси',
      value: formatPair(serviceSummary?.healthy, serviceSummary?.total),
      hint: 'Стан системи з `/system/status.summary`.',
      tone: 'emerald',
    },
  ];

  return {
    lastUpdatedLabel,
    summary: summaryCards,
    segments,
    hasAnyData: [
      ...summaryCards.map((card) => card.value),
      ...Object.values(segments).flatMap((segment) => segment.metrics.map((metric) => metric.value)),
    ].some((value) => value !== 'Н/д'),
  };
};
