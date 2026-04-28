/**
 * Студія датасетів (v60.0-ELITE).
 *
 * Керування даними для навчання ШІ-моделей та OSINT-аналітики.
 *  обочий контур без симуляції.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Server, RefreshCw, CheckCircle2, AlertTriangle, 
  Search, Filter, Play, Plus, Trash2, Download, Table,
  Activity, BarChart3, Binary, HardDrive, ShieldCheck, Box
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { PageTransition } from '@/components/layout/PageTransition';

const DatasetsStudioView = () => {
  const { isOffline, nodeSource } = useBackendStatus();
  const [activeTab, setActiveTab] = useState<'sources' | 'cleaning' | 'annotation' | 'quality'>('sources');

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('predator-error', {
      detail: {
        service: 'Datasets_Studio',
        message: isOffline 
          ? 'ДАТАСЕТ-ЦЕНТ : РЕЖИМ ЛОКАЛЬНОГО КЕШУ (DATA_OFFLINE).' 
          : 'СИНХ ОНІЗАЦІЯ ДАТАСЕТІВ: NVIDIA-GRID ACTIVE.',
        severity: isOffline ? 'warning' : 'info',
        timestamp: new Date().toISOString(),
        code: isOffline ? 'DATA_OFFLINE' : 'DATA_SUCCESS'
      }
    }));
  }, [isOffline]);

  const stats = [
    { label: 'ЗАГАЛЬНИЙ_ОБСЯГ', value: '4.2 TB', icon: <Database size={14} />, color: 'primary' },
    { label: 'КІЛЬКІСТЬ_ЗАПИСІВ', value: '1.8B+', icon: <Table size={14} />, color: 'success' },
    { label: 'ЦІЛІСНІСТЬ_ДАНИХ', value: '98.4%', icon: <ShieldCheck size={14} />, color: 'warning' }
  ];

  const datasets = [
    { id: 'DS-001', name: 'Митні декларації 2024-2026', source: 'ДМСУ (API)', size: '1.2 GB', status: 'АКТИВНО', quality: 99 },
    { id: 'DS-002', name: 'Реєстр бенефіціарів (EDR)', source: 'МінЮст', size: '450 MB', status: 'МОНІТО ИНГ', quality: 94 },
    { id: 'DS-003', name: 'Судові рішення OSINT', source: 'Crawler-v4', size: '2.8 GB', status: 'ОБ ОБКА', quality: 87 },
    { id: 'DS-004', name: 'Санкційні списки OFAC/ЄС', source: 'Global Sync', size: '12 MB', status: 'АКТИВНО', quality: 100 },
  ];

  return (
    <PageTransition>
      <div className="relative min-h-full bg-[#050202] p-8 lg:p-12 overflow-hidden selection:bg-rose-500/30">
        <CyberGrid opacity={0.04} />
        
        {/* Tactical Overlays */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-rose-500/[0.02] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/[0.01] blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-[1800px] mx-auto space-y-10">
          {/* View Header */}
          <ViewHeader 
            title={(
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-sm flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                      <Database size={28} className="text-rose-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-4xl font-black tracking-[0.2em] uppercase italic text-white/90">
                      СТУДІЯ <span className="text-rose-500">ДАТАСЕТІВ</span>
                    </h1>
                    <div className="flex items-center gap-3 text-[9px] font-mono font-black tracking-[0.4em] text-white/20 uppercase mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      ГЛОБАЛЬНИЙ  ЕПОЗИТО ІЙ ДАНИХ [OSINT_GRID]
                    </div>
                  </div>
                </div>
              </div>
            )}
            stats={[
              { label: 'ДЖЕРЕЛО_ВУЗЛА', value: nodeSource, icon: <Server size={14} />, color: isOffline ? 'danger' : 'success' },
              { label: 'СТАН_СИНХ ОНІЗАЦІЇ', value: isOffline ? 'АВТОНОМНО' : 'СТАБІЛЬНО', icon: <RefreshCw size={14} />, color: isOffline ? 'warning' : 'success' }
            ]}
            breadcrumbs={['PREDATOR', 'ФАБ ИКА_ДАНИХ', 'ДАТАСЕТИ']}
          />

          {/* Global Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map(s => (
              <TacticalCard key={s.label} variant="holographic" className="bg-black/40 border-white/5 group hover:border-rose-500/20 transition-all duration-500">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-rose-500/5 rounded-sm text-rose-500 border border-rose-500/10 group-hover:bg-rose-500/10 transition-colors">
                      {s.icon}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[8px] font-mono font-black text-white/20 uppercase tracking-[0.2em]">{s.label}</p>
                      <h3 className="text-2xl font-black text-white italic tracking-tight">{s.value}</h3>
                    </div>
                 </div>
              </TacticalCard>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div className="col-span-12 lg:col-span-3 space-y-4">
              <TacticalCard variant="holographic" title="МОДУЛІ_СТУДІЇ" className="bg-black/40 border-white/5">
                <div className="space-y-2 mt-4">
                  {[
                    { id: 'sources', label: 'Джерела Даних', icon: Server, desc: 'Зовнішні API та DB канали' },
                    { id: 'cleaning', label: 'Конвеєри ETL', icon: RefreshCw, desc: 'Очистка та Нормалізація' },
                    { id: 'annotation', label: 'Анотація', icon: AlertTriangle, desc: 'Маркування та Тегування' },
                    { id: 'quality', label: 'Аудит Якості', icon: ShieldCheck, desc: 'Валідація цілісності' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "w-full flex flex-col items-start gap-1 p-4 rounded-sm border transition-all duration-500 group relative overflow-hidden",
                        activeTab === tab.id 
                          ? "bg-rose-500/10 border-rose-500/30 text-white shadow-[0_0_20px_rgba(225,29,72,0.1)]" 
                          : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon size={14} className={cn(activeTab === tab.id ? "text-rose-500" : "text-white/20")} />
                        <span className="text-[11px] font-black uppercase tracking-widest italic">{tab.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-white/20 ml-6 lowercase">{tab.desc}</span>
                      
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="activeTabGlow"
                          className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.05] to-transparent pointer-events-none" 
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                   <Button variant="outline" className="w-full h-12 rounded-sm border-dashed border-white/10 text-white/40 hover:text-rose-500 hover:border-rose-500/30 font-black tracking-widest text-[10px] uppercase italic">
                      <Plus size={14} className="mr-2" /> СТВО ИТИ_НОВИЙ_ДАТАСЕТ
                   </Button>
                   <Button variant="outline" className="w-full h-12 rounded-sm border-white/5 bg-white/[0.02] text-white/20 hover:text-white font-black tracking-widest text-[10px] uppercase italic">
                      <Download size={14} className="mr-2" /> ЕКСПОРТ_ГЛОБАЛЬНОГО_ІНДЕКСУ
                   </Button>
                </div>
              </TacticalCard>

              <TacticalCard variant="holographic" title="ЗДОРОВ'Я_СХОВИЩА" className="bg-black/40 border-white/5">
                <div className="mt-4 space-y-4">
                   <div className="flex justify-between text-[8px] font-mono font-black text-white/20 tracking-widest uppercase">
                      <span>NVMe_POOL_X1</span>
                      <span className="text-rose-500">84%</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[84%] shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                   </div>
                   <p className="text-[9px] font-mono text-white/30 italic">IOPS: 420K | ЗАТ ИМКА: 0.12ms</p>
                </div>
              </TacticalCard>
            </div>

            {/* Main Content Area */}
            <div className="col-span-12 lg:col-span-9 space-y-8">
              <TacticalCard variant="cyber" className="bg-black/40 border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <Binary size={180} />
                 </div>

                 <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10 relative z-10">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[14px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 italic">
                         <Box size={18} className="text-rose-500" /> 
                         {activeTab === 'sources' && 'АКТИВНІ_ПОТОКИ_ДАНИХ'}
                         {activeTab === 'cleaning' && 'КОНВЕЄ _ОЧИСТКИ_ETL'}
                         {activeTab === 'annotation' && 'МЕНЕДЖЕР _НЕЙ ОННОЇ_АНОТАЦІЇ'}
                         {activeTab === 'quality' && 'АНАЛІТИКА_ЯКОСТІ_ДАНИХ'}
                      </h3>
                      <div className="h-0.5 w-24 bg-rose-500/40" />
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className="relative group">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-hover:text-rose-500 transition-colors" />
                          <input 
                            type="text" 
                            placeholder="ПОШУК_ПО_ ЕПОЗИТО ІЮ..." 
                            className="bg-black/60 border border-white/10 rounded-sm pl-10 pr-4 py-2 text-[10px] text-white/80 outline-none focus:border-rose-500/50 transition-all w-64 font-mono tracking-widest placeholder:text-white/10"
                          />
                       </div>
                       <Button size="icon" variant="ghost" className="rounded-sm h-10 w-10 text-white/20 hover:text-rose-500 border border-white/5 hover:border-rose-500/20 bg-white/[0.02]">
                          <Filter size={14} />
                       </Button>
                    </div>
                 </div>

                 <div className="overflow-x-auto custom-scrollbar relative z-10">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-white/5">
                             <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">UUID_ДАТАСЕТУ</th>
                             <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">ДЖЕРЕЛО_ПОТОКУ</th>
                             <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">ВИДІЛЕНИЙ_ОБСЯГ</th>
                             <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">ЦІЛІСНІСТЬ</th>
                             <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] italic">СТАТУС</th>
                             <th className="pb-4 text-right"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {datasets.map(ds => (
                             <tr key={ds.id} className="group hover:bg-white/[0.01] transition-all duration-300">
                                <td className="py-6">
                                   <div className="flex flex-col gap-1">
                                      <span className="text-[12px] font-black text-white/80 group-hover:text-rose-400 transition-colors uppercase tracking-tight italic">{ds.name}</span>
                                      <span className="text-[8px] text-white/10 font-mono tracking-widest">{ds.id}</span>
                                   </div>
                                </td>
                                <td className="py-6">
                                   <Badge className="bg-white/5 border-white/10 rounded-none text-[9px] font-black tracking-widest text-white/40 uppercase">
                                      {ds.source}
                                   </Badge>
                                </td>
                                <td className="py-6">
                                   <span className="text-[11px] text-white/60 font-mono italic tracking-tighter">{ds.size}</span>
                                </td>
                                <td className="py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden p-[1px]">
                                         <motion.div 
                                           initial={{ width: 0 }}
                                           animate={{ width: `${ds.quality}%` }}
                                           className="h-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)]" 
                                         />
                                      </div>
                                      <span className="text-[10px] font-black text-rose-500 font-mono italic">{ds.quality}%</span>
                                   </div>
                                </td>
                                <td className="py-6">
                                   <div className="flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                                        ds.status === 'АКТИВНО' ? "bg-emerald-500" : ds.status === 'МОНІТО ИНГ' ? "bg-amber-500" : "bg-rose-500"
                                      )} />
                                      <span className="text-[9px] font-black tracking-[0.2em] text-white/60 uppercase">
                                        {ds.status}
                                      </span>
                                   </div>
                                </td>
                                <td className="py-6 text-right">
                                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-sm text-white/20 hover:text-rose-500 border border-white/5 hover:border-rose-500/20 bg-white/[0.02]">
                                         <Play size={12} fill="currentColor" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-sm text-white/20 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 bg-white/[0.02]">
                                         <Download size={12} />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-sm text-white/20 hover:text-rose-400 border border-white/5 hover:border-rose-400/20 bg-white/[0.02]">
                                         <Trash2 size={12} />
                                      </Button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </TacticalCard>

              {/* Training Connection Callout */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 rounded-sm bg-gradient-to-r from-rose-950/40 via-black to-black border border-rose-500/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                    <Activity size={100} className="text-rose-500" />
                 </div>
                 
                 <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-sm bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                      <RefreshCw className="animate-spin-slow h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-[18px] font-black text-white uppercase tracking-[0.2em] mb-2 italic">Neural_Link ГОТОВИЙ</h4>
                      <p className="text-[11px] text-white/30 uppercase tracking-[0.1em] font-mono leading-relaxed max-w-lg">
                        Оберіть оптимізований датасет для запуску розширених циклів навчання. Синхронізуйте з кластером MIRROR_VRAM для максимальної точності.
                      </p>
                    </div>
                 </div>
                 
                 <Button className="h-14 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-sm px-12 shadow-[0_0_30px_rgba(225,29,72,0.3)] hover:shadow-[0_0_50px_rgba(225,29,72,0.5)] transition-all duration-500 border-none relative z-10">
                   ЗАПУСТИТИ_ЦИКЛ_НАВЧАННЯ
                 </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Corner Brackets */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-white/5 pointer-events-none" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t border-r border-white/5 pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b border-l border-white/5 pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-white/5 pointer-events-none" />
      </div>
    </PageTransition>
  );
};

export default DatasetsStudioView;
