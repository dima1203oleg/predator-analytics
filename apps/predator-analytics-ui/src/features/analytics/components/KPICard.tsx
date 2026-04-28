/**
 * 💰 KPI Card Component | v61.0-ELITE
 * PREDATOR Analytics — Ключові показники
 * Sovereign Power Design · Classified · Tier-1
 */

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface KPICardProps {
  title: string;
  value: number | string;
  unit: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: 'gold' | 'amber' | 'emerald' | 'danger';
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
  const colorClasses: Record<KPICardProps['color'], string> = {
    gold: 'from-amber-600/20 via-black/40 to-black/60 border-amber-500/30 shadow-[0_0_30px_rgba(212,175,55,0.1)]',
    amber: 'from-amber-900/30 via-black/40 to-black/60 border-amber-700/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]',
    emerald: 'from-emerald-900/20 via-black/40 to-black/60 border-emerald-500/20',
    danger: 'from-amber-950/40 via-black/40 to-black/60 border-amber-900/50 shadow-[0_0_40px_rgba(217,119,6,0.1)]'
  };

  const percentChange = previousValue && typeof value === 'number' && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp size={16} className="text-emerald-400" />;
    if (trend === 'down') return <ArrowDown size={16} className="text-amber-500" />;
    return <Minus size={16} className="text-slate-500" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-amber-500';
    return 'text-slate-500';
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br border-2 p-10 backdrop-blur-3xl transition-all duration-500 group cursor-crosshair rounded-[3rem] shadow-4xl",
        colorClasses[color]
      )}
    >
      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500/30 to-transparent opacity-20 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-8 overflow-hidden">
        <div className="flex-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4 italic group-hover:text-amber-500/60 transition-colors">{title}</p>
          <h3 className="text-4xl font-black text-white italic tracking-tighter skew-x-[-3deg] group-hover:scale-105 transition-transform origin-left font-serif">
            {typeof value === 'number' ? value.toLocaleString('uk-UA', {
              maximumFractionDigits: 1
            }) : value}
            <span className="text-xs text-slate-500 ml-4 font-mono not-italic tracking-normal">{unit}</span>
          </h3>
        </div>
        <div className="text-5xl opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          {icon}
        </div>
      </div>

      {previousValue !== undefined && (
        <div className="space-y-4 border-t border-white/5 pt-6 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">PREV_CYCLE</span>
            <span className="text-[9px] text-slate-400 font-mono italic">{previousValue.toLocaleString()} {unit}</span>
          </div>
          {percentChange !== 0 && (
            <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">VARIANCE_CORE</span>
              <div className="flex items-center gap-3">
                {getTrendIcon()}
                <span className={cn("text-xs font-black italic tracking-wider", getTrendColor())}>
                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
