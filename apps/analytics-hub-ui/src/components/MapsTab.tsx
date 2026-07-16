/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Map, Globe, Compass, MapPin, Activity, ShieldAlert, TrendingUp, 
  Layers, Search, Briefcase, User, Terminal, ArrowRight, RefreshCw, 
  Zap, CheckCircle, Sliders, Eye, EyeOff, AlertTriangle, Sparkles, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OSINT_ENTITIES, OsintEntity } from '../osintData';

interface MapsTabProps {
  onSelectEntityGlobal?: (entity: OsintEntity) => void;
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

export default function MapsTab({ onSelectEntityGlobal }: MapsTabProps) {
  // State management
  const [mapZoom, setMapZoom] = useState<'ukraine' | 'kyiv' | 'lviv' | 'global'>('ukraine');
  const [mapShowRoutes, setMapShowRoutes] = useState(true);
  const [mapShowFlows, setMapShowFlows] = useState(true);
  const [mapShowHeatmap, setMapShowHeatmap] = useState(true);
  const [mapShowRadar, setMapShowRadar] = useState(true);
  const [hoveredMapEntityId, setHoveredMapEntityId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('comp-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  // Tactical simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [activeLayersCount, setActiveLayersCount] = useState(3);

  // Memoized entity based on selection
  const selectedEntity = useMemo(() => {
    return OSINT_ENTITIES.find(e => e.id === selectedEntityId) || OSINT_ENTITIES[0];
  }, [selectedEntityId]);

  // Handle tactical radar scan simulation
  const startTacticalScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanMessage("Ініціалізація ШІ-Сенсорів PREDATOR...");
    
    setTimeout(() => {
      setScanMessage("Тріангуляція крипто-транзакцій та митних накладних...");
    }, 1200);

    setTimeout(() => {
      setScanMessage("Звірка з супутниковими даними Sentinel-2...");
    }, 2400);

    setTimeout(() => {
      setIsScanning(false);
      setScanMessage("Сканування завершено! Виявлено 4 активні аномалії.");
      // Reset message after 3 seconds
      setTimeout(() => setScanMessage(null), 3000);
    }, 3600);
  };

  // Filter locations list by search query and risk filters
  const filteredLocations = useMemo(() => {
    return Object.values(MAP_LOCATIONS).filter(loc => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = loc.name.toLowerCase().includes(query) || 
                              loc.city.toLowerCase().includes(query) ||
                              loc.address.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (riskFilter === 'high') {
        if (loc.riskScore < 75) return false;
      } else if (riskFilter === 'medium') {
        if (loc.riskScore < 50 || loc.riskScore >= 75) return false;
      } else if (riskFilter === 'low') {
        if (loc.riskScore >= 50) return false;
      }

      return true;
    });
  }, [searchQuery, riskFilter]);

  // Count active layers
  React.useEffect(() => {
    let count = 0;
    if (mapShowHeatmap) count++;
    if (mapShowRoutes) count++;
    if (mapShowFlows) count++;
    if (mapShowRadar) count++;
    setActiveLayersCount(count);
  }, [mapShowHeatmap, mapShowRoutes, mapShowFlows, mapShowRadar]);

  return (
    <div className="space-y-6" id="maps-tab-root">
      
      {/* Upper HUD with visual map statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="maps-hud-stats">
        <div className="bg-[#0b1329]/60 border border-slate-850 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-widest block">АКТИВНІ ГЕО-ВУЗЛИ</span>
            <span className="text-xl font-black text-white tracking-tight mt-1 block">4 Точки інтересу</span>
            <span className="text-[9px] text-indigo-400 font-mono mt-0.5 block">Центральний & Західний сектори</span>
          </div>
          <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b1329]/60 border border-slate-850 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-widest block">АКТИВНІСТЬ ТРАНЗАКЦІЙ</span>
            <span className="text-xl font-black text-amber-400 tracking-tight mt-1 block">2 Потоки коштів</span>
            <span className="text-[9px] text-amber-500/80 font-mono mt-0.5 block">Виявлено виведення в BTC Ledger</span>
          </div>
          <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b1329]/60 border border-slate-850 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-widest block">РІВЕНЬ ЗАГРОЗИ СЕКТОРУ</span>
            <span className="text-xl font-black text-rose-500 tracking-tight mt-1 block">94% Критичний</span>
            <span className="text-[9px] text-rose-400 font-mono mt-0.5 block">ТОВ СпецТехПостач (Київ)</span>
          </div>
          <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b1329]/60 border border-slate-850 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[8px] text-slate-400 font-mono font-bold uppercase tracking-widest block">АКТИВНІ ШАРИ ДАНИХ</span>
            <span className="text-xl font-black text-indigo-400 tracking-tight mt-1 block">{activeLayersCount} / 4 шарів</span>
            <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">Векторні карти & супутники</span>
          </div>
          <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Map canvas, settings & side metadata drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Map Canvas (Span 8) */}
        <div className="xl:col-span-8 bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          
          {/* Header controls of the Map */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-4 gap-3 z-10 relative">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Геопросторова Платформа "PREDATOR-MAPS"
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Система супутникового стеження, митного транзиту та санкційного моніторингу
                </p>
              </div>
            </div>

            {/* Quick Zoom presets */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-900/60">
              <button
                onClick={() => setMapZoom('ukraine')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'ukraine' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Україна (Огляд)
              </button>
              <button
                onClick={() => setMapZoom('kyiv')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'kyiv' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Київ & Козин
              </button>
              <button
                onClick={() => setMapZoom('lviv')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'lviv' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Львів (Захід)
              </button>
              <button
                onClick={() => setMapZoom('global')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  mapZoom === 'global' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Мережа Ledger
              </button>
            </div>
          </div>

          {/* Interactive SVG Stage Container */}
          <div className="relative h-[440px] bg-slate-950 border border-slate-900 rounded-xl overflow-hidden mt-5 flex items-center justify-center">
            
            {/* Top Indicator Panel inside Map */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-mono text-slate-400 z-20 flex items-center gap-2 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Супутниковий шар: ГЛОБАЛЬНИЙ РЕЄСТР</span>
              <span className="text-slate-600">|</span>
              <span className="text-indigo-400 font-bold">{mapZoom === 'ukraine' ? 'GRID: 500x280' : mapZoom === 'kyiv' ? 'INSET: KYIV_METRO' : mapZoom === 'lviv' ? 'INSET: LVIV_CENTER' : 'VIRTUAL: BTC_LEDGER'}</span>
            </div>

            {/* Tactical Compass Rose Overlay */}
            <div className="absolute bottom-4 right-4 text-slate-800/40 pointer-events-none select-none z-10 w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
                <path d="M 50,5 L 53,40 L 50,50 L 47,40 Z" fill="rgba(99, 102, 241, 0.4)" />
                <path d="M 50,95 L 53,60 L 50,50 L 47,60 Z" fill="rgba(244, 63, 94, 0.4)" />
                <text x="50" y="15" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="bold">N</text>
                <text x="50" y="93" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold">S</text>
              </svg>
            </div>

            {/* Background Map Visual Canvas */}
            <svg 
              className="w-full h-full cursor-grab active:cursor-grabbing transition-all duration-700 select-none z-10" 
              viewBox={
                mapZoom === 'kyiv' 
                  ? '200 65 110 80' 
                  : mapZoom === 'lviv' 
                    ? '65 95 60 50' 
                    : '0 0 500 280'
              }
              fill="none"
            >
              <defs>
                <radialGradient id="tab-heat-high" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="tab-heat-medium" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                
                <pattern id="tab-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f172a" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Grid backdrop overlay */}
              <rect width="500" height="280" fill="url(#tab-map-grid)" />

              {/* Grid Coordinate text (Shown in Ukraine and Global view) */}
              {(mapZoom === 'ukraine' || mapZoom === 'global') && (
                <g className="opacity-20" stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3">
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
              {mapShowRadar && mapZoom === 'ukraine' && (
                <line 
                  x1="250" 
                  y1="140" 
                  x2="500" 
                  y2="140" 
                  stroke="rgba(99, 102, 241, 0.15)" 
                  strokeWidth="2" 
                  className="origin-[250px_140px] animate-spin" 
                  style={{ animationDuration: '10s' }} 
                />
              )}

              {/* Stylized Ukraine Vector Boundaries */}
              {mapZoom !== 'lviv' && mapZoom !== 'kyiv' && (
                <g id="tab-ukraine-boundary-mesh">
                  {/* Outer boundary fill & stroke */}
                  <path 
                    d="M 50,110 L 80,95 L 110,95 L 140,110 L 170,105 L 210,95 L 250,90 L 290,95 L 340,90 L 380,100 L 415,110 L 440,130 L 420,155 L 435,175 L 405,190 L 375,200 L 350,215 L 315,220 L 295,250 L 285,250 L 280,225 L 260,220 L 235,225 L 220,210 L 200,195 L 170,195 L 140,185 L 110,170 L 80,165 L 60,140 Z" 
                    className="fill-slate-900/65 stroke-slate-800 transition-all duration-700" 
                    strokeWidth="1.5" 
                  />
                  {/* Coastlines highlighting (Crimea & Southern shores) */}
                  <path 
                    d="M 220,210 L 235,225 L 260,220 L 280,225 L 285,250 L 295,250 L 315,220 L 350,215" 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    strokeDasharray="4 2" 
                    fill="none" 
                  />
                </g>
              )}

              {/* Lviv Inset Streets Layout (Detail Zoom) */}
              {mapZoom === 'lviv' && (
                <g id="tab-lviv-mesh">
                  {/* City Ring road */}
                  <circle cx="95" cy="115" r="18" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Intersecting roads converging on Heroiv UPA St */}
                  <line x1="65" y1="115" x2="125" y2="115" stroke="#0f172a" strokeWidth="2" />
                  <line x1="95" y1="95" x2="95" y2="145" stroke="#0f172a" strokeWidth="1.5" />
                  <path d="M 75,100 L 115,130" stroke="#0f172a" strokeWidth="1" />
                  {/* Inset Text labels */}
                  <text x="75" y="103" fill="#475569" fontSize="3.2" fontWeight="bold" fontFamily="monospace">вул. Героїв УПА, 73</text>
                  <text x="110" y="112" fill="#475569" fontSize="3" fontWeight="bold" fontFamily="monospace">Залізничний р-н</text>
                  <text x="82" y="132" fill="#38bdf8" fontSize="2.8" fontWeight="bold" fontFamily="monospace">Західний сектор СБУ-VIP</text>
                </g>
              )}

              {/* Kyiv Inset Rivers & Highways (Detail Zoom) */}
              {mapZoom === 'kyiv' && (
                <g id="tab-kyiv-mesh">
                  {/* Magnified River Dnipro */}
                  <path d="M 230,65 Q 240,95 255,105 T 285,120 T 300,145" fill="none" stroke="#1e3a8a" strokeWidth="6" className="opacity-55" />
                  <path d="M 230,65 Q 240,95 255,105 T 285,120 T 300,145" fill="none" stroke="#0284c7" strokeWidth="1.5" className="opacity-80" />
                  {/* Major Highways (Stolychne Highway, etc) */}
                  <path d="M 220,70 L 260,110 L 280,135" stroke="#101b2f" strokeWidth="3" fill="none" />
                  <path d="M 220,70 L 260,110 L 280,135" stroke="#334155" strokeWidth="1" fill="none" />
                  {/* Local highway H-01 going south to Kozyn */}
                  <path d="M 260,110 L 275,125 L 290,140" stroke="#334155" strokeWidth="1.2" strokeDasharray="2 1" fill="none" />
                  
                  {/* Inset Text labels */}
                  <text x="215" y="78" fill="#475569" fontSize="3.5" fontWeight="bold" fontFamily="monospace">м. Київ (Грушевського)</text>
                  <text x="282" y="112" fill="#475569" fontSize="3.2" fontWeight="bold" fontFamily="monospace">р. Дніпро</text>
                  <text x="290" y="130" fill="#cbd5e1" fontSize="3" fontWeight="bold" fontFamily="monospace" opacity="0.5">Обухівський напрямок</text>
                </g>
              )}

              {/* Flowing Dnipro River (shown in full view) */}
              {mapZoom === 'ukraine' && (
                <path 
                  d="M 270,50 Q 268,100 285,120 T 335,140 T 310,175 T 275,200 T 235,215" 
                  fill="none" 
                  stroke="#1e3a8a" 
                  strokeWidth="2" 
                  className="opacity-50" 
                />
              )}

              {/* Standard Cities Landmarks (dots on the background for authenticity) */}
              {mapZoom === 'ukraine' && (
                <g id="tab-cities-dots" className="opacity-50">
                  <circle cx="395" cy="100" r="2.5" fill="#475569" />
                  <text x="395" y="93" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">Харків</text>

                  <circle cx="225" cy="210" r="2.5" fill="#475569" />
                  <text x="225" y="203" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">Одеса</text>

                  <circle cx="335" cy="140" r="2.5" fill="#475569" />
                  <text x="335" y="133" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">Дніпро</text>

                  <circle cx="415" cy="155" r="2.5" fill="#475569" />
                  <text x="415" y="148" textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">Донецьк</text>
                </g>
              )}

              {/* LAYER 1: Pulsing Threat Heatmap Gradients */}
              {mapShowHeatmap && (
                <g id="tab-threat-heatmap-layer">
                  {/* High-threat comp-1 (Kyiv) */}
                  {mapZoom !== 'lviv' && (
                    <circle 
                      cx={mapZoom === 'kyiv' ? 235 : 270} 
                      cy={mapZoom === 'kyiv' ? 85 : 100} 
                      r={mapZoom === 'kyiv' ? 32 : 55} 
                      fill="url(#tab-heat-high)" 
                      className="animate-pulse" 
                    />
                  )}
                  {/* High-threat person-1 (Kozyn) */}
                  {mapZoom !== 'lviv' && (
                    <circle 
                      cx={mapZoom === 'kyiv' ? 275 : 285} 
                      cy={mapZoom === 'kyiv' ? 125 : 120} 
                      r={mapZoom === 'kyiv' ? 24 : 36} 
                      fill="url(#tab-heat-high)" 
                      className="animate-pulse" 
                      style={{ animationDelay: '500ms' }}
                    />
                  )}
                  {/* Medium-threat wallet-1 (Blockchain/Virtual node) */}
                  {mapZoom === 'ukraine' && (
                    <circle cx="420" cy="70" r="30" fill="url(#tab-heat-medium)" className="animate-pulse" />
                  )}
                </g>
              )}

              {/* LAYER 2: Customs Import/Export Routing Vectors */}
              {mapShowRoutes && mapZoom === 'ukraine' && (
                <g id="tab-routing-vectors">
                  {/* Arc from China (HK) to Kyiv (SinoTech Trading Ltd) */}
                  <path 
                    id="tab-route-china-kyiv"
                    d="M 480,150 Q 375,120 270,100" 
                    stroke="#f43f5e" 
                    strokeWidth="1.5" 
                    strokeDasharray="5 4" 
                    fill="none" 
                    className="opacity-70"
                  />
                  <text x="370" y="112" textAnchor="middle" fill="#f43f5e" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                    SinoTech HK ➔ Київ ($4.2M)
                  </text>
                  {/* Flowing animated cargo packet */}
                  <circle r="4" fill="#f43f5e">
                    <animateMotion dur="5.5s" repeatCount="indefinite" path="M 480,150 Q 375,120 270,100" />
                  </circle>

                  {/* Arc from Germany (DE) to Lviv (EuroArmor GmbH) */}
                  <path 
                    id="tab-route-germany-lviv"
                    d="M 20,80 Q 55,100 95,115" 
                    stroke="#10b981" 
                    strokeWidth="1.5" 
                    strokeDasharray="5 4" 
                    fill="none" 
                    className="opacity-70"
                  />
                  <text x="55" y="85" textAnchor="middle" fill="#10b981" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
                    EuroArmor DE ➔ Львів ($450K)
                  </text>
                  {/* Flowing animated cargo packet */}
                  <circle r="4" fill="#10b981">
                    <animateMotion dur="4.5s" repeatCount="indefinite" path="M 20,80 Q 55,100 95,115" />
                  </circle>
                </g>
              )}

              {/* LAYER 3: Transaction Flow Streams */}
              {mapShowFlows && mapZoom === 'ukraine' && (
                <g id="tab-finance-streams">
                  {/* Transfer from Kozyn (person-1) to BTC Wallet (wallet-1) */}
                  <path 
                    id="tab-flow-kozyn-wallet"
                    d="M 285,120 Q 352,95 420,70" 
                    stroke="#f59e0b" 
                    strokeWidth="1.8" 
                    strokeDasharray="4 2" 
                    fill="none" 
                    className="opacity-80"
                  />
                  {/* Transfer from central Kyiv (comp-1) to BTC Wallet (wallet-1) */}
                  <path 
                    id="tab-flow-kyiv-wallet"
                    d="M 270,100 Q 345,85 420,70" 
                    stroke="#f59e0b" 
                    strokeWidth="1.2" 
                    strokeDasharray="3 3" 
                    fill="none" 
                    className="opacity-65"
                  />

                  {/* Dynamic flowing coin particles */}
                  <circle r="3.5" fill="#fbbf24" className="shadow-lg">
                    <animateMotion dur="3.2s" repeatCount="indefinite" path="M 285,120 Q 352,95 420,70" />
                  </circle>
                  <circle r="3" fill="#fbbf24" className="opacity-80">
                    <animateMotion dur="3.8s" repeatCount="indefinite" path="M 270,100 Q 345,85 420,70" />
                  </circle>
                </g>
              )}

              {/* INTERACTIVE COMPONENT PINS AND LABELS */}
              <g id="tab-pins-mesh">
                {filteredLocations.map((loc) => {
                  // Hide pins depending on inset filters
                  if (mapZoom === 'kyiv' && loc.id === 'comp-2') return null;
                  if (mapZoom === 'kyiv' && loc.id === 'wallet-1') return null;
                  if (mapZoom === 'lviv' && loc.id !== 'comp-2') return null;

                  // Get actual rendering coordinates
                  let cx = loc.x;
                  let cy = loc.y;
                  if (mapZoom === 'kyiv' && loc.kyivX && loc.kyivY) {
                    cx = loc.kyivX;
                    cy = loc.kyivY;
                  }

                  const isHovered = hoveredMapEntityId === loc.id;
                  const isSelected = selectedEntityId === loc.id;
                  const riskColor = loc.riskScore >= 75 ? '#f43f5e' : loc.riskScore >= 50 ? '#f59e0b' : '#10b981';
                  
                  return (
                    <g 
                      key={loc.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedEntityId(loc.id);
                        if (loc.id === 'comp-1' || loc.id === 'person-1') {
                          // keep on kyiv/ukraine
                        } else if (loc.id === 'comp-2') {
                          setMapZoom('lviv');
                        } else {
                          setMapZoom('global');
                        }
                      }}
                      onMouseEnter={() => setHoveredMapEntityId(loc.id)}
                      onMouseLeave={() => setHoveredMapEntityId(null)}
                    >
                      {/* Ring beacon pulse for currently inspected entity */}
                      {isSelected && (
                        <g>
                          <circle cx={cx} cy={cy} r="16" fill="none" stroke={riskColor} strokeWidth="1" className="animate-ping opacity-35" />
                          <circle cx={cx} cy={cy} r="24" fill="none" stroke={riskColor} strokeWidth="0.5" className="animate-pulse opacity-20" />
                        </g>
                      )}

                      {/* Map Pin Core Circle */}
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={isHovered || isSelected ? "7.5" : "6"} 
                        fill="#020617" 
                        stroke={riskColor} 
                        strokeWidth={isHovered || isSelected ? "3" : "2"} 
                        className="transition-all duration-300"
                      />

                      {/* Small point core */}
                      <circle cx={cx} cy={cy} r="2.5" fill={riskColor} />

                      {/* Entity Label Card under pin */}
                      {(mapZoom === 'ukraine' || mapZoom === 'global') && (
                        <g className="transition-all duration-300 pointer-events-none">
                          <rect 
                            x={cx - 24} 
                            y={cy + 8.5} 
                            width="48" 
                            height="11.5" 
                            rx="3" 
                            fill="rgba(2, 6, 23, 0.85)" 
                            stroke={isSelected ? "rgba(99, 102, 241, 0.5)" : "rgba(30, 41, 59, 0.6)"} 
                            strokeWidth="0.5" 
                          />
                          <text 
                            x={cx} 
                            y={cy + 16.5} 
                            textAnchor="middle" 
                            fill={isSelected ? "#a5b4fc" : "#94a3b8"} 
                            fontSize="5.5" 
                            fontWeight="bold" 
                            fontFamily="monospace"
                          >
                            {loc.name.replace(/ТОВ |"|'/g, '').slice(0, 10)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Bottom HUD Indicators (Coordinates of center focus) */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-850 px-2.5 py-1.5 rounded-lg text-[8.5px] font-mono text-slate-500 z-20 flex items-center gap-1.5 uppercase select-none">
              <Navigation className="w-3 h-3 text-indigo-400" />
              <span>ФОКУС: {mapZoom === 'ukraine' ? '30.5238° E, 50.4501° N' : mapZoom === 'kyiv' ? '30.5242° E, 50.4492° N (Центр)' : mapZoom === 'lviv' ? '24.0297° E, 49.8397° N' : 'BLOCKCHAIN NETWORK'}</span>
            </div>

            {/* Float alert banner for high threat alerts */}
            {mapShowHeatmap && (
              <div className="absolute bottom-3 right-3 bg-rose-950/90 border border-rose-900/60 px-3 py-1.5 rounded-lg text-[8.5px] font-mono text-rose-300 z-20 flex items-center gap-2 max-w-xs animate-bounce select-none">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>ОБУХІВ / КОЗИН: ЗАФІКСОВАНО СИСТЕМНУ АНОМАЛІЮ</span>
              </div>
            )}
          </div>

          {/* Active Layers Toggles & Settings Board */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-900/80 p-4 mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 z-10 relative">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide font-mono">Карта тепла</span>
                <span className="text-[8px] text-slate-500 font-mono">Ареоли загрози</span>
              </div>
              <button
                onClick={() => setMapShowHeatmap(!mapShowHeatmap)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowHeatmap ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowHeatmap ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide font-mono">Митні вектори</span>
                <span className="text-[8px] text-slate-500 font-mono">Логістика товарів</span>
              </div>
              <button
                onClick={() => setMapShowRoutes(!mapShowRoutes)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowRoutes ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowRoutes ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide font-mono">Крипто-потоки</span>
                <span className="text-[8px] text-slate-500 font-mono">Транзакційні шляхи</span>
              </div>
              <button
                onClick={() => setMapShowFlows(!mapShowFlows)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowFlows ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowFlows ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide font-mono">Тактичний радар</span>
                <span className="text-[8px] text-slate-500 font-mono">Промінь розгортки</span>
              </div>
              <button
                onClick={() => setMapShowRadar(!mapShowRadar)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${mapShowRadar ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${mapShowRadar ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Search, Active list & Selected Node Dossier (Span 4) */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Node Selector & Filter Box */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest block">
                ФІЛЬТРАЦІЯ ГЕО-ВУЗЛІВ
              </span>
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            {/* Mini search inside mapping system */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Пошук точки на карті..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500/40 focus:outline-none rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-sans"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>

            {/* Risk filter select pill box */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-900/60 text-[9px]">
              <button
                onClick={() => setRiskFilter('all')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${riskFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
              >
                Всі
              </button>
              <button
                onClick={() => setRiskFilter('high')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${riskFilter === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'}`}
              >
                Критичні
              </button>
              <button
                onClick={() => setRiskFilter('medium')}
                className={`flex-1 py-1 px-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${riskFilter === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'}`}
              >
                Середні
              </button>
            </div>

            {/* List of matching locations on the map */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
              {filteredLocations.map(loc => {
                const isSelected = selectedEntityId === loc.id;
                const riskColorText = loc.riskScore >= 75 ? 'text-rose-400 bg-rose-500/5 border-rose-500/20' : loc.riskScore >= 50 ? 'text-amber-400 bg-amber-500/5 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20';
                
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedEntityId(loc.id);
                      if (loc.id === 'comp-1' || loc.id === 'person-1') {
                        setMapZoom('kyiv');
                      } else if (loc.id === 'comp-2') {
                        setMapZoom('lviv');
                      } else {
                        setMapZoom('global');
                      }
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-center justify-between ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow' 
                        : 'bg-slate-950/40 border-slate-900/60 hover:bg-slate-950/80 hover:border-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 ${isSelected ? 'text-indigo-400' : ''}`}>
                        {loc.id === 'comp-1' || loc.id === 'comp-2' ? <Briefcase className="w-3.5 h-3.5" /> : loc.id === 'person-1' ? <User className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-200 truncate">{loc.name}</p>
                        <span className="text-[9px] text-slate-500 font-mono">{loc.city}</span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${riskColorText}`}>
                      {loc.riskScore}%
                    </span>
                  </div>
                );
              })}

              {filteredLocations.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs font-mono">
                  Нічого не знайдено за запитом
                </div>
              )}
            </div>
          </div>

          {/* Selected Node Detailed OSINT Dossier Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
              <Sparkles className="w-16 h-16" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-widest block">
                ДОСЬЄ ВУЗЛА В РЕАЛЬНОМУ ЧАСІ
              </span>
              <span className="text-[8px] bg-slate-950 text-slate-400 border border-slate-850 px-2 py-0.5 rounded font-mono uppercase font-black">
                {selectedEntity.status}
              </span>
            </div>

            {/* Entity overview details */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedEntity.name}</h4>
                <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">
                  {selectedEntity.type === 'company' ? 'Юридична особа' : selectedEntity.type === 'person' ? 'Фізична особа' : 'Криптовалютна адреса'} • Код {selectedEntity.code}
                </p>
              </div>

              {/* Grid with address & phone */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-900 space-y-2 text-xs text-slate-400 font-mono">
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Географічна адреса реєстрації</span>
                    <span className="text-slate-300 font-sans leading-relaxed">{selectedEntity.address}</span>
                  </div>
                </div>

                {selectedEntity.phone && (
                  <div className="border-t border-slate-900/80 pt-2 flex justify-between">
                    <span>Телефон: <strong className="text-slate-200 font-sans">{selectedEntity.phone}</strong></span>
                    {selectedEntity.email && <span>Email: <strong className="text-slate-200 font-sans">{selectedEntity.email}</strong></span>}
                  </div>
                )}
              </div>

              {/* Brief details based on type */}
              <div className="text-xs leading-relaxed text-slate-400">
                <p className="font-sans italic">"{selectedEntity.description}"</p>
              </div>

              {/* Connections list direct in Maps view */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">
                  ЗВ'ЯЗКИ ВУЗЛА (ВЕКТОРНІ НАПРЯМКИ)
                </span>
                
                <div className="grid grid-cols-1 gap-1.5 text-[11px] font-mono">
                  {selectedEntity.relationships.map((rel, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        const found = OSINT_ENTITIES.find(e => e.id === rel.targetId);
                        if (found) {
                          setSelectedEntityId(found.id);
                          if (found.id === 'comp-1' || found.id === 'person-1') {
                            setMapZoom('kyiv');
                          } else if (found.id === 'comp-2') {
                            setMapZoom('lviv');
                          } else {
                            setMapZoom('global');
                          }
                        }
                      }}
                      className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-slate-800 p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <ArrowRight className="w-3 h-3 text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        <span className="text-slate-300 truncate max-w-[170px] font-sans font-semibold">{rel.targetName}</span>
                      </div>
                      <span className={`text-[8.5px] font-bold uppercase px-1 rounded ${rel.risk === 'HIGH' ? 'text-rose-400 bg-rose-500/5 border border-rose-500/10' : rel.risk === 'MEDIUM' ? 'text-amber-400 bg-amber-500/5 border border-amber-500/10' : 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10'}`}>
                        {rel.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Inspector Synchronization Link Button */}
              {onSelectEntityGlobal && (
                <button
                  onClick={() => onSelectEntityGlobal(selectedEntity)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-mono font-extrabold uppercase tracking-widest py-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>Відкрити в ШІ-Ядрі</span>
                </button>
              )}
            </div>
          </div>

          {/* Tactical controls (Radar, Scanning) */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-lg space-y-4">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">
              АКТИВНІ СУПУТНИКОВІ СКРИПТИ
            </span>

            {isScanning ? (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20 flex flex-col items-center justify-center text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase animate-pulse">
                  {scanMessage || "Сканування..."}
                </span>
              </div>
            ) : scanMessage ? (
              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30 text-emerald-400 text-xs font-mono leading-relaxed text-center">
                {scanMessage}
              </div>
            ) : (
              <button
                onClick={startTacticalScan}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Запустити тактичний супутник</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
