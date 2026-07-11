import { Button } from '@/components/ui/button';
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Cpu, ChevronRight, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { copilotApi } from '../../../services/api/copilot';
import { useCognitiveStore } from '../../../store/cognitiveStore';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const QUICK_COMMANDS = [
  'Аналіз ризиків',
  'Топ аномалії',
  'Граф зв\'язків',
  'Статус системи',
];

export const DialoguePanel = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Готовий до аналізу. Введіть запит для квантової кореляції даних.', timestamp: new Date().toLocaleTimeString('uk-UA') }
  ]);
  const { t } = useTranslation();
  const addEvent = useCognitiveStore((s) => s.addEvent);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const setProcessing = useCognitiveStore((s) => s.setProcessing);

  const handleSubmit = async (query: string) => {
    const userQuery = query.trim();
    if (!userQuery || isTyping) return;
    setInput('');
    setIsTyping(true);
    setProcessing(true);
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: userQuery, timestamp: new Date().toLocaleTimeString('uk-UA') }]);
    addEvent(`Запит: "${userQuery.slice(0, 30)}..."`, 'info');

      let replyText = "";
      try {
        const response = await copilotApi.chat({ message: userQuery });
        replyText = response.reply || "Аналіз завершено. Деталей не знайдено.";
      } catch (err) {
        console.error("Copilot API failed:", err);
        replyText = "Помилка зв'язку з Квантовим Мозком. Перевірте з'єднання з бекендом.";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'ai', text: replyText, timestamp: new Date().toLocaleTimeString('uk-UA') }
      ]);
      addEvent('Відповідь Квантового Мозку отримано', 'success');
      setIsTyping(false);
      setProcessing(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      addEvent('Голосовий ввід завершено. Запит відправлено.', 'success');
      handleSubmit('Квантовий аналіз ризиків активувати');
    } else {
      setIsRecording(true);
      addEvent('Мікрофон активовано...', 'info');
    }
  };

  return (
    <div className="flex gap-4 font-mono text-xs">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white/80 uppercase tracking-widest font-orbitron text-[11px] font-medium">
            {t('hud.dialogue') || 'ДІАЛОГ З КВАНТОВИМ МОЗКОМ'}
          </h3>
          <span className="text-white/20 text-[9px] font-rajdhani">{messages.length} повідомлень</span>
        </div>

        <div ref={scrollRef} className="flex flex-col gap-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-cyan-400"
                >
                  <span className="text-cyan-400/50 flex-shrink-0 mt-0.5 font-mono text-[9px]">[{msg.timestamp}] USR:</span>
                  <div className="flex-1 font-mono text-[10px] leading-relaxed break-words shadow-[0_0_8px_rgba(0,229,255,0.2)]">
                    {msg.text}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-emerald-400"
                >
                  <span className="text-emerald-400/50 flex-shrink-0 mt-0.5 font-mono text-[9px]">[{msg.timestamp}] SYS:</span>
                  <div className="flex-1 font-mono text-[10px] leading-relaxed break-words shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    {msg.text}
                  </div>
                </motion.div>
              )
            )}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <span className="text-emerald-400/50 font-mono text-[9px]">[{new Date().toLocaleTimeString('uk-UA')}] SYS:</span>
                <span className="flex items-center gap-1 text-emerald-400/60 font-mono text-[10px] shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  ОБРОБКА
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
          className="relative flex items-center mt-1 group"
        >
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <motion.div 
              className="w-full h-full bg-gradient-to-r from-transparent via-[#38bdf8]/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="absolute left-3 text-[#38bdf8]/60 group-focus-within:text-[#38bdf8] transition-colors">
            <Terminal size={14} />
          </div>
          <input
            type="text"
            className="flex-1 bg-transparent outline-none font-mono text-[10px] text-cyan-400 placeholder:text-cyan-400/30 py-3 pl-9 pr-20"
            placeholder={isRecording ? "[ЗАПИС ГОЛОСУ...]" : "[ВВЕДІТЬ ЗАПИТ АБО КОМАНДУ]"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {isRecording && (
              <motion.div 
                className="flex gap-0.5 mr-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-fuchsia-400"
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                  />
                ))}
              </motion.div>
            )}
            <Button variant="cyber"
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 rounded-lg transition-colors ${isRecording ? 'text-fuchsia-400 bg-fuchsia-400/10' : 'text-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/10'}`}
            >
              <Mic size={14} />
            </Button>
            <Button variant="cyber"
              type="submit"
              disabled={isTyping || !input.trim()}
              className="p-1.5 text-emerald-400/50 hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:hover:text-emerald-400/50 hover:bg-emerald-400/10 rounded-lg"
            >
              <Send size={14} />
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0 w-36">
        <h3 className="text-white/80 uppercase tracking-widest font-orbitron text-[11px] font-medium flex items-center gap-1">
          <Terminal size={10} className="text-emerald-400" /> СИСТЕМНІ КОМАНДИ
        </h3>
        <div className="grid grid-cols-2 gap-1.5 mt-auto">
          {QUICK_COMMANDS.map((cmd) => (
            <Button variant="cyber"
              key={cmd}
              onClick={() => handleSubmit(cmd)}
              className="group flex items-center justify-between text-left px-2 py-1.5 bg-slate-900/40 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 rounded-sm transition-all shadow-[0_0_5px_rgba(16,185,129,0)] hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              <span className="font-mono text-[9px] text-slate-400 group-hover:text-emerald-400 transition-colors truncate">
                {cmd}
              </span>
              <ChevronRight size={10} className="text-slate-600 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
