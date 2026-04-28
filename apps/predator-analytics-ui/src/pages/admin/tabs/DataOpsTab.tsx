import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Upload, Factory, Layers, TrendingUp, Loader2, Zap, Activity, HardDrive, Shield, Orbit, Atom, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataOpsStatus } from '@/hooks/useAdminApi';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

/**
 * 🗄️ DATA OPS HUB | v61.0-ELITE
 * Управління_даними_та_потокова_аналітика: Оберт даних у PREDATOR_LAKE.
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface KafkaTopic {
  name: string;
  partitions: number;
  lag: number;
  throughput: string;
  consumers: number;
  status: 'ok' | 'warn' | 'error';
}

interface DatasetRecord {
  id: string;
  name: string;
  type: string;
  records: number;
  sizeGb: number;
  version: string;
  status: 'ready' | 'training' | 'outdated' | 'draft';
  updatedAt: string;
}

interface FactoryModule {
  id: string;
  name: string;
  template: string;
  status: 'deployed' | 'pending' | 'failed' | 'draft';
  createdBy: string;
  createdAt: string;
}

// ─── Колонки ──────────────────────────────────────────────────────────────────

const kafkaCols: VirtualColumn<KafkaTopic>[] = [
  { key: 'name',       label: 'ТОПІК',          mono: true },
  { key: 'partitions', label: 'ПА Т.', width: '65px',  mono: true, align: 'right' },
  {
    key: 'lag',        label: 'ЛАГ',   width: '100px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn('font-black italic glint-elite', n > 5000 ? 'text-rose-500' : n > 500 ? 'text-amber-500' : 'text-emerald-500/80')}>{n.toLocaleString()}</span>;
    },
  },
  { key: 'throughput', label: 'Т АФІК',  width: '110px', mono: true, render: (v) => <span className="text-white/60 font-black italic">{String(v)}</span> },
  { key: 'consumers',  label: 'КОНС.',   width: '65px', mono: true, align: 'right' },
  {
    key: 'status',     label: 'СТАТУС',  width: '90px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ok: 'text-rose-500 shadow-rose-500/20', warn: 'text-amber-500 shadow-amber-500/20', error: 'text-rose-600 shadow-rose-600/20' };
      const labelMap: Record<string, string> = { ok: 'ОК_L7', warn: 'УВАГА', error: 'ЗБІЙ' };
      return <span className={cn('text-[10px] font-mono font-black italic tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-lg', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
];

const getKafkaStatus = (row: KafkaTopic): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

const datasetCols: VirtualColumn<DatasetRecord>[] = [
  { key: 'name',      label: 'ДАТАСЕТ',  mono: true },
  { key: 'type',      label: 'ТИП_ДАТА',  width: '140px', mono: true, render: (v) => <span className="text-white/40 italic font-black uppercase tracking-tight">{String(v)}</span> },
  { key: 'records',   label: 'ЗАПИСІВ',  width: '120px', mono: true, align: 'right', render: (v) => <span className="font-black italic glint-elite">{Number(v).toLocaleString()}</span> },
  { key: 'sizeGb',    label: 'ГБ',       width: '80px',  mono: true, align: 'right', render: (v) => <span className="text-rose-500/60 font-black italic">{Number(v).toFixed(1)}</span> },
  { key: 'version',   label: 'ВЕРСІЯ',   width: '90px',  mono: true, render: (v) => <span className="text-white/20 font-black italic">v{String(v)}</span> },
  {
    key: 'status',    label: 'СТАТУС',   width: '110px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ready: 'text-rose-500', training: 'text-rose-400', outdated: 'text-amber-400', draft: 'text-white/30' };
      const labelMap: Record<string, string> = { ready: 'ГОТОВО', training: 'НАВЧАННЯ', outdated: 'ЗАСТА ІЛО', draft: 'ЧЕ НЕТКА' };
      return <span className={cn('text-[10px] font-mono font-black italic tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-lg', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
  { key: 'updatedAt', label: 'ОНОВЛЕНО', width: '120px', mono: true, render: (v) => <span className="text-white/30 italic">{String(v)}</span> },
];

const getDatasetStatus = (row: DatasetRecord): RowStatus =>
  row.status === 'ready'    ? 'ok' :
  row.status === 'training' ? 'info' :
  row.status === 'outdated' ? 'warning' : 'neutral';

const moduleCols: VirtualColumn<FactoryModule>[] = [
  { key: 'name',      label: 'МОДУЛЬ',    mono: true },
  { key: 'template',  label: 'ШАБЛОН_КОНВЕЄ А',    width: '220px', mono: true, render: (v) => <span className="text-white/35 text-[10px] italic font-black uppercase tracking-tight">{String(v)}</span> },
  {
    key: 'status',    label: 'СТАТУС',    width: '110px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { deployed: 'text-rose-500', pending: 'text-rose-400/70', failed: 'text-rose-600', draft: 'text-white/30' };
      const labelMap: Record<string, string> = { deployed: 'АКТИВНО', pending: 'ОЧІКУВАННЯ', failed: 'ПОМИЛКА', draft: 'ЧЕ НЕТКА' };
      return <span className={cn('text-[10px] font-mono font-black italic tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-lg', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
  { key: 'createdBy', label: 'АВТО ',     width: '120px',  mono: true, render: (v) => <span className="text-white/40 italic uppercase">{String(v)}</span> },
  { key: 'createdAt', label: 'ДАТА_СТВ.',      width: '120px',  mono: true, render: (v) => <span className="text-white/20 italic">{String(v)}</span> },
];

const getModuleStatus = (row: FactoryModule): RowStatus =>
  row.status === 'deployed' ? 'ok' :
  row.status === 'pending'  ? 'info' :
  row.status === 'failed'   ? 'danger' : 'neutral';

// ─── Вкладка ─────────────────────────────────────────────────────────────────

type DataOpsSection = 'kafka' | 'datasets' | 'factory';

export const DataOpsTab: React.FC = () => {
  const { data, isLoading, isError } = useDataOpsStatus();
  const [section, setSection] = useState<DataOpsSection>('kafka');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] text-white/30 space-y-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-rose-500/10 rounded-full border-t-rose-500 shadow-[0_0_40px_rgba(225,29,72,0.3)]"
          />
          <Database className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-4">
           <div className="text-[14px] font-mono uppercase tracking-[0.8em] animate-pulse italic font-black text-rose-500 glint-elite">ІНТЕ ОПЕ АБЕЛЬНІСТЬ_ДАНИХ...</div>
           <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 italic">LAKE_CONTROLLER_v61_SYNCING</div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] p-24 text-center glass-wraith m-12 border-2 border-rose-600/20 rounded-[4rem] relative overflow-hidden shadow-4xl">
        <div className="absolute inset-0 bg-rose-900/5 blur-[150px] pointer-events-none" />
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
        <Database size={80} className="text-rose-600/40 mb-12 animate-pulse" />
        <div className="text-4xl font-black uppercase tracking-[0.3em] text-white mb-6 glint-elite chromatic-elite italic">К ИТИЧНИЙ_ЗБІЙ_ДАТА_КОНВЕЄ А</div>
        <p className="text-[14px] font-black text-white/30 max-w-2xl mb-16 leading-relaxed uppercase italic tracking-widest">
          СИСТЕМА НЕ ЗМОГЛА ОТ ИМАТИ СТАН ВУЗЛІВ ОБ ОБКИ. <br/>
          ПЕ ЕВІ ТЕ З'ЄДНАННЯ З КОНТ ОЛЕ ОМ ДАНИХ <span className="text-rose-500">PREDATOR_LAKE_MASTER_L7</span>.
        </p>
        <button 
           onClick={() => window.location.reload()}
           className="px-16 py-7 bg-rose-600 text-white text-[12px] font-black uppercase tracking-[0.6em] rounded-[2rem] hover:bg-rose-500 transition-all shadow-4xl italic border-2 border-rose-400/50"
        >
          ПОВТО ИТИ_ЗАПИТ_СИНХ ОНІЗАЦІЇ
        </button>
      </div>
    );
  }

  const { kafkaTopics, datasets, factoryModules } = data;

  const tabs = [
    { id: 'kafka'    as const, label: `ШИНА_ПОДІЙ_KAFKA`,   count: kafkaTopics.length,    icon: Upload },
    { id: 'datasets' as const, label: `СХОВИЩА_ ЕЄСТ ІВ`,    count: datasets.length,       icon: Layers },
    { id: 'factory'  as const, label: `ДАТА_ФАБ ИКА_Ω`, count: factoryModules.length, icon: Factory },
  ];

  const totalThroughput = kafkaTopics.reduce((s, t) => {
    const val = parseFloat(t.throughput) || 0;
    const unit = t.throughput.toUpperCase().includes('GB') ? 1024 : t.throughput.toUpperCase().includes('KB') ? 1/1024 : 1;
    return s + (val * unit);
  }, 0);

  return (
    <div className="p-16 space-y-20 max-w-[1800px] mx-auto relative pb-40">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 border-l-4 border-rose-600 pl-14 py-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-rose-500/5 blur-[60px] -translate-x-full group-hover:translate-x-full transition-transform duration-[2000ms] pointer-events-none" />
        <div className="space-y-5">
           <div className="flex items-center gap-8">
             <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic glint-elite chromatic-elite leading-tight">
               УП АВЛІННЯ ДАНИМИ & <span className="text-rose-500">ПОТОКОВА АНАЛІТИКА</span>
             </h2>
             <div className="px-5 py-1.5 bg-rose-600/10 border-2 border-rose-600/30 rounded-xl text-[11px] font-black text-rose-500 tracking-[0.4em] uppercase italic shadow-2xl">
               ELITE_DATA_v61.0
             </div>
           </div>
           <div className="flex items-center gap-10 text-[12px] font-black font-mono text-white/30 tracking-[0.3em] uppercase italic">
             <div className="flex items-center gap-4">
               <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
               <span className="text-emerald-500/80">СИСТЕМА_Т АНСПОРТУ_АКТИВНА_L7</span>
             </div>
             <span className="opacity-20">|</span>
             <div className="flex items-center gap-4">
               <Zap size={18} className="text-amber-500 animate-pulse" />
               <span className="text-white/60">ШВИДКІСТЬ_ПОТОКУ: <span className="text-white font-black">{totalThroughput.toFixed(1)} МБ/с</span></span>
             </div>
             <span className="opacity-20">|</span>
             <div className="flex items-center gap-4 text-rose-500/40">
               <Shield size={18} className="glint-elite" />
               <span>А ХІТЕКТУ А: PREDATOR_DATA_LAKE_v2_ELITE</span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="p-4 bg-rose-600/10 border-2 border-rose-600/20 rounded-[2rem] shadow-4xl group/icon hover:border-rose-500/40 transition-all duration-700">
              <Orbit size={48} className="text-rose-500 animate-spin-slow" style={{ animationDuration: '20s' }} />
           </div>
        </div>
      </div>

      {/* Метрики-шапка */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {[
          { label: 'КАНАЛИ_ПОДІЙ_KAFKA', value: kafkaTopics.length, color: 'text-white/90', sub: 'АКТИВНІ_ТОПІКИ_ОБ ОБКИ', icon: Upload },
          { label: 'ЗАГАЛЬНА_ЧЕ ГА', value: kafkaTopics.reduce((s,t)=>s+t.lag,0).toLocaleString(), color: 'text-rose-500', sub: 'ЗАПИСІВ_У_ЧЕ ЗІ_ОЧІКУВАННЯ', icon: Activity },
          { label: ' ЕПОЗИТО ІЇ_ДАТА_ЛЕЙК', value: datasets.filter(d=>d.status==='ready').length, color: 'text-rose-400', sub: 'ВЕ ИФІКОВАНІ_ДАТАСЕТИ_SSOT', icon: HardDrive },
          { label: 'АКТИВНІ_ФАБ ИКАТИ',  value: factoryModules.filter(m=>m.status==='deployed').length, color: 'text-white/90', sub: 'П ОЦЕСИ_ФАБ ИКИ_Ω', icon: Factory },
        ].map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
            className="glass-wraith border-2 border-white/5 p-12 rounded-[3.5rem] group hover:border-rose-500/40 transition-all duration-1000 relative overflow-hidden shadow-4xl hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            <div className="absolute top-8 right-10 opacity-5 group-hover:opacity-25 transition-all duration-1000 transform group-hover:scale-125">
               <m.icon size={80} className="text-rose-500" />
            </div>
            <div className="text-[11px] font-black font-mono text-white/20 uppercase tracking-[0.5em] mb-6 italic group-hover:text-rose-500/40 transition-colors duration-700">{m.label}</div>
            <div className={cn('text-6xl font-black tracking-tighter italic leading-none glint-elite', m.color)}>{m.value}</div>
            <div className="text-[10px] font-black font-mono text-white/10 mt-10 uppercase tracking-[0.4em] font-bold group-hover:text-rose-500/60 transition-colors italic border-l-2 border-white/5 pl-4">{m.sub}</div>
            <div className="absolute bottom-8 right-10 w-12 h-[2px] bg-white/5 group-hover:bg-rose-500/60 transition-colors duration-700" />
          </motion.div>
        ))}
      </div>

      {/* Internal Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-col items-start gap-6 px-12 py-10 rounded-[3rem] transition-all duration-1000 relative overflow-hidden group shadow-4xl border-2',
                active
                  ? 'bg-rose-600/10 border-rose-500/40 shadow-rose-500/20 scale-[1.03]'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-white/30 hover:text-white/60',
              )}
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="flex items-center gap-8 w-full">
                <div className={cn(
                   'p-6 rounded-[1.8rem] transition-all duration-1000 transform group-hover:rotate-6',
                   active ? 'bg-rose-600 text-white shadow-[0_0_40px_rgba(225,29,72,0.6)]' : 'bg-white/5 text-white/20 group-hover:text-white/40'
                )}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1 text-left space-y-2">
                   <div className={cn('text-[18px] font-black uppercase tracking-[0.4em] italic leading-tight', active ? 'text-white glint-elite' : 'text-white/40 group-hover:text-white/60')}>
                     {t.label}
                   </div>
                   <div className="text-[11px] font-black font-mono text-white/10 uppercase tracking-[0.3em] italic group-hover:text-rose-500/20 transition-colors">{t.count} ОБ'ЄКТІВ_ЯД А</div>
                </div>
                {active && (
                   <motion.div 
                     layoutId="data-tab-indicator-v61"
                     className="w-2 h-12 bg-rose-600 rounded-full shadow-[0_0_30px_rgba(225,29,72,1)]"
                   />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <motion.div
        key={section}
        initial={{ opacity: 0, scale: 0.97, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="glass-wraith border-2 border-white/5 rounded-[5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-8 group/content hover:border-rose-500/20 transition-all duration-1000"
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
        <div className="absolute top-6 left-12 flex items-center gap-6 text-[11px] font-black text-white/20 uppercase tracking-[0.6em] italic mb-8 relative z-10">
           <Terminal size={18} className="text-rose-600" /> ТАБЛИЦЯ_ОБ ОБКИ_ДАТА_ОПС_L7
        </div>
        
        <div className="mt-12 relative z-10 border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-inner bg-black/40">
           {section === 'kafka' && (
             <VirtualTable rows={kafkaTopics} columns={kafkaCols} rowHeight={70} maxHeight={700} getRowStatus={getKafkaStatus} />
           )}
           {section === 'datasets' && (
             <VirtualTable rows={datasets} columns={datasetCols} rowHeight={70} maxHeight={700} getRowStatus={getDatasetStatus} />
           )}
           {section === 'factory' && (
             <VirtualTable rows={factoryModules} columns={moduleCols} rowHeight={70} maxHeight={700} getRowStatus={getModuleStatus} />
           )}
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center gap-12 opacity-40 hover:opacity-100 transition-opacity duration-[2000ms] px-10">
        <div className="flex items-center gap-6 px-10 py-5 bg-rose-600/5 border-2 border-rose-500/10 rounded-[2.5rem] shadow-4xl group hover:border-rose-500/30 transition-all">
           <TrendingUp className="w-6 h-6 text-rose-500 group-hover:scale-125 transition-transform" />
           <span className="text-[13px] font-mono text-rose-500 font-black uppercase tracking-[0.5em] italic glint-elite">ЯДРО_ДАТА_КОНВЕЄ А_СТАБІЛЬНЕ_v61.0</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/40 via-white/5 to-transparent" />
        <div className="flex flex-col items-end gap-2 text-right">
           <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.6em] italic font-black">PREDATOR_DATA_CONTROL_PLANE // MASTER_SYNC</span>
           <span className="text-[10px] font-black font-mono text-rose-600/40 uppercase tracking-[0.4em] italic">ELITE_STABILITY_PROTOCOL_READY</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 70px 150px -40px rgba(0,0,0,0.95); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .chromatic-elite { text-shadow: 1px 0 0 rgba(255,0,0,0.2), -1px 0 0 rgba(0,255,0,0.2); }
          .animate-spin-slow { animation: spin 20s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default DataOpsTab;
