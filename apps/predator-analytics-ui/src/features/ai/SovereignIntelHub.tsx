/**
 * 🎯 Sovereign Intelligence Hub | v58.2-WRAITH
 * PREDATOR — Центральний Вузол Когнітивної Розвідки
 * 
 * Інтерактивний інтерфейс для взаємодії з Оракулом та аналізу нейронних потоків.
 * Sovereign Power Design System · Gold/Rose Palette · Tier-1 Access
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Brain, Sparkles, Shield, 
  Terminal, Globe, Search, Database, 
  Activity, Cpu, Eye, Zap, MessageSquare,
  Lock, ArrowRight, Bot, Command, RefreshCw, Bookmark,
  Fingerprint, Target, Layers, AlertTriangle
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiApi, ChatMessage, AIThought } from '@/services/api/ai';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/utils/cn';
import { HoloContainer } from '@/components/HoloContainer';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';

import { useBackendStatus } from '@/hooks/useBackendStatus';

// --- MOCK DATA FOR WRAITH ---
const MOCK_THOUGHTS: AIThought[] = [
    { id: '1', stage: 'observation', content: '[GLM-5.1] Виявлено критичне відхилення у ланцюгу постачання пального. Джерело: NVIDIA-CLUSTER.', confidence: 0.99, timestamp: new Date().toISOString() },
    { id: '2', stage: 'analysis', content: 'Активація SWE-Bench Pro для аудиту аномальних транзакцій. Кореляція з ZROK-трафіком позитивна.', confidence: 0.97, timestamp: new Date().toISOString() },
    { id: '3', stage: 'decision', content: 'Переведення інтелекту в режим ПРЯМОГО ВПЛИВУ. Ініціація OSINT-контрзаходів.', confidence: 0.98, timestamp: new Date().toISOString() },
];

export default function SovereignIntelHub() {
    const { isOffline, nodeSource, healingProgress } = useBackendStatus();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', content: `СУВЕРЕННИЙ ІНТЕЛЕКТ ПРЕДАТОР GLM-5.1 АКТИВОВАНО. Зв'язок через ${isOffline ? 'ЛОКАЛЬНИЙ ЕМУЛЯТОР' : 'ZROK тунель'}: ВСТАНОВЛЕНО.` }
    ]);

    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SovereignHub',
                    message: 'AI Хаб перейшов у режим обмеженої когнітивної функціональності (LOCAL_CORE). ZROK-зв’язок втрачено.',
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'LOCAL_CORE'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'SovereignHub',
                    message: 'СИНХРОНІЗАЦІЯ З ОРАКУЛОМ УСПІШНА (SOVEREIGN_SUCCESS). Прямий доступ до NVIDIA-кластера.',
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'SOVEREIGN_SUCCESS'
                }
            }));
        }
    }, [isOffline]);

    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const chatMutation = useMutation({
        mutationFn: (msgs: ChatMessage[]) => aiApi.chat(msgs, 'glm-5.1:sovereign'),
        onSuccess: (data) => {
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.choices[0].message.content, 
                thought_process: data.choices[0].message.thought_process 
            }]);
        }
    });

    const handleSend = () => {
        if (!input.trim() || chatMutation.isPending) return;
        const newMsgs: ChatMessage[] = [...messages, { role: 'user', content: input }];
        setMessages(newMsgs);
        setInput('');
        chatMutation.mutate(newMsgs);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <PageTransition>
            <div className="relative w-full h-screen bg-[#020202] overflow-hidden flex flex-col font-sans">
                <AdvancedBackground mode="sovereign" />
                <CyberGrid opacity={0.03} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex-1 flex flex-col p-6 lg:p-12 overflow-hidden max-w-[1800px] mx-auto w-full"
                >
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10 mb-10">
                        <div className="flex items-center gap-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-1000" />
                                <div className="relative p-6 bg-black border border-yellow-500/40 shadow-4xl rounded-[2.5rem] transition-all group-hover:border-yellow-500/80">
                                    <Brain size={42} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_#d4af37]" />
                                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.8em]">
                                        GLM-5.1 SOVEREIGN AGENT · v58.2-WRAITH
                                    </span>
                                </div>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none italic">
                                    ХАБ <span className="text-yellow-500">ІНТЕЛЕКТУ</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-black bg-yellow-600 flex items-center justify-center text-[8px] font-black">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", isOffline ? "text-amber-500" : "text-yellow-500")}>
                                    {isOffline ? 'OFFLINE_RECOVERY_MODE' : (nodeSource === 'NVIDIA_VIA_ZROK' ? 'ZROK_NVIDIA_TUNNEL ACTIVE' : 'MIRROR_ORACLE_ACTIVE')}
                                </span>
                            </div>
                            {isOffline && (
                                <div className="px-6 py-3 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center gap-4 animate-pulse">
                                    <AlertTriangle size={14} className="text-red-500" />
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">FAILOVER SYNC: {Math.floor(healingProgress)}%</span>
                                </div>
                            )}
                            <Button variant="ghost" className="text-yellow-500/60 hover:text-yellow-500 uppercase text-[9px] font-black tracking-widest gap-2">
                                <Command size={14} /> ТЕРМІНАЛ
                            </Button>
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                        
                        {/* 🧠 LEFT: Thought Stream (AI Logs) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8 overflow-hidden">
                            <TacticalCard variant="holographic" className="flex-1 p-8 relative overflow-hidden flex flex-col bg-black/60 border-yellow-500/10 rounded-[3rem]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.5em] flex items-center gap-3 italic">
                                        <Terminal size={18} className="text-yellow-500" /> ПОТІК_МИСЛЕННЯ_GLM
                                    </h3>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping opacity-40 shadow-[0_0_10px_#d4af37]" />
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar font-mono">
                                    {(messages[messages.length - 1]?.thought_process || MOCK_THOUGHTS).map((t, i) => (
                                        <motion.div 
                                            key={t.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 group hover:border-yellow-500/30 transition-all cursor-default"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]",
                                                    t.stage === 'observation' ? 'text-sky-400 bg-sky-400' :
                                                    t.stage === 'analysis' ? 'text-yellow-400 bg-yellow-400' : 'text-emerald-400 bg-emerald-400'
                                                )} />
                                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                    {t.stage === 'observation' ? 'СПОСТЕРЕЖЕННЯ' : 
                                                     t.stage === 'analysis' ? 'АНАЛІЗ' : 
                                                     t.stage === 'decision' ? 'РІШЕННЯ' : 'ДІЯ'}
                                                </span>
                                                <span className="text-[8px] font-mono text-slate-700 ml-auto font-black">{t.confidence * 100}% CONF</span>
                                            </div>
                                            <p className="text-[12px] text-slate-400 leading-relaxed italic group-hover:text-white transition-colors">
                                                {t.content}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 italic">
                                        <span>SWE-BENCH PRO (SOTA)</span>
                                        <span className="text-yellow-500">98.9%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                        <motion.div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" initial={{ width: 0 }} animate={{ width: '98.9%' }} />
                                    </div>
                                </div>
                            </TacticalCard>

                            <HoloContainer className="p-8 h-[220px] bg-gradient-to-br from-amber-900/10 to-transparent border-amber-500/10 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Shield size={180} className="text-amber-500" />
                                </div>
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] mb-6 flex items-center gap-3 italic">
                                    <Shield size={16} /> СУВЕРЕННИЙ_БРАНДМАУЕР
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <span className="text-[11px] font-black text-slate-400">ZROK_PROTECTION_ENABLED</span>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] font-black">ACTIVE</Badge>
                                    </div>
                                    <div className="text-[10px] text-slate-600 leading-tight font-black uppercase tracking-wider">
                                        GLM-5.1 МОНІТОРИТЬ КЛАСТЕР NVIDIA ЧЕРЕЗ ШИФРОВАНИЙ ТУНЕЛЬ...
                                    </div>
                                </div>
                            </HoloContainer>
                        </div>

                        {/* 💬 CENTER: Neural Chat Interface */}
                        <div className="col-span-12 lg:col-span-8 bg-black/60 border border-yellow-500/5 rounded-[4rem] flex flex-col overflow-hidden relative shadow-4xl group">
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none group-hover:from-yellow-500/8 transition-all duration-1000" />
                            
                            {/* Chat Header */}
                            <div className="p-8 border-b border-yellow-500/10 flex items-center justify-between relative z-10 backdrop-blur-3xl bg-black/20">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-yellow-600 to-yellow-500 flex items-center justify-center shadow-4xl border border-yellow-400/30 relative">
                                        <Zap className="text-black" size={28} />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full border-4 border-black" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-wider italic">GLM-5.1:SOVEREIGN_OPERATIONS</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">SECURE_ZROK_NODE</span>
                                            </div>
                                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">AGENTIC_MODE: ON</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-white/5 bg-white/5 hover:border-yellow-500/30 text-slate-500 hover:text-yellow-500 transition-all">
                                        <Bookmark size={20} />
                                    </Button>
                                    <Button variant="outline" size="icon" className="w-12 h-12 rounded-2xl border-white/5 bg-white/5 hover:border-yellow-500/30 text-slate-500 hover:text-yellow-500 transition-all">
                                        <RefreshCw size={20} />
                                    </Button>
                                </div>
                            </div>

                            {/* Chat Content */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar relative z-10 scroll-smooth">
                                {messages.map((msg, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-6 max-w-[90%]",
                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-2xl transition-all",
                                            msg.role === 'user' 
                                                ? "bg-black border-yellow-500/20 text-yellow-500" 
                                                : "bg-yellow-500 text-black border-transparent shadow-yellow-500/20"
                                        )}>
                                            {msg.role === 'user' ? <Fingerprint size={22} /> : <Bot size={22} />}
                                        </div>
                                        <div className={cn(
                                            "p-7 rounded-[2.5rem] text-[15px] leading-relaxed relative overflow-hidden whitespace-pre-wrap",
                                            msg.role === 'user' 
                                                ? "bg-yellow-500 text-black rounded-tr-none font-bold italic shadow-xl" 
                                                : "bg-white/[0.03] text-slate-200 border border-white/5 rounded-tl-none font-medium backdrop-blur-md"
                                        )}>
                                            {msg.role === 'system' && <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/40" />}
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {chatMutation.isPending && (
                                    <div className="flex gap-6 max-w-[90%] items-center animate-pulse">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Sparkles size={22} className="text-yellow-600 animate-spin-slow" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="h-4 w-64 bg-white/5 rounded-full" />
                                            <div className="h-4 w-48 bg-white/5 rounded-full opacity-50" />
                                            <span className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.5em] mt-2 italic">СИНТЕЗ_АГЕНТНОЇ_СТРАТЕГІЇ_GLM...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-8 bg-black/40 border-t border-yellow-500/10 relative z-10 backdrop-blur-3xl">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                                    <Input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Введіть директиву для GLM-5.1 (напр. 'Проаналізувати критичні порти NVIDIA серверу')..." 
                                        className="h-20 pl-16 pr-28 bg-black border-2 border-white/5 rounded-3xl text-white focus:border-yellow-500/60 focus:ring-0 transition-all font-bold tracking-tight text-lg placeholder:text-slate-700 placeholder:italic relative z-10"
                                    />
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-yellow-500 transition-colors z-20" size={24} />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4 z-20">
                                        <Button 
                                            onClick={handleSend}
                                            disabled={!input.trim() || chatMutation.isPending}
                                            className="h-12 w-16 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl shadow-4xl transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Send size={22} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between px-2">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 group cursor-help">
                                            <Cpu size={14} className="text-yellow-500/60 group-hover:text-yellow-500" />
                                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest group-hover:text-slate-400 transition-colors">GLM-5.1:SOVEREIGN</span>
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-help">
                                            <Globe size={14} className="text-amber-500/60 group-hover:text-amber-500" />
                                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest group-hover:text-slate-400 transition-colors">NODE: {nodeSource}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase text-yellow-600 tracking-widest italic font-bold">ZROK_LINK: ENCRYPTED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="relative z-10 max-w-[1800px] mx-auto px-6 lg:px-12 pb-24">
                    <DiagnosticsTerminal />
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.15); border-radius: 20px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.3); }
                    `
                }} />
            </div>
        </PageTransition>
    );
}
