import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronRight, Terminal as TerminalIcon, X, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../utils/cn";

interface LogEntry {
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR" | "AZR";
    message: string;
}

export const CyberTerminal: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const { isTerminalOpen: isOpen, setTerminalOpen: setIsOpen } = useAppStore();
    const navigate = useNavigate();
    const [azrStatus, setAzrStatus] = useState<any>({
        generation: 42,
        phase_name: 'Режим Рекомендацій',
        active: true
    });

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
        <div className="fixed bottom-32 right-6 z-[100] flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-950/95 border border-emerald-500/30 w-[400px] h-[350px] rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden mb-2"
                    >
                        <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AZR_TERMINAL_v45.1</span>
                                    <span className="text-[8px] font-mono text-emerald-500/50">SECURE_CHANNEL_ENCRYPTED</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 font-mono text-[10px] overflow-y-auto space-y-1.5 custom-scrollbar bg-black/40">
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2 leading-relaxed">
                                    <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                                    <span className={log.level === 'AZR' ? 'text-emerald-400 font-bold' : 'text-blue-400 opacity-80'}>{log.level}</span>
                                    <span className="text-slate-300">{log.message}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-1 text-emerald-500 animate-pulse mt-2">
                                <ChevronRight size={12} />
                                <span className="w-1.5 h-4 bg-emerald-500/50" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Integrated AZR Toggle & Status Button */}
            <motion.div className="flex items-center gap-4">
                <motion.button
                    onClick={() => navigate('/autonomy')}
                    whileHover={{ scale: 1.02 }}
                    className="group flex items-center gap-3 pl-4 pr-3 py-2 bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-full shadow-xl hover:border-cyan-500/60 transition-all"
                >
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                            AZR SYSTEM <Zap size={10} className="fill-cyan-400" />
                        </span>
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                            GEN {azrStatus.generation}
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
                        </span>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
                        isOpen
                            ? "bg-emerald-500 text-white shadow-[0_0_20px_#10b981]"
                            : "bg-slate-900 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                    )}
                >
                    <TerminalIcon size={20} />
                </motion.button>
            </motion.div>
        </div>
    );
};
