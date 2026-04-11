/**
 * 💰 KPI Card Component
 * Відображає ключові показники з трендами
 */

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  unit: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'orange' | 'red';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  previousValue,
  trend = 'stable',
  icon,
  color
}) => {
  const colorClasses = {
    green: 'from-green-900 to-green-800 border-green-700',
    blue: 'from-indigo-900 to-indigo-800 border-indigo-700',
    orange: 'from-orange-900 to-orange-800 border-orange-700',
    red: 'from-red-900 to-red-800 border-red-700'
  };

  const percentChange = previousValue && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp size={16} className="text-green-400" />;
    if (trend === 'down') return <ArrowDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${colorClasses[color]}
        border-2 rounded-lg p-6
        hover:shadow-xl hover:scale-105
        transition-all cursor-pointer
        h-full
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-300 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString('uk-UA', {
              maximumFractionDigits: 1
            }) : value}
            <span className="text-sm text-gray-400 ml-2">{unit}</span>
          </h3>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>

      {previousValue !== undefined && (
        <div className="space-y-2 border-t border-gray-600 pt-3">
          <p className="text-xs text-gray-400">
            Попередній період: {previousValue.toLocaleString()}
          </p>
          {percentChange !== 0 && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-sm font-bold ${getTrendColor()}`}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;

