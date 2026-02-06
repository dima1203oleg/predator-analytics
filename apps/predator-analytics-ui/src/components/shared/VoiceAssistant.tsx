import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { cn } from '../../utils/cn';
import { CyberOrb } from '../CyberOrb';

import { useAppStore } from '../../store/useAppStore';
import { useIngestionStore } from '../../store/useIngestionStore';

export const VoiceAssistant: React.FC = () => {
  const {
    isRecording,
    isSpeaking,
    isProcessing,
    speak,
    startRecording,
    stopRecording
  } = useVoiceAssistant();

  const { persona, setTerminalOpen } = useAppStore();
  const { setHubOpen } = useIngestionStore();

  const [isOpen, setIsOpen] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const processCommand = async (text: string) => {
    const input = text.toLowerCase();

    // 1. Simple System Commands (Immediate)
    if (input.includes('статус') || input.includes('стан')) {
      speak("Системи працюють у штатному режимі. Усі вузли активовані.");
      return;
    }

    if (input.includes('термінал')) {
      speak("Відкриваю термінал.");
      setTerminalOpen(true);
      return;
    }

    if (input.includes('хаб') || input.includes('процес')) {
      speak("Активую центр процесів.");
      setHubOpen(true);
      return;
    }

    if (input.includes('хто ти')) {
      speak(`Я — архітектурний асистент ПРЕДАТОР. Режим: ${persona}.`);
      return;
    }

    // 2. Complex Queries (Trinity AI Backend)
    setIsAiThinking(true);
    try {
      const response = await axios.post('/api/v25/trinity/process', {
        command: text
      });

      const result = response.data;
      if (result.success) {
        // Use tactical description from plan or code snippet
        const reply = result.plan?.[0]?.description || (result.code ? "Я розробив архітектурне рішення." : "Наказ оброблено успішно.");
        speak(reply);
      } else {
        speak("Вибачте, сталася помилка при зверненні до ядра Trinity.");
      }
    } catch (error) {
      console.error("Trinity API Error:", error);
      speak("Зв'язок з центральним процесором розірвано.");
    } finally {
      setIsAiThinking(false);
    }
  };

  // Handle auto-speak on transcript (Demo mode)
  useEffect(() => {
    // This is a placeholder for where we'd connect to the real AI backend
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        setLastTranscript(text);
        processCommand(text);
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-14 right-0 w-80 bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[1001]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isRecording ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                )} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Predator Voice
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Close Voice Assistant"
                title="Закрити"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <CyberOrb
                status={isRecording ? 'alert' : (isProcessing || isAiThinking) ? 'processing' : isSpeaking ? 'quantum' : 'active'}
                size={120}
                onClick={toggleRecording}
                interactive
              />

              <motion.p
                className="mt-6 text-[10px] font-black uppercase tracking-widest text-center text-slate-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isRecording ? "Слухаю вас..." : (isProcessing || isAiThinking) ? "Обробка сигналу..." : isSpeaking ? "Передача відповіді..." : "Натисніть на сферу"}
              </motion.p>
            </div>

            <div className="mt-4 p-3 bg-black/60 rounded-xl border border-white/5">
              <div className="text-[9px] uppercase font-black text-slate-600 mb-1 tracking-widest">Транскрипт</div>
              <div className="text-xs text-slate-300 min-h-[1rem] font-mono italic">
                {lastTranscript || "Система готова..."}
              </div>
            </div>

            <button
                onClick={() => speak("Система готова. Чекаю ваших наказів.")}
                className="mt-4 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
                <Volume2 size={14} />
                Тест_Голосу
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Закрити голос" : "Активувати голос"}
        title={isOpen ? "Закрити" : "Predator Voice"}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all border relative overflow-hidden group/voice",
          isOpen
            ? "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            : "bg-slate-900 border-white/10 hover:border-emerald-500/30"
        )}
      >
        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/voice:opacity-100 transition-opacity" />
        {isRecording ? (
          <MicOff className="text-red-500 relative z-10 animate-pulse" size={18} />
        ) : isSpeaking ? (
            <Volume2 className="text-emerald-400 relative z-10 animate-pulse" size={18} />
        ) : (
          <Mic className={cn("relative z-10 transition-colors", isOpen ? "text-emerald-400" : "text-slate-400 group-hover/voice:text-white")} size={18} />
        )}

        {(isRecording || isSpeaking) && (
          <motion.div
            className="absolute inset-0 border border-emerald-500 rounded-xl"
            animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>
    </div>
  );
};
