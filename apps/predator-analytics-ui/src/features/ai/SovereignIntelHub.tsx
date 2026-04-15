import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Brain, Sparkles, Shield, 
  Terminal, Globe, Search, Database, 
  Activity, Cpu, Eye, Zap, MessageSquare,
  Lock, ArrowRight, Bot, Command
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiApi, ChatMessage, AIThought } from '@/services/api/ai';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// --- MOCK DATA FOR DEMO ---
const MOCK_THOUGHTS: AIThought[] = [
    { id: '1', stage: 'observation', content: 'Перехоплено аномальний обсяг транзакцій у секторі пального (АЗС ТІТАН).', confidence: 0.98, timestamp: new Date().toISOString() },
    { id: '2', stage: 'analysis', content: 'Кореляція зі зміною цін на Роттердам+ за останні 4 години відсутня. Ознаки штучного дефіциту.', confidence: 0.85, timestamp: new Date().toISOString() },
    { id: '3', stage: 'decision', content: 'Ініціювати запит до реєстру податкових накладних (API-V3). Підготовка звіту для АМКУ.', confidence: 0.92, timestamp: new Date().toISOString() },
];

export default function SovereignIntelHub() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', content: 'Система PREDATOR ORACLE активована. Очікування запиту аналітика...' }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const chatMutation = useMutation({
        mutationFn: (msgs: ChatMessage[]) => aiApi.chat(msgs),
        onSuccess: (data) => {
            setMessages(prev => [...prev, { role: 'assistant', content: data.content, thought_process: data.thoughts }]);
        }
    });

    const handleSend = () => {
        if (!input.trim()) return;
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
            <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col">
                <AdvancedBackground />
                <CyberGrid opacity={0.05} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex-1 flex flex-col p-6 overflow-hidden"
                >
                    <ViewHeader 
                        title="ХАБ СУВЕРЕННОГО ІНТЕЛЕКТУ"
                        subtitle="Центральний Вузол Когнітивної Розвідки та Прийняття Рішень"
                        icon={Brain}
                        badges={[
                            { label: 'LLM_ГОЛОВНИЙ_МОДУЛЬ', color: 'rose', icon: <Bot size={10} /> },
                            { label: 'СИНХРОНІЗАЦІЯ_OODA: 100%', color: 'success', icon: <Activity size={10} /> },
                        ]}
                    />

                    <div className="flex-1 grid grid-cols-12 gap-6 mt-6 overflow-hidden">
                        
                        {/* 🧠 LEFT: Thought Stream (AI Logs) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                            <div className="flex-1 bg-black/40 border border-indigo-500/20 rounded-[32px] p-6 backdrop-blur-md flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <Terminal size={16} /> ПОТІК МИСЛЕННЯ (МЕТА-АНАЛІЗ)
                                    </h3>
                                    <Badge variant="outline" className="text-[9px] animate-pulse border-indigo-500/30">СИНТЕЗ</Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                    {MOCK_THOUGHTS.map((t, i) => (
                                        <motion.div 
                                            key={t.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.2 }}
                                            className="p-4 bg-white/5 rounded-2xl border border-white/5 relative"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    t.stage === 'observation' ? 'bg-sky-400' :
                                                    t.stage === 'analysis' ? 'bg-amber-400' : 'bg-emerald-400'
                                                )} />
                                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                                                    {t.stage === 'observation' ? 'Спостереження' : 
                                                     t.stage === 'analysis' ? 'Аналіз' : 
                                                     t.stage === 'decision' ? 'Рішення' : 'Дія'}
                                                </span>
                                                <span className="text-[8px] text-slate-700 ml-auto">{t.confidence * 100}% ДОВІРИ</span>
                                            </div>
                                            <p className="text-[11px] text-slate-300 leading-relaxed italic">"{t.content}"</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[180px] bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-[32px] p-6 backdrop-blur-md">
                                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-3">Автономний Вектор</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-slate-400">Статус самонавчання:</span>
                                    <span className="text-xs font-black text-white">АКТИВНО</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] text-slate-500 uppercase font-bold">
                                        <span>Опрацьовано ГБ</span>
                                        <span>4,129 / 12,000</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: '34%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 💬 CENTER: Neural Chat Interface */}
                        <div className="col-span-12 lg:col-span-8 bg-black/60 border border-white/10 rounded-[40px] flex flex-col overflow-hidden relative shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                            
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                                        <Lock className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-md font-black text-white uppercase tracking-wider">PREDATOR_ORACLE_ЗАХИЩЕНИЙ_ЗВ'ЯЗОК</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] text-emerald-400 font-black uppercase">Квантове Шифрування Активовано</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                                    <Command size={20} />
                                </Button>
                            </div>

                            {/* Chat Content */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
                                {messages.map((msg, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-4 max-w-[85%]",
                                            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                                            msg.role === 'user' ? "bg-slate-800 border-white/10" : "bg-indigo-500/20 border-indigo-500/30"
                                        )}>
                                            {msg.role === 'user' ? <Eye size={16} className="text-slate-400" /> : <Bot size={16} className="text-indigo-400" />}
                                        </div>
                                        <div className={cn(
                                            "p-4 rounded-3xl text-sm leading-relaxed",
                                            msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/5 text-slate-200 border border-white/5 rounded-tl-none ring-1 ring-white/5"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {chatMutation.isPending && (
                                    <div className="flex gap-4 max-w-[85%] animate-pulse">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                            <Sparkles size={16} className="text-indigo-400 animate-spin" />
                                        </div>
                                        <div className="p-4 rounded-3xl bg-white/5 text-slate-500 text-xs italic">
                                            Оракул синтезує відповідь...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-6 bg-slate-900/50 border-t border-white/5 relative z-10">
                                <div className="relative group">
                                    <Input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Введіть запит для аналізу (напр. 'Перевірити звязки ТІТАН ГРУП')..." 
                                        className="h-16 pl-12 pr-24 bg-black/40 border-white/10 rounded-2xl text-slate-200 focus:ring-rose-500/50 transition-all font-medium placeholder:text-slate-600"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-hover:text-rose-500 transition-colors" size={20} />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                        <Button 
                                            onClick={handleSend}
                                            disabled={!input.trim() || chatMutation.isPending}
                                            className="h-10 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-900/20 px-4"
                                        >
                                            <Send size={18} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-black uppercase text-slate-600 tracking-wider">
                                    <span>ШІ Модель: <span className="text-slate-400">Mistral-7B-v0.2</span></span>
                                    <span>•</span>
                                    <span>Шифрування: <span className="text-slate-400">AES-256-GCM</span></span>
                                    <span>•</span>
                                    <span>Сесійні Токени: <span className="text-slate-400">1,248 залишилось</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}
