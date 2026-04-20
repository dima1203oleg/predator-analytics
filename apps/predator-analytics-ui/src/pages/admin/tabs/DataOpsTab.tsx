import React, { useState } from 'react';
import { Database, Upload, Factory, Layers, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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

// ─── Мок-дані ─────────────────────────────────────────────────────────────────

const KAFKA_TOPICS: KafkaTopic[] = [
  { name: 'customs.raw.xml',       partitions: 8,  lag: 1204, throughput: '2.4 MB/s',  consumers: 3, status: 'warn' },
  { name: 'entities.enriched',     partitions: 4,  lag: 0,    throughput: '0.8 MB/s',  consumers: 2, status: 'ok' },
  { name: 'sanctions.feed',        partitions: 2,  lag: 0,    throughput: '0.1 MB/s',  consumers: 1, status: 'ok' },
  { name: 'graph.relationships',   partitions: 6,  lag: 0,    throughput: '1.1 MB/s',  consumers: 2, status: 'ok' },
  { name: 'risk.scores.computed',  partitions: 4,  lag: 342,  throughput: '0.5 MB/s',  consumers: 1, status: 'warn' },
  { name: 'audit.api.events',      partitions: 2,  lag: 0,    throughput: '0.2 MB/s',  consumers: 2, status: 'ok' },
  { name: 'court.registry.sync',   partitions: 2,  lag: 8901, throughput: '0.0 MB/s',  consumers: 0, status: 'error' },
  { name: 'llm.agent.output',      partitions: 4,  lag: 0,    throughput: '0.3 MB/s',  consumers: 3, status: 'ok' },
];

const DATASETS: DatasetRecord[] = [
  { id: '1', name: 'customs-ner-v4',      type: 'NER',          records: 1_240_000, sizeGb: 4.2,  version: '4.0.1', status: 'ready',    updatedAt: '2026-04-18' },
  { id: '2', name: 'risk-score-train-v3', type: 'Classification',records: 890_000,  sizeGb: 2.8,  version: '3.2.0', status: 'ready',    updatedAt: '2026-04-10' },
  { id: '3', name: 'graph-embeddings-v2', type: 'Embeddings',    records: 3_400_000, sizeGb: 8.1, version: '2.1.0', status: 'outdated', updatedAt: '2026-02-01' },
  { id: '4', name: 'sanctions-finetune',  type: 'LoRA FT',       records: 56_000,   sizeGb: 0.4,  version: '1.0.0', status: 'draft',    updatedAt: '2026-04-19' },
  { id: '5', name: 'entity-classify-v5',  type: 'Classification',records: 2_100_000, sizeGb: 6.3, version: '5.0.0', status: 'training', updatedAt: 'зараз' },
];

const FACTORY_MODULES: FactoryModule[] = [
  { id: '1', name: 'customs-etl-adapter',   template: 'ETL::XmlIngestion',    status: 'deployed', createdBy: 'admin', createdAt: '2026-04-15' },
  { id: '2', name: 'risk-scorer-v2',        template: 'ML::Classifier',       status: 'deployed', createdBy: 'admin', createdAt: '2026-04-10' },
  { id: '3', name: 'court-registry-sync',   template: 'ETL::FtpSync',         status: 'pending',  createdBy: 'admin', createdAt: '2026-04-20' },
  { id: '4', name: 'geo-enrichment-svc',    template: 'API::Enricher',        status: 'deployed', createdBy: 'admin', createdAt: '2026-03-28' },
  { id: '5', name: 'aml-pattern-detector',  template: 'ML::AnomalyDetector',  status: 'failed',   createdBy: 'admin', createdAt: '2026-04-19' },
  { id: '6', name: 'deep-osint-crawler-v3', template: 'Crawler::WebScraper',  status: 'draft',    createdBy: 'admin', createdAt: '2026-04-20' },
];

// ─── Колонки ──────────────────────────────────────────────────────────────────

const kafkaCols: VirtualColumn<KafkaTopic>[] = [
  { key: 'name',       label: 'Topic',          mono: true },
  { key: 'partitions', label: 'Part.', width: '55px',  mono: true, align: 'right' },
  {
    key: 'lag',        label: 'Lag',   width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 5000 ? 'text-red-400' : n > 500 ? 'text-amber-400' : 'text-emerald-400/70'}>{n.toLocaleString()}</span>;
    },
  },
  { key: 'throughput', label: 'Трафік',  width: '90px', mono: true },
  { key: 'consumers',  label: 'Cons.',   width: '55px', mono: true, align: 'right' },
  {
    key: 'status',     label: 'Статус',  width: '70px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ok: 'text-emerald-400', warn: 'text-amber-400', error: 'text-red-400' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{s.toUpperCase()}</span>;
    },
  },
];

