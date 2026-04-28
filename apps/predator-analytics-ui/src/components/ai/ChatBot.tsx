import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { 
  SendHorizonal, 
  MessageSquare, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Terminal,
  ChevronDown
} from 'lucide-react';
import { chatMessagesAtom, isTypingAtom } from '../../store/atoms';
import { ChatMessage } from '../../types/index';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const ChatBot = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const [isTyping, setIsTyping] = useAtom(isTypingAtom);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: format(new Date(), 'HH:mm')
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Симуляція відповіді від ultra-router-chat
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Отримано запит: "${userText}". Аналізую дані Predator Analytics v58.2-WRAITH... \n\nЯ бачу, що за останній період вашарефективність зросла на 14%. Всі системи працюють стабільно.`,
        timestamp: format(new Date(), 'HH:mm')
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-background shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all z-50 group overflow-hidden",
          isOpen && "rotate-90 opacity-0 pointer-events-none"
        )}
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>

      <div className={cn(
        "fixed bottom-8 right-8 w-[400px] h-[600px] bg-slate-950/80 backdrop-blur-2xl border border-primary/20 rounded-3xl shadow-2xl flex flex-col transition-all duration-500 z-50 origin-bottom-right",
        isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-20 pointer-events-none"
      )}>
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-primary/10 rounded-t-3xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary border border-primary/30 flex items-center justify-center text-background">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-foreground tracking-wide">AI КОПІЛОТ</div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Нейромережа активна
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Sparkles className="w-10 h-10 mb-3 text-primary" />
              <p className="text-sm max-w-[200px]">{t('chat.greeting')}</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-1",
                msg.role === 'user' ? "bg-indigo-500/10 text-indigo-400" : "bg-primary/10 text-primary"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-indigo-600/20 text-foreground border border-indigo-500/20 rounded-tr-none" 
                  : "bg-slate-900/50 text-foreground border border-white/5 rounded-tl-none"
              )}>
                {msg.content}
                <div className="mt-1.5 text-[10px] opacity-40 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-900/50 border border-white/5 rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-5 border-t border-white/5 bg-slate-950/40">
          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={t('chat.placeholder')}
              className="w-full bg-slate-900/80 border border-white/10 rounded-2xl px-5 py-3.5 pr-14 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none h-[54px] min-h-[54px] max-h-[120px]"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-3 bottom-2.5 p-2 bg-primary/10 hover:bg-primary text-primary hover:text-background rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none group-hover:scale-110 active:scale-95"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between opacity-30 px-1">
            <div className="flex gap-4">
              <Terminal className="w-3.5 h-3.5 cursor-pointer hover:opacity-100 transition-opacity" />
              <ChevronDown className="w-3.5 h-3.5 cursor-pointer hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[10px] font-mono tracking-tighter uppercase font-bold text-primary/60">PREDATOR AI ENGINE v58.2-WRAITH</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;
