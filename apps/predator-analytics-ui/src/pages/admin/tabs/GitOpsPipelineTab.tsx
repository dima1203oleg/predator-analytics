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
      <div className="flex flex-col items-center justify-center h-[500px] text-white/30 space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500/20" strokeWidth={1} />
          <Workflow className="absolute inset-0 m-auto w-5 h-5 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">Синхронізація GitOps...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center glass-wraith m-8 border border-rose-500/20 rounded-xl">
        <GitBranch size={48} className="text-rose-500/40 mb-6" />
        <div className="text-[18px] font-black uppercase tracking-widest text-white/90 mb-2">ПОМИЛКА ПАЙПЛАЙНУ</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed">
          Система не змогла отримати стан ArgoCD та CI/CD пайплайнів. Перевірте статус GitOps-контролера.
        </p>
      </div>
    );
  }

  const { argoApps, ciRuns, etlPipelines } = data;

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-l-2 border-rose-500 pl-6 py-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-black text-white uppercase tracking-[0.2em]">
            GitOps & Пайплайни
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter">
            AUTO_DEPLOY_ACTIVE
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>Synced</span>
          </div>
          <span>•</span>
          <span>Revision: HEAD_ELITE</span>
          <span>•</span>
          <span>Cluster: PREDATOR_MAIN</span>
        </div>
      </div>

      {/* ArgoCD Apps */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="w-1 h-1 bg-rose-500 rotate-45" />
           <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">ArgoCD — Статус синхронізації</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {argoApps.map((app) => (
            <motion.div 
              key={app.name} 
              whileHover={{ x: 4 }}
              className="flex items-center gap-5 px-5 py-4 glass-wraith rounded-xl border border-white/5 group hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-rose-500/10 transition-colors">
                 <SyncIcon status={app.syncStatus} />
              </div>
              <div className="flex flex-col flex-1 gap-1 relative z-10">
                <span className="text-[13px] font-black tracking-widest text-white/80 group-hover:text-white transition-colors italic uppercase">{app.name}</span>
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">{app.namespace}</span>
              </div>
              <div className="flex flex-col items-end gap-2 relative z-10">
                 <span className={cn(
                    'text-[9px] font-black px-2 py-0.5 rounded-lg border tracking-widest italic',
                    app.healthStatus === 'Healthy'     ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                    app.healthStatus === 'Degraded'    ? 'text-rose-500 bg-rose-500/5 border-rose-500/20 animate-pulse' :
                                                          'text-sky-500 bg-sky-500/5 border-sky-500/20',
                  )}>
                    {app.healthStatus === 'Healthy' ? 'ЗДОРОВИЙ' : app.healthStatus === 'Degraded' ? 'ДЕГРАДАЦІЯ' : 'У РОБОТІ'}
                 </span>
                 <div className="flex items-center gap-3 text-[8px] font-mono text-white/20 uppercase">
                    <span>{app.revision}</span>
                    <span className="opacity-40">{app.lastSync}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CI/CD & ETL Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* CI/CD Runs */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-rose-500 rotate-45" />
             <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">CI/CD Пайплайни</span>
          </div>
          <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            <VirtualTable
              rows={ciRuns}
              columns={ciCols}
              rowHeight={40}
              maxHeight={300}
              getRowStatus={getCIStatus}
            />
          </div>
        </div>

        {/* ETL Пайплайни */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1 h-1 bg-rose-500 rotate-45" />
             <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em]">ETL Пайплайни</span>
          </div>
          <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            <VirtualTable
              rows={etlPipelines}
              columns={etlCols}
              rowHeight={40}
              maxHeight={300}
              getRowStatus={getETLStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitOpsPipelineTab;


export default GitOpsPipelineTab;
