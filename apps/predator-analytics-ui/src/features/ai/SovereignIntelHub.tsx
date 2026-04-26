/**
 * 🎯 Sovereign Intelligence Hub | v58.2-WRAITH
 * PREDATOR — Центральний Вузол Когнітивної Розвідки
 * 
 * Інтерактивний інтерфейс для взаємодії з Оракулом та аналізу нейронних потоків.
 * Sovereign Power Design System · WRAITH Crimson Palette · Tier-1 Access
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
                        <div className="flex items-center gap-10">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-[3s]" />
                                <div className="relative p-8 bg-black/60 glass-wraith border border-rose-500/40 shadow-4xl rounded-[3rem] transition-all group-hover:border-rose-500/80">
                                    <Brain size={54} className="text-rose-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-4 border-black animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping shadow-[0_0_15px_#e11d48]" />
                                    <span className="text-[11px] font-black text-rose-600/80 uppercase tracking-[1em] italic">
                                        GLM-5.1 SOVEREIGN AGENT · ELITE_v61.0
                                    </span>
                                </div>
                                <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic glint-elite chromatic-elite">
                                    ХАБ <span className="text-rose-500">ІНТЕЛЕКТУ</span>
                                </h1>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="h-px w-20 bg-gradient-to-r from-rose-500/40 to-transparent" />
                                    <span className="text-[9px] font-mono text-slate-700 font-black tracking-[0.5em] uppercase">SYSTEM_OVERSIGHT: ACTIVATED</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-6 p-4 bg-black/40 glass-wraith border border-white/5 rounded-[2rem]">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-rose-600 flex items-center justify-center text-[10px] font-black text-black shadow-lg">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", isOffline ? "text-rose-400" : "text-rose-500")}>
                                        {isOffline ? 'OFFLINE_RECOVERY' : (nodeSource === 'NVIDIA_VIA_ZROK' ? 'ZROK_NVIDIA_TUNNEL' : 'MIRROR_ORACLE')}
                                    </span>
                                    <span className="text-[8px] font-mono text-slate-700 mt-1 font-bold">STATUS: SUPREME</span>
                                </div>
                            </div>

                            {isOffline && (
                                <div className="px-8 py-4 bg-rose-500/5 border border-rose-500/20 rounded-[2rem] flex items-center gap-5 animate-pulse shadow-2xl">
                                    <AlertTriangle size={18} className="text-rose-500" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">FAILOVER SYNC</span>
                                        <span className="text-[12px] font-mono text-rose-400 font-black mt-1">{Math.floor(healingProgress)}%</span>
                                    </div>
                                </div>
                            )}

                            <Button 
                                variant="outline" 
                                className="h-16 px-10 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-black rounded-[2rem] text-[10px] font-black tracking-[0.4em] uppercase transition-all duration-500 italic shadow-2xl"
                            >
                                <Command size={18} className="mr-3" /> ТЕРМІНАЛ_ДОСТУПУ
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-10 overflow-hidden">
                        
                        {/* 🧠 LEFT: Thought Stream (AI Logs) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-10 overflow-hidden">
                            <TacticalCard variant="holographic" elite scanGrid className="flex-1 p-10 relative overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-[0.6em] flex items-center gap-4 italic font-bold">
                                        <Terminal size={20} className="text-rose-500" /> ПОТІК_МИСЛЕННЯ_GLM
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping opacity-40 shadow-[0_0_15px_#e11d48]" />
                                        <span className="text-[9px] font-mono text-slate-700 font-black">STREAM: ACTIVE</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-8 pr-6 custom-scrollbar font-mono">
                                    {(messages[messages.length - 1]?.thought_process || MOCK_THOUGHTS).map((t, i) => (
                                        <motion.div 
                                            key={t.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 group hover:border-rose-500/40 transition-all cursor-default relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02] pointer-events-none" />
                                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                                <div className={cn(
                                                    "w-3 h-3 rounded-full shadow-[0_0_12px_currentColor]",
                                                    t.stage === 'observation' ? 'text-rose-500 bg-rose-500' :
                                                    t.stage === 'analysis' ? 'text-amber-500 bg-amber-500' : 'text-emerald-500 bg-emerald-500'
                                                )} />
                                                <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] italic">
                                                    {t.stage === 'observation' ? 'СПОСТЕРЕЖЕННЯ' : 
                                                     t.stage === 'analysis' ? 'АНАЛІЗ' : 
                                                     t.stage === 'decision' ? 'РІШЕННЯ' : 'ДІЯ'}
                                                </span>
                                                <div className="ml-auto px-3 py-1 bg-white/5 rounded-lg">
                                                    <span className="text-[9px] font-mono text-slate-700 font-black">{t.confidence * 100}% CONF</span>
                                                </div>
                                            </div>
                                            <p className="text-[14px] text-slate-400 leading-relaxed italic group-hover:text-white transition-colors relative z-10">
                                                {t.content}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/5">
                                    <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-5 italic">
                                        <span>SWE-BENCH PRO (SOTA_ENGINE)</span>
                                        <span className="text-rose-500">98.9%</span>
                                    </div>
                                    <div className="h-2 bg-black/60 rounded-full overflow-hidden shadow-inner border border-white/5">
                                        <motion.div 
                                            className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.4)]" 
                                            initial={{ width: 0 }} 
                                            animate={{ width: '98.9%' }} 
                                            transition={{ duration: 2, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </TacticalCard>

                            <HoloContainer className="p-10 min-h-[240px] bg-black/60 glass-wraith border-rose-500/20 rounded-[3.5rem] relative overflow-hidden group shadow-4xl">
                                <div className="absolute inset-0 cyber-scan-grid opacity-[0.03]" />
                                <div className="absolute -right-16 -bottom-16 opacity-5 group-hover:opacity-10 transition-all duration-1000 scale-150">
                                    <Shield size={220} className="text-rose-500" />
                                </div>
                                <h3 className="text-[12px] font-black text-rose-500 uppercase tracking-[0.6em] mb-8 flex items-center gap-4 italic font-bold">
                                    <Shield size={20} /> СУВЕРЕННИЙ_БРАНДМАУЕР
                                </h3>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between items-center bg-rose-500/5 p-6 rounded-[2rem] border border-rose-500/20 shadow-xl">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black text-white tracking-widest italic">ZROK_PROTECTION</span>
                                            <span className="text-[8px] font-mono text-rose-600/60 uppercase mt-1">ENCRYPTED_TUNNEL: ON</span>
                                        </div>
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 px-4 py-1.5 text-[10px] font-black italic tracking-widest">ACTIVE</Badge>
                                    </div>
                                    <div className="text-[11px] text-slate-600 leading-relaxed font-black uppercase tracking-[0.2em] italic max-w-[80%]">
                                        GLM-5.1 МОНІТОРИТЬ КЛАСТЕР NVIDIA ЧЕРЕЗ ШИФРОВАНИЙ ТУНЕЛЬ ТА АГЕНТНІ ШЛЮЗИ...
                                    </div>
                                </div>
                            </HoloContainer>
                        </div>

                        {/* 💬 CENTER: Neural Chat Interface */}
                        <div className="col-span-12 lg:col-span-8 bg-black/60 glass-wraith border border-rose-500/10 rounded-[4.5rem] flex flex-col overflow-hidden relative shadow-4xl group">
                            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none group-hover:from-rose-500/[0.06] transition-all duration-[3s]" />
                            <div className="absolute inset-0 cyber-scan-grid opacity-[0.02]" />
                            
                            {/* Chat Header */}
                            <div className="p-10 border-b border-rose-500/10 flex items-center justify-between relative z-10 bg-black/20 backdrop-blur-3xl">
                                <div className="flex items-center gap-8">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-[2.5rem] animate-pulse" />
                                        <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-rose-600 to-rose-500 flex items-center justify-center shadow-4xl border-2 border-rose-400/40 relative z-10 transition-transform hover:scale-110 duration-500">
                                            <Zap className="text-black" size={36} />
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-300 rounded-full border-4 border-black animate-ping" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic glint-elite">GLM-5.1:SOVEREIGN_OPERATIONS</h4>
                                        <div className="flex items-center gap-5 mt-2">
                                            <div className="flex items-center gap-2.5 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full shadow-lg">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                                                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] italic">SECURE_ZROK_NODE</span>
                                            </div>
                                            <span className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em] italic">CORE_LOAD: 14.8%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                     <Button variant="outline" size="icon" className="w-14 h-14 rounded-[1.8rem] border-white/5 bg-white/5 hover:border-rose-500/40 text-slate-600 hover:text-rose-500 transition-all duration-500 shadow-xl">
                                        <Bookmark size={24} />
                                    </Button>
                                    <Button variant="outline" size="icon" className="w-14 h-14 rounded-[1.8rem] border-white/5 bg-white/5 hover:border-rose-500/40 text-slate-600 hover:text-rose-500 transition-all duration-500 shadow-xl">
                                        <RefreshCw size={24} />
                                    </Button>
                                </div>
                            </div>

                            {/* Chat Content */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar relative z-10 scroll-smooth">
                                {messages.map((msg, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className={cn(
                                            "flex gap-8 max-w-[85%]",
                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-[1.8rem] flex items-center justify-center flex-shrink-0 border-2 shadow-2xl transition-all duration-500",
                                            msg.role === 'user' 
                                                ? "bg-black border-rose-500/30 text-rose-500 group-hover:border-rose-500" 
                                                : "bg-rose-500 text-black border-transparent shadow-rose-500/30 scale-110"
                                        )}>
                                            {msg.role === 'user' ? <Fingerprint size={26} /> : <Bot size={26} />}
                                        </div>
                                        <div className={cn(
                                            "p-8 rounded-[3rem] text-[16px] leading-relaxed relative overflow-hidden whitespace-pre-wrap shadow-3xl",
                                            msg.role === 'user' 
                                                ? "bg-rose-500 text-black rounded-tr-none font-black italic tracking-tight" 
                                                : "bg-black/40 glass-wraith text-slate-200 border border-white/10 rounded-tl-none font-medium backdrop-blur-3xl"
                                        )}>
                                            {msg.role === 'system' && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.5)]" />}
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {chatMutation.isPending && (
                                    <div className="flex gap-8 max-w-[85%] items-center animate-pulse">
                                        <div className="w-14 h-14 rounded-[1.8rem] bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Sparkles size={28} className="text-rose-700 animate-spin-slow" />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="h-5 w-80 bg-white/10 rounded-full" />
                                            <div className="h-5 w-64 bg-white/5 rounded-full opacity-50" />
                                            <span className="text-[11px] font-black text-rose-600/80 uppercase tracking-[0.6em] mt-3 italic animate-pulse">СИНТЕЗ_АГЕНТНОЇ_СТРАТЕГІЇ_GLM...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-10 bg-black/60 border-t border-rose-500/10 relative z-10 backdrop-blur-4xl">
                                <div className="relative group/input">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-rose-600/30 to-crimson-600/30 blur-[20px] opacity-0 group-focus-within/input:opacity-100 transition duration-[2s]" />
                                    <Input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="ВВЕДІТЬ ДИРЕКТИВУ ДЛЯ GLM-5.1..." 
                                        className="h-24 pl-20 pr-32 bg-black/80 border-2 border-white/10 rounded-[2.5rem] text-white focus:border-rose-500/80 focus:ring-0 transition-all duration-700 font-black tracking-tight text-xl placeholder:text-slate-800 placeholder:italic placeholder:uppercase relative z-10 shadow-2xl"
                                    />
                                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-800 group-focus-within/input:text-rose-500 transition-colors duration-500 z-20" size={28} />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-5 z-20">
                                        <Button 
                                            onClick={handleSend}
                                            disabled={!input.trim() || chatMutation.isPending}
                                            className="h-14 w-20 bg-rose-500 hover:bg-rose-400 text-black rounded-[1.5rem] shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all hover:scale-110 active:scale-90"
                                        >
                                            <Send size={28} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center justify-between px-4">
                                    <div className="flex items-center gap-10">
                                        <div className="flex items-center gap-3 group cursor-help">
                                            <Cpu size={16} className="text-rose-500/40 group-hover:text-rose-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em] group-hover:text-slate-500 transition-colors italic">GLM-5.1:SOVEREIGN</span>
                                        </div>
                                        <div className="flex items-center gap-3 group cursor-help">
                                            <Globe size={16} className="text-rose-500/40 group-hover:text-rose-500 transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em] group-hover:text-slate-500 transition-colors italic">NODE: {nodeSource}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_12px_#e11d48]" />
                                        <span className="text-[10px] font-black uppercase text-rose-600 tracking-[0.6em] italic font-bold">ZROK_LINK: ENCRYPTED</span>
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
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.15); border-radius: 20px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.3); }
                    `
                }} />
            </div>
        </PageTransition>
    );
}
