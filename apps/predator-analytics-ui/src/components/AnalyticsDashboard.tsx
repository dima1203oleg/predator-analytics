/**
 * 📊 Premium Analytics Dashboard - Власні Графіки
 *
 * Заміна OpenSearch Dashboards на власні красиві графіки
 * Без потреби в логіні/паролі
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Activity,
  PieChart,
  LineChart,
  RefreshCw,
  Maximize2,
  Minimize2,
  Download,
  Calendar
} from 'lucide-react';

interface AnalyticsDashboardProps {
  height?: number;
  title?: string;
  showHeader?: boolean;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  height = 600,
  title = 'Аналітика Системи',
  showHeader = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState({
    requests: [] as number[],
    latency: [] as number[],
    errors: [] as number[],
    success: 0,
    total: 0
  });

  useEffect(() => {
    // Generate realistic mock data
    const generateData = () => {
      const hours = 24;
      const requests = Array.from({ length: hours }, () =>
        Math.floor(Math.random() * 1000) + 500
      );
      const latency = Array.from({ length: hours }, () =>
        Math.floor(Math.random() * 200) + 50
      );
      const errors = Array.from({ length: hours }, () =>
        Math.floor(Math.random() * 50)
      );
      const total = requests.reduce((a, b) => a + b, 0);
      const errorCount = errors.reduce((a, b) => a + b, 0);

      setData({
        requests,
        latency,
        errors,
        success: ((total - errorCount) / total * 100),
        total
      });
    };

    generateData();
    const interval = setInterval(generateData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const maxRequests = Math.max(...data.requests);
  const maxLatency = Math.max(...data.latency);

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-slate-950'
    : 'relative';

  return (
    <motion.div
      className={`${containerClass} overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/40 backdrop-blur-md shadow-2xl shadow-cyan-900/20`}
      layout
      transition={{ duration: 0.3 }}
    >
      {/* Cinematic HUD Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]">
        <div className="h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] animate-scanline" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(34,211,238,0.1),transparent)]" />
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/10 bg-slate-900/30 backdrop-blur-xl relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white/90">{title}</h3>
              <p className="text-[10px] uppercase font-bold tracking-tighter text-cyan-500/60">Predator Nexus Live Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
              {['1h', '24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setData({ ...data })}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-gray-400" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-400" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-400" />
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Всього Запитів</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{data.total.toLocaleString()}</div>
          <div className="text-xs text-green-400 mt-1">+12.5% за добу</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Success Rate</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{data.success.toFixed(1)}%</div>
          <div className="text-xs text-green-400 mt-1">Відмінно</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Avg Latency</span>
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {Math.round(data.latency.reduce((a, b) => a + b, 0) / data.latency.length)}ms
          </div>
          <div className="text-xs text-green-400 mt-1">-8% за добу</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Помилки</span>
            <Activity className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {data.errors.reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-xs text-red-400 mt-1">+2.1% за добу</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* Requests Chart */}
        <div className="bg-slate-800/50 border border-cyan-500/20 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            Запити за Годинами
          </h4>
          <div className="h-64 flex items-end gap-1">
            {data.requests.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / maxRequests) * 100}%` }}
                transition={{ delay: index * 0.02 }}
                className="flex-1 bg-gradient-to-t from-cyan-600 to-blue-500 rounded-t-lg relative group"
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value} запитів
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>24h тому</span>
            <span>Зараз</span>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Латентність (ms)
          </h4>
          <div className="h-64 flex items-end gap-1">
            {data.latency.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / maxLatency) * 100}%` }}
                transition={{ delay: index * 0.02 }}
                className="flex-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-lg relative group"
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value}ms
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>24h тому</span>
            <span>Зараз</span>
          </div>
        </div>

        {/* Error Distribution */}
        <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-400" />
            Розподіл Помилок
          </h4>
          <div className="space-y-3">
            {[
              { type: '4xx Client Errors', value: 65, color: 'from-yellow-600 to-orange-600' },
              { type: '5xx Server Errors', value: 25, color: 'from-red-600 to-rose-600' },
              { type: 'Timeout', value: 8, color: 'from-purple-600 to-pink-600' },
              { type: 'Network', value: 2, color: 'from-blue-600 to-cyan-600' }
            ].map((error, index) => (
              <div key={error.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">{error.type}</span>
                  <span className="text-sm font-bold text-white">{error.value}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${error.value}%` }}
                    transition={{ delay: index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${error.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="bg-slate-800/50 border border-green-500/20 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Топ Endpoints
          </h4>
          <div className="space-y-3">
            {[
              { endpoint: '/api/v1/search', requests: 12453, latency: 45 },
              { endpoint: '/api/v1/declarations', requests: 8932, latency: 78 },
              { endpoint: '/api/v1/companies', requests: 6721, latency: 52 },
              { endpoint: '/api/v1/analytics', requests: 4532, latency: 123 },
              { endpoint: '/api/v1/reports', requests: 3211, latency: 89 }
            ].map((endpoint, index) => (
              <motion.div
                key={endpoint.endpoint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{endpoint.endpoint}</div>
                  <div className="text-xs text-gray-400">{endpoint.requests.toLocaleString()} запитів</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">{endpoint.latency}ms</div>
                  <div className="text-xs text-gray-500">avg</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
