
import React, { useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Activity, Bot, User, Minimize2, Sparkles } from 'lucide-react';
import { InteractionStatus } from '../../hooks/useVoiceControl';

interface ChatMsg {
    id: string;
    role: 'user' | 'ai';
    text: string;
}

interface ExecutiveChatProps {
    messages: ChatMsg[];
    status: InteractionStatus;
    onSend: (text: string) => void;
    onVoiceToggle: () => void;
}

export const ExecutiveChat: React.FC<ExecutiveChatProps> = ({ messages, status, onSend, onVoiceToggle }) => {
    const [input, setInput] = React.useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-[#0D0F12]/90 backdrop-blur-2xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative panel-3d">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/50 flex justify-between items-center bg-gradient-to-r from-slate-900/80 to-slate-900/40">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <Bot size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-white tracking-widest uppercase font-display block">Director AI</span>
                        <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> ONLINE
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {status === 'PROCESSING' && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-cyan-400 uppercase bg-cyan-900/10 px-2 py-1 rounded-full border border-cyan-500/20">
                            <Activity size={10} className="animate-spin" /> Thinking
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-40 space-y-4">
                        <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center">
                            <Bot size={40} />
                        </div>
                        <p className="text-xs text-center font-mono tracking-widest">
                            EXECUTIVE CHANNEL OPEN<br/>WAITING FOR COMMAND
                        </p>
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            relative max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-md transition-all duration-300
                            ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-amber-600/20 to-amber-900/40 border border-amber-500/30 text-amber-50 rounded-br-sm ml-8'
                                : 'bg-slate-800/40 border border-slate-700/50 text-slate-200 rounded-bl-sm mr-8 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                            }
                        `}>
                            {msg.role === 'ai' && (
                                <div className="absolute -top-3 -left-3 p-1.5 bg-slate-900 border border-slate-700 rounded-full shadow-md">
                                    <Sparkles size={12} className="text-cyan-400" />
                                </div>
                            )}
                            
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                            
                            <div className={`text-[9px] mt-2 font-mono opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input Area - Sticky for Mobile Keyboard */}
            <div className="sticky bottom-0 left-0 right-0 p-3 md:p-4 border-t border-slate-800/50 bg-[#0D0F12]/95 backdrop-blur-xl z-20 pb-safe">
                <div className="flex gap-2 items-end bg-slate-900/50 border border-slate-700 rounded-xl p-1.5 focus-within:border-amber-500/50 focus-within:bg-slate-900 transition-all shadow-inner">
                    <button 
                        onClick={onVoiceToggle}
                        className={`p-3 rounded-lg transition-all active:scale-95 ${
                            status === 'LISTENING' 
                            ? 'text-white bg-red-500 shadow-[0_0_15px_red] animate-pulse' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        {status === 'LISTENING' ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder="Напишіть запит або задачу..."
                        className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0 font-medium max-h-24 py-3 resize-none custom-scrollbar"
                        rows={1}
                        disabled={status === 'PROCESSING'}
                    />
                    
                    <button 
                        onClick={handleSubmit}
                        disabled={!input.trim() || status === 'PROCESSING'}
                        className={`p-3 rounded-lg transition-all active:scale-95 shadow-lg ${
                            !input.trim() 
                            ? 'bg-slate-800 text-slate-600' 
                            : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-amber-500/20'
                        }`}
                    >
                        <Send size={20} className={status === 'PROCESSING' ? 'opacity-50' : ''} />
                    </button>
                </div>
            </div>
        </div>
    );
};
