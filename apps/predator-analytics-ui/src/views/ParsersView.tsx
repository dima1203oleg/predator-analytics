/**
 * PREDATOR v55.5 | Data Nexus Ingestion Hub — ЦЕНТР КЕРУВАННЯ ДЖЕРЕЛАМИ
 * 
 * Потужний інтерфейс для керування вхідними потоками даних (OSINT, API, Files).
 * - Візуалізація статусу конекторів та пайплайнів
 * - Реальний час моніторингу ETL процесів
 * - Преміальна кібернетична естетика з акцентами смарагдового та ціанового кольорів
 * - Повна локалізація (Українська)
 * 
 * © 2026 PREDATOR Analytics | High-Fidelity Data Engineering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, RefreshCw, Server, Shield, Globe, FileText,
    CheckCircle, XCircle, AlertTriangle, Play, Settings,
    Radio, MessageSquare, Lock, Plus, X, Link, Terminal, Upload,
    Activity, Zap, Search, Layers, Box, Cpu, HardDrive, Share2,
    ArrowUpRight, BarChart3, Cloud, Network, Smartphone, Eye,
    Trash2, Pause, Download, ChevronRight, Info, AlertCircle
} from 'lucide-react';

import { AdvancedBackground } from '../components/AdvancedBackground';
import { ViewHeader } from '../components/ViewHeader';
import { TacticalCard } from '../components/TacticalCard';
import { CyberOrb } from '../components/CyberOrb';
import { CyberGrid } from '../components/CyberGrid';
import { PipelineMonitor } from '../components/pipeline/PipelineMonitor';
import { api } from '../services/api';
import { cn } from '../utils/cn';
import { Badge } from '@/components/ui/badge';

// ========================
// Types & Constants
// ========================

interface Connector {
    id: string;
    name: string;
    type: 'api' | 'scraper' | 'file' | 'stream' | 'telegram' | 'website';
    status: 'active' | 'idle' | 'error' | 'syncing';
    lastSync: string;
    itemsCount: number;
    description: string;
    throughput: string;
}

const CONNECTOR_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    telegram: { icon: MessageSquare, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)', border: 'rgba(14, 165, 233, 0.3)' },
    website: { icon: Globe, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)' },
    file: { icon: FileText, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
    api: { icon: Cloud, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
    stream: { icon: Radio, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)' },
};

// ========================
// Sub-components
// ========================

const ConnectorCard: React.FC<{ connector: Connector; onSync: (id: string) => void }> = ({ connector, onSync }) => {
    const config = CONNECTOR_TYPE_CONFIG[connector.type] || CONNECTOR_TYPE_CONFIG.api;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className={cn(
                "bg-slate-950/40 border rounded-[32px] p-8 relative overflow-hidden group transition-all panel-3d",
                connector.status === 'error' ? 'border-rose-500/30 shadow-[0_20px_40px_-10px_rgba(244,63,94,0.1)]' :
                connector.status === 'active' ? 'border-emerald-500/20 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.1)]' :
                'border-white/5 hover:border-white/20'
            )}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Icon size={120} style={{ color: config.color }} />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="p-4 rounded-2xl border bg-slate-900 border-white/10 text-white" style={{ color: config.color }}>
                    <Icon size={28} className={cn(connector.status === 'syncing' && "animate-spin")} />
                </div>
                <div className="flex gap-3">
                    <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white transition-all">
                        <Settings size={16} />
                    </button>
                    <button
                        onClick={() => onSync(connector.id)}
                        disabled={connector.status === 'syncing'}
                        className={cn(
                            "p-3 rounded-xl border transition-all",
                            connector.status === 'syncing' ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-wait" :
                            "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                        )}
                    >
                        {connector.status === 'syncing' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} className="fill-current" />}
                    </button>
                </div>
            </div>

            <div className="relative z-10 mb-8">
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2 group-hover:text-emerald-400 transition-colors uppercase">{connector.name}</h3>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed line-clamp-2 italic">{connector.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 pt-6 border-t border-white/5">
                <div>
                     <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">СИНХРОНІЗОВАНО</p>
                     <p className="text-sm font-black text-white italic">{connector.itemsCount.toLocaleString()} <span className="text-[8px] text-slate-700">OBJ</span></p>
                </div>
                <div className="text-right">
                     <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">ШВИДКІСТЬ</p>
                     <p className="text-sm font-black text-emerald-400 italic">{connector.throughput}</p>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
                <Badge className={cn(
                    "font-black text-[9px] px-3 py-1 italic tracking-widest uppercase",
                    connector.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/10" :
                    connector.status === 'syncing' ? "bg-blue-500/20 text-blue-400 border border-blue-500/10 animate-pulse" :
                    connector.status === 'error' ? "bg-rose-500/20 text-rose-400 border border-rose-500/10" :
                    "bg-slate-800 text-slate-500 border border-white/5"
                )}>
                    {connector.status === 'active' ? '● ACTIVE' : connector.status === 'syncing' ? '● SYNCING' : connector.status.toUpperCase()}
                </Badge>
                <span className="text-[9px] font-mono text-slate-600 font-bold">{connector.lastSync}</span>
            </div>
        </motion.div>
    );
};

// ========================
// Main Component
// ========================

const ParsersView: React.FC = () => {
    const [connectors, setConnectors] = useState<Connector[]>([
        { id: '1', name: 'Держмитслужба API', type: 'api', status: 'active', lastSync: '2хв тому', itemsCount: 124502, description: 'Центральний шлюз митних декларацій України.', throughput: '1.2 GB/s' },
        { id: '2', name: 'Telegram Monitoring', type: 'telegram', status: 'active', lastSync: '10с тому', itemsCount: 45821, description: 'Канали: Митна Варта, Кордон_Інфо, OSINT_UA.', throughput: '42 msg/s' },
        { id: '3', name: 'Import_Dump_2026', type: 'file', status: 'idle', lastSync: '5г тому', itemsCount: 8904, description: 'Масив даних імпорту за Q1 2026 (CSV).', throughput: '0 B/s' },
        { id: '4', name: 'Data.gov.ua Scraper', type: 'website', status: 'error', lastSync: '14г тому', itemsCount: 3342, description: 'Парсер відкритих даних порталу data.gov.ua.', throughput: 'ERR_403' },
    ]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    const handleSync = async (id: string) => {
        setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'syncing' } : c));
        // api call would go here
        setTimeout(() => {
            setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: 'active', lastSync: 'тиль-що' } : c));
        }, 3000);
    };

    return (
        <div className="min-h-screen p-8 lg:p-12 relative overflow-hidden animate-in fade-in duration-1000">
            <AdvancedBackground />
            <CyberGrid color="rgba(16, 185, 129, 0.05)" />

            <div className="max-w-[1700px] mx-auto space-y-12 relative z-10 w-full pb-20">
                
                {/* View Header v55.5 */}
                <ViewHeader
                    title={
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full scale-150 opacity-20" />
                                <div className="relative p-5 bg-slate-900 border border-white/5 rounded-[28px] panel-3d shadow-2xl overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                                    <Cloud size={36} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none italic skew-x-[-4deg]">
                                    Data <span className="text-emerald-400">Nexus</span>
                                </h1>
                                <p className="text-[11px] font-mono font-black text-slate-500 uppercase tracking-[0.4em] mt-2 italic">
                                    INGESTION_HUB // ЦЕНТР_ІНДЕСАЦІЇ_ДАНИХ
                                </p>
                            </div>
                        </div>
                    }
                    breadcrumbs={['СИСТЕМА', 'ПАЙПЛАЙН', 'ДЖЕРЕЛА']}
                    stats={[
                        { label: 'АКТИВНІ', value: '12/14', icon: <Database size={14} />, color: 'success' },
                        { label: 'ПРИРІСТ (24г)', value: '+4.2M', icon: <ArrowUpRight size={14} />, color: 'success' },
                        { label: 'ШВИДКІСТЬ', value: '422MB/s', icon: <Zap size={14} />, color: 'warning' },
                    ]}
                />

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: 'ЗАГАЛЬНИЙ ОБ\'ЄМ', value: '84.2 TB', icon: Server, color: 'slate' },
                        { label: 'ОБРОБЛЕНО (24г)', value: '1.4M', icon: Activity, color: 'emerald' },
                        { label: 'WORKERS АКТИВНО', value: '32', icon: Cpu, color: 'sky' },
                        { label: 'ЧЕРГА ІНДЕКСАЦІЇ', value: '12,402', icon: Layers, color: 'purple' },
                    ].map((m, i) => (
                        <TacticalCard key={i} variant="glass" className="p-6 rounded-[32px] flex items-center gap-6 border-white/5 bg-slate-900/40">
                            <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl text-slate-400">
                                <m.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{m.label}</p>
                                <p className="text-2xl font-black text-white italic tracking-tighter tabular-nums">{m.value}</p>
                            </div>
                        </TacticalCard>
                    ))}
                </div>

                <div className="flex justify-between items-center px-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
                        <Network className="text-emerald-400" size={20} /> CONNECTORS_CONTROL_PANEL
                    </h2>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="px-10 py-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_-15px_rgba(16,185,129,0.5)] border border-white/20 transition-all flex items-center gap-4 group italic"
                    >
                        <Plus size={20} className="group-hover:rotate-180 transition-transform duration-500" /> REGISTER_NEW_SOURCE
                    </motion.button>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {connectors.map(c => (
                        <ConnectorCard key={c.id} connector={c} onSync={handleSync} />
                    ))}
                    
                    {/* Placeholder for "Add" */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="border-2 border-dashed border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 text-slate-600 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all group min-h-[300px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                            <Plus size={32} />
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-[0.5em] italic">ADD_DATA_NODE</span>
                    </button>
                </div>

                {/* ETL Status Panel */}
                <TacticalCard variant="holographic" title="Pipeline Health Index" className="p-10 bg-slate-950/40 border-white/5 rounded-[60px] panel-3d shadow-2xl">
                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        <div className="w-full lg:w-1/3 relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full scale-150 animate-pulse" />
                             <div className="relative text-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">HEALTH_SCORE</p>
                                <p className="text-7xl font-black text-emerald-400 italic tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">98.2<span className="text-2xl text-slate-700">%</span></p>
                            </div>
                        </div>
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'PARSING_ACCURACY', value: '99.4%', status: 'optimal', icon: CheckCircle },
                                { label: 'ENRICHMENT_LATENCY', value: '142ms', status: 'optimal', icon: Zap },
                                { label: 'DROP_RATE', value: '0.002%', status: 'optimal', icon: AlertCircle },
                            ].map((s, i) => (
                                <div key={i} className="p-6 bg-slate-900/60 border border-white/5 rounded-3xl flex flex-col gap-2 group hover:border-emerald-500/40 transition-all">
                                    <div className="flex justify-between items-center">
                                        <s.icon size={16} className="text-emerald-400 group-hover:scale-125 transition-transform" />
                                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black border-none italic">OPTIMAL</Badge>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-2">{s.label}</p>
                                    <p className="text-2xl font-black text-white italic tabular-nums">{s.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="w-full lg:w-auto">
                            <button className="w-full lg:w-auto px-10 py-6 bg-white/5 border border-white/10 rounded-[30px] text-[10px] font-black text-white uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 group italic">
                                VIEW_SYSTEM_LOGS <Terminal size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .panel-3d {
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .panel-3d:hover {
                    transform: translateY(-10px) rotateX(2deg);
                    box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8);
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                    animation: shimmer 10s linear infinite;
                    background-size: 200% 100%;
                }
            `}} />
        </div>
    );
};

export default ParsersView;
