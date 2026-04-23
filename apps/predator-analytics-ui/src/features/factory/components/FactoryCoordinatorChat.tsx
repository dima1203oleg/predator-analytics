import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Loader2, Send, Cpu, Shield, Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FactoryMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  action?: 'build' | 'test' | 'deploy' | 'analyze' | 'kubectl';
}

export interface FactoryCoordinatorChatProps {
  messages: FactoryMessage[];
  inputText: string;
  setInputText: (v: string) => void;
  isProcessing: boolean;
  handleCommand: (cmd: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const FactoryCoordinatorChat: React.FC<FactoryCoordinatorChatProps> = ({
  messages,
  inputText,
  setInputText,
  isProcessing,
  handleCommand,
  messagesEndRef
}) => {
  return (
    <section className="glass-wraith h-[600px] flex flex-col p-0 overflow-hidden group/chat">
      {/* Cinematic Header */}
      <div className="p-6 border-b border-rose-500/10 bg-rose-500/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500 blur-md opacity-20 animate-pulse" />
            <div className="relative p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl">
              <Bot className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-[0.2em] uppercase font-display">Координатор Ядра</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-mono text-emerald-500/80 uppercase tracking-tighter">OODA-LOOP ACTIVE</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-8 w-[1px] bg-white/5" />
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/5 rounded-full">
            <Cpu size={12} className="text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500">NVIDIA_V1</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40 relative">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col gap-2",
                  msg.sender === 'user' ? "items-end" : "items-start"
                )}
              >
                 <div className={cn(
                   "max-w-[85%] p-4 rounded-2xl text-[13px] relative transition-all duration-300",
                   msg.sender === 'user' 
                     ? "bg-rose-600 text-white rounded-tr-none border border-rose-400/30 shadow-[0_10px_30px_rgba(225,29,72,0.15)]" 
                     : "bg-slate-900/80 border border-white/10 text-slate-200 rounded-tl-none hover:border-rose-500/30"
                 )}>
                    <p className="leading-relaxed whitespace-pre-wrap font-sans tracking-wide">{msg.text}</p>
                    
                    {msg.sender === 'system' && (
                      <div className="absolute -left-10 top-1">
                        <div className="p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20">
                          <Bot size={14} className="text-rose-500" />
                        </div>
                      </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2 px-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>{msg.sender === 'user' ? 'Оператор' : 'Координатор'}</span>
                    <span className="opacity-30">•</span>
                    <span>{msg.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
              </motion.div>
            ))}
            {isProcessing && (
               <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl"
               >
                  <Loader2 size={16} className="text-rose-500 animate-spin" /> 
                  <span className="text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase">Синтез відповіді через нейромережу...</span>
               </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-grid-pattern" />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-black/60 border-t border-rose-500/10 backdrop-blur-3xl relative">
         <form 
           onSubmit={(e) => { 
             e.preventDefault(); 
             if (inputText.trim()) { 
               handleCommand(inputText); 
               setInputText(''); 
             } 
           }} 
           className="relative group/input"
         >
           <div className="absolute inset-0 bg-rose-500/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none" />
           
           <input
             type="text"
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             placeholder="Введіть директиву для координатора..."
             className="w-full bg-slate-950/80 border border-white/5 focus:border-rose-500/40 rounded-2xl py-4.5 pl-6 pr-16 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/20 transition-all font-sans relative z-10"
             spellCheck="false"
             autoFocus
           />
           
           <button 
             type="submit" 
             disabled={!inputText.trim() || isProcessing}
             className={cn(
               "absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center transition-all z-20 shadow-lg",
               inputText.trim() && !isProcessing 
                ? "bg-rose-500 text-black hover:scale-105 active:scale-95 shadow-rose-500/20" 
                : "bg-white/5 text-slate-700 opacity-50 cursor-not-allowed"
             )}
           >
              <Send size={18} />
           </button>
         </form>
         
         <div className="mt-4 flex items-center gap-6 px-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 flex-shrink-0">
               <Shield size={10} className="text-emerald-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Канал Зашифровано</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
               <Zap size={10} className="text-rose-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Пріоритет: Високий</span>
            </div>
         </div>
      </div>
    </section>
  );
};
