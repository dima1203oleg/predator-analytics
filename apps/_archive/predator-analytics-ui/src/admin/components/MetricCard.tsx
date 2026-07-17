/* MetricCard — Classic Enterprise KPI Card */
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  /** 0.0 → 1.0 */
  progress?: number;
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  progress,
  icon,
  className = '',
}) => {
  const progressPct = progress !== undefined ? Math.min(progress * 100, 100) : undefined;
  const progressClass = progressPct !== undefined
    ? progressPct >= 90 ? 'crit'
    : progressPct >= 70 ? 'warn'
    : ''
    : '';

  const trendClass = trend !== undefined
    ? trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'
    : undefined;

  return (
    <div className={`admin-metric-card ${className}`}>
      <div className="admin-metric-label">{label}</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <span className="admin-metric-value">{value}</span>
          {unit && <span className="admin-metric-unit">{unit}</span>}
        </div>
        {icon && (
          <div style={{ color: 'var(--a-text-muted)', flexShrink: 0 }}>
            {icon}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className={`admin-metric-trend ${trendClass}`}>
          {trend > 0
            ? <TrendingUp size={10} />
            : trend < 0
            ? <TrendingDown size={10} />
            : <Minus size={10} />
          }
          {Math.abs(trend)}%
        </div>
      )}

      {progressPct !== undefined && (
        <div className="admin-metric-progress-track" style={{ marginTop: trend !== undefined ? '0.5rem' : '0.875rem' }}>
          <div
            className={`admin-metric-progress-bar ${progressClass}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};
