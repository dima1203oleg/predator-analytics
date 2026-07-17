import { Button } from '@/components/ui/button';
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useSceneStore } from '../../stores/sceneStore';
import { FileText, X, AlertTriangle, ScanLine } from 'lucide-react';

export const SmartPDFOverlayInner: React.FC = () => {
    const { activeZone, setActiveZone } = useSceneStore();

    if (activeZone !== 'documents') return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-auto z-[110] font-sans text-slate-200"
        >
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 w-full h-full rounded-2xl flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative">
                
                {/* Decorative scanning line */}
                <div className="absolute inset-x-0 h-px bg-cyan-500/50 top-0 shadow-[0_0_10px_#06b6d4] animate-[scan_3s_ease-in-out_infinite]" />

                {/* Header */}
                <div className="h-14 border-b border-white/5 bg-white/5 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <FileText size={16} className="text-cyan-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black tracking-widest text-white uppercase">АГЕНТ.pdf</span>
                            <span className="text-[10px] text-cyan-500 tracking-widest uppercase flex items-center gap-1">
                                <ScanLine size={10} /> Аналіз завершено
                            </span>
                        </div>
                    </div>
                    
                    <Button variant="ghost" 
                        onClick={() => setActiveZone('none')}
                        className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl p-2 h-auto"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar with Meta Data */}
                    <div className="w-64 border-r border-white/5 bg-black/20 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div>
                            <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3">Метадані Документа</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Джерело:</span>
                                    <span className="text-white font-mono">Одеська митниця</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Дата:</span>
                                    <span className="text-white font-mono">2026-07-12</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Тип:</span>
                                    <span className="text-white">Митна декларація</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3">Виявлені Сутності</h4>
                            <div className="space-y-2 text-xs font-mono">
                                <div className="p-2 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center gap-2 cursor-pointer hover:bg-amber-500/20 transition-colors">
                                    <AlertTriangle size={12} /> ТОВ "АЛЬФА"
                                </div>
                                <div className="p-2 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 cursor-pointer hover:bg-cyan-500/20 transition-colors">
                                    Іванов І.І.
                                </div>
                                <div className="p-2 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400 cursor-pointer hover:bg-purple-500/20 transition-colors">
                                    CXDU1234567
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PDF Document View */}
                    <div className="flex-1 p-8 text-slate-300 font-sans text-sm overflow-y-auto leading-relaxed relative custom-scrollbar">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik00MCAwSDBWNDBoNDBWem0tMSAxSDFWMzlzMzlWMXoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPgo8L3N2Zz4=')]" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <div className="pb-4 border-b border-white/10 mb-6">
                                <h1 className="text-2xl font-black text-white tracking-tight">РОЗШИРЕНИЙ ЗВІТ ДІЯЛЬНОСТІ</h1>
                                <p className="text-slate-500 mt-2 font-mono text-xs">ID: DOC-2026-8891-ALPHA | CONFIDENTIAL</p>
                            </div>

                            <p className="text-base leading-7">
                                Цей документ містить автоматично згенерований звіт щодо діяльності компанії <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-500/30 transition-colors font-mono">ТОВ "АЛЬФА"</span>.
                            </p>
                            
                            <p className="text-base leading-7">
                                Згідно з даними реєстрів, посаду генерального директора обіймає <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded cursor-pointer hover:bg-cyan-500/30 transition-colors font-mono">Іванов І.І.</span>.
                            </p>
                            
                            <div className="p-4 rounded-xl border border-white/5 bg-white/5 my-6 border-l-4 border-l-purple-500">
                                <p className="text-sm">
                                    Система AI Risk Engine виявила аномальне транспортування контейнеру <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded cursor-pointer hover:bg-purple-500/30 transition-colors font-mono font-bold">CXDU1234567</span> через митний контроль.
                                </p>
                            </div>

                            <p className="text-sm text-slate-400 italic">
                                Рекомендовано провести поглиблений аналіз ланцюга постачання та зв'язків з іншими підрядниками.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const SmartPDFOverlay = memo(SmartPDFOverlayInner);
