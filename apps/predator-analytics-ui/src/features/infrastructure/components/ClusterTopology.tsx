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
                isOnline ? "bg-white/5 border-white/10" : "bg-rose-500/5 border-rose-500/30 opacity-60"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-lg",
                    isActive ? "bg-emerald-500/20 text-emerald-400" : 
                    isOnline ? "bg-rose-500/10 text-rose-500" : "bg-rose-900/40 text-rose-600"
                )}>
                    {type === 'master' && <Server size={18} />}
                    {type === 'mirror' && <Cloud size={18} />}
                    {type === 'external' && <Globe size={18} />}
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white leading-none">{label}</h4>
                    <p className="text-[9px] text-slate-500 mt-2 uppercase font-bold tracking-tight">{description}</p>
                    {stats && <div className="text-[8px] font-mono text-rose-500/70 mt-2 font-black tracking-widest">{stats}</div>}
                </div>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_8px]",
                    isActive ? "bg-emerald-500 animate-pulse shadow-emerald-500/50" : 
                    isOnline ? "bg-emerald-500 shadow-emerald-500/50" : "bg-rose-600 shadow-rose-600/50"
                )} />
                <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">
                    {status === 'active' ? 'АКТИВНИЙ' : status === 'online' ? 'ОНЛАЙН' : 'ОФЛАЙН'}
                </span>
            </div>
        </motion.div>
    );
};

const ConnectionLine: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
    <div className="relative flex-1 h-px bg-white/10 mx-2 flex items-center justify-center min-w-[40px]">
        {active && (
            <motion.div 
                className="absolute inset-x-0 h-px bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, repeat: Infinity }}
            />
        )}
        <span className="absolute -top-3 text-[7px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">
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
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <LinkIcon size={16} className="text-rose-500" /> ТОПОЛОГІЯ_КЛАСТЕ� А_WRAITH
                </h3>
                <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                    v58.2-ELITE
                </div>
            </div>

            <div className="flex items-center justify-between gap-2">
                {/* NVIDIA Master */}
                <TopologyNode 
                    id="nvidia"
                    label="NVIDIA_ГОЛОВНИЙ"
                    type="master"
                    status={nvidiaNode?.active ? 'active' : (nvidiaNode?.status === 'online' ? 'online' : 'offline')}
                    description="Локальний обчислювальний вузол"
                    stats="RTX 4090 | 16-Core | 10G-LAN"
                />

                <ConnectionLine active={!activeFailover && nvidiaNode?.status === 'online'} label="ТУНЕЛЬ_ZROK" />

                {/* Secure Gateway */}
                <div className="flex flex-col items-center gap-1">
                    <div className="p-3 rounded-full bg-slate-950 border border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                        <Shield size={20} />
                    </div>
                </div>

                <ConnectionLine active={activeFailover && colabNode?.status === 'online'} label="� ЕЗЕ� В_ZROK" />

                {/* Colab Mirror */}
                <TopologyNode 
                    id="colab"
                    label="COLAB_ДЗЕ� КАЛО"
                    type="mirror"
                    status={colabNode?.active ? 'active' : (colabNode?.status === 'online' ? 'online' : 'offline')}
                    description="� езервний хмарний кластер"
                    stats="Tesla T4 | Mirror Sync Active"
                />
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-white/5 flex items-center gap-4 relative overflow-hidden group">
                <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-rose-500" />
                        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Статус Автономності</span>
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tight">
                        {activeFailover 
                            ? "🚨 УВАГА: Основний вузол недоступний. Працюємо через хмарний резерв Colab Mirror."
                            : "✅ ОПТИМАЛЬНО: Пряме з'єднання з NVIDIA Master активне. Синхронізація дзеркала в нормі."}
                    </p>
                </div>
                <div className="px-3 py-1 rounded bg-black/40 border border-white/10 relative z-10">
                    <span className="text-[9px] font-black font-mono text-rose-500 uppercase tracking-widest">ЗАТ� ИМКА: 42ms</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );
};
