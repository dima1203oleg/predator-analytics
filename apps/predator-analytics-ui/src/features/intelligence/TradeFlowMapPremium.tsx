/**
 * 🗺️ Interactive Trade Flow Map
 *
 * Інтерактивна карта торгових потоків
 * Візуалізація імпорту/експорту між країнами
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Maximize2,
  Minimize2,
  Filter,
  Download,
  Play,
  Pause,
  Settings,
  Info,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Crown,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Move,
  RefreshCw
} from 'lucide-react';
import { api } from '@/services/api';

// ========================
// Types
// ========================

interface Country {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  imports: number;
  exports: number;
}

interface TradeFlow {
  id: string;
  from: string;
  to: string;
  value: number;
  product: string;
  color: string;
}

interface FlowAnimation {
  pathId: string;
  progress: number;
}

// Mock data removed in favor of API
const defaultCountries: Country[] = [
  { id: 'ua', name: 'Україна', code: 'UA', x: 55, y: 35, imports: 0, exports: 0 }
];

// ========================
// Components
// ========================

const formatValue = (value: number): string => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

interface MapNodeProps {
  country: Country;
  isSelected: boolean;
  isUkraine: boolean;
  onClick: () => void;
}

const MapNode: React.FC<MapNodeProps> = ({ country, isSelected, isUkraine, onClick }) => (
  <motion.g
    onClick={onClick}
    style={{ cursor: 'pointer' }}
    whileHover={{ scale: 1.1 }}
  >
    {/* Glow effect */}
    <circle
      cx={`${country.x}%`}
      cy={`${country.y}%`}
      r={isUkraine ? 20 : isSelected ? 16 : 12}
      fill={isUkraine ? 'rgba(16, 185, 129, 0.3)' : isSelected ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.2)'}
      className="animate-pulse"
    />

    {/* Main circle */}
    <circle
      cx={`${country.x}%`}
      cy={`${country.y}%`}
      r={isUkraine ? 10 : isSelected ? 8 : 6}
      fill={isUkraine ? '#10b981' : isSelected ? '#22d3ee' : '#64748b'}
      stroke={isUkraine ? '#34d399' : isSelected ? '#67e8f9' : '#94a3b8'}
      strokeWidth={2}
    />

    {/* Label */}
    <text
      x={`${country.x}%`}
      y={`${country.y + 5}%`}
      textAnchor="middle"
      fill="white"
      fontSize={isUkraine ? 12 : 10}
      fontWeight={isUkraine ? 'bold' : 'normal'}
      className="pointer-events-none"
    >
      {country.code}
    </text>
  </motion.g>
);

interface FlowLineProps {
  flow: TradeFlow;
  countries: Country[];
  isActive: boolean;
  animationProgress: number;
}

const FlowLine: React.FC<FlowLineProps> = ({ flow, countries, isActive, animationProgress }) => {
  const fromCountry = countries.find(c => c.id === flow.from);
  const toCountry = countries.find(c => c.id === flow.to);

  if (!fromCountry || !toCountry) return null;

  const strokeWidth = Math.max(2, Math.min(8, flow.value / 30000000));

  // Curved path
  const midX = (fromCountry.x + toCountry.x) / 2;
  const midY = (fromCountry.y + toCountry.y) / 2 - 10;
  const path = `M ${fromCountry.x}% ${fromCountry.y}% Q ${midX}% ${midY}% ${toCountry.x}% ${toCountry.y}%`;

  return (
    <g>
      {/* Base line */}
      <path
        d={path}
        fill="none"
        stroke={flow.color}
        strokeWidth={strokeWidth}
        strokeOpacity={isActive ? 0.6 : 0.2}
        className="transition-all duration-300"
      />

      {/* Animated dash */}
      {isActive && (
        <motion.path
          d={path}
          fill="none"
          stroke="white"
          strokeWidth={2}
          strokeDasharray="10 20"
          strokeDashoffset={animationProgress * -100}
          strokeOpacity={0.8}
        />
      )}

      {/* Arrow at end */}
      <circle
        cx={`${toCountry.x}%`}
        cy={`${toCountry.y}%`}
        r={4}
        fill={flow.color}
        className={isActive ? 'animate-ping' : ''}
        style={{ animationDuration: '2s' }}
      />
    </g>
  );
};

// ========================
// Legend Component
// ========================

