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

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Generate realistic mock data
    const generateData = async () => {
      setRefreshing(true);
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
      setTimeout(() => setRefreshing(false), 800);
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
      className={`${containerClass} glass-wraith overflow-hidden rounded-[2rem] border-rose-500/20 shadow-2xl`}
      layout
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Cinematic HUD Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 opacity-[0.05]">
        <div className="h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(244,63,94,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,4px_100%] animate-scanline" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(244,63,94,0.15),transparent)]" />
      
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-8 py-6 border-b border-rose-500/10 bg-black/40 backdrop-blur-2xl relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-rose-500/20 to-rose-900/20 border border-rose-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] group cursor-pointer">
              <BarChart3 className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-white italic">{title}</h3>
              </div>
              <p className="text-[10px] uppercase font-black tracking-[0.4em] text-rose-500/50">PREDATOR_NEXUS_v60_LIVE_SYNC</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-black/60 rounded-xl p-1 border border-white/5">
              {['1h', '24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    timeRange === range
                      ? 'bg-rose-500 text-black shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setData({ ...data })}
                className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-rose-500' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
        {[
          { label: 'Всього Запитів', value: data.total.toLocaleString(), trend: '+12.5%', color: 'rose', icon: Activity },
          { label: 'Success Rate', value: `${data.success.toFixed(1)}%`, trend: 'Оптимально', color: 'emerald', icon: TrendingUp },
          { label: 'Avg Latency', value: `${Math.round(data.latency.reduce((a, b) => a + b, 0) / data.latency.length)}ms`, trend: '-8%', color: 'indigo', icon: Activity },
          { label: 'Помилки', value: data.errors.reduce((a, b) => a + b, 0), trend: '+2.1%', color: 'amber', icon: Activity }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-6 rounded-[1.5rem] border relative overflow-hidden group",
              stat.color === 'rose' ? "bg-rose-500/5 border-rose-500/20" :
              stat.color === 'emerald' ? "bg-emerald-500/5 border-emerald-500/20" :
              stat.color === 'indigo' ? "bg-indigo-500/5 border-indigo-500/20" :
              "bg-amber-500/5 border-amber-500/20"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">{stat.label}</span>
              <stat.icon className={cn(
                "w-4 h-4",
                stat.color === 'rose' ? "text-rose-500" :
                stat.color === 'emerald' ? "text-emerald-500" :
                stat.color === 'indigo' ? "text-indigo-500" :
                "text-amber-500"
              )} />
            </div>
            <div className="text-4xl font-black text-white italic tracking-tighter mb-1 relative z-10">{stat.value}</div>
            <div className={cn(
              "text-[9px] font-black uppercase tracking-widest relative z-10",
              stat.color === 'rose' || stat.trend.includes('-') ? "text-rose-500" : "text-emerald-500"
            )}>{stat.trend} ЗА_ДОБУ</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 pt-0">
        {/* Requests Chart */}
        <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.02]" />
          <h4 className="text-[11px] font-black text-white/80 mb-8 flex items-center gap-3 uppercase tracking-[0.4em] italic">
            <div className="p-2 bg-rose-500/10 rounded-lg"><LineChart className="w-4 h-4 text-rose-500" /></div>
            ЗАПИТИ_ПО_ГОДИНАХ
          </h4>
          <div className="h-64 flex items-end gap-1.5 px-2">
            {data.requests.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / maxRequests) * 100}%` }}
                transition={{ delay: index * 0.02, duration: 1, ease: "circOut" }}
                className="flex-1 bg-gradient-to-t from-rose-600/40 via-rose-500/20 to-rose-400/10 rounded-t-lg relative group/bar border-t border-rose-500/30"
              >
                <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-black border border-rose-500/40 px-3 py-1.5 rounded-xl text-[10px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-all scale-90 group-hover/bar:scale-100 shadow-[0_0_20px_rgba(225,29,72,0.4)] z-30 whitespace-nowrap">
                  {value} REQ
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-6 text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">
            <span>T-24_HOURS</span>
            <span>CURRENT_TIMESTAMP</span>
          </div>
        </div>

        {/* Latency Chart */}
        <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group shadow-xl">
          <div className="absolute inset-0 cyber-scan-grid opacity-[0.02]" />
          <h4 className="text-[11px] font-black text-white/80 mb-8 flex items-center gap-3 uppercase tracking-[0.4em] italic">
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Activity className="w-4 h-4 text-indigo-500" /></div>
            ЛАТЕНТНІСТЬ_МЕРЕЖІ
          </h4>
          <div className="h-64 flex items-end gap-1.5 px-2">
            {data.latency.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / maxLatency) * 100}%` }}
                transition={{ delay: index * 0.02, duration: 1, ease: "circOut" }}
                className="flex-1 bg-gradient-to-t from-indigo-600/40 via-indigo-500/20 to-indigo-400/10 rounded-t-lg relative group/bar border-t border-indigo-500/30"
              >
                <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-black border border-indigo-500/40 px-3 py-1.5 rounded-xl text-[10px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-all scale-90 group-hover/bar:scale-100 shadow-[0_0_20px_rgba(99,102,241,0.4)] z-30 whitespace-nowrap">
                  {value} MS
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-6 text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">
            <span>STABLE_NODE</span>
            <span>REALTIME_SCAN</span>
          </div>
        </div>

        {/* Error Distribution & Top Endpoints Row */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
              <h4 className="text-[11px] font-black text-white/80 mb-8 flex items-center gap-3 uppercase tracking-[0.4em] italic">
                <div className="p-2 bg-amber-500/10 rounded-lg"><PieChart className="w-4 h-4 text-amber-500" /></div>
                АНАЛІЗ_ПОМИЛОК
              </h4>
              <div className="space-y-6">
                {[
                  { type: '4xx Client Errors', value: 65, color: 'rose' },
                  { type: '5xx Server Errors', value: 25, color: 'amber' },
                  { type: 'Timeout', value: 8, color: 'indigo' },
                  { type: 'Network', value: 2, color: 'emerald' }
                ].map((error, index) => (
                  <div key={error.type} className="group/item">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/item:text-white transition-colors">{error.type}</span>
                      <span className="text-[10px] font-mono font-black text-white">{error.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${error.value}%` }}
                        transition={{ delay: index * 0.1, duration: 1.5, ease: "circOut" }}
                        className={cn(
                          "h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]",
                          error.color === 'rose' ? "bg-rose-500 shadow-rose-500/40" :
                          error.color === 'amber' ? "bg-amber-500 shadow-amber-500/40" :
                          error.color === 'indigo' ? "bg-indigo-500 shadow-indigo-500/40" :
                          "bg-emerald-500 shadow-emerald-500/40"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
              <h4 className="text-[11px] font-black text-white/80 mb-8 flex items-center gap-3 uppercase tracking-[0.4em] italic">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                КРИТИЧНІ_ЕНДПОЇНТИ
              </h4>
              <div className="space-y-3">
                {[
                  { endpoint: '/api/v1/search', requests: 12453, latency: 45 },
                  { endpoint: '/api/v1/declarations', requests: 8932, latency: 78 },
                  { endpoint: '/api/v1/companies', requests: 6721, latency: 52 },
                  { endpoint: '/api/v1/analytics', requests: 4532, latency: 123 },
                ].map((endpoint, index) => (
                  <motion.div
                    key={endpoint.endpoint}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] hover:border-rose-500/20 transition-all group/endpoint cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="text-[11px] font-black text-slate-300 group-hover/endpoint:text-white uppercase tracking-tight">{endpoint.endpoint}</div>
                      <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{endpoint.requests.toLocaleString()} REQS</div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-xs font-black italic",
                        endpoint.latency > 100 ? "text-rose-500" : "text-emerald-500"
                      )}>{endpoint.latency}MS</div>
                      <div className="text-[7px] font-black text-slate-700 uppercase tracking-widest">AVG_LATENCY</div>
                    </div>
                  </motion.div>
                ))}
              </div>
           </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <div className="bg-black/60 border-t border-rose-500/10 h-10 flex items-center overflow-hidden">
         <div className="flex items-center gap-8 px-6 whitespace-nowrap animate-marquee text-[8px] font-black text-rose-500/40 uppercase tracking-[0.4em] italic">
            <span>PREDATOR_CORE_STATUS: STABLE</span>
            <span className="w-1.5 h-1.5 bg-rose-500/20 rounded-full" />
            <span>NEURAL_LAYER_SYNERGY: 0.998</span>
            <span className="w-1.5 h-1.5 bg-rose-500/20 rounded-full" />
            <span>DATA_LATENCY: 14.2ms</span>
            <span className="w-1.5 h-1.5 bg-rose-500/20 rounded-full" />
            <span>ACTIVE_NODES: 1,429,082</span>
            <span className="w-1.5 h-1.5 bg-rose-500/20 rounded-full" />
            <span>ENCRYPTION_LEVEL: OMEGA_SECURE</span>
         </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
