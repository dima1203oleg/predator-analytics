/**
 * 💻 PTY TERMINAL // ПУЛЬТ УПРАВЛІННЯ | v60.5-ELITE
 * Інтерфейс для прямої взаємодії з кластером.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Zap, Activity, ChevronRight, Command, Server, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TerminalLine {
    text: string;
    type: 'input' | 'output' | 'error' | 'system';
    timestamp: string;
}

export const PtyTerminal: React.FC = () => {
    const [lines, setLines] = useState<TerminalLine[]>([
        { text: 'PREDATOR OS v60.5-ELITE (Build 2026.04.26)', type: 'system', timestamp: new Date().toLocaleTimeString() },
        { text: 'ВСТАНОВЛЕННЯ_ЗВ’ЯЗКУ_З_КЛАСТЕРОМ_IMAC...', type: 'system', timestamp: new Date().toLocaleTimeString() },
        { text: 'PTY_SUBSYSTEM: READY', type: 'system', timestamp: new Date().toLocaleTimeString() },
        { text: 'ВІТАЄМО, SENIOR ENGINEER. ОЧІКУВАННЯ ДИРЕКТИВ.', type: 'system', timestamp: new Date().toLocaleTimeString() },
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
                response = 'Доступні команди: help, status, pods, logs, clear, restart, deploy';
            } else if (cmd === 'status') {
                response = 'CLUSTER_HEALTH: OPTIMAL | VRAM: 5.2GB/8GB | NODES: 2 ONLINE';
            } else if (cmd === 'pods') {
                response = 'NAME                     STATUS   RESTARTS   AGE\npredator-core-api        Running  0          12h\npredator-graph-service   Running  0          12h\npredator-ingestion       Running  2          12h';
            } else if (cmd === 'clear') {
                setLines([]);
                return;
            } else {
                response = `Виконання команди: ${cmd}... Пакет оброблено.`;
            }

            setLines(prev => [...prev, { text: response, type, timestamp: new Date().toLocaleTimeString() }]);
        }, 500);
    };

    return (
        <div className="flex flex-col h-full bg-[#020202] text-emerald-500 font-mono p-8 selection:bg-emerald-500/30">
            {/* Terminal Header */}
            <div className="flex items-center justify-between mb-6 border-b border-emerald-900/30 pb-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-sm">
                        <Terminal size={18} className="text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-[14px] font-black uppercase tracking-[0.2em] italic">PTY_SESSION_0xFE92</h2>
                        <span className="text-[8px] text-emerald-500/40 uppercase tracking-widest font-black">СУВЕРЕННИЙ_КАНАЛ_ЗВ’ЯЗКУ</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] text-white/20 uppercase tracking-widest">ЛОКАЦІЯ_ВУЗЛА</span>
                        <span className="text-[10px] text-white/60 font-bold italic">IMAC_COMPUTE_NODE</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-[10px] font-black italic tracking-widest">
                        З’ЄДНАННЯ_ВСТАНОВЛЕНО
                    </div>
                </div>
            </div>

            {/* Terminal Output */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-4 bg-black/40 p-6 rounded-sm border border-white/5 shadow-inner mb-6"
            >
                {lines.map((line, i) => (
                    <div key={i} className="flex gap-4 leading-relaxed group">
                        <span className="text-white/10 text-[9px] shrink-0 font-bold">[{line.timestamp}]</span>
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center gap-2">
                                {line.type === 'input' && <ChevronRight size={12} className="text-rose-500" />}
                                {line.type === 'system' && <Zap size={10} className="text-amber-500" />}
                                {line.type === 'error' && <Shield size={10} className="text-rose-600" />}
                                <span className={cn(
                                    "text-[11px] whitespace-pre-wrap",
                                    line.type === 'input' ? 'text-white font-bold italic' :
                                    line.type === 'error' ? 'text-rose-500' :
                                    line.type === 'system' ? 'text-amber-500/80 italic font-black' :
                                    'text-emerald-500/90'
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
            <form onSubmit={handleCommand} className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-rose-500 group-focus-within:scale-125 transition-transform">
                    <ChevronRight size={16} />
                </div>
                <input 
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    spellCheck={false}
                    className="w-full bg-emerald-950/10 border border-emerald-900/30 rounded-sm py-4 pl-12 pr-6 text-[12px] font-black tracking-widest text-white outline-none focus:border-rose-500/50 transition-all placeholder:text-white/5 italic"
                    placeholder="ВВЕДІТЬ КОМАНДУ ДЛЯ ЯДРА..."
                />
                <div className="absolute inset-y-0 right-4 flex items-center gap-3">
                    <div className="px-2 py-0.5 border border-white/10 rounded-sm text-[8px] text-white/20 font-black">ENTER</div>
                    <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                </div>
            </form>

            {/* Tactical Footer */}
            <div className="mt-8 flex items-center justify-between opacity-30 text-[8px] font-black tracking-widest uppercase italic">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Activity size={10} />
                        <span>ПОТІК_ТЕЛЕМЕТРІЇ: 12.4 КБ/с</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Server size={10} />
                        <span>K8S_CONTEXT: PREDATOR_PROD</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span>ENCRYPTION: QUANTUM_AES_512</span>
                    <Globe size={10} />
                </div>
            </div>
        </div>
    );
};

export default PtyTerminal;
