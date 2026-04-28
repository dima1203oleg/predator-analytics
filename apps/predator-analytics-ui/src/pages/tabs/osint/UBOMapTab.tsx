import React, { useState } from 'react';
import { 
    Map as MapIcon, 
    MapPin, 
    Globe, 
    Layers, 
    Navigation, 
    Search, 
    Target, 
    ShieldAlert, 
    Zap, 
    MousePointer2, 
    Crosshair,
    Maximize2,
    Settings2,
    Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { cn } from '@/utils/cn';

export const UBOMapTab: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    const startScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 3000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/40 relative overflow-hidden group">
            {/* Background Grid & FX */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.05),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Main Interactive Map Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Simulated Map Background */}
                <motion.div 
                    animate={isScanning ? { scale: 1.05, filter: 'grayscale(0) brightness(0.7)' } : { scale: 1, filter: 'grayscale(0.5) brightness(0.4)' }}
                    className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526770146552-5150d0adfe5d?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center transition-all duration-[3000ms]" 
                />
                
                {/* Scanner Overlay */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div 
                            initial={{ top: '-100%' }}
                            animate={{ top: '100%' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_20px_rgba(244,63,94,0.8)] z-20 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* Top Search & Filter Bar */}
                <div className="absolute top-6 left-6 right-6 z-30 flex items-center gap-4">
                    <div className="relative group/search flex-1 max-w-md">
                        <div className="absolute inset-0 bg-rose-500/5 blur-xl opacity-0 group-hover/search:opacity-100 transition-opacity" />
                        <input 
                            type="text" 
                            placeholder="ПОШУК ГЕО-ВУЗЛА АБО БЕНЕФІЦІА� А..."
                            className="w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-mono tracking-widest text-white focus:outline-none focus:border-rose-500/50 transition-all relative z-10"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover/search:text-rose-400 transition-colors z-10" />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/5">
                        {['ВУЗЛИ', 'МЕ� ЕЖІ', '� ИЗИКИ'].map((f) => (
                            <button key={f} className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <button 
                            onClick={startScan}
                            disabled={isScanning}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                                isScanning 
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                                : "bg-rose-500 text-black hover:bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                            )}
                        >
                            <Crosshair size={14} className={cn(isScanning && "animate-spin")} />
                            {isScanning ? 'СКАНУВАННЯ...' : 'ІНІЦІЮВАТИ СКАН'}
                        </button>
                    </div>
                </div>

                {/* Left Floating HUD: Tools */}
                <div className="absolute top-24 left-6 z-30 flex flex-col gap-3">
                    <TacticalCard className="!p-1.5 bg-slate-950/80 backdrop-blur-xl border-rose-500/20">
                        <div className="flex flex-col gap-1">
                            {[
                                { icon: Globe, label: 'Глобал' },
                                { icon: Layers, label: 'Шари' },
                                { icon: Navigation, label: 'Наві' },
                                { icon: Database, label: 'Дані' },
                                { icon: Target, label: 'Ціль' }
                            ].map((Tool, i) => (
                                <button key={i} className="p-3 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-all group relative">
                                    <Tool.icon size={20} />
                                    <span className="absolute left-16 bg-slate-900 border border-slate-700 text-white text-[9px] uppercase font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {Tool.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </TacticalCard>

                    <TacticalCard className="!p-3 bg-slate-950/80 backdrop-blur-xl border-white/5">
                        <div className="flex flex-col gap-3">
                             <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-600 uppercase">МАСШТАБ</span>
                                <div className="h-40 w-1.5 bg-slate-800 rounded-full relative overflow-hidden">
                                     <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
                                </div>
                             </div>
                        </div>
                    </TacticalCard>
                </div>

                {/* Center Target Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="w-64 h-64 border border-dashed border-rose-500/20 rounded-full"
                        />
                        <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 m-auto w-48 h-48 border border-dashed border-rose-500/10 rounded-full scale-125"
                        />
                        
                        <div className="absolute inset-0 m-auto flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className={cn(
                                    "p-6 rounded-full border transition-all duration-1000",
                                    isScanning ? "bg-rose-500/20 border-rose-500 animate-pulse" : "bg-slate-950/60 border-white/10"
                                )}>
                                    <MapIcon size={40} className={cn(isScanning ? "text-rose-400" : "text-slate-700")} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-1 italic">
                                        {isScanning ? 'ГЕНЕ� АЦІЯ_ВЕКТО� НОЇ_КА� ТИ' : 'MAP_ENGINE_IDLE'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-mono uppercase">
                                        GEO_SYNC: {isScanning ? '98%' : 'ГОТОВО'} [UBO_SCANNER_PRO_4.0]
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Active Nodes */}
                <div className="absolute top-24 right-6 bottom-24 w-80 z-30 pointer-events-none">
                    <AnimatePresence>
                        {!isScanning && (
                            <motion.div 
                                initial={{ x: 100, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="h-full flex flex-col gap-4 pointer-events-auto"
                            >
                                <TacticalCard className="bg-slate-950/90 backdrop-blur-xl border-white/5 flex flex-col max-h-full">
                                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Target size={14} className="text-red-500" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Активні Об'єкти</h4>
                                        </div>
                                        <span className="text-[9px] font-mono text-slate-500">4 ВИЯВЛЕНО</span>
                                    </div>
                                    
                                    <div className="space-y-2 overflow-y-auto pr-1">
                                        {[
                                            { name: 'ТОВ "ЕНЕ� ГО-Г� ИД"', risk: 92, status: 'К� ИТИЧНО', loc: 'Київ, Україна' },
                                            { name: 'OFFSHORE_VESTA_LTD', risk: 85, status: 'ВИСОКО', loc: 'Лімасол, Кіпр' },
                                            { name: 'GLOBAL_TRANS_LOGISTICS', risk: 42, status: 'СТАБІЛЬНО', loc: 'Варшава, Польща' },
                                            { name: 'PRIVATE_INVEST_GROUP', risk: 12, status: 'БЕЗПЕЧНО', loc: 'Лондон, Великобританія' },
                                        ].map((node, i) => (
                                            <div 
                                                key={i}
                                                onClick={() => setSelectedNode(node.name)}
                                                className={cn(
                                                    "p-3 rounded-xl border transition-all cursor-pointer group/node",
                                                    selectedNode === node.name 
                                                    ? "bg-rose-500/10 border-rose-500/50" 
                                                    : "bg-white/5 border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[11px] font-bold text-white group-hover/node:text-rose-400 transition-colors uppercase italic truncate max-w-[140px] leading-none">{node.name}</span>
                                                    <span className={cn(
                                                        "text-[8px] font-black px-1.5 py-0.5 rounded leading-none",
                                                        node.status === 'К� ИТИЧНО' ? 'bg-rose-500 text-white' : 
                                                        node.status === 'ВИСОКО' ? 'bg-orange-500 text-white' :
                                                        'bg-slate-800 text-slate-400'
                                                    )}>{node.status}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin size={10} className="text-slate-500" />
                                                        <span className="text-[9px] text-slate-500 uppercase font-mono">{node.loc}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400">{node.risk}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all">
                                        Завантажити Повний � еєстр
                                    </button>
                                </TacticalCard>

                                <TacticalCard className="bg-slate-950/90 backdrop-blur-xl border-rose-500/20">
                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Статус Аналізатора</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] text-slate-400">НАВАНТАЖЕННЯ_VRAM</span>
                                            <span className="text-[10px] font-mono text-rose-400 font-bold">4.2 GB</span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 w-[55%]" />
                                        </div>
                                        <p className="text-[9px] text-slate-500 italic leading-tight uppercase">
                                            Всі системи працюють в штатному режимі. Синхронізація з Qdrant успішна.
                                        </p>
                                    </div>
                                </TacticalCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Legend Overlay */}
                <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3">
                    <TacticalCard className="!px-6 !py-3 bg-slate-950/90 backdrop-blur-2xl border-white/10 flex items-center gap-8">
                        {[
                            { label: 'ОФШО� НА ЗОНА', color: 'bg-rose-600', glow: 'shadow-rose-600/50' },
                            { label: 'САНКЦІЙНА ЛОКАЦІЯ', color: 'bg-orange-500', glow: 'shadow-orange-500/50' },
                            { label: 'ПЕ� ЕВІ� ЕНИЙ UBO', color: 'bg-rose-400', glow: 'shadow-rose-400/50' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-[0_0_8px_currentColor] animate-pulse`} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{item.label}</span>
                            </div>
                        ))}
                    </TacticalCard>
                    
                    <button className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-2xl">
                        <Maximize2 size={18} />
                    </button>
                    <button className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-2xl">
                        <Settings2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UBOMapTab;

