/**
 * AIOracle — Живий AI-співрозмовник
 * 
 * Замінює традиційний чат:
 * - AI сам починає діалог (на основі подій/даних)
 * - Повідомлення — плаваючі скляні бульбашки
 * - Анімація набору тексту (typewriter)
 * - Quick Actions (1-2 кліки)
 * - Пояснює складне простою мовою
 * - Голосове введення (мікрофон) та TTS вихід
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUniverseStore, AI_MODE_CONFIGS } from '../../store/useUniverseStore';
import { GlassPanel } from './GlassPanel';
import { useAppStore } from '../../store/useAppStore';

export const AIOracle: React.FC = () => {
  const {
    oracleMessages,
    isOracleOpen,
    isOracleTyping,
    setOracleOpen,
    addOracleMessage,
    setOracleTyping,
    aiMode,
    triggerAIEvent,
    setAIMode,
  } = useUniverseStore();

  const { speakText } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = AI_MODE_CONFIGS[aiMode];
  const glowColor = `rgb(${Math.round(config.color[0] * 255)}, ${Math.round(config.color[1] * 255)}, ${Math.round(config.color[2] * 255)})`;

  // ─── Авто-скрол при нових повідомленнях ────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [oracleMessages]);

  // ─── Автоматичні AI-повідомлення (симуляція живого AI) ─────────────
  useEffect(() => {
    const proactiveMessages = [
      { delay: 8000, msg: 'Я знайшов три потенційні аномалії у маршрутах імпорту з Китаю.', type: 'anomaly' as const, severity: 'high' as const },
      { delay: 25000, msg: 'Виявлено новий маршрут перевезень через Туреччину. Рекомендую перевірити.', type: 'info' as const, severity: 'medium' as const },
      { delay: 45000, msg: 'Побудовано прогноз: ймовірність ухилення від сплати мита зросла на 12%.', type: 'prediction' as const, severity: 'high' as const },
      { delay: 70000, msg: 'Знайдено прихований зв\'язок між ТОВ "Карго Транс" та офшорною компанією.', type: 'risk' as const, severity: 'critical' as const },
    ];

    const timers = proactiveMessages.map(({ delay, msg, type, severity }) =>
      setTimeout(() => {
        triggerAIEvent(msg, type, severity);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
     
  }, []);

  // ─── Відправка повідомлення ────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    // Повідомлення користувача
    addOracleMessage({ role: 'user', text });
    setInputText('');

    // AI "думає"
    setOracleTyping(true);
    setAIMode('inference');

    // Симуляція відповіді (замінити на реальний API)
    setTimeout(() => {
      setOracleTyping(false);
      const responses = [
        `Аналізую «${text}»... Знайдено 7 пов'язаних записів у базі даних.`,
        `За запитом «${text}» виявлено 3 компанії з підвищеним рівнем ризику.`,
        `Побудовано граф зв'язків для «${text}». Натисніть на підсвічені вузли для деталей.`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      addOracleMessage({ role: 'ai', text: response });
      speakText(response);
      setAIMode('discovery');
    }, 2000 + Math.random() * 1500);
  }, [inputText, addOracleMessage, setOracleTyping, setAIMode, speakText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ─── Мінімізований стан (лише іконка) ─────────────────────────────
  if (!isOracleOpen && !isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-28 right-6 z-50 w-14 h-14 rounded-full glass-card flex items-center justify-center group hover:border-white/20 transition-all"
        onClick={() => setOracleOpen(true)}
        style={{ boxShadow: `0 0 30px ${glowColor}30` }}
      >
        {/* Пульсуючий індикатор */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: glowColor }} />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/80 group-hover:text-white transition-colors">
          <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.522 4.817 3.889 6.156l-.467 2.813a.5.5 0 00.756.503L10.5 17.5c.49.08.99.115 1.5.115 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
        </svg>
        {/* Кількість непрочитаних */}
        {oracleMessages.filter(m => m.role === 'ai').length > 1 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            !
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <GlassPanel
      isVisible={isOracleOpen}
      position="bottom-right"
      title="AI Oracle"
      onClose={() => setOracleOpen(false)}
      glow={glowColor}
      className="w-[380px] max-h-[500px] flex flex-col"
    >
      {/* Стрічка повідомлень */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-[320px] pr-1 custom-scrollbar"
      >
        <AnimatePresence>
          {oracleMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                  ${msg.role === 'ai'
                    ? 'bg-white/[0.06] text-white/90 border border-white/[0.06] rounded-bl-md'
                    : 'bg-white/[0.12] text-white border border-white/[0.1] rounded-br-md'
                  }
                `}
              >
                {msg.text}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.actions.map((action) => (
                      <button
                        key={action.id}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all border border-white/[0.06]"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Індикатор набору тексту */}
        {isOracleTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-1.5 px-4 py-3"
          >
            <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
      </div>

      {/* Поле введення */}
      <div className="relative flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Запитайте AI..."
          className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-30 text-white/70 hover:text-white transition-all border border-white/[0.06]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </GlassPanel>
  );
};
