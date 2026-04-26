/**
 * 💻 PTY TERMINAL // ПУЛЬТ УПРАВЛІННЯ | v61.0-ELITE
 * Інтерфейс для прямої взаємодії з кластером.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, Activity, ChevronRight, Command, Server, Globe, Cpu, Radio, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TerminalLine {
    text: string;
    type: 'input' | 'output' | 'error' | 'system';
    timestamp: string;
}

export const PtyTerminal: React.FC = () => {
    const [lines, setLines] = useState<TerminalLine[]>([
        { text: 'PREDATOR OS v61.0-ELITE (Build 2026.04.26-MASTER)', type: 'system', timestamp: new Date().toLocaleTimeString() },
        { text: 'ВСТАНОВЛЕННЯ_ЗВ’ЯЗКУ_З_КЛАСТЕРОМ_IMAC... [192.168.0.199]', type: 'system', timestamp: new Date().toLocaleTimeString() },
        { text: 'PTY_SUBSYSTEM: READY [QUANTUM_LINK_ESTABLISHED]', type: 'system', timestamp: new Date().toLocaleTimeString() },
        { text: 'ВІТАЄМО, SENIOR ENGINEER. ЯДРО СУВЕРЕННОГО УПРАВЛІННЯ ГОТОВЕ ДО ДИРЕКТИВ.', type: 'system', timestamp: new Date().toLocaleTimeString() },
    ]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const cmd = inputValue.trim();
        const newLines: TerminalLine[] = [
            ...lines,
            { text: cmd, type: 'input', timestamp: new Date().toLocaleTimeString() }
        ];
        setLines(newLines);
        setInputValue('');

        // Simulate execution
        setTimeout(() => {
            let response = '';
            let type: 'output' | 'error' = 'output';

            if (cmd === 'help') {
                response = 'ДОСТУПНІ КОМАНДИ: help, status, pods, logs, clear, restart, deploy, factory, scan';
            } else if (cmd === 'status') {
                response = 'CLUSTER_HEALTH: OPTIMAL [v61.0]\nVRAM: 5.4GB/8GB [LOAD: 67%]\nNODES: 2 ONLINE [iMac-Master, NVIDIA-Cloud]\nCPU_CORE: 4/4 ACTIVE';
            } else if (cmd === 'pods') {
                response = 'NAME                     STATUS   RESTARTS   AGE\npredator-core-api        Running  0          14h\npredator-graph-service   Running  0          14h\npredator-ingestion       Running  2          14h\npredator-ai-factory      Running  0          6h';
            } else if (cmd === 'clear') {
                setLines([]);
                return;
            } else if (cmd === 'scan') {
                response = 'SCANNING OSINT SOURCES...\n[OK] Customs DB\n[OK] ProZorro\n[OK] OpenDataGov\nRESULT: 42 NEW ENTITIES DETECTED';
            } else {
                response = `ВИКОНАННЯ КОМАНДИ: ${cmd}... ПАКЕТ ОБРОБЛЕНО ЯДРОМ.`;
            }

            setLines(prev => [...prev, { text: response, type, timestamp: new Date().toLocaleTimeString() }]);
        }, 500);
    };

    return (
        <div className="flex flex-col h-full bg-[#050101] text-emerald-500 font-mono p-10 selection:bg-rose-500/30 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.3)]" />

            {/* Terminal Header */}
            <div className="flex items-center justify-between mb-8 border-b border-emerald-900/20 pb-6 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                        <div className="relative p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                            <Terminal size={22} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[16px] font-black uppercase tracking-[0.3em] italic text-emerald-500/90 glint-elite">PTY_SESSION_MASTER_0x61</h2>
                        <span className="text-[9px] text-emerald-500/40 uppercase tracking-[0.5em] font-black italic">СУВЕРЕННИЙ_КАНАЛ_ЗВ’ЯЗКУ_ELITE</span>
                    </div>
                </div>
                <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] text-white/20 uppercase tracking-widest font-black italic">ЛОКАЦІЯ_ВУЗЛА</span>
                        <span className="text-[11px] text-white/70 font-black italic tracking-tighter uppercase">IMAC_COMPUTE_NODE_PROD</span>
                    </div>
                    <div className="h-10 w-px bg-white/5" />
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-md rounded-lg animate-pulse" />
                        <div className="relative px-6 py-2 bg-emerald-500/5 border-2 border-emerald-500/30 rounded-xl text-[11px] font-black italic tracking-[0.2em] text-emerald-400 shadow-2xl">
                            З’ЄДНАННЯ_ВСТАНОВЛЕНО
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Output */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-6 bg-black/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border-2 border-white/5 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] mb-8 relative group"
            >
                <div className="absolute inset-0 bg-cyber-grid opacity-[0.02] pointer-events-none" />
                
                {lines.map((line, i) => (
                    <div key={i} className="flex gap-6 leading-relaxed group/line">
                        <span className="text-white/10 text-[10px] shrink-0 font-black tracking-tighter opacity-40 group-hover/line:opacity-100 transition-opacity">[{line.timestamp}]</span>
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-3">
                                {line.type === 'input' && <ChevronRight size={14} className="text-rose-500" />}
                                {line.type === 'system' && <Zap size={12} className="text-amber-500 animate-pulse" />}
                                {line.type === 'error' && <ShieldAlert size={12} className="text-rose-600" />}
                                <span className={cn(
                                    "text-[12px] whitespace-pre-wrap tracking-wide",
                                    line.type === 'input' ? 'text-white font-black italic glint-elite' :
                                    line.type === 'error' ? 'text-rose-500 font-black' :
                                    line.type === 'system' ? 'text-amber-500/90 italic font-black' :
                                    'text-emerald-500/90 font-medium'
                                )}>
                                    {line.text}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="h-4" />
            </div>

            {/* Terminal Input */}
            <form onSubmit={handleCommand} className="relative group/input">
                <div className="absolute inset-y-0 left-6 flex items-center text-rose-500 group-focus-within/input:scale-125 transition-transform duration-500 z-10">
                    <ChevronRight size={20} strokeWidth={3} />
                </div>
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    spellCheck={false}
                    className="w-full bg-emerald-950/5 border-2 border-emerald-900/20 rounded-[2rem] py-6 pl-16 pr-10 text-[14px] font-black tracking-[0.2em] text-white outline-none focus:border-rose-500/50 focus:bg-rose-500/5 transition-all placeholder:text-white/5 italic shadow-4xl"
                    placeholder="ВВЕДІТЬ КОМАНДУ ДЛЯ СУВЕРЕННОГО ЯДРА..."
                />
                <div className="absolute inset-y-0 right-8 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-white/30 font-black tracking-widest uppercase">ENTER</div>
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(225,29,72,1)]" />
                    </div>
                </div>
            </form>

            {/* Tactical Footer */}
            <div className="mt-10 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity duration-700 text-[10px] font-black tracking-[0.4em] uppercase italic text-emerald-500/60">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-4 group cursor-help">
                        <Activity size={14} className="text-rose-500" />
                        <span className="group-hover:text-white transition-colors">ПОТІК_ТЕЛЕМЕТРІЇ: 14.8 КБ/с</span>
                    </div>
                    <div className="flex items-center gap-4 group cursor-help">
                        <Server size={14} className="text-emerald-500" />
                        <span className="group-hover:text-white transition-colors">K8S_CONTEXT: PREDATOR_ELITE_PROD</span>
                    </div>
                    <div className="flex items-center gap-4 group cursor-help">
                        <Cpu size={14} className="text-amber-500" />
                        <span className="group-hover:text-white transition-colors">CPU_THREADS: 16_ACTIVE</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-white/20">ENCRYPTION: QUANTUM_AES_MASTER_512</span>
                    <Globe size={14} className="text-rose-500/40" />
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .shadow-4xl { box-shadow: 0 30px 80px -20px rgba(0,0,0,0.8); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.2); border-radius: 10px; }
            `}} />
        </div>
    );
};

export default PtyTerminal;

