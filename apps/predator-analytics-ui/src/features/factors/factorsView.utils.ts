import type { DashboardAlert, DashboardOverview } from '@/services/api/dashboard';
import type { FactoryStats } from '@/features/factory/types';
import type { SystemStatsResponse } from '@/services/api/system';

export type FactorTone = 'yellow' | 'amber' | 'emerald' | 'cyan' | 'slate';

export interface FactorStatCard {
    label: string;
    value: string;
    hint: string;
    tone: FactorTone;
}

export interface FactorModuleCard {
    id: string;
    label: string;
    path: string;
    description: string;
    tone: FactorTone;
    metrics: Array<{
        label: string;
        value: string;
    }>;
    statusLabel: string;
}

export interface FactorSignalItem {
    id: string;
    title: string;
    subtitle: string;
    timestampLabel: string;
    severityLabel: string;
    tone: FactorTone;
}

export interface FactorsSnapshot {
    summary: {
        activeFactors: string;
        anomalyCount: string;
        systemLoad: string;
    };
    quickStats: FactorStatCard[];
    modules: FactorModuleCard[];
    signals: FactorSignalItem[];
    lastUpdatedLabel: string | null;
    hasAnyData: boolean;
}

const formatCount = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : Math.round(value).toLocaleString('uk-UA');

const formatPercent = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)}%`;

const formatLatency = (value?: number | null): string =>
    value == null || !Number.isFinite(value) ? 'Н/д' : `${Math.round(value)} мс`;

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

const getAlertTone = (severity?: DashboardAlert['severity']): FactorTone => {
    if (severity === 'critical') {
        return 'amber';
    }

    if (severity === 'warning') {
        return 'amber';
    }

    return 'cyan';
};

const getSeverityLabel = (severity?: DashboardAlert['severity']): string => {
    if (severity === 'critical') {
        return 'Критично';
    }

    if (severity === 'warning') {
        return 'Попередження';
    }

    return 'Інформація';
};

const countAlertsBySeverity = (
    alerts: DashboardAlert[] | null,
    severity?: DashboardAlert['severity'],
): number | null => {
    if (!alerts) {
        return null;
    }

    if (!severity) {
        return alerts.length;
    }

    return alerts.filter((alert) => alert.severity === severity).length;
};

const buildSignals = (alerts: DashboardAlert[] | null): FactorSignalItem[] => {
    if (!alerts) {
        return [];
    }

    return [...alerts]
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
        .slice(0, 5)
        .map((alert) => ({
            id: alert.id,
            title: alert.message,
            subtitle: [alert.company, alert.sector].filter(Boolean).join(' • ') || 'Без додаткового контексту',
            timestampLabel: formatDateTime(alert.timestamp) ?? 'Н/д',
            severityLabel: getSeverityLabel(alert.severity),
            tone: getAlertTone(alert.severity),
        }));
};

export const normalizeFactorsSnapshot = (
    factoryStats: FactoryStats | null,
    overview: DashboardOverview | null,
    systemStats: SystemStatsResponse | null,
): FactorsSnapshot => {
    const summary = overview?.summary ?? null;
    const alerts = overview?.alerts ?? null;
    const anomalyCount = alerts ? alerts.filter((alert) => alert.severity !== 'info').length : null;
    const criticalAlertCount = countAlertsBySeverity(alerts, 'critical');
    const warningAlertCount = countAlertsBySeverity(alerts, 'warning');
    const totalAlertCount = countAlertsBySeverity(alerts);
    const hasAnyData = Boolean(factoryStats || overview || systemStats);

    return {
        summary: {
            activeFactors: formatCount(factoryStats?.total_patterns ?? null),
            anomalyCount: formatCount(anomalyCount),
            systemLoad: formatPercent(systemStats?.cpu_percent ?? null),
        },
        quickStats: [
            {
                label: 'Вузли графа',
                value: formatCount(summary?.graph_nodes ?? null),
                hint: 'Підтверджені сутності з агрегованого огляду.',
                tone: 'yellow',
            },
            {
                label: 'Пошукові документи',
                value: formatCount(summary?.search_documents ?? null),
                hint: 'Документи, доступні для аналітики і пошуку.',
                tone: 'emerald',
            },
            {
                label: 'Активні пайплайни',
                value: formatCount(summary?.active_pipelines ?? null),
                hint: 'Поточні обробки, що ще не завершені.',
                tone: 'amber',
            },
            {
                label: 'Середня затримка API',
                value: formatLatency(systemStats?.avg_latency ?? null),
                hint: 'Підтверджено `/system/stats.avg_latency`.',
                tone: 'cyan',
            },
        ],
        modules: [
            {
                id: 'factory',
                label: 'Фабрика факторів',
                path: '/system-factory',
                description: 'Оркестрація патернів, запусків і якості факторних моделей без локально намальованих показників.',
                tone: 'yellow',
                metrics: [
                    { label: 'Патернів', value: formatCount(factoryStats?.total_patterns ?? null) },
                    { label: 'Золотих', value: formatCount(factoryStats?.gold_patterns ?? null) },
                ],
                statusLabel: factoryStats ? 'Підтверджено з /factory/stats' : 'Немає підтверджених даних',
            },
            {
                id: 'risk-scoring',
                label: 'Оцінкаризику',
                path: '/risk-scoring',
                description: 'Оцінка критичних і середніхризиків на базі агрегованого огляду системи.',
                tone: 'amber',
                metrics: [
                    { label: 'Високийризик', value: formatCount(summary?.high_risk_count ?? null) },
                    { label: 'Середнійризик', value: formatCount(summary?.medium_risk_count ?? null) },
                ],
                statusLabel: summary ? 'Агреговано з /dashboard/overview' : 'Оглядризиків не повернуто',
            },
            {
                id: 'aml',
                label: 'AML та сигнали',
                path: '/aml',
                description: 'Живий контур критичних і попереджувальних алертів, які потребують перевірки у модулі AML.',
                tone: 'amber',
                metrics: [
                    { label: 'Критичних', value: formatCount(criticalAlertCount) },
                    { label: 'Попереджень', value: formatCount(warningAlertCount) },
                ],
                statusLabel: alerts ? `Сигналів у стрічці: ${formatCount(totalAlertCount)}` : 'Алерти не повернуті',
            },
        ],
        signals: buildSignals(alerts),
        lastUpdatedLabel: formatDateTime(overview?.generated_at ?? systemStats?.timestamp ?? factoryStats?.last_run ?? null),
        hasAnyData,
    };
};
