import React from 'react';
import { motion } from 'framer-motion';
import { Server, Globe, Shield, Zap, Database, Cpu, Cloud, Link as LinkIcon } from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { cn } from '@/utils/cn';

interface NodeProps {
    id: string;
    label: string;
    type: 'master' | 'mirror' | 'external';
    status: 'online' | 'offline' | 'active';
    description: string;
    stats?: string;
}

const TopologyNode: React.FC<NodeProps> = ({ label, type, status, description, stats }) => {
    const isOnline = status !== 'offline';
    const isActive = status === 'active';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative p-4 rounded-xl border backdrop-blur-md transition-all duration-500",
                isActive ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : 
                isOnline ? "bg-white/5 border-white/10" : "bg-amber-500/5 border-amber-500/30 opacity-60"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-emerald-500/20 text-emerald-400" : 
                    isOnline ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/20 text-amber-400"
                )}>
                    {type === 'master' && <Server size={18} />}
                    {type === 'mirror' && <Cloud size={18} />}
                    {type === 'external' && <Globe size={18} />}
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">{label}</h4>
                    <p className="text-[9px] text-slate-500 mt-1">{description}</p>
                    {stats && <div className="text-[8px] font-mono text-slate-400 mt-2">{stats}</div>}
                </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isActive ? "bg-emerald-500 animate-pulse" : 
                    isOnline ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <span className="text-[7px] font-black uppercase text-slate-600">
                    {status === 'active' ? 'CONNECTED' : status.toUpperCase()}
                </span>
            </div>
        </motion.div>
    );
};

const ConnectionLine: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
    <div className="relative flex-1 h-px bg-white/10 mx-2 flex items-center justify-center min-w-[40px]">
        {active && (
            <motion.div 
                className="absolute inset-x-0 h-px bg-emerald-500/50"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, repeat: Infinity }}
            />
        )}
        <span className="absolute -top-3 text-[7px] font-bold text-slate-600 uppercase tracking-tighter whitespace-nowrap">
            {label}
        </span>
    </div>
);

export const ClusterTopology: React.FC = () => {
    const { nodes, activeFailover } = useBackendStatus();
    
    const nvidiaNode = nodes.find(n => n.id === 'nvidia');
    const colabNode = nodes.find(n => n.id === 'colab');

    return (
        <div className="flex flex-col gap-6 p-4">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <LinkIcon size={16} className="text-yellow-400" /> ТОПОЛОГІЯ КЛАСТЕРА v58.2
            </h3>

            <div className="flex items-center justify-between gap-2">
                {/* NVIDIA Master */}
                <TopologyNode 
                    id="nvidia"
                    label="NVIDIA_MASTER"
                    type="master"
                    status={nvidiaNode?.active ? 'active' : (nvidiaNode?.status === 'online' ? 'online' : 'offline')}
                    description="Локальний обчислювальний вузол (Primary)"
                    stats="RTX 4090 | 16-Core | 10G-LAN"
                />

                <ConnectionLine active={!activeFailover && nvidiaNode?.status === 'online'} label="ZROK TUNNEL" />

                {/* Secure Gateway */}
                <div className="flex flex-col items-center gap-1">
                    <div className="p-3 rounded-full bg-slate-900 border border-white/20 text-yellow-400 shadow-[0_0_15px_rgba(129,140,248,0.2)]">
                        <Shield size={20} />
                    </div>
                </div>

                <ConnectionLine active={activeFailover && colabNode?.status === 'online'} label="ZROK FAILOVER" />

                {/* Colab Mirror */}
                <TopologyNode 
                    id="colab"
                    label="COLAB_MIRROR"
                    type="mirror"
                    status={colabNode?.active ? 'active' : (colabNode?.status === 'online' ? 'online' : 'offline')}
                    description="Резервний хмарний кластер (Mirror)"
                    stats="Tesla T4 | Mirror Sync Active"
                />
            </div>

            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase text-slate-300">Статус Автономності</span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                        {activeFailover 
                            ? "🚨 УВАГА: Основний вузол недоступний. Працюємо через хмарний резерв Colab Mirror."
                            : "✅ ОПТИМАЛЬНО: Пряме з'єднання з NVIDIA Master активне. Синхронізація дзеркала в нормі."}
                    </p>
                </div>
                <div className="px-3 py-1 rounded bg-white/5 border border-white/10">
                    <span className="text-[8px] font-mono text-slate-400">LATENCY: 42ms</span>
                </div>
            </div>
        </div>
    );
};
