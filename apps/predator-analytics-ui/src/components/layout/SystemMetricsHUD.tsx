import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, Layout, Activity, Zap, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { systemApi, type SystemStatsResponse } from '@/services/api/system';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBackendStatus } from '@/hooks/useBackendStatus';

export const SystemMetricsHUD: React.FC = () => {
    const [stats, setStats] = useState<SystemStatsResponse | null>(null);
    const { nodes, activeFailover } = useBackendStatus();
    const activeNode = nodes.find(n => n.active);
    
    const nodeName = activeNode?.name || 'NVIDIA_MASTER';
    const isColab = activeFailover || nodeName.toLowerCase().includes('colab');

    const fetchStats = async () => {
        try {
            const data = await systemApi.getStats();
            setStats(data);
        } catch {
            // Degraded mode
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 3000); // 3s per user high-fidelity request
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const metrics = [
        {
            label: 'ВУЗОЛ СЕ� ВЕ� А',
            icon: isColab ? AlertCircle : Server,
            value: isColab ? 'GOOGLE_COLAB' : 'NVIDIA_PROD',
            sub: isColab ? 'FAILOVER_MODE' : 'PRIMARY_LINK_OK',
            color: isColab ? 'text-rose-500 animate-pulse' : 'text-emerald-400',
            bg: isColab ? 'bg-rose-500/10' : 'bg-emerald-500/5'
        },
        { 
            label: 'CPU_ЗАВАНТАЖЕННЯ', 
            icon: Cpu, 
            value: `${Math.round(stats.cpu_percent)}%`, 
            sub: `ЗАЛИШОК: ${100 - Math.round(stats.cpu_percent)}%`,
            color: stats.cpu_percent > 80 ? 'text-rose-500' : 'text-cyan-400'
        },
        { 
            label: 'ОПЕ� АТИВНА_ОЗП', 
            icon: Activity, 
            value: `${Math.round(stats.memory_percent)}%`, 
            sub: `ВІЛЬНО: ${(stats.memory_available / (1024**3)).toFixed(1)}ГБ / ${(stats.memory_total / (1024**3)).toFixed(1)}ГБ`,
            color: stats.memory_percent > 85 ? 'text-rose-500' : 'text-emerald-400'
        },
        { 
            label: 'GPU_ВІДЕОПАМЯТЬ', 
            icon: Zap, 
            value: stats.gpu_available ? `${Math.round(stats.gpu_utilization || 0)}%` : 'N/A', 
            sub: stats.gpu_available 
                ? `ВІЛЬНО: ${(((stats.gpu_mem_total || 0) - (stats.gpu_mem_used || 0)) / (1024**2)).toFixed(0)}МБ` 
                : 'GPU_ВІДСУТНІЙ',
            color: (stats.gpu_temp || 0) > 80 ? 'text-rose-500' : 'text-rose-400'
        },
        { 
            label: 'НАКОПИЧУВАЧ', 
            icon: HardDrive, 
            value: `${Math.round(stats.disk_percent)}%`, 
            sub: `ВІЛЬНО: ${(stats.disk_free / (1024**4)).toFixed(1)}ТБ`,
            color: 'text-indigo-400'
        }
    ];

    return (
        <div className="flex items-center gap-4">
            {metrics.map((m, i) => (
                <div 
                    key={m.label} 
                    className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 transition-all relative overflow-hidden h-8 rounded-md group",
                        m.bg || "bg-gradient-to-b from-white/[0.03] to-transparent",
                        "border border-white/5 hover:border-white/20 select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                        "hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                    )}
                >
                    {/* Hover light effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                    
                    <div className="flex items-center justify-center w-5 h-5 rounded-sm bg-black/60 border border-white/10 shadow-inner relative z-10">
                        <m.icon size={11} className={cn("shrink-0", m.color)} />
                    </div>
                    <div className="flex flex-col min-w-[90px] leading-none relative z-10">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.15em]">{m.label}</span>
                            <span className={cn("text-[10px] font-mono font-black tracking-tight", m.color)}>{m.value}</span>
                        </div>
                        <span className="text-[6px] font-bold text-slate-600 uppercase tracking-widest mt-1 group-hover:text-slate-400 transition-colors">{m.sub}</span>
                    </div>
                </div>
            ))}
            
            <div className="h-5 w-px bg-white/10 mx-1" />
            
            {/* Sync Indicator */}
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-white/[0.02] border border-white/5">
               <RefreshCw size={11} className="text-slate-600 animate-[spin_4s_linear_infinite]" />
               <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">
                  SYNC: 3s
               </span>
            </div>
        </div>
    );
};
