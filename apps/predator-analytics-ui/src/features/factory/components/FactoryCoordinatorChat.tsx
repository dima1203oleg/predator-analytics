import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Loader2, Send
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
    <section className="page-section section-amber h-[500px] flex flex-col p-0 border-rose-500/20 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
      <div className="section-header px-6 pt-6 mb-2">
        <div className="section-dot-amber" />
        <div>
          <h2 className="section-title">Інтерфейс AI-Координатора</h2>
          <p className="section-subtitle">Прямий канал управління OODA-ядро</p>
        </div>
      </div>
      <div className="flex flex-col h-full bg-black/40 overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/20">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "group flex flex-col gap-1.5",
                  msg.sender === 'user' ? "items-end" : "items-start"
                )}
              >
                 <div className={cn(
                   "max-w-[85%] p-4 rounded-2xl text-[13px] relative shadow-lg",
                   msg.sender === 'user' 
                     ? "bg-gradient-to-br from-rose-600 to-rose-700 text-rose-50 rounded-tr-none border border-rose-400/30" 
                     : "bg-slate-900/90 border border-rose-500/20 text-rose-50 rounded-tl-none ring-1 ring-rose-500/5"
                 )}>
                    {msg.sender === 'system' && (
                      <Bot size={14} className="absolute -left-7 top-1 text-rose-500 opacity-50" />
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.sender === 'user' && (
                      <div className="absolute -right-7 top-1 text-yellow-500/50">
                         <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">U</div>
                      </div>
                    )}
                 </div>
                 <span className="text-[9px] font-medium text-slate-500 uppercase px-2">
                    {msg.sender} • {msg.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                 </span>
              </motion.div>
            ))}
            {isProcessing && (
               <motion.div 
                layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-emerald-500/70 p-2"
               >
                  <Loader2 size={14} className="animate-spin" /> 
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase">Координатор аналізує запит...</span>
               </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Interface */}
        <div className="p-4 bg-slate-900/40 border-t border-rose-500/10 backdrop-blur-md">
           <form 
             onSubmit={(e) => { 
               e.preventDefault(); 
               if (inputText.trim()) { 
                 handleCommand(inputText); 
                 setInputText(''); 
               } 
             }} 
             className="relative"
           >
             <input
               type="text"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Введіть команду (напр. 'статус k8s', 'оптимізуй затримку' або 'виправ критичні баги')..."
               className="w-full bg-black/60 border border-slate-700/50 focus:border-rose-500/50 rounded-xl py-4.5 pl-5 pr-14 text-sm text-rose-50 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/20 transition-all font-mono shadow-inner"
               spellCheck="false"
               autoFocus
             />
             <button 
               type="submit" 
               disabled={!inputText.trim() || isProcessing}
               className={cn(
                 "absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg flex items-center justify-center transition-all shadow-xl",
                 inputText.trim() && !isProcessing 
                  ? "bg-rose-500 hover:bg-rose-400 text-black scale-100" 
                  : "bg-slate-800 text-slate-600 scale-95 opacity-50"
               )}
             >
                <Send size={18} />
             </button>
           </form>
           <div className="mt-3 flex items-center gap-4 px-1">
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ядро Системи</span>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};
