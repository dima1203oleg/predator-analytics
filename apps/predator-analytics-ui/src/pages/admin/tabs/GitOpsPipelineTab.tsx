import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRightLeft,
  RefreshCw,
  Server,
  Shield,
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VirtualTable, VirtualColumn, RowStatus } from '@/components/shared/VirtualTable';
import { useGitOpsStatus } from '@/hooks/useAdminApi';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

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
  { 
    key: 'id',      
    label: 'ID_ЗАПУСКУ', 
    width: '100px',  
    mono: true, 
    render: (v) => <span className="text-white/40 font-black italic tracking-widest">#{String(v)}</span> 
  },
  {
    key: 'status',  label: 'СТАТУС_П� ОЦЕСУ', width: '160px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { success: 'text-rose-500', failure: 'text-red-600', running: 'text-sky-400', pending: 'text-white/20' };
      const labelMap: Record<string, string> = { success: 'УСПІШНО_ДЕПЛОЙ', failure: 'К� ИТИЧНИЙ_ЗБІЙ', running: 'ФО� МУВАННЯ', pending: 'В_ЧЕ� ЗІ' };
      return (
        <div className={cn('text-[10px] font-black tracking-[0.2em] flex items-center gap-2 italic uppercase', map[s] ?? 'text-white/20')}>
          <div className={cn("w-2 h-2 rounded-full", s === 'running' ? 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-current')} />
          {labelMap[s] || s.toUpperCase()}
        </div>
      );
    },
  },
  { 
    key: 'branch',  
    label: 'ВЕТКА_КОДУ',  
    width: '180px', 
    mono: true, 
    render: (v) => (
      <div className="flex items-center gap-3">
        <GitBranch size={12} className="text-rose-500/40" />
        <span className="text-rose-500/80 font-black tracking-tighter uppercase italic">{String(v)}</span>
      </div>
    )
  },
  { 
    key: 'commit',  
    label: 'ХЕШ_КОМІТУ',  
    width: '100px',  
    mono: true, 
    render: (v) => <span className="text-white/30 font-mono text-[10px] uppercase font-black italic">{String(v)}</span> 
  },
  { 
    key: 'trigger', 
    label: 'АКТИВАТО� ', 
    width: '120px',  
    mono: true, 
    render: (v) => <span className="text-white/20 uppercase text-[9px] font-black italic tracking-widest">{String(v)}</span> 
  },
  { 
    key: 'duration',
    label: 'Т� ИВАЛІСТЬ',    
    width: '100px',  
    mono: true, 
    align: 'right', 
    render: (v) => <span className="text-white/50 font-black italic">{String(v)}</span> 
  },
  { 
    key: 'ts',      
    label: 'МОМЕНТ_СТА� ТУ',              
    mono: true, 
    render: (v) => <span className="text-white/10 text-[9px] uppercase italic tracking-tighter font-black">{String(v)}</span> 
  },
];

const getCIStatus = (row: CIRun): RowStatus =>
  row.status === 'success'  ? 'ok' :
  row.status === 'failure'  ? 'danger' :
  row.status === 'running'  ? 'info' : 'neutral';

