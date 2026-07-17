/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, ShieldAlert, Network, Map, Globe, Briefcase, User, 
  DollarSign, FileText, Compass, Server, CheckCircle, HelpCircle, 
  AlertTriangle, ArrowRight, Zap, RefreshCw, Send, Plus, Filter,
  TrendingUp, ShieldCheck, Landmark, ChevronRight, Hash, Truck,
  X, Printer, FileDown, Eye, EyeOff, Sliders, Copy, Check, Calendar,
  MapPin, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OSINT_ENTITIES, OsintEntity } from './osintData';
import { useOsintSearch } from '../../hooks/useOsint';
import { useDebounce } from 'use-debounce';

interface OsintWorkbenchProps {
  onSelectEntityForInspector: (entity: OsintEntity | null) => void;
  selectedEntity: OsintEntity | null;
}

interface MapLocation {
  id: string;
  name: string;
  city: string;
  sector: string;
  x: number; // Ukraine SVG view coordinate
  y: number; // Ukraine SVG view coordinate
  kyivX?: number; // Kyiv inset coordinate
  kyivY?: number; // Kyiv inset coordinate
  address: string;
  riskScore: number;
  status: 'ACTIVE' | 'LIQUIDATED' | 'SANCTIONED' | 'SUSPICIOUS';
}

const MAP_LOCATIONS: Record<string, MapLocation> = {
  'comp-1': {
    id: 'comp-1',
    name: "ТОВ 'СпецТехПостач'",
    city: 'Київ',
    sector: 'Центральний сектор',
    x: 270,
    y: 100,
    kyivX: 235,
    kyivY: 85,
    address: "вул. Михайла Грушевського, 15",
    riskScore: 94,
    status: 'SANCTIONED'
  },
  'person-1': {
    id: 'person-1',
    name: 'Коваленко Ігор Вікторович',
    city: 'Козин',
    sector: 'Київська область',
    x: 285,
    y: 120,
    kyivX: 275,
    kyivY: 125,
    address: 'смт Козин, вул. Старокиївська, 72',
    riskScore: 82,
    status: 'SUSPICIOUS'
  },
  'comp-2': {
    id: 'comp-2',
    name: "ТОВ 'Арсенал Сек'юріті'",
    city: 'Львів',
    sector: 'Західний сектор',
    x: 95,
    y: 115,
    kyivX: undefined,
    kyivY: undefined,
    address: 'вул. Героїв УПА, 73',
    riskScore: 45,
    status: 'ACTIVE'
  },
  'wallet-1': {
    id: 'wallet-1',
    name: 'BTC Wallet (0x38ac...d831)',
    city: 'Blockchain Network',
    sector: 'Децентралізована мережа',
    x: 420,
    y: 70,
    kyivX: undefined,
    kyivY: undefined,
    address: 'Ledger Node #48231',
    riskScore: 89,
    status: 'SUSPICIOUS'
  }
};

