import React from 'react';
import { Box, CheckCircle, XCircle, Clock, GitBranch, Loader, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface ArgoCDApp {
  name: string;
  namespace: string;
  syncStatus: 'Synced' | 'OutOfSync' | 'Unknown';
  healthStatus: 'Healthy' | 'Degraded' | 'Progressing';
  revision: string;
  lastSync: string;
}

interface CIRun {
  id: string;
  ref: string;
  commit: string;
  branch: string;
  status: 'success' | 'failure' | 'running' | 'pending';
  duration: string;
  trigger: string;
  ts: string;
}

interface ETLPipeline {
  id: string;
  name: string;
  source: string;
  status: 'running' | 'completed' | 'failed' | 'idle';
  recordsIn: number;
  recordsOut: number;
  lag: number;
  lastRun: string;
}

// ─── Мок-дані ─────────────────────────────────────────────────────────────────

const ARGO_APPS: ArgoCDApp[] = [
  { name: 'core-api',          namespace: 'predator',  syncStatus: 'Synced',    healthStatus: 'Healthy',     revision: 'a1b2c3d', lastSync: '2 хв тому' },
  { name: 'graph-service',     namespace: 'predator',  syncStatus: 'Synced',    healthStatus: 'Healthy',     revision: 'd4e5f6g', lastSync: '2 хв тому' },
  { name: 'ingestion-worker',  namespace: 'predator',  syncStatus: 'OutOfSync', healthStatus: 'Degraded',    revision: 'h7i8j9k', lastSync: '15 хв тому' },
  { name: 'predator-ui',       namespace: 'predator',  syncStatus: 'Synced',    healthStatus: 'Healthy',     revision: 'l1m2n3o', lastSync: '2 хв тому' },
  { name: 'monitoring-stack',  namespace: 'monitoring', syncStatus: 'Synced',   healthStatus: 'Progressing', revision: 'p4q5r6s', lastSync: '8 хв тому' },
];

const CI_RUNS: CIRun[] = Array.from({ length: 30 }, (_, i) => ({
  id:       `run-${1000 + i}`,
  ref:      `refs/heads/${['main', 'feat/rbac', 'fix/parser'][i % 3]}`,
  commit:   Math.random().toString(16).slice(2, 9),
  branch:   ['main', 'feat/rbac', 'fix/parser'][i % 3],
  status:   (['success', 'failure', 'running', 'pending'] as const)[i % 4],
  duration: `${Math.floor(Math.random() * 300 + 60)}с`,
  trigger:  ['push', 'manual', 'schedule'][i % 3],
  ts:       new Date(Date.now() - i * 900_000).toISOString().replace('T', ' ').slice(0, 16),
}));

const ETL_PIPELINES: ETLPipeline[] = [
  { id: '1', name: 'customs-xml-ingest',  source: 'minio/customs',  status: 'running',   recordsIn: 128_432, recordsOut: 127_890, lag: 542,   lastRun: 'зараз' },
  { id: '2', name: 'sanctions-feed',      source: 'kafka/sanct',    status: 'completed', recordsIn: 8_204,   recordsOut: 8_204,   lag: 0,     lastRun: '5 хв тому' },
  { id: '3', name: 'court-registry-sync', source: 'ftp/courts',     status: 'idle',      recordsIn: 0,       recordsOut: 0,       lag: 0,     lastRun: '2г тому' },
  { id: '4', name: 'tax-data-transform',  source: 'postgres/tax',   status: 'failed',    recordsIn: 45_100,  recordsOut: 12_400,  lag: 32_700,lastRun: '14 хв тому' },
  { id: '5', name: 'geo-enrichment',      source: 'api/geolite',    status: 'running',   recordsIn: 23_000,  recordsOut: 22_888,  lag: 112,   lastRun: 'зараз' },
];

// ─── Колонки ──────────────────────────────────────────────────────────────────

const ciCols: VirtualColumn<CIRun>[] = [
  { key: 'id',      label: 'Run',    width: '70px',  mono: true },
  {
    key: 'status',  label: 'Статус', width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { success: 'text-emerald-400', failure: 'text-red-400', running: 'text-sky-400', pending: 'text-white/35' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s] ?? 'text-white/35')}>{s.toUpperCase()}</span>;
    },
  },
  { key: 'branch',  label: 'Гілка',  width: '120px', mono: true },
  { key: 'commit',  label: 'Коміт',  width: '70px',  mono: true },
  { key: 'trigger', label: 'Тригер', width: '70px',  mono: true },
  { key: 'duration',label: 'Час',    width: '60px',  mono: true, align: 'right' },
  { key: 'ts',      label: 'Запущено',              mono: true },
];

