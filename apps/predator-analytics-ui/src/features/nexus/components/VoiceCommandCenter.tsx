import { Button } from '@/components/ui/button';
import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { motion } from 'framer-motion';

export const VoiceCommandCenter = () => {
  const { processAICommand, aiState } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Встановлюємо початкове значення для SpeechRecognition (Native STT)
  }, []);

  const handleToggleListen = () => {
    if (isListening) {
      setIsListening(false);
      if (recognition) {
        recognition.stop();
      }
    } else {
      // Ініціалізація Web Speech API
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert("Голосовий ввід (Web Speech API) не підтримується у цьому браузері. Спробуйте Google Chrome.");
        return;
      }

      const recog = new SpeechRecognition();
      recog.lang = 'uk-UA'; // Жорстка прив'язка до української мови
      recog.interimResults = true;
      recog.continuous = false;

      recog.onstart = () => {
        setIsListening(true);
        setTranscript('Слухаю (uk-UA)...');
      };

      recog.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript);
          // Автоматично відправляємо команду, як тільки розпізнано фінальний текст
          processAICommand(finalTranscript);
          setIsListening(false);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recog.onerror = (event: any) => {
        console.error('STT Error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setTranscript('Помилка мікрофона: ' + event.error);
        }
      };

      recog.onend = () => {
        setIsListening(false);
        // Скидаємо текст, якщо нічого не розпізнано
        setTranscript((prev) => prev.startsWith('Слухаю') ? '' : prev);
      };

      recog.start();
      setRecognition(recog);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-4 bg-black/40 border border-emerald-500/20 rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.1)]">
      <Button variant="cyber"
        onClick={handleToggleListen}
        disabled={aiState.isReasoning}
        className={`p-4 rounded-full flex items-center justify-center transition-all ${
          isListening 
            ? 'bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' 
            : aiState.isReasoning
              ? 'bg-emerald-500/10 text-emerald-500/50 cursor-not-allowed border border-emerald-500/20'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500 hover:bg-emerald-500/30 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]'
        }`}
      >
        {aiState.isReasoning ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isListening ? (
          <Mic className="w-6 h-6 animate-bounce" />
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </Button>
      
      <div className="mt-3 min-h-[20px] text-center">
        {isListening ? (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-emerald-400 font-mono text-xs tracking-wide"
          >
            {transcript || "СЛУХАЮ..."}
          </motion.p>
        ) : aiState.isReasoning ? (
          <p className="text-emerald-500/50 font-mono text-xs tracking-widest uppercase animate-pulse">ОБРОБКА...</p>
        ) : (
          <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">ОЧІКУВАННЯ КОМАНДИ</p>
        )}
      </div>
    </div>
  );
};
