import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Cpu, Shield, AlertTriangle, 
  ArrowRightLeft, HardDrive, Layout, 
  Settings, Loader2, Gauge, Activity,
  Server, Globe, Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { useSystemStats, useInfraTelemetry, useFailoverStatus, useToggleFailover } from '@/hooks/useAdminApi';

/**
 * 🦅 Resource Guard (VRAM/CPU Guard) | v60.5-ELITE
 * СТРАТЕГІЧНИЙ_ЗАХИСТ_РЕСУРСІВ: Управління навантаженням та VRAM.
 */

// ─── Допоміжні компоненти ──────────────────────────────────────────────────────

const GuardMeter: React.FC<{ 
  label: string; 
  value: number; 
  total: number; 
  unit: string;
  color?: 'rose' | 'blue' | 'emerald' | 'amber';
}> = ({ label, value, total, unit, color = 'rose' }) => {
  const percentage = Math.min((value / total) * 100, 100);
  const isHigh = percentage > 85;
  const isCritical = percentage > 95;

  const colorMap = {
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };

  const shadowMap = {
    rose: 'shadow-[0_0_15px_rgba(225,29,72,0.6)]',
    blue: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    emerald: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
    amber: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]'
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white/[0.02] border border-white/5 rounded-sm group hover:border-white/10 transition-all">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">{label}</span>
          <span className="text-[18px] font-black text-white/90 font-mono tracking-tighter">
            {value.toFixed(1)} <span className="text-[10px] text-white/40 uppercase">{unit}</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={cn(
            "text-[12px] font-black italic",
            isCritical ? "text-rose-500 animate-pulse" : isHigh ? "text-amber-400" : "text-emerald-400"
          )}>
            {percentage.toFixed(0)}%
          </span>
          <span className="text-[7px] text-white/10 font-mono uppercase">LTM_НАВАНТАЖЕННЯ</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full relative", colorMap[color], shadowMap[color])}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </motion.div>
      </div>
    </div>
  );
};

// ─── ResourceGuardTab ────────────────────────────────────────────────────────

import { useBackendStatus } from '@/hooks/useBackendStatus';

