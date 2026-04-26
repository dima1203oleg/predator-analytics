import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Upload, Factory, Layers, TrendingUp, Loader2, Zap, Activity, HardDrive, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataOpsStatus } from '@/hooks/useAdminApi';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

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
  { key: 'name',       label: 'Топік',          mono: true },
  { key: 'partitions', label: 'Парт.', width: '55px',  mono: true, align: 'right' },
  {
    key: 'lag',        label: 'Лаг',   width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 5000 ? 'text-rose-500 font-black' : n > 500 ? 'text-amber-500 font-bold' : 'text-rose-400/70'}>{n.toLocaleString()}</span>;
    },
  },
  { key: 'throughput', label: 'Трафік',  width: '90px', mono: true },
  { key: 'consumers',  label: 'Конс.',   width: '55px', mono: true, align: 'right' },
  {
    key: 'status',     label: 'Статус',  width: '70px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ok: 'text-rose-500', warn: 'text-amber-500', error: 'text-rose-600' };
      const labelMap: Record<string, string> = { ok: 'ОК', warn: 'УВАГА', error: 'ЗБІЙ' };
      return <span className={cn('text-[10px] font-mono font-black italic tracking-widest', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
];

const getKafkaStatus = (row: KafkaTopic): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

const datasetCols: VirtualColumn<DatasetRecord>[] = [
  { key: 'name',      label: 'Датасет',  mono: true },
  { key: 'type',      label: 'Тип',      width: '120px', mono: true, render: (v) => <span className="text-white/40">{String(v)}</span> },
  { key: 'records',   label: 'Записів',  width: '100px', mono: true, align: 'right', render: (v) => <span className="font-black italic">{Number(v).toLocaleString()}</span> },
  { key: 'sizeGb',    label: 'ГБ',       width: '60px',  mono: true, align: 'right' },
  { key: 'version',   label: 'Версія',   width: '70px',  mono: true },
  {
    key: 'status',    label: 'Статус',   width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ready: 'text-rose-500', training: 'text-rose-400', outdated: 'text-amber-400', draft: 'text-white/30' };
      const labelMap: Record<string, string> = { ready: 'ГОТОВО', training: 'НАВЧАННЯ', outdated: 'ЗАСТАРІЛО', draft: 'ЧЕРНЕТКА' };
      return <span className={cn('text-[10px] font-mono font-black italic tracking-widest', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
  { key: 'updatedAt', label: 'Оновлено', width: '100px', mono: true },
];

const getDatasetStatus = (row: DatasetRecord): RowStatus =>
  row.status === 'ready'    ? 'ok' :
  row.status === 'training' ? 'info' :
  row.status === 'outdated' ? 'warning' : 'neutral';

const moduleCols: VirtualColumn<FactoryModule>[] = [
  { key: 'name',      label: 'Модуль',    mono: true },
  { key: 'template',  label: 'Шаблон',    width: '180px', mono: true, render: (v) => <span className="text-white/35 text-[9px]">{String(v)}</span> },
  {
    key: 'status',    label: 'Статус',    width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { deployed: 'text-rose-500', pending: 'text-rose-400/70', failed: 'text-rose-600', draft: 'text-white/30' };
      const labelMap: Record<string, string> = { deployed: 'АКТИВНО', pending: 'ОЧІКУВАННЯ', failed: 'ПОМИЛКА', draft: 'ЧЕРНЕТКА' };
      return <span className={cn('text-[10px] font-mono font-black italic tracking-widest', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
  { key: 'createdBy', label: 'Автор',     width: '90px',  mono: true },
  { key: 'createdAt', label: 'Дата',      width: '90px',  mono: true },
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
      <div className="flex flex-col items-center justify-center h-[600px] text-white/30 space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-2 border-rose-500/20 rounded-full border-t-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]"
          />
          <Database className="absolute inset-0 m-auto w-6 h-6 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[12px] font-mono uppercase tracking-[0.6em] animate-pulse italic font-black text-rose-500/60">ІНТЕРОПЕРАБЕЛЬНІСТЬ_ДАНИХ...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] p-20 text-center glass-wraith m-12 border-2 border-rose-600/20 rounded-[3rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-rose-900/5 blur-[100px] pointer-events-none" />
        <Database size={64} className="text-rose-600/40 mb-10" />
        <div className="text-3xl font-black uppercase tracking-[0.2em] text-white mb-4 glint-elite">КРИТИЧНИЙ_ЗБІЙ_ДАТА_КОНВЕЄРА</div>
        <p className="text-[12px] font-mono text-white/30 max-w-lg mb-12 leading-relaxed uppercase italic">
          Система не змогла отримати стан вузлів обробки. Перевірте з'єднання з контролером даних PREDATOR_LAKE_MASTER.
        </p>
        <button className="px-12 py-5 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-rose-500 transition-all shadow-4xl italic">
          ПОВТОРИТИ_ЗАПИТ
        </button>
      </div>
    );
  }

  const { kafkaTopics, datasets, factoryModules } = data;

  const tabs = [
    { id: 'kafka'    as const, label: `ШИНА_ПОДІЙ`,   count: kafkaTopics.length,    icon: Upload },
    { id: 'datasets' as const, label: `СХОВИЩА_БД`,    count: datasets.length,       icon: Layers },
    { id: 'factory'  as const, label: `ДАТА_ФАБРИКА`, count: factoryModules.length, icon: Factory },
  ];

  const totalThroughput = kafkaTopics.reduce((s, t) => {
    const val = parseFloat(t.throughput) || 0;
    const unit = t.throughput.toUpperCase().includes('GB') ? 1024 : t.throughput.toUpperCase().includes('KB') ? 1/1024 : 1;
    return s + (val * unit);
  }, 0);

  return (
    <div className="p-12 space-y-16 max-w-[1600px] mx-auto relative">
      {/* Header Section */}
      <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2 relative overflow-hidden group">
        <div className="absolute inset-0 bg-rose-500/5 blur-[40px] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <div className="flex items-center gap-6">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic glint-elite">
            УПРАВЛІННЯ ДАНИМИ & <span className="text-rose-500">ПОТОКОВА АНАЛІТИКА</span>
          </h2>
          <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.2em] uppercase italic shadow-2xl">
            ELITE_DATA_v61.0
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-500/80">СИСТЕМА_ТРАНСПОРТУ_АКТИВНА</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3">
            <Zap size={14} className="text-amber-500" />
            <span>ШВИДКІСТЬ_ПОТОКУ: {totalThroughput.toFixed(1)} МБ/с</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3 text-rose-500/40">
            <Shield size={14} />
            <span>АРХІТЕКТУРА: PREDATOR_DATA_LAKE_v2</span>
          </div>
        </div>
      </div>

      {/* Метрики-шапка */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'КАНАЛИ_ПОДІЙ', value: kafkaTopics.length, color: 'text-white/90', sub: 'АКТИВНІ_ТОПІКИ_KAFKA', icon: Upload },
          { label: 'ЧЕРГА_ОБРОБКИ', value: kafkaTopics.reduce((s,t)=>s+t.lag,0).toLocaleString(), color: 'text-rose-500', sub: 'ЗАПИСІВ_У_ЧЕРЗІ', icon: Activity },
          { label: 'РЕПОЗИТОРІЇ', value: datasets.filter(d=>d.status==='ready').length, color: 'text-rose-400', sub: 'ВЕРИФІКОВАНІ_ДАТАСЕТИ', icon: HardDrive },
          { label: 'АКТИВНІ_МОДУЛІ',  value: factoryModules.filter(m=>m.status==='deployed').length, color: 'text-white/90', sub: 'ПРОЦЕСИ_ФАБРИКИ', icon: Factory },
        ].map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
            className="glass-wraith border-2 border-white/5 p-10 rounded-[2.5rem] group hover:border-rose-500/40 transition-all duration-700 relative overflow-hidden shadow-4xl hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
            <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-20 transition-opacity">
               <m.icon size={40} className="text-rose-500" />
            </div>
            <div className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.4em] mb-4 italic group-hover:text-rose-500/40 transition-colors">{m.label}</div>
            <div className={cn('text-4xl font-black tracking-tighter italic leading-none glint-elite', m.color)}>{m.value}</div>
            <div className="text-[9px] font-black font-mono text-white/10 mt-6 uppercase tracking-[0.3em] font-bold group-hover:text-rose-500/60 transition-colors italic">{m.sub}</div>
            <div className="absolute bottom-4 right-6 w-8 h-[2px] bg-white/5 group-hover:bg-rose-500/40 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Internal Navigation */}
      <div className="flex gap-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-col items-start gap-4 px-10 py-8 rounded-[2rem] transition-all duration-700 relative overflow-hidden flex-1 group shadow-4xl border-2',
                active
                  ? 'bg-rose-500/10 border-rose-500/40 shadow-rose-500/10 scale-[1.02]'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-white/30 hover:text-white/60',
              )}
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="flex items-center gap-6 w-full">
                <div className={cn(
                   'p-4 rounded-2xl transition-all duration-700',
                   active ? 'bg-rose-500 text-white shadow-[0_0_30px_rgba(225,29,72,0.6)]' : 'bg-white/5 text-white/20 group-hover:text-white/40'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                   <div className={cn('text-[14px] font-black uppercase tracking-[0.3em] italic', active ? 'text-white' : 'text-white/40 group-hover:text-white/60')}>
                     {t.label}
                   </div>
                   <div className="text-[10px] font-black font-mono text-white/10 uppercase tracking-[0.2em] mt-2 italic group-hover:text-rose-500/20 transition-colors">{t.count} КЕРОВАНИХ_ОБ'ЄКТІВ</div>
                </div>
                {active && (
                   <motion.div 
                     layoutId="data-tab-indicator"
                     className="w-2 h-8 bg-rose-500 rounded-full shadow-[0_0_20px_rgba(225,29,72,1)]"
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
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-4"
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
        
        {section === 'kafka' && (
          <VirtualTable rows={kafkaTopics} columns={kafkaCols} rowHeight={60} maxHeight={600} getRowStatus={getKafkaStatus} />
        )}
        {section === 'datasets' && (
          <VirtualTable rows={datasets} columns={datasetCols} rowHeight={60} maxHeight={600} getRowStatus={getDatasetStatus} />
        )}
        {section === 'factory' && (
          <VirtualTable rows={factoryModules} columns={moduleCols} rowHeight={60} maxHeight={600} getRowStatus={getModuleStatus} />
        )}
      </motion.div>

      {/* Footer Info */}
      <div className="flex items-center gap-10 opacity-60 hover:opacity-100 transition-opacity duration-1000 px-6">
        <div className="flex items-center gap-4 px-8 py-4 bg-rose-500/5 border-2 border-rose-500/10 rounded-[1.5rem] shadow-2xl">
           <TrendingUp className="w-5 h-5 text-rose-500" />
           <span className="text-[11px] font-mono text-rose-500 font-black uppercase tracking-[0.4em] italic">ЯДРО_ДАТА_КОНВЕЄРА_СТАБІЛЬНЕ</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/30 via-transparent to-transparent" />
        <div className="flex flex-col items-end gap-1">
           <span className="text-[10px] font-black font-mono text-white/30 uppercase tracking-[0.5em] italic font-black">PREDATOR_DATA_CONTROL_PLANE v61.0</span>
           <span className="text-[8px] font-black font-mono text-rose-500/40 uppercase tracking-[0.3em] italic">ELITE_MASTER_STABILITY_PROTOCOL_ACTIVE</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 50px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.3); }
      `}} />
    </div>
  );
};

export default DataOpsTab;