export default function OsintWorkbench({ onSelectEntityForInspector, selectedEntity }: OsintWorkbenchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const { data: searchResults, isLoading: isSearchLoading } = useOsintSearch(debouncedSearchQuery);

  const [activeFilter, setActiveFilter] = useState<'all' | 'company' | 'person' | 'cryptowallet'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sanctioned' | 'active' | 'high-risk'>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "38294012", "Коваленко Ігор", "BTC Wallet 0x38ac", "ТОВ СпецТехПостач"
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapSensitivity, setHeatmapSensitivity] = useState(1.0);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Interactive Map State variables
  const [mapZoom, setMapZoom] = useState<'ukraine' | 'kyiv' | 'lviv' | 'global'>('ukraine');
  const [mapShowRoutes, setMapShowRoutes] = useState(true);
  const [mapShowFlows, setMapShowFlows] = useState(true);
  const [mapShowHeatmap, setMapShowHeatmap] = useState(false);
  const [hoveredMapEntityId, setHoveredMapEntityId] = useState<string | null>(null);
  const [mapHoverCoords, setMapHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const handleCopyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  const exportToCSV = () => {
    // Generate CSV content
    const headers = ["ID", "Назва/Ім'я", "Код/Ідентифікатор", "Тип об'єкта", "Рівень ризику (%)", "Статус", "Опис"];
    const rows = filteredEntities.map(e => [
      e.id,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.code}"`,
      e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа',
      `${e.riskScore}%`,
      e.status === 'SANCTIONED' ? 'Під санкціями' : e.status === 'SUSPICIOUS' ? 'Підозрілий' : 'Активний',
      `"${e.description.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OSINT_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV();
      setIsExporting(false);
    }, 1000);
  };

  const handlePDFExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setTimeout(() => {
      setShowReportModal(true);
      setIsExporting(false);
    }, 1000);
  };
  
  // Local active entity (defaults to the first one)
  const activeEntity = selectedEntity || OSINT_ENTITIES[0];

  // Memoized filtered entities for the quick-access sidebar list
  const filteredEntities = useMemo(() => {
    let sourceEntities = OSINT_ENTITIES;

    // Use API search results if available
    if (searchResults && searchResults.length > 0) {
      sourceEntities = searchResults.map(r => ({
        id: r.ueid,
        name: r.name,
        code: r.edrpou,
        type: 'company' as const,
        riskScore: r.risk_score || 0,
        status: r.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPICIOUS',
        description: r.industry || 'Н/Д',
        address: 'Н/Д',
        lastActivityDate: new Date().toISOString(),
        relationships: [],
        aiRecommendations: 'Потребує додаткового аналізу'
      }));
    }

    return sourceEntities.filter(entity => {
      // Apply local search query if typed and we are not using the API results
      if (searchQuery.trim() && (!searchResults || searchResults.length === 0)) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = entity.name.toLowerCase().includes(query) || 
                              entity.code.includes(searchQuery) ||
                              (entity.description && entity.description.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Filter by activeFilter (registry type)
      const matchesType = activeFilter === 'all' || entity.type === activeFilter;
      if (!matchesType) return false;

      // Filter by categoryFilter
      if (categoryFilter === 'sanctioned') {
        if (entity.status !== 'SANCTIONED') return false;
      } else if (categoryFilter === 'active') {
        if (entity.status !== 'ACTIVE') return false;
      } else if (categoryFilter === 'high-risk') {
        if (entity.riskScore < 75) return false;
      }

      // Filter by riskLevelFilter
      if (riskLevelFilter === 'high') {
        if (entity.riskScore < 80) return false;
      } else if (riskLevelFilter === 'medium') {
        if (entity.riskScore < 50 || entity.riskScore >= 80) return false;
      } else if (riskLevelFilter === 'low') {
        if (entity.riskScore >= 50) return false;
      }
      
      // Filter by lastActivityDate range
      if (startDate || endDate) {
        if (!entity.lastActivityDate) {
          return false;
        }
        if (startDate && entity.lastActivityDate < startDate) {
          return false;
        }
        if (endDate && entity.lastActivityDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [searchQuery, activeFilter, categoryFilter, riskLevelFilter, startDate, endDate]);

  // Calculate concentration of High Risk entities (riskScore >= 80) in the filtered list
  const highRiskRatio = useMemo(() => {
    if (filteredEntities.length === 0) return 0;
    const highRiskCount = filteredEntities.filter(e => e.riskScore >= 80).length;
    return highRiskCount / filteredEntities.length;
  }, [filteredEntities]);

  // Calculate real-time risk distribution histogram counts and percentages
  const riskDistribution = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    
    filteredEntities.forEach(e => {
      if (e.riskScore >= 80) {
        high++;
      } else if (e.riskScore >= 50) {
        medium++;
      } else {
        low++;
      }
    });
    
    const total = filteredEntities.length;
    
    return {
      high,
      medium,
      low,
      total,
      highPercent: total > 0 ? (high / total) * 100 : 0,
      mediumPercent: total > 0 ? (medium / total) * 100 : 0,
      lowPercent: total > 0 ? (low / total) * 100 : 0
    };
  }, [filteredEntities]);

  // Filters entities by query and registry type
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return OSINT_ENTITIES.filter(e => {
      const matchesText = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.code.includes(searchQuery) ||
                          e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeFilter === 'all' || e.type === activeFilter;
      return matchesText && matchesType;
    });
  }, [searchQuery, activeFilter]);

  const handleSearchSubmit = (queryText: string) => {
    if (!queryText.trim()) return;
    
    // Check if there is an exact or partial match
    const found = OSINT_ENTITIES.find(e => 
      e.name.toLowerCase().includes(queryText.toLowerCase()) || 
      e.code.includes(queryText)
    );

    if (found) {
      onSelectEntityForInspector(found);
    }

    if (!recentSearches.includes(queryText)) {
      setRecentSearches(prev => [queryText, ...prev.slice(0, 3)]);
    }
    
    setSearchQuery(queryText);
    setShowSuggestions(false);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
    if (score >= 50) return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
  };

  const getRiskTheme = (score: number) => {
    if (score >= 80) {
      return {
        badgeClass: 'text-rose-500 border-rose-500/20 bg-rose-500/5',
        selectedBorderClass: 'border-rose-500/50 bg-rose-500/10 shadow-lg shadow-rose-950/20',
        unselectedBorderClass: 'border-rose-500/20 bg-slate-950/40 hover:border-rose-500/40 hover:bg-rose-500/5',
        indicatorClass: 'bg-rose-500',
        hoverTextClass: 'group-hover:text-rose-400',
        barClass: 'bg-rose-500',
      };
    }
    if (score >= 50) {
      return {
        badgeClass: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
        selectedBorderClass: 'border-amber-400/50 bg-amber-400/10 shadow-lg shadow-amber-950/20',
        unselectedBorderClass: 'border-amber-400/20 bg-slate-950/40 hover:border-amber-400/40 hover:bg-amber-400/5',
        indicatorClass: 'bg-amber-400',
        hoverTextClass: 'group-hover:text-amber-400',
        barClass: 'bg-amber-400',
      };
    }
    return {
      badgeClass: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
      selectedBorderClass: 'border-emerald-400/50 bg-emerald-400/10 shadow-lg shadow-emerald-950/20',
      unselectedBorderClass: 'border-emerald-400/20 bg-slate-950/40 hover:border-emerald-400/40 hover:bg-emerald-400/5',
      indicatorClass: 'bg-emerald-400',
      hoverTextClass: 'group-hover:text-emerald-400',
      barClass: 'bg-emerald-400',
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SANCTIONED':
        return <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">Санкції РНБО</span>;
      case 'SUSPICIOUS':
        return <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">Підозріла активність</span>;
      case 'ACTIVE':
        return <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">Активний</span>;
      default:
        return <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">{status}</span>;
    }
  };

  const getStatusBadgeShort = (status: string) => {
    switch (status) {
      case 'SANCTIONED':
        return <span className="text-[8px] font-bold text-red-400 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 uppercase tracking-tight">САНКЦІЇ</span>;
      case 'SUSPICIOUS':
        return <span className="text-[8px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-tight">ПІДОЗРА</span>;
      case 'ACTIVE':
        return <span className="text-[8px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-tight">АКТИВНИЙ</span>;
      default:
        return <span className="text-[8px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 uppercase tracking-tight">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 relative p-6 rounded-3xl overflow-hidden transition-all duration-1000" id="osint-workbench-root">
      {/* Risk Distribution Heatmap Background Layer */}
      <AnimatePresence>
        {showHeatmap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 pointer-events-none -z-10 rounded-3xl"
            style={{
              background: `
                radial-gradient(circle at 20% 15%, rgba(244, 63, 94, ${highRiskRatio * 0.14 * heatmapSensitivity}) 0%, transparent 45%),
                radial-gradient(circle at 80% 80%, rgba(244, 63, 94, ${highRiskRatio * 0.14 * heatmapSensitivity}) 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, rgba(244, 63, 94, ${highRiskRatio * 0.08 * heatmapSensitivity}) 0%, transparent 65%)
              `,
              boxShadow: `inset 0 0 40px rgba(244, 63, 94, ${highRiskRatio * 0.06 * heatmapSensitivity})`
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Workspace Header with Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-900/60" id="osint-workspace-header">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>Інструментарій OSINT Пошуку</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Система Predator: Фільтрація, аналітика та генерація звітів контрагентів
            </p>
          </div>

          {filteredEntities.length > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-900/80 shrink-0 select-none">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${highRiskRatio > 0.4 ? 'bg-rose-500' : highRiskRatio > 0.1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${highRiskRatio > 0.4 ? 'bg-rose-500' : highRiskRatio > 0.1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-tight">
                Інтенсивність загрози: <strong className={`${highRiskRatio > 0.4 ? 'text-rose-400' : highRiskRatio > 0.1 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(highRiskRatio * 100)}%</strong>
              </span>
            </div>
          )}
        </div>
        
        {/* Export Control Panel with Format Selector */}
        <div className="flex items-center gap-3 bg-slate-950/40 p-1.5 rounded-xl border border-slate-900/60 shrink-0 select-none" id="export-format-selector-panel">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/40 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all"
            title="Попередній перегляд відфільтрованої таблиці перед експортом"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Перегляд</span>
          </button>
          
          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-900/40 relative">
            <button
              onClick={() => setExportFormat('csv')}
              className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                exportFormat === 'csv'
                  ? 'text-indigo-400 z-10'
                  : 'text-slate-500 hover:text-slate-400 z-10'
              }`}
            >
              {exportFormat === 'csv' && (
                <motion.div
                  layoutId="activeExportFormat"
                  className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-md -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>CSV</span>
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                exportFormat === 'pdf'
                  ? 'text-rose-400 z-10'
                  : 'text-slate-500 hover:text-slate-400 z-10'
              }`}
            >
              {exportFormat === 'pdf' && (
                <motion.div
                  layoutId="activeExportFormat"
                  className="absolute inset-0 bg-rose-500/10 border border-rose-500/20 rounded-md -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>PDF</span>
            </button>
          </div>

          {/* Unified dynamic action button */}
          <AnimatePresence mode="wait">
            {exportFormat === 'csv' ? (
              <motion.button
                key="csv-btn"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                onClick={handleCSVExport}
                disabled={isExporting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  isExporting 
                    ? 'bg-indigo-500/5 opacity-60 cursor-not-allowed' 
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer'
                }`}
                title="Експорт поточного відфільтрованого списку в Excel/CSV"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{isExporting ? 'Формування...' : 'Експорт'}</span>
              </motion.button>
            ) : (
              <motion.button
                key="pdf-btn"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                onClick={handlePDFExport}
                disabled={isExporting}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  isExporting 
                    ? 'bg-rose-500/5 opacity-60 cursor-not-allowed' 
                    : 'bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer'
                }`}
                title="Переглянути та надрукувати офіційний PDF-звіт"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                <span>{isExporting ? 'Підготовка...' : 'Звіт PDF'}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Top OSINT filter options */}
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
            <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-900/60 rounded-xl px-4 py-2 flex-1 sm:flex-initial sm:min-w-[280px]">
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
            <div className="bg-slate-950/40 border border-slate-900/60 p-3 rounded-xl flex flex-col justify-between hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300 group">
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
            <div className="bg-slate-950/40 border border-slate-900/60 p-3 rounded-xl flex flex-col justify-between hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-300 group">
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
            <div className="bg-slate-950/40 border border-slate-900/60 p-3 rounded-xl flex flex-col justify-between hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 group">
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

      {/* Global Auto-Complete Search Input */}
      <div className="relative z-20" id="workbench-search-container">
        <div className="bg-slate-950 border border-slate-850 rounded-xl flex items-center p-1 shadow-2xl">
          <div className="pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Введіть назву компанії, ПІБ особи, ІПН, код ЄДРПОУ (напр. '38294012' або 'Коваленко')..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(searchQuery);
            }}
            className="flex-1 bg-transparent px-3 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-slate-500 hover:text-slate-300 px-2 font-mono"
            >
              Очистити
            </button>
          )}
          <button
            onClick={() => handleSearchSubmit(searchQuery)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all mr-1"
          >
            Шукати
          </button>
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && (searchQuery.trim() || recentSearches.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl divide-y divide-slate-900 max-h-[300px] overflow-y-auto"
            >
              {suggestions.length > 0 && (
                <div className="p-2.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider px-2">
                    Знайдено збігів ({suggestions.length})
                  </span>
                  <div className="mt-1 space-y-1">
                    {suggestions.map((entity) => (
                      <button
                        key={entity.id}
                        onClick={() => {
                          onSelectEntityForInspector(entity);
                          setSearchQuery(entity.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-900 flex items-center justify-between text-xs text-slate-300 group"
                      >
                        <div className="flex items-center gap-2.5">
                          {entity.type === 'company' ? (
                            <Briefcase className="w-4 h-4 text-indigo-400" />
                          ) : entity.type === 'cryptowallet' ? (
                            <Landmark className="w-4 h-4 text-amber-400" />
                          ) : (
                            <User className="w-4 h-4 text-teal-400" />
                          )}
                          <div>
                            <span className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                              {entity.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                              {entity.code}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getRiskColor(entity.riskScore)}`}>
                            Risk: {entity.riskScore}%
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="p-2.5 bg-slate-950/40">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider px-2">
                    Останні пошукові запити
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5 px-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchQuery(term);
                          handleSearchSubmit(term);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid: 3 Columns - Quick Filtered List Left, Detailed Dossier Middle, Graph/Map Visualizers Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: List of filtered entities with categories */}
        <div className="xl:col-span-3 space-y-6" id="osint-list-panel">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4.5 shadow-xl flex flex-col h-[650px]" id="osint-list-card">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                  Об'єкти ({filteredEntities.length})
                </span>
              </div>
              {(filteredEntities.length < OSINT_ENTITIES.length || searchQuery || activeFilter !== 'all' || categoryFilter !== 'all' || riskLevelFilter !== 'all' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setActiveFilter('all');
                    setCategoryFilter('all');
                    setRiskLevelFilter('all');
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono font-bold cursor-pointer transition-colors"
                >
                  Скинути
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredEntities.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-[10px] space-y-2">
                  <p>Збігів не знайдено</p>
                  <button
                    onClick={() => {
                      setActiveFilter('all');
                      setCategoryFilter('all');
                      setRiskLevelFilter('all');
                      setSearchQuery('');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] text-indigo-400 underline cursor-pointer"
                  >
                    Показати всі
                  </button>
                </div>
              ) : (
                filteredEntities.map((entity) => {
                  const isSelected = activeEntity.id === entity.id;
                  const theme = getRiskTheme(entity.riskScore);
                  return (
                    <motion.div
                      layout
                      key={entity.id}
                      onClick={() => onSelectEntityForInspector(entity)}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer relative group ${
                        isSelected 
                          ? theme.selectedBorderClass 
                          : theme.unselectedBorderClass
                      }`}
                    >
                      {/* Active left indicator light */}
                      {isSelected && (
                        <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${theme.indicatorClass}`} />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {entity.type === 'company' ? (
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          ) : entity.type === 'cryptowallet' ? (
                            <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          )}
                          <span className={`font-bold text-slate-100 text-[11px] truncate transition-colors ${theme.hoverTextClass}`}>
                            {entity.name}
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 ${theme.badgeClass}`}>
                          {entity.riskScore}%
                        </span>
                      </div>

                      {/* Dynamic Risk Score Progress Bar */}
                      <div className="w-full bg-slate-950/80 rounded-full h-1 overflow-hidden border border-slate-900/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${theme.barClass}`}
                          style={{ width: `${entity.riskScore}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span className="truncate max-w-[120px]">Код: {entity.code}</span>
                        <span>{getStatusBadgeShort(entity.status)}</span>
                      </div>

                      {/* Expanded Technical Details container with height animation */}
                      <AnimatePresence initial={false}>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden w-full text-left"
                            onClick={(e) => {
                              // Prevent closing/re-selecting when clicking inside the expanded details area
                              e.stopPropagation();
                            }}
                          >
                            <div className="pt-2.5 border-t border-slate-900/60 space-y-3 text-[10px] text-slate-300 font-sans">
                              {/* Analytic Note Description */}
                              <div 
                                onClick={() => handleCopyToClipboard(entity.description, `${entity.id}-desc`)}
                                className="bg-slate-950/40 p-2 rounded-lg border border-slate-900/60 text-slate-400 font-sans leading-relaxed text-[10px] cursor-pointer hover:bg-slate-950/60 transition-all relative group/copy"
                              >
                                <span className="text-[8px] font-mono font-bold text-slate-600 block uppercase tracking-wider mb-1">
                                  Аналітична замітка
                                </span>
                                {entity.description}
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                  <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                </div>
                                {copiedField === `${entity.id}-desc` && (
                                  <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Скопійовано!</span>
                                  </div>
                                )}
                              </div>

                              {/* Address */}
                              <div className="font-mono text-slate-400 space-y-0.5">
                                <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                  Адреса реєстрації
                                </span>
                                <div 
                                  onClick={() => handleCopyToClipboard(entity.address, `${entity.id}-address`)}
                                  className="text-[9px] break-all text-slate-300 leading-normal bg-slate-950/20 p-1.5 rounded border border-slate-900/40 cursor-pointer hover:bg-slate-950/40 transition-all relative group/copy"
                                >
                                  {entity.address}
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                  </div>
                                  {copiedField === `${entity.id}-address` && (
                                    <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Скопійовано!</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Taxes and Customs (for company) */}
                              {entity.type === 'company' && entity.taxes && (
                                <div className="space-y-1.5">
                                  <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Фінанси та Податки ({entity.taxes.year})
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`Сплачено: ${entity.taxes?.paid}, Борг: ${entity.taxes?.debt}, Статус: ${entity.taxes?.status}`, `${entity.id}-taxes`)}
                                    className="bg-slate-950/30 p-2 rounded-lg border border-slate-900/40 font-mono space-y-1 text-[9px] cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                  >
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Сплачено:</span>
                                      <span className="text-emerald-400 font-semibold">{entity.taxes.paid}</span>
                                    </div>
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Борг:</span>
                                      <span className={entity.taxes.debt !== '0 UAH' ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                        {entity.taxes.debt}
                                      </span>
                                    </div>
                                    <div className="text-[8px] text-amber-500 font-semibold pt-0.5 border-t border-slate-900/40 text-center pr-5">
                                      {entity.taxes.status}
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </div>
                                    {copiedField === `${entity.id}-taxes` && (
                                      <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Скопійовано!</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Customs Import Info (for company) */}
                              {entity.type === 'company' && entity.customs && (
                                <div className="space-y-1.5">
                                  <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Митна активність
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`Митна активність: Імпорт ${entity.customs?.importVolume}, Вантаж: ${entity.customs?.lastCargo}`, `${entity.id}-customs`)}
                                    className="bg-slate-950/30 p-2 rounded-lg border border-slate-900/40 font-mono space-y-1 text-[9px] cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                  >
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Імпорт:</span>
                                      <span className="text-indigo-400 font-semibold">{entity.customs.importVolume}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-400 leading-normal truncate pr-5" title={entity.customs.lastCargo}>
                                      Вантаж: {entity.customs.lastCargo}
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </div>
                                    {copiedField === `${entity.id}-customs` && (
                                      <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Скопійовано!</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Founders (for company) */}
                              {entity.type === 'company' && entity.founders && entity.founders.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Власники / Засновники
                                  </span>
                                  <div className="space-y-1">
                                    {entity.founders.slice(0, 2).map((founder, idx) => (
                                      <div 
                                        key={idx} 
                                        onClick={() => handleCopyToClipboard(`${founder.name} (${founder.share})`, `${entity.id}-founder-${idx}`)}
                                        className="bg-slate-950/40 p-1.5 rounded border border-slate-900/40 flex justify-between items-center text-[9px] font-sans cursor-pointer hover:bg-slate-950/60 transition-all relative group/copy"
                                      >
                                        <div className="truncate max-w-[120px] text-slate-300 font-medium pr-5">
                                          {founder.name}
                                        </div>
                                        <div className="text-indigo-400 font-mono font-bold pr-5">
                                          {founder.share}
                                        </div>
                                        <div className="absolute top-1 right-1 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                          <Copy className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300" />
                                        </div>
                                        {copiedField === `${entity.id}-founder-${idx}` && (
                                          <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-20 animate-fade-in">
                                            <Check className="w-2.5 h-2.5" />
                                            <span>Скопійовано!</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Courts cases details */}
                              {entity.courts && (
                                <div className="space-y-1.5">
                                  <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Судовий реєстр
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`Кримінальних справ: ${entity.courts?.criminalCases}, Остання справа: ${entity.courts?.lastCaseTitle}`, `${entity.id}-courts`)}
                                    className="bg-slate-950/30 p-2 rounded-lg border border-slate-900/40 font-mono space-y-1 text-[9px] cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                  >
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Кримінальних справ:</span>
                                      <span className="text-rose-400 font-semibold">{entity.courts.criminalCases}</span>
                                    </div>
                                    <div className="text-[8px] text-slate-400 line-clamp-1 leading-normal pr-5">
                                      Остання: {entity.courts.lastCaseTitle}
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </div>
                                    {copiedField === `${entity.id}-courts` && (
                                      <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Скопійовано!</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Sanctions */}
                              {entity.sanctions && (
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-slate-600 block uppercase tracking-wider font-sans text-rose-400/90">
                                    Санкційні обмеження
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`${entity.sanctions?.listName}: ${entity.sanctions?.reason}`, `${entity.id}-sanctions`)}
                                    className="bg-rose-500/5 p-2 rounded-lg border border-rose-500/15 font-sans space-y-1 text-[9px] text-slate-300 cursor-pointer hover:bg-rose-500/10 transition-all relative group/copy"
                                  >
                                    <p className="font-semibold text-rose-400/90 pr-5">{entity.sanctions.listName}</p>
                                    <p className="text-[8px] text-slate-400 leading-normal line-clamp-2 pr-5">{entity.sanctions.reason}</p>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-rose-300" />
                                    </div>
                                    {copiedField === `${entity.id}-sanctions` && (
                                      <div className="absolute -top-2 right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Скопійовано!</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Information banner */}
                              <div className="pt-1.5">
                                <div className="text-[8px] font-bold text-indigo-400/80 uppercase tracking-widest font-mono text-center flex items-center justify-center gap-1">
                                  <span>Досьє вибрано для інспектора</span>
                                  <ChevronRight className="w-2.5 h-2.5 animate-pulse" />
                                </div>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Dossier Card Profile (Section 13) */}
        <div className="xl:col-span-4 space-y-6" id="osint-dossier-panel">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
            
            {/* Dossier Header */}
            <div className="p-5 border-b border-slate-900 bg-slate-950/60 relative">
              <div className="absolute right-4 top-4 flex items-center gap-2">
                {getStatusBadge(activeEntity.status)}
                <div className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${getRiskColor(activeEntity.riskScore)}`}>
                  RISK Score: {activeEntity.riskScore}
                </div>
              </div>

              <div className="flex items-start gap-3.5 pr-28">
                <div className={`p-3 rounded-xl shrink-0 bg-slate-950 border ${activeEntity.riskScore > 75 ? 'border-rose-500/30 text-rose-400' : 'border-slate-800 text-indigo-400'}`}>
                  {activeEntity.type === 'company' ? (
                    <Briefcase className="w-5 h-5" />
                  ) : activeEntity.type === 'cryptowallet' ? (
                    <Landmark className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{activeEntity.name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-600" />
                      Код: <strong className="text-slate-200">{activeEntity.code}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-600" />
                      Регіон: <strong className="text-slate-200">UA (Львів/Київ)</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dossier Details Tablist */}
            <div className="p-5 space-y-5 text-xs">
              
              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Аналітична замітка (Огляд)</span>
                <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                  {activeEntity.description}
                </p>
              </div>

              {/* Conditional: Company Details */}
              {activeEntity.type === 'company' && (
                <>
                  {/* Founders & Stakeholders */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Засновники та частки власності</span>
                    <div className="space-y-1.5">
                      {activeEntity.founders?.map((found, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            const foundPerson = OSINT_ENTITIES.find(e => e.name === found.name);
                            if (foundPerson) onSelectEntityForInspector(foundPerson);
                          }}
                          className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between hover:border-slate-800 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            <div>
                              <p className="font-semibold text-slate-200 text-[11px] group-hover:text-indigo-400 transition-colors">{found.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono">{found.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2.5 text-right font-mono text-[10px]">
                            <div>
                              <span className="text-indigo-400 font-bold block">{found.share}</span>
                              <span className="text-[9px] text-slate-600 uppercase">ЧАСТКА</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${found.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                              {found.riskLevel} Risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Taxes and Customs Data (Section 13) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeEntity.taxes && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Фінансовий стан
                        </span>
                        <div className="space-y-1 text-[11px] font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Рік подачі:</span>
                            <span>{activeEntity.taxes.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Сплачено ПДВ:</span>
                            <span className="text-emerald-400 font-bold">{activeEntity.taxes.paid}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Податковий борг:</span>
                            <span className={activeEntity.taxes.debt !== '0 UAH' ? 'text-red-400 font-bold' : 'text-slate-400'}>{activeEntity.taxes.debt}</span>
                          </div>
                          <p className="text-[9px] text-amber-500 font-semibold bg-amber-500/5 p-1 rounded text-center border border-amber-500/10 mt-1">
                            {activeEntity.taxes.status}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeEntity.customs && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-500" /> Митна діяльність
                        </span>
                        <div className="space-y-1 text-[11px] font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Обсяг імпорту:</span>
                            <span className="text-indigo-400 font-bold">{activeEntity.customs.importVolume}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-500 font-sans">Партнери:</span>
                            <span className="truncate max-w-[120px]" title={activeEntity.customs.mainPartners.join(', ')}>
                              {activeEntity.customs.mainPartners[0]}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 bg-slate-950 p-1 rounded text-center border border-slate-900 truncate mt-1">
                            Вантаж: {activeEntity.customs.lastCargo}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Courts / Litigation history (Section 13) */}
              {activeEntity.courts && (
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center justify-between">
                    <span>СУДОВИЙ РЕЄСТР</span>
                    <span className="text-red-400 font-bold font-mono text-[10px]">{activeEntity.courts.criminalCases} КРИМІНАЛ / {activeEntity.courts.totalCases} ВСЬОГО</span>
                  </span>
                  
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                    <p className="text-[10px] font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                      {activeEntity.courts.lastCaseTitle}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-slate-500 font-mono">
                      <span>Дата ухвали: {activeEntity.courts.lastCaseDate}</span>
                      <span className="text-indigo-400 hover:underline cursor-pointer">Переглянути справу →</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sanctions details */}
              {activeEntity.sanctions && (
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3.5 space-y-2">
                  <span className="text-[9px] text-red-400 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> ВІДОМОСТІ ПРО САНКЦІЇ
                  </span>
                  <div className="text-[11px] space-y-1">
                    <p className="text-slate-300 leading-relaxed font-semibold">
                      Реєстр: {activeEntity.sanctions.listName}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Причина: {activeEntity.sanctions.reason}
                    </p>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                      <span>Додано: {activeEntity.sanctions.dateAdded}</span>
                      <span>Орган: {activeEntity.sanctions.authority}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Contact / address list */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Адреса та контакти реєстрації</span>
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-900 text-[11px] text-slate-300 font-mono space-y-1">
                  <p className="flex justify-between">
                    <span className="text-slate-500 shrink-0 mr-3">Адреса:</span>
                    <span className="text-right leading-relaxed text-slate-200">{activeEntity.address}</span>
                  </p>
                  {activeEntity.phone && (
                    <p className="flex justify-between">
                      <span className="text-slate-500">Телефон:</span>
                      <span className="text-slate-200">{activeEntity.phone}</span>
                    </p>
                  )}
                  {activeEntity.email && (
                    <p className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-200 hover:text-indigo-400 cursor-pointer">{activeEntity.email}</span>
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Link Graph & Cargo Routes Visualizers (Section 14 & 15) */}
        <div className="xl:col-span-5 space-y-6" id="osint-visualizer-panel">
          
          {/* Force Graph (Section 14) */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-4.5 h-4.5 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                  Граф зв'язків та Link Analysis (2D View)
                </h4>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">
                Клікніть на суміжний вузол для навігації
              </span>
            </div>

            {/* SVG Graph View representing relationships */}
            <div className="relative w-full h-[320px] bg-slate-900/40 border border-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
              
              {/* Background circular scanning matrix HUD (Section 2) */}
              <div className="absolute inset-0 border border-dashed border-slate-800/10 rounded-full scale-75 animate-spin pointer-events-none" style={{ animationDuration: '60s' }}></div>
              <div className="absolute inset-0 border border-slate-800/20 rounded-full scale-50 pointer-events-none"></div>

              {/* SVG Network canvas */}
              <svg className="w-full h-full" viewBox="0 0 600 320">
                {/* Connective lines */}
                <g stroke="#1e293b" strokeWidth="1.5">
                  {/* Central Node is always (300, 160) */}
                  {/* Target 1 node coordinate (150, 100) */}
                  <line x1="300" y1="160" x2="160" y2="80" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                  {/* Target 2 node coordinate (450, 100) */}
                  <line x1="300" y1="160" x2="440" y2="80" stroke="#3b82f6" strokeWidth="1.5" />
                  {/* Target 3 node coordinate (300, 260) */}
                  <line x1="300" y1="160" x2="300" y2="250" stroke="#f59e0b" strokeWidth="2" />
                </g>

                {/* Nodes group */}
                <g>
                  {/* Central Main Node */}
                  <g 
                    className="cursor-pointer" 
                    onClick={() => onSelectEntityForInspector(activeEntity)}
                  >
                    <circle cx="300" cy="160" r="24" className="fill-slate-950 stroke-indigo-500 stroke-2 hover:stroke-indigo-400 transition-all" />
                    <text x="300" y="164" textAnchor="middle" fill="#818cf8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {activeEntity.type === 'company' ? 'CORP' : 'PEP'}
                    </text>
                    <text x="300" y="200" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      {activeEntity.name.slice(0, 18)}...
                    </text>
                  </g>

                  {/* Connected Target Node 1 */}
                  {activeEntity.relationships[0] && (
                    <g 
                      className="cursor-pointer group"
                      onClick={() => {
                        const found = OSINT_ENTITIES.find(e => e.id === activeEntity.relationships[0].targetId);
                        if (found) onSelectEntityForInspector(found);
                      }}
                    >
                      <circle cx="160" cy="80" r="16" className="fill-slate-950 stroke-rose-500 stroke-2 hover:fill-rose-500/10 transition-all" />
                      <text x="160" y="83" textAnchor="middle" fill="#f43f5e" fontSize="7" fontWeight="bold" fontFamily="monospace">DIR</text>
                      <text x="160" y="110" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                        {activeEntity.relationships[0].targetName.split(' ')[0]}
                      </text>
                      <text x="210" y="130" textAnchor="middle" fill="#f43f5e" fontSize="7" fontWeight="bold" fontFamily="monospace" transform="rotate(-30 210 130)">
                        {activeEntity.relationships[0].type}
                      </text>
                    </g>
                  )}

                  {/* Connected Target Node 2 */}
                  {activeEntity.relationships[1] && (
                    <g 
                      className="cursor-pointer group"
                      onClick={() => {
                        const found = OSINT_ENTITIES.find(e => e.id === activeEntity.relationships[1].targetId);
                        if (found) onSelectEntityForInspector(found);
                      }}
                    >
                      <circle cx="440" cy="80" r="16" className="fill-slate-950 stroke-blue-500 stroke-2 hover:fill-blue-500/10 transition-all" />
                      <text x="440" y="83" textAnchor="middle" fill="#3b82f6" fontSize="7" fontWeight="bold" fontFamily="monospace">SUB</text>
                      <text x="440" y="110" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                        {activeEntity.relationships[1].targetName.split(' ')[0]}
                      </text>
                      <text x="380" y="115" textAnchor="middle" fill="#3b82f6" fontSize="7" fontWeight="bold" fontFamily="monospace" transform="rotate(30 380 115)">
                        {activeEntity.relationships[1].type}
                      </text>
                    </g>
                  )}

                  {/* Connected Target Node 3 */}
                  {activeEntity.relationships[2] && (
                    <g 
                      className="cursor-pointer group"
                      onClick={() => {
                        const found = OSINT_ENTITIES.find(e => e.id === activeEntity.relationships[2].targetId);
                        if (found) onSelectEntityForInspector(found);
                      }}
                    >
                      <circle cx="300" cy="250" r="16" className="fill-slate-950 stroke-amber-500 stroke-2 hover:fill-amber-500/10 transition-all" />
                      <text x="300" y="253" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace">COIN</text>
                      <text x="300" y="280" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                        {activeEntity.relationships[2].targetName.slice(0, 15)}...
                      </text>
                      <text x="335" y="210" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold" fontFamily="monospace" transform="rotate(90 335 210)">
                        {activeEntity.relationships[2].type}
                      </text>
                    </g>
                  )}
                </g>
              </svg>

              {/* Status overlay hud */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-850 px-2.5 py-1 rounded text-[8px] text-slate-500 font-mono flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Interactive Graph Connected
              </div>
            </div>
          </div>

          {/* Interactive Geopolitical OSINT Map (Section 15) */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4" id="osint-interactive-map-widget">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3.5 gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                    Геопросторовий Моніторинг та Геолокація
                  </h4>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Координатна сітка та інтерактивні шари OSINT об'єктів
                  </p>
                </div>
              </div>
              
              {/* Zoom Presets Controls */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-900/80">
                <button
                  onClick={() => setMapZoom('ukraine')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'ukraine' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Україна
                </button>
                <button
                  onClick={() => setMapZoom('kyiv')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'kyiv' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Київ/Козин
                </button>
                <button
                  onClick={() => setMapZoom('lviv')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'lviv' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Львів
                </button>
                <button
                  onClick={() => setMapZoom('global')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'global' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Мережа Ledger
                </button>
              </div>
            </div>

            {/* Split Grid: Navigation sidebar & Map Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* Left Column: Coordinates Sidebar */}
              <div className="lg:col-span-1 bg-slate-900/30 border border-slate-900/60 rounded-xl p-3 flex flex-col gap-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 mb-1 block">
                  Активні вузли на карті
                </span>
                
                {Object.values(MAP_LOCATIONS).map((loc) => {
                  const isInspected = activeEntity.id === loc.id;
                  const riskColorClass = loc.riskScore >= 75 ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' : loc.riskScore >= 50 ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
                  
                  return (
                    <div 
                      key={loc.id}
                      onClick={() => {
                        const found = OSINT_ENTITIES.find(e => e.id === loc.id);
                        if (found) {
                          onSelectEntityForInspector(found);
                          // Auto trigger correct zoom mode for optimal UX
                          if (loc.id === 'comp-1' || loc.id === 'person-1') {
                            setMapZoom('kyiv');
                          } else if (loc.id === 'comp-2') {
                            setMapZoom('lviv');
                          } else {
                            setMapZoom('global');
                          }
                        }
                      }}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all duration-300 ${
                        isInspected 
                          ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-600/5' 
                          : 'bg-slate-950/40 border-slate-900/60 hover:bg-slate-950/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-100 truncate max-w-[95px] block">
                          {loc.name.replace(/ТОВ |"|'/g, '')}
                        </span>
                        <span className={`text-[8px] font-mono font-semibold px-1 rounded border shrink-0 ${riskColorClass}`}>
                          {loc.riskScore}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500 mt-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-600" />
                        <span className="truncate">{loc.city} ({loc.address})</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mt-auto pt-3 border-t border-slate-900/80 text-[8px] font-mono text-slate-500 leading-relaxed">
                  <div className="flex items-center gap-1 text-indigo-400 mb-0.5">
                    <span className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></span>
                    <span>Режим синхронізації:</span>
                  </div>
                  <span>Клік на вузол фокусує камери та завантажує досьє.</span>
                </div>
              </div>

              {/* Right Column: SVG Visualizer Area */}
              <div className="lg:col-span-3 relative h-[360px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                
                {/* SVG Visual Canvas */}
                <svg 
                  className="w-full h-full cursor-grab active:cursor-grabbing transition-all duration-700" 
                  viewBox={
                    mapZoom === 'kyiv' 
                      ? '200 65 110 80' 
                      : mapZoom === 'lviv' 
                        ? '65 95 60 50' 
                        : '0 0 500 280'
                  }
                  fill="none"
                >
                  
                  {/* Defs block for Radial Gradients (Heatmaps) */}
                  <defs>
                    <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
                      <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="heat-medium" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                    
                    {/* Grid Pattern */}
                    <pattern id="map-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f172a" strokeWidth="0.5" />
                    </pattern>
                  </defs>

                  {/* Grid overlay */}
                  <rect width="500" height="280" fill="url(#map-grid-pattern)" />

                  {/* Coordinate lines & Labels (Only shown in Ukraine/Global View) */}
                  {mapZoom === 'ukraine' && (
                    <g className="opacity-25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3">
                      <line x1="100" y1="0" x2="100" y2="280" />
                      <text x="105" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">24°E</text>
                      
                      <line x1="200" y1="0" x2="200" y2="280" />
                      <text x="205" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">30°E</text>
                      
                      <line x1="300" y1="0" x2="300" y2="280" />
                      <text x="305" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">36°E</text>
                      
                      <line x1="400" y1="0" x2="400" y2="280" />
                      <text x="405" y="15" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">42°E</text>
                      
                      <line x1="0" y1="80" x2="500" y2="80" />
                      <text x="5" y="75" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">50°N</text>
                      
                      <line x1="0" y1="180" x2="500" y2="180" />
                      <text x="5" y="175" fill="#475569" fontSize="6" fontFamily="monospace" stroke="none">46°N</text>
                    </g>
                  )}

                  {/* Dynamic Tactical Radar Sweeping Beacon */}
                  {mapZoom === 'ukraine' && (
                    <line 
                      x1="250" 
                      y1="140" 
                      x2="500" 
                      y2="140" 
                      stroke="rgba(99, 102, 241, 0.12)" 
                      strokeWidth="1.5" 
                      className="origin-[250px_140px] animate-spin" 
                      style={{ animationDuration: '12s' }} 
                    />
                  )}

                  {/* Stylized Ukraine Vector Boundaries */}
                  {mapZoom !== 'lviv' && mapZoom !== 'kyiv' && (
                    <g id="ukraine-polygon-mesh">
                      {/* Outer boundary fill & stroke */}
                      <path 
                        d="M 50,110 L 80,95 L 110,95 L 140,110 L 170,105 L 210,95 L 250,90 L 290,95 L 340,90 L 380,100 L 415,110 L 440,130 L 420,155 L 435,175 L 405,190 L 375,200 L 350,215 L 315,220 L 295,250 L 285,250 L 280,225 L 260,220 L 235,225 L 220,210 L 200,195 L 170,195 L 140,185 L 110,170 L 80,165 L 60,140 Z" 
                        className="fill-slate-900/60 stroke-slate-800 transition-all duration-700" 
                        strokeWidth="1.5" 
                      />
                      {/* Coastlines highlighting (Crimea & Southern shores) */}
                      <path 
                        d="M 220,210 L 235,225 L 260,220 L 280,225 L 285,250 L 295,250 L 315,220 L 350,215" 
                        stroke="#334155" 
                        strokeWidth="1" 
                        strokeDasharray="4 2" 
                        fill="none" 
                      />
                    </g>
                  )}

                  {/* Lviv Inset Streets Layout (Detail Zoom) */}
                  {mapZoom === 'lviv' && (
                    <g id="lviv-street-mesh" className="animate-fade-in">
                      {/* City Ring road */}
                      <circle cx="95" cy="115" r="18" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                      {/* Intersecting roads converging on Heroiv UPA St */}
                      <line x1="65" y1="115" x2="125" y2="115" stroke="#0f172a" strokeWidth="2" />
                      <line x1="95" y1="95" x2="95" y2="145" stroke="#0f172a" strokeWidth="1.5" />
                      <path d="M 75,100 L 115,130" stroke="#0f172a" strokeWidth="1" />
                      {/* Inset Text labels */}
                      <text x="75" y="103" fill="#475569" fontSize="3" fontWeight="bold" fontFamily="monospace">вул. Героїв УПА</text>
                      <text x="110" y="112" fill="#475569" fontSize="3.2" fontWeight="bold" fontFamily="monospace">Залізничний р-н</text>
                      <text x="82" y="132" fill="#38bdf8" fontSize="2.8" fontWeight="bold" fontFamily="monospace">Львівська Координатна Сітка</text>
                    </g>
                  )}

                  {/* Kyiv Inset Rivers & Highways (Detail Zoom) */}
                  {mapZoom === 'kyiv' && (
                    <g id="kyiv-street-mesh" className="animate-fade-in">
                      {/* Magnified River Dnipro */}
                      <path d="M 230,65 Q 240,95 255,105 T 285,120 T 300,145" fill="none" stroke="#1e3a8a" strokeWidth="6" className="opacity-60" />
                      <path d="M 230,65 Q 240,95 255,105 T 285,120 T 300,145" fill="none" stroke="#0284c7" strokeWidth="1.5" className="opacity-90" />
                      {/* Major Highways (Stolychne Highway, etc) */}
                      <path d="M 220,70 L 260,110 L 280,135" stroke="#101b2f" strokeWidth="3" fill="none" />
                      <path d="M 220,70 L 260,110 L 280,135" stroke="#334155" strokeWidth="1" fill="none" />
                      {/* Local highway H-01 going south to Kozyn */}
                      <path d="M 260,110 L 275,125 L 290,140" stroke="#334155" strokeWidth="1.2" strokeDasharray="2 1" fill="none" />
                      
                      {/* Inset Text labels */}
                      <text x="215" y="78" fill="#475569" fontSize="3.5" fontWeight="bold" fontFamily="monospace">Печерськ (Київ)</text>
                      <text x="282" y="112" fill="#475569" fontSize="3.2" fontWeight="bold" fontFamily="monospace">р. Дніпро</text>
                      <text x="290" y="130" fill="#e2e8f0" fontSize="3" fontWeight="bold" fontFamily="monospace" opacity="0.6">Козин (Обухівська траса)</text>
                    </g>
                  )}

                  {/* Flowing Dnipro River (shown in full view) */}
                  {mapZoom === 'ukraine' && (
                    <path 
                      d="M 270,50 Q 268,100 285,120 T 335,140 T 310,175 T 275,200 T 235,215" 
                      fill="none" 
                      stroke="#1d4ed8" 
                      strokeWidth="1.8" 
                      className="opacity-45" 
                    />
                  )}

                  {/* Standard Cities Landmarks (dots on the background for authenticity) */}
                  {mapZoom === 'ukraine' && (
                    <g id="cities-background-dots" className="opacity-40">
                      <circle cx="395" cy="100" r="2.5" fill="#475569" />
                      <text x="395" y="93" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Харків</text>

                      <circle cx="225" cy="210" r="2.5" fill="#475569" />
                      <text x="225" y="203" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Одеса</text>

                      <circle cx="335" cy="140" r="2.5" fill="#475569" />
                      <text x="335" y="133" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Дніпро</text>

                      <circle cx="415" cy="155" r="2.5" fill="#475569" />
                      <text x="415" y="148" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Донецьк</text>
                    </g>
                  )}

                  {/* CUSTOM LAYER 1: Pulsing Threat Heatmap Gradients */}
                  {mapShowHeatmap && (
                    <g id="risk-heatmap-layer">
                      {/* High-threat comp-1 (Kyiv) */}
                      {mapZoom !== 'lviv' && (
                        <circle 
                          cx={mapZoom === 'kyiv' ? 235 : 270} 
                          cy={mapZoom === 'kyiv' ? 85 : 100} 
                          r={mapZoom === 'kyiv' ? 28 : 45} 
                          fill="url(#heat-high)" 
                          className="animate-pulse" 
                        />
                      )}
                      {/* High-threat person-1 (Kozyn) */}
                      {mapZoom !== 'lviv' && (
                        <circle 
                          cx={mapZoom === 'kyiv' ? 275 : 285} 
                          cy={mapZoom === 'kyiv' ? 125 : 120} 
                          r={mapZoom === 'kyiv' ? 22 : 32} 
                          fill="url(#heat-high)" 
                          className="animate-pulse animate-delay-300" 
                        />
                      )}
                      {/* Medium-threat wallet-1 (Blockchain/Virtual node) */}
                      {mapZoom === 'ukraine' && (
                        <circle cx="420" cy="70" r="25" fill="url(#heat-medium)" className="animate-pulse" />
                      )}
                    </g>
                  )}

                  {/* CUSTOM LAYER 2: Supply/Customs Routing Vectors */}
                  {mapShowRoutes && mapZoom === 'ukraine' && (
                    <g id="customs-routing-vectors" className="animate-fade-in">
                      {/* Arc from China (HK) to Kyiv (SinoTech Trading Ltd) */}
                      <path 
                        id="route-china-kyiv"
                        d="M 480,150 Q 375,120 270,100" 
                        stroke="#f43f5e" 
                        strokeWidth="1.5" 
                        strokeDasharray="5 3" 
                        fill="none" 
                        className="opacity-70"
                      />
                      <text x="375" y="113" textAnchor="middle" fill="#f43f5e" fontSize="6" fontWeight="bold" fontFamily="monospace">
                        SinoTech HK ➔ Київ ($4.2M)
                      </text>
                      {/* Flowing animated cargo packet */}
                      <circle r="3.5" fill="#f43f5e" className="shadow">
                        <animateMotion dur="5s" repeatCount="indefinite" path="M 480,150 Q 375,120 270,100" />
                      </circle>

                      {/* Arc from Germany (DE) to Lviv (EuroArmor GmbH) */}
                      <path 
                        id="route-germany-lviv"
                        d="M 20,80 Q 55,100 95,115" 
                        stroke="#10b981" 
                        strokeWidth="1.5" 
                        strokeDasharray="5 3" 
                        fill="none" 
                        className="opacity-70"
                      />
                      <text x="55" y="85" textAnchor="middle" fill="#10b981" fontSize="6" fontWeight="bold" fontFamily="monospace">
                        EuroArmor DE ➔ Львів ($450K)
                      </text>
                      {/* Flowing animated cargo packet */}
                      <circle r="3.5" fill="#10b981">
                        <animateMotion dur="4.2s" repeatCount="indefinite" path="M 20,80 Q 55,100 95,115" />
                      </circle>
                    </g>
                  )}

                  {/* CUSTOM LAYER 3: Animated Transaction Flow Streams (Suspect Monies) */}
                  {mapShowFlows && mapZoom === 'ukraine' && (
                    <g id="finance-flow-streams" className="animate-fade-in">
                      {/* Transfer from Kozyn (person-1) to BTC Wallet (wallet-1) */}
                      <path 
                        id="flow-kozyn-wallet"
                        d="M 285,120 Q 352,95 420,70" 
                        stroke="#f59e0b" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 2" 
                        fill="none" 
                        className="opacity-75"
                      />
                      {/* Transfer from central Kyiv (comp-1) to BTC Wallet (wallet-1) */}
                      <path 
                        id="flow-kyiv-wallet"
                        d="M 270,100 Q 345,85 420,70" 
                        stroke="#f59e0b" 
                        strokeWidth="1" 
                        strokeDasharray="3 3" 
                        fill="none" 
                        className="opacity-60"
                      />

                      {/* Dynamic flowing coin/money particles */}
                      <circle r="3" fill="#fbbf24" className="shadow-lg">
                        <animateMotion dur="2.8s" repeatCount="indefinite" path="M 285,120 Q 352,95 420,70" />
                      </circle>
                      <circle r="2.5" fill="#fbbf24" className="opacity-80">
                        <animateMotion dur="3.5s" repeatCount="indefinite" path="M 270,100 Q 345,85 420,70" />
                      </circle>
                    </g>
                  )}

                  {/* PINS & BEACONS LAYER */}
                  <g id="interactive-pins-mesh">
                    {Object.values(MAP_LOCATIONS).map((loc) => {
                      // Skip rendering of Lviv pin if zoomed on Kyiv, and vice-versa
                      if (mapZoom === 'kyiv' && loc.id === 'comp-2') return null;
                      if (mapZoom === 'kyiv' && loc.id === 'wallet-1') return null;
                      if (mapZoom === 'lviv' && loc.id !== 'comp-2') return null;

                      // Calculate correct coordinates based on active zoom mode
                      let cx = loc.x;
                      let cy = loc.y;
                      if (mapZoom === 'kyiv' && loc.kyivX && loc.kyivY) {
                        cx = loc.kyivX;
                        cy = loc.kyivY;
                      }

                      const isHovered = hoveredMapEntityId === loc.id;
                      const isInspected = activeEntity.id === loc.id;
                      const riskColor = loc.riskScore >= 75 ? '#f43f5e' : loc.riskScore >= 50 ? '#f59e0b' : '#10b981';
                      
                      return (
                        <g 
                          key={loc.id}
                          className="cursor-pointer group"
                          onClick={() => {
                            const found = OSINT_ENTITIES.find(e => e.id === loc.id);
                            if (found) onSelectEntityForInspector(found);
                          }}
                          onMouseEnter={() => setHoveredMapEntityId(loc.id)}
                          onMouseLeave={() => setHoveredMapEntityId(null)}
                        >
                          {/* Pulsing Beacon on Inspected entity */}
                          {isInspected && (
                            <g>
                              <circle cx={cx} cy={cy} r="14" fill="none" stroke={riskColor} strokeWidth="1" className="animate-ping opacity-35" />
                              <circle cx={cx} cy={cy} r="20" fill="none" stroke={riskColor} strokeWidth="0.5" className="animate-pulse opacity-20" />
                            </g>
                          )}

                          {/* Pin Background Glow */}
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={isHovered || isInspected ? "7" : "5.5"} 
                            fill="#020617" 
                            stroke={riskColor} 
                            strokeWidth={isHovered || isInspected ? "2.5" : "1.8"} 
                            className="transition-all duration-300 shadow-xl"
                          />

                          {/* Small icon dot inside pin */}
                          <circle cx={cx} cy={cy} r="2" fill={riskColor} className="transition-all" />

                          {/* Entity City Tag (Only in full/Ukraine mode to keep clean) */}
                          {(mapZoom === 'ukraine' || mapZoom === 'global') && (
                            <g className="transition-all duration-300 pointer-events-none">
                              {/* Backdrop for text */}
                              <rect 
                                x={cx - 16} 
                                y={cy + 7.5} 
                                width="32" 
                                height="8.5" 
                                rx="2" 
                                fill="rgba(2, 6, 23, 0.82)" 
                                stroke={isInspected ? "rgba(99, 102, 241, 0.4)" : "rgba(30, 41, 59, 0.6)"} 
                                strokeWidth="0.5" 
                              />
                              <text 
                                x={cx} 
                                y={cy + 14} 
                                textAnchor="middle" 
                                fill={isInspected ? "#a5b4fc" : "#94a3b8"} 
                                fontSize="5.5" 
                                fontWeight="bold" 
                                fontFamily="monospace"
                              >
                                {loc.city === 'Blockchain Network' ? 'LEDGER' : loc.city.toUpperCase()}
                              </text>
                            </g>
                          )}

                          {/* Zoomed Detailed City Tags (Kyiv Zoom / Lviv Zoom) */}
                          {mapZoom === 'kyiv' && (
                            <g className="pointer-events-none">
                              <rect x={cx - 24} y={cy + 7} width="48" height="11" rx="2" fill="rgba(2, 6, 23, 0.9)" stroke={riskColor} strokeWidth="0.5" />
                              <text x={cx} y={cy + 14} textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold" fontFamily="sans-serif">
                                {loc.id === 'comp-1' ? 'СпецТехПостач' : 'Коваленко І.В.'}
                              </text>
                            </g>
                          )}

                          {mapZoom === 'lviv' && (
                            <g className="pointer-events-none">
                              <rect x={cx - 24} y={cy + 7} width="48" height="11" rx="2" fill="rgba(2, 6, 23, 0.9)" stroke={riskColor} strokeWidth="0.5" />
                              <text x={cx} y={cy + 14} textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold" fontFamily="sans-serif">
                                Арсенал Сек'юріті
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Tactical Scanning Grid Lines Compass Marker (overlay) */}
                <div className="absolute right-3.5 bottom-3 text-[7.5px] text-slate-500 font-mono flex flex-col gap-0.5 items-end leading-none pointer-events-none">
                  <span>SATELLITE SYNC FEED ACTIVE</span>
                  <span>SYS: {mapZoom === 'kyiv' ? '30.5234°E / 50.4501°N' : mapZoom === 'lviv' ? '24.0297°E / 49.8397°N' : 'UKRAINE TACTICAL MAP'}</span>
                </div>

                {/* Scale Overlay Indicator */}
                <div className="absolute left-3.5 bottom-3.5 bg-slate-950/90 border border-slate-900 rounded-lg px-2 py-1 text-[8px] font-mono text-slate-400 flex items-center gap-1.5 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>
                    {mapZoom === 'kyiv' ? 'МАСШТАБ: 1:20,000' : mapZoom === 'lviv' ? 'МАСШТАБ: 1:15,000' : 'МАСШТАБ: 1:1,500,000'}
                  </span>
                </div>

                {/* HTML HOVER TOOLTIP FLOATING OVERLAY */}
                <AnimatePresence>
                  {hoveredMapEntityId && MAP_LOCATIONS[hoveredMapEntityId] && (() => {
                    const loc = MAP_LOCATIONS[hoveredMapEntityId];
                    const riskColorClass = loc.riskScore >= 75 ? 'text-rose-400' : loc.riskScore >= 50 ? 'text-amber-400' : 'text-emerald-400';
                    const isKyivScale = mapZoom === 'kyiv' && loc.kyivX !== undefined;
                    const pinX = isKyivScale ? loc.kyivX! : loc.x;
                    const pinY = isKyivScale ? loc.kyivY! : loc.y;
                    
                    // Standard viewport width height ratios to determine percentage left/top placement
                    const viewWidth = mapZoom === 'kyiv' ? 110 : mapZoom === 'lviv' ? 60 : 500;
                    const viewHeight = mapZoom === 'kyiv' ? 80 : mapZoom === 'lviv' ? 50 : 280;
                    const viewMinX = mapZoom === 'kyiv' ? 200 : mapZoom === 'lviv' ? 65 : 0;
                    const viewMinY = mapZoom === 'kyiv' ? 65 : mapZoom === 'lviv' ? 95 : 0;

                    const leftPct = ((pinX - viewMinX) / viewWidth) * 100;
                    const topPct = ((pinY - viewMinY) / viewHeight) * 100;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-30 bg-slate-950/95 border border-slate-900 rounded-xl p-3 shadow-2xl w-[210px] pointer-events-none"
                        style={{ 
                          left: `${leftPct}%`, 
                          top: `${topPct}%`,
                          transform: 'translate(-50%, -108%)'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-slate-100 line-clamp-1 pr-1">
                            {loc.name}
                          </span>
                          <span className={`text-[9px] font-mono font-bold shrink-0 ${riskColorClass}`}>
                            {loc.riskScore}%
                          </span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">
                          {loc.sector}
                        </p>
                        <div className="border-t border-slate-900 my-1.5"></div>
                        <p className="text-[9px] text-slate-300 leading-normal font-sans">
                          Адреса: <strong className="text-slate-100">{loc.address}</strong>
                        </p>
                        <p className="text-[8px] text-slate-500 font-mono mt-1">
                          Клікніть на маркер для повного досьє
                        </p>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

              </div>
            </div>

            {/* Bottom Layer Toggles toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-900/60 mt-1" id="map-layers-toolbar">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Активні шари:</span>
                </span>
                
                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setMapShowRoutes(!mapShowRoutes)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      mapShowRoutes 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                        : 'bg-slate-900/40 text-slate-500 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    Митні Маршрути
                  </button>

                  <button
                    onClick={() => setMapShowFlows(!mapShowFlows)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      mapShowFlows 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-slate-900/40 text-slate-500 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    Крипто Транзакції
                  </button>

                  <button
                    onClick={() => setMapShowHeatmap(!mapShowHeatmap)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      mapShowHeatmap 
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                        : 'bg-slate-900/40 text-slate-500 border-slate-900 hover:border-slate-850'
                    }`}
                  >
                    Теплокарта Загроз
                  </button>
                </div>
              </div>

              {/* Status footer banner */}
              <div className="text-[8.5px] font-mono text-slate-500">
                Кадастрові та транзитні карти оновлено у реальному часі • 4 вузли побудовано
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Hidden printable container */}
      <div id="print-report-container" className="hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body, html {
              background: white !important;
              color: black !important;
              font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
            }
            #osint-workbench-root, 
            #tactical-sidebar, 
            #right-inspector-panel, 
            #global-header, 
            #workspace-main, 
            footer, 
            .fixed, 
            .absolute,
            #report-modal-overlay {
              display: none !important;
            }
            #print-report-container {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              z-index: 9999999 !important;
              background: white !important;
              color: black !important;
              padding: 40px !important;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              margin-bottom: 20px;
            }
            .print-table th, .print-table td {
              border: 1px solid #cbd5e1 !important;
              padding: 10px 12px !important;
              text-align: left !important;
              font-size: 11px !important;
            }
            .print-table th {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
              color: #1e293b !important;
            }
            .print-header {
              border-bottom: 3px double #0f172a;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }
            .print-badge-high {
              background-color: #fef2f2 !important;
              color: #dc2626 !important;
              border: 1px solid #fee2e2 !important;
              font-weight: bold !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
            }
            .print-badge-medium {
              background-color: #fffbeb !important;
              color: #d97706 !important;
              border: 1px solid #fef3c7 !important;
              font-weight: bold !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
            }
            .print-badge-low {
              background-color: #f0fdf4 !important;
              color: #16a34a !important;
              border: 1px solid #dcfce7 !important;
              font-weight: bold !important;
              padding: 2px 6px !important;
              border-radius: 4px !important;
            }
          }
        ` }} />

        {/* Real Content for PDF Printing */}
        <div className="text-black bg-white p-6 max-w-4xl mx-auto font-sans leading-relaxed">
          <div className="print-header flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <div className="text-xs font-bold text-red-600 tracking-widest uppercase">ЦЛКОМ ТАЄМНО / CLASSIFIED SECURITY INTELLIGENCE</div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">ОФІЦІЙНИЙ АНАЛІТИЧНИЙ ЗВІТ OSINT / РИЗИК-АНАЛІЗУ</h1>
              <div className="text-xs text-slate-500 font-mono mt-0.5">PREDATOR OSINT INTELLIGENCE WORKSPACE • GENERATED AUTOMATICALLY</div>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-600 space-y-0.5 border-l border-slate-300 pl-4">
              <div>ДАТА: {new Date().toLocaleString('uk-UA')}</div>
              <div>КОРИСТУВАЧ: vkizima534@gmail.com</div>
              <div>СИСТЕМА: PREDATOR V4.2-SECURE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Параметри фільтрації запиту:</h3>
              <div className="mt-1.5 space-y-1 text-xs text-slate-700 font-mono">
                <div>• База OSINT: <span className="font-bold">{activeFilter === 'all' ? 'Всі реєстри' : activeFilter === 'company' ? 'Юридичні особи (ЄДР)' : activeFilter === 'person' ? 'Фізичні особи / ФОП' : 'Криптоактиви'}</span></div>
                <div>• Категорія: <span className="font-bold">{categoryFilter === 'all' ? 'Всі статуси' : categoryFilter === 'sanctioned' ? 'Під санкціями' : categoryFilter === 'active' ? 'Активні' : 'Високий ризик'}</span></div>
                <div>• Рівень ризику: <span className="font-bold">{riskLevelFilter === 'all' ? 'Всі рівні' : riskLevelFilter === 'high' ? 'High' : riskLevelFilter === 'medium' ? 'Medium' : 'Low'}</span></div>
                {searchQuery.trim() && <div>• Пошуковий фільтр: <span className="font-bold">"{searchQuery}"</span></div>}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Статистичні показники звіту:</h3>
              <div className="mt-1.5 space-y-1 text-xs text-slate-700 font-mono">
                <div>• Всього об'єктів у звіті: <span className="font-bold text-slate-900">{filteredEntities.length}</span></div>
                <div>• Об'єктів з високим ризиком (High): <span className="font-bold text-red-600">{filteredEntities.filter(e => e.riskScore >= 80).length}</span></div>
                <div>• Об'єктів з середнім ризиком (Medium): <span className="font-bold text-amber-600">{filteredEntities.filter(e => e.riskScore >= 50 && e.riskScore < 80).length}</span></div>
                <div>• Об'єктів з низьким ризиком (Low): <span className="font-bold text-emerald-600">{filteredEntities.filter(e => e.riskScore < 50).length}</span></div>
              </div>
            </div>
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Код / ID</th>
                <th>Назва / Ім'я об'єкта</th>
                <th style={{ width: '120px' }}>Реєстр / Тип</th>
                <th style={{ width: '85px' }}>Ризик (%)</th>
                <th style={{ width: '100px' }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map(e => {
                const isHigh = e.riskScore >= 80;
                const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                const badgeClass = isHigh ? 'print-badge-high' : isMedium ? 'print-badge-medium' : 'print-badge-low';
                const label = isHigh ? 'High Risk' : isMedium ? 'Medium Risk' : 'Low Risk';
                return (
                  <tr key={e.id}>
                    <td className="font-mono font-bold text-slate-800">{e.code}</td>
                    <td>
                      <div className="font-bold text-slate-900">{e.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{e.description}</div>
                    </td>
                    <td className="font-mono text-slate-600 text-xs">
                      {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                    </td>
                    <td className="font-mono font-bold text-slate-900">{e.riskScore}%</td>
                    <td>
                      <span className={badgeClass}>{label}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredEntities.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500 font-mono">
                    Жодних об'єктів за обраними критеріями фільтрації не знайдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-800 uppercase tracking-wider">ПРИМІТКА БЕЗПЕКИ:</div>
              <p className="mt-1 text-slate-500 text-[10px] leading-normal">
                Цей документ містить закриті аналітичні дані системи моніторингу Predator. Копіювання та розповсюдження третім особам без відповідного допуску заборонено згідно чинного законодавства.
              </p>
            </div>
            <div className="text-right flex flex-col items-end justify-end">
              <div className="w-48 border-b border-slate-400 h-10"></div>
              <div className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-wider">Підпис відповідального аналітика</div>
              <div className="text-[9px] text-indigo-600 font-mono mt-1">vkizima534@gmail.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal Preview (Framer Motion Overlay) */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="report-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4.5 h-4.5 text-rose-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Генератор звітів OSINT</h3>
                    <p className="text-[9px] text-slate-500 font-mono">Попередній перегляд та друк звіту</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 custom-scrollbar flex justify-center">
                
                {/* Paper page mimic */}
                <div className="w-full max-w-3xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl border border-slate-200 my-4 select-text">
                  
                  {/* Internal Report representation */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                    <div>
                      <div className="text-[9px] font-bold text-red-600 tracking-wider uppercase font-mono">ЦЛКОМ ТАЄМНО / CLASSIFIED SECURITY</div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1 uppercase">ОФІЦІЙНИЙ АНАЛІТИЧНИЙ ЗВІТ OSINT</h1>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">PREDATOR SECURITY INTELLIGENCE MATRIX</div>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-600 space-y-0.5 border-l border-slate-200 pl-4">
                      <div>ДАТА: {new Date().toLocaleDateString('uk-UA')}</div>
                      <div>КОРИСТУВАЧ: vkizima534@gmail.com</div>
                      <div>СИСТЕМА: PREDATOR V4.2</div>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200/80 mb-6 text-xs text-slate-700">
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Критерії пошуку:</div>
                      <div className="mt-1 space-y-0.5 font-mono">
                        <div>База: {activeFilter === 'all' ? 'Всі реєстри' : activeFilter === 'company' ? 'Юридичні особи (ЄДР)' : activeFilter === 'person' ? 'Фізичні особи' : 'Криптоактиви'}</div>
                        <div>Категорія: {categoryFilter === 'all' ? 'Всі статуси' : categoryFilter === 'sanctioned' ? 'Під санкціями' : categoryFilter === 'active' ? 'Активні' : 'Високий ризик'}</div>
                        <div>Ризик: {riskLevelFilter === 'all' ? 'Всі рівні' : riskLevelFilter === 'high' ? 'High' : riskLevelFilter === 'medium' ? 'Medium' : 'Low'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Статистичні показники:</div>
                      <div className="mt-1 space-y-0.5 font-mono">
                        <div>Всього об'єктів: <span className="font-bold">{filteredEntities.length}</span></div>
                        <div>Високий ризик (High): <span className="text-red-600 font-bold">{filteredEntities.filter(e => e.riskScore >= 80).length}</span></div>
                        <div>Середній ризик (Med): <span className="text-amber-600 font-bold">{filteredEntities.filter(e => e.riskScore >= 50 && e.riskScore < 80).length}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Data Table preview */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                          <th className="p-2 font-bold font-mono">Код / ID</th>
                          <th className="p-2 font-bold">Назва / Ім'я об'єкта</th>
                          <th className="p-2 font-bold">Тип реєстру</th>
                          <th className="p-2 font-bold">Ризик %</th>
                          <th className="p-2 font-bold">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredEntities.map(e => {
                          const isHigh = e.riskScore >= 80;
                          const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="p-2 font-mono font-bold text-slate-800">{e.code}</td>
                              <td className="p-2 text-slate-900">
                                <div className="font-bold">{e.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{e.description}</div>
                              </td>
                              <td className="p-2 text-slate-600 font-mono text-[11px]">
                                {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                              </td>
                              <td className="p-2 font-mono font-bold text-slate-950">{e.riskScore}%</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isHigh 
                                    ? 'bg-red-50 text-red-600 border border-red-200' 
                                    : isMedium 
                                      ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}>
                                  {isHigh ? 'High' : isMedium ? 'Medium' : 'Low'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredEntities.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400 font-mono">
                              Жодних збігів за обраними фільтрами не знайдено.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-slate-700 block">Predator Intelligence Security</span>
                      <span>Документ згенеровано автоматично в захищеному сеансі користувача.</span>
                    </div>
                    <div className="text-right font-mono text-indigo-600 text-[9px]">
                      vkizima534@gmail.com
                    </div>
                  </div>

                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Загалом записів у звіті: <strong className="text-slate-300 font-bold">{filteredEntities.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/20 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Надрукувати / Зберегти як PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive OSINT Entity Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="osint-preview-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-5xl h-[80vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25">
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">Генератор звітів: Попередній перегляд даних</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Перевірка записів перед остаточним експортуванням</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Filtering metadata info banner */}
              <div className="px-6 py-3 bg-slate-950/20 border-b border-slate-800/60 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-600 uppercase">Фільтр:</span>{' '}
                  <span className="text-slate-200 font-bold">
                    {activeFilter === 'all' ? 'Всі реєстри' : activeFilter === 'company' ? 'Юридичні особи' : activeFilter === 'person' ? 'Фізичні особи' : 'Криптоактиви'}
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-800 self-center" />
                <div>
                  <span className="text-slate-600 uppercase">Категорія:</span>{' '}
                  <span className="text-slate-200 font-bold">
                    {categoryFilter === 'all' ? 'Всі статуси' : categoryFilter === 'sanctioned' ? 'Під санкціями' : categoryFilter === 'active' ? 'Активні' : 'Високий ризик'}
                  </span>
                </div>
                <div className="w-px h-3 bg-slate-800 self-center" />
                <div>
                  <span className="text-slate-600 uppercase">Рівень ризику:</span>{' '}
                  <span className="text-slate-200 font-bold">
                    {riskLevelFilter === 'all' ? 'Всі рівні' : riskLevelFilter === 'high' ? 'High Risk' : riskLevelFilter === 'medium' ? 'Medium Risk' : 'Low Risk'}
                  </span>
                </div>
                {searchQuery.trim() && (
                  <>
                    <div className="w-px h-3 bg-slate-800 self-center" />
                    <div>
                      <span className="text-slate-600 uppercase">Пошук:</span>{' '}
                      <span className="text-indigo-400 font-bold">"{searchQuery}"</span>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Body - Data Table */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40 custom-scrollbar">
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                        <th className="p-3 font-semibold">Код / ID</th>
                        <th className="p-3 font-semibold">Назва / Ім'я об'єкта</th>
                        <th className="p-3 font-semibold">Реєстр / Тип</th>
                        <th className="p-3 font-semibold text-center">Ризик %</th>
                        <th className="p-3 font-semibold">Опис об'єкта</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {filteredEntities.map(e => {
                        const isHigh = e.riskScore >= 80;
                        const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                        return (
                          <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-bold text-slate-400 whitespace-nowrap">{e.code}</td>
                            <td className="p-3">
                              <span className="font-sans font-bold text-slate-100">{e.name}</span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] font-sans">
                              {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isHigh 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                  : isMedium 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {e.riskScore}%
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px] font-sans max-w-xs truncate" title={e.description}>
                              {e.description}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredEntities.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-[11px]">
                            Жодних об'єктів за обраними критеріями фільтрації не знайдено.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] text-slate-500 font-mono">
                  Загалом записів у таблиці: <strong className="text-slate-300 font-bold">{filteredEntities.length}</strong>
                </span>
                
                <div className="flex items-center gap-3">
                  {/* Format quick switcher in the footer */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-900/40 relative text-[10px] select-none shrink-0">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                        exportFormat === 'csv'
                          ? 'text-indigo-400'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                        exportFormat === 'pdf'
                          ? 'text-rose-400'
                          : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <span>PDF</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Закрити
                  </button>
                  
                  {exportFormat === 'csv' ? (
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        handleCSVExport();
                      }}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950/20 cursor-pointer transition-colors"
                    >
                      {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      <span>Експортувати CSV</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        handlePDFExport();
                      }}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/20 cursor-pointer transition-colors"
                    >
                      {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-4 h-4" />}
                      <span>Згенерувати PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
