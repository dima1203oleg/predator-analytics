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
            label: 'ВУЗОЛ СЕРВЕРА',
            icon: isColab ? AlertCircle : Server,
            value: isColab ? 'GOOGLE_COLAB' : 'NVIDIA_PROD',
            sub: isColab ? 'FAILOVER_MODE' : 'PRIMARY_LINK_OK',
            color: isColab ? 'text-amber-500 animate-pulse' : 'text-emerald-400',
            bg: isColab ? 'bg-amber-500/10' : 'bg-emerald-500/5'
        },
        { 
            label: 'CPU_ЗАВАНТАЖЕННЯ', 
            icon: Cpu, 
            value: `${Math.round(stats.cpu_percent)}%`, 
            sub: `ЗАЛИШОК: ${100 - Math.round(stats.cpu_percent)}%`,
            color: stats.cpu_percent > 80 ? 'text-rose-500' : 'text-cyan-400'
        },
        { 
            label: 'ОПЕРАТИВНА_ОЗП', 
            icon: Activity, 
            value: `${Math.round(stats.memory_percent)}%`, 
            sub: `ВІЛЬНО: ${(stats.memory_available / (1024**3)).toFixed(1)}ГБ / ${(stats.memory_total / (1024**3)).toFixed(1)}ГБ`,
            color: stats.memory_percent > 85 ? 'text-rose-500' : 'text-emerald-400'
        },
        { 
            label: 'GPU_ВІДЕОПАМЯТЬ', 
            icon: Zap, 
            value: stats.gpu_available ? `${stats.gpu_utilization || 0}%` : 'N/A', 
            sub: stats.gpu_available 
                ? `ВІЛЬНО: ${(((stats.gpu_mem_total || 0) - (stats.gpu_mem_used || 0)) / (1024**2)).toFixed(0)}МБ` 
                : 'GPU_ВІДСУТНІЙ',
            color: (stats.gpu_temp || 0) > 80 ? 'text-rose-500' : 'text-amber-400'
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
                        "flex items-center gap-2 px-3 py-1 border transition-all relative overflow-hidden h-7 rounded-sm",
                        m.bg || "bg-white/[0.01]",
                        "border-white/[0.05] hover:border-white/20 select-none group"
                    )}
                >
                    <div className="flex items-center justify-center p-1 rounded-sm bg-black/40 border border-white/5 shadow-inner">
                        <m.icon size={11} className={cn("shrink-0", m.color)} />
                    </div>
                    <div className="flex flex-col min-w-[100px] leading-none">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{m.label}</span>
                            <span className={cn("text-[9px] font-mono font-black", m.color)}>{m.value}</span>
                        </div>
                        <span className="text-[6px] font-bold text-slate-700 uppercase tracking-tighter mt-0.5 group-hover:text-slate-400 transition-colors">{m.sub}</span>
                    </div>
                </div>
            ))}
            
            <div className="h-4 w-px bg-white/10 mx-2" />
            
            {/* Sync Indicator */}
            <div className="flex items-center gap-3">
               <RefreshCw size={10} className="text-slate-800 animate-spin-slow" />
               <span className="text-[7px] font-black text-slate-800 uppercase tracking-widest">
                  SYNC_REFRESH: 3000ms
               </span>
            </div>
        </div>
    );
};
