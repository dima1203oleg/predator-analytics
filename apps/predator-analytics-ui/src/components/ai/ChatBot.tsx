import { Button } from '@/components/ui/button';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  SendHorizonal, 
  X, 
  Bot, 
  User, 
  Sparkles,
  Terminal,
  ChevronDown,
  BrainCircuit
} from 'lucide-react';
import { chatMessagesAtom, isTypingAtom, type ChatMessage } from '../../store/atoms';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { aiApi } from '../../services/api/ai';

const ChatBot = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const [isTyping, setIsTyping] = useAtom(isTypingAtom);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

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

    try {
      // Prepare messages for the API
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      // Call the NVIDIA local server with DeepSeek R1
      const response = await aiApi.chat(apiMessages, "deepseek-r1");
      
      // Parse the response
      const replyContent = response?.choices?.[0]?.message?.content || 
                           response?.reply || response?.content || response?.message?.content || 
                           (typeof response === 'string' ? response : `[DeepSeek R1] З'єднання встановлено, але формат відповіді не розпізнано: ${JSON.stringify(response)}`);

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyContent,
        timestamp: format(new Date(), 'HH:mm')
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("AI API Error:", error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `[Системна помилка] Збій підключення до локальної моделі DeepSeek R1 на NVIDIA сервері. Сервіс тимчасово недоступний.`,
        timestamp: format(new Date(), 'HH:mm')
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isOpen && (
        <motion.button
          key="chat-fab"
          initial={{ opacity: 0, scale: 0.82, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.82, y: 18 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(true)}
          aria-label="Відкрити ШІ-асистента"
          className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-red-500/30 bg-black text-red-300 shadow-2xl shadow-red-950/40 transition-all group"
        >
          <BrainCircuit className="w-6 h-6 transition-transform group-hover:rotate-12" />
          <div className="absolute inset-0 translate-y-full bg-red-500/20 transition-transform duration-300 group-hover:translate-y-0" />
        </motion.button>
      )}

      {isOpen && (
        <motion.button
          key="chat-backdrop"
          type="button"
          aria-label="Закрити панель ШІ"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm"
        />
      )}

      {isOpen && (
        <motion.div
          key="chat-panel"
          ref={panelRef}
          initial={{ opacity: 0, x: 120, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 120, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
          className="fixed bottom-8 right-8 z-50 flex h-[min(600px,calc(100vh-5rem))] w-[min(400px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-red-500/20 bg-slate-950/90 shadow-2xl shadow-black/70 backdrop-blur-2xl"
        >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-primary/10 rounded-t-3xl ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary border border-primary/30 flex items-center justify-center text-background">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-foreground tracking-wide">DEEPSEEK R1 (LOCAL)</div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full " />
                Локальна модель активна
              </div>
            </div>
          </div>
          <Button variant="cyber" 
            onClick={() => setIsOpen(false)}
            aria-label="Закрити ШІ-панель"
            className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
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
            <Button variant="cyber" 
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-3 bottom-2.5 p-2 bg-primary/10 hover:bg-primary text-primary hover:text-background rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none group-hover:scale-110 active:scale-95"
            >
              <SendHorizonal className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-between opacity-30 px-1">
            <div className="flex gap-4">
              <Terminal className="w-3.5 h-3.5 cursor-pointer hover:opacity-100 transition-opacity" />
              <ChevronDown className="w-3.5 h-3.5 cursor-pointer hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[10px] font-mono tracking-tighter uppercase font-bold text-primary/60">LOCAL AI: DEEPSEEK R1</div>
          </div>
        </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatBot;
