/**
 * 📈 User Analytics Dashboard
 *
 * Аналітика користувачів та engagement
 * Активність, сесії, поведінка
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Search,
  BarChart3,
  PieChart,
  Globe,
  Smartphone,
  Monitor,
  Crown,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';

// ========================
// Types
// ========================

interface UserMetric {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}

interface TopPage {
  path: string;
  title: string;
  views: number;
  avgTime: string;
  bounceRate: number;
}

interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface ActivityHour {
  hour: number;
  users: number;
  sessions: number;
}

// ========================
// Mock Data
// ========================

const metrics: UserMetric[] = [
  { label: 'Активні користувачі', value: '2,847', change: 12.5, icon: Users, color: 'cyan' },
  { label: 'Нові сьогодні', value: '156', change: 8.3, icon: UserPlus, color: 'emerald' },
  { label: 'Середній час сесії', value: '12:34', change: -2.1, icon: Clock, color: 'purple' },
  { label: 'Переглядів сторінок', value: '45,678', change: 15.2, icon: Eye, color: 'amber' },
];

const topPages: TopPage[] = [
  { path: '/customs-premium', title: 'Customs Intelligence', views: 8934, avgTime: '4:23', bounceRate: 23.4 },
  { path: '/market-analytics', title: 'Market Analytics', views: 7654, avgTime: '5:12', bounceRate: 18.7 },
  { path: '/competitors', title: 'Competitor Analysis', views: 6543, avgTime: '3:45', bounceRate: 25.1 },
  { path: '/suppliers', title: 'Supplier Discovery', views: 5432, avgTime: '6:01', bounceRate: 15.3 },
  { path: '/risk-scoring', title: 'Risk Scoring', views: 4321, avgTime: '7:34', bounceRate: 12.8 },
];

const segments: UserSegment[] = [
  { name: 'Business', count: 1456, percentage: 45, color: 'cyan' },
  { name: 'Government', count: 823, percentage: 25, color: 'purple' },
  { name: 'Premium', count: 567, percentage: 17, color: 'amber' },
  { name: 'Free', count: 421, percentage: 13, color: 'slate' },
];

const deviceData = [
  { device: 'Desktop', percentage: 68, icon: Monitor, color: 'cyan' },
  { device: 'Mobile', percentage: 28, icon: Smartphone, color: 'purple' },
  { device: 'Tablet', percentage: 4, icon: Monitor, color: 'amber' },
];

const hourlyActivity: ActivityHour[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  users: Math.floor(50 + Math.random() * 200 * (hour >= 9 && hour <= 18 ? 2 : 0.5)),
  sessions: Math.floor(70 + Math.random() * 300 * (hour >= 9 && hour <= 18 ? 2 : 0.5))
}));

// ========================
// Components
// ========================

const MetricCard: React.FC<{ metric: UserMetric }> = ({ metric }) => {
  const Icon = metric.icon;

  return (
    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${metric.color}-500/20`}>
          <Icon className={`text-${metric.color}-400`} size={18} />
        </div>
        <div className={`flex items-center gap-1 text-xs ${
          metric.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {metric.change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(metric.change)}%
        </div>
      </div>
      <p className="text-2xl font-black text-white">{metric.value}</p>
      <p className="text-xs text-slate-500 mt-1">{metric.label}</p>
    </div>
  );
};

const HourlyChart: React.FC<{ data: ActivityHour[] }> = ({ data }) => {
  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Активність по годинах</h3>
        <span className="text-xs text-slate-500">Сьогодні</span>
      </div>

      <div className="h-32 flex items-end gap-1">
        {data.map((hour, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(hour.users / maxUsers) * 100}%` }}
              transition={{ delay: i * 0.02 }}
              className={`w-full rounded-t ${
                hour.hour >= 9 && hour.hour <= 18 ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
              style={{ minHeight: '4px' }}
            />
            {i % 4 === 0 && (
              <span className="text-[10px] text-slate-600">{hour.hour}:00</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ========================
// Main Component
// ========================

const UserAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Users className="text-cyan-400" />
              User Analytics
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Admin
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Аналітика користувачів та поведінки
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900/60 border border-white/10 rounded-xl p-1">
              {['today', 'week', 'month'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as typeof timeRange)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {range === 'today' ? 'Сьогодні' : range === 'week' ? 'Тиждень' : 'Місяць'}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">
              <Download size={16} />
              Експорт
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, i) => (
            <MetricCard key={i} metric={metric} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Hourly Activity */}
          <div className="lg:col-span-2">
            <HourlyChart data={hourlyActivity} />
          </div>

          {/* Devices */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <h3 className="font-bold text-white mb-4">Пристрої</h3>
            <div className="space-y-4">
              {deviceData.map((device, i) => {
                const Icon = device.icon;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`text-${device.color}-400`} size={16} />
                        <span className="text-sm text-white">{device.device}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{device.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${device.percentage}%` }}
                        className={`h-full bg-${device.color}-500 rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">ТОП сторінки</h3>
              <button className="text-xs text-cyan-400">Всі</button>
            </div>

            <div className="space-y-3">
              {topPages.map((page, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-lg font-black text-slate-600 w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{page.title}</p>
                    <p className="text-xs text-slate-500">{page.path}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-white">{page.views.toLocaleString()}</p>
                    <p className="text-slate-500">переглядів</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-cyan-400">{page.avgTime}</p>
                    <p className="text-slate-500">ср. час</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Segments */}
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Сегменти користувачів</h3>
              <span className="text-xs text-slate-500">{segments.reduce((acc, s) => acc + s.count, 0).toLocaleString()} всього</span>
            </div>

            <div className="space-y-4">
              {segments.map((segment, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${segment.color}-500`} />
                      <span className="text-sm text-white">{segment.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{segment.count.toLocaleString()}</span>
                      <span className="text-xs text-slate-500">({segment.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${segment.percentage}%` }}
                      transition={{ delay: i * 0.1 }}
                      className={`h-full bg-${segment.color}-500 rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Conversion Rate</p>
                  <p className="text-xs text-amber-400">Free → Paid</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-amber-400">4.2%</p>
                  <p className="text-xs text-emerald-400">+0.5% vs минулий місяць</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time */}
        <div className="mt-8 p-4 bg-slate-900/40 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="text-emerald-400" size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div>
                <p className="font-bold text-white">Real-time користувачі</p>
                <p className="text-xs text-slate-500">Останнє оновлення: щойно</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">247</p>
                <p className="text-xs text-slate-500">Зараз онлайн</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-cyan-400">12</p>
                <p className="text-xs text-slate-500">Нових за хвилину</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;
