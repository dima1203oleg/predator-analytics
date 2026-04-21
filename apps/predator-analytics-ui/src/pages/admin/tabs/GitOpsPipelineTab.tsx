import React from 'react';
import { Box, CheckCircle, XCircle, Clock, GitBranch, Loader, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useGitOpsStatus } from '@/hooks/useAdminApi';
import { Loader2 } from 'lucide-react';

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

// ─── Колонки ──────────────────────────────────────────────────────────────────

// ─── Колонки ──────────────────────────────────────────────────────────────────

const ciCols: VirtualColumn<CIRun>[] = [
  { key: 'id',      label: 'Run',    width: '70px',  mono: true },
  {
    key: 'status',  label: 'Статус', width: '80px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { success: 'text-rose-500', failure: 'text-red-500', running: 'text-rose-400', pending: 'text-white/35' };
      const labelMap: Record<string, string> = { success: 'УСПІШНО', failure: 'ПОМИЛКА', running: 'У РОБОТІ', pending: 'В ОЧІКУВАННІ' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s] ?? 'text-white/35')}>{labelMap[s] || s.toUpperCase()}</span>;
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
      const map: Record<string, string> = { running: 'text-rose-400', completed: 'text-rose-500', failed: 'text-red-500', idle: 'text-white/25' };
      const labelMap: Record<string, string> = { running: 'У РОБОТІ', completed: 'ЗАВЕРШЕНО', failed: 'ПОМИЛКА', idle: 'ПРОСТІЙ' };
      return <span className={cn('text-[10px] font-mono font-semibold', map[s])}>{labelMap[s] || s.toUpperCase()}</span>;
    },
  },
  { key: 'recordsIn',  label: 'Вхід',      width: '90px',  mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  { key: 'recordsOut', label: 'Вихід',     width: '90px',  mono: true, align: 'right', render: (v) => Number(v).toLocaleString() },
  {
    key: 'lag',        label: 'Лаг',       width: '80px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={n > 1000 ? 'text-red-500' : n > 100 ? 'text-amber-400' : 'text-white/40'}>{n.toLocaleString()}</span>;
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
  if (status === 'Synced')    return <CheckCircle className="w-3 h-3 text-rose-500" />;
  if (status === 'OutOfSync') return <XCircle className="w-3 h-3 text-amber-400" />;
  return <Clock className="w-3 h-3 text-white/30" />;
};

// ─── Вкладка ─────────────────────────────────────────────────────────────────

// ─── Вкладка ─────────────────────────────────────────────────────────────────

// ─── Вкладка ─────────────────────────────────────────────────────────────────

export const GitOpsPipelineTab: React.FC = () => {
  const { data, isLoading, isError } = useGitOpsStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-white/40 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500/50" />
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
        <Box className="w-4 h-4 text-rose-500" />
        <h2 className="text-[13px] font-semibold text-white/80 uppercase tracking-wider">
          GitOps & Пайплайни
        </h2>
      </div>

      {/* ArgoCD */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-3 h-3 text-white/25" />
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">
            ArgoCD — Статус синхронізації
          </span>
        </div>
        <div className="space-y-1.5">
          {argoApps.map((app) => (
            <div key={app.name} className="flex items-center gap-3 px-3 py-2 bg-[#0a0a0a] rounded-sm border border-white/6 group hover:border-rose-500/30 transition-colors">
              <SyncIcon status={app.syncStatus} />
              <span className="text-[11px] font-mono text-white/60 w-36 shrink-0">{app.name}</span>
              <span className="text-[9px] font-mono text-white/25">{app.namespace}</span>
              <span className={cn(
                'ml-auto text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-sm border',
                app.healthStatus === 'Healthy'     ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                app.healthStatus === 'Degraded'    ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                                                      'text-rose-400 bg-rose-400/10 border-rose-400/20',
              )}>
                {app.healthStatus === 'Healthy' ? 'ЗДОРОВИЙ' : app.healthStatus === 'Degraded' ? 'ДЕГРАДАЦІЯ' : 'У РОБОТІ'}
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
            Запуски CI/CD пайплайнів
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