const getKafkaStatus = (row: KafkaTopic): RowStatus =>
  row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warning' : 'danger';

const datasetCols: VirtualColumn<DatasetRecord>[] = [
  { key: 'name',      label: 'Датасет',  mono: true },
  { key: 'type',      label: 'Тип',      width: '120px', mono: true, render: (v) => <span className="text-white/40">{String(v)}</span> },
  { key: 'records',   label: 'Записів',  width: '100px', mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  { key: 'sizeGb',    label: 'GB',       width: '60px',  mono: true, align: 'right' },
  { key: 'version',   label: 'Версія',   width: '70px',  mono: true },
  {
    key: 'status',    label: 'Статус',   width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { ready: 'text-emerald-400', training: 'text-sky-400', outdated: 'text-amber-400', draft: 'text-white/30' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{s.toUpperCase()}</span>;
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
      const map: Record<string, string> = { deployed: 'text-emerald-400', pending: 'text-sky-400', failed: 'text-red-400', draft: 'text-white/30' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{s.toUpperCase()}</span>;
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
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400/50" />
        <div className="text-[10px] font-mono uppercase tracking-widest">Синхронізація DataOps...</div>
      </div>
    );
  }

  if (isError || !data) {
    return <div>Помилка завантаження даних DataOps</div>;
  }

  const { kafkaTopics, datasets, factoryModules } = data;

  const tabs = [
    { id: 'kafka'    as const, label: `Kafka Ingestion (${kafkaTopics.length})`,   icon: Upload },
    { id: 'datasets' as const, label: `Датасети ШІ (${datasets.length})`,           icon: Layers },
    { id: 'factory'  as const, label: `Фабрика Модулів (${factoryModules.length})`,icon: Factory },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Database className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          DataOps
        </h2>
        <span className="text-[9px] font-mono text-white/20 ml-auto">
          Kafka · Датасети · Фабрика
        </span>
      </div>

      {/* Метрики-шапка */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Topics',   value: kafkaTopics.length,              color: 'text-white/65' },
          { label: 'Lag Total',value: kafkaTopics.reduce((s,t)=>s+t.lag,0).toLocaleString(), color: 'text-amber-400' },
          { label: 'Датасети', value: datasets.filter(d=>d.status==='ready').length, color: 'text-emerald-400', sub: 'ready' },
          { label: 'Модулів',  value: factoryModules.filter(m=>m.status==='deployed').length, color: 'text-emerald-400', sub: 'deployed' },
        ].map((m) => (
          <div key={m.label} className="px-3 py-2 bg-[#1a2620] rounded-sm border border-white/6">
            <div className="text-[8px] font-semibold text-white/20 uppercase tracking-wider mb-0.5">{m.label}</div>
            <div className={cn('text-[16px] font-mono font-bold leading-none', m.color)}>{m.value}</div>
            {'sub' in m && <div className="text-[9px] font-mono text-white/20 mt-0.5">{(m as {sub: string}).sub}</div>}
          </div>
        ))}
      </div>

      {/* Внутрішні таби */}
      <div className="flex gap-1 border-b border-white/6 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-mono transition-all duration-100',
                active
                  ? 'bg-emerald-500/12 border border-emerald-400/20 text-emerald-300'
                  : 'text-white/30 hover:text-white/55 hover:bg-white/4 border border-transparent',
              )}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Контент */}
      {section === 'kafka' && (
        <VirtualTable rows={kafkaTopics} columns={kafkaCols} rowHeight={28} maxHeight={480} getRowStatus={getKafkaStatus} />
      )}
      {section === 'datasets' && (
        <VirtualTable rows={datasets} columns={datasetCols} rowHeight={30} maxHeight={480} getRowStatus={getDatasetStatus} />
      )}
      {section === 'factory' && (
        <VirtualTable rows={FACTORY_MODULES} columns={moduleCols} rowHeight={30} maxHeight={480} getRowStatus={getModuleStatus} />
      )}
    </div>
  );
};

export default DataOpsTab;
