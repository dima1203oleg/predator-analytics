import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  Workflow, 
  Loader2,
  Database,
  Cpu,
  Activity,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useGitOpsStatus } from '@/hooks/useAdminApi';

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

const ciCols: VirtualColumn<CIRun>[] = [
  { key: 'id',      label: 'ID_ЗАПУСКУ', width: '90px',  mono: true, render: (v) => <span className="text-white/40 font-black italic">#{String(v)}</span> },
  {
    key: 'status',  label: 'СТАТУС_ПРОЦЕСУ', width: '120px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { success: 'text-rose-500', failure: 'text-red-600', running: 'text-sky-400', pending: 'text-white/20' };
      const labelMap: Record<string, string> = { success: 'УСПІШНО_ДЕПЛОЙ', failure: 'КРИТИЧНИЙ_ЗБІЙ', running: 'ФОРМУВАННЯ_АРТЕФАКТІВ', pending: 'В_ЧЕРЗІ_ВИКОНАННЯ' };
      return (
        <div className={cn('text-[9px] font-black tracking-widest flex items-center gap-1.5', map[s] ?? 'text-white/20')}>
          <div className={cn("w-1 h-1 rounded-full", s === 'running' ? 'bg-sky-400 animate-pulse' : 'bg-current')} />
          {labelMap[s] || s.toUpperCase()}
        </div>
      );
    },
  },
  { key: 'branch',  label: 'ВЕТКА_КОДУ',  width: '140px', mono: true, render: (v) => <span className="text-rose-500/60 font-bold tracking-tighter uppercase italic">{String(v)}</span> },
  { key: 'commit',  label: 'ХЕШ_КОМІТУ',  width: '90px',  mono: true, render: (v) => <span className="text-white/30 font-mono">{String(v)}</span> },
  { key: 'trigger', label: 'АКТИВАТОР', width: '100px',  mono: true, render: (v) => <span className="text-white/20 uppercase text-[9px] font-black italic">{String(v)}</span> },
  { key: 'duration',label: 'ТРИВАЛІСТЬ',    width: '80px',  mono: true, align: 'right', render: (v) => <span className="text-white/50">{String(v)}</span> },
  { key: 'ts',      label: 'МОМЕНТ_СТАРТУ',              mono: true, render: (v) => <span className="text-white/10 text-[8px] uppercase italic tracking-tighter">{String(v)}</span> },
];

const getCIStatus = (row: CIRun): RowStatus =>
  row.status === 'success'  ? 'ok' :
  row.status === 'failure'  ? 'danger' :
  row.status === 'running'  ? 'info' : 'neutral';

const etlCols: VirtualColumn<ETLPipeline>[] = [
  { key: 'name',       label: 'ЕТАЛОН_ETL',  width: '200px', mono: true, render: (v) => <span className="font-black italic tracking-tight text-white/80 uppercase">{String(v)}</span> },
  { key: 'source',     label: 'ДЖЕРЕЛО_ДАНИХ',   width: '150px', mono: true, render: (v) => <span className="text-rose-500/40 text-[9px] font-black italic uppercase tracking-widest">{String(v)}</span> },
  {
    key: 'status',     label: 'СТАТУС_ПОТОКУ',    width: '120px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { running: 'text-sky-400', completed: 'text-rose-500', failed: 'text-red-600', idle: 'text-white/10' };
      const labelMap: Record<string, string> = { running: 'ТРАНСФОРМАЦІЯ', completed: 'СИНХРОНІЗОВАНО', failed: 'ЗБІЙ_ДЖЕРЕЛА', idle: 'ОЧІКУВАННЯ' };
      return (
        <div className={cn('text-[9px] font-black tracking-widest flex items-center gap-1.5', map[s])}>
          <div className={cn("w-1 h-1 rounded-full", s === 'running' ? 'bg-sky-400 animate-pulse' : 'bg-current')} />
          {labelMap[s] || s.toUpperCase()}
        </div>
      );
    },
  },
  { key: 'recordsIn',  label: 'ВХІД_RECORDS',      width: '110px',  mono: true, align: 'right', render: (v) => <span className="text-white/40 font-bold">{Number(v).toLocaleString()}</span> },
  { key: 'recordsOut', label: 'ВИХІД_RECORDS',     width: '110px',  mono: true, align: 'right', render: (v) => <span className="text-emerald-500/60 font-black italic">{Number(v).toLocaleString()}</span> },
  {
    key: 'lag',        label: 'ЗАТРИМКА_LAG',       width: '100px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-black italic", n > 1000 ? 'text-red-500 animate-pulse' : n > 100 ? 'text-amber-400' : 'text-white/20')}>{n.toLocaleString()}</span>;
    },
  },
  { key: 'lastRun',    label: 'ОСТАННЯ_СИНХРОНІЗАЦІЯ',                    mono: true, render: (v) => <span className="text-white/10 text-[8px] uppercase italic tracking-tighter">{String(v)}</span> },
];

const getETLStatus = (row: ETLPipeline): RowStatus =>
  row.status === 'running'   ? 'info' :
  row.status === 'completed' ? 'ok' :
  row.status === 'failed'    ? 'danger' : 'neutral';

// ─── ArgoCD картки ────────────────────────────────────────────────────────────

