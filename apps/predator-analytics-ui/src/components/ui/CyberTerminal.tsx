"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronRight, Terminal as TerminalIcon, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";

interface LogEntry {
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR" | "AZR";
    message: string;
}

export const CyberTerminal: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const { isTerminalOpen: isOpen, setTerminalOpen: setIsOpen } = useAppStore();

    useEffect(() => {
        const actions = [
            "SCANNING_NETWORK_TOPOLOGY...",
            "INITIALIZING_OODA_LOOP_CYCLE_v40",
            "VERIFYING_MERKLE_PROOFS_FOR_LEDGER_772",
            "ADJUSTING_NEURAL_WEIGHTS_FOR_ANOMALY_DETECTION",
            "REFINING_PREDICTIVE_MODEL_EMEA_REGION",
            "IMMUNE_SYSTEM_SCAN_COMPLETED_HEALTH_99_8",
            "TRUTH_LEDGER_APPEND_BLOCK_0xFE32"
        ];

        const interval = setInterval(() => {
            const newLog: LogEntry = {
                timestamp: new Date().toLocaleTimeString(),
                level: Math.random() > 0.8 ? "AZR" : "INFO",
                message: actions[Math.floor(Math.random() * actions.length)]
            };
            setLogs(prev => [newLog, ...prev].slice(0, 50));
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-black/90 border border-emerald-500/30 w-[400px] h-[300px] rounded-xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
                    >
                        <div className="bg-emerald-500/10 p-3 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AZR_TERMINAL_v40.0</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-500 hover:text-white"
                                title="Close Terminal"
                                aria-label="Close Terminal"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto space-y-1 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-slate-600">[{log.timestamp}]</span>
                                    <span className={log.level === 'AZR' ? 'text-emerald-400' : 'text-blue-400'}>{log.level}</span>
                                    <span className="text-slate-300">{log.message}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-1 text-emerald-500 animate-pulse">
                                <ChevronRight size={10} />
                                <span className="w-1 h-3 bg-emerald-500" />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-emerald-600 p-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white hover:bg-emerald-500 transition-colors"
                        title="Open AZR Terminal"
                        aria-label="Open AZR Terminal"
                    >
                        <TerminalIcon size={20} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
