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
  MapPin, Layers, Database, Lock, Shield, ServerCrash, ExternalLink,
  Terminal, ArrowDownLeft, ArrowUpRight, Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';
import PersonProfiler from './PersonProfiler';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'company' | 'person' | 'cryptowallet'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sanctioned' | 'active' | 'high-risk'>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "38294012", "Коваленко Ігор", "BTC Wallet 0x38ac", "ТОВ СпецТехПостач"
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDataSourcesModal, setShowDataSourcesModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapSensitivity, setHeatmapSensitivity] = useState(1.0);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [osintMode, setOsintMode] = useState<'search' | 'person-profiler'>('search');

  const getRiskDynamicsData = useMemo(() => (entity: OsintEntity) => {
    const hash = entity.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    const baseRisk = entity.riskScore;
    const data = [];
    const months = ['Сер', 'Вер', 'Жов', 'Лис', 'Гру', 'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип'];
    for (let i = 0; i < 12; i++) {
      const variance = (Math.sin(hash + i) * 15);
      let val = Math.round(baseRisk - 10 + (i * 0.8) + variance);
      if (i === 11) val = baseRisk;
      val = Math.max(0, Math.min(100, val));
      data.push({ month: months[i], risk: val });
    }
    return data;
  }, []);

  const [pdfConfig, setPdfConfig] = useState({
    metadata: true,
    riskScore: true,
    connections: true,
    timeline: true,
    qrCode: true
  });

  const [entities, setEntities] = useState<OsintEntity[]>(OSINT_ENTITIES);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchError, setLiveSearchError] = useState<string | null>(null);

  // Checklist Multi-Selection and Simulation States
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>(OSINT_ENTITIES.map(e => e.id));
  const [simulateLargeDataset, setSimulateLargeDataset] = useState(false);
  const [showLargeExportConfirmation, setShowLargeExportConfirmation] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<'csv' | 'pdf' | null>(null);

  // Memoized filtered entities for the quick-access sidebar list
  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
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
  }, [searchQuery, activeFilter, categoryFilter, riskLevelFilter, startDate, endDate, entities]);

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

  const exportToCSV = () => {
    // Generate CSV content
    const headers = ["ID", "Назва/Ім'я", "Код/Ідентифікатор", "Тип об'єкта", "Рівень ризику (%)", "Статус", "Опис"];
    const rows = selectedEntitiesForExport.map(e => [
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

  const executeCSVExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV();
      setIsExporting(false);
    }, 1000);
  };

  const executePDFExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setTimeout(() => {
      setShowReportModal(true);
      setIsExporting(false);
    }, 1000);
  };

  const downloadPDF = async () => {
    const input = document.getElementById('pdf-report-content');
    if (!input) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`OSINT_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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


  
  // Local active entity (defaults to the first one)
  const activeEntity = selectedEntity || entities[0];



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
    return entities.filter(e => {
      const matchesText = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.code.includes(searchQuery) ||
                          e.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeFilter === 'all' || e.type === activeFilter;
      return matchesText && matchesType;
    });
  }, [searchQuery, activeFilter, entities]);

  const handleSearchSubmit = async (queryText: string) => {
    if (!queryText.trim()) return;
    
    // Check if there is an exact or partial match
    const lowerQuery = queryText.toLowerCase();
    const found = entities.find(e => 
      lowerQuery.includes(e.name.toLowerCase()) || 
      lowerQuery.includes(e.code.toLowerCase()) ||
      e.name.toLowerCase().includes(lowerQuery) || 
      e.code.toLowerCase().includes(lowerQuery)
    );

    if (found) {
      onSelectEntityForInspector(found);
      setSearchQuery(queryText);
      setShowSuggestions(false);
    } else {
      // Trigger live search API call!
      setIsSearchingLive(true);
      setLiveSearchError(null);
      try {
        const { apiFetch } = await import('@/api');
        const urlParams = new URLSearchParams({ q: queryText });
        if (activeFilter !== 'all') urlParams.append('type', activeFilter);
        const response = await apiFetch(`/api/v1/osint/search?${urlParams.toString()}`, {
          method: "GET",
        });
        if (!response.ok) {
          let errMsg = "Не вдалося отримати дані з OSINT API";
          try {
            const errBody = await response.json();
            if (errBody.error) errMsg = errBody.error;
            else if (errBody.detail) errMsg = typeof errBody.detail === 'string' ? errBody.detail : JSON.stringify(errBody.detail);
          } catch(e) {}
          throw new Error(errMsg);
        }
        const responseData = await response.json();
        
        let entitiesToAdd: OsintEntity[] = [];
        if (Array.isArray(responseData)) {
          entitiesToAdd = responseData.filter(d => d && d.name);
        } else if (responseData && responseData.name) {
          entitiesToAdd = [responseData];
        }

        if (entitiesToAdd.length > 0) {
          const idsToAdd: string[] = [];
          
          setEntities(prev => {
            const newEntities = [...prev];
            entitiesToAdd.forEach(data => {
              // Ensure ID uniqueness if not provided
              data.id = (data.id || `osint-entity-${Date.now()}`) + `-${Math.random().toString(36).substr(2, 5)}`;
              // Adapt data structure if it came from Company search (which might use edrpou instead of code, company_name instead of name)
              if (!data.code && data.edrpou) data.code = data.edrpou;
              if (data.company_name && !data.name) data.name = data.company_name;
              if (!data.type) data.type = "company";
              
              if (!newEntities.find(e => e.id === data.id)) {
                newEntities.unshift(data as OsintEntity);
                idsToAdd.push(data.id);
              }
            });
            return newEntities;
          });
          
          setSelectedEntityIds(prev => {
            const newIds = [...prev];
            idsToAdd.forEach(id => {
              if (!newIds.includes(id)) newIds.unshift(id);
            });
            return newIds;
          });
          
          // Select the first one in parent/inspector
          if (entitiesToAdd[0]) {
             onSelectEntityForInspector(entitiesToAdd[0] as OsintEntity);
          }
          
          setSearchQuery(queryText);
          setShowSuggestions(false);
        } else {
          throw new Error("Некоректний формат відповіді від сервера");
        }
      } catch (error: any) {
        console.error("Live OSINT search error:", error);
        setLiveSearchError(error.message || "Сталася помилка під час виконання запиту");
      } finally {
        setIsSearchingLive(false);
      }
    }

    if (!recentSearches.includes(queryText)) {
      setRecentSearches(prev => [queryText, ...prev.slice(0, 3)]);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-rose-500 border-slate-800 bg-rose-500/5';
    if (score >= 50) return 'text-amber-500 border-slate-800 bg-amber-500/5';
    return 'text-emerald-500 border-slate-800 bg-emerald-500/5';
  };

  const getRiskTheme = (score: number) => {
    if (score >= 80) {
      return {
        badgeClass: 'text-rose-500 border-slate-800 bg-rose-500/5',
        selectedBorderClass: 'border-slate-800 bg-rose-500/10 shadow-2xl shadow-black/40 shadow-rose-950/20',
        unselectedBorderClass: 'border-slate-800 bg-black/40 hover:border-slate-800 hover:bg-rose-500/5',
        indicatorClass: 'bg-rose-500',
        hoverTextClass: 'group-hover:text-rose-400',
        barClass: 'bg-rose-500',
      };
    }
    if (score >= 50) {
      return {
        badgeClass: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
        selectedBorderClass: 'border-amber-400/50 bg-amber-400/10 shadow-2xl shadow-black/40 shadow-amber-950/20',
        unselectedBorderClass: 'border-amber-400/20 bg-black/40 hover:border-amber-400/40 hover:bg-amber-400/5',
        indicatorClass: 'bg-amber-400',
        hoverTextClass: 'group-hover:text-amber-400',
        barClass: 'bg-amber-400',
      };
    }
    return {
      badgeClass: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
      selectedBorderClass: 'border-emerald-400/50 bg-emerald-400/10 shadow-2xl shadow-black/40 shadow-emerald-950/20',
      unselectedBorderClass: 'border-emerald-400/20 bg-black/40 hover:border-emerald-400/40 hover:bg-emerald-400/5',
      indicatorClass: 'bg-emerald-400',
      hoverTextClass: 'group-hover:text-emerald-400',
      barClass: 'bg-emerald-400',
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SANCTIONED':
        return <span className="text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded">Санкції РНБО</span>;
      case 'SUSPICIOUS':
        return <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-slate-800 px-2 py-1 rounded">Підозріла активність</span>;
      case 'ACTIVE':
        return <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-slate-800 px-2 py-1 rounded">Активний</span>;
      default:
        return <span className="text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-800 px-2 py-1 rounded">{status}</span>;
    }
  };

  const getStatusBadgeShort = (status: string) => {
    switch (status) {
      case 'SANCTIONED':
        return <span className="text-xs font-bold text-red-400 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 uppercase tracking-tight">САНКЦІЇ</span>;
      case 'SUSPICIOUS':
        return <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded bg-amber-500/10 border border-slate-800 uppercase tracking-tight">ПІДОЗРА</span>;
      case 'ACTIVE':
        return <span className="text-xs font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-slate-800 uppercase tracking-tight">АКТИВНИЙ</span>;
      default:
        return <span className="text-xs font-mono text-slate-300 px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-slate-800 uppercase tracking-tight">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 relative p-2 rounded-3xl overflow-hidden transition-all duration-1000" id="osint-workbench-root">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60" id="osint-workspace-header">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div>
            <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              <Search className="w-4 h-4 text-blue-400" />
              <span>Інструментарій OSINT Пошуку</span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Система Nexus: Фільтрація, аналітика та генерація звітів контрагентів
            </p>
          </div>

          {filteredEntities.length > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-2xl glass-panel-premium border-slate-800/80 shrink-0 select-none">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${highRiskRatio > 0.4 ? 'bg-rose-500' : highRiskRatio > 0.1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${highRiskRatio > 0.4 ? 'bg-rose-500' : highRiskRatio > 0.1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-tight">
                Інтенсивність загрози: <strong className={`${highRiskRatio > 0.4 ? 'text-rose-400' : highRiskRatio > 0.1 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.round(highRiskRatio * 100)}%</strong>
              </span>
            </div>
          )}
        </div>
        
        {/* Export Control Panel with Format Selector */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-slate-800/60 shrink-0 select-none" id="export-format-selector-panel">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-200 border border-slate-800/40 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all"
            title="Попередній перегляд відфільтрованої таблиці перед експортом"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Перегляд</span>
          </button>
          
          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-2xl border border-slate-800/40 relative">
            <button
              onClick={() => setExportFormat('csv')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                exportFormat === 'csv'
                  ? 'text-blue-400 z-10'
                  : 'text-slate-500 hover:text-slate-300 z-10'
              }`}
            >
              {exportFormat === 'csv' && (
                <motion.div
                  layoutId="activeExportFormat"
                  className="absolute inset-0 bg-blue-500/10 border border-slate-800 rounded-md -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span>CSV</span>
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                exportFormat === 'pdf'
                  ? 'text-rose-400 z-10'
                  : 'text-slate-500 hover:text-slate-300 z-10'
              }`}
            >
              {exportFormat === 'pdf' && (
                <motion.div
                  layoutId="activeExportFormat"
                  className="absolute inset-0 bg-rose-500/10 border border-slate-800 rounded-md -z-10"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-blue-400 border border-slate-800 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  isExporting 
                    ? 'bg-blue-500/5 opacity-60 cursor-not-allowed' 
                    : 'bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-rose-400 border border-slate-800 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
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
                <span>{isExporting ? 'Підготовка...' : 'Generate PDF Brief'}</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 w-fit mb-2">
        <button
          onClick={() => setOsintMode('search')}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            osintMode === 'search'
              ? 'bg-blue-600/20 text-blue-400 border border-slate-800 shadow-2xl shadow-black/40 shadow-blue-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Реєстри & Пошук</span>
        </button>
        <button
          onClick={() => setOsintMode('person-profiler')}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            osintMode === 'person-profiler'
              ? 'bg-rose-600/20 text-rose-400 border border-slate-800 shadow-2xl shadow-black/40 shadow-rose-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Глибокий Аналіз Особи & Номіналів</span>
        </button>
      </div>

      {osintMode === 'person-profiler' ? (
        <PersonProfiler initialPersonId={activeEntity?.id} />
      ) : (
        <>
          {/* Top OSINT filter options */}
          <div className="flex flex-col gap-2 bg-slate-900/10 border border-slate-800/30 p-2 rounded-2xl" id="osint-filters-panel">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5" id="registry-quick-filters">
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Бази OSINT:</span>
            {(['all', 'company', 'person', 'cryptowallet'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${activeFilter === filter ? 'bg-blue-600/15 text-blue-400 border-slate-800 shadow-sm' : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-800'}`}
              >
                {filter === 'all' && 'Всі реєстри'}
                {filter === 'company' && 'Юридичні особи (ЄДР)'}
                {filter === 'person' && 'Фізичні особи / ФОП'}
                {filter === 'cryptowallet' && 'Криптоактиви / Валюта'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowDataSourcesModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl text-emerald-400 border border-slate-800 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Інтеграції та Бази Даних</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" id="category-quick-filters">
          <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Категорія:</span>
          {(['all', 'sanctioned', 'active', 'high-risk'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${categoryFilter === cat ? 'bg-rose-600/15 text-rose-400 border-slate-800 shadow-sm' : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-800'}`}
            >
              {cat === 'all' && 'Всі статуси'}
              {cat === 'sanctioned' && '⚠️ Під санкціями'}
              {cat === 'active' && '✅ Активні'}
              {cat === 'high-risk' && '🚨 Високий ризик'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" id="risk-level-quick-filters">
          <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Рівень ризику:</span>
          {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                riskLevelFilter === lvl 
                  ? lvl === 'high' 
                    ? 'bg-red-500/15 text-red-400 border-red-500/40 shadow-sm' 
                    : lvl === 'medium'
                      ? 'bg-amber-500/15 text-amber-400 border-slate-800 shadow-sm'
                      : lvl === 'low'
                        ? 'bg-emerald-500/15 text-emerald-400 border-slate-800 shadow-sm'
                        : 'bg-blue-600/15 text-blue-400 border-slate-800 shadow-sm'
                  : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-800'
              }`}
            >
              {lvl === 'all' && 'Всі рівні'}
              {lvl === 'high' && '🔴 Високий (High)'}
              {lvl === 'medium' && '🟡 Середній (Medium)'}
              {lvl === 'low' && '🟢 Низький (Low)'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2" id="date-range-filters-container">
          <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Активність з:</span>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Start Date */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-2.5 py-1 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono text-slate-500 uppercase">Початок:</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none focus:text-blue-400 [color-scheme:dark] border-0 outline-none p-0 cursor-pointer"
              />
            </div>
            
            {/* End Date */}
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl px-2.5 py-1 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-mono text-slate-500 uppercase">Кінець:</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none focus:text-blue-400 [color-scheme:dark] border-0 outline-none p-0 cursor-pointer"
              />
            </div>

            {/* Quick presets */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setStartDate('2026-01-01');
                  setEndDate('2026-12-31');
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  startDate === '2026-01-01' && endDate === '2026-12-31' 
                    ? 'bg-blue-600/15 text-blue-400 border-slate-800 shadow-sm' 
                    : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-800'
                }`}
              >
                2026 рік
              </button>
              <button
                onClick={() => {
                  setStartDate('2025-01-01');
                  setEndDate('2025-12-31');
                }}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  startDate === '2025-01-01' && endDate === '2025-12-31' 
                    ? 'bg-blue-600/15 text-blue-400 border-slate-800 shadow-sm' 
                    : 'bg-slate-900/40 text-slate-300 border-slate-800 hover:border-slate-800'
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
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono font-bold px-2 py-1 cursor-pointer transition-colors"
                >
                  Очистити дати
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Heatmap Visibility and Intensity controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-800/40 mt-1" id="heatmap-control-panel">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider mr-2 min-w-[80px]">Теплова карта:</span>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                showHeatmap 
                  ? 'bg-rose-500/15 text-rose-400 border-slate-800 shadow-sm' 
                  : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-800'
              }`}
            >
              {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{showHeatmap ? 'Відображається' : 'Прихована'}</span>
            </button>
          </div>

          {showHeatmap && (
            <div className="flex items-center gap-2 bg-black/40 border border-slate-800/60 rounded-2xl px-2 py-1.5 flex-1 sm:flex-initial sm:min-w-[210px]">
              <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
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
                className="w-full accent-rose-500 h-1 bg-slate-800 rounded-2xl appearance-none cursor-pointer"
              />
              <span className="text-xs text-rose-400 font-mono font-bold min-w-[30px] text-right shrink-0">
                {Math.round(heatmapSensitivity * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Real-time Risk Distribution Histogram */}
        <div className="pt-4 border-t border-slate-800/40 mt-1" id="risk-distribution-histogram-widget">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-300 font-mono font-bold uppercase tracking-wider">
                Розподіл ризику сутностей у реальному часі
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
              Відфільтровано: <strong className="text-blue-400 font-bold">{filteredEntities.length}</strong> з <strong className="text-slate-300 font-bold">{entities.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* High Risk Category */}
            <div className="bg-black/40 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between hover:border-slate-800 hover:bg-rose-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="flex items-center gap-1.5 font-bold text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  HIGH RISK (≥80)
                </span>
                <span className="font-bold text-rose-400 bg-rose-500/10 border border-slate-800 px-2 py-1 rounded">
                  {riskDistribution.high} ({Math.round(riskDistribution.highPercent)}%)
                </span>
              </div>
              <div className="h-2 bg-black/40 backdrop-blur-md rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${riskDistribution.highPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                />
              </div>
            </div>

            {/* Medium Risk Category */}
            <div className="bg-black/40 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between hover:border-slate-800 hover:bg-amber-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  MEDIUM RISK (50-79)
                </span>
                <span className="font-bold text-amber-400 bg-amber-500/10 border border-slate-800 px-2 py-1 rounded">
                  {riskDistribution.medium} ({Math.round(riskDistribution.mediumPercent)}%)
                </span>
              </div>
              <div className="h-2 bg-black/40 backdrop-blur-md rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${riskDistribution.mediumPercent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                />
              </div>
            </div>

            {/* Low Risk Category */}
            <div className="bg-black/40 border border-slate-800/60 p-2 rounded-2xl flex flex-col justify-between hover:border-slate-800 hover:bg-emerald-500/5 transition-all duration-300 group">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  LOW RISK (&lt;50)
                </span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-slate-800 px-2 py-1 rounded">
                  {riskDistribution.low} ({Math.round(riskDistribution.lowPercent)}%)
                </span>
              </div>
              <div className="h-2 bg-black/40 backdrop-blur-md rounded-full overflow-hidden relative">
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
        <div className="bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl flex items-center p-1 shadow-2xl">
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
            className="flex-1 bg-transparent px-2 py-1.5 text-xs font-medium text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 font-mono"
            >
              Очистити
            </button>
          )}
          <button
            onClick={() => handleSearchSubmit(searchQuery)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2 py-1.5 shadow-2xl shadow-black/40 rounded-2xl transition-all mr-1"
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
              className="absolute left-0 right-0 mt-1.5 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-900 max-h-[300px] overflow-y-auto"
            >
              {suggestions.length > 0 && (
                <div className="p-2.5">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider px-2">
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
                        className="w-full text-left px-2 py-1.5 rounded-2xl hover:bg-black/40 backdrop-blur-md flex items-center justify-between text-xs text-slate-300 group"
                      >
                        <div className="flex items-center gap-2.5">
                          {entity.type === 'company' ? (
                            <Briefcase className="w-4 h-4 text-blue-400" />
                          ) : entity.type === 'cryptowallet' ? (
                            <Landmark className="w-4 h-4 text-amber-400" />
                          ) : (
                            <User className="w-4 h-4 text-teal-400" />
                          )}
                          <div>
                            <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                              {entity.name}
                            </span>
                            <span className="text-xs text-slate-500 font-mono ml-2">
                              {entity.code}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-mono px-2 py-1 rounded border ${getRiskColor(entity.riskScore)}`}>
                            Risk: {entity.riskScore}%
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length === 0 && searchQuery.trim() !== "" && (
                <div className="p-2 text-center">
                  <p className="text-xs text-slate-300 mb-2.5">
                    Даний об'єкт не знайдено у локальній базі даних.
                  </p>
                  <button
                    onClick={() => handleSearchSubmit(searchQuery)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-2 py-1.5 shadow-2xl shadow-black/40 rounded-2xl transition-all"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Запустити зовнішній OSINT-пошук NEXUS
                  </button>
                </div>
              )}

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="p-2.5 bg-black/40">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider px-2">
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
                        className="text-xs text-slate-300 hover:text-white bg-black/40 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-md transition-colors"
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

      {/* Dynamic OSINT Search Loading Indicator */}
      <AnimatePresence>
        {isSearchingLive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-2 shadow-[0_0_15px_rgba(99,102,241,0.15)] flex flex-col md:flex-row gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-slate-800 border-b-emerald-500 animate-spin [animation-duration:1.5s]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Ініційовано інтелектуальний OSINT-пошук
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Шукаємо дані по запиту <span className="text-blue-400 font-bold">"{searchQuery}"</span> у державних реєстрах, реєстрах МВС, Darknet-форумах, витоках баз даних (2020-2024), базах Інтерполу та крипто-міксерах...
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end text-right font-mono text-xs text-blue-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  API GATEWAY: ONLINE
                </div>
                <div className="text-slate-500">
                  ESTIMATED TIME: ~5-10s
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {liveSearchError && (
        <div className="mb-6 bg-rose-950/20 border border-slate-800 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <p className="text-xs text-rose-300 font-mono">
              ПОМИЛКА ПОШУКУ: {liveSearchError}
            </p>
          </div>
          <button 
            onClick={() => setLiveSearchError(null)}
            className="text-xs font-mono text-rose-400 hover:text-rose-200"
          >
            Приховати
          </button>
        </div>
      )}

      {/* Grid: 3 Columns - Quick Filtered List Left, Detailed Dossier Middle, Graph/Map Visualizers Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
        
        {/* Left Column: List of filtered entities with categories */}
        <div className="xl:col-span-3 space-y-6" id="osint-list-panel">
          <div className="glass-panel-premium border-slate-800 rounded-2xl p-2 shadow-xl flex flex-col h-[650px]" id="osint-list-card">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  Об'єкти ({filteredEntities.length})
                </span>
              </div>
              {(filteredEntities.length < entities.length || searchQuery || activeFilter !== 'all' || categoryFilter !== 'all' || riskLevelFilter !== 'all' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setActiveFilter('all');
                    setCategoryFilter('all');
                    setRiskLevelFilter('all');
                    setSearchQuery('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-blue-400 hover:text-indigo-300 font-mono font-bold cursor-pointer transition-colors"
                >
                  Скинути
                </button>
              )}
            </div>
            
            {/* Local Filters Panel */}
            <div className="flex flex-col gap-2 mb-3 bg-slate-950/20 p-2.5 rounded-2xl border border-slate-800">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase">Рівень ризику:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setRiskLevelFilter('all')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${riskLevelFilter === 'all' ? 'bg-blue-600/20 text-blue-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>Всі</button>
                  <button onClick={() => setRiskLevelFilter('high')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${riskLevelFilter === 'high' ? 'bg-rose-600/20 text-rose-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>Критичний / Високий</button>
                  <button onClick={() => setRiskLevelFilter('medium')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${riskLevelFilter === 'medium' ? 'bg-amber-600/20 text-amber-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>Середній</button>
                  <button onClick={() => setRiskLevelFilter('low')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${riskLevelFilter === 'low' ? 'bg-emerald-600/20 text-emerald-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>Низький</button>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase">Тип контрагента:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setActiveFilter('all')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${activeFilter === 'all' ? 'bg-blue-600/20 text-blue-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>Всі</button>
                  <button onClick={() => setActiveFilter('company')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${activeFilter === 'company' ? 'bg-blue-600/20 text-blue-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>ТОВ (Юр. особи)</button>
                  <button onClick={() => setActiveFilter('person')} className={`px-2 py-1 rounded text-xs font-bold uppercase transition-colors cursor-pointer ${activeFilter === 'person' ? 'bg-blue-600/20 text-blue-400 border border-slate-800' : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-800'}`}>ФОП (Фіз. особи)</button>
                </div>
              </div>
            </div>

            {/* Selection control bar */}
            <div className="flex items-center justify-between bg-black/40 border border-slate-800/60 rounded-2xl px-2.5 py-1.5 mb-3 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={filteredEntities.length > 0 && filteredEntities.every(e => selectedEntityIds.includes(e.id))}
                  onChange={toggleAllEntitiesSelection}
                  className="w-3.5 h-3.5 rounded border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-500"
                  title="Вибрати всі / зняти вибір"
                />
                <span>Обрано: <strong className="text-blue-400 font-bold">{selectedEntitiesForExport.length}</strong></span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors" title="Додати 65 віртуальних об'єктів для перевірки попередження про понад 50 об'єктів">
                <input
                  type="checkbox"
                  checked={simulateLargeDataset}
                  onChange={(e) => setSimulateLargeDataset(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] text-rose-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-rose-500"
                />
                <span className="text-xs text-rose-400/90 font-bold uppercase tracking-tight">Тест &gt;50</span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredEntities.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
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
                    className="text-xs text-blue-400 underline cursor-pointer"
                  >
                    Показати всі
                  </button>
                </div>
              ) : (
                filteredEntities.map((entity) => {
                  const isSelected = activeEntity.id === entity.id;
                  const isChecked = selectedEntityIds.includes(entity.id);
                  const theme = getRiskTheme(entity.riskScore);
                  return (
                    <motion.div
                      layout
                      key={entity.id}
                      onClick={() => onSelectEntityForInspector(entity)}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`w-full text-left p-2 rounded-2xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer relative group ${
                        isSelected 
                          ? theme.selectedBorderClass 
                          : theme.unselectedBorderClass
                      }`}
                    >
                      {/* Active left indicator light */}
                      {isSelected && (
                        <span className={`absolute left-0 top-2 bottom-3 w-1 rounded-r ${theme.indicatorClass}`} />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleEntitySelection(entity.id);
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-500 mr-1 shrink-0"
                          />
                          {entity.type === 'company' ? (
                            <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : entity.type === 'cryptowallet' ? (
                            <Landmark className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          )}
                          <span className={`font-bold text-slate-200 text-xs truncate transition-colors ${theme.hoverTextClass}`}>
                            {entity.name}
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-1 rounded border leading-none shrink-0 ${theme.badgeClass}`}>
                          {entity.riskScore}%
                        </span>
                      </div>

                      {/* Dynamic Risk Score Progress Bar */}
                      <div className="w-full bg-slate-950/80 rounded-full h-1 overflow-hidden border border-slate-800/40">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${theme.barClass}`}
                          style={{ width: `${entity.riskScore}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-slate-300">
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
                            <div className="pt-2.5 border-t border-slate-800/60 space-y-3 text-xs text-slate-300 font-sans">
                              {/* Analytic Note Description */}
                              <div 
                                onClick={() => handleCopyToClipboard(entity.description, `${entity.id}-desc`)}
                                className="bg-black/40 p-2 rounded-2xl border border-slate-800/60 text-slate-300 font-sans leading-relaxed text-xs cursor-pointer hover:bg-slate-950/60 transition-all relative group/copy"
                              >
                                <span className="text-xs font-mono font-bold text-slate-600 block uppercase tracking-wider mb-1">
                                  Аналітична замітка
                                </span>
                                {entity.description}
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                  <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                </div>
                                {copiedField === `${entity.id}-desc` && (
                                  <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>Скопійовано!</span>
                                  </div>
                                )}
                              </div>

                              {/* Address */}
                              <div className="font-mono text-slate-300 space-y-0.5">
                                <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                  Адреса реєстрації
                                </span>
                                <div 
                                  onClick={() => handleCopyToClipboard(entity.address, `${entity.id}-address`)}
                                  className="text-xs break-all text-slate-300 leading-normal bg-slate-950/20 p-1.5 rounded border border-slate-800/40 cursor-pointer hover:bg-black/40 transition-all relative group/copy"
                                >
                                  {entity.address}
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                  </div>
                                  {copiedField === `${entity.id}-address` && (
                                    <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5" />
                                      <span>Скопійовано!</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Taxes and Customs (for company) */}
                              {entity.type === 'company' && entity.taxes && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Фінанси та Податки ({entity.taxes.year})
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`Сплачено: ${entity.taxes?.paid}, Борг: ${entity.taxes?.debt}, Статус: ${entity.taxes?.status}`, `${entity.id}-taxes`)}
                                    className="bg-slate-950/30 p-2 rounded-2xl border border-slate-800/40 font-mono space-y-1 text-xs cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                  >
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Сплачено:</span>
                                      <span className="text-emerald-400 font-semibold">{entity.taxes.paid}</span>
                                    </div>
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Борг:</span>
                                      <span className={entity.taxes.debt !== '0 UAH' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                        {entity.taxes.debt}
                                      </span>
                                    </div>
                                    <div className="text-xs text-amber-500 font-semibold pt-0.5 border-t border-slate-800/40 text-center pr-5">
                                      {entity.taxes.status}
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </div>
                                    {copiedField === `${entity.id}-taxes` && (
                                      <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
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
                                  <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Митна активність
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`Митна активність: Імпорт ${entity.customs?.importVolume}, Вантаж: ${entity.customs?.lastCargo}`, `${entity.id}-customs`)}
                                    className="bg-slate-950/30 p-2 rounded-2xl border border-slate-800/40 font-mono space-y-1 text-xs cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                  >
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Імпорт:</span>
                                      <span className="text-blue-400 font-semibold">{entity.customs.importVolume}</span>
                                    </div>
                                    <div className="text-xs text-slate-300 leading-normal truncate pr-5" title={entity.customs.lastCargo}>
                                      Вантаж: {entity.customs.lastCargo}
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </div>
                                    {copiedField === `${entity.id}-customs` && (
                                      <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
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
                                  <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Власники / Засновники
                                  </span>
                                  <div className="space-y-1">
                                    {entity.founders.slice(0, 2).map((founder, idx) => (
                                      <div 
                                        key={idx} 
                                        onClick={() => handleCopyToClipboard(`${founder.name} (${founder.share})`, `${entity.id}-founder-${idx}`)}
                                        className="bg-black/40 p-1.5 rounded border border-slate-800/40 flex justify-between items-center text-xs font-sans cursor-pointer hover:bg-slate-950/60 transition-all relative group/copy"
                                      >
                                        <div className="truncate max-w-[120px] text-slate-300 font-medium pr-5">
                                          {founder.name}
                                        </div>
                                        <div className="text-blue-400 font-mono font-bold pr-5">
                                          {founder.share}
                                        </div>
                                        <div className="absolute top-1 right-1 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                          <Copy className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300" />
                                        </div>
                                        {copiedField === `${entity.id}-founder-${idx}` && (
                                          <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-20 animate-fade-in">
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
                                  <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider font-sans">
                                    Судовий реєстр
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`Кримінальних справ: ${entity.courts?.criminalCases}, Остання справа: ${entity.courts?.lastCaseTitle}`, `${entity.id}-courts`)}
                                    className="bg-slate-950/30 p-2 rounded-2xl border border-slate-800/40 font-mono space-y-1 text-xs cursor-pointer hover:bg-slate-950/50 transition-all relative group/copy"
                                  >
                                    <div className="flex justify-between pr-5">
                                      <span className="text-slate-500">Кримінальних справ:</span>
                                      <span className="text-rose-400 font-semibold">{entity.courts.criminalCases}</span>
                                    </div>
                                    <div className="text-xs text-slate-300 line-clamp-1 leading-normal pr-5">
                                      Остання: {entity.courts.lastCaseTitle}
                                    </div>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                    </div>
                                    {copiedField === `${entity.id}-courts` && (
                                      <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
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
                                  <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider font-sans text-rose-400/90">
                                    Санкційні обмеження
                                  </span>
                                  <div 
                                    onClick={() => handleCopyToClipboard(`${entity.sanctions?.listName}: ${entity.sanctions?.reason}`, `${entity.id}-sanctions`)}
                                    className="bg-rose-500/5 p-2 rounded-2xl border border-slate-800 font-sans space-y-1 text-xs text-slate-300 cursor-pointer hover:bg-rose-500/10 transition-all relative group/copy"
                                  >
                                    <p className="font-semibold text-rose-400/90 pr-5">{entity.sanctions.listName}</p>
                                    <p className="text-xs text-slate-300 leading-normal line-clamp-2 pr-5">{entity.sanctions.reason}</p>
                                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                      <Copy className="w-3 h-3 text-slate-500 hover:text-rose-300" />
                                    </div>
                                    {copiedField === `${entity.id}-sanctions` && (
                                      <div className="absolute -top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1 z-10 animate-fade-in">
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Скопійовано!</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Information banner */}
                              <div className="pt-1.5">
                                <div className="text-xs font-bold text-blue-400/80 uppercase tracking-widest font-mono text-center flex items-center justify-center gap-1">
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
          <div className={`bg-slate-900/40 border rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${activeEntity.riskScore > 75 ? 'border-slate-800 shadow-[0_0_40px_rgba(244,63,94,0.05)]' : activeEntity.riskScore > 50 ? 'border-slate-800 shadow-[0_0_40px_rgba(245,158,11,0.05)]' : 'border-slate-800'}`}>
            
            {/* Dossier Header */}
            <div className="p-2 border-b border-slate-800/60 bg-gradient-to-br from-slate-950 to-slate-900/80 relative overflow-hidden">
     <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-transparent to-transparent opacity-20 blur-3xl pointer-events-none ${activeEntity.riskScore > 75 ? 'from-rose-500' : activeEntity.riskScore > 50 ? 'from-amber-500' : 'from-blue-500'}`} />
              <div className="absolute right-4 top-2 flex items-center gap-2">
                {(activeEntity as any).leakData && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-fuchsia-500/10 border border-slate-800 rounded-2xl text-fuchsia-400 text-xs font-bold animate-pulse cursor-pointer">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    DARKNET LEAKS
                  </div>
                )}
                {getStatusBadge(activeEntity.status)}
                <div className={`text-xs font-bold font-mono px-2.5 py-1 rounded-2xl border ${getRiskColor(activeEntity.riskScore)}`}>
                  RISK Score: {activeEntity.riskScore}
                </div>
              </div>

              <div className="flex items-start gap-2.5 pr-28">
                <div className={`p-2 rounded-2xl shrink-0 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border ${activeEntity.riskScore > 75 ? 'border-slate-800 text-rose-400' : 'border-slate-800 text-blue-400'}`}>
                  {activeEntity.type === 'company' ? (
                    <Briefcase className="w-4 h-4" />
                  ) : activeEntity.type === 'cryptowallet' ? (
                    <Landmark className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">{activeEntity.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-slate-300 font-mono">
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

            {/* Tactical Intelligence Sandbox Export Toolbar */}
            <div className="px-2 py-1.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-mono">Тактичний аналіз:</span>
              <button
                onClick={() => {
                  const event = new CustomEvent('osint-export-to-sandbox', {
                    detail: activeEntity
                  });
                  window.dispatchEvent(event);
                  
                  // Also switch active tab
                  const tabEvent = new CustomEvent('change-active-tab', {
                    detail: 'sandbox'
                  });
                  window.dispatchEvent(tabEvent);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-slate-800 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-2xl shadow-black/40 shadow-blue-950/40 active:scale-95"
                title="Перенести цей об'єкт зі зв'язками до інтерактивного графу 'Павутина'"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Експорт до Павутини</span>
              </button>
            </div>

            {/* Dossier Details Tablist */}
            <div className="p-2 space-y-5 text-xs">
              
              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Аналітична замітка (Огляд)</span>
                <p className="text-slate-300 leading-relaxed text-xs whitespace-pre-line bg-slate-950/50 p-2 rounded-2xl border border-slate-800">
                  {activeEntity.description}
                </p>
              </div>

              {/* Risk Dynamics Chart */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Динаміка рівня ризику (12 місяців)</span>
                <div className="bg-slate-950/50 p-2 rounded-2xl border border-slate-800 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getRiskDynamicsData(activeEntity)} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeEntity.riskScore >= 80 ? '#f43f5e' : activeEntity.riskScore >= 50 ? '#f59e0b' : '#10b981'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={activeEntity.riskScore >= 80 ? '#f43f5e' : activeEntity.riskScore >= 50 ? '#f59e0b' : '#10b981'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(59, 130, 246, 0.2)', fontSize: '10px', borderRadius: '8px' }}
                        itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="risk" stroke={activeEntity.riskScore >= 80 ? '#f43f5e' : activeEntity.riskScore >= 50 ? '#f59e0b' : '#10b981'} strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conditional: Company Details */}
              {activeEntity.type === 'company' && (
                <>
                  {/* Founders & Stakeholders */}
                  <div className="space-y-2">
                    <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Засновники та частки власності</span>
                    <div className="space-y-1.5">
                      {activeEntity.founders?.map((found, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            const foundPerson = entities.find(e => e.name === found.name);
                            if (foundPerson) onSelectEntityForInspector(foundPerson);
                          }}
                          className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2 flex items-center justify-between hover:border-slate-800 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            <div>
                              <p className="font-semibold text-slate-200 text-xs group-hover:text-blue-400 transition-colors">{found.name}</p>
                              <span className="text-xs text-slate-500 font-mono">{found.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2.5 text-right font-mono text-xs">
                            <div>
                              <span className="text-blue-400 font-bold block">{found.share}</span>
                              <span className="text-xs text-slate-600 uppercase">ЧАСТКА</span>
                            </div>
                            <span className={`px-2 py-1 rounded border text-xs font-bold ${found.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-black/40 backdrop-blur-md text-slate-300 border-slate-800'}`}>
                              {found.riskLevel} Risk
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Taxes and Customs Data (Section 13) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeEntity.taxes && (
                      <div className="bg-black/40 border border-slate-800 rounded-2xl p-2.5 space-y-2">
                        <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Фінансовий стан
                        </span>
                        <div className="space-y-1 text-xs font-mono text-slate-300">
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
                            <span className={activeEntity.taxes.debt !== '0 UAH' ? 'text-red-400 font-bold' : 'text-slate-300'}>{activeEntity.taxes.debt}</span>
                          </div>
                          <p className="text-xs text-amber-500 font-semibold bg-amber-500/5 p-1 rounded text-center border border-slate-800 mt-1">
                            {activeEntity.taxes.status}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeEntity.customs && (
                      <div className="bg-black/40 border border-slate-800 rounded-2xl p-2.5 space-y-2">
                        <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-500" /> Митна діяльність
                        </span>
                        <div className="space-y-1 text-xs font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Обсяг імпорту:</span>
                            <span className="text-blue-400 font-bold">{activeEntity.customs.importVolume}</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span className="text-slate-500 font-sans">Партнери:</span>
                            <span className="truncate max-w-[120px]" title={activeEntity.customs.mainPartners.join(', ')}>
                              {activeEntity.customs.mainPartners[0]}
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] p-1 rounded text-center border border-slate-800 truncate mt-1">
                            Вантаж: {activeEntity.customs.lastCargo}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cryptocurrency Data */}
              {(activeEntity as any).cryptoData && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2 space-y-3">
                  <span className="text-xs text-amber-500/80 font-mono font-bold uppercase tracking-widest block flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> ON-CHAIN МЕТРИКИ (BLOCKCHAIN)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Поточний баланс</span>
                      <span className="text-amber-400 font-bold">{(activeEntity as any).cryptoData.balance}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 flex justify-between">
                      <span className="text-slate-500">Рівень ризику (AML)</span>
                      <span className="text-rose-400 font-bold">{(activeEntity as any).cryptoData.exposureIndex}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Останні транзакції</span>
                    <div className="space-y-1">
                      {(activeEntity as any).cryptoData.recentTransactions.map((tx: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-black/30 p-2 rounded border border-slate-800 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            {tx.type === 'IN' ? <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> : <ArrowUpRight className="w-3 h-3 text-rose-400" />}
                            <span className="text-slate-400 truncate w-[100px]">{tx.txHash}</span>
                          </div>
                          <span className={`font-bold ${tx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>{tx.amount}</span>
                          <span className="text-slate-500">{tx.relatedAddress}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Кластерний аналіз (Афіліації)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeEntity as any).cryptoData.knownClusters.map((cluster: string, i: number) => (
                         <span key={i} className="px-2 py-1 rounded text-xs font-bold font-mono bg-amber-500/10 text-amber-500 border border-slate-800">{cluster}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Leak / Deep Web Mentions */}
              {(activeEntity as any).leakData && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-xs text-fuchsia-500/80 font-mono font-bold uppercase tracking-widest block flex items-center gap-1.5">
                       <Scan className="w-3.5 h-3.5" /> ВИТОКИ ДАНИХ (DARKNET & BREACHES)
                     </span>
                     <span className="px-2 py-1 rounded text-xs font-bold font-mono bg-fuchsia-500/10 text-fuchsia-400 border border-slate-800 animate-pulse">{(activeEntity as any).leakData.totalBreaches} ЗБІГІВ</span>
                  </div>
                  
                  <div className="space-y-1.5">
                     {(activeEntity as any).leakData.breaches.map((breach: any, i: number) => (
                       <div key={i} className="bg-slate-900/50 p-2.5 rounded border border-slate-800 space-y-1.5">
                         <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><Terminal className="w-3 h-3 text-slate-500" /> {breach.source}</span>
                            <span className="text-xs text-slate-500 font-mono">{breach.date}</span>
                         </div>
                         <div className="flex gap-1.5 text-xs font-mono">
                            <span className="text-slate-500 uppercase">Скомпрометовано:</span>
                            <span className="text-slate-300">{breach.compromisedData.join(', ')}</span>
                         </div>
                       </div>
                     ))}
                  </div>
                  
                  <div className="bg-black/30 p-2 rounded flex justify-between text-xs font-mono border border-slate-800">
                     <span className="text-slate-500 uppercase">Згадки на Darknet-форумах:</span>
                     <span className="text-fuchsia-400 font-bold">{(activeEntity as any).leakData.darknetMentions} (остання {(activeEntity as any).leakData.lastDarknetMention})</span>
                  </div>
                </div>
              )}

              {/* Courts / Litigation history (Section 13) */}
              {activeEntity.courts && (
                <div className="bg-black/40 border border-slate-800 rounded-2xl p-2.5 space-y-2">
                  <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center justify-between">
                    <span>СУДОВИЙ РЕЄСТР</span>
                    <span className="text-red-400 font-bold font-mono text-xs">{activeEntity.courts.criminalCases} КРИМІНАЛ / {activeEntity.courts.totalCases} ВСЬОГО</span>
                  </span>
                  
                  <div className="bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] p-2.5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                      {activeEntity.courts.lastCaseTitle}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500 font-mono">
                      <span>Дата ухвали: {activeEntity.courts.lastCaseDate}</span>
                      <span className="text-blue-400 hover:underline cursor-pointer">Переглянути справу →</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sanctions details */}
              {activeEntity.sanctions && (
                <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-2.5 space-y-2">
                  <span className="text-xs text-red-400 font-mono font-bold uppercase tracking-widest block flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> ВІДОМОСТІ ПРО САНКЦІЇ
                  </span>
                  <div className="text-xs space-y-1">
                    <p className="text-slate-300 leading-relaxed font-semibold">
                      Реєстр: {activeEntity.sanctions.listName}
                    </p>
                    <p className="text-slate-300 text-xs">
                      Причина: {activeEntity.sanctions.reason}
                    </p>
                    <div className="flex justify-between text-xs text-slate-500 font-mono pt-1">
                      <span>Додано: {activeEntity.sanctions.dateAdded}</span>
                      <span>Орган: {activeEntity.sanctions.authority}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Contact / address list */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-widest block">Адреса та контакти реєстрації</span>
                <div className="bg-slate-950/60 rounded-2xl p-2 border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
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
                      <span className="text-slate-200 hover:text-blue-400 cursor-pointer">{activeEntity.email}</span>
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
          <div className="glass-panel-premium border-slate-800 rounded-2xl p-2 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {activeEntity.type === 'cryptowallet' ? <TrendingUp className="w-4.5 h-4.5 text-amber-400" /> : <Network className="w-4.5 h-4.5 text-blue-400" />}
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  {activeEntity.type === 'cryptowallet' ? 'Крипто-потоки (AML Flow)' : "Граф зв'язків та Link Analysis (2D View)"}
                </h4>
              </div>
              <div className="flex gap-2">
                 <span className="px-2 py-1 bg-slate-900/50 rounded border border-slate-800 text-xs font-mono text-slate-300">
                    Depth: 3
                 </span>
                 <span className="px-2 py-1 bg-slate-900/50 rounded border border-slate-800 text-xs font-mono text-slate-300">
                    Force: On
                 </span>
              </div>
            </div>

            {/* SVG Graph View representing relationships */}
            <div className="relative w-full h-[320px] bg-slate-950/80 border border-slate-800/60 rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              
              {/* Background circular scanning matrix HUD (Section 2) */}
              <div className="absolute inset-0 border border-dashed border-slate-800/10 rounded-full scale-75 animate-spin pointer-events-none" style={{ animationDuration: '60s' }}></div>
              <div className="absolute inset-0 border border-slate-800/20 rounded-full scale-50 pointer-events-none"></div>

              {/* SVG Network canvas */}
              <svg className="w-full h-full" viewBox="0 0 600 320">
                {/* Connective lines */}
                <g stroke="#1e293b" strokeWidth="1.5">
                  {/* Central Node is always (300, 160) */}
                  {activeEntity.relationships.map((rel, i) => {
                     const coords = [
                       {x: 160, y: 80},
                       {x: 440, y: 80},
                       {x: 300, y: 260},
                       {x: 160, y: 240},
                       {x: 440, y: 240}
                     ];
                     if(i >= coords.length) return null;
                     const c = coords[i];
                     const found = entities.find(e => e.id === rel.targetId);
                     const isCrypto = found?.type === 'cryptowallet' || rel.targetName.toLowerCase().includes('wallet');
                     const color = isCrypto ? '#f59e0b' : (rel.risk === 'HIGH' ? '#f43f5e' : '#3b82f6');
                     return (
                        <line key={`line-${i}`} x1="300" y1="160" x2={c.x} y2={c.y} stroke={color} strokeWidth={isCrypto ? "2" : "1.5"} strokeDasharray={rel.risk === 'HIGH' ? "4 4" : "none"} className={rel.risk === 'HIGH' ? "animate-pulse" : ""} />
                     );
                  })}
                </g>

                {/* Nodes group */}
                <g>
                  {/* Central Main Node */}
                  <g 
                    className="cursor-pointer" 
                    onClick={() => onSelectEntityForInspector(activeEntity)}
                  >
                    <circle cx="300" cy="160" r="24" className={`fill-slate-950 stroke-2 transition-all ${activeEntity.type === 'cryptowallet' ? 'stroke-amber-500 hover:stroke-amber-400' : 'stroke-blue-500 hover:stroke-blue-400'}`} />
                    <text x="300" y="164" textAnchor="middle" fill={activeEntity.type === 'cryptowallet' ? '#fbbf24' : '#818cf8'} fontSize="8" fontWeight="bold" fontFamily="monospace">
                      {activeEntity.type === 'company' ? 'CORP' : activeEntity.type === 'cryptowallet' ? 'CRYPTO' : 'PEP'}
                    </text>
                    <text x="300" y="200" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                      {activeEntity.name.slice(0, 18)}{activeEntity.name.length > 18 ? '...' : ''}
                    </text>
                  </g>
                  
                  {/* Connected Target Nodes */}
                  {activeEntity.relationships.map((rel, i) => {
                     const coords = [
                       {x: 160, y: 80, rx: 210, ry: 120, rot: -30},
                       {x: 440, y: 80, rx: 380, ry: 120, rot: 30},
                       {x: 300, y: 260, rx: 335, ry: 210, rot: 90},
                       {x: 160, y: 240, rx: 210, ry: 200, rot: 30},
                       {x: 440, y: 240, rx: 380, ry: 200, rot: -30}
                     ];
                     if(i >= coords.length) return null;
                     const c = coords[i];
                     const found = entities.find(e => e.id === rel.targetId);
                     const isCrypto = found?.type === 'cryptowallet' || rel.targetName.toLowerCase().includes('wallet');
                     const color = isCrypto ? '#f59e0b' : (rel.risk === 'HIGH' ? '#f43f5e' : '#3b82f6');
                     const strokeClass = isCrypto ? 'stroke-amber-500 hover:fill-amber-500/10' : (rel.risk === 'HIGH' ? 'stroke-rose-500 hover:fill-rose-500/10' : 'stroke-blue-500 hover:fill-blue-500/10');
                     const label = isCrypto ? 'WALLET' : (found?.type === 'company' ? 'CORP' : 'PEP');

                     return (
                        <g 
                          key={`node-${i}`}
                          className="cursor-pointer group"
                          onClick={() => {
                            if (found) onSelectEntityForInspector(found);
                          }}
                        >
                          <circle cx={c.x} cy={c.y} r="16" className={`fill-slate-950 stroke-2 transition-all ${strokeClass}`} />
                          <text x={c.x} y={c.y + 3} textAnchor="middle" fill={color} fontSize="7" fontWeight="bold" fontFamily="monospace">{label}</text>
                          <text x={c.x} y={c.y + 30} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                            {rel.targetName.split(' ')[0].slice(0, 15)}
                          </text>
                          <text x={c.rx} y={c.ry} textAnchor="middle" fill={color} fontSize="7" fontWeight="bold" fontFamily="monospace" transform={`rotate(${c.rot} ${c.rx} ${c.ry})`}>
                            {rel.type}
                          </text>
                        </g>
                     );
                  })}
                </g>
              </svg>

              {/* Status overlay hud */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded text-xs text-slate-500 font-mono flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Interactive Graph Connected
              </div>
            </div>
          </div>

          {activeEntity.type === 'cryptowallet' ? (
            <>
            {/* Crypto Asset Analytics Dashboard */}
            <div className="bg-slate-950/80 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] border border-slate-800 rounded-2xl p-2 shadow-xl space-y-4 relative overflow-hidden" id="crypto-asset-widget">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl pointer-events-none rounded-full"></div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    ON-CHAIN АНАЛІТИКА & AML-СКОРИНГ
                  </h4>
                </div>
                <div className="flex gap-2">
                   <span className="px-2 py-1 bg-amber-500/10 rounded border border-slate-800 text-xs font-mono text-amber-400 font-bold uppercase animate-pulse">
                      Live Tracking
                   </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                 <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-2">
                    <p className="text-xs text-slate-500 font-mono uppercase mb-1">Поточний Баланс</p>
                    <p className="text-lg font-bold text-slate-200">{(activeEntity as any).cryptoData?.balance || '0.00 BTC'}</p>
                 </div>
                 <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-2">
                    <p className="text-xs text-slate-500 font-mono uppercase mb-1">Отримано</p>
                    <p className="text-lg font-bold text-emerald-400">{(activeEntity as any).cryptoData?.totalReceived || '0.00 BTC'}</p>
                 </div>
                 <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-2">
                    <p className="text-xs text-slate-500 font-mono uppercase mb-1">Надіслано</p>
                    <p className="text-lg font-bold text-rose-400">{(activeEntity as any).cryptoData?.totalSent || '0.00 BTC'}</p>
                 </div>
              </div>
              
              <div>
                <h5 className="text-xs font-mono text-slate-500 uppercase mb-2">Останні транзакції (Мережа Bitcoin)</h5>
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/50 text-slate-400 uppercase font-mono">
                      <tr>
                        <th className="px-2 py-1.5">Хеш транзакції</th>
                        <th className="px-2 py-1.5">Дата</th>
                        <th className="px-2 py-1.5">Тип</th>
                        <th className="px-2 py-1.5">Сума</th>
                        <th className="px-2 py-1.5">Пов'язана адреса</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300 font-mono">
                      {((activeEntity as any).cryptoData?.recentTransactions || []).map((tx, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="px-2 py-1.5 text-blue-400 truncate max-w-[100px]">{tx.txHash}</td>
                          <td className="px-2 py-1.5">{tx.date}</td>
                          <td className="px-2 py-1.5">
                             <span className={"px-2 py-1 rounded font-bold " + (tx.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400')}>
                               {tx.type}
                             </span>
                          </td>
                          <td className="px-2 py-1.5 font-bold">{tx.amount}</td>
                          <td className="px-2 py-1.5 truncate max-w-[100px]">{tx.relatedAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </>
          ) : (
          <>
          {/* Interactive Geopolitical OSINT Map (Section 15) */}
          <div className="glass-panel-premium border-slate-800 rounded-2xl p-2 shadow-xl space-y-4" id="osint-interactive-map-widget">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3.5 gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-blue-400" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    Геопросторовий Моніторинг та Геолокація
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Координатна сітка та інтерактивні шари OSINT об'єктів
                  </p>
                </div>
              </div>
              
              {/* Zoom Presets Controls */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/80">
                <button
                  onClick={() => setMapZoom('ukraine')}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'ukraine' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-slate-200'
                  }`}
                >
                  Україна
                </button>
                <button
                  onClick={() => setMapZoom('kyiv')}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'kyiv' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-slate-200'
                  }`}
                >
                  Київ/Козин
                </button>
                <button
                  onClick={() => setMapZoom('lviv')}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'lviv' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-slate-200'
                  }`}
                >
                  Львів
                </button>
                <button
                  onClick={() => setMapZoom('global')}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    mapZoom === 'global' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-slate-200'
                  }`}
                >
                  Мережа Ledger
                </button>
              </div>
            </div>

            {/* Split Grid: Navigation sidebar & Map Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
              
              {/* Left Column: Coordinates Sidebar */}
              <div className="lg:col-span-1 glass-panel-premium border-slate-800/60 rounded-2xl p-2 flex flex-col gap-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-1 block">
                  Активні вузли на карті
                </span>
                
                {Object.values(MAP_LOCATIONS).map((loc) => {
                  const isInspected = activeEntity.id === loc.id;
                  const riskColorClass = loc.riskScore >= 75 ? 'text-rose-400 border-slate-800 bg-rose-500/5' : loc.riskScore >= 50 ? 'text-amber-400 border-slate-800 bg-amber-500/5' : 'text-emerald-400 border-slate-800 bg-emerald-500/5';
                  
                  return (
                    <div 
                      key={loc.id}
                      onClick={() => {
                        const found = entities.find(e => e.id === loc.id);
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
                      className={`p-2 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                        isInspected 
                          ? 'bg-blue-600/20 border-slate-800 shadow-xl shadow-black/20 shadow-blue-600/5' 
                          : 'bg-black/40 border-slate-800/60 hover:bg-slate-950/80 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[95px] block">
                          {loc.name.replace(/ТОВ |"|'/g, '')}
                        </span>
                        <span className={`text-xs font-mono font-semibold px-1 rounded border shrink-0 ${riskColorClass}`}>
                          {loc.riskScore}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs font-mono text-slate-500 mt-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-600" />
                        <span className="truncate">{loc.city} ({loc.address})</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mt-auto pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-500 leading-relaxed">
                  <div className="flex items-center gap-1 text-blue-400 mb-0.5">
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></span>
                    <span>Режим синхронізації:</span>
                  </div>
                  <span>Клік на вузол фокусує камери та завантажує досьє.</span>
                </div>
              </div>

              {/* Right Column: SVG Visualizer Area */}
              <div className="lg:col-span-3 relative h-[360px] glass-panel-premium border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                
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
                      <circle r="3" fill="#fbbf24" className="shadow-2xl shadow-black/40">
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
                            const found = entities.find(e => e.id === loc.id);
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
                  <span>АКТИВНИЙ ПОТІК СУПУТНИКОВОЇ СИНХРОНІЗАЦІЇ</span>
                  <span>SYS: {mapZoom === 'kyiv' ? '30.5234°E / 50.4501°N' : mapZoom === 'lviv' ? '24.0297°E / 49.8397°N' : 'UKRAINE CORPORATE MAP'}</span>
                </div>

                {/* Scale Overlay Indicator */}
                <div className="absolute left-3.5 bottom-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl px-2 py-1 text-xs font-mono text-slate-300 flex items-center gap-1.5 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
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
                        className="absolute z-30 bg-slate-950/95 border border-slate-800 rounded-2xl p-2 shadow-2xl w-[210px] pointer-events-none"
                        style={{ 
                          left: `${leftPct}%`, 
                          top: `${topPct}%`,
                          transform: 'translate(-50%, -108%)'
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-slate-200 line-clamp-1 pr-1">
                            {loc.name}
                          </span>
                          <span className={`text-xs font-mono font-bold shrink-0 ${riskColorClass}`}>
                            {loc.riskScore}%
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-0.5 uppercase tracking-wider">
                          {loc.sector}
                        </p>
                        <div className="border-t border-slate-800 my-1.5"></div>
                        <p className="text-xs text-slate-300 leading-normal font-sans">
                          Адреса: <strong className="text-slate-200">{loc.address}</strong>
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          Клікніть на маркер для повного досьє
                        </p>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

              </div>
            </div>

            {/* Bottom Layer Toggles toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/60 mt-1" id="map-layers-toolbar">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Активні шари:</span>
                </span>
                
                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setMapShowRoutes(!mapShowRoutes)}
                    className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      mapShowRoutes 
                        ? 'bg-rose-500/10 text-rose-400 border-slate-800' 
                        : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-800'
                    }`}
                  >
                    Митні Маршрути
                  </button>

                  <button
                    onClick={() => setMapShowFlows(!mapShowFlows)}
                    className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      mapShowFlows 
                        ? 'bg-amber-500/10 text-amber-400 border-slate-800' 
                        : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-800'
                    }`}
                  >
                    Крипто Транзакції
                  </button>

                  <button
                    onClick={() => setMapShowHeatmap(!mapShowHeatmap)}
                    className={`px-3 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      mapShowHeatmap 
                        ? 'bg-blue-500/10 text-blue-400 border-slate-800' 
                        : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-800'
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
          </>)}

        </div>

      </div>
    </>
  )}

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
        <div className="text-black bg-white p-2 max-w-4xl mx-auto font-sans leading-relaxed">
          <div className="print-header flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
            <div>
              <div className="text-xs font-bold text-red-600 tracking-widest uppercase">ЦЛКОМ ТАЄМНО / CLASSIFIED SECURITY INTELLIGENCE</div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">ОФІЦІЙНИЙ АНАЛІТИЧНИЙ ЗВІТ OSINT / РИЗИК-АНАЛІЗУ</h1>
              <div className="text-xs text-slate-500 font-mono mt-0.5">NEXUS OSINT INTELLIGENCE WORKSPACE • GENERATED AUTOMATICALLY</div>
            </div>
            <div className="text-right font-mono text-xs text-slate-600 space-y-0.5 border-l border-slate-300 pl-4">
              <div>ДАТА: {new Date().toLocaleString('uk-UA')}</div>
              <div>КОРИСТУВАЧ: vkizima534@gmail.com</div>
              <div>СИСТЕМА: NEXUS V4.2-SECURE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 mb-6">
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
                      <div className="text-xs text-slate-500 mt-1">{e.description}</div>
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
                  <td colSpan={5} className="text-center py-2 text-slate-500 font-mono">
                    Жодних об'єктів за обраними критеріями фільтрації не знайдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-800 uppercase tracking-wider">ПРИМІТКА БЕЗПЕКИ:</div>
              <p className="mt-1 text-slate-500 text-xs leading-normal">
                Цей документ містить закриті аналітичні дані системи моніторингу Nexus. Копіювання та розповсюдження третім особам без відповідного допуску заборонено згідно чинного законодавства.
              </p>
            </div>
            <div className="text-right flex flex-col items-end justify-end">
              <div className="w-48 border-b border-slate-400 h-10"></div>
              <div className="text-xs text-slate-500 font-mono mt-1.5 uppercase tracking-wider">Підпис відповідального аналітика</div>
              <div className="text-xs text-blue-600 font-mono mt-1">vkizima534@gmail.com</div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal Preview (Framer Motion Overlay) */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm" id="report-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-black/40 backdrop-blur-md border border-slate-800 w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-2 border-b border-slate-800 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4.5 h-4.5 text-rose-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Попередній перегляд PDF-звіту</h3>
                    <p className="text-xs text-slate-500 font-mono">Перевірте звіт розвідки перед остаточним експортом</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex">
                
                {/* Configuration Panel */}
                <div className="w-64 shrink-0 bg-black/40 backdrop-blur-md border-r border-slate-800 p-2 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      Sections to Include
                    </h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] group-hover:border-slate-800 transition-colors">
                          <input type="checkbox" checked={pdfConfig.metadata} onChange={e => setPdfConfig({...pdfConfig, metadata: e.target.checked})} className="absolute opacity-0 w-full h-full cursor-pointer" />
                          {pdfConfig.metadata && <div className="w-2 h-2 rounded-sm bg-blue-500" />}
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-semibold">Критерії пошуку</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] group-hover:border-slate-800 transition-colors">
                          <input type="checkbox" checked={pdfConfig.riskScore} onChange={e => setPdfConfig({...pdfConfig, riskScore: e.target.checked})} className="absolute opacity-0 w-full h-full cursor-pointer" />
                          {pdfConfig.riskScore && <div className="w-2 h-2 rounded-sm bg-blue-500" />}
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-semibold">Статистика ризиків</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] group-hover:border-slate-800 transition-colors">
                          <input type="checkbox" checked={pdfConfig.connections} onChange={e => setPdfConfig({...pdfConfig, connections: e.target.checked})} className="absolute opacity-0 w-full h-full cursor-pointer" />
                          {pdfConfig.connections && <div className="w-2 h-2 rounded-sm bg-blue-500" />}
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-semibold">Таблиця даних</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] group-hover:border-slate-800 transition-colors">
                          <input type="checkbox" checked={pdfConfig.timeline} onChange={e => setPdfConfig({...pdfConfig, timeline: e.target.checked})} className="absolute opacity-0 w-full h-full cursor-pointer" />
                          {pdfConfig.timeline && <div className="w-2 h-2 rounded-sm bg-blue-500" />}
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-semibold">Граф зв'язків</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-800 bg-black/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] group-hover:border-slate-800 transition-colors">
                          <input type="checkbox" checked={pdfConfig.qrCode} onChange={e => setPdfConfig({...pdfConfig, qrCode: e.target.checked})} className="absolute opacity-0 w-full h-full cursor-pointer" />
                          {pdfConfig.qrCode && <div className="w-2 h-2 rounded-sm bg-blue-500" />}
                        </div>
                        <span className="text-xs text-slate-300 group-hover:text-slate-200 transition-colors font-semibold">QR-код автентифікації</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* PDF Content View */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-950/50 custom-scrollbar flex justify-center items-start">
                  
                  {/* Paper page mimic */}
                  <div id="pdf-report-content" className="w-full max-w-3xl bg-white text-slate-900 p-4 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 my-4 select-text">
                    
                    {/* Internal Report representation */}
                    <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-6">
                      <div>
                        <div className="text-xs font-bold text-red-600 tracking-wider uppercase font-mono">ЦЛКОМ ТАЄМНО / CLASSIFIED SECURITY</div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 mt-1 uppercase">ОФІЦІЙНИЙ АНАЛІТИЧНИЙ ЗВІТ OSINT</h1>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">NEXUS SECURITY INTELLIGENCE MATRIX</div>
                      </div>
                      <div className="text-right font-mono text-xs text-slate-600 space-y-0.5 border-l border-slate-200 pl-4">
                        <div>ДАТА: {new Date().toLocaleDateString('uk-UA')}</div>
                        <div>КОРИСТУВАЧ: vkizima534@gmail.com</div>
                        <div>СИСТЕМА: NEXUS V4.2</div>
                      </div>
                    </div>

                    {/* Summary grid */}
                    {(pdfConfig.metadata || pdfConfig.riskScore) && (
                      <div className={`grid grid-cols-1 ${pdfConfig.metadata && pdfConfig.riskScore ? 'sm:grid-cols-2' : ''} gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 mb-6 text-xs text-slate-700`}>
                        {pdfConfig.metadata && (
                          <div>
                            <div className="font-bold text-slate-800 uppercase tracking-wider text-xs">Критерії пошуку:</div>
                            <div className="mt-1 space-y-0.5 font-mono">
                              <div>База: {activeFilter === 'all' ? 'Всі реєстри' : activeFilter === 'company' ? 'Юридичні особи (ЄДР)' : activeFilter === 'person' ? 'Фізичні особи' : 'Криптоактиви'}</div>
                              <div>Категорія: {categoryFilter === 'all' ? 'Всі статуси' : categoryFilter === 'sanctioned' ? 'Під санкціями' : categoryFilter === 'active' ? 'Активні' : 'Високий ризик'}</div>
                              <div>Ризик: {riskLevelFilter === 'all' ? 'Всі рівні' : riskLevelFilter === 'high' ? 'High' : riskLevelFilter === 'medium' ? 'Medium' : 'Low'}</div>
                            </div>
                          </div>
                        )}
                        {pdfConfig.riskScore && (
                          <div>
                            <div className="font-bold text-slate-800 uppercase tracking-wider text-xs">Статистичні показники:</div>
                            <div className="mt-1 space-y-0.5 font-mono">
                              <div>Всього об'єктів: <span className="font-bold">{selectedEntitiesForExport.length}</span></div>
                              <div>Високий ризик (High): <span className="text-red-600 font-bold">{selectedEntitiesForExport.filter(e => e.riskScore >= 80).length}</span></div>
                              <div>Середній ризик (Med): <span className="text-amber-600 font-bold">{selectedEntitiesForExport.filter(e => e.riskScore >= 50 && e.riskScore < 80).length}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline/Graph Placeholder */}
                    {pdfConfig.timeline && (
                      <div className="mb-6">
                        <div className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2 border-b border-slate-200 pb-1">Граф зв'язків</div>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 h-40 flex items-center justify-center p-2">
                           <div className="text-center text-slate-300">
                             <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                             <p className="text-xs font-mono uppercase tracking-wider">Дані візуалізації мережевого графа</p>
                             <p className="text-xs mt-1">Generated dynamically from selected entities.</p>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Data Table preview */}
                    {pdfConfig.connections && (
                      <div className="overflow-x-auto mb-6">
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
                        {selectedEntitiesForExport.map(e => {
                          const isHigh = e.riskScore >= 80;
                          const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                          return (
                            <tr key={e.id} className="hover:bg-slate-50/50">
                              <td className="p-2 font-mono font-bold text-slate-800">{e.code}</td>
                              <td className="p-2 text-slate-900">
                                <div className="font-bold">{e.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{e.description}</div>
                              </td>
                              <td className="p-2 text-slate-600 font-mono text-xs">
                                {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                              </td>
                              <td className="p-2 font-mono font-bold text-slate-950">{e.riskScore}%</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
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
                        {selectedEntitiesForExport.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-2 text-center text-slate-300 font-mono">
                              Жодних збігів за обраними фільтрами не знайдено.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  )}

                  <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col gap-2">
                    {pdfConfig.qrCode && (
                      <div className="flex items-center gap-2">
                        <div className="p-1 border border-slate-200 rounded bg-white">
                          <QRCodeSVG value={window.location.href} size={64} level="H" includeMargin={false} />
                        </div>
                        <div>
                          <span className="font-bold uppercase tracking-wider text-slate-700 block text-xs">Перевірка розвідувального звіту</span>
                          <span className="text-xs text-slate-500">Scan QR code to access the live entity analysis dashboard and authenticate document origins.</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <div>
                        <span className="font-bold uppercase tracking-wider text-slate-700 block">Nexus Intelligence Security</span>
                        <span>Документ згенеровано автоматично в захищеному сеансі користувача.</span>
                      </div>
                      <div className="text-right font-mono text-blue-600 text-xs">
                        vkizima534@gmail.com
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

              {/* Modal Footer */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Загалом записів у звіті: <strong className="text-slate-300 font-bold">{selectedEntitiesForExport.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-2 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={() => {
                      downloadPDF();
                    }}
                    disabled={isExporting}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-2xl text-white text-xs font-semibold shadow-2xl shadow-black/40 shadow-indigo-950/20 cursor-pointer transition-colors ${
                      isExporting ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    <span>{isExporting ? 'Формування PDF...' : 'Export Final PDF'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

          
      {/* End of right panel */}

      {/* Interactive OSINT Entity Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm" id="osint-preview-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-black/40 backdrop-blur-md border border-slate-800 w-full max-w-5xl h-[80vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-2 border-b border-slate-800 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-blue-500/10 border border-slate-800">
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Генератор звітів: Попередній перегляд даних</h3>
                    <p className="text-xs text-slate-500 font-mono">Перевірка записів перед остаточним експортуванням</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Filtering metadata info banner */}
              <div className="px-2 py-1.5 bg-slate-950/20 border-b border-slate-800/60 flex flex-wrap gap-2 text-xs font-mono text-slate-300">
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
                      <span className="text-blue-400 font-bold">"{searchQuery}"</span>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Body - Data Table */}
              <div className="flex-1 overflow-y-auto p-2 bg-black/40 custom-scrollbar">
                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-300 text-xs font-mono uppercase tracking-wider">
                        <th className="p-2 font-semibold">Код / ID</th>
                        <th className="p-2 font-semibold">Назва / Ім'я об'єкта</th>
                        <th className="p-2 font-semibold">Реєстр / Тип</th>
                        <th className="p-2 font-semibold text-center">Ризик %</th>
                        <th className="p-2 font-semibold">Опис об'єкта</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {selectedEntitiesForExport.map(e => {
                        const isHigh = e.riskScore >= 80;
                        const isMedium = e.riskScore >= 50 && e.riskScore < 80;
                        return (
                          <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-2 font-bold text-slate-300 whitespace-nowrap">{e.code}</td>
                            <td className="p-2">
                              <span className="font-display font-bold tracking-tight text-slate-200">{e.name}</span>
                            </td>
                            <td className="p-2 text-slate-300 text-xs font-sans">
                              {e.type === 'company' ? 'Юридична особа' : e.type === 'cryptowallet' ? 'Криптогаманець' : 'Фізична особа'}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                isHigh 
                                  ? 'bg-rose-500/10 text-rose-400 border border-slate-800' 
                                  : isMedium 
                                    ? 'bg-amber-500/10 text-amber-400 border border-slate-800' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-slate-800'
                              }`}>
                                {e.riskScore}%
                              </span>
                            </td>
                            <td className="p-2 text-slate-300 text-xs font-sans max-w-xs truncate" title={e.description}>
                              {e.description}
                            </td>
                          </tr>
                        );
                      })}
                      {selectedEntitiesForExport.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500 font-mono text-xs">
                            Жодних об'єктів за обраними критеріями фільтрації не знайдено.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  Загалом записів у таблиці: <strong className="text-slate-300 font-bold">{selectedEntitiesForExport.length}</strong>
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Format quick switcher in the footer */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-2xl border border-slate-800/40 relative text-xs select-none shrink-0">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`px-2 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                        exportFormat === 'csv'
                          ? 'text-blue-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`px-2 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider relative transition-all duration-300 cursor-pointer ${
                        exportFormat === 'pdf'
                          ? 'text-rose-400'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>PDF</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-2 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
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
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-2xl shadow-black/40 shadow-indigo-950/20 cursor-pointer transition-colors"
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
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-2xl shadow-black/40 shadow-rose-950/20 cursor-pointer transition-colors"
                    >
                      {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-4 h-4" />}
                      <span>Згенерувати PDF-звіт</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Large Export Confirmation Modal */}
      <AnimatePresence>
        {showLargeExportConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 bg-slate-950/85 backdrop-blur-md" id="osint-large-export-confirmation">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-black/40 backdrop-blur-md border border-slate-800 w-full max-w-md rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Alert Header */}
              <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-rose-500/10 border border-slate-800 text-rose-400">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">⚠️ Попередження: Великий обсяг даних</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Операція потребує додаткового підтвердження</p>
                </div>
              </div>

              {/* Warning Content */}
              <div className="p-2 space-y-4 text-xs text-slate-300">
                <p className="leading-relaxed">
                  Ви ініціювали експорт великого набору даних, який налічує <strong className="text-rose-400 font-bold">{selectedEntitiesForExport.length}</strong> записів. 
                </p>
                
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-2.5 space-y-2 text-xs leading-relaxed">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider font-mono">Можливі наслідки:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Формування звіту у форматі <span className="text-slate-200 font-bold font-mono uppercase">{pendingExportType}</span> може зайняти більше часу</li>
                    <li>Тимчасове підвищення навантаження на систему дешифрування зв'язків</li>
                    <li>Значний розмір фінального файлу вивантаження</li>
                  </ul>
                </div>

                <p className="text-xs text-slate-300">
                  Рекомендується застосувати точніші фільтри за типом реєстру або датою активності, щоб зменшити розмір вибірки. Бажаєте продовжити експорт у повному обсязі?
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowLargeExportConfirmation(false);
                    setPendingExportType(null);
                  }}
                  className="px-2 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-slate-200 border border-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={confirmAndExecuteExport}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-2xl shadow-black/40 shadow-rose-950/20 cursor-pointer transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Так, продовжити експорт</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      
      {/* Data Sources / APIs Modal */}
      <AnimatePresence>
        {showDataSourcesModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-black/40 backdrop-blur-md border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-2 border-b border-slate-800 bg-black/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-2xl bg-emerald-500/10 border border-slate-800">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Інтеграції та Бази Даних</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Підключені реєстри, API-шлюзи та закриті джерела (NEXUS ENGINE)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDataSourcesModal(false)}
                  className="p-2 rounded-2xl hover:bg-slate-800 text-slate-300 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-950/50 space-y-6">
                
                {/* 1. State Registries (Open) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Публічні державні реєстри (Live)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">ЄДРПОУ (Юридичні особи)</span>
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">ОНЛАЙН</span>
                      </div>
                      <p className="text-xs text-slate-500">Єдиний державний реєстр. Дані про засновників, бенефіціарів, КВЕД, статус.</p>
                      <div className="text-xs font-mono text-slate-600">API: api.gov.ua / GraphQL</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Судова влада України</span>
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">ОНЛАЙН</span>
                      </div>
                      <p className="text-xs text-slate-500">Реєстр судових рішень. Цивільні, кримінальні та господарські справи.</p>
                      <div className="text-xs font-mono text-slate-600">API: court.gov.ua / REST</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Податкова (ДПС)</span>
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">ОНЛАЙН</span>
                      </div>
                      <p className="text-xs text-slate-500">Статус платника ПДВ, податковий борг, анульовані ліцензії.</p>
                      <div className="text-xs font-mono text-slate-600">API: tax.gov.ua / SOAP/REST</div>
                    </div>
                  </div>
                </div>

                {/* 2. Closed / Restricted Databases */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Обмежений доступ (Закриті БД МВС / Інтерпол)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-1">
                        <Lock className="w-3 h-3 text-blue-500/40" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">АРМОР МВС (Дзеркало)</span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono">АВТОРИЗОВАНО</span>
                      </div>
                      <p className="text-xs text-slate-500">Розшук, судимості, зброя, автотранспорт, перетин кордону.</p>
                      <div className="text-xs font-mono text-blue-500/60 flex items-center gap-1">
                        <ExternalLink className="w-2 h-2" /> СБУ VPN GATEWAY
                      </div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-1">
                        <Lock className="w-3 h-3 text-blue-500/40" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">INTERPOL Red/Yellow Notices</span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono">АВТОРИЗОВАНО</span>
                      </div>
                      <p className="text-xs text-slate-500">Міжнародний розшук, тероризм, фінансові махінації, відмивання коштів.</p>
                      <div className="text-xs font-mono text-blue-500/60 flex items-center gap-1">
                        <ExternalLink className="w-2 h-2" /> INTERPOL SECURE API
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Darknet / Data Leaks */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <ServerCrash className="w-3.5 h-3.5" /> Витоки даних, Darknet, Криптоаналіз
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Data Leaks (2020-2024)</span>
                        <span className="text-xs px-2 py-1 rounded bg-rose-500/10 text-rose-400 font-mono animate-pulse">ПРОІНДЕКСОВАНО</span>
                      </div>
                      <p className="text-xs text-slate-500">Злиті бази Нової Пошти, ПриватБанку, Kyivstar, Дії (агреговані дампи). Паролі, телефони.</p>
                      <div className="text-xs font-mono text-rose-500/60">SOURCE: RaidForums / BreachForums Archive</div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-md border border-slate-800 rounded-2xl p-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Блокчейн-аналітика</span>
                        <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono">ОНЛАЙН</span>
                      </div>
                      <p className="text-xs text-slate-500">Моніторинг Tornado Cash, міксерів, AML-скоринг криптогаманців.</p>
                      <div className="text-xs font-mono text-slate-600">API: Chainalysis / Crystal Blockchain</div>
                    </div>
                  </div>
                </div>

                {/* AI Synthesis Notice */}
                <div className="mt-8 p-2 bg-blue-500/5 border border-slate-800 rounded-2xl flex gap-2 items-start">
                  <div className="p-2 rounded bg-blue-500/10 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Інтелектуальний OSINT-пошук (AI Aggregation)</h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      У випадках відсутності об'єкта в локальній базі, <span className="font-bold text-blue-400">NEXUS AI ENGINE</span> автоматично підключається до вищезазначених джерел через API, аналізує неструктуровані дані (у т.ч. дампи з Darknet та закриті БД МВС), і синтезує єдине досьє з графом зв'язків у реальному часі.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</AnimatePresence>

    </div>
  );
}
