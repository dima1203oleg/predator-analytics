import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Upload, Factory, Layers, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDataOpsStatus } from '@/hooks/useAdminApi';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';

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

// ─── Колонки ──────────────────────────────────────────────────────────────────

const kafkaCols: VirtualColumn<KafkaTopic>[] = [
  { key: 'name',       label: 'Топік',          mono: true },
  { key: 'partitions', label: 'Парт.', width: '55px',  mono: true, align: 'right' },
  {
    key: 'lag',        label: 'Лаг',   width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 5000 ? 'text-red-500' : n > 500 ? 'text-amber-500' : 'text-rose-400/70'}>{n.toLocaleString()}</span>;
    },
  },
  { key: 'throughput', label: 'Трафік',  width: '90px', mono: true },
  { key: 'consumers',  label: 'Конс.',   width: '55px', mono: true, align: 'right' },
  {
    key: 'status',     label: 'Статус',  width: '70px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ok: 'text-rose-500', warn: 'text-amber-500', error: 'text-red-500' };
      const labelMap: Record<string, string> = { ok: 'В ПОРЯДКУ', warn: 'УВАГА', error: 'ПОМИЛКА' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
];

const getKafkaStatus = (row: KafkaTopic): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

const datasetCols: VirtualColumn<DatasetRecord>[] = [
  { key: 'name',      label: 'Датасет',  mono: true },
  { key: 'type',      label: 'Тип',      width: '120px', mono: true, render: (v) => <span className="text-white/40">{String(v)}</span> },
  { key: 'records',   label: 'Записів',  width: '100px', mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  { key: 'sizeGb',    label: 'ГБ',       width: '60px',  mono: true, align: 'right' },
  { key: 'version',   label: 'Версія',   width: '70px',  mono: true },
  {
    key: 'status',    label: 'Статус',   width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ready: 'text-rose-500', training: 'text-rose-400', outdated: 'text-amber-400', draft: 'text-white/30' };
      const labelMap: Record<string, string> = { ready: 'ГОТОВО', training: 'НАВЧАННЯ', outdated: 'ЗАСТАРІЛО', draft: 'ЧЕРНЕТКА' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
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
      const map: Record<string, string> = { deployed: 'text-rose-500', pending: 'text-rose-400/70', failed: 'text-red-500', draft: 'text-white/30' };
      const labelMap: Record<string, string> = { deployed: 'РОЗГОРНУТО', pending: 'В ОЧІКУВАННІ', failed: 'ПОМИЛКА', draft: 'ЧЕРНЕТКА' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
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
      <div className="flex flex-col items-center justify-center h-[500px] text-white/30 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500/20" strokeWidth={1} />
          <Database className="absolute inset-0 m-auto w-5 h-5 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">ІНТЕРОПЕРАБЕЛЬНІСТЬ_ДАНИХ_В_ПРОЦЕСІ...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center glass-wraith m-8 border border-rose-500/20 rounded-xl">
        <Database size={48} className="text-rose-500/40 mb-6" />
        <div className="text-[18px] font-black uppercase tracking-widest text-white/90 mb-2">КРИТИЧНИЙ_ЗБІЙ_ДАТА_КОНВЕЄРА</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed">
          Система не змогла отримати стан вузлів обробки. Перевірте з'єднання з контролером даних PREDATOR_LAKE.
        </p>
      </div>
    );
  }

  const { kafkaTopics, datasets, factoryModules } = data;

  const tabs = [
    { id: 'kafka'    as const, label: `ШИНА_ПОДІЙ`,   count: kafkaTopics.length,    icon: Upload },
    { id: 'datasets' as const, label: `СХОВИЩА_БД`,    count: datasets.length,       icon: Layers },
    { id: 'factory'  as const, label: `ДАТА_ФАБРИКА`, count: factoryModules.length, icon: Factory },
  ];

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
            Управління Даними & Потокова Аналітика
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter">
            ІНДУСТРІАЛЬНИЙ_РІВЕНЬ_V6
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>СИСТЕМА_ТРАНСПОРТУ_АКТИВНА</span>
          </div>
          <span>•</span>
          <span>ШВИДКІСТЬ_ПОТОКУ: 850 МБ/с</span>
          <span>•</span>
          <span>АРХІТЕКТУРА: PREDATOR_DATA_LAKE</span>
        </div>
      </div>

      {/* Метрики-шапка */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'КАНАЛИ_ПОДІЙ', value: kafkaTopics.length, color: 'text-white/80', sub: 'АКТИВНІ_ТОПІКИ' },
          { label: 'ЧЕРГА_ОБРОБКИ', value: kafkaTopics.reduce((s,t)=>s+t.lag,0).toLocaleString(), color: 'text-rose-500', sub: 'ЗАПИСІВ_У_ЧЕРЗІ' },
          { label: 'РЕПОЗИТОРІЇ', value: datasets.filter(d=>d.status==='ready').length, color: 'text-rose-500', sub: 'ВЕРИФІКОВАНІ_ДАТАСЕТИ' },
          { label: 'МОДУЛІВ',  value: factoryModules.filter(m=>m.status==='deployed').length, color: 'text-white/80', sub: 'АКТИВНІ_ПРОЦЕСИ' },
        ].map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-wraith border border-white/5 p-6 rounded-xl group hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mb-2 font-black italic">{m.label}</div>
            <div className={cn('text-[24px] font-black tracking-tighter italic leading-none', m.color)}>{m.value}</div>
            <div className="text-[8px] font-mono text-white/10 mt-3 uppercase tracking-widest font-bold group-hover:text-rose-500/40 transition-colors">{m.sub}</div>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-white/10 group-hover:border-rose-500 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Internal Navigation */}
      <div className="flex gap-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex flex-col items-start gap-2 px-6 py-4 rounded-xl transition-all duration-500 relative overflow-hidden flex-1 group',
                active
                  ? 'glass-wraith border-rose-500/40 bg-rose-500/5 shadow-2xl shadow-rose-500/5'
                  : 'bg-white/[0.02] border border-white/5 hover:border-white/10 text-white/30 hover:text-white/60',
              )}
            >
              <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
              <div className="flex items-center gap-3 w-full">
                <div className={cn(
                   'p-2 rounded-lg transition-colors',
                   active ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-white/20 group-hover:text-white/40'
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                   <div className={cn('text-[10px] font-black uppercase tracking-[0.2em] italic', active ? 'text-white' : 'text-white/40 group-hover:text-white/60')}>
                     {t.label}
                   </div>
                   <div className="text-[8px] font-mono text-white/10 uppercase tracking-widest mt-0.5">{t.count} ОБ'ЄКТІВ</div>
                </div>
                {active && (
                   <motion.div 
                     layoutId="data-tab-indicator"
                     className="w-1 h-4 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,1)]"
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
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative"
      >
        <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
        
        {section === 'kafka' && (
          <VirtualTable rows={kafkaTopics} columns={kafkaCols} rowHeight={48} maxHeight={550} getRowStatus={getKafkaStatus} />
        )}
        {section === 'datasets' && (
          <VirtualTable rows={datasets} columns={datasetCols} rowHeight={48} maxHeight={550} getRowStatus={getDatasetStatus} />
        )}
        {section === 'factory' && (
          <VirtualTable rows={factoryModules} columns={moduleCols} rowHeight={48} maxHeight={550} getRowStatus={getModuleStatus} />
        )}
      </motion.div>

      {/* Footer Info */}
      <div className="flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity duration-700">
        <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg">
           <TrendingUp className="w-4 h-4 text-rose-500" />
           <span className="text-[10px] font-mono text-rose-500 font-black uppercase tracking-[0.2em]">ДАТА_КОНВЕЄР_СТАБІЛЬНИЙ</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/20 via-transparent to-transparent" />
        <span className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] italic font-black">Ядро Управління Даними v6.0 — ЕЛІТНИЙ_РІВЕНЬ</span>
      </div>
    </div>
  );
};

export default DataOpsTab;
