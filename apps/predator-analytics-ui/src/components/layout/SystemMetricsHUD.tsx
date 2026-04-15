import React, { useEffect, useState } from 'react';
import { Cpu, HardDrive, Layout, Activity, Zap, RefreshCw } from 'lucide-react';
import { systemApi, type SystemStatsResponse } from '@/services/api/system';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBackendStatus } from '@/hooks/useBackendStatus';

export const SystemMetricsHUD: React.FC = () => {
    const [stats, setStats] = useState<SystemStatsResponse | null>(null);
    const { nodes, activeFailover } = useBackendStatus();
    const activeNode = nodes.find(n => n.active)?.name || 'NVIDIA_MASTER';

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
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const metrics = [
        {
            label: 'ВУЗОЛ КЛАСТЕРА',
            icon: Layout,
            value: activeNode,
            sub: activeFailover ? 'FAILOVER ACTIVE' : 'PRIMARY STATUS: OK',
            color: activeFailover ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
        },
        { 
            label: 'ПРОЦЕСОР', 
            icon: Cpu, 
            value: `${Math.round(stats.cpu_percent)}%`, 
            sub: `${stats.cpu_count} ЯДЕР`,
            color: stats.cpu_percent > 80 ? 'text-rose-500' : 'text-cyan-400'
        },
        { 
            label: 'ПАМʼЯТЬ', 
            icon: Activity, 
            value: `${Math.round(stats.memory_percent)}%`, 
            sub: `${(stats.memory_used / (1024**3)).toFixed(1)}ГБ | ВІЛЬНО: ${(stats.memory_available / (1024**3)).toFixed(1)}ГБ`,
            color: stats.memory_percent > 85 ? 'text-rose-500' : 'text-emerald-400'
        },
        { 
            label: 'НАКОПИЧУВАЧ', 
            icon: HardDrive, 
            value: `${Math.round(stats.disk_percent)}%`, 
            sub: `${(stats.disk_used / (1024**4)).toFixed(1)}ТБ | ВІЛЬНО: ${(stats.disk_free / (1024**4)).toFixed(1)}ТБ`,
            color: 'text-indigo-400'
        },
        { 
            label: 'ВІДЕОЯДРО', 
            icon: Zap, 
            value: stats.gpu_available ? stats.gpu_name.replace('NVIDIA ', '') : 'N/A', 
            sub: stats.gpu_available 
                ? `${stats.gpu_temp}°C | ${stats.gpu_utilization}% Вик. | ${(stats.gpu_mem_used / (1024**2)).toFixed(0)}МБ` 
                : 'НЕВИЗНАЧЕНО',
            color: stats.gpu_temp > 80 ? 'text-rose-500' : 'text-amber-400'
        },
        {
            label: 'СИНХРОНІЗАЦІЯ',
            icon: RefreshCw,
            value: stats.last_sync ? formatDistanceToNow(new Date(stats.last_sync), { addSuffix: true, locale: uk }) : 'НЕМАЄ ДАНИХ',
            sub: 'КЛАСТЕР COLAB',
            color: 'text-sky-400'
        }
    ];

    return (
        <div className="flex items-center gap-4">
            {metrics.map((m, i) => (
                <div key={m.label} className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-xl group hover:border-white/10 transition-all">
                    <m.icon size={12} className={cn("shrink-0", m.color)} />
                    <div className="flex flex-col min-w-[70px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
                            <span className={cn("text-[9px] font-mono font-black", m.color)}>{m.value}</span>
                        </div>
                        <span className="text-[6px] font-bold text-slate-700 uppercase tracking-tighter -mt-0.5">{m.sub}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