const SyncIcon: React.FC<{ status: ArgoCDApp['syncStatus'] }> = ({ status }) => {
  if (status === 'Synced')    return <CheckCircle className="w-4 h-4 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />;
  if (status === 'OutOfSync') return <XCircle className="w-4 h-4 text-amber-500 animate-pulse" />;
  return <Clock className="w-4 h-4 text-white/20" />;
};

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
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] animate-pulse italic">ОПИТУВАННЯ_МАГІСТРАЛЕЙ_GITOPS...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-12 text-center glass-wraith m-8 border border-rose-500/20 rounded-xl">
        <GitBranch size={48} className="text-rose-500/40 mb-6" />
        <div className="text-[18px] font-black uppercase tracking-widest text-white/90 mb-2">КРИТИЧНИЙ_ЗБІЙ_МАГІСТРАЛІ</div>
        <p className="text-[11px] font-mono text-white/30 max-w-sm mb-8 leading-relaxed uppercase italic">
          СИСТЕМА_НЕ_ЗМОГЛА_ОТРИМАТИ_СТАН_ARGOCD_ТА_ПЛАТФОРМ_CI_CD. ПЕРЕВІРТЕ_GITOPS_CONTROLLER_V6.
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
            Автоматизація Розгортання та ETL (CI/CD Control)
          </h2>
          <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[8px] font-bold text-rose-500 tracking-tighter uppercase italic">
            АВТОДЕПЛОЙ_ELITE_V62
          </div>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase italic">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>СИНХРОНІЗОВАНО_З_REPO</span>
          </div>
          <span>•</span>
          <span>РЕВІЗІЯ: HEAD_ELITE_PROD</span>
          <span>•</span>
          <span>КЛАСТЕР: PREDATOR_MAIN_CLUSTER</span>
        </div>
      </div>

      {/* ArgoCD Apps */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
           <div className="w-1 h-1 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
           <span className="text-[10px] font-mono font-black text-white/40 uppercase tracking-[0.4em] italic glint-elite">ArgoCD — СТАН_АРХІТЕКТУРНИХ_МОДУЛІВ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {argoApps.map((app) => (
            <motion.div 
              key={app.name} 
              whileHover={{ x: 4, scale: 1.01 }}
              className="flex items-center gap-5 px-5 py-4 glass-wraith rounded-xl border border-white/5 group hover:border-rose-500/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
              <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-rose-500/10 transition-colors border border-white/5">
                 <SyncIcon status={app.syncStatus} />
              </div>
              <div className="flex flex-col flex-1 gap-1 relative z-10">
                <span className="text-[13px] font-black tracking-widest text-white/80 group-hover:text-white transition-colors italic uppercase leading-none">{app.name}</span>
                <span className="text-[8px] font-mono text-rose-500/30 uppercase tracking-[0.2em] font-bold italic">{app.namespace}</span>
              </div>
              <div className="flex flex-col items-end gap-2 relative z-10">
                 <span className={cn(
                    'text-[9px] font-black px-3 py-1 rounded-sm border tracking-[0.2em] italic uppercase',
                    app.healthStatus === 'Healthy'     ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
                    app.healthStatus === 'Degraded'    ? 'text-rose-500 bg-rose-500/5 border-rose-500/20 animate-pulse' :
                                                           'text-sky-500 bg-sky-500/5 border-sky-500/20',
                  )}>
                    {app.healthStatus === 'Healthy' ? 'СТАБІЛЬНО' : app.healthStatus === 'Degraded' ? 'ДЕГРАДАЦІЯ_ЯДРА' : 'ОБРОБКА_ЗМІН'}
                 </span>
                 <div className="flex items-center gap-3 text-[8px] font-mono text-white/10 uppercase font-black italic tracking-widest">
                    <span className="group-hover:text-rose-500/40 transition-colors">{app.revision}</span>
                    <span className="opacity-40">{app.lastSync}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CI/CD & ETL Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* CI/CD Runs */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-rose-500 rotate-45" />
             <span className="text-[11px] font-mono font-black text-white/50 uppercase tracking-[0.4em] italic">ЖУРНАЛ_МАГІСТРАЛІ_CI_CD</span>
          </div>
          <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            <VirtualTable
              rows={ciRuns}
              columns={ciCols}
              rowHeight={48}
              maxHeight={400}
              getRowStatus={getCIStatus}
              emptyLabel="ЗАПИСІВ_CI_CD_НЕ_ВИЯВЛЕНО"
            />
          </div>
        </div>

        {/* ETL Пайплайни */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-rose-500 rotate-45" />
             <span className="text-[11px] font-mono font-black text-white/50 uppercase tracking-[0.4em] italic">МАТРИЦЯ_ПОТОКІВ_ETL_CORE</span>
          </div>
          <div className="glass-wraith border border-white/5 rounded-xl overflow-hidden backdrop-blur-3xl shadow-2xl relative">
            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
            <VirtualTable
              rows={etlPipelines}
              columns={etlCols}
              rowHeight={48}
              maxHeight={400}
              getRowStatus={getETLStatus}
              emptyLabel="АКТИВНИХ_ПОТОКІВ_ETL_НЕ_ЗНАЙДЕНО"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitOpsPipelineTab;