export const ResourceGuardTab: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: infra, isLoading: infraLoading } = useInfraTelemetry();
  const { data: failover, isLoading: failoverLoading } = useFailoverStatus();
  const { llmTriStateMode, nodeSource } = useBackendStatus();
  const toggleFailover = useToggleFailover();

  // Константи згідно AGENTS.md (HR-11/HR-12-ish)
  const VRAM_TOTAL_LIMIT = 8.0; // 8GB Guard
  const VRAM_UI_OS_RESERVE = 2.5;
  const VRAM_LLM_POOL = 5.5;
  const CLOUD_OVERRIDE_THRESHOLD = 7.6;

  const currentVram = (stats?.gpu_mem_used ?? 0) / (1024 ** 3);
  const isCloudOverride = currentVram >= CLOUD_OVERRIDE_THRESHOLD;

  const handleOffload = async (targetNode: string) => {
    try {
      await toggleFailover.mutateAsync(targetNode);
    } catch (err) {
      console.error("[PREDATOR] Offload error:", err);
    }
  };

  if (statsLoading || infraLoading || failoverLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" strokeWidth={1} />
        <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.5em] animate-pulse italic">
          СИНХРОНІЗАЦІЯ_МЕТРИК_ЗАХИСТУ...
        </span>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col gap-8 select-none relative overflow-hidden bg-[#020101]">
      {/* Background HUD elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-rose-500/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-600/[0.02] blur-[150px] pointer-events-none" />
      <div className="absolute inset-0 cyber-scan-grid opacity-[0.03] pointer-events-none" />

      {/* Header Section */}
      <div className="flex items-start justify-between relative z-10 border-l-2 border-rose-600 pl-6 py-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-black text-white uppercase tracking-[0.25em] italic">
            VRAM Guard & Ресурсний Диспетчер
          </h2>
          <div className="flex items-center gap-4 text-[9px] font-mono text-white/30 tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Shield size={10} className="text-rose-500" />
              <span>СТАТУС_ЗАХИСТУ: {isCloudOverride ? 'АКТИВНИЙ_CLOUD_OVERRIDE' : 'НОРМАЛЬНИЙ'}</span>
            </div>
            <span>•</span>
            <span>ЛІМІТ_VRAM: {VRAM_TOTAL_LIMIT} ГБ</span>
            <span>•</span>
            <span>ВЕРСІЯ: v61.0-ELITE</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-end p-3 bg-white/5 border border-white/5 rounded-sm">
            <span className="text-[7px] text-white/20 uppercase font-black tracking-widest mb-1">РЕЖИМ_МАРШРУТИЗАЦІЇ</span>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shadow-[0_0_10px]",
                llmTriStateMode === 'SOVEREIGN' ? 'bg-rose-500 shadow-rose-500' : 
                llmTriStateMode === 'HYBRID' ? 'bg-emerald-500 shadow-emerald-500' :
                'bg-sky-500 shadow-sky-500'
              )} />
              <span className="text-xs font-black text-white italic uppercase tracking-wider">{llmTriStateMode}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 relative z-10">
        
        {/* Left: VRAM Partitioning & Limits */}
        <div className="col-span-4 flex flex-col gap-6">
          <TacticalCard variant="holographic" title="РОЗПОДІЛ_VRAM_8GB" className="border-l-2 border-l-rose-600">
            <div className="space-y-6 mt-4">
              <GuardMeter label="ЗАГАЛЬНЕ_ВИКОРИСТАННЯ" value={currentVram} total={VRAM_TOTAL_LIMIT} unit="GB" color="rose" />
              
              <div className="p-4 bg-black/40 border border-white/5 rounded-sm space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest italic">Політика VRAM Guard:</span>
                    <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded-sm text-[7px] font-bold text-rose-500 uppercase">АКТИВНО</div>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Layout size={10} className="text-blue-400" />
                          <span className="text-[10px] text-white/70 uppercase font-bold tracking-tighter">UI / OS Резерв</span>
                       </div>
                       <span className="text-[10px] font-mono text-blue-400 font-black">{VRAM_UI_OS_RESERVE} GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Cpu size={10} className="text-rose-400" />
                          <span className="text-[10px] text-white/70 uppercase font-bold tracking-tighter">LLM Pool (Ollama)</span>
                       </div>
                       <span className="text-[10px] font-mono text-rose-400 font-black">{VRAM_LLM_POOL} GB</span>
                    </div>
                 </div>

                 {isCloudOverride && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm flex items-start gap-3 mt-4 animate-pulse">
                       <AlertTriangle size={14} className="text-rose-500 mt-0.5" />
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">CLOUD_OVERRIDE_TRIGGERED</span>
                          <p className="text-[8px] text-rose-200/60 font-mono leading-tight uppercase italic">
                            Навантаження перевищує {CLOUD_OVERRIDE_THRESHOLD} ГБ. Автоматичне перемикання на хмарні потужності.
                          </p>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          </TacticalCard>

          <TacticalCard variant="holographic" title="CPU_LOAD_CONTROL" className="border-l-2 border-l-blue-600">
            <div className="mt-4">
              <GuardMeter label="SYSTEM_CPU_LOAD" value={stats?.cpu_percent ?? 0} total={100} unit="%" color="blue" />
              <div className="mt-6 p-4 bg-blue-600/5 border border-blue-600/10 rounded-sm">
                <p className="text-[8px] text-blue-300/40 font-mono leading-relaxed uppercase italic font-black">
                  Порада: MacBook використовується тільки як IDE. Весь бекенд має працювати на Sovereign Node (iMac).
                </p>
              </div>
            </div>
          </TacticalCard>
        </div>

        {/* Center: Deployment Control & Nodes */}
        <div className="col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-6">
            <TacticalCard variant="holographic" title="HYBRID_MASTER_NVIDIA" className="bg-emerald-900/5 border-emerald-500/10">
               <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[12px] font-black text-white italic tracking-tighter uppercase">ПРІОРИТЕТ: ГЛОБАЛЬНИЙ_МАЙСТЕР</span>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest italic">Цільовий стан: High Availability</span>
                     </div>
                     <div className="p-2 bg-emerald-500/10 rounded-sm">
                        <Globe size={14} className="text-emerald-500" />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-white/5 border border-white/5 rounded-sm">
                        <span className="text-[7px] text-white/20 uppercase font-black tracking-widest block mb-1">СТАТУС_ВУЗЛА</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">АКТИВНИЙ</span>
                     </div>
                     <div className="p-3 bg-white/5 border border-white/5 rounded-sm">
                        <span className="text-[7px] text-white/20 uppercase font-black tracking-widest block mb-1">IP_АДРЕСА</span>
                        <span className="text-[10px] font-black text-white italic">194.177.1.240</span>
                     </div>
                  </div>

                  <button 
                    disabled={llmTriStateMode === 'HYBRID'}
                    onClick={() => handleOffload('hybrid')}
                    className={cn(
                      "w-full py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all border italic",
                      llmTriStateMode === 'HYBRID' 
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500 cursor-default"
                        : "bg-white/5 border-white/10 text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-white"
                    )}
                  >
                    {llmTriStateMode === 'HYBRID' ? 'ПОТОЧНИЙ_МАСТЕР' : 'ПЕРЕЙТИ_НА_HYBRID'}
                  </button>
               </div>
            </TacticalCard>

            <TacticalCard variant="holographic" title="SOVEREIGN_NODE_IMAC" className="bg-rose-900/5 border-rose-500/10">
               <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[12px] font-black text-white italic tracking-tighter uppercase">ПРІОРИТЕТ: СУВЕРЕННИЙ_ОФЛОАД</span>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest italic">Цільовий стан: Local Power</span>
                     </div>
                     <div className="p-2 bg-rose-500/10 rounded-sm">
                        <Server size={14} className="text-rose-500" />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 border border-white/5 rounded-sm">
                        <span className="text-[7px] text-white/20 uppercase font-black tracking-widest block mb-1">ЗВ'ЯЗОК_LAN</span>
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">
                          192.168.0.199
                        </span>
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-sm">
                        <span className="text-[7px] text-white/20 uppercase font-black tracking-widest block mb-1">VRAM_IMAC</span>
                        <span className="text-[10px] font-black text-white italic">
                          8.0 ГБ
                        </span>
                      </div>
                  </div>

                  <button 
                    disabled={toggleFailover.isPending || llmTriStateMode === 'SOVEREIGN'}
                    onClick={() => handleOffload('sovereign')}
                    className={cn(
                      "w-full py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all border italic shadow-lg",
                      llmTriStateMode === 'SOVEREIGN'
                        ? "bg-rose-600/20 border-rose-500/40 text-rose-400 cursor-default"
                        : "bg-rose-600 text-white border-rose-400/50 hover:bg-rose-500 shadow-rose-500/20"
                    )}
                  >
                    {toggleFailover.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      llmTriStateMode === 'SOVEREIGN' ? 'АКТИВНИЙ_СУВЕРЕН' : 'АКТИВУВАТИ_СУВЕРЕННИЙ_РЕЖИМ'
                    )}
                  </button>
               </div>
            </TacticalCard>
          </div>

          <TacticalCard variant="holographic" title="АКТИВНІ_ПРОЦЕСИ_ТА_ОФЛОАД_МАРШРУТИ" className="flex-1">
             <div className="mt-4 space-y-4 h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {(infra?.nodes.flatMap(node => node.pods || []) || [
                  { name: 'Core API (Backend)', type: 'SVC', load: 'Високе', vram: '1.2 ГБ', status: 'Running' },
                  { name: 'Ingestion Worker', type: 'WRK', load: 'Середнє', vram: '0.4 ГБ', status: 'Running' },
                  { name: 'Graph Service (Neo4j)', type: 'DB', load: 'Середнє', vram: '1.8 ГБ', status: 'Running' },
                ]).map((proc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-sm group hover:border-white/10 transition-all border-l-2 border-l-rose-500/30">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-sm bg-white/5 flex items-center justify-center font-mono text-[8px] font-black text-white/40 uppercase">
                        {proc.type || 'SVC'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white italic tracking-tighter uppercase">{proc.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest italic">Статус: <span className={cn("font-black", proc.status === 'Running' ? "text-emerald-500/60" : "text-rose-500/60")}>{proc.status}</span></span>
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest italic">•</span>
                          <span className="text-[7px] font-mono text-white/20 uppercase tracking-widest italic">VRAM: {proc.vram || 'Н/Д'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                       <div className="flex flex-col items-end">
                          <span className="text-[7px] text-white/10 uppercase font-black tracking-widest mb-1">ЛОКАЦІЯ</span>
                          <div className="flex items-center gap-2">
                             {failover?.activeNode === 'local-k3s' ? <Monitor size={10} className="text-rose-500" /> : <Globe size={10} className="text-blue-500" />}
                             <span className={cn("text-[9px] font-black italic", failover?.activeNode === 'local-k3s' ? "text-rose-500" : "text-blue-400")}>{failover?.activeNode}</span>
                          </div>
                       </div>
                       <button className="p-2 bg-white/5 border border-white/10 rounded-sm hover:bg-rose-500/20 hover:border-rose-500/40 transition-all group/btn">
                          <ArrowRightLeft size={12} className="text-white/20 group-hover/btn:text-rose-500" />
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default ResourceGuardTab;
