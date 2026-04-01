/**
 * PREDATOR Premium Widget Renderer
 * Рендерить різні типи віджетів для дашбордів
 * Повна українська локалізація
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Loader2, AlertTriangle,
  RefreshCw, Maximize2, Settings
} from 'lucide-react';
import { WidgetConfig, WidgetData } from './types';
import { cn } from '../../../utils/cn';
import { premiumLocales } from '../../../locales/uk/premium';

interface WidgetRendererProps {
  config: WidgetConfig;
  data: WidgetData;
  onRefresh?: () => void;
  onExpand?: () => void;
  onSettings?: () => void;
  isEditing?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const COLORS = {
  amber: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  cyan: ['#06b6d4', '#0891b2', '#0e7490', '#155e75'],
  emerald: ['#10b981', '#059669', '#047857', '#065f46'],
  rose: ['#f43f5e', '#e11d48', '#be123c', '#9f1239'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
  blue: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af']
};

// KPI Card Component
const KPICard: React.FC<{ config: WidgetConfig; data: any }> = ({ config, data }) => {
  const trend = data?.trend || 0;
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-rose-500' : 'text-slate-500';
  const colorScheme = config.style?.colorScheme || 'amber';

  return (
    <div className="h-full flex flex-col justify-center p-4">
      <div className={cn("text-[9px] font-black uppercase tracking-widest mb-2", `text-${colorScheme}-500/70`)}>
        {config.title}
      </div>
      <div className="flex items-end gap-3">
        <div className="text-3xl font-black text-white tracking-tight">
          {data?.value || '—'}
        </div>
        {trend !== 0 && (
          <div className={cn("flex items-center gap-1 text-xs font-bold mb-1", trendColor)}>
            <TrendIcon size={14} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      {data?.subValue && (
        <div className="text-[10px] text-slate-500 font-mono mt-1">{data.subValue}</div>
      )}
    </div>
  );
};

// Gauge Component
const GaugeWidget: React.FC<{ config: WidgetConfig; data: any }> = ({ config, data }) => {
  const value = data?.value || 0;
  const max = data?.max || 100;
  const percentage = (value / max) * 100;
  const colorScheme = config.style?.colorScheme || 'amber';
  const colors = COLORS[colorScheme];

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute inset-0 border-[8px] border-white/5 rounded-t-full" />
        <motion.div
          className="absolute inset-0 border-[8px] rounded-t-full origin-bottom"
          style={{
            borderColor: colors[0],
            clipPath: `polygon(0 100%, ${percentage}% 100%, ${percentage}% 0, 0 0)`
          }}
          initial={{ clipPath: 'polygon(0 100%, 0 100%, 0 0, 0 0)' }}
          animate={{ clipPath: `polygon(0 100%, ${percentage}% 100%, ${percentage}% 0, 0 0)` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="text-2xl font-black text-white mt-2">{value}</div>
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{config.title}</div>
    </div>
  );
};

// Data Table Component
const DataTableWidget: React.FC<{ config: WidgetConfig; data: any }> = ({ config, data }) => {
  const rows = data?.rows || [];
  const columns = data?.columns || [];

  return (
    <div className="h-full flex flex-col">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3 px-4 pt-4">
        {config.title}
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-slate-950">
            <tr>
              {columns.map((col: string, i: number) => (
                <th key={i} className="text-left px-4 py-2 font-black text-slate-300 uppercase tracking-widest border-b border-white/5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                {columns.map((col: string, j: number) => (
                  <td key={j} className="px-4 py-3 text-slate-200 font-mono group-hover/row:text-white transition-colors">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Chart Wrapper with common styling
const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="h-full flex flex-col p-4">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-3">
      {title}
    </div>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  </div>
);

// Main Widget Renderer
export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  config,
  data,
  onRefresh,
  onExpand,
  onSettings,
  isEditing = false
}) => {
  const colorScheme = config.style?.colorScheme || 'amber';
  const colors = COLORS[colorScheme];
  const variant = config.style?.variant || 'default';

  const containerClasses = cn(
    "relative rounded-3xl border overflow-hidden transition-all duration-300 h-full",
    variant === 'holographic' && "bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-black border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]",
    variant === 'glass' && "bg-white/5 backdrop-blur-xl border-white/10",
    variant === 'solid' && "bg-slate-900 border-slate-800",
    variant === 'default' && "bg-slate-900/60 border-white/5",
    isEditing && "cursor-move ring-2 ring-amber-500/50"
  );

  const renderContent = useMemo(() => {
    if (data.loading) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{premiumLocales.common.loadingData}</span>
        </div>
      );
    }

    if (data.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <span className="text-[10px] text-rose-400 text-center">{data.error}</span>
          {onRefresh && (
            <button onClick={onRefresh} className="text-[9px] text-amber-500 hover:underline">
              {'Спробувати знову'}
            </button>
          )}
        </div>
      );
    }

    switch (config.type) {
      case 'kpi_card':
        return <KPICard config={config} data={data.data} />;

      case 'gauge':
        return <GaugeWidget config={config} data={data.data} />;

      case 'table':
        return <DataTableWidget config={config} data={data.data} />;

      case 'area_chart':
        return (
          <ChartWrapper title={config.title}>
            <AreaChart data={data.data?.series || []}>
              <defs>
                <linearGradient id={`gradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                fill={`url(#gradient-${config.id})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartWrapper>
        );

      case 'bar_chart':
        return (
          <ChartWrapper title={config.title}>
            <BarChart data={data.data?.series || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartWrapper>
        );

      case 'pie_chart':
        return (
          <ChartWrapper title={config.title}>
            <PieChart>
              <Pie
                data={data.data?.series || []}
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"
                dataKey="value"
                paddingAngle={2}
              >
                {(data.data?.series || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '10px'
                }}
              />
              <Legend
                formatter={(value) => <span className="text-[9px] text-slate-400">{value}</span>}
              />
            </PieChart>
          </ChartWrapper>
        );

      case 'line_chart':
        return (
          <ChartWrapper title={config.title}>
            <LineChart data={data.data?.series || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis fontSize={8} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: colors[0] }}
              />
            </LineChart>
          </ChartWrapper>
        );

      case 'radar_chart':
        return (
          <ChartWrapper title={config.title}>
            <RadarChart data={data.data?.series || []}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 8 }} />
              <Radar
                name={config.title}
                dataKey="value"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
            </RadarChart>
          </ChartWrapper>
        );

      case 'funnel':
        return (
          <ChartWrapper title={config.title}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Funnel
                dataKey="value"
                data={data.data?.series || []}
                isAnimationActive
              >
                {(data.data?.series || []).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
                <LabelList position="right" fill="#fff" fontSize={10} />
              </Funnel>
            </FunnelChart>
          </ChartWrapper>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <span className="text-[10px] text-slate-500">{premiumLocales.common.notImplemented.replace('{type}', config.type)}</span>
          </div>
        );
    }
  }, [config, data, colors]);

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Holographic overlay effect */}
      {variant === 'holographic' && config.style?.animation && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
      )}

      {/* Widget Actions */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            title={premiumLocales.dashboardBuilder.canvas.refreshWidget}
          >
            <RefreshCw size={12} className="text-slate-400" />
          </button>
        )}
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-1.5 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            title={premiumLocales.dashboardBuilder.canvas.expandWidget}
          >
            <Maximize2 size={12} className="text-slate-400" />
          </button>
        )}
        {onSettings && (
          <button
            onClick={onSettings}
            className="p-1.5 bg-black/40 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            title={premiumLocales.dashboardBuilder.canvas.configureWidget}
          >
            <Settings size={12} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* Last Updated indicator */}
      {data.lastUpdated && (
        <div className="absolute bottom-2 right-2 text-[8px] text-slate-600 font-mono">
          {new Date(data.lastUpdated).toLocaleTimeString()}
        </div>
      )}

      {/* Content */}
      <div className="h-full group">
        {renderContent}
      </div>
    </motion.div>
  );
};

export default WidgetRenderer;
