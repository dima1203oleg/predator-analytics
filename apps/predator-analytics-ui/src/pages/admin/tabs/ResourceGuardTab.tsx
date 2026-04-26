import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Cpu, Shield, AlertTriangle, 
  ArrowRightLeft, HardDrive, Layout, 
  Settings, Loader2, Gauge, Activity,
  Server, Globe, Monitor, RefreshCw,
  Database, Box, Zap as ZapIcon, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSystemStats, useInfraTelemetry, useFailoverStatus, useToggleFailover } from '@/hooks/useAdminApi';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { useBackendStatus } from '@/hooks/useBackendStatus';

/**
 * 🦅 Resource Guard (VRAM/CPU Guard) | v61.0-ELITE
 * СТРАТЕГІЧНИЙ_ЗАХИСТ_РЕСУРСІВ: Управління навантаженням та VRAM.
 */

// ─── Допоміжні компоненти ──────────────────────────────────────────────────────

const GuardMeter: React.FC<{ 
  label: string; 
  value: number; 
  total: number; 
  unit: string;
  color?: 'rose' | 'sky' | 'emerald' | 'amber';
}> = ({ label, value, total, unit, color = 'rose' }) => {
  const percentage = Math.min((value / total) * 100, 100);
  const isHigh = percentage > 85;
  const isCritical = percentage > 95;

  const colorMap = {
    rose: 'from-rose-600 to-rose-400',
    sky: 'from-sky-600 to-sky-400',
    emerald: 'from-emerald-600 to-emerald-400',
    amber: 'from-amber-600 to-amber-400'
  };

  const glowMap = {
    rose: 'shadow-[0_0_15px_rgba(225,29,72,0.6)]',
    sky: 'shadow-[0_0_15px_rgba(14,165,233,0.6)]',
    emerald: 'shadow-[0_0_15px_rgba(16,185,129,0.6)]',
    amber: 'shadow-[0_0_15px_rgba(245,158,11,0.6)]'
  };

  return (
    <div className="flex flex-col gap-4 p-8 bg-black/40 border-2 border-white/5 rounded-[2rem] group hover:border-white/10 transition-all duration-700 shadow-4xl relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
      <div className="flex justify-between items-end relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black font-mono text-white/20 uppercase tracking-[0.4em] italic">{label}</span>
          <span className="text-3xl font-black text-white italic tracking-tighter glint-elite">
            {value.toFixed(1)} <span className="text-[12px] text-white/30 uppercase tracking-widest ml-1">{unit}</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className={cn(
            "text-2xl font-black italic glint-elite",
            isCritical ? "text-rose-500 animate-pulse" : isHigh ? "text-amber-400" : "text-emerald-500/80"
          )}>
            {percentage.toFixed(0)}%
          </span>
          <span className="text-[8px] text-white/10 font-mono uppercase tracking-widest italic font-black">LTM_НАВАНТАЖЕННЯ</span>
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px] relative z-10 border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
          className={cn("h-full rounded-full relative bg-gradient-to-r", colorMap[color], glowMap[color])}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </motion.div>
      </div>
    </div>
  );
};

// ─── ResourceGuardTab ────────────────────────────────────────────────────────

