import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSearch, Sparkles, TrendingDown, TrendingUp, Users } from 'lucide-react';
import React from 'react';

interface BusinessMetric {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  target?: number;
}

interface BusinessMetricsDashboardProps {
  metrics: {
    acquisition: BusinessMetric[];
    engagement: BusinessMetric[];
    retention: BusinessMetric[];
    value: BusinessMetric[];
  };
  period?: string;
  comparisonPeriod?: string;
}

function formatMetricValue(value: number | string, format?: string): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        maximumFractionDigits: 0
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      if (value < 60) return `${Math.round(value)}с`;
      if (value < 3600) return `${Math.round(value / 60)}хв`;
      return `${(value / 3600).toFixed(1)}год`;
    case 'number':
    default:
      return new Intl.NumberFormat('uk-UA').format(value);
  }
}

function MetricCard({ metric }: { metric: BusinessMetric }) {
  const trendColor = metric.trend === 'up' ? 'text-green-600' :
                     metric.trend === 'down' ? 'text-red-600' :
                     'text-gray-600';

  const TrendIcon = metric.trend === 'up' ? TrendingUp :
                    metric.trend === 'down' ? TrendingDown :
                    null;

  const progress = metric.target
    ? Math.min(100, (Number(metric.value) / metric.target) * 100)
    : undefined;

  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {metric.icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              {metric.icon}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-bold mt-1">
              {formatMetricValue(metric.value, metric.format)}
            </p>
          </div>
        </div>
      </div>

      {metric.change !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          {TrendIcon && <TrendIcon className="h-4 w-4" />}
          <span className="font-medium">
            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
          </span>
          {metric.changeLabel && (
            <span className="text-muted-foreground ml-1">{metric.changeLabel}</span>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>До цілі</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress >= 100 ? 'bg-green-500' :
                progress >= 75 ? 'bg-blue-500' :
                progress >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function BusinessMetricsDashboard({
  metrics,
  period = 'За останній місяць',
  comparisonPeriod = 'порівняно з попереднім'
}: BusinessMetricsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Бізнес-метрики</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {period} • {comparisonPeriod}
          </p>
        </div>
      </div>

      {/* Acquisition Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Залучення
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.acquisition.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-purple-600" />
            Активність
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.engagement.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Retention Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Утримання
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.retention.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Value Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Цінність
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.value.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Indicator */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Загальний стан системи</h3>
              <p className="text-sm text-muted-foreground">
                Всі критичні метрики в нормі
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Operational
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Example usage component
export function BusinessMetricsExample() {
  const exampleMetrics = {
    acquisition: [
      {
        label: 'Нові користувачі',
        value: 1247,
        change: 15.3,
        changeLabel: 'за місяць',
        trend: 'up' as const,
        icon: <Users className="h-5 w-5 text-blue-600" />,
        target: 1500
      },
      {
        label: 'Конверсія Trial→Paid',
        value: 23.4,
        format: 'percentage' as const,
        change: 3.2,
        trend: 'up' as const,
        target: 25
      },
    ],
    engagement: [
      {
        label: 'DAU',
        value: 8934,
        change: 8.1,
        trend: 'up' as const
      },
      {
        label: 'Пошуків на користувача',
        value: 12.3,
        change: -2.1,
        trend: 'down' as const
      },
    ],
    retention: [
      {
        label: 'Churn Rate',
        value: 4.2,
        format: 'percentage' as const,
        change: -1.3,
        trend: 'up' as const
      },
      {
        label: 'Retention Day 30',
        value: 78.5,
        format: 'percentage' as const,
        change: 5.2,
        trend: 'up' as const,
        target: 80
      },
    ],
    value: [
      {
        label: 'MRR',
        value: 284500,
        format: 'currency' as const,
        change: 12.8,
        trend: 'up' as const
      },
      {
        label: 'ARPU',
        value: 2999,
        format: 'currency' as const,
        change: 3.4,
        trend: 'up' as const
      },
    ],
  };

  return <BusinessMetricsDashboard metrics={exampleMetrics} />;
}
