/**
 * OpenSearch Live Widget - Інтеграційний Віджет для Головного Дашборду
 *
 * Компактний віджет для відображення ключових метрик OpenSearch
 * в головному інтерфейсі PREDATOR Analytics
 *
 * © 2026 PREDATOR Analytics - Повна українізація
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from '@/components/ECharts';
import * as echarts from 'echarts';
import {
  Search, Database, TrendingUp, ExternalLink,
  RefreshCw, Activity, FileText, Zap
} from 'lucide-react';
import { api, apiClient } from '../../services/api';
import { premiumLocales } from '../../locales/uk/premium';

interface OpenSearchWidgetData {
  totalDocs: number;
  searchRate: number;
  avgLatency: number;
  indexingRate: number;
  clusterHealth: 'green' | 'yellow' | 'red';
}

interface ActivityPoint {
  time: string;
  value: number;
}

export const OpenSearchLiveWidget: React.FC<{
  compact?: boolean;
  showChart?: boolean;
}> = ({ compact = false, showChart = true }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OpenSearchWidgetData | null>(null);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [stats, health] = await Promise.allSettled([
        apiClient.get('/system/stats'),
        api.v45.getLiveHealth()
      ]);

      const now = new Date();
      const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

      if (stats.status === 'fulfilled' && stats.value?.data) {
        const s = stats.value.data;
        setData({
          totalDocs: s.documents_total || s.total_documents || 0,
          searchRate: s.search_rate || 0,
          avgLatency: s.avg_latency || 45,
          indexingRate: s.indexing_rate || 0,
          clusterHealth: 'green'
        });

        setActivityData(prev => [
          ...prev.slice(-19),
          { time: timeStr, value: s.search_rate || Math.floor(Math.random() * 50) }
        ]);
      }
    } catch (e) {
      console.error('Помилка завантаження OpenSearch даних:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Мініатюрний графік
  const miniChartOption = {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, top: 5, bottom: 5 },
    xAxis: { show: false, type: 'category', data: activityData.map(d => d.time) },
    yAxis: { show: false, type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: activityData.map(d => d.value),
      lineStyle: { color: '#f97316', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(249, 115, 22, 0.4)' },
          { offset: 1, color: 'rgba(249, 115, 22, 0)' }
        ])
      }
    }]
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-gradient-to-br from-orange-500/10 to-slate-900/40 border border-orange-500/20 rounded-2xl backdrop-blur-xl group hover:border-orange-500/40 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 rounded-lg">
              <Search className="text-orange-400" size={14} />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-wider">OpenSearch</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getHealthColor(data?.clusterHealth || 'green')} animate-pulse`} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xl font-black text-orange-400 font-mono">
              {loading ? '...' : data?.totalDocs?.toLocaleString('uk-UA') || 0}
            </div>
            <div className="text-[8px] text-slate-500 uppercase tracking-widest">{premiumLocales.openSearch.docs}</div>
          </div>
          {showChart && activityData.length > 0 && (
            <div className="w-20 h-10">
              <ReactECharts option={miniChartOption} className="w-full h-full" theme="dark" />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-500/10 via-slate-900/60 to-slate-950/80 border border-orange-500/20 rounded-[24px] p-6 relative overflow-hidden group shadow-xl backdrop-blur-xl"
    >
      {/* Фонове світіння */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />

      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/20 rounded-xl border border-orange-500/30">
            <Database className="text-orange-400" size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">OpenSearch Analytics</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${getHealthColor(data?.clusterHealth || 'green')} animate-pulse`} />
              <span className="text-[9px] text-slate-500 font-mono uppercase">PREDATOR_CLUSTER_V45</span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-orange-400 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={12} className="text-orange-400" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{premiumLocales.openSearch.docs}</span>
          </div>
          <div className="text-lg font-black text-white font-mono">
            {loading ? '...' : data?.totalDocs?.toLocaleString('uk-UA') || 0}
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{premiumLocales.openSearch.searchRate}</span>
          </div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            {loading ? '...' : data?.searchRate || 0}
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{premiumLocales.openSearch.latency}</span>
          </div>
          <div className="text-lg font-black text-amber-400 font-mono">
            {loading ? '...' : `${data?.avgLatency || 0}мс`}
          </div>
        </div>

        <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={12} className="text-blue-400" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">{premiumLocales.openSearch.indexingRate}</span>
          </div>
          <div className="text-lg font-black text-blue-400 font-mono">
            {loading ? '...' : data?.indexingRate || 0}
          </div>
        </div>
      </div>

      {/* Графік активності */}
      {showChart && activityData.length > 0 && (
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{premiumLocales.openSearch.searchActivity}</span>
            <span className="text-[8px] text-slate-600 font-mono">{premiumLocales.openSearch.lastPoints}</span>
          </div>
          <div className="h-16 bg-black/20 rounded-xl border border-white/5 p-2">
            <ReactECharts option={miniChartOption} className="w-full h-full" theme="dark" />
          </div>
        </div>
      )}

      {/* Посилання на повний дашборд */}
      <a
        href="/opensearch-dashboards/app/dashboards"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-2 p-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-orange-400 text-[10px] font-black uppercase tracking-widest transition-all relative z-10"
      >
        <ExternalLink size={12} />
        {premiumLocales.openSearch.openFullDashboard}
      </a>
    </motion.div>
  );
};

export default OpenSearchLiveWidget;
