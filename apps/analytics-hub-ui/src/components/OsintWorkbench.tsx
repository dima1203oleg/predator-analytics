/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, ShieldAlert, Network, Map, Globe, Briefcase, User, 
  DollarSign, FileText, Compass, Server, CheckCircle, HelpCircle, 
  AlertTriangle, ArrowRight, Zap, RefreshCw, Send, Plus, Filter,
  TrendingUp, ShieldCheck, Landmark, ChevronRight, Hash, Truck,
  X, Printer, FileDown, Eye, EyeOff, Sliders, Copy, Check, Calendar,
  MapPin, Layers, Brain, Users, Wallet, AlertCircle, Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OsintVisualizerPanel } from './OsintVisualizerPanel';
import { OsintGeopoliticalMap } from './OsintGeopoliticalMap';
import { OsintDossierPanel } from './OsintDossierPanel';
import { useOsintSearch } from '../hooks/useOsint';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';
import { apiFetch } from '../api';
import OsintFiltersPanel from './OsintFiltersPanel';
import OsintResultsGrid from './OsintResultsGrid';
import OsintExportPanel from './OsintExportPanel';
import { DossierCompiler } from './DossierCompiler';

interface OsintWorkbenchProps {
  onSelectEntityForInspector: (entity: OsintEntity | null) => void;
  selectedEntity: OsintEntity | null;
  userRole?: 'admin' | 'predator' | 'predator-pro';
}


