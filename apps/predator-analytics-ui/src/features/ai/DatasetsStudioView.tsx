import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, Server, RefreshCw, CheckCircle2, AlertTriangle, 
  Search, Filter, Play, Plus, Trash2, Download, Table
} from 'lucide-react';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const DatasetsStudioView = () => {
  const [activeTab, setActiveTab] = useState<'sources' | 'cleaning' | 'annotation' | 'quality'>('sources');

  const stats = [
    { label: 'Загальний об’єм', value: '4.2 TB', icon: <Database />, color: 'primary' },
    { label: 'Кількість записів', value: '1.8B+', icon: <Table />, color: 'success' },
    { label: 'Якість даних', value: '98.4%', icon: <CheckCircle2 />, color: 'warning' }
  ];

  const datasets = [
    { id: 'DS-001', name: 'Митні декларації 2024-2026', source: 'ДМСУ (API)', size: '1.2 GB', status: 'АКТИВНО', quality: 99 },
    { id: 'DS-002', name: 'Реєстр бенефіціарів (EDR)', source: 'МінЮст', size: '450 MB', status: 'МОНІТОРИНГ', quality: 94 },
    { id: 'DS-003', name: 'Судові рішення OSINT', source: 'Crawler-v4', size: '2.8 GB', status: 'ОБРОБКА', quality: 87 },
    { id: 'DS-004', name: 'Санкційні списки OFAC/ЄС', source: 'Global Sync', size: '12 MB', status: 'АКТИВНО', quality: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-20">
      <AdvancedBackground />
      
      <ViewHeader 
        title="СТУДІЯ ДАТАСЕТІВ v55"
        subtitle="Керування даними для навчання ШІ-моделей та OSINT-аналітики"
        icon={<Database size={24} className="text-cyan-400" />}
        breadcrumbs={['ПРЕДАТОР', 'ЗАВОД', 'ДАТАСЕТИ']}
        stats={[
          { label: 'Джерела', value: '14 ACTIVE', icon: <Server size={14} />, color: 'success' },
          { label: 'Sync Status', value: 'OPTIMAL', icon: <RefreshCw size={14} />, color: 'primary' }
        ]}
      />

      <div className="max-w-[1600px] mx-auto px-6 mt-8 space-y-8 relative z-10">
        {/* Global Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(s => (
            <TacticalCard key={s.label} variant="holographic" className="p-6">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl text-cyan-400 border border-white/10">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-white italic">{s.value}</h3>
                  </div>
               </div>
            </TacticalCard>
          ))}
        </div>

        {/* Studio Controls */}
        <div className="flex flex-col lg:flex-row gap-8">
           {/* Sidebar-Tabs */}
           <div className="w-full lg:w-64 shrink-0 space-y-2">
              {[
                { id: 'sources', label: 'Джерела Даних', icon: Server },
                { id: 'cleaning', label: 'Очищення та ETL', icon: RefreshCw },
                { id: 'annotation', label: 'Анотації', icon: AlertTriangle },
                { id: 'quality', label: 'Якість та Аудит', icon: CheckCircle2 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-[11px] font-black uppercase tracking-wider",
                    activeTab === tab.id 
                      ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                      : "bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                  )}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
              
              <div className="pt-4 border-t border-white/5">
                <Button variant="outline" className="w-full justify-start gap-2 border-dashed border-white/10 text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-500/30">
                  <Plus size={14} /> НОВИЙ ДАТАСЕТ
                </Button>
              </div>
           </div>

           {/* Main Body */}
           <div className="flex-1 min-w-0 space-y-6">
              <TacticalCard variant="cyber" className="p-8">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                       <Database size={16} className="text-cyan-400" /> 
                       {activeTab === 'sources' && 'РЕЄСТР АКТИВНИХ ДЖЕРЕЛ'}
                       {activeTab === 'cleaning' && 'КОНВЕЄР ОЧИЩЕННЯ (ETL)'}
                       {activeTab === 'annotation' && 'МЕНЕДЖЕР АНОТАЦІЙ'}
                       {activeTab === 'quality' && 'АНАЛІТИКА ЯКОСТІ ДАНИХ'}
                    </h3>
                    
                    <div className="flex items-center gap-3">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Пошук датасетів..." 
                            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-[11px] text-white outline-none focus:border-cyan-500 transition-all w-48 font-mono"
                          />
                       </div>
                       <Button size="icon" variant="ghost" className="rounded-lg h-8 w-8 text-slate-500 hover:text-cyan-400">
                          <Filter size={14} />
                       </Button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b border-white/5">
                             <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">ID / Назва</th>
                             <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Джерело</th>
                             <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Об'єм</th>
                             <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Якість</th>
                             <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Статус</th>
                             <th className="pb-4 text-right"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {datasets.map(ds => (
                             <tr key={ds.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="py-4">
                                   <div className="flex flex-col">
                                      <span className="text-[12px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase">{ds.name}</span>
                                      <span className="text-[9px] text-slate-600 font-mono tracking-tighter">{ds.id}</span>
                                   </div>
                                </td>
                                <td className="py-4">
                                   <span className="text-[11px] text-slate-400 uppercase font-bold">{ds.source}</span>
                                </td>
                                <td className="py-4">
                                   <span className="text-[11px] text-slate-300 font-mono italic">{ds.size}</span>
                                </td>
                                <td className="py-4">
                                   <div className="flex items-center gap-2">
                                      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                         <div 
                                           className="h-full bg-cyan-600 rounded-full" 
                                           style={{ width: `${ds.quality}%`, backgroundColor: ds.quality > 95 ? '#06b6d4' : ds.quality > 90 ? '#8b5cf6' : '#f59e0b' }} 
                                         />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-500">{ds.quality}%</span>
                                   </div>
                                </td>
                                <td className="py-4">
                                   <Badge variant={ds.status === 'АКТИВНО' ? 'success' : ds.status === 'МОНІТОРИНГ' ? 'secondary' : 'warning'} className="text-[8px] font-black tracking-widest">
                                      {ds.status}
                                   </Badge>
                                </td>
                                <td className="py-4 text-right">
                                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-slate-500 hover:text-cyan-400">
                                         <Play size={12} />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-slate-500 hover:text-emerald-400">
                                         <Download size={12} />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-slate-500 hover:text-rose-400">
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

              {/* Training Connection */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-900/20 to-indigo-900/20 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <RefreshCw className="animate-spin-slow h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-1 italic">Готові до навчання?</h4>
                      <p className="text-[11px] text-slate-400 uppercase tracking-tighter">Синхронізуйте обраний датасет зі Студією Тренування Моделей.</p>
                    </div>
                 </div>
                 <Button className="bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl px-10 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                   ПЕРЕЙТИ ДО ТРЕНУВАННЯ
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetsStudioView;