const MapLegend: React.FC<{ countries: Country[]; flows: TradeFlow[]; onFlowSelect: (id: string | null) => void; selectedFlow: string | null }> = ({
  countries,
  flows,
  onFlowSelect,
  selectedFlow
}) => (
  <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 max-w-xs">
    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
      <Layers size={14} />
      Торгові потоки
    </h4>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {flows.slice(0, 6).map((flow) => (
        <button
          key={flow.id}
          onClick={() => onFlowSelect(selectedFlow === flow.id ? null : flow.id)}
          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${selectedFlow === flow.id ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: flow.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{flow.product}</p>
            <p className="text-[10px] text-slate-500">
              {countries.find(c => c.id === flow.from)?.name} → UA
            </p>
          </div>
          <span className="text-xs font-bold text-white">
            {formatValue(flow.value)}
          </span>
        </button>
      ))}
    </div>
  </div>
);

// Stats Panel Refactored to receive summary
const StatsPanel: React.FC<{ selectedCountry: Country | null, summary: any }> = ({ selectedCountry, summary }) => (
  <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-64 shadow-2xl">
    <h4 className="text-sm font-bold text-white mb-3">
      {selectedCountry ? selectedCountry.name : 'Загальна статистика'}
    </h4>

    {selectedCountry ? (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Імпорт в Україну</span>
          <span className="text-sm font-bold text-cyan-400">
            {formatValue(selectedCountry.imports)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Експорт з України</span>
          <span className="text-sm font-bold text-emerald-400">
            {formatValue(selectedCountry.exports)}
          </span>
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Загальний імпорт</span>
          <span className="text-sm font-bold text-cyan-400">{summary.totalImport}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Загальний експорт</span>
          <span className="text-sm font-bold text-emerald-400">{summary.totalExport}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Країн-партнерів</span>
          <span className="text-sm font-bold text-white">{summary.partnerCount}</span>
        </div>
      </div>
    )}
  </div>
);

// ========================
// Main Component
// ========================

const TradeFlowMapPremium: React.FC = () => {
  const [countries, setCountries] = useState<Country[]>(defaultCountries);
  const [tradeFlows, setTradeFlows] = useState<TradeFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.premium.getTradeFlows();
        setCountries(data.countries || defaultCountries);
        setTradeFlows(data.flows || []);
      } catch (err) {
        console.error("Failed to fetch trade flows", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summary = useMemo(() => {
    const partnerCount = Math.max(0, countries.length - 1);
    const totalImport = formatValue(tradeFlows.filter(f => f.to === 'ua').reduce((a, b) => a + b.value, 0));
    const totalExport = formatValue(tradeFlows.filter(f => f.from === 'ua').reduce((a, b) => a + b.value, 0));
    return { partnerCount, totalImport, totalExport };
  }, [countries, tradeFlows]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setAnimationProgress(p => (p + 0.02) % 1);
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`bg-slate-950 ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen p-6'}`}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Globe className="text-cyan-400" />
              Карта Торгових Потоків
              <span className="ml-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full flex items-center gap-1">
                <Crown size={14} />
                Premium
              </span>
            </h1>
            <p className="text-slate-500 mt-1">
              Візуалізація імпорту/експорту в реальному часі
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Playback controls */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                }`}
              title={isPlaying ? 'Пауза' : 'Відтворити'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Zoom controls */}
            <button
              onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Збільшити"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Зменшити"
            >
              <ZoomOut size={18} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title={isFullscreen ? 'Вийти' : 'Повноекранний'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
              <Download size={16} />
              Експорт
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div
          className="relative bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden"
          style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '600px' }}
        >
          {/* SVG Map */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
            style={{ transform: `scale(${zoom})` }}
            className="transition-transform duration-300"
          >
            {/* World outline (simplified) */}
            <defs>
              <radialGradient id="mapGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(34, 211, 238, 0.1)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <rect width="100" height="100" fill="url(#mapGradient)" />

            {/* Trade flow lines */}
            {tradeFlows.map((flow) => (
              <FlowLine
                key={flow.id}
                flow={flow}
                countries={countries}
                isActive={!selectedFlow || selectedFlow === flow.id}
                animationProgress={animationProgress}
              />
            ))}

            {/* Country nodes */}
            {countries.map((country) => (
              <MapNode
                key={country.id}
                country={country}
                isSelected={selectedCountry?.id === country.id}
                isUkraine={country.id === 'ua'}
                onClick={() => setSelectedCountry(
                  selectedCountry?.id === country.id ? null : country
                )}
              />
            ))}
          </svg>

          {/* Legend */}
          <MapLegend
            countries={countries}
            flows={tradeFlows}
            onFlowSelect={setSelectedFlow}
            selectedFlow={selectedFlow}
          />

          {/* Stats Panel */}
          <StatsPanel selectedCountry={selectedCountry} summary={summary} />

          {/* Info tooltip */}
          <div className="absolute bottom-4 right-4 p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Info size={12} />
              Клікніть на країну для деталей
            </p>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Загальний імпорт', value: summary.totalImport, icon: TrendingDown, color: 'cyan' },
            { label: 'Загальний експорт', value: summary.totalExport, icon: TrendingUp, color: 'emerald' },
            { label: 'Торгових потоків', value: tradeFlows.length.toString(), icon: ArrowRight, color: 'purple' },
            { label: 'Країн-партнерів', value: summary.partnerCount.toString(), icon: Globe, color: 'amber' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/60 border border-white/5 rounded-xl p-4">
              {loading ? (
                <div className="h-10 w-full animate-pulse bg-slate-800 rounded mb-2" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`text-${stat.color}-400`} size={18} />
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                  </div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeFlowMapPremium;
