import React from 'react';
import { Eye, EyeOff, Sliders, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

export interface OsintFiltersPanelProps {
  activeFilter: 'all' | 'company' | 'person' | 'cryptowallet';
  setActiveFilter: (v: 'all' | 'company' | 'person' | 'cryptowallet') => void;
  categoryFilter: 'all' | 'sanctioned' | 'active' | 'high-risk';
  setCategoryFilter: (v: 'all' | 'sanctioned' | 'active' | 'high-risk') => void;
  riskLevelFilter: 'all' | 'high' | 'medium' | 'low';
  setRiskLevelFilter: (v: 'all' | 'high' | 'medium' | 'low') => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean) => void;
  heatmapSensitivity: number;
  setHeatmapSensitivity: (v: number) => void;
  filteredEntities: OsintEntity[];
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
    total: number;
    highPercent: number;
    mediumPercent: number;
    lowPercent: number;
  };
}

export default function OsintFiltersPanel({
  activeFilter, setActiveFilter,
  categoryFilter, setCategoryFilter,
  riskLevelFilter, setRiskLevelFilter,
  startDate, setStartDate,
  endDate, setEndDate,
  showHeatmap, setShowHeatmap,
  heatmapSensitivity, setHeatmapSensitivity,
  filteredEntities,
  riskDistribution
}: OsintFiltersPanelProps) {
  return (
    <div className="flex flex-col gap-4 bg-slate-900/10 border border-slate-900/30 p-4 rounded-2xl" id="osint-filters-panel">
      <div className="flex flex-wrap items-center gap-1.5" id="registry-quick-filters">
        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Бази OSINT:</span>
        {(['all', 'company', 'person', 'cryptowallet'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${activeFilter === filter ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/40 shadow-sm' : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-800'}`}
          >
            {filter === 'all' && 'Всі реєстри'}
            {filter === 'company' && 'Юридичні особи (ЄДР)'}
            {filter === 'person' && 'Фізичні особи / ФОП'}
            {filter === 'cryptowallet' && 'Криптоактиви / Валюта'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" id="category-quick-filters">
        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Категорія:</span>
        {(['all', 'sanctioned', 'active', 'high-risk'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${categoryFilter === cat ? 'bg-rose-600/15 text-rose-400 border-rose-500/40 shadow-sm' : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-800'}`}
          >
            {cat === 'all' && 'Всі статуси'}
            {cat === 'sanctioned' && '⚠️ Під санкціями'}
            {cat === 'active' && '✅ Активні'}
            {cat === 'high-risk' && '🚨 Високий ризик'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" id="risk-level-quick-filters">
        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Рівень ризику:</span>
        {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setRiskLevelFilter(lvl)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              riskLevelFilter === lvl 
                ? lvl === 'high' 
                  ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm' 
                  : lvl === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                    : lvl === 'low'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-indigo-600/15 text-indigo-400 border-indigo-500/40 shadow-sm'
                : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-800'
            }`}
          >
            {lvl === 'all' && 'Всі рівні'}
            {lvl === 'high' && '🔴 Високий (High)'}
            {lvl === 'medium' && '🟡 Середній (Medium)'}
            {lvl === 'low' && '🟢 Низький (Low)'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3" id="date-range-filters-container">
        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Активність з:</span>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Start Date */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-900/80 rounded-lg px-2.5 py-1 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-mono text-slate-500 uppercase">Початок:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[10px] text-slate-200 font-mono focus:outline-none focus:text-indigo-400 [color-scheme:dark] border-0 outline-none p-0 cursor-pointer"
            />
          </div>
          
          {/* End Date */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-900/80 rounded-lg px-2.5 py-1 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[9px] font-mono text-slate-500 uppercase">Кінець:</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[10px] text-slate-200 font-mono focus:outline-none focus:text-indigo-400 [color-scheme:dark] border-0 outline-none p-0 cursor-pointer"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setStartDate('2026-01-01');
                setEndDate('2026-12-31');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                startDate === '2026-01-01' && endDate === '2026-12-31' 
                  ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/40 shadow-sm' 
                  : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              2026 рік
            </button>
            <button
              onClick={() => {
                setStartDate('2025-01-01');
                setEndDate('2025-12-31');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                startDate === '2025-01-01' && endDate === '2025-12-31' 
                  ? 'bg-indigo-600/15 text-indigo-400 border-indigo-500/40 shadow-sm' 
                  : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              2025 рік
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-mono font-bold px-2 py-1 cursor-pointer transition-colors"
              >
                Очистити дати
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Heatmap Visibility and Intensity controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-900/40 mt-1" id="heatmap-control-panel">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Теплова карта:</span>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              showHeatmap 
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-sm' 
                : 'bg-slate-900/40 text-slate-500 border-slate-900 hover:border-slate-800'
            }`}
          >
            {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{showHeatmap ? 'Відображається' : 'Прихована'}</span>
          </button>
        </div>

        {showHeatmap && (
          <div className="flex items-center gap-3 glass-panel/60 rounded-xl px-4 py-2 flex-1 sm:flex-initial sm:min-w-[280px]">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Sliders className="w-3 h-3 text-rose-400" />
              <span>Чутливість:</span>
            </span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={heatmapSensitivity}
              onChange={(e) => setHeatmapSensitivity(parseFloat(e.target.value))}
              className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-rose-400 font-mono font-bold min-w-[30px] text-right shrink-0">
              {Math.round(heatmapSensitivity * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Real-time Risk Distribution Histogram */}
      <div className="pt-4 border-t border-slate-900/40 mt-1" id="risk-distribution-histogram-widget">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-wider">
              Розподіл ризику сутностей у реальному часі
            </span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
            Відфільтровано: <strong className="text-indigo-400 font-bold">{filteredEntities.length}</strong> з <strong className="text-slate-400 font-bold">{OSINT_ENTITIES.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* High Risk Category */}
          <div className="glass-panel/60 p-3 rounded-xl flex flex-col justify-between hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300 group">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2">
              <span className="flex items-center gap-1.5 font-bold text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                HIGH RISK (≥80)
              </span>
              <span className="font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                {riskDistribution.high} ({Math.round(riskDistribution.highPercent)}%)
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${riskDistribution.highPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]"
              />
            </div>
          </div>

          {/* Medium Risk Category */}
          <div className="glass-panel/60 p-3 rounded-xl flex flex-col justify-between hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 group">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                MEDIUM RISK (50-79)
              </span>
              <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                {riskDistribution.medium} ({Math.round(riskDistribution.mediumPercent)}%)
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${riskDistribution.mediumPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              />
            </div>
          </div>

          {/* Low Risk Category */}
          <div className="glass-panel/60 p-3 rounded-xl flex flex-col justify-between hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 group">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2">
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                LOW RISK (&lt;50)
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                {riskDistribution.low} ({Math.round(riskDistribution.lowPercent)}%)
              </span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${riskDistribution.lowPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