export const ResourceGuardTab: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: infra, isLoading: infraLoading } = useInfraTelemetry();
  const { data: failover, isLoading: failoverLoading } = useFailoverStatus();
  const { llmTriStateMode, nodeSource } = useBackendStatus();
  const toggleFailover = useToggleFailover();

  // Константи згідно AGENTS.md
  const VRAM_TOTAL_LIMIT = 8.0; 
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
      <div className="flex flex-col items-center justify-center h-[700px] text-white/40 space-y-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05] pointer-events-none" />
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-2 border-rose-500/20 rounded-full border-t-rose-500 shadow-[0_0_30px_rgba(225,29,72,0.3)]"
          />
          <Shield className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="text-[14px] font-black font-mono uppercase tracking-[0.6em] animate-pulse italic text-rose-500/60">СИНХРОНІЗАЦІЯ_МЕТРИК_ЗАХИСТУ_V61...</div>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-16 max-w-[1700px] mx-auto relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-10 justify-between items-start lg:items-center relative z-10">
        <div className="flex flex-col gap-3 border-l-4 border-rose-500 pl-10 py-2">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic glint-elite">
              VRAM GUARD <span className="text-rose-500">& РЕСУРСНИЙ ДИСПЕТЧЕР</span>
            </h2>
            <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-lg text-[10px] font-black text-rose-500 tracking-[0.3em] uppercase italic shadow-2xl">
              RESOURCE_GUARD_v61.0
            </div>
          </div>
          <div className="flex items-center gap-8 text-[11px] font-black font-mono text-white/30 tracking-[0.2em] uppercase italic">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              <span className="text-emerald-500/80">СТАТУС_ЗАХИСТУ: {isCloudOverride ? 'CLOUD_OVERRIDE_ACTIVE' : 'OPTIMAL_RESERVE'}</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3">
               <ZapIcon size={14} className="text-rose-500/60" />
               <span>ЛІМІТ_VRAM: {VRAM_TOTAL_LIMIT} GB</span>
            </div>
            <span className="opacity-20">•</span>
            <div className="flex items-center gap-3 text-rose-500/40">
               <Shield size={14} />
               <span>РІВЕНЬ_ГАРДУ: ELITE_WRAITH_v3</span>
            </div>
          </div>
        </div>

        {/* Routing Indicator Badge */}
        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-3xl p-6 rounded-[2rem] border-2 border-white/5 shadow-4xl group">
           <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-black font-mono text-white/20 uppercase tracking-[0.4em] italic">СТРАТЕГІЯ_МАРШРУТИЗАЦІЇ</span>
              <span className="text-[12px] font-black text-white/60 italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors">{nodeSource}</span>
           </div>
           <div className="h-12 w-[2px] bg-white/5 mx-2" />
           <div className={cn(
             "px-8 py-4 rounded-[1.5rem] border-2 flex items-center gap-5 transition-all duration-700 shadow-4xl",
             llmTriStateMode === 'SOVEREIGN' ? "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-rose-500/10" :
             llmTriStateMode === 'HYBRID' ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500 shadow-emerald-500/10" :
             "bg-sky-500/10 border-sky-500/40 text-sky-500 shadow-sky-500/10"
           )}>
             <Globe size={20} className={cn("animate-spin-slow", llmTriStateMode === 'SOVEREIGN' ? "text-rose-500" : llmTriStateMode === 'HYBRID' ? "text-emerald-500" : "text-sky-500")} />
             <div className="flex flex-col">
                <span className="text-xl font-black tracking-widest italic glint-elite leading-none">{llmTriStateMode}</span>
                <span className="text-[8px] font-black font-mono uppercase tracking-[0.3em] opacity-40 mt-1">LLM_ROUTING_OODA</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12 relative z-10">
        
        {/* Left: VRAM Partitioning & Limits */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
          <div className="space-y-8">
            <div className="flex items-center gap-6 px-4">
               <div className="w-2 h-2 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
               <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">РОЗПОДІЛ_VRAM_8GB_GUARD</span>
            </div>
            
            <div className="space-y-6">
              <GuardMeter label="ЗАГАЛЬНЕ_ВИКОРИСТАННЯ_VRAM" value={currentVram} total={VRAM_TOTAL_LIMIT} unit="GB" color="rose" />
              
              <div className="p-8 glass-wraith border-2 border-white/5 rounded-[2.5rem] space-y-8 relative overflow-hidden shadow-4xl group">
                 <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                 <div className="flex justify-between items-center relative z-10">
                    <span className="text-[11px] font-black font-mono text-white/40 uppercase tracking-[0.4em] italic">Політика VRAM Guard:</span>
                    <div className="px-4 py-1.5 bg-rose-500/10 border-2 border-rose-500/40 rounded-xl text-[9px] font-black text-rose-500 uppercase tracking-widest italic animate-pulse shadow-rose-500/20">АКТИВНИЙ_ЗАХИСТ</div>
                 </div>
                 
                 <div className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-sky-500/20 transition-all duration-700">
                       <div className="flex items-center gap-4">
                          <div className="p-2 bg-sky-500/10 rounded-lg">
                             <Layout size={18} className="text-sky-400" />
                          </div>
                          <span className="text-[12px] text-white/80 uppercase font-black italic tracking-tighter">UI / OS Резерв</span>
                       </div>
                       <span className="text-[13px] font-black font-mono text-sky-400 italic">{VRAM_UI_OS_RESERVE} GB</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:border-rose-500/20 transition-all duration-700">
                       <div className="flex items-center gap-4">
                          <div className="p-2 bg-rose-500/10 rounded-lg">
                             <Cpu size={18} className="text-rose-400" />
                          </div>
                          <span className="text-[12px] text-white/80 uppercase font-black italic tracking-tighter">LLM Pool (Ollama)</span>
                       </div>
                       <span className="text-[13px] font-black font-mono text-rose-400 italic">{VRAM_LLM_POOL} GB</span>
                    </div>
                 </div>

                 {isCloudOverride && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-6 bg-rose-600 border-2 border-rose-400 rounded-3xl flex items-start gap-6 mt-4 shadow-4xl relative z-10"
                    >
                       <AlertTriangle size={24} className="text-white mt-1 animate-bounce" />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">CLOUD_OVERRIDE_TRIGGERED</span>
                          <p className="text-[9px] text-white/70 font-black leading-tight uppercase italic mt-1 tracking-widest">
                            Навантаження перевищує {CLOUD_OVERRIDE_THRESHOLD} ГБ. Автоматичне перемикання на хмарні потужності для стабільності.
                          </p>
                       </div>
                    </motion.div>
                 )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-6 px-4">
               <div className="w-2 h-2 bg-sky-500 rotate-45 shadow-[0_0_10px_rgba(14,165,233,1)]" />
               <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.5em] italic glint-elite">CPU_LOAD_CONTROL_L3</span>
            </div>
            <GuardMeter label="SYSTEM_CPU_LOAD_GLOBAL" value={stats?.cpu_percent ?? 0} total={100} unit="%" color="sky" />
          </div>
        </div>

        {/* Right: Nodes & Process Matrix */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Hybrid Node */}
            <div className="glass-wraith p-10 rounded-[3rem] border-2 border-white/5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-1000 shadow-4xl">
               <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black font-mono text-emerald-500/60 uppercase tracking-[0.4em] italic mb-2">ГЛОБАЛЬНИЙ_МАЙСТЕР</span>
                     <span className="text-2xl font-black text-white italic tracking-tighter uppercase glint-elite">HYBRID_MASTER_NVIDIA</span>
                  </div>
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border-2 border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all duration-700">
                     <Globe size={24} className="text-emerald-500 animate-spin-slow" />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1 group-hover:border-emerald-500/20 transition-all duration-700 shadow-inner">
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-widest italic">СТАТУС_ВУЗЛА</span>
                     <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest italic">АКТИВНИЙ_L3</span>
                  </div>
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1 group-hover:border-emerald-500/20 transition-all duration-700 shadow-inner">
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-widest italic">IP_АДРЕСА</span>
                     <span className="text-[12px] font-black text-white italic tracking-tighter font-mono">194.177.1.240</span>
                  </div>
               </div>

               <button 
                 disabled={llmTriStateMode === 'HYBRID'}
                 onClick={() => handleOffload('hybrid')}
                 className={cn(
                   "w-full py-5 text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] transition-all duration-700 border-2 italic shadow-4xl relative z-10 overflow-hidden group/btn",
                   llmTriStateMode === 'HYBRID' 
                     ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-default"
                     : "bg-white/5 border-white/10 text-white/40 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-white"
                 )}
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                 {llmTriStateMode === 'HYBRID' ? 'ПОТОЧНИЙ_МАЙСТЕР_АКТИВНИЙ' : 'АКТИВУВАТИ_HYBRID_ENGINE'}
               </button>
            </div>

            {/* Sovereign Node */}
            <div className="glass-wraith p-10 rounded-[3rem] border-2 border-white/5 relative overflow-hidden group hover:border-rose-500/40 transition-all duration-1000 shadow-4xl">
               <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
               <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black font-mono text-rose-500/60 uppercase tracking-[0.4em] italic mb-2">СУВЕРЕННИЙ_ОФЛОАД</span>
                     <span className="text-2xl font-black text-white italic tracking-tighter uppercase glint-elite">SOVEREIGN_NODE_IMAC</span>
                  </div>
                  <div className="p-4 bg-rose-500/10 rounded-2xl border-2 border-rose-500/20 group-hover:bg-rose-500/20 transition-all duration-700">
                     <Server size={24} className="text-rose-500" />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1 group-hover:border-rose-500/20 transition-all duration-700 shadow-inner">
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-widest italic">ЗВ'ЯЗОК_LAN</span>
                     <span className="text-[12px] font-black text-rose-500 uppercase tracking-tighter font-mono">192.168.0.199</span>
                  </div>
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1 group-hover:border-rose-500/20 transition-all duration-700 shadow-inner">
                     <span className="text-[8px] text-white/20 uppercase font-black tracking-widest italic">VRAM_LIMIT</span>
                     <span className="text-[12px] font-black text-white italic tracking-widest">8.0 GB_FIXED</span>
                  </div>
               </div>

               <button 
                 disabled={toggleFailover.isPending || llmTriStateMode === 'SOVEREIGN'}
                 onClick={() => handleOffload('sovereign')}
                 className={cn(
                   "w-full py-5 text-[11px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] transition-all duration-700 border-2 italic shadow-4xl relative z-10 group/btn",
                   llmTriStateMode === 'SOVEREIGN'
                     ? "bg-rose-500/10 border-rose-500/30 text-rose-400 cursor-default"
                     : "bg-rose-600 text-white border-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:bg-rose-500 hover:scale-[1.02]"
                 )}
               >
                 {toggleFailover.isPending ? (
                   <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                 ) : (
                   llmTriStateMode === 'SOVEREIGN' ? 'СУВЕРЕННИЙ_РЕЖИМ_АКТИВОВАНО' : 'АКТИВУВАТИ_СУВЕРЕННИЙ_ОФЛОАД'
                 )}
               </button>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
             <div className="flex items-center gap-6 px-4">
                <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(225,29,72,1)]" />
                <span className="text-[12px] font-black font-mono text-white/40 uppercase tracking-[0.6em] italic glint-elite">АКТИВНІ_ПРОЦЕСИ_ТА_ОФЛОАД_МАРШРУТИ_ELITE</span>
             </div>
             
             <div className="glass-wraith border-2 border-white/5 rounded-[3.5rem] p-4 h-[450px] overflow-y-auto custom-scrollbar shadow-4xl">
                {(infra?.nodes.flatMap(node => node.pods || []) || [
                  { name: 'Core API (Backend)', type: 'SVC', load: 'Високе', vram: '1.2 ГБ', status: 'Running' },
                  { name: 'Ingestion Worker', type: 'WRK', load: 'Середнє', vram: '0.4 ГБ', status: 'Running' },
                  { name: 'Graph Service (Neo4j)', type: 'DB', load: 'Середнє', vram: '1.8 ГБ', status: 'Running' },
                  { name: 'OpenSearch Node', type: 'SRCH', load: 'Низьке', vram: '0.9 ГБ', status: 'Running' },
                  { name: 'Kafka Cluster Head', type: 'MSG', load: 'Середнє', vram: '0.6 ГБ', status: 'Running' },
                ]).map((proc, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-6 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] group hover:border-rose-500/40 transition-all duration-700 mb-4 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-cyber-grid opacity-[0.01] pointer-events-none" />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-black/60 border-2 border-white/5 flex items-center justify-center font-black text-[10px] text-rose-500 uppercase italic shadow-inner group-hover:border-rose-500/20 transition-all">
                        {proc.type || 'SVC'}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-black text-white italic tracking-tighter uppercase glint-elite group-hover:text-rose-500 transition-colors">{proc.name}</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", proc.status === 'Running' ? "bg-emerald-500 shadow-emerald-500/40" : "bg-rose-500")} />
                             <span className="text-[9px] font-black font-mono text-white/30 uppercase tracking-widest italic">{proc.status}</span>
                          </div>
                          <span className="text-white/10">•</span>
                          <div className="flex items-center gap-2">
                             <Database size={10} className="text-white/20" />
                             <span className="text-[9px] font-black font-mono text-white/30 uppercase tracking-widest italic">VRAM: {proc.vram || 'Н/Д'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10 relative z-10">
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] text-white/10 uppercase font-black tracking-widest italic">ВУЗОЛ_ДИСЛОКАЦІЇ</span>
                          <div className="flex items-center gap-3">
                             {failover?.activeNode === 'local-k3s' ? <Monitor size={14} className="text-rose-500" /> : <Globe size={14} className="text-sky-500" />}
                             <span className={cn("text-[11px] font-black italic tracking-widest uppercase", failover?.activeNode === 'local-k3s' ? "text-rose-500" : "text-sky-400")}>
                               {failover?.activeNode?.replace('local-k3s', 'LOCAL_SOVEREIGN').replace('nvidia-server', 'NVIDIA_CLOUD') || 'INTERNAL_K3S'}
                             </span>
                          </div>
                       </div>
                       <button className="p-4 bg-white/5 border-2 border-white/5 rounded-2xl hover:bg-rose-500/10 hover:border-rose-500/40 transition-all duration-700 group/btn shadow-inner">
                          <ArrowRightLeft size={16} className="text-white/20 group-hover/btn:text-rose-500 group-hover/btn:rotate-180 transition-all duration-1000" />
                       </button>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
          .shadow-4xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.9); }
          .glint-elite { text-shadow: 0 0 30px rgba(225,29,72,0.4); }
          .animate-spin-slow { animation: spin 10s linear infinite; }
          .animate-shimmer { animation: shimmer 2s linear infinite; }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};

export default ResourceGuardTab;
