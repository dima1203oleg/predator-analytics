/**
 * 🛰️ OSINT COMMAND CENTER (v56.2-TITAN REFACTORED)
 * Оптимізована версія з використанням useOsintNexus та модульних компонентів.
 * Усі тексти — українською (HR-03/HR-04).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Radar, Search, ShieldAlert, Globe, 
    Activity, Database, Terminal, Layers,
    Zap, AlertTriangle, ChevronRight, Filter
} from 'lucide-react';

import { useOsintNexus } from './sub/useOsintNexus';
import { RadarBackground, RiskHeatmapBar, FeedItemRow } from './sub/OsintVisuals';
import { CATEGORY_ICONS } from './sub/OsintTypes';
import { cn } from '@/lib/utils';

export const OsintCommandCenter: React.FC = () => {
    const { 
        stats, feed, tools, registryCategories, 
        globalRiskScore, isScanning, activeTarget,
        runQuickScan 
    } = useOsintNexus();

    const [searchInput, setSearchInput] = useState('');

    return (
        <div className="relative min-h-screen bg-[#05070a] text-slate-200 p-6 font-sans overflow-hidden select-none">
            {/* ─── Анімований Фон (Радар) ────────────────────── */}
            <RadarBackground />

            {/* ─── ВЕРХНЯ ПАНЕЛЬ (HUD) ──────────────────────── */}
            <header className="relative z-10 flex items-center justify-between mb-8 backdrop-blur-md bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <Radar className={cn("text-cyan-400", isScanning && "animate-spin")} size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                            OSINT COMMAND CENTER
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono">v56.2-TITAN</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Intelligence & Registry Nexus</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Global Risk Level</div>
                        <div className={cn(
                            "text-2xl font-black font-mono",
                            globalRiskScore > 70 ? "text-red-500" : globalRiskScore > 40 ? "text-amber-500" : "text-emerald-500"
                        )}>
                            {globalRiskScore}%
                        </div>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-800" />
                    <div className="flex gap-2">
                        {stats && (
                            <>
                                <div className="p-2 text-center">
                                    <div className="text-[9px] text-slate-500 font-bold uppercase">Active Scans</div>
                                    <div className="text-sm font-black text-white">{stats.activeScans}</div>
                                </div>
                                <div className="p-2 text-center text-red-400">
                                    <div className="text-[9px] text-slate-500 font-bold uppercase">Critical</div>
                                    <div className="text-sm font-black">{stats.criticalAlerts}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── ОСНОВНА СІТКА ────────────────────────────── */}
            <div className="relative z-10 grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                
                {/* 📊 ЛІВА ПАНЕЛЬ: МОНІТОРИНГ ТА РИЗИКИ (3 cols) */}
                <aside className="col-span-3 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* RISK HEATMAP */}
                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-xl">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} className="text-cyan-400" />
                            Ризики по реєстрах
                        </h3>
                        <div className="space-y-4">
                            {stats?.riskHeatmap.map((item, i) => (
                                <RiskHeatmapBar key={item.source} {...item} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* REGISTRY STATUS */}
                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-xl">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Database size={14} className="text-cyan-400" />
                            Мережа реєстрів
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {registryCategories.map((cat) => {
                                const CategoryIcon = CATEGORY_ICONS[cat.id] ?? Globe;

                                return (
                                    <div
                                        key={cat.id}
                                        className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-cyan-500/30 transition-all cursor-pointer group"
                                    >
                                        <div className={cn("mb-2 flex items-center justify-between", cat.color)}>
                                            <CategoryIcon size={14} />
                                            <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100 transition-opacity">{cat.count}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{cat.name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* 🎯 ЦЕНТРАЛЬНА ПАНЕЛЬ: ПОШУК ТА ІНСТРУМЕНТИ (6 cols) */}
                <main className="col-span-6 space-y-6 flex flex-col">
                    {/* SEARCH NEXUS */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
                                <Zap className="text-cyan-400" />
                                Глобальний Пошук
                            </h2>
                            <p className="text-slate-400 text-xs mb-6 max-w-lg font-medium">
                                Введіть ЄДРПОУ, ПІБ або митний код для миттєвого сканування по 250+ реєстрах України та Світу.
                            </p>
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={20} />
                                <input 
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Введіть запит (напр. '32250101' або 'ПАТ Нафтогаз')..."
                                    className="w-full bg-slate-950/80 border-2 border-slate-800 rounded-2xl py-5 pl-16 pr-24 text-lg font-bold text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-slate-600 shadow-inner"
                                />
                                <button 
                                    onClick={() => runQuickScan(searchInput)}
                                    disabled={isScanning || !searchInput}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-12 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    {isScanning ? 'СКАНУВАННЯ...' : 'ЗАПУСК'}
                                </button>
                            </div>
                        </div>
                        {/* DECORATIVE ELEMENTS */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/5 blur-[80px] -z-10" />
                    </div>

                    {/* ACTIVE TOOLS INFRASTRUCTURE */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Terminal size={14} className="text-emerald-400" />
                                Активна Інфраструктура (AI Agents)
                            </h3>
                            <button className="text-[9px] font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-1 uppercase">
                                Всі модулі <ChevronRight size={10} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
                            {tools.map((tool) => (
                                <motion.div 
                                    key={tool.id}
                                    whileHover={{ y: -4 }}
                                    className="p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3 relative z-10">
                                        <div className={cn("p-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 group-hover:bg-emerald-500/10 transition-colors")}>
                                            <Layers size={16} />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", tool.status === 'СКАНУЄ' ? 'bg-cyan-400' : 'bg-emerald-400')} />
                                            <span className="text-[8px] font-black text-slate-400 tracking-wider uppercase">{tool.status}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors mb-1 relative z-10">{tool.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mb-3 relative z-10">{tool.category}</p>
                                    <div className="flex items-end justify-between relative z-10">
                                        <div>
                                            <div className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Знахидок</div>
                                            <div className="text-sm font-black text-white font-mono">{tool.findings}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Точність</div>
                                            <div className="text-sm font-black text-emerald-400 font-mono">{tool.accuracy}%</div>
                                        </div>
                                    </div>
                                    {/* PROGRESS BAR IF SCANNING */}
                                    {tool.status === 'СКАНУЄ' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                                            <motion.div 
                                                className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                animate={{ width: ['0%', '100%'] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* 📡 ПРАВА ПАНЕЛЬ: ЖИВА СТРІЧКА (3 cols) */}
                <aside className="col-span-3 flex flex-col bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-xl h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-rose-500" />
                            Live Intelligence Feed
                        </h3>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                             <span className="text-[9px] font-black text-rose-500 uppercase">Live</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {feed.length > 0 ? (
                            feed.map((item, i) => (
                                <FeedItemRow key={item.id} item={item} index={i} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-30 text-center grayscale">
                                <AlertTriangle size={32} className="mb-2" />
                                <div className="text-[10px] font-black uppercase">Очікування потоку...</div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/50">
                        <button className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                            Переглянути всі логи
                        </button>
                    </div>
                </aside>

            </div>

            {/* ─── НИЖНЯ ПАНЕЛЬ СТАТУСУ (FOOTER) ──────────────── */}
            <footer className="fixed bottom-0 left-0 right-0 h-10 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50 flex items-center justify-between px-8 text-[10px] z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Router: http://localhost:4000 (CONNECTED)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-slate-400 font-bold uppercase tracking-wider">Sync: All Registries ACTIVE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 font-mono text-slate-500 uppercase font-black">
                    <span>Region: UA_EAST_CLSTR_01</span>
                    <span className="text-slate-800">|</span>
                    <span>Lat: 24ms</span>
                    <span className="text-slate-800">|</span>
                    <span className="text-cyan-500/50">Enc: AES-256-OSINT</span>
                </div>
            </footer>
        </div>
    );
};

export default OsintCommandCenter;