const getCIStatus = (row: CIRun): RowStatus =>
  row.status === 'success'  ? 'ok' :
  row.status === 'failure'  ? 'danger' :
  row.status === 'running'  ? 'info' : 'neutral';

const etlCols: VirtualColumn<ETLPipeline>[] = [
  { key: 'name',       label: 'Пайплайн',  width: '180px', mono: true },
  { key: 'source',     label: 'Джерело',   width: '130px', mono: true },
  {
    key: 'status',     label: 'Статус',    width: '90px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { running: 'text-sky-400', completed: 'text-emerald-400', failed: 'text-red-400', idle: 'text-white/25' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{s.toUpperCase()}</span>;
    },
  },
  { key: 'recordsIn',  label: 'Вхід',      width: '90px',  mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  { key: 'recordsOut', label: 'Вихід',     width: '90px',  mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  {
    key: 'lag',        label: 'Лаг',       width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 1000 ? 'text-red-400' : n > 100 ? 'text-amber-400' : 'text-white/40'}>{n.toLocaleString()}</span>;
    },
  },
  { key: 'lastRun',    label: 'Запуск',                    mono: true },
];

const getETLStatus = (row: ETLPipeline): RowStatus =>
  row.status === 'running'   ? 'info' :
  row.status === 'completed' ? 'ok' :
  row.status === 'failed'    ? 'danger' : 'neutral';

// ─── ArgoCD картки ────────────────────────────────────────────────────────────

const SyncIcon: React.FC<{ status: ArgoCDApp['syncStatus'] }> = ({ status }) => {
  if (status === 'Synced')    return <CheckCircle className="w-3 h-3 text-emerald-400" />;
  if (status === 'OutOfSync') return <XCircle className="w-3 h-3 text-amber-400" />;
  return <Clock className="w-3 h-3 text-white/30" />;
};

// ─── Вкладка ─────────────────────────────────────────────────────────────────

import { useGitOpsStatus } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';

// ─── Вкладка ─────────────────────────────────────────────────────────────────

export const GitOpsPipelineTab: React.FC = () => {
  const { data, isLoading, isError } = useGitOpsStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400/50" />
        <div className="text-[10px] font-mono uppercase tracking-widest">Синхронізація GitOps...</div>
      </div>
    );
  }

  if (isError || !data) {
    return <div>Помилка завантаження даних GitOps</div>;
  }

  const { argoApps, ciRuns, etlPipelines } = data;

  return (
    <div className="p-4 space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/6">
        <Box className="w-4 h-4 text-emerald-400" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          GitOps & Пайплайни
        </h2>
      </div>

      {/* ArgoCD */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-3 h-3 text-white/25" />
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
            ArgoCD — Sync Status
          </span>
        </div>
        <div className="space-y-1.5">
          {argoApps.map((app) => (
            <div key={app.name} className="flex items-center gap-3 px-3 py-2 bg-[#1a2620] rounded-sm border border-white/6">
              <SyncIcon status={app.syncStatus} />
              <span className="text-[11px] font-mono text-white/60 w-36 shrink-0">{app.name}</span>
              <span className="text-[9px] font-mono text-white/25">{app.namespace}</span>
              <span className={cn(
                'ml-auto text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-sm border',
                app.healthStatus === 'Healthy'     ? 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20' :
                app.healthStatus === 'Degraded'    ? 'text-red-400 bg-red-500/10 border-red-400/20' :
                                                      'text-sky-400 bg-sky-500/10 border-sky-400/20',
              )}>
                {app.healthStatus}
              </span>
              <span className="text-[9px] font-mono text-white/25 ml-2">{app.revision}</span>
              <span className="text-[9px] font-mono text-white/20 ml-2">{app.lastSync}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CI/CD Runs */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Loader className="w-3 h-3 text-white/25" />
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
            CI/CD Pipeline Runs
          </span>
        </div>
        <VirtualTable
          rows={ciRuns}
          columns={ciCols}
          rowHeight={28}
          maxHeight={240}
          getRowStatus={getCIStatus}
        />
      </div>

      {/* ETL Пайплайни */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Workflow className="w-3 h-3 text-white/25" />
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
            ETL Пайплайни
          </span>
        </div>
        <VirtualTable
          rows={etlPipelines}
          columns={etlCols}
          rowHeight={28}
          maxHeight={200}
          getRowStatus={getETLStatus}
        />
      </div>
    </div>
  );
};


export default GitOpsPipelineTab;
