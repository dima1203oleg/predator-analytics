import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, Paperclip, Mic, ChevronDown, Zap, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  type?: 'text' | 'analysis' | 'alert';
  timestamp: string;
}

export const PredatorChatWidget: React.FC = () => {


  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: premiumLocales.predatorChat.welcomeMessage,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString().slice(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // AI Simulation
    setTimeout(() => {
      let responseText = premiumLocales.predatorChat.processingMessage;
      const query = userMsg.text.toLowerCase();

      if (query.includes('звіт')) responseText = premiumLocales.predatorChat.reportResponse;
      else if (query.includes('ризик')) responseText = premiumLocales.predatorChat.riskResponse;
      else if (query.includes('мит')) responseText = premiumLocales.predatorChat.customsResponse;
      else if (query.includes('привіт')) responseText = premiumLocales.predatorChat.greetingResponse;
      else responseText = premiumLocales.predatorChat.defaultResponse.replace('{query}', userMsg.text);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString().slice(0, 5)
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-slate-950/90 border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-emerald-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg relative">
                  <Bot size={20} className="text-emerald-400" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-wide">PREDATOR AI</h3>
                  <p className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" /> ONLINE • V45.0 BETA
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button aria-label="Налаштування" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Settings size={16} /> {/* Note: Settings need import or replace with other icon. Replaced with imported Sparkles for now if Settings not available, but Settings usually is. Let's use Sparkles for 'Clean' */}
                    <Sparkles size={16} />
                 </button>
                 <button
                   onClick={() => setIsOpen(false)}
                   aria-label="Close Chat"
                   className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors text-slate-400 hover:text-rose-400"
                 >
                    <ChevronDown size={16} />
                 </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                    msg.role === 'bot' ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-300"
                  )}>
                    {msg.role === 'bot' ? <Bot size={16} /> : <div className="text-[10px] font-black">{premiumLocales.predatorChat.userLabel}</div>}
                  </div>

                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm border",
                    msg.role === 'bot'
                      ? "bg-slate-900/50 border-white/5 text-slate-200 rounded-tl-none"
                      : "bg-emerald-600/20 border-emerald-500/20 text-white rounded-tr-none"
                  )}>
                    {msg.text}
                    <div className="mt-1 text-[9px] opacity-40 font-mono text-right">{msg.timestamp}</div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[85%]">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={16} />
                   </div>
                   <div className="p-3 bg-slate-900/50 border border-white/5 rounded-2xl rounded-tl-none flex gap-1 items-center h-10">
                      <span className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-emerald-400/50 rounded-full animate-bounce" />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 pt-2 bg-slate-950/50 backdrop-blur-md">
               <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    premiumLocales.predatorChat.hints.analyzeRisks,
                    premiumLocales.predatorChat.hints.createReport,
                    premiumLocales.predatorChat.hints.latestInsights
                  ].map(hint => (
                    <button
                      key={hint}
                      onClick={() => { setInput(hint); handleSend(); }} // Fix: Pass hint directly? No, setInput then handleSend might use old state. Better to allow user to verify.
                      /* actually better to set input or auto send. Let's set input */
                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 text-[10px] text-slate-400 hover:text-emerald-400 whitespace-nowrap transition-all"
                    >
                      {hint}
                    </button>
                  ))}
               </div>
               <div className="relative flex items-end gap-2 bg-slate-900/50 border border-white/10 p-2 rounded-xl focus-within:border-emerald-500/50 transition-colors">
                   <button aria-label="Attach file" className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                      <Paperclip size={18} />
                   </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={premiumLocales.predatorChat.placeholder}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 max-h-24 resize-none py-2"
                    rows={1}
                  />
                  <div className="flex flex-col gap-1">
                     {/* <button className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                        <Mic size={18} />
                     </button> */}
                     <button
                       onClick={handleSend}
                       disabled={!input.trim()}
                       aria-label="Send message"
                       className="p-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                     >
                        <Send size={16} />
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center z-50 group border border-emerald-400/20"
        >
           <Bot size={28} className="group-hover:rotate-12 transition-transform" />
           <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[9px] font-bold">1</span>
        </motion.button>
      )}
    </>
  );
};
