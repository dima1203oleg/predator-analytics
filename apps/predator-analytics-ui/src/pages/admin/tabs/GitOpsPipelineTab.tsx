import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Terminal, 
  Activity, 
  ShieldCheck, 
  Database,
  ArrowRightLeft,
  Settings,
  Cpu
} from 'lucide-react';
import { useAdminApi } from "@/hooks/useAdminApi";

/**
 * GitOpsPipelineTab — Модуль управління Журналом Магістралей CI/CD та ETL.
 * Версія: v62.7-ELITE
 */
export const GitOpsPipelineTab: React.FC = () => {
  const { data: pipelines, isLoading } = useAdminApi('gitops');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-black/40 p-4 border-l-4 border-blue-500 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-blue-500" />
            ЖУРНАЛ_МАГІСТРАЛІ_CI_CD
          </h2>
          <p className="text-blue-400/60 text-xs font-mono mt-1 uppercase">
            Статус: СИНХРОНІЗАЦІЯ_АРГО_КЛАСТЕРА — [АКТИВНО]
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 px-3 py-1 font-mono">
            VRAM: 5.2GB / 8GB
          </Badge>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 px-3 py-1 font-mono">
            ШІ_ОПЕРАТОР: ГІБРИД
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CI/CD Магістралі */}
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Terminal className="w-5 h-5 text-blue-500" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                SYNCED
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-zinc-100 mt-3 group-hover:text-blue-400 transition-colors">CORE_API_STABLE</CardTitle>
            <CardDescription className="text-zinc-500 text-xs font-mono">HASH: 7f3a2c1... [MAIN]</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>СТАТУС_ЗБІРКИ:</span>
              <span className="text-emerald-400 underline decoration-dotted">УСПІШНО</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[100%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-[10px] py-1 border border-zinc-800 rounded font-bold transition-all">
                ЛОГИ_ЗБІРКИ
              </button>
              <button className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] py-1 border border-blue-500/30 rounded font-bold transition-all">
                RE-DEPLOY
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ETL Магістралі */}
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Database className="w-5 h-5 text-purple-500" />
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono text-[10px]">
                PROCESSING
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-zinc-100 mt-3 group-hover:text-purple-400 transition-colors">ЕТАЛОН_ETL_KAFKA</CardTitle>
            <CardDescription className="text-zinc-500 text-xs font-mono">TOPIC: customs.raw.v3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>ШВИДКІСТЬ_ПОТОКУ:</span>
              <span className="text-purple-400 italic font-black">1.2 GB/s</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[65%] animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-[9px] font-mono uppercase">
              <div className="bg-black/40 p-1.5 border border-zinc-800 rounded">
                <span className="text-zinc-500">IN:</span> 4.5M MSG
              </div>
              <div className="bg-black/40 p-1.5 border border-zinc-800 rounded">
                <span className="text-zinc-500">ERR:</span> 0 (0.00%)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ШІ_КОНТРОЛЕР */}
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl hover:border-emerald-500/50 transition-all duration-300 group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <Cpu className="w-5 h-5 text-emerald-500" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[10px]">
                NOMINAL
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-zinc-100 mt-3 group-hover:text-emerald-400 transition-colors">ШІ_ОПЕРАТОР_PIPELINE</CardTitle>
            <CardDescription className="text-zinc-500 text-xs font-mono">ЯДРО: Qwen3-Coder-Elite</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>АВТО_ОПТИМІЗАЦІЯ:</span>
              <span className="text-emerald-400 font-bold tracking-widest">АКТИВНО</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
              <Activity className="w-3 h-3 text-emerald-500 animate-bounce" />
              <p className="text-[10px] text-emerald-300 leading-tight">
                ВИЯВЛЕНО_АНТРОПІЮ_В_БД. ЗАПУЩЕНО_РЕІНДЕКСАЦІЮ.
              </p>
            </div>
            <button className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[10px] py-1.5 border border-emerald-500/30 rounded font-black transition-all uppercase tracking-widest">
              ВІДКРИТИ_НЕЙРОННИЙ_ЖУРНАЛ
            </button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/60 border-zinc-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <CardHeader className="border-b border-zinc-900 bg-zinc-900/20">
          <CardTitle className="text-sm font-black italic flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            ОСТАННІ_ПОДІЇ_МАГІСТРАЛІ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-900 font-mono text-[11px]">
            {[
              { time: '14:20:11', event: 'DEPLOY_SUCCESS', target: 'CORE_API', author: 'predator_bot' },
              { time: '14:18:45', event: 'SYNC_START', target: 'ARGO_CD', author: 'system' },
              { time: '14:15:30', event: 'RESOURCES_LIMIT_HIT', target: 'INGESTION_V3', author: 'VRAM_GUARD' },
              { time: '14:10:02', event: 'DB_BACKUP_CREATED', target: 'MINIO_STORAGE', author: 'cron_agent' }
            ].map((log, i) => (
              <div key={i} className="p-3 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                <span className="text-zinc-600">{log.time}</span>
                <span className={`font-bold w-32 ${log.event.includes('SUCCESS') ? 'text-emerald-500' : log.event.includes('HIT') ? 'text-rose-500' : 'text-blue-500'}`}>
                  [{log.event}]
                </span>
                <span className="text-zinc-300 flex-1">{log.target}</span>
                <span className="text-zinc-500 text-[9px] group-hover:text-blue-400 transition-colors uppercase italic">
                  id: {log.author}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
