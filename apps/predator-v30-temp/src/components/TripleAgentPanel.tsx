import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Play, CheckCircle2, XCircle,
    Loader2, Code, Brain, RefreshCcw, Clock, Shield
} from 'lucide-react';
import { api } from '../services/api';
import { HoloContainer } from './HoloContainer';
import { CyberOrb } from './CyberOrb';

interface Step {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    details?: string;
    icon: React.ElementType;
}

interface TripleAgentPanelProps {
    isLockdown?: boolean;
}

export const TripleAgentPanel: React.FC<TripleAgentPanelProps> = ({ isLockdown }) => {
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [steps, setSteps] = useState<Step[]>([
        { name: 'Нагляд (WinSURF Governance)', status: 'pending', icon: Shield },
        { name: 'Планування (Gemini CLI)', status: 'pending', icon: Brain },
        { name: 'Генерація (Mistral Vibe SDK)', status: 'pending', icon: Code },
        { name: 'Аудит (Aider/Copilot CLI)', status: 'pending', icon: CheckCircle2 }
    ]);
    const [history, setHistory] = useState<any[]>([]);

    const fetchHistory = async () => {
        try {
            const logs = await api.v25.trinity.getLogs(10);
            setHistory(logs);
        } catch (e) {
            console.error("Failed to fetch Trinity logs", e);
        }
    };

    React.useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleProcess = async () => {
        if (!command.trim()) return;

        setIsProcessing(true);
        setResult(null);
        setSteps(prev => prev.map(s => ({ ...s, status: 'pending', details: undefined })));

        try {
            // Step 0: WinSURF (Fast Check)
            setSteps(prev => {
                const s = [...prev];
                s[0].status = 'running';
                return s;
            });
            await new Promise(r => setTimeout(r, 600)); // UI Simulation

            setSteps(prev => {
                const s = [...prev];
                s[0].status = 'completed';
                s[1].status = 'running';
                return s;
            });

            // Call Backend
            const res = await api.v25.trinity.process(command);

            // Step 1: Gemini
            setSteps(prev => {
                const s = [...prev];
                s[1].status = 'completed';
                if (res.code || res.success) {
                    s[2].status = 'running';
                }
                return s;
            });

            // Step 2 & 3: Mistral and Audit
            if (res.code) {
                 await new Promise(r => setTimeout(r, 400));
                 setSteps(prev => {
                    const s = [...prev];
                    s[2].status = 'completed';
                    s[3].status = 'running';
                    return s;
                });
            }

            setResult(res);

            setSteps(prev => {
                const s = [...prev];
                // Check success deeply
                const isSuccess = res.success && !res.error;

                if (res.code) s[3].status = isSuccess ? 'completed' : 'failed';
                else s[2].status = isSuccess ? 'completed' : 'failed';

                if (!isSuccess) {
                     // Mark current running step as failed
                     const runningIdx = s.findIndex(step => step.status === 'running');
                     if (runningIdx !== -1) s[runningIdx].status = 'failed';
                }
                return s;
            });

        } catch (error) {
            console.error("Triple Agent Error:", error);
            setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'failed' } : s));
        } finally {
            setIsProcessing(false);
            fetchHistory();
        }
    };

    return (
        <HoloContainer variant="purple" className="h-full p-6">
            <div className="flex flex-col gap-6 h-full ">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded border border-purple-500/30">
                        <Terminal size={20} className="text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        КОМАНДА ПОТРІЙНОГО АГЕНТА (WinSURF)
                    </h3>
                </div>
                {isProcessing && (
                    <div className="flex items-center gap-2 text-xs font-mono text-purple-400 animate-pulse bg-purple-950/30 px-3 py-1 rounded-full border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <div className="relative">
                            <CyberOrb size={20} color="#a855f7" />
                        </div>
                        ОБРОБКА ЛАНЦЮГА WinSURF...
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isLockdown && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                    >
                        <Shield className="w-5 h-5 text-red-500 animate-pulse" />
                        <div>
                            <div className="text-xs font-bold text-red-400 font-display">РЕЖИМ ЕКСТРЕНОГО БЛОКУВАННЯ</div>
                            <div className="text-[10px] font-mono text-red-500/80 uppercase">Root Governance Active: All chain executions are strictly audited and restricted.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-4 py-2 border-y border-slate-800/50">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Intelligence Stack:</span>
                <div className="flex gap-2">
                    {['Gemini SDK', 'Mistral Vibe', 'Aider CLI', 'System Doctor', 'Ollama'].map(tool => (
                        <div key={tool} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-400">
                            {tool}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 ">
                {/* Left: Input & Workflow */}
                <div className="col-span-8 flex flex-col gap-6 ">
                    <div className="relative">
                        <textarea
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="Введіть завдання для Triple Agent (наприклад: 'Створи bash скрипт для бекапу бази даних PostgreSQL')..."
                            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm text-slate-300 focus:border-purple-500 outline-none transition-all resize-none shadow-inner"
                        />
                        <button
                            onClick={handleProcess}
                            disabled={isProcessing || !command.trim()}
                            className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                            ВИКОНАТИ
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-lg border transition-all ${
                                    step.status === 'running' ? 'bg-purple-900/10 border-purple-500 border-dashed animate-pulse' :
                                    step.status === 'completed' ? 'bg-green-900/10 border-green-500/50' :
                                    step.status === 'failed' ? 'bg-red-900/10 border-red-500/50' :
                                    'bg-slate-900/50 border-slate-800'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <step.icon size={18} className={
                                        step.status === 'completed' ? 'text-green-500' :
                                        step.status === 'running' ? 'text-purple-400' :
                                        'text-slate-500'
                                    } />
                                    {step.status === 'completed' && <CheckCircle2 size={14} className="text-green-500" />}
                                    {step.status === 'failed' && <XCircle size={14} className="text-red-500" />}
                                    {step.status === 'running' && <Loader2 size={14} className="text-purple-400 animate-spin" />}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-slate-200 tracking-wider text-center">{step.name}</div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1  flex flex-col gap-4">
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex-1  flex flex-col gap-4"
                                >
                                    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 backdrop-blur-sm shadow-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
                                                <Brain size={16} /> Стратегічний План
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-mono ${result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {result.success ? 'VERIFIED' : 'FAILED'}
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-300 leading-relaxed border-l-2 border-cyan-500/50 pl-4 py-1">
                                            {Array.isArray(result.plan) ? (
                                                <ul className="list-disc list-inside space-y-1 font-mono text-xs">
                                                    {result.plan.map((step: string, i: number) => (
                                                        <li key={i} className="text-slate-300">{step}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                result.summary || result.answer || result.plan || "No summary available."
                                            )}
                                        </div>

                                        {result.audit_report && (
                                             <div className="mt-6 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                                                 <div className="flex items-center gap-2 mb-2 text-orange-400 font-bold text-[10px] uppercase tracking-wider">
                                                     <Shield size={14}/> Звіт Аудиту WinSURF / Aider
                                                 </div>
                                                 <div className="text-xs text-orange-200/80 leading-relaxed font-mono">
                                                     {result.audit_report}
                                                 </div>
                                             </div>
                                        )}
                                    </div>

                                    {result.code && typeof result.code === 'string' && (
                                        <div className="flex-1 bg-black/80 border border-slate-800 rounded-lg  flex flex-col font-mono text-xs shadow-2xl min-h-[200px]">
                                            <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-black">
                                                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                                                    <Code size={14} className="text-purple-400" /> generated_output.py
                                                </span>
                                                <button
                                                    className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-2 py-1 rounded text-[10px] transition-all"
                                                    onClick={() => navigator.clipboard.writeText(result.code)}
                                                >
                                                    COPY CODE
                                                </button>
                                            </div>
                                            <div className="p-6 overflow-y-auto text-cyan-500/90 whitespace-pre scrollbar-hide selection:bg-purple-500/30">
                                                {result.code}
                                            </div>
                                        </div>
                                    )}

                                     {result.error && (
                                        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-xs text-red-400">
                                            <strong className="flex items-center gap-2 mb-1"><XCircle size={14}/> ПОМИЛКА ВИКОНАННЯ:</strong>
                                            {result.error}
                                        </div>
                                     )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!result && !isProcessing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 italic border border-slate-800 border-dashed rounded-lg">
                                <Terminal size={48} className="mb-4 opacity-20" />
                                <p>Очікування команди для ініціалізації ланцюга WinSURF...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: History/Audit Logs */}
                <div className="col-span-4 flex flex-col gap-4 ">
                    <div className="flex items-center gap-2 px-2">
                        <Clock size={16} className="text-slate-400" />
                        <h4 className="text-sm font-bold text-slate-300 font-mono">ІСТОРІЯ ТА АУДИТ</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {history.length === 0 ? (
                            <div className="text-center p-8 text-xs text-slate-600 font-mono italic">
                                Не знайдено нещодавніх операцій.
                            </div>
                        ) : (
                            history.map((log: any) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            log.intent === 'ops_action' ? 'bg-orange-500/20 text-orange-400' :
                                            log.intent === 'generate_code' ? 'bg-purple-500/20 text-purple-400' :
                                            'bg-cyan-500/20 text-cyan-400'
                                        }`}>
                                            {log.intent?.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-mono line-clamp-2 mb-2">
                                        {log.request_text}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                log.status === 'verified' ? 'bg-green-500' : 'bg-yellow-500'
                                            }`} />
                                            <span className="text-[10px] text-slate-500 capitalize">{log.status === 'verified' ? 'валідовано' : log.status}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono">{log.execution_time_ms}мс</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                    <button
                        onClick={fetchHistory}
                        className="p-2 text-xs font-mono text-slate-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2 border border-slate-800 rounded-lg"
                    >
                        <RefreshCcw size={12} /> ОНОВИТИ ЛОГИ
                    </button>
                </div>
                </div>
            </div>
        </HoloContainer>
    );
};
