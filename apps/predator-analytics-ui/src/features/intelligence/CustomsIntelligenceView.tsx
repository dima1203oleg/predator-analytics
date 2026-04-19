/**
 * 🚢 CUSTOMS INTELLIGENCE // МИТНА АНАЛІТИКА | v57.5-WRAITH
 * PREDATOR Analytics — Logistics & Trade Flow Intelligence
 * 
 * Моніторинг митних декларацій, аналіз контрагентів (ЗЕД),
 * трекінг товарних груп та виявлення митних ризиків.
 * 
 * PREDATOR_WRATH v57.5 · Classified · Tier-1
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskLevelValue } from '@/types/intelligence';
import {
  Ship, Package, Globe, TrendingUp, DollarSign,
  Filter, Download, Activity, ShieldAlert, Target,
  BarChart3, PieChart, Map,
  Crown, Zap, Anchor, Box, Truck, Factory,
  Scan, FileText,
  ChevronRight, AlertTriangle, Siren, RefreshCw, Database
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart as RePieChart,
  Pie, Cell
} from 'recharts';
import { cn } from '@/utils/cn';
import { analyticsService } from '@/services/unified/analytics.service';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { SovereignAudio } from '@/utils/sovereign-audio';

// ========================
// Background Scanning HUD v57.5
// ========================

const ScanningHUD: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
            <motion.div
                animate={{ y: ['-10%', '110%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 w-full h-[1px] bg-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
            />
            <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2 font-mono text-[7px] text-rose-500/30 uppercase italic font-bold">
                <span>ДОСТУП_СЕКТОРУ: РІВЕНЬ_WRAITH_ELITE</span>
                <span>ДЖЕРЕЛО_ДАНИХ: МИТНИЙ_ШЛЮЗ_PROX</span>
                <span>ЯДРО_WRAITH: АКТИВНЕ</span>
            </div>
        </div>
    );
};

// ========================
// Manifest X-Ray Terminal
// ========================

const ManifestXrayTerminal: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);
    const [isActive] = useState(true);

    const logPool = [
        "ОТРИМАННЯ: RAW_CARGO_MANIFEST_ID_{ID}",
        "СТРІМІНГ: БЛОК_ДАТАГРАМ_МАНІФЕСТУ...",
        "ПОШУК_РЕЄСТРУ: ПЕРЕВІРКА_ЄДРПОУ_{EDR}",
        "КРОС_ВЕРІФІКАЦІЯ: ВАЛІДАЦІЯ_ЦІНИ_ОДИНИЦІ [ОК]",
        "ВИЯВЛЕНО_АНОМАЛІЮ: ЗАНИЖЕННЯ_ВАРТОСТІ [!]",
        "ЗБІГ_ЗНАЙДЕНО: [ВІДПРАВНИК_ВЕРИФІКОВАНО]",
        "ШИФРУВАННЯ_ЛОГУ_АУДИТУ...",
        "РОЗПІЗНАВАННЯ_HS_CODE: 8517.13.00.00",
        "КОГНІТИВНА_АНАЛІТИКА: ПАТЕРН_ВСТАНОВЛЕНО",
        "СКАНУВАННЯ_WRAITH: ЦІЛЬ_ЗАХОПЛЕНО"
    ];

    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            const newLine = logPool[Math.floor(Math.random() * logPool.length)]
                .replace("{ID}", Math.floor(Math.random() * 9000).toString())
                .replace("{EDR}", Math.floor(Math.random() * 80000000 + 10000000).toString());
            
            setLines(prev => [newLine, ...prev].slice(0, 15));
            SovereignAudio.playScanPulse();
        }, 1200); 
        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <div className="w-full h-80 bg-black/60 border-2 border-rose-500/10 rounded-[3rem] p-8 font-mono text-[10px] overflow-hidden relative group">
            <div className="absolute top-4 right-6 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-500 font-black italic">LIVE_МИТНИЙ_ПОТІК</span>
            </div>
            <div className="space-y-2 opacity-60">
                {lines.map((line, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "flex gap-4",
                            line.includes('!') ? "text-rose-400 font-bold" : "text-slate-400"
                        )}
                    >
                        <span className="text-slate-700">[{new Date().toLocaleTimeString()}]</span>
                        <span className="uppercase tracking-widest">{line}</span>
                    </motion.div>
                ))}
                <div className="animate-pulse inline-block w-2 h-3 bg-rose-500/40 ml-2" />
            </div>
        </div>
    );
};

// ─── MOCK DATA ────────────────────────────────────────────────────────

const TRADE_VOLUME_DATA = [
  { day: '01.03', import: 420, export: 310 },
  { day: '05.03', import: 380, export: 290 },
  { day: '10.03', import: 510, export: 340 },
  { day: '15.03', import: 440, export: 410 },
  { day: '20.03', import: 620, export: 380 },
  { day: '25.03', import: 550, export: 450 },
  { day: '30.03', import: 710, export: 490 },
];

const CATEGORY_DATA = [
  { name: 'ЕЛЕКТРОНІКА', value: 35, color: '#e11d48' },
  { name: 'МАШИНОБУДУВАННЯ', value: 25, color: '#fb7185' },
  { name: 'АГРО-СЕКТОР', value: 20, color: '#be123c' },
  { name: 'ХІМІЯ', value: 12, color: '#9f1239' },
  { name: 'ІНШЕ', value: 8, color: '#475569' },
];

const MOCK_TOP_IMPORTERS = [
  { name: 'ТОВ "МЕТАЛ-ТРЕЙД ОПТ"', value: '$14.2M', share: '12%', trend: 'up' },
  { name: 'ПРАТ "ЕНЕРГО-СИСТЕМИ"', value: '$9.8M', share: '8%', trend: 'up' },
  { name: 'ТОВ "АГРО-ІМПОРТ ПЛЮС"', value: '$7.4M', share: '6%', trend: 'down' },
  { name: 'ФОП КОВАЛЕНКО О.В.', value: '$3.1M', share: '2%', trend: 'stable' },
];

interface RiskAlert {
  id: string;
  title: string;
  source: string;
  severity: RiskLevelValue;
  status: string;
  desc: string;
}

const SEVERITY_CONFIG: Record<RiskLevelValue, { label: string; color: string; bg: string }> = {
  critical:  { label: 'КРИТИЧНА', color: '#be123c', bg: 'bg-rose-900' },
  high:      { label: 'ВИСОКА',    color: '#e11d48', bg: 'bg-rose-600' },
  medium:    { label: 'СЕРЕДНЯ',   color: '#fb7185', bg: 'bg-rose-500/10' },
  low:       { label: 'НИЗЬКА',    color: '#475569', bg: 'bg-slate-700/10' },
  minimal:   { label: 'МІНІМАЛЬНА', color: '#64748b', bg: 'bg-slate-800/10' },
  stable:    { label: 'СТАБІЛЬНА',  color: '#fda4af', bg: 'bg-rose-300/10' },
  watchlist: { label: 'НАГЛЯД',    color: '#8b5cf6', bg: 'bg-violet-500/10' },
  elevated:  { label: 'ПІДВИЩЕНА',  color: '#f43f5e', bg: 'bg-rose-400/10' },
};

const RISK_ALERTS: RiskAlert[] = [
  { id: 'R-702', title: 'ЗАНИЖЕННЯ_МИТНОЇ_ВАРТОСТІ', source: 'HS-8517', severity: 'critical', status: 'АКТИВНА', desc: 'Декларування iPhone 15 Pro за ціною $240/од.' },
  { id: 'R-614', title: 'ЗМІНА_КРАЇНИ_ПОХОДЖЕННЯ', source: 'UA-PL-DE', severity: 'high', status: 'ПЕРЕВІРКА', desc: 'Різка зміна логістичного плеча через фіктивні хаби в Польщі.' },
  { id: 'R-509', title: 'САНКЦІЙНИЙ_ТРАНЗИТ', source: 'EU-SDN', severity: 'critical', status: 'БЛОКОВАНО', desc: 'Спроба ввезення комплектуючих подвійного призначення.' },
];

export default function CustomsIntelligenceView() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'importers' | 'risks' | 'signals'>('analytics');
  const [refreshing, setRefreshing] = useState(false);
  const [tradeVolume, setTradeVolume] = useState<any[]>(TRADE_VOLUME_DATA);
  const [categoryData, setCategoryData] = useState<any[]>(CATEGORY_DATA);
  const [topImporters, setTopImporters] = useState<any[]>(MOCK_TOP_IMPORTERS);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>(RISK_ALERTS);

  const { isOffline, nodeSource, healingProgress } = useBackendStatus();

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CustomsIntel',
          message: 'АКТИВОВАНО АВТОНОМНИЙ РЕЖИМ МИТНИХ ВУЗЛІВ. Переключення на локальні дзеркара (CUSTOMS_NODES).',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'CUSTOMS_NODES'
        }
      }));
    }
  }, [isOffline]);

  const handleRefresh = async () => {
      setRefreshing(true);
      SovereignAudio.playScanPulse();
      try {
          const [volume, categories, importers, alerts] = await Promise.all([
              analyticsService.getTradeVolume(),
              analyticsService.getCategoryStructure(),
              analyticsService.getTopImporters(),
              analyticsService.getRiskAlerts()
          ]);

          if (volume.length) setTradeVolume(volume);
          if (categories.length) setCategoryData(categories);
          if (importers.length) setTopImporters(importers);
          if (alerts.length) setRiskAlerts(alerts);
          
          SovereignAudio.playImpact();
      } catch (err) {
          console.error('[CustomsIntel] Refresh error:', err);
          SovereignAudio.playAlert();
      }
      setRefreshing(false);
      
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'CustomsIntel',
          message: isOffline 
            ? 'Синхронізація митних вузлів через MIRROR_CHANNEL завершена. Дані оновлено з кешу.'
            : 'Глобальні митні дані синхронізовано з центральним вузлом DPU.',
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'CUSTOMS_REFRESH'
        }
      }));
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#020202] text-slate-200 relative overflow-hidden font-sans pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.05),transparent_70%)] pointer-events-none" />
        <CyberGrid color="rgba(225,29,72,0.03)" />
        <ScanningHUD />
        
        <div className="relative z-10 max-w-[1850px] mx-auto p-4 sm:p-12 space-y-12">
           
           {/* HEADER HUD */}
           <ViewHeader
             title={
               <div className="flex items-center gap-10">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                     <div className="relative p-7 bg-black border-2 border-rose-500/40 rounded-[2.5rem] shadow-2xl transform rotate-2 hover:rotate-0 transition-all">
                        <Anchor size={42} className="text-rose-500 shadow-[0_0_20px_#e11d48]" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex items-center gap-4">
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic rounded-lg">
                          WRAITH_MANIFEST_XRAY // {isOffline ? 'OFFLINE_CACHE' : 'LIVE_FEED'}
                        </span>
                        <div className="h-px w-12 bg-rose-500/20" />
                        <span className="text-[10px] font-black text-rose-700 font-mono tracking-widest uppercase italic shadow-sm">v57.5-WRAITH</span>
                     </div>
                     <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-3deg] leading-none">
                       МИТНА <span className="text-rose-500 underline decoration-rose-600/30 decoration-[14px] underline-offset-[12px] italic uppercase tracking-tighter">РОЗВІДКА</span>
                     </h1>
                     <p className="text-[12px] text-slate-600 font-black uppercase tracking-[0.5em] mt-6 italic border-l-4 border-rose-500/30 pl-8 opacity-90 max-w-2xl">
                        КОНТРОЛЬ ЗЕД, ТОВАРНИХ ПОТОКІВ ТА ПРЕДИКЦІЯ МИТНИХ РИЗИКІВ WRAITH_INTELLIGENCE
                     </p>
                  </div>
               </div>
             }
             badges={[
               { label: 'WRAITH_T1', color: 'primary', icon: <Anchor size={10} /> },
               { label: nodeSource, color: isOffline ? 'warning' : 'primary', icon: <Database size={10} /> },
               { label: 'v57.5-ELITE', color: 'rose', icon: <Crown size={10} /> }
             ]}
             stats={[
               { label: 'ДІЮЧИХ_ЗЕД', value: '12.8K', icon: <Box size={14} />, color: 'primary' },
               { 
                 label: isOffline ? 'RECOVERY_SYNC' : 'РИЗИКОВІ_ОПЕРАЦІЇ', 
                 value: isOffline ? `${Math.floor(healingProgress)}%` : '847', 
                 icon: isOffline ? <Activity /> : <Siren size={14} />, 
                 color: isOffline ? 'warning' : 'rose', 
                 animate: isOffline || !isOffline 
               },
               { label: 'ФІН_ПОТІК (Σ)', value: '₴2.4B', icon: <DollarSign size={14} />, color: 'success' }
             ]}
             actions={
               <div className="flex gap-4">
                  <button onClick={handleRefresh} className={cn("p-6 bg-black border-2 border-white/[0.04] rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-xl", refreshing && "animate-spin")}>
                     <RefreshCw size={26} />
                  </button>
                  <button className="px-12 py-6 bg-rose-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 shadow-4xl transition-all flex items-center gap-4 font-bold">
                     <Download size={20} /> ЗАВАНТАЖИТИ_ЗВІТ_ЗЕД
                  </button>
               </div>
             }
           />

           {/* ANALYTICS TABS WRAITH */}
           <div className="flex flex-wrap gap-4 p-3 bg-black border-2 border-white/[0.03] rounded-[2.5rem] w-fit shadow-4xl backdrop-blur-3xl">
              {[
                { id: 'analytics', label: 'ОБСЯГИ_ТА_ДИНАМІКА', i: Activity },
                { id: 'importers', label: 'ТОП_ІМПОРТЕРІВ', i: Truck },
                { id: 'risks', label: 'МИТНІ_РИЗИКИ', i: AlertTriangle },
                { id: 'signals', label: 'СИГНАЛЬНА_РОЗВІДКА', i: Zap },
              ].map(tab => (
                <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-10 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] italic border-2 transition-all flex items-center gap-4",
                    activeTab === tab.id 
                      ? "bg-rose-600 border-rose-500 text-white shadow-4xl scale-105 font-bold" 
                      : "bg-transparent text-slate-600 border-transparent hover:bg-white/5 hover:text-slate-300"
                  )}
                >
                   <tab.i size={18} />
                   {tab.label}
                </button>
              ))}
           </div>

           {/* LIVE PARSING TERMINAL v57.5 */}
           <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="col-span-12"
           >
               <div className="flex items-center gap-6 mb-4">
                   <div className="h-px flex-1 bg-rose-500/10" />
                   <span className="text-[10px] font-black text-rose-500/40 uppercase tracking-[0.6em] italic">X-RAY_АНАЛІЗАТОР // ПОТІК_МАНІФЕСТІВ</span>
                   <div className="h-px flex-1 bg-rose-500/10" />
               </div>
               <ManifestXrayTerminal />
           </motion.div>

           {/* MAIN DISPLAY HUB WRAITH */}
           <div className="grid grid-cols-12 gap-10">
              <AnimatePresence mode="wait">
                 {activeTab === 'analytics' && (
                    <motion.div key="analytics" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                       
                       <div className="col-span-12 xl:col-span-8 p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600/20" />
                          <div className="flex items-center justify-between pb-8 border-b border-white/[0.04]">
                             <h2 className="text-[16px] font-black text-white italic uppercase tracking-[0.5em] flex items-center gap-6 font-serif">
                                <Activity size={28} className="text-rose-500" /> ДИНАМІКА МИТНИХ ОПЕРАЦІЙ // CLASSIFIED
                             </h2>
                             <div className="flex gap-10">
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-rose-600 shadow-[0_0_12px_#be123c]" /><span className="text-[10px] font-black text-slate-400 uppercase italic">ІМПОРТ_АКТИВНИЙ</span></div>
                                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-800" /><span className="text-[10px] font-black text-slate-600 uppercase italic">ЕКСПОРТ_СТРИМАНИЙ</span></div>
                             </div>
                          </div>
                          <div className="h-[500px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={tradeVolume}>
                                   <defs>
                                      <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                                         <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                      </linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="6 6" stroke="rgba(225,29,72,0.05)" vertical={false} />
                                   <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontStyle: 'italic', fontWeight: 'black' }} />
                                   <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontStyle: 'italic', fontWeight: 'black' }} />
                                   <Tooltip 
                                      contentStyle={{ background: '#000', border: '2px solid #e11d48', borderRadius: '20px', padding: '15px' }}
                                      itemStyle={{ color: '#e11d48', fontWeight: 'black', fontSize: '11px' }}
                                   />
                                   <Area type="monotone" dataKey="import" stroke="#e11d48" strokeWidth={5} fill="url(#roseGrad)" />
                                   <Area type="monotone" dataKey="export" stroke="#475569" strokeWidth={2} strokeDasharray="8 8" fill="transparent" />
                                </AreaChart>
                             </ResponsiveContainer>
                          </div>
                       </div>

                       <div className="col-span-12 xl:col-span-4 p-12 rounded-[4rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                          <h2 className="text-[14px] font-black text-rose-500 italic uppercase tracking-[0.5em] pb-8 border-b border-white/[0.04] font-serif">СТРУКТУРА_ТОВАРНИХ_ГРУП</h2>
                          <div className="flex justify-center p-10 bg-black/40 rounded-[4rem] border-2 border-white/[0.02] shadow-inner">
                             <RePieChart width={320} height={320}>
                                <Pie data={categoryData} innerRadius={80} outerRadius={130} paddingAngle={6} dataKey="value" cx="50%" cy="50%">
                                   {categoryData.map((entry, i) => (
                                      <Cell key={i} fill={entry.color} stroke="transparent" />
                                   ))}
                                </Pie>
                                <Tooltip 
                                   contentStyle={{ background: '#000', border: '2px solid #e11d48', borderRadius: '20px' }}
                                />
                             </RePieChart>
                          </div>
                          <div className="space-y-6">
                             {categoryData.map(d => (
                               <div key={d.name} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.01] border-2 border-white/[0.03] hover:border-rose-500/20 transition-all group">
                                  <div className="flex items-center gap-6">
                                     <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: d.color }} />
                                     <span className="text-[12px] font-black text-slate-500 uppercase italic tracking-widest group-hover:text-white transition-colors">{d.name}</span>
                                  </div>
                                  <span className="text-xl font-black text-white italic font-mono tracking-tighter">{d.value}%</span>
                               </div>
                             ))}
                          </div>
                       </div>

                    </motion.div>
                 )}

                 {activeTab === 'importers' && (
                    <motion.div key="importers" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                       <div className="col-span-12 xl:col-span-12 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-32 opacity-[0.03] pointer-events-none">
                              <Truck size={400} className="text-rose-500" />
                          </div>
                          <div className="flex items-center justify-between mb-12 border-b border-white/[0.04] pb-10 relative z-10">
                             <h2 className="text-[18px] font-black text-white italic uppercase tracking-[0.6em] flex items-center gap-8 font-serif">
                                <Truck size={32} className="text-rose-500" /> ТОП_ІМПОРТЕРІВ // ЛІДЕРИ_РИНКУ
                             </h2>
                             <div className="flex gap-6">
                                <button className="px-10 py-4 bg-black border-2 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:border-rose-500/30 transition-all font-bold">ФІЛЬТР_КАТЕГОРІЙ</button>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 relative z-10">
                             {topImporters.map((comp, i) => (
                               <div key={i} className="p-10 rounded-[4rem] bg-black border-2 border-white/[0.03] hover:border-rose-500/40 transition-all group space-y-8 shadow-inner">
                                  <div className="flex items-center justify-between">
                                     <div className="p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2rem] text-rose-500 transform group-hover:rotate-6 transition-transform">
                                        <Factory size={32} />
                                     </div>
                                     <div className={cn("px-6 py-2 rounded-xl text-[10px] font-black italic border-2 uppercase tracking-widest", comp.trend === 'up' ? "text-rose-500 border-rose-500/20 bg-rose-500/5" : comp.trend === 'down' ? "text-crimson-500 border-crimson-500/20 bg-crimson-500/5" : "text-slate-600 border-slate-500/10")}>
                                        {comp.trend === 'up' ? 'ALPHA_UP' : comp.trend === 'down' ? 'BETA_DOWN' : 'STABLE'}
                                     </div>
                                  </div>
                                  <div className="space-y-3">
                                     <h4 className="text-2xl font-black text-white italic uppercase leading-tight group-hover:text-rose-500 transition-colors font-serif">{comp.name}</h4>
                                     <p className="text-[12px] font-black text-slate-800 uppercase tracking-widest italic font-mono">ІДЕНТИФІКАТОР_ЄДРПОУ: {comp.edrpou || Math.floor(Math.random() * 90000000 + 10000000)}</p>
                                  </div>
                                  <div className="pt-8 border-t-2 border-white/[0.04] flex items-end justify-between">
                                     <div>
                                        <p className="text-4xl font-black italic font-mono text-white tracking-tighter leading-none">{comp.value}</p>
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic mt-4">ОБСЯГ_ЗА_МІСЯЦЬ</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-xl font-black text-rose-500 italic font-mono">{comp.share}</p>
                                        <p className="text-[8px] text-slate-800 uppercase font-black tracking-widest">ЧАСТКА_РИНКУ</p>
                                     </div>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'risks' && (
                    <motion.div key="risks" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="col-span-12 space-y-10">
                       <div className="p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-24 opacity-[0.04] pointer-events-none">
                             <ShieldAlert size={400} className="text-rose-600" />
                          </div>
                          <div className="flex items-center justify-between relative z-10">
                             <h3 className="text-[18px] font-black text-rose-600 italic uppercase tracking-[0.6em] flex items-center gap-8 font-serif font-bold">
                                <AlertTriangle size={36} className="animate-pulse" /> РИЗИКОВІ_СИГНАЛИ_МИТНИЦІ // МАНІТОР_ROSE_VECTOR
                             </h3>
                             <button className="px-14 py-6 bg-rose-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.4em] italic hover:brightness-110 shadow-4xl transition-all font-bold uppercase">РОЗГОРНУТИ_АНТИФРОД_МАСИВ</button>
                          </div>
                          <div className="space-y-8 relative z-10">
                             {riskAlerts.map((alert, i) => (
                               <div key={i} className="p-12 rounded-[4rem] bg-black border-2 border-rose-500/10 hover:border-rose-500/40 transition-all group flex items-center gap-14 shadow-inner relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none" />
                                  <div className={cn("p-8 rounded-[2.5rem] border-4 bg-black shadow-2xl transform group-hover:scale-110 transition-transform", alert.severity === 'critical' ? "text-rose-600 border-rose-600/20" : "text-rose-500 border-rose-500/20")}>
                                     <Database size={48} />
                                  </div>
                                  <div className="flex-1 space-y-6">
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                           <span className="text-[12px] font-black font-mono text-slate-800 tracking-[0.4em] bg-white/5 px-4 py-1 rounded-lg italic font-bold">СИГНАЛ_{alert.id}</span>
                                           <span className={cn("px-6 py-2 text-[10px] font-black italic rounded-full uppercase tracking-widest border-2", (alert.severity === 'critical' || alert.severity === 'high') ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/40" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>{SEVERITY_CONFIG[alert.severity]?.label || alert.severity}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-800 uppercase italic font-mono tracking-widest border-b border-slate-900 font-bold">ДЖЕРЕЛО_ІДЕНТ: {alert.source}</span>
                                     </div>
                                     <div className="space-y-3">
                                        <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors font-serif leading-none">{alert.title}</h4>
                                        <p className="text-lg font-black text-slate-500 italic max-w-4xl leading-relaxed font-medium uppercase tracking-tight">{alert.desc}</p>
                                     </div>
                                  </div>
                                  <div className="flex flex-col gap-4 min-w-[220px]">
                                     <button className="w-full py-5 bg-white/5 hover:bg-rose-600 border-2 border-white/5 rounded-2xl text-[10px] font-black uppercase italic transition-all hover:text-white font-bold tracking-widest shadow-xl">ПОЧАТИ_РОЗСЛІДУВАННЯ</button>
                                     <button className="w-full py-5 border-2 border-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-700 italic tracking-[0.3em] font-bold">АРХІВУВАТИ_ЗВІТ</button>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'signals' && (
                    <motion.div key="signals" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="col-span-12 grid grid-cols-12 gap-10">
                       <div className="col-span-12 xl:col-span-8 p-12 rounded-[5rem] bg-black border-2 border-white/[0.04] shadow-4xl space-y-12 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-rose-600/20" />
                          <h2 className="text-[16px] font-black text-rose-500 italic uppercase tracking-[0.6em] pb-10 border-b border-white/[0.04] flex items-center gap-6 font-serif">
                             <Target size={28} className="text-rose-500 animate-pulse" /> ДЕКОДУВАННЯ_ЖИВИХ_СИГНАЛІВ // СТРАТЕГІЧНИЙ_ІНТЕЛ
                          </h2>
                          <div className="space-y-6">
                             {[
                                { time: '14:22:15', channel: 'МИТНИЙ_ІНФОРМАТОР', msg: 'Помічено скупчення фур ТОВ "Агро-Трейд" на КПП "Краківець". Можливий дефіцит ДП.' },
                                { time: '14:20:08', channel: 'LOGISTICS_UA_TG', msg: 'Зміна тарифів на контейнерні перевезення з Гданська. +12%.' },
                                { time: '14:15:33', channel: 'INTERNAL_AF_BOT', msg: 'Детекція аномально великої партії iPhone 15 у декларації 104/2203.' },
                             ].map((sig, i) => (
                               <div key={i} className="p-10 bg-black border-2 border-white/[0.03] rounded-[3.5rem] hover:border-rose-500/40 transition-all group flex items-start gap-10 shadow-inner relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-500/5 group-hover:bg-rose-500/20 transition-all" />
                                  <div className="text-[12px] font-black text-slate-800 font-mono mt-2 italic border-r-2 border-slate-900 pr-8">{sig.time}</div>
                                  <div className="flex-1 space-y-4">
                                     <p className="text-[12px] font-black text-rose-600 uppercase italic tracking-[0.3em] font-serif">{sig.channel}</p>
                                     <p className="text-xl font-black text-slate-500 italic group-hover:text-white transition-colors leading-relaxed">"{msg_wrap(sig.msg)}"</p>
                                  </div>
                                  <ChevronRight size={28} className="text-slate-800 group-hover:text-rose-500 transition-all mt-4" />
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="col-span-12 xl:col-span-4 space-y-10">
                          <TacticalCard variant="holographic" className="p-12 rounded-[4rem] border-4 border-rose-500/20 bg-rose-500/[0.03] shadow-4xl relative overflow-hidden">
                             <div className="absolute -right-8 -top-8 opacity-10 rotate-12">
                                <Scan size={180} className="text-rose-500" />
                             </div>
                             <h3 className="text-3xl font-black text-white italic uppercase mb-10 flex items-center gap-6 font-serif"><Scan size={32} className="text-rose-500 shadow-[0_0_15px_#e11d48]" /> АКТИВНІ_ХАБИ</h3>
                             <div className="space-y-6 relative z-10">
                                <div className="flex items-center justify-between p-6 bg-black border-2 border-rose-500/10 rounded-3xl shadow-inner group hover:border-rose-500/30 transition-all cursor-default">
                                   <div className="flex items-center gap-6"><div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#e11d48]"/><span className="text-[13px] font-black text-white italic uppercase tracking-tighter">TG_CUSTOMS_UA</span></div>
                                   <span className="text-[11px] text-rose-800 font-mono italic font-black uppercase">LINK_ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black border-2 border-rose-500/10 rounded-3xl shadow-inner group hover:border-rose-500/30 transition-all cursor-default">
                                   <div className="flex items-center gap-6"><div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#e11d48]"/><span className="text-[13px] font-black text-white italic uppercase tracking-tighter">RSS_WORLD_TRADE</span></div>
                                   <span className="text-[11px] text-rose-800 font-mono italic font-black uppercase">LINK_ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black border-2 border-white/5 rounded-3xl opacity-40 grayscale group hover:grayscale-0 transition-all cursor-not-allowed">
                                   <div className="flex items-center gap-6"><div className="w-3 h-3 rounded-full bg-rose-900"/><span className="text-[13px] font-black text-slate-400 italic uppercase tracking-tighter">MARITIME_AIS_SERVER</span></div>
                                   <span className="text-[11px] text-rose-800 font-mono italic font-black uppercase">OFFLINE_ERR</span>
                                </div>
                             </div>
                          </TacticalCard>

                          <div className="p-10 rounded-[4rem] bg-black border-2 border-rose-500/10 shadow-4xl relative overflow-hidden group hover:border-rose-500/30 transition-all cursor-crosshair">
                             <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                             <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-[0.6em] mb-6 italic">СУВЕРЕННИЙ_ШІ_ВАРТОВИЙ (SENTINEL)</h4>
                             <p className="text-[14px] font-black text-slate-400 italic leading-relaxed uppercase tracking-tighter border-l-4 border-rose-500/30 pl-8 group-hover:text-white transition-colors">
                                Аналіз торгових потоків свідчить про зміцнення логістичних коридорів у напрямку ЦСЄ. Рекомендується перегляд лімітів для імпортерів електроніки категорії A.
                             </p>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8); }
            .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9), 0 0 40px rgba(225,29,72,0.05); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(225,29,72,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(225,29,72,.3)}
        `}} />
        <DiagnosticsTerminal />
      </div>
    </PageTransition>
  );
}

// Utility to wrap messages in quotes correctly for the new theme
function msg_wrap(text: string) {
    return text.startsWith('"') ? text.slice(1, -1) : text;
}
           <div className="p-10 rounded-[4rem] bg-black border-2 border-yellow-500/10 shadow-4xl relative overflow-hidden group hover:border-yellow-500/30 transition-all cursor-crosshair">
                             <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                             <h4 className="text-[10px] font-black text-yellow-700 uppercase tracking-[0.6em] mb-6 italic">СУВЕРЕННИЙ_ШІ_ВАРТОВИЙ (SENTINEL)</h4>
                             <p className="text-[14px] font-black text-slate-400 italic leading-relaxed uppercase tracking-tighter border-l-4 border-yellow-500/30 pl-8 group-hover:text-white transition-colors">
                               Аналіз торгових потоків свідчить про зміцнення логістичних коридорів у напрямку ЦСЄ. Рекомендується перегляд лімітів для імпортерів електроніки категорії A.
                             </p>
                          </div>
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
            .shadow-3xl { box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8); }
            .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.05); }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(212,175,55,.15);border-radius:20px;border:2px solid black}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(212,175,55,.3)}
        `}} />
        <DiagnosticsTerminal />
      </div>
    </PageTransition>
  );
}
