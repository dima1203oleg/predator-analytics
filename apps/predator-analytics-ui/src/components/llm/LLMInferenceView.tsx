
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Send, RefreshCw, Zap, Activity, Cpu } from 'lucide-react';
import { TacticalCard } from '../ui/TacticalCard';
import { premiumLocales } from '../../locales/uk/premium';

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

interface LLMInferenceViewProps {
    activeModel: string;
    chatHistory: ChatMessage[];
    userPrompt: string;
    onUserPromptChange: (val: string) => void;
    onSendMessage: () => void;
    isGenerating: boolean;
    genMetrics: { tps: number, ttft: number, totalTokens: number };
    systemPrompt: string;
    onSystemPromptChange: (val: string) => void;
    chatEndRef: React.RefObject<HTMLDivElement>;
}

export const LLMInferenceView: React.FC<LLMInferenceViewProps> = ({
    activeModel,
    chatHistory,
    userPrompt,
    onUserPromptChange,
    onSendMessage,
    isGenerating,
    genMetrics,
    systemPrompt,
    onSystemPromptChange,
    chatEndRef
}) => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col h-[650px] relative">
                <TacticalCard variant="holographic" title={`${premiumLocales.llm.inference.title}: ${activeModel}`} className="flex-1 flex flex-col p-0 glass-morphism panel-3d border-white/5" noPadding>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/40 relative">
                        {/* Background Neural Decoration */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none neural-mesh" />

                        {chatHistory.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-700 gap-8 text-center px-12 relative z-10">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.1, 0.2, 0.1]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="p-12 bg-blue-500/10 rounded-full border border-blue-500/20"
                                >
                                    <BrainCircuit size={80} className="text-blue-400" />
                                </motion.div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-500/50">{premiumLocales.llm.inference.status.connected}</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{premiumLocales.llm.inference.status.context}: 128K | {premiumLocales.llm.inference.status.temp}: 0.70 | {premiumLocales.llm.inference.params.topP}: 0.95</p>
                                </div>
                            </div>
                        )}
                        <AnimatePresence initial={false}>
                            {chatHistory.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
                                >
                                    <div className={`max-w-[85%] p-6 rounded-[24px] text-sm leading-relaxed border transition-all duration-500 ${msg.role === 'user'
                                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-100 rounded-br-none shadow-2xl'
                                        : 'bg-white/5 border-white/10 text-slate-300 rounded-bl-none backdrop-blur-3xl shadow-xl'
                                        }`}>
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/5">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 dynamic-color-pulse" />
                                                <span className="text-[9px] text-blue-400 font-black tracking-[0.3em] uppercase">{premiumLocales.llm.inference.presence}_{activeModel.substring(0,4)}</span>
                                            </div>
                                        )}
                                        <div className={msg.role === 'assistant' ? 'hacker-terminal-text' : ''}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-6 bg-black/60 border-t border-white/5 rounded-b-[32px]">
                        <div className="flex gap-4 p-3 bg-white/5 rounded-[20px] border border-white/10 focus-within:border-blue-500/50 transition-all shadow-inner relative group">
                            <input
                                value={userPrompt} onChange={(e) => onUserPromptChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                                placeholder={premiumLocales.llm.inference.placeholder}
                                className="flex-1 bg-transparent border-none p-3 text-sm text-slate-200 outline-none placeholder-slate-600 font-medium"
                                disabled={isGenerating}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }} whileTap={{ scale: 0.95 }}
                                onClick={onSendMessage} disabled={isGenerating || !userPrompt}
                                className="px-6 py-3 bg-blue-600 text-white rounded-[14px] shadow-lg disabled:opacity-20 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <><Send size={16} /> {premiumLocales.llm.inference.send}</>}
                            </motion.button>
                        </div>

                        <div className="flex justify-between items-center mt-6 px-2">
                             <div className="flex gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{premiumLocales.llm.inference.metrics.throughput}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                                                animate={{ width: `${Math.min(genMetrics.tps * 2, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-blue-400">{genMetrics.tps} TPS (ОПЕР/СЕК)</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">{premiumLocales.llm.inference.metrics.latency}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                                animate={{ width: `${Math.min(genMetrics.ttft / 10, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-emerald-400">{genMetrics.ttft}ms</span>
                                    </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mb-1">{premiumLocales.llm.inference.metrics.totalTokens}</div>
                                <span className="text-[11px] font-mono font-bold text-white tracking-widest">{genMetrics.totalTokens.toLocaleString()}_ТОКЕНІВ</span>
                             </div>
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <div className="space-y-6">
                <TacticalCard variant="holographic" title={premiumLocales.llm.inference.params.title} className="glass-morphism panel-3d">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block">{premiumLocales.llm.inference.params.directives}</label>
                            <textarea
                                value={systemPrompt} onChange={(e) => onSystemPromptChange(e.target.value)}
                                className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-xs text-slate-400 font-mono leading-relaxed focus:border-blue-500/30 outline-none resize-none transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            {[premiumLocales.llm.inference.params.temp, premiumLocales.llm.inference.params.topP].map(p => (
                                <div key={p}>
                                    <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 block">{p}</label>
                                    <input type="range" className="w-full accent-blue-500 bg-slate-900" />
                                </div>
                            ))}
                        </div>
                    </div>
                </TacticalCard>

                <TacticalCard variant="holographic" title={premiumLocales.llm.inference.router.title} className="glass-morphism panel-3d">
                    <div className="space-y-4">
                        {[
                            { name: `${premiumLocales.common.local} Llama-3`, status: premiumLocales.llm.inference.router.active, type: 'CORE', model: 'v45.0 Meta' },
                            { name: 'Gemini 3 Ultra', status: premiumLocales.llm.inference.router.standby, type: 'CLOUD', model: 'DeepMind API' },
                        ].map((p, i) => (
                            <motion.div whileHover={{ x: 4 }} key={i} className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl border ${p.type === 'CORE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-purple-500/10 border-purple-500/20 text-purple-500'}`}><Cpu size={16} /></div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-100">{p.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.model}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-emerald-500/50 group-hover:text-emerald-500 transition-colors uppercase tracking-widest">{premiumLocales.llm.inference.router.stable}</div>
                            </motion.div>
                        ))}
                    </div>
                </TacticalCard>
            </div>
        </motion.div>
    );
};