export default function OsintWorkbench({ 
  onSelectEntityForInspector, 
  selectedEntity,
  userRole = 'predator-pro'
}: OsintWorkbenchProps) {
  const [searchQuery, setSearchQuery] = useState('');
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

  // React Query Integration
  const activeDatabases = useMemo(() => new Set(['all']), []);
  const { data: searchResults = [], isLoading: isSearching } = useOsintSearch(searchQuery, activeDatabases, { start: startDate, end: endDate });
  
  // API States (Mocking the rest for now)
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiTools, setApiTools] = useState<any[]>([]);
  const [apiRegistries, setApiRegistries] = useState<any>(null);
  const [apiFeed, setApiFeed] = useState<any[]>([]);

  // Fetch static OSINT data on mount
  useEffect(() => {
    const fetchOsintData = async () => {
      try {
        const [statsRes, toolsRes, registriesRes, feedRes] = await Promise.all([
          apiFetch('/api/v1/osint/stats').catch(() => null),
          apiFetch('/api/v1/osint/tools').catch(() => null),
          apiFetch('/api/v1/osint/registries').catch(() => null),
          apiFetch('/api/v1/osint/feed').catch(() => null)
        ]);
        
        if (statsRes?.ok) setApiStats(await statsRes.json());
        if (toolsRes?.ok) setApiTools(await toolsRes.json());
        if (registriesRes?.ok) setApiRegistries(await registriesRes.json());
        if (feedRes?.ok) setApiFeed(await feedRes.json());
      } catch (err) {
        console.error('OSINT API fetch error:', err);
      }
    };
    fetchOsintData();
  }, []);

  // Checklist Multi-Selection and Simulation States
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>(OSINT_ENTITIES.map(e => e.id));
  const [simulateLargeDataset, setSimulateLargeDataset] = useState(false);
  const [showLargeExportConfirmation, setShowLargeExportConfirmation] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<'csv' | 'pdf' | null>(null);

  // Memoized filtered entities for the quick-access sidebar list
  const filteredEntities = useMemo(() => {
    // 1. Filter local mock entities
    const localFiltered = OSINT_ENTITIES.filter(entity => {
      // Apply search query if typed
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = entity.name.toLowerCase().includes(query) || 
                              entity.code.includes(searchQuery) ||
                              entity.description.toLowerCase().includes(query);
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

    // 2. Add API Search results (deduplicating by code)
    const apiFiltered = searchResults.filter(apiItem => !localFiltered.some(local => local.code === apiItem.code));
    
    // Apply the same filters to API results
    const finalApi = apiFiltered.filter(entity => {
      const matchesType = activeFilter === 'all' || entity.type === activeFilter;
      if (!matchesType) return false;
      if (categoryFilter === 'sanctioned' && entity.status !== 'SANCTIONED') return false;
      if (categoryFilter === 'active' && entity.status !== 'ACTIVE') return false;
      if (categoryFilter === 'high-risk' && entity.riskScore < 75) return false;
      if (riskLevelFilter === 'high' && entity.riskScore < 80) return false;
      if (riskLevelFilter === 'medium' && (entity.riskScore < 50 || entity.riskScore >= 80)) return false;
      if (riskLevelFilter === 'low' && entity.riskScore >= 50) return false;
      return true;
    });

    return [...localFiltered, ...finalApi];
  }, [searchQuery, activeFilter, categoryFilter, riskLevelFilter, startDate, endDate, searchResults]);

  const toggleEntitySelection = (id: string) => {
    setSelectedEntityIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleAllEntitiesSelection = () => {
    const visibleIds = filteredEntities.map(e => e.id);
    const allVisibleAreSelected = visibleIds.every(id => selectedEntityIds.includes(id));
    if (allVisibleAreSelected) {
      setSelectedEntityIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedEntityIds(prev => {
        const newSelection = [...prev];
        visibleIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Generate real + virtual list of entities for export to support testing >50 limit
  const selectedEntitiesForExport = useMemo(() => {
    const realSelected = filteredEntities.filter(e => selectedEntityIds.includes(e.id));
    if (simulateLargeDataset) {
      const mockEntities = Array.from({ length: 65 }, (_, index) => ({
        id: `mock-${index}`,
        type: index % 3 === 0 ? 'company' : index % 3 === 1 ? 'person' : 'cryptowallet',
        name: index % 3 === 0 
          ? `ТОВ 'ТестТрейд ${index + 1}'` 
          : index % 3 === 1 
            ? `Петренко Іван ${index + 1}` 
            : `Crypto Wallet #${index + 1}`,
        code: index % 3 === 0 
          ? `${30000000 + index}` 
          : index % 3 === 1 
            ? `${2000000000 + index}` 
            : `bc1qxy2kg3ut7wvufgz7h0df30097h42831d${index}`,
        status: index % 4 === 0 ? 'SANCTIONED' : index % 4 === 1 ? 'SUSPICIOUS' : 'ACTIVE',
        riskScore: Math.floor(Math.random() * 40) + 50, // 50 to 90
        address: `м. Київ, вул. Тестова, буд. ${index + 1}`,
        description: `Симульований тестовий запис для перевірки експорту великих масивів даних. Створено з метою верифікації лімітів та навантаження. Запис №${index + 1}.`,
        relationships: [],
        aiRecommendations: "Рекомендується перевірити транзакційну активність.",
        lastActivityDate: "2026-06-25"
      } as OsintEntity));
      return [...realSelected, ...mockEntities];
    }
    return realSelected;
  }, [filteredEntities, selectedEntityIds, simulateLargeDataset]);

  const executeCSVExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      const payload = selectedEntitiesForExport.map(e => ({
        id: e.id,
        name: e.name,
        code: e.code,
        type: e.type,
        riskLevel: `${e.riskScore}%`,
        status: e.status,
        source: 'OSINT',
        matchScore: e.riskScore,
        description: e.description
      }));
      
      const response = await apiFetch('/api/v1/osint/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to generate CSV on backend');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OSINT_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const executePDFExport = () => {
    // For PDF, we might still show the report modal for preview
    // or just directly download. Let's just download directly to test backend.
    downloadPDF();
  };

  const downloadPDF = async () => {
    setIsExporting(true);
    try {
      const payload = selectedEntitiesForExport.map(e => ({
        id: e.id,
        name: e.name,
        code: e.code,
        type: e.type,
        riskLevel: `${e.riskScore}%`,
        status: e.status,
        source: 'OSINT',
        matchScore: e.riskScore,
        description: e.description
      }));
      
      const response = await apiFetch('/api/v1/osint/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF on backend');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OSINT_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Export failed", error);
    } finally {
      setIsExporting(false);
      setShowReportModal(false);
    }
  };

  const handleCSVExport = () => {
    if (selectedEntitiesForExport.length > 50) {
      setPendingExportType('csv');
      setShowLargeExportConfirmation(true);
    } else {
      executeCSVExport();
    }
  };

  const handlePDFExport = () => {
    if (selectedEntitiesForExport.length > 50) {
      setPendingExportType('pdf');
      setShowLargeExportConfirmation(true);
    } else {
      executePDFExport();
    }
  };

  const confirmAndExecuteExport = () => {
    setShowLargeExportConfirmation(false);
    if (pendingExportType === 'csv') {
      executeCSVExport();
    } else if (pendingExportType === 'pdf') {
      executePDFExport();
    }
    setPendingExportType(null);
  };
  




  // Interactive Map State variables
  const [mapZoom, setMapZoom] = useState<'ukraine' | 'kyiv' | 'lviv' | 'global'>('ukraine');
  const [mapShowFlows, setMapShowFlows] = useState(true);
  const [mapShowHeatmap, setMapShowHeatmap] = useState(false);
  const [mapHoverCoords, setMapHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const handleCopyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };


  
  // Local active entity (defaults to the first one)
  const activeEntity = selectedEntity || OSINT_ENTITIES[0];



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
      
      {/* API Stats Banner */}
      {apiStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4" id="api-stats-banner">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono uppercase">Компаній в базі</span>
            <div className="text-xl font-bold text-slate-200">{apiStats.total_records?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-rose-900/40">
            <span className="text-[10px] text-rose-500/70 font-mono uppercase">Високий ризик</span>
            <div className="text-xl font-bold text-rose-400">{apiStats.high_risk_found?.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-900/40">
            <span className="text-[10px] text-indigo-400/70 font-mono uppercase">Джерел сканування</span>
            <div className="text-xl font-bold text-indigo-400">{apiStats.sources_scanned}</div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-900/40">
            <span className="text-[10px] text-emerald-400/70 font-mono uppercase">Активні монітори</span>
            <div className="text-xl font-bold text-emerald-400">{apiStats.active_monitors}</div>
          </div>
        </div>
      )}
      
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
      <OsintFiltersPanel
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        riskLevelFilter={riskLevelFilter}
        setRiskLevelFilter={setRiskLevelFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        heatmapSensitivity={heatmapSensitivity}
        setHeatmapSensitivity={setHeatmapSensitivity}
        filteredEntities={filteredEntities}
        riskDistribution={riskDistribution}
      />

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

      {/* DIE Compiler Interface */}
      <div className="mb-6">
        <DossierCompiler onDossierComplete={(data) => {
          console.log('DIE Dossier Compiled:', data);
          const newEntity = {
            id: data.dossier_id || `temp-${Date.now()}`,
            type: data.entity_type === 'person' ? 'person' : data.entity_type === 'company' ? 'company' : 'cryptowallet',
            name: data.entity_name || data.identifier || 'Unknown Entity',
            code: data.identifier || '',
            status: data.risk_assessment?.risk_level === 'CRITICAL' ? 'SANCTIONED' : data.risk_assessment?.risk_level === 'HIGH' ? 'SUSPICIOUS' : 'ACTIVE',
            riskScore: data.risk_assessment?.ml_risk_score || Math.floor(Math.random() * 50) + 10,
            address: 'Дані зібрані в реальному часі',
            description: `Досьє скомпільовано: ${data.compiled_at ? new Date(data.compiled_at).toLocaleString() : new Date().toLocaleString()}.\nЗнайдено записів: ${data.total_records_found || 0}.`,
            relationships: (data.graph?.nodes || []).slice(0, 5).map((n: any) => ({
              targetId: n.id,
              targetName: n.name || n.id,
              type: 'ЗВ\'ЯЗОК_ВСТАНОВЛЕНО',
              risk: 'MEDIUM'
            })),
            aiRecommendations: data.risk_assessment?.narrative || 'Дані проаналізовано автоматизованою системою. Рекомендується ручна перевірка аналітиком.',
            telegramData: data.sections?.telegram?.data?.groups_found?.map((g: any) => ({
              channelName: g.title || g.name,
              subscribers: g.subscribers || 'Невідомо',
              posts: g.posts_scraped ? data.sections.telegram.data.public_posts : []
            })) || [],
            socialMediaProfiles: data.sections?.social_media?.raw_records?.map((p: any) => ({
              platform: p.platform,
              url: p.url,
              profileName: p.profile_name,
              note: p.note
            })) || [],
            cryptoData: data.sections?.blockchain_btc?.data || data.sections?.blockchain_eth?.data || undefined,
            leakData: data.sections?.data_breaches ? {
              ...data.sections.data_breaches.data,
              records: data.sections.data_breaches.raw_records
            } : undefined,
          };
          onSelectEntityForInspector(newEntity as any);
        }} />
      </div>

      {/* Grid: 3 Columns - Quick Filtered List Left, Detailed Dossier Middle, Graph/Map Visualizers Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: List of filtered entities with categories */}
        <div className="xl:col-span-3 space-y-6" id="osint-list-panel">
          
          {/* API Sources Block */}
          {apiRegistries && apiRegistries.length > 0 && (
            <div className="glass-card rounded-2xl p-4 shadow-xl">
              <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">Підключені Реєстри</h3>
              <div className="flex flex-wrap gap-1.5">
                {apiRegistries.map(reg => (
                  <span key={reg.id} className="text-[9px] bg-slate-950/50 border border-slate-800 text-slate-300 px-2 py-1 rounded" title={reg.description}>
                    {reg.name}
                    <span className={`ml-1.5 w-1.5 h-1.5 inline-block rounded-full ${reg.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </span>
                ))}
              </div>
              
              {apiTools && apiTools.length > 0 && (
                <>
                  <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mt-4 mb-2">OSINT Інструменти</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {apiTools.map(tool => (
                      <span key={tool.id} className="text-[9px] bg-slate-950/50 border border-slate-800 text-slate-300 px-2 py-1 rounded" title={tool.description}>
                        {tool.name}
                        <span className={`ml-1.5 w-1.5 h-1.5 inline-block rounded-full ${tool.status === 'online' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="glass-card rounded-2xl p-4.5 shadow-xl flex flex-col h-[650px]" id="osint-list-card">
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

            {/* Selection control bar */}
            <div className="flex items-center justify-between glass-panel/60 rounded-xl px-2.5 py-1.5 mb-3 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={filteredEntities.length > 0 && filteredEntities.every(e => selectedEntityIds.includes(e.id))}
                  onChange={toggleAllEntitiesSelection}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-indigo-500"
                  title="Вибрати всі / зняти вибір"
                />
                <span>Обрано: <strong className="text-indigo-400 font-bold">{selectedEntitiesForExport.length}</strong></span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors" title="Додати 65 віртуальних об'єктів для перевірки попередження про понад 50 об'єктів">
                <input
                  type="checkbox"
                  checked={simulateLargeDataset}
                  onChange={(e) => setSimulateLargeDataset(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-rose-500"
                />
                <span className="text-[9px] text-rose-400/90 font-bold uppercase tracking-tight">Тест &gt;50</span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <OsintResultsGrid
                filteredEntities={filteredEntities}
                activeEntity={activeEntity}
                selectedEntityIds={selectedEntityIds}
                toggleEntitySelection={toggleEntitySelection}
                toggleAllEntitiesSelection={toggleAllEntitiesSelection}
                onSelectEntityForInspector={onSelectEntityForInspector}
                setSimulateLargeDataset={setSimulateLargeDataset}
                simulateLargeDataset={simulateLargeDataset}
                getRiskTheme={getRiskTheme}
                getStatusBadgeShort={getStatusBadgeShort}
                handleCopyToClipboard={handleCopyToClipboard}
                copiedField={copiedField}
                resetFilters={() => {
                  setActiveFilter('all');
                  setCategoryFilter('all');
                  setRiskLevelFilter('all');
                  setSearchQuery('');
                  setStartDate('');
                  setEndDate('');
                }}
                isFiltersActive={
                  activeFilter !== 'all' ||
                  categoryFilter !== 'all' ||
                  riskLevelFilter !== 'all' ||
                  searchQuery !== '' ||
                  startDate !== '' ||
                  endDate !== ''
                }
                selectedEntitiesCount={selectedEntityIds.length}
              />
            </div>
          </div>
        </div>

        {/* Middle Column: Dossier Card Profile (Section 13) */}
        <OsintDossierPanel 
          activeEntity={activeEntity}
          userRole={userRole}
          onSelectEntityForInspector={onSelectEntityForInspector}
        />

        {/* Right Column: Dynamic Link Graph & Cargo Routes Visualizers (Section 14 & 15) */}
        <div className="xl:col-span-5 space-y-6" id="osint-visualizer-panel">
          
          {/* Dynamic Cytoscape Graph (Section 14) */}
          <OsintVisualizerPanel activeEntity={activeEntity} onSelectEntityForInspector={onSelectEntityForInspector} />

          {/* Interactive Geopolitical OSINT Map (Section 15) */}
          <OsintGeopoliticalMap 
            activeEntity={activeEntity}
            onSelectEntityForInspector={onSelectEntityForInspector}
            mapZoom={mapZoom}
            setMapZoom={setMapZoom}
          />

          {/* Live API Feed Panel */}
          {apiFeed && apiFeed.length > 0 && (
            <div className="glass-card rounded-2xl p-4.5 shadow-xl flex flex-col mt-6">
              <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Стрічка Подій (Live)
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {apiFeed.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                    <div className="mt-1 flex-shrink-0">
                      {item.severity === 'high' ? (
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                      ) : item.severity === 'medium' ? (
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleString('uk-UA')}</span>
                        <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.source}</span>
                      </div>
                      <p className="text-xs text-slate-200">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Export / Modals Panel */}
      <OsintExportPanel
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        showPreviewModal={showPreviewModal}
        setShowPreviewModal={setShowPreviewModal}
        showLargeExportConfirmation={showLargeExportConfirmation}
        setShowLargeExportConfirmation={setShowLargeExportConfirmation}
        pendingExportType={pendingExportType}
        setPendingExportType={setPendingExportType}
        selectedEntitiesForExport={selectedEntitiesForExport}
        activeFilter={activeFilter}
        categoryFilter={categoryFilter}
        riskLevelFilter={riskLevelFilter}
        searchQuery={searchQuery}
        filteredEntities={filteredEntities}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        isExporting={isExporting}
        downloadPDF={downloadPDF}
        handleCSVExport={handleCSVExport}
        handlePDFExport={handlePDFExport}
        confirmAndExecuteExport={confirmAndExecuteExport}
      />

    </div>
  );
}
