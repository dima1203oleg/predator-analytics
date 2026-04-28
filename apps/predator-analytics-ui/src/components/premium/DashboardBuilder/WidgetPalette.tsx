/**
 * PREDATOR Widget Palette
 * Палітра віджетів для drag & drop в конструктор дашбордів
 * Повна українська локалізація
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, BarChart, PieChart, LineChart, Activity, Grid3x3,
  Gauge, CreditCard, Table, Globe, Clock, Network, GitBranch,
  Filter, Search, ChevronDown, ChevronRight, Sparkles, Lock,
  Ship, Receipt, Building, Scale, ShieldAlert, Home, Car, Users,
  FileText, TrendingUp, Zap, Star
} from 'lucide-react';
import { WidgetType, DataSource, WIDGET_LIBRARY, AIRecommendation } from './types';
import { cn } from '../../../utils/cn';
import { premiumLocales } from '../../../locales/uk/premium';

interface WidgetPaletteProps {
  onAddWidget: (type: WidgetType, dataSource?: DataSource) => void;
  recommendations?: AIRecommendation[];
  userPlan: 'free' | 'premium' | 'enterprise';
}

const ICON_MAP: Record<string, any> = {
  AreaChart, BarChart, PieChart, Radar: Activity,
  Grid: Grid3x3, Grid3x3, Gauge, CreditCard, Table, Globe,
  Timeline: Clock, Network, GitBranch, Filter,
  Ship, Receipt, Building, Scale, ShieldAlert, Home, Car, Users,
  FileContract: FileText, LineChart: TrendingUp
};

const WIDGET_CATEGORIES = [
  { id: 'charts', name: premiumLocales.dashboardBuilder.categories.charts, icon: BarChart },
  { id: 'kpi', name: premiumLocales.dashboardBuilder.categories.kpi, icon: Gauge },
  { id: 'data', name: premiumLocales.dashboardBuilder.categories.data, icon: Table },
  { id: 'geo', name: premiumLocales.dashboardBuilder.categories.geo, icon: Globe },
  { id: 'relations', name: premiumLocales.dashboardBuilder.categories.relations, icon: Network },
  { id: 'flows', name: premiumLocales.dashboardBuilder.categories.flows, icon: GitBranch },
  { id: 'time', name: premiumLocales.dashboardBuilder.categories.time, icon: Clock }
];

const DATA_SOURCE_CATEGORIES = [
  { id: 'trade', name: premiumLocales.dashboardBuilder.dataSourceCategories.trade, sources: ['customs_registry', 'contracts'] as DataSource[] },
  { id: 'finance', name: premiumLocales.dashboardBuilder.dataSourceCategories.finance, sources: ['tax_data', 'financial_reports'] as DataSource[] },
  { id: 'entities', name: premiumLocales.dashboardBuilder.dataSourceCategories.entities, sources: ['company_registry', 'beneficial_owners'] as DataSource[] },
  { id: 'legal', name: premiumLocales.dashboardBuilder.dataSourceCategories.legal, sources: ['court_cases', 'sanctions'] as DataSource[] },
  { id: 'assets', name: premiumLocales.dashboardBuilder.dataSourceCategories.assets, sources: ['real_estate', 'vehicles'] as DataSource[] }
];

// Локалізовані описи джерел даних
const LOCALIZED_DATA_SOURCES: Record<string, { name: string; description: string; updateFrequency: string; isPremium: boolean }> = {
  customs_registry: { name: premiumLocales.dashboardBuilder.dataSources.customs_registry, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.customs_registry, updateFrequency: premiumLocales.dashboardBuilder.frequencies.daily, isPremium: true },
  tax_data: { name: premiumLocales.dashboardBuilder.dataSources.tax_data, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.tax_data, updateFrequency: premiumLocales.dashboardBuilder.frequencies.monthly, isPremium: true },
  company_registry: { name: premiumLocales.dashboardBuilder.dataSources.company_registry, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.company_registry, updateFrequency: premiumLocales.dashboardBuilder.frequencies.daily, isPremium: false },
  court_decisions: { name: premiumLocales.dashboardBuilder.dataSources.court_decisions, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.court_decisions, updateFrequency: premiumLocales.dashboardBuilder.frequencies.weekly, isPremium: true },
  sanctions_lists: { name: premiumLocales.dashboardBuilder.dataSources.sanctions_lists, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.sanctions_lists, updateFrequency: premiumLocales.dashboardBuilder.frequencies.realtime, isPremium: false },
  property_registry: { name: premiumLocales.dashboardBuilder.dataSources.property_registry, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.property_registry, updateFrequency: premiumLocales.dashboardBuilder.frequencies.monthly, isPremium: true },
  vehicle_registry: { name: premiumLocales.dashboardBuilder.dataSources.vehicle_registry, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.vehicle_registry, updateFrequency: premiumLocales.dashboardBuilder.frequencies.monthly, isPremium: true },
  beneficial_owners: { name: premiumLocales.dashboardBuilder.dataSources.beneficial_owners, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.beneficial_owners, updateFrequency: premiumLocales.dashboardBuilder.frequencies.daily, isPremium: true },
  financial_statements: { name: premiumLocales.dashboardBuilder.dataSources.financial_statements, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.financial_statements, updateFrequency: premiumLocales.dashboardBuilder.frequencies.quarterly, isPremium: true },
  pep_database: { name: premiumLocales.dashboardBuilder.dataSources.pep_database, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.pep_database, updateFrequency: premiumLocales.dashboardBuilder.frequencies.daily, isPremium: true },
  media_mentions: { name: premiumLocales.dashboardBuilder.dataSources.media_mentions, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.media_mentions, updateFrequency: premiumLocales.dashboardBuilder.frequencies.realtime, isPremium: true },
  social_connections: { name: premiumLocales.dashboardBuilder.dataSources.social_connections, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.social_connections, updateFrequency: premiumLocales.dashboardBuilder.frequencies.onDemand, isPremium: true },
  contracts: { name: premiumLocales.dashboardBuilder.dataSources.contracts, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.contracts, updateFrequency: premiumLocales.dashboardBuilder.frequencies.realtime, isPremium: false },
  court_cases: { name: premiumLocales.dashboardBuilder.dataSources.court_cases, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.court_cases, updateFrequency: premiumLocales.dashboardBuilder.frequencies.daily, isPremium: true },
  real_estate: { name: premiumLocales.dashboardBuilder.dataSources.real_estate, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.real_estate, updateFrequency: premiumLocales.dashboardBuilder.frequencies.monthly, isPremium: true },
  vehicles: { name: premiumLocales.dashboardBuilder.dataSources.vehicles, description: premiumLocales.dashboardBuilder.dataSourceDescriptions.vehicles, updateFrequency: premiumLocales.dashboardBuilder.frequencies.monthly, isPremium: true }
};

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({
  onAddWidget,
  recommendations = [],
  userPlan
}) => {
  const [activeTab, setActiveTab] = useState<'widgets' | 'data' | 'ai'>('ai');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('charts');
  const [searchQuery, setSearchQuery] = useState('');

  // Фільтрація віджетів (використовуємо англійські назви з WIDGET_LIBRARY,
  // але для пошуку можна було б додати локалізацію, поки що шукаємо по name/desc)
  const filteredWidgets = Object.entries(WIDGET_LIBRARY).filter(([_, widget]) =>
    widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    widget.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAIRecommendations = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
        <Sparkles size={14} className="text-amber-500" />
        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{premiumLocales.dashboardBuilder.palette.tabs.ai}</span>
      </div>

      {recommendations.length > 0 ? recommendations.map((rec) => {
        const IconComponent = ICON_MAP[WIDGET_LIBRARY[rec.widgetType]?.icon] || BarChart;
        return (
          <motion.button
            key={rec.id}
            onClick={() => onAddWidget(rec.widgetType, rec.dataSource)}
            className="w-full p-4 bg-slate-900/60 border border-white/5 rounded-2xl text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                <IconComponent size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-white uppercase">{rec.title}</span>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase",
                    rec.priority === 'high' ? "bg-rose-500/20 text-rose-400" :
                    rec.priority === 'medium' ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-500/20 text-slate-400"
                  )}>
                    {rec.priority === 'high' ? premiumLocales.dashboardBuilder.palette.priority.high : rec.priority === 'medium' ? premiumLocales.dashboardBuilder.palette.priority.medium : premiumLocales.dashboardBuilder.palette.priority.low}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">{rec.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${rec.confidence * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-[8px] text-amber-500 font-mono">{Math.round(rec.confidence * 100)}%</span>
                </div>
              </div>
            </div>
          </motion.button>
        );
      }) : (
        <div className="p-8 text-center">
          <Zap className="w-10 h-10 text-amber-500/20 mx-auto mb-3" />
          <p className="text-[10px] text-slate-500">
            {premiumLocales.dashboardBuilder.palette.analyzing}
          </p>
        </div>
      )}

      {/* Quick Add Popular */}
      <div className="pt-4 border-t border-white/5">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
          {premiumLocales.dashboardBuilder.palette.popularWidgets}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { type: 'kpi_card' as WidgetType, label: 'KPI Картка', icon: CreditCard },
            { type: 'area_chart' as WidgetType, label: 'Діаграма області', icon: AreaChart },
            { type: 'bar_chart' as WidgetType, label: 'Стовпчаста', icon: BarChart },
            { type: 'pie_chart' as WidgetType, label: 'Кругова', icon: PieChart }
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onAddWidget(type)}
              className="p-3 bg-slate-900/40 border border-white/5 rounded-xl hover:border-amber-500/30 transition-all flex items-center gap-2"
            >
              <Icon size={14} className="text-amber-500" />
              <span className="text-[9px] font-bold text-white">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWidgetLibrary = () => (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={premiumLocales.dashboardBuilder.palette.search}
          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 pl-10 text-[11px] font-mono focus:border-amber-500/50 transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
      </div>

      {/* Categories */}
      {WIDGET_CATEGORIES.map((category) => {
        const widgets = filteredWidgets.filter(([_, w]) => w.category.toLowerCase() === category.name.toLowerCase() ||
          (category.id === 'charts' && ['Charts'].includes(w.category))); // Mapping logic for English categories in WIDGET_LIBRARY

        // If strict filtering returns nothing, try mapped names or show all for now if no search
        // Simplified for this example: relying on direct category match or 'Charts'

        const categoryWidgets = filteredWidgets.filter(([_, w]) => {
            const catId = category.id;
            const wCat = w.category; // English category from library (e.g. 'Charts')

            // Mapping logic
            if (catId === 'charts') return wCat === 'Charts';
            if (catId === 'kpi') return wCat === 'KPI';
            if (catId === 'data') return wCat === 'Data';
            if (catId === 'geo') return wCat === 'Geo';
            if (catId === 'relations') return wCat === 'Relations';
            if (catId === 'flows') return wCat === 'Flows';
            if (catId === 'time') return wCat === 'Time';
            return false;
        });

        if (categoryWidgets.length === 0 && searchQuery) return null;

        // Use custom mapping if available, otherwise fallback to finding matches
        const visibleWidgets = categoryWidgets.length > 0 ? categoryWidgets : [];
        if (visibleWidgets.length === 0 && !searchQuery) return null; // Don't show empty categories

        return (
          <div key={category.id} className="border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <category.icon size={14} className="text-amber-500" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{category.name}</span>
                <span className="text-[9px] text-slate-500 font-mono">({visibleWidgets.length})</span>
              </div>
              {expandedCategory === category.id ? (
                <ChevronDown size={14} className="text-slate-500" />
              ) : (
                <ChevronRight size={14} className="text-slate-500" />
              )}
            </button>

            <AnimatePresence>
              {expandedCategory === category.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 grid grid-cols-1 gap-2">
                    {visibleWidgets.map(([type, widget]) => {
                      const IconComponent = ICON_MAP[widget.icon] || BarChart;
                      return (
                        <motion.button
                          key={type}
                          onClick={() => onAddWidget(type as WidgetType)}
                          className="p-3 bg-black/40 border border-white/5 rounded-xl text-left hover:border-amber-500/30 transition-all flex items-center gap-3 group"
                          whileHover={{ x: 4 }}
                        >
                          <div className="p-2 bg-white/5 rounded-lg text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-500/10 transition-colors">
                            <IconComponent size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-black text-white">
                              {/* @ts-ignore */}
                              {premiumLocales.dashboardBuilder.widgetTypes[type] || widget.name}
                            </div>
                            <div className="text-[9px] text-slate-500 truncate">
                              {/* @ts-ignore */}
                              {premiumLocales.dashboardBuilder.widgetDescriptions[type] || widget.description}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );

  const renderDataSources = () => (
    <div className="space-y-4">
      {DATA_SOURCE_CATEGORIES.map((category) => (
        <div key={category.id}>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-2">
            {category.name}
          </div>
          <div className="space-y-1">
            {category.sources.map((sourceId) => {
              const source = LOCALIZED_DATA_SOURCES[sourceId] || { name: sourceId, description: '', updateFrequency: '', isPremium: false };
              const isLocked = source.isPremium && userPlan === 'free';

              // Map icon based on source ID or default to FileText
              let IconComponent = FileText;
              if (sourceId.includes('registry')) IconComponent = Building;
              if (sourceId.includes('tax') || sourceId.includes('finance')) IconComponent = Receipt;
              if (sourceId.includes('asset') || sourceId.includes('vehicle')) IconComponent = Car;
              if (sourceId.includes('court') || sourceId.includes('sanction')) IconComponent = Scale;
              if (sourceId.includes('owner') || sourceId.includes('pep')) IconComponent = Users;

              return (
                <button
                  key={sourceId}
                  onClick={() => !isLocked && onAddWidget('table', sourceId)}
                  disabled={isLocked}
                  className={cn(
                    "w-full p-3 bg-slate-900/40 border border-white/5 rounded-xl text-left transition-all flex items-center gap-3 group",
                    isLocked ? "opacity-50 cursor-not-allowed" : "hover:border-amber-500/30 hover:bg-amber-500/5"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isLocked ? "bg-slate-800 text-slate-600" : "bg-white/5 text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-500/10"
                  )}>
                    <IconComponent size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white">{source.name}</span>
                      {source.isPremium && (
                        <Star size={10} className="text-amber-500" fill="currentColor" />
                      )}
                      {isLocked && <Lock size={10} className="text-slate-500" />}
                    </div>
                    <div className="text-[9px] text-slate-500">{source.description}</div>
                  </div>
                  <div className="text-[8px] text-slate-600 font-mono">{source.updateFrequency}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-black/40 border border-white/5 rounded-[32px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">
          {premiumLocales.dashboardBuilder.palette.libraryTitle}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl">
          {[
            { id: 'ai', label: premiumLocales.dashboardBuilder.palette.tabs.ai.replace(' рекомендації', ''), icon: Sparkles },
            { id: 'widgets', label: premiumLocales.dashboardBuilder.palette.tabs.widgets, icon: BarChart },
            { id: 'data', label: premiumLocales.dashboardBuilder.palette.tabs.data.replace(' Джерела ', ' '), icon: Table }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === tab.id
                  ? "bg-amber-500 text-black"
                  : "text-slate-500 hover:text-white"
              )}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === 'ai' && renderAIRecommendations()}
            {activeTab === 'widgets' && renderWidgetLibrary()}
            {activeTab === 'data' && renderDataSources()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-slate-950/50">
        <div className="text-[8px] text-slate-600 text-center">
          {premiumLocales.dashboardBuilder.palette.dragTip}
        </div>
      </div>
    </div>
  );
};

export default WidgetPalette;
