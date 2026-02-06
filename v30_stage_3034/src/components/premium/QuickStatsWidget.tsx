import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Database, Zap, Users, Activity,
  TrendingUp, Server, Shield, Clock
} from 'lucide-react';
import { premiumLocales } from '../../locales/uk/premium';

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
}

interface QuickStatsWidgetProps {
  stats: StatItem[];
  title?: string;
  className?: string;
}

const colorMap = {
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
    gradient: 'from-cyan-500 to-blue-500',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
    gradient: 'from-purple-500 to-pink-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
    gradient: 'from-emerald-500 to-teal-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
    gradient: 'from-rose-500 to-red-500',
  },
};

const StatCard: React.FC<{ stat: StatItem; index: number }> = ({ stat, index }) => {
  const colors = colorMap[stat.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        ${colors.bg} border ${colors.border}
        backdrop-blur-xl cursor-pointer
        hover:shadow-lg ${colors.glow}
        transition-shadow duration-300
        group
      `}
    >
      {/* Background Gradient Effect */}
      <div
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100
          bg-gradient-to-br ${colors.gradient}
          transition-opacity duration-500
        `}
        style={{ opacity: 0.05 }}
      />

      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-xl ${colors.bg} border ${colors.border}
        flex items-center justify-center mb-3
        group-hover:scale-110 transition-transform duration-300
      `}>
        <div className={colors.text}>
          {stat.icon}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-black ${colors.text} font-mono tracking-tight`}>
          {stat.value}
        </span>
        {stat.change !== undefined && (
          <span className={`
            text-xs font-bold flex items-center gap-0.5
            ${stat.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          `}>
            <TrendingUp
              size={12}
              className={stat.change < 0 ? 'rotate-180' : ''}
            />
            {Math.abs(stat.change)}%
          </span>
        )}
      </div>

      {/* Label */}
      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
        {stat.label}
      </div>

      {/* Animated Pulse */}
      <div className={`
        absolute top-3 right-3 w-2 h-2 rounded-full ${colors.bg}
        animate-pulse
      `}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.gradient} opacity-60`} />
      </div>
    </motion.div>
  );
};

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  stats,
  title = premiumLocales.quickStats.title,
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center">
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
            <p className="text-[10px] text-slate-500 font-mono">REAL-TIME · AUTO-UPDATE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="status-online" />
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>
    </div>
  );
};

// Export preset configurations
export const defaultSystemStats: StatItem[] = [
  { label: premiumLocales.quickStats.labels.activeAgents, value: 12, change: 15, icon: <Brain size={18} />, color: 'cyan' },
  { label: premiumLocales.quickStats.labels.documents, value: '24.5K', change: 8, icon: <Database size={18} />, color: 'purple' },
  { label: premiumLocales.quickStats.labels.cpuLoad, value: '67%', icon: <Server size={18} />, color: 'emerald' },
  { label: premiumLocales.quickStats.labels.requestsPerSecond, value: 1847, change: 23, icon: <Zap size={18} />, color: 'amber' },
];

export default QuickStatsWidget;
