import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Loader2, Send, Cpu, Shield, Zap, Terminal, Activity,
  Sparkles, Layers
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';

export interface FactoryMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: Date;
  action?: 'build' | 'test' | 'deploy' | 'analyze' | 'kubectl' | 'error';
}

export interface FactoryCoordinatorChatProps {
  messages: FactoryMessage[];
  inputText: string;
  setInputText: (v: string) => void;
  isProcessing: boolean;
  handleCommand: (cmd: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * 🤖 FACTORY COORDINATOR CHAT // КОО ДИНАТО  ЯД А | v61.0-ELITE
 * PREDATOR Analytics — AI Autonomous Factory Orchestration
 */
export const FactoryCoordinatorChat: React.FC<FactoryCoordinatorChatProps> = ({
  messages,
  inputText,
  setInputText,
  isProcessing,
  handleCommand,
  messagesEndRef
}) => {
  return (
    <section className="relative h-[700px] flex flex-col p-0 overflow-hidden rounded-[3rem] bg-[#050101] border-2 border-rose-950/30 shadow-[0_0_100px_rgba(225,29,72,0.1)] group/chat">
      <AdvancedBackground mode="sovereign" />
      <CyberGrid opacity={0.03} color="rgba(225, 29, 72, 0.1)" />
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      {/* Cinematic Header */}
      <div className="relative z-20 p-8 border-b border-rose-500/10 bg-black/40 backdrop-blur-3xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500 blur-xl opacity-20 animate-pulse" />
            <div className="relative p-4 bg-rose-600 border border-rose-400/30 rounded-2xl shadow-xl transform -rotate-3">
              <Bot className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-black text-white tracking-[0.1em] uppercase italic">КООРДИНАТОР ЯДРА</h2>
              <span className="px-3 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-widest rounded-sm">v61.0</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
              <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-[0.2em] font-black italic">OODA-LOOP ACTIVE // ТЕЛЕМЕТРІЯ: НОРМА</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="h-10 w-[1px] bg-white/5" />
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl">
              <Cpu size={12} className="text-rose-500" />
              <span className="text-[10px] font-mono text-slate-400 font-black tracking-widest uppercase">NODE_IMAC_ELITE</span>
            </div>
            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest italic opacity-50">CANONICAL_AGI_V1</span>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div 
                key={msg.id}
                layout
                initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "flex flex-col gap-3",
                  msg.sender === 'user' ? "items-end" : "items-start"
                )}
              >
                 <div className={cn(
                   "max-w-[75%] p-6 rounded-[2rem] text-[14px] relative transition-all duration-500 shadow-2xl",
                   msg.sender === 'user' 
                     ? "bg-rose-600 text-white rounded-tr-none border-2 border-rose-400/30 shadow-[0_15px_40px_rgba(225,29,72,0.2)] skew-x-[-1deg]" 
                     : "bg-black/80 border-2 border-white/5 text-slate-200 rounded-tl-none hover:border-rose-500/30 backdrop-blur-2xl skew-x-[1deg]"
                 )}>
                    <p className="leading-relaxed whitespace-pre-wrap font-sans tracking-wide italic font-medium">{msg.text}</p>
                    
                    {msg.sender === 'system' && (
                      <div className="absolute -left-12 top-0">
                        <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-xl">
                          <Bot size={16} className="text-rose-500" />
                        </div>
                      </div>
                    )}
                 </div>
                 <div className={cn(
                   "flex items-center gap-3 px-4 text-[9px] font-black font-mono text-slate-600 uppercase tracking-[0.3em] italic",
                   msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                 )}>
                    <span className={msg.sender === 'user' ? 'text-rose-500' : 'text-white'}>
                      {msg.sender === 'user' ? 'ОПЕРАТОР' : 'КООРДИНАТОР'}
                    </span>
                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                    <span>{msg.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
                 </div>
              </motion.div>
            ))}
            {isProcessing && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-6 bg-rose-500/5 border-2 border-rose-500/20 rounded-[2rem] backdrop-blur-xl"
               >
                  <div className="p-2 bg-rose-500/20 rounded-lg animate-spin">
                    <Loader2 size={18} className="text-rose-500" /> 
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-black tracking-[0.3em] text-rose-500 uppercase italic animate-pulse">СИНТЕЗ ВІДПОВІДІ...</span>
                    <div className="h-[2px] w-48 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="h-full w-1/2 bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)]"
                      />
                    </div>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* HUD Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-rose-500/10 rounded-full" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-dashed border-rose-500/5 rounded-full animate-spin-slow" />
        </div>
      </div>

      {/* Input Area */}
      <div className="relative z-20 p-8 bg-black/80 border-t-2 border-rose-500/20 backdrop-blur-3xl">
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
           <div className="absolute inset-0 bg-rose-500/5 blur-2xl opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none" />
           
           <input
             type="text"
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             placeholder="Введіть директиву для координатора..."
             className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-rose-500/50 rounded-[2rem] py-6 pl-8 pr-20 text-[15px] text-white placeholder-slate-600 focus:outline-none transition-all font-sans relative z-10 italic font-medium"
             spellCheck="false"
             autoFocus
           />
           
           <button 
             type="submit" 
             disabled={!inputText.trim() || isProcessing}
             className={cn(
               "absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center transition-all z-20 shadow-2xl",
               inputText.trim() && !isProcessing 
                ? "bg-rose-600 text-white hover:scale-110 active:scale-95 shadow-rose-600/40" 
                : "bg-white/5 text-slate-800 opacity-50 cursor-not-allowed"
             )}
           >
              <Send size={22} className="drop-shadow-lg" />
           </button>
         </form>
         
         <div className="mt-6 flex items-center gap-10 px-4">
            <div className="flex items-center gap-3">
               <Shield size={12} className="text-emerald-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">КАНАЛ_ЗАШИФРОВАНО</span>
            </div>
            <div className="flex items-center gap-3">
               <Zap size={12} className="text-rose-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">ПРІОРИТЕТ: ЕКСТРЕМАЛЬНИЙ</span>
            </div>
            <div className="flex items-center gap-3 ml-auto opacity-40">
               <Terminal size={12} className="text-white" />
               <span className="text-[9px] font-mono text-white font-black uppercase tracking-widest italic animate-pulse">Awaiting directive_</span>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin-slow { animation: spin 40s linear infinite; }
        @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}} />
    </section>
  );
};

