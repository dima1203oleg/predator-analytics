/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldAlert, Activity, TrendingUp, Compass, Globe, Server, 
  CheckCircle, HelpCircle, ArrowRight, Zap, RefreshCw, Eye, 
  Briefcase, User, Terminal, Calendar, AlertTriangle, FileText, 
  Sparkles, Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { OSINT_ENTITIES } from '../osintData';

interface DashboardViewProps {
  onSelectTab: (tabId: string) => void;
  onSelectEntity: (entityId: string) => void;
}

export default function DashboardView({ onSelectTab, onSelectEntity }: DashboardViewProps) {
  const [radarStatus, setRadarStatus] = React.useState<'IDLE' | 'SCANNING' | 'FINISHED'>('IDLE');
  const [syncStatus, setSyncStatus] = React.useState<'IDLE' | 'SYNCING' | 'DONE'>('IDLE');
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [screeningResult, setScreeningResult] = React.useState<string | null>(null);

  // 2D Risk-Distribution Heatmap State
  const [heatmapFilter, setHeatmapFilter] = React.useState<'all' | 'company' | 'person' | 'cryptowallet'>('all');
  const [showGlow, setShowGlow] = React.useState(true);
  const [activeHoverId, setActiveHoverId] = React.useState<string | null>(null);

  // Trigger simulated radar sweep
  const triggerRadarScan = () => {
    setRadarStatus('SCANNING');
    setTimeout(() => {
      setRadarStatus('FINISHED');
    }, 2500);
  };

  // Trigger simulated database indexing sync
  const triggerDatabaseSync = () => {
    if (syncStatus === 'SYNCING') return;
    setSyncStatus('SYNCING');
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncStatus('DONE');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // Trigger immediate AI security compliance screening notice
  const triggerComplianceScreening = () => {
    setScreeningResult("ШІ: Виявлено 4 транскордонні підозрілі транзакції на суму $120,000 через Беліз. Об'єкт ТОВ 'СпецТехПостач' помічено як КРИТИЧНИЙ РИЗИК.");
  };

  const stats = [
    { label: "Під санкціями РНБО", value: "4,192", change: "+14 сьогодні", icon: ShieldAlert, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    { label: "Моніторинг юросіб", value: "148,029", change: "60 FPS індекс", icon: Briefcase, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { label: "Судові ухвали (оброблено)", value: "1.2M", change: "99.9% точність OCR", icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Крипто-адреси в базі", value: "12,401", change: "+89 за годину", icon: TrendingUp, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
  ];

  const recentSearches = [
    { text: "ТОВ 'СпецТехПостач'", type: "Company", risk: 94, code: "38294012" },
    { text: "Коваленко Ігор Вікторович", type: "Person", risk: 82, code: "2938401923" },
    { text: "BTC Wallet (0x38ac...d831)", type: "Wallet", risk: 89, code: "bc1qxy2kg..." }
  ];

  const criticalRisks = [
    { title: "Транзит коштів через офшори Belize у ТОВ 'СпецТехПостач'", level: "КРИТИЧНО", date: "Сьогодні, 02:40", source: "AML Моніторинг" },
    { title: "Зміна засновника у підсанкційному Львівському оборонному постачальнику", level: "ВИСОКИЙ", date: "Вчора, 18:15", source: "ЄДР моніторинг" },
    { title: "Збіг санкційного списку ЄС щодо директора ТОВ 'Харків-Логістик'", level: "ВИСОКИЙ", date: "15 липня, 11:30", source: "OpenSanctions" }
  ];

  // Filter and process OSINT_ENTITIES for the 2D Risk Heatmap
  const filteredEntities = OSINT_ENTITIES.filter(ent => {
    if (heatmapFilter === 'all') return true;
    return ent.type === heatmapFilter;
  });

  const getEntityCoords = (ent: typeof OSINT_ENTITIES[0]) => {
    // Y: Risk Score (inverted, scaled to 12% to 88% to stay inside the plot area safely)
    const y = 88 - (ent.riskScore / 100) * 76;
    
    // X: Based on relationships count, with spread offsets to avoid overlap
    let x = 50;
    const relCount = ent.relationships?.length || 0;
    
    if (relCount >= 3) {
      // High connectivity: 72% to 85% range
      x = ent.id === 'comp-1' ? 82 : 72;
    } else if (relCount === 2) {
      // Moderate connectivity: 42% to 58% range
      x = ent.id === 'wallet-1' ? 56 : 42;
    } else {
      // Low connectivity: 18% to 32% range
      x = 22;
    }
    
    return { x, y };
  };

  const avgRiskScore = Math.round(
    filteredEntities.reduce((acc, ent) => acc + ent.riskScore, 0) / (filteredEntities.length || 1)
  );
  
  const criticalCount = filteredEntities.filter(ent => ent.riskScore >= 75).length;

  return (
    <div className="space-y-6" id="dashboard-view-root">
      
      {/* Dynamic HUD Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="hud-stats-grid">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-[#0b1329]/60 border border-slate-850 hover:border-indigo-500/30 rounded-2xl p-4.5 flex items-center justify-between shadow-xl backdrop-blur-sm relative overflow-hidden group cursor-pointer"
          >
            {/* Ambient hover glow spot */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="relative z-10">
              <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-widest block">
                {stat.label}
              </span>
              <span className="text-2xl font-black text-white tracking-tight block mt-1.5 font-sans">
                {stat.value}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-bold block mt-1">
                {stat.change}
              </span>
            </div>
            <div className={`p-3 rounded-xl border relative z-10 transition-transform duration-300 group-hover:scale-110 ${stat.color}`}>
              <stat.icon className="w-5.5 h-5.5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grid: Main Dashboard widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left column: Analytics, Map & News */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Map & Link-Graph Widget combination */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-teal-400" />
                <span className="text-xs font-bold uppercase text-slate-100 tracking-widest">
                  Глобальна Ситуаційна Карта Загроз
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                АКТИВНИЙ МОНІТОРИНГ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 h-[240px] bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center">
                {/* SVG representing tactical vector background */}
                <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 240">
                  <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#glow)" />
                  {/* Tactical radar grids */}
                  <circle cx="200" cy="120" r="100" stroke="#334155" strokeWidth="0.5" strokeDasharray="5 5" />
                  <circle cx="200" cy="120" r="50" stroke="#334155" strokeWidth="0.5" />
                  <line x1="0" y1="120" x2="400" y2="120" stroke="#1e293b" strokeWidth="0.5" />
                  <line x1="200" y1="0" x2="200" y2="240" stroke="#1e293b" strokeWidth="0.5" />
                  
                  {/* Hotspots */}
                  <circle cx="160" cy="80" r="4" fill="#ef4444" className="animate-ping" />
                  <circle cx="160" cy="80" r="2" fill="#ef4444" />
                  <circle cx="240" cy="140" r="4" fill="#ef4444" className="animate-ping" style={{ animationDelay: '1s' }} />
                  <circle cx="240" cy="140" r="2" fill="#ef4444" />
                </svg>

                <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-850 px-2 py-1 rounded text-[8px] text-slate-500 font-mono">
                  DEC.GL GEOSPATIAL VECTOR MATRIX
                </div>

                <div className="text-center z-10 px-6">
                  <p className="text-slate-300 font-sans font-bold text-xs">Географічний шар митних та AML ризиків</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Транскордонні канали поставок подвійних компонентів до РФ відстежуються ШІ</p>
                  <button 
                    onClick={() => onSelectTab('maps')}
                    className="mt-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    Відкрити інтерактивну карту
                  </button>
                </div>
              </div>

              {/* Sidebar metric inside the Situational map block */}
              <div className="md:col-span-4 bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">АКТИВНІ КАНАЛИ</span>
                
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Шеньчжень → Київ</span>
                    <span className="text-red-400 font-bold font-mono">94% Ризик</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-red-500 h-1 rounded-full" style={{ width: '94%' }}></div>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Лейпциг → Львів</span>
                    <span className="text-emerald-400 font-bold font-mono">10% Безпечно</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '10%' }}></div>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Гонконг → Стамбул</span>
                    <span className="text-amber-400 font-bold font-mono">68% Скринінг</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1">
                    <div className="bg-amber-500 h-1 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono border-t border-slate-900 pt-2 mt-2">
                  Дані митниці оновлюються автоматично згідно з 16 томами ТЗ.
                </div>
              </div>
            </div>
          </div>

          {/* 2D Risk-Distribution Heatmap Widget */}
          <div className="bg-[#0b1329]/60 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-sm" id="risk-distribution-heatmap-widget">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-3 gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-rose-500" />
                <div>
                  <span className="text-xs font-bold uppercase text-slate-100 tracking-widest block font-mono">
                    2D Теплокарта Розподілу Ризиків (Risk Intensity Matrix)
                  </span>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Кореляція рівня загрози (Risk Score) та кількості зв'язків об'єктів
                  </p>
                </div>
              </div>
              
              {/* Filter controls inside the heatmap widget */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-900/60">
                <button
                  onClick={() => setHeatmapFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Всі
                </button>
                <button
                  onClick={() => setHeatmapFilter('company')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === 'company' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Юрособи
                </button>
                <button
                  onClick={() => setHeatmapFilter('person')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === 'person' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Особи
                </button>
                <button
                  onClick={() => setHeatmapFilter('cryptowallet')}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    heatmapFilter === 'cryptowallet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Крипто
                </button>
              </div>
            </div>

            {/* Grid for heatmap container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
              {/* Heatmap main canvas */}
              <div className="lg:col-span-8 relative h-[300px] bg-slate-950/80 border border-slate-900/80 rounded-xl overflow-hidden p-4 flex flex-col justify-between">
                
                {/* 2D Plane Grid Background */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Grid Lines */}
                  <svg className="w-full h-full opacity-10" stroke="#475569" strokeWidth="0.5">
                    {/* Horizontal grid lines */}
                    <line x1="0" y1="20%" x2="100%" y2="20%" strokeDasharray="3 3" />
                    <line x1="0" y1="40%" x2="100%" y2="40%" strokeDasharray="3 3" />
                    <line x1="0" y1="60%" x2="100%" y2="60%" strokeDasharray="3 3" />
                    <line x1="0" y1="80%" x2="100%" y2="80%" strokeDasharray="3 3" />
                    
                    {/* Vertical grid lines */}
                    <line x1="20%" y1="0" x2="20%" y2="100%" strokeDasharray="3 3" />
                    <line x1="40%" y1="0" x2="40%" y2="100%" strokeDasharray="3 3" />
                    <line x1="60%" y1="0" x2="60%" y2="100%" strokeDasharray="3 3" />
                    <line x1="80%" y1="0" x2="80%" y2="100%" strokeDasharray="3 3" />
                  </svg>
                  
                  {/* Subtle diagonal risk division line */}
                  <svg className="w-full h-full absolute inset-0 opacity-15 pointer-events-none">
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="70%" y="30%" fill="#f43f5e" fontSize="8" fontFamily="monospace" transform="rotate(-21, 280, 80)">ЗОНА АНОМАЛІЇ</text>
                  </svg>
                </div>

                {/* Heatmap Gradients Blur Background to simulate density */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {filteredEntities.map((ent) => {
                    const coords = getEntityCoords(ent);
                    const isHigh = ent.riskScore >= 75;
                    const glowColor = isHigh ? 'rgba(244, 63, 94, 0.25)' : ent.riskScore >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)';
                    if (!showGlow) return null;
                    return (
                      <div 
                        key={`glow-${ent.id}`}
                        className="absolute rounded-full blur-[45px] transition-all duration-1000"
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          width: `${ent.riskScore * 1.5}px`,
                          height: `${ent.riskScore * 1.5}px`,
                          backgroundColor: glowColor,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Chart Y-Axis Labels */}
                <div className="absolute left-3 top-4 bottom-12 flex flex-col justify-between text-[8px] font-mono text-slate-500 pointer-events-none z-10 select-none">
                  <span>100% — КРИТИЧНИЙ</span>
                  <span>75% — ВИСОКИЙ</span>
                  <span>50% — СЕРЕДНІЙ</span>
                  <span>25% — НИЗЬКИЙ</span>
                  <span>0%</span>
                </div>

                {/* Main Interactive Plot Area */}
                <div className="relative w-full h-full mt-4 mb-4 ml-14 mr-4">
                  {/* Plotted nodes */}
                  {filteredEntities.map((ent) => {
                    const coords = getEntityCoords(ent);
                    const isSelected = activeHoverId === ent.id;
                    const riskColor = ent.riskScore >= 75 ? 'bg-rose-500 border-rose-400 text-rose-500' : ent.riskScore >= 50 ? 'bg-amber-500 border-amber-400 text-amber-500' : 'bg-emerald-500 border-emerald-400 text-emerald-500';
                    const riskText = ent.riskScore >= 75 ? 'text-rose-400' : ent.riskScore >= 50 ? 'text-amber-400' : 'text-emerald-400';
                    const Icon = ent.type === 'company' ? Briefcase : ent.type === 'person' ? User : Terminal;
                    
                    return (
                      <div
                        key={ent.id}
                        className="absolute cursor-pointer group z-20"
                        style={{
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onMouseEnter={() => setActiveHoverId(ent.id)}
                        onMouseLeave={() => setActiveHoverId(null)}
                        onClick={() => {
                          onSelectEntity(ent.id);
                          onSelectTab('volumes');
                        }}
                      >
                        {/* Ping radar effect for high risk */}
                        {ent.riskScore >= 75 && (
                          <span className="absolute inline-flex h-12 w-12 rounded-full bg-rose-500/20 animate-ping -left-3 -top-3 pointer-events-none" />
                        )}
                        
                        {/* Interactive Circle Pin */}
                        <div className={`w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center shadow-lg shadow-black/80 group-hover:scale-125 group-hover:border-indigo-400 transition-all duration-300 relative`}>
                          <Icon className={`w-3.5 h-3.5 ${riskText}`} />
                          
                          {/* Risk Score Pill directly attached */}
                          <span className="absolute -top-3.5 -right-3 px-1 rounded bg-slate-950 border border-slate-800 text-[7px] font-mono font-bold text-slate-300 scale-90 group-hover:scale-100 transition-transform">
                            {ent.riskScore}%
                          </span>
                        </div>

                        {/* Floating quick mini-label */}
                        <span className="absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 border border-slate-900/60 px-2 py-0.5 rounded text-[8.5px] font-mono font-bold text-slate-300 group-hover:text-white transition-colors">
                          {ent.name.replace(/ТОВ |"|'/g, '')}
                        </span>

                        {/* Custom hover detail panel */}
                        {isSelected && (
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[240px] bg-slate-950/95 border border-indigo-500/30 p-3 rounded-xl shadow-2xl z-30 pointer-events-none space-y-1 text-left backdrop-blur-md">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-slate-100 truncate pr-2">{ent.name}</span>
                              <span className={`text-[10px] font-mono font-black ${riskText}`}>{ent.riskScore}%</span>
                            </div>
                            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                              {ent.type === 'company' ? 'Юридична особа' : ent.type === 'person' ? 'Фізична особа' : 'Крипто-гаманець'}
                            </p>
                            <div className="border-t border-slate-900 my-1.5"></div>
                            <div className="text-[8.5px] text-slate-400 font-mono space-y-1">
                              <div>Код/Адреса: <span className="text-slate-200 block truncate">{ent.code}</span></div>
                              <div className="flex justify-between">
                                <span>Зв'язків: <strong className="text-slate-200">{ent.relationships?.length || 0}</strong></span>
                                <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase bg-slate-900 ${riskText}`}>
                                  {ent.status}
                                </span>
                              </div>
                            </div>
                            <div className="border-t border-slate-900/60 pt-1 mt-1 flex items-center justify-between">
                              <span className="text-[7.5px] text-indigo-400 font-mono animate-pulse">Клікніть для повного аналізу зв'язків</span>
                              <ArrowRight className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Chart X-Axis Labels */}
                <div className="flex justify-between text-[8px] font-mono text-slate-500 border-t border-slate-900 pt-2 ml-14 mr-4 select-none">
                  <span>Низький рівень зв'язків (1-2)</span>
                  <span>Середній ступінь залученості</span>
                  <span>Критичні транскордонні зв'язки (3+)</span>
                </div>
              </div>

              {/* Right panel: Heatmap key stats / legend */}
              <div className="lg:col-span-4 bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block border-b border-slate-900 pb-1.5">
                    Показники ризик-матриці
                  </span>
                  
                  {/* Analytics metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 font-mono block">СЕРЕДНІЙ РИЗИК</span>
                      <span className="text-lg font-black text-indigo-400 font-mono">{avgRiskScore}%</span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-900 text-center">
                      <span className="text-[8px] text-slate-500 font-mono block">КРИТИЧНІ ОБ'ЄКТИ</span>
                      <span className="text-lg font-black text-rose-500 font-mono">{criticalCount}</span>
                    </div>
                  </div>

                  {/* Settings toggle */}
                  <div className="bg-slate-950/80 rounded-lg border border-slate-900 p-3 space-y-2">
                    <span className="text-[8px] text-slate-400 font-mono font-bold block uppercase tracking-wider">Візуальні параметри</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Градієнтні теплові ареоли</span>
                      <button
                        onClick={() => setShowGlow(!showGlow)}
                        className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer ${showGlow ? 'bg-indigo-600' : 'bg-slate-800'}`}
                      >
                        <div className={`bg-white w-3.5 h-3.5 rounded-full shadow transition-transform ${showGlow ? 'translate-x-3.5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Distribution Legend */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[8px] text-slate-500 font-mono font-bold block uppercase tracking-wider">Легенда інтенсивності</span>
                    <div className="flex flex-col gap-1 text-[9px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-900/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Критичний рівень (&gt;75%)</span>
                        </span>
                        <span className="font-mono text-[8px] font-bold text-rose-400">КАТ: А</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Високий рівень (50-75%)</span>
                        </span>
                        <span className="font-mono text-[8px] font-bold text-amber-400">КАТ: B</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Низький рівень (&lt;50%)</span>
                        </span>
                        <span className="font-mono text-[8px] font-bold text-emerald-400">КАТ: C</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono leading-relaxed border-t border-slate-900/80 pt-3">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Виявлено аномальну концентрацію:</span>
                  </div>
                  <span>Один мажоритарний власник пов'язаний з декількома високими ризиками. Спільний фокус на ТОВ 'СпецТехПостач' та BTC Wallet створює потенційне джерело обходу санкцій.</span>
                </div>
              </div>
            </div>
          </div>

          {/* TACTICAL INTERACTIVE CONTROL PANEL */}
          <div className="bg-[#0b1329]/40 border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden backdrop-blur-sm" id="tactical-interactive-panel">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase text-slate-100 tracking-widest font-mono">
                  ⚡ Інтерактивний командний пульт PREDATOR
                </span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-wider uppercase">ОПЕРАЦІЇ В РЕАЛЬНОМУ ЧАСІ</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {/* Operation 1: Radar scan */}
              <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-3.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/20 transition-all group">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">📡 ГЛОБАЛЬНИЙ РАДАР</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed">Сканування гео-каналів та обходу митниць у реальному часі.</p>
                </div>
                <div>
                  {radarStatus === 'SCANNING' && (
                    <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-mono mb-2 font-bold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Сканування вузлів...</span>
                    </div>
                  )}
                  {radarStatus === 'FINISHED' && (
                    <div className="text-[10px] text-emerald-400 font-mono mb-2 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ЗНАЙДЕНО: 42 об'єкти</span>
                    </div>
                  )}
                  {radarStatus === 'IDLE' && (
                    <div className="text-[10px] text-slate-500 font-mono mb-2 font-semibold">Стан: Очікування запуску</div>
                  )}
                  <button
                    onClick={triggerRadarScan}
                    disabled={radarStatus === 'SCANNING'}
                    className={`w-full py-2 px-3 text-[10px] font-black uppercase rounded-lg tracking-wider font-mono cursor-pointer transition-all ${radarStatus === 'SCANNING' ? 'bg-slate-900 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10'}`}
                  >
                    {radarStatus === 'SCANNING' ? 'Сканування...' : 'Запустити Скринінг'}
                  </button>
                </div>
              </div>

              {/* Operation 2: Sync DB */}
              <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-3.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/20 transition-all group">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">🔄 СИНХРОНІЗАЦІЯ БАЗИ</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed">Звірка реєстру РНБО з міжнародними санкційними списками.</p>
                </div>
                <div>
                  {syncStatus === 'SYNCING' && (
                    <div className="space-y-1.5 mb-2.5">
                      <div className="flex justify-between text-[9px] font-mono text-amber-400 font-bold">
                        <span>Синхронізація реєстрів...</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-1 rounded-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {syncStatus === 'DONE' && (
                    <div className="text-[10px] text-emerald-400 font-mono mb-2.5 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>РЕЄСТРИ СИНХРОНІЗОВАНО</span>
                    </div>
                  )}
                  {syncStatus === 'IDLE' && (
                    <div className="text-[10px] text-slate-500 font-mono mb-2.5 font-semibold">Остання синхронізація: 2 хв тому</div>
                  )}
                  <button
                    onClick={triggerDatabaseSync}
                    disabled={syncStatus === 'SYNCING'}
                    className={`w-full py-2 px-3 text-[10px] font-black uppercase rounded-lg tracking-wider font-mono cursor-pointer transition-all ${syncStatus === 'SYNCING' ? 'bg-slate-900 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10'}`}
                  >
                    {syncStatus === 'SYNCING' ? 'Оновлюємо...' : 'Звірити бази'}
                  </button>
                </div>
              </div>

              {/* Operation 3: AI Screening */}
              <div className="bg-slate-950/70 border border-slate-900 rounded-xl p-3.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/20 transition-all group">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">🧪 ШІ AML СКРИНІНГ</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed">Глибока перевірка транскордонних переказів через Gemini 3.5.</p>
                </div>
                <div>
                  {screeningResult ? (
                    <div className="text-[9px] text-rose-400 font-mono bg-rose-950/20 border border-rose-900/30 rounded-lg p-2 leading-relaxed mb-2.5 max-h-[56px] overflow-y-auto">
                      {screeningResult}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono mb-2.5 font-semibold">Стан: Потрібен запуск аналізу</div>
                  )}
                  <button
                    onClick={triggerComplianceScreening}
                    className="w-full py-2 px-3 text-[10px] font-black uppercase rounded-lg tracking-wider font-mono bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-all shadow-md shadow-indigo-500/10"
                  >
                    Запустити AML ШІ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights & Summary Section (Section 11) */}
          <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-5 relative overflow-hidden" id="ai-insights-block">
            <div className="absolute right-4 top-4 text-indigo-500/20">
              <Sparkles className="w-16 h-16" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase text-indigo-400 tracking-widest font-mono">AI SUMMARY & РЕКОМЕНДАЦІЇ ШІ</span>
            </div>
            
            <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
              За результатами аналізу зв'язків у нашому графі, зафіксовано сплеск реєстрації компаній-посередників у Туреччині та Белізі, які пов'язані з українськими бенефіціарами через ланцюжки міноритарного володіння. Рекомендується провести примусову перевірку всіх контрагентів за кодом ЄДРПОУ, використовуючи вкладку <strong className="text-indigo-300">"Пошук & OSINT-Аналіз"</strong>, для виявлення прихованих зв'язків з особами під санкціями РНБО України.
            </p>
          </div>

        </div>

        {/* Right column: Recent searches & Risks feeds */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Last Searches / Autocomplete AI reference (Section 11 & 12) */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-lg space-y-3.5">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center justify-between">
              <span>ОСТАННІ АНАЛІЗОВАНИЙ ОБ'ЄКТИ</span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </span>

            <div className="space-y-2.5">
              {recentSearches.map((search, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    const found = OSINT_ENTITIES.find(e => e.name.toLowerCase().includes(search.text.toLowerCase().slice(0, 10)));
                    if (found) {
                      onSelectEntity(found.id);
                      onSelectTab('volumes'); // Navigate to workbench
                    }
                  }}
                  className="bg-slate-950/70 border border-slate-900 hover:border-slate-800 rounded-xl p-3 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-indigo-400 transition-colors">
                      {search.type === 'Company' ? <Briefcase className="w-3.5 h-3.5" /> : search.type === 'Person' ? <User className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{search.text}</p>
                      <span className="text-[9px] text-slate-500 font-mono">{search.type} • {search.code}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${search.risk > 75 ? 'text-red-400 bg-red-500/5 border-red-500/20' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'}`}>
                    {search.risk}% Risk
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks list widget (Section 11) */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 shadow-lg space-y-3.5">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>ДЖЕРЕЛО РИЗИКІВ (РЕАЛЬНИЙ ЧАС)</span>
            </span>

            <div className="space-y-3">
              {criticalRisks.map((risk, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-slate-500">{risk.source}</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded ${risk.level === 'КРИТИЧНО' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {risk.level}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-300 leading-normal">
                    {risk.title}
                  </p>
                  <span className="text-[9px] text-slate-600 block text-right font-mono">{risk.date}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