const etlCols: VirtualColumn<ETLPipeline>[] = [
  { 
    key: 'name',       
    label: 'ЕТАЛОН_ETL',  
    width: '250px', 
    mono: true, 
    render: (v) => <span className="font-black italic tracking-tighter text-white uppercase glint-elite">{String(v)}</span> 
  },
  { 
    key: 'source',     
    label: 'ДЖЕ� ЕЛО_ДАНИХ',   
    width: '180px', 
    mono: true, 
    render: (v) => (
      <div className="flex items-center gap-3">
        <Database size={12} className="text-rose-500/30" />
        <span className="text-rose-500/50 text-[10px] font-black italic uppercase tracking-widest">{String(v)}</span>
      </div>
    )
  },
  {
    key: 'status',     label: 'СТАТУС_ПОТОКУ',    width: '160px',
    render: (v) => {
      const s = String(v);
      const map: Record<string, string> = { running: 'text-sky-400', completed: 'text-rose-500', failed: 'text-red-600', idle: 'text-white/10' };
      const labelMap: Record<string, string> = { running: 'Т� АНСФО� МАЦІЯ', completed: 'СИНХ� ОНІЗОВАНО', failed: 'ЗБІЙ_ДЖЕ� ЕЛА', idle: 'ОЧІКУВАННЯ' };
      return (
        <div className={cn('text-[10px] font-black tracking-[0.2em] flex items-center gap-2 italic uppercase', map[s])}>
          <div className={cn("w-2 h-2 rounded-full", s === 'running' ? 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-current')} />
          {labelMap[s] || s.toUpperCase()}
        </div>
      );
    },
  },
  { 
    key: 'recordsIn',  
    label: 'ВХІД_RECORDS',      
    width: '120px',  
    mono: true, 
    align: 'right', 
    render: (v) => <span className="text-white/40 font-black italic">{Number(v).toLocaleString()}</span> 
  },
  { 
    key: 'recordsOut', 
    label: 'ВИХІД_RECORDS',     
    width: '120px',  
    mono: true, 
    align: 'right', 
    render: (v) => <span className="text-emerald-500 font-black italic shadow-emerald-500/20">{Number(v).toLocaleString()}</span> 
  },
  {
    key: 'lag',        label: 'ЗАТ� ИМКА_LAG',       width: '120px',  mono: true, align: 'right',
    render: (v) => {
      const n = Number(v);
      return <span className={cn("font-black italic text-[11px]", n > 1000 ? 'text-red-500 animate-pulse' : n > 100 ? 'text-amber-400' : 'text-white/20')}>{n.toLocaleString()}</span>;
    },
  },
  { 
    key: 'lastRun',    
    label: 'ОСТАННЯ_СИНХ� ОНІЗАЦІЯ',                    
    mono: true, 
    render: (v) => <span className="text-white/10 text-[9px] uppercase italic tracking-tighter font-black">{String(v)}</span> 
  },
];

const getETLStatus = (row: ETLPipeline): RowStatus =>
  row.status === 'running'   ? 'info' :
  row.status === 'completed' ? 'ok' :
  row.status === 'failed'    ? 'danger' : 'neutral';

// ─── ArgoCD картки ────────────────────────────────────────────────────────────

const SyncIcon: React.FC<{ status: ArgoCDApp['syncStatus'] }> = ({ status }) => {
  if (status === 'Synced')    return <CheckCircle className="w-6 h-6 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />;
  if (status === 'OutOfSync') return <XCircle className="w-6 h-6 text-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]" />;
  return <Clock className="w-6 h-6 text-white/20" />;
};

// ─── MAIN VIEW ───────────────────────────────────────────────────────────────

export const GitOpsPipelineTab: React.FC = () => {
  const { data, isLoading, isError } = useGitOpsStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] text-white/40 space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-rose-500/20 rounded-full border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]"
          />
          <Workflow className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[14px] font-black font-mono uppercase tracking-[0.6em] animate-pulse italic text-rose-500/60">АНАЛІЗ_МАГІСТ� АЛЕЙ_GITOPS_V61...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[700px] p-24 text-center glass-wraith m-12 border-2 border-rose-600/20 rounded-[4rem] relative overflow-hidden shadow-4xl">
        <div className="absolute inset-0 bg-rose-900/5 blur-[120px] pointer-events-none" />
        <GitBranch size={64} className="text-rose-500/40 mb-10 animate-pulse" />
        <div className="text-3xl font-black uppercase tracking-tighter text-white mb-4 glint-elite">К� ИТИЧНИЙ_ЗБІЙ_МАГІСТ� АЛІ</div>
        <p className="text-[12px] font-black font-mono text-white/30 max-w-lg mb-12 leading-relaxed uppercase italic tracking-widest">
          СИСТЕМА_НЕ_ЗМОГЛА_ОТ� ИМАТИ_СТАН_ARGOCD_ТА_ПЛАТФО� М_CI_CD. ПЕ� ЕВІ� ТЕ_GITOPS_CONTROLLER_V61_ELITE.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-rose-500 transition-all shadow-4xl italic"
        >
          ПЕ� ЕПІДКЛЮЧИТИСЬ_ДО_МАГІСТ� АЛІ
        </button>
      </div>
    );
  }

  const { argoApps, ciRuns, etlPipelines } = data;

  return (
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2 relative z-10">
        <div className="flex items-center gap-6">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
            АВТОМАТИЗАЦІЯ � ОЗГО� ТАННЯ <span className="text-rose-500">& ETL</span>
          </h2>
          <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.3em] uppercase italic shadow-2xl">
            CI_CD_ELITE_v61.0
          </div>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            <span className="text-emerald-500/80">СИНХ� ОНІЗОВАНО_З_MASTER_REPO</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3">
             <RefreshCw size={14} className="text-rose-500/60 animate-spin-slow" />
             <span>� ЕВІЗІЯ: HEAD_ELITE_PROD_v61</span>
          </div>
          <span className="opacity-20">•</span>
          <div className="flex items-center gap-3 text-rose-500/40">
             <Shield size={14} />
             <span>КЛАСТЕ� : PREDATOR_ELITE_COMPUTE_iMAC</span>
          </div>
        </div>
      </div>

      {/* ArgoCD Apps */}
      <div className="space-y-8 relative z-10">
        <div className="flex items-center gap-6 px-4">
           <div className="w-2 h-2 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
           <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">ArgoCD — СТАН_А� ХІТЕКТУ� НИХ_МОДУЛІВ</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {argoApps.map((app) => (
            <motion.div 
              key={app.name} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 10, scale: 1.01 }}
              className="flex items-center gap-8 px-8 py-8 glass-wraith rounded-[2.5rem] border-2 border-white/5 group hover:border-rose-500/40 transition-all duration-700 relative overflow-hidden shadow-4xl"
            >
              <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
              <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-rose-500/10 transition-all duration-700 border-2 border-white/5 group-hover:border-rose-500/20 shadow-inner">
                 <SyncIcon status={app.syncStatus} />
              </div>
              <div className="flex flex-col flex-1 gap-2 relative z-10">
                <span className="text-2xl font-black tracking-tighter text-white group-hover:text-rose-500 transition-colors italic uppercase leading-none glint-elite">{app.name}</span>
                <span className="text-[10px] font-black font-mono text-rose-500/40 uppercase tracking-[0.3em] font-bold italic">{app.namespace}</span>
              </div>
              <div className="flex flex-col items-end gap-3 relative z-10">
                 <span className={cn(
                    'text-[10px] font-black px-5 py-1.5 rounded-xl border-2 tracking-[0.3em] italic uppercase shadow-4xl',
                    app.healthStatus === 'Healthy'     ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/30 shadow-emerald-500/10' :
                    app.healthStatus === 'Degraded'    ? 'text-rose-500 bg-rose-500/5 border-rose-500/30 animate-pulse' :
                                                           'text-sky-500 bg-sky-500/5 border-sky-500/30',
                  )}>
                    {app.healthStatus === 'Healthy' ? 'HEALTHY' : app.healthStatus === 'Degraded' ? 'DEGRADED' : 'PROGRESSING'}
                 </span>
                 <div className="flex items-center gap-4 text-[9px] font-black font-mono text-white/20 uppercase font-black italic tracking-[0.2em]">
                    <span className="group-hover:text-rose-500/40 transition-colors">{app.revision}</span>
                    <span className="opacity-30">{app.lastSync}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CI/CD & ETL Tables Row */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12 relative z-10 pb-20">
        {/* CI/CD Runs */}
        <div className="space-y-8">
          <div className="flex items-center gap-6 px-4">
             <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
             <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.6em] italic glint-elite">ЖУ� НАЛ_МАГІСТ� АЛІ_CI_CD (AUDIT_TRAIL)</span>
          </div>
          <div className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-4">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
            <VirtualTable
              rows={ciRuns}
              columns={ciCols}
              rowHeight={64}
              maxHeight={500}
              getRowStatus={getCIStatus}
              emptyLabel="ЗАПИСІВ_CI_CD_НЕ_ВИЯВЛЕНО"
            />
          </div>
        </div>

        {/* ETL Пайплайни */}
        <div className="space-y-8">
          <div className="flex items-center gap-6 px-4">
             <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
             <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.6em] italic glint-elite">МАТ� ИЦЯ_ПОТОКІВ_ETL_CORE_ELITE</span>
          </div>
          <div className="glass-wraith border-2 border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-4xl relative p-4">
            <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
            <VirtualTable
              rows={etlPipelines}
              columns={etlCols}
              rowHeight={64}
              maxHeight={500}
              getRowStatus={getETLStatus}
              emptyLabel="АКТИВНИХ_ПОТОКІВ_ETL_НЕ_ЗНАЙДЕНО"
            />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .animate-spin-slow { animation: spin 10s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default GitOpsPipelineTab;
