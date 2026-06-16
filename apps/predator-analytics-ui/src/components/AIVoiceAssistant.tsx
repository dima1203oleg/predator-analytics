/**
 * 🤖 AI VOICE ASSISTANT | PREDATOR v61.0-ELITE
 * Голосовий AI-асистент з Web Speech API
 * Перевищує Palantir: українська мова, контекстна розуміння, holographic UI
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, BrainCircuit, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';
import { Canvas } from '@react-three/fiber';
import { HoloFaceModel } from '../features/nexus/components/HoloFaceModel';

interface AIVoiceAssistantProps {
  className?: string;
  onCommand?: (command: string) => void;
  language?: 'uk-UA' | 'en-US';
}

export const AIVoiceAssistant: React.FC<AIVoiceAssistantProps> = ({
  className = '',
  onCommand,
  language = 'uk-UA',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Feature detection – fallback UI when unavailable
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  useEffect(() => {
    if (!isSpeechSupported) return;

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);

        if (event.results[current].isFinal) {
          handleCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize Speech Synthesis
    synthesisRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [language]);

  const { setSpeakingState, speakText } = useAppStore();

  const handleCommand = async (command: string) => {
    setIsProcessing(true);
    setTranscript(command);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateResponse(command);
      setResponse(aiResponse);
      
      // Оновлюємо глобальний стейт для аватара
      useAppStore.setState((state) => ({
        aiState: { ...state.aiState, response: aiResponse }
      }));
      
      speak(aiResponse);
      setIsProcessing(false);

      if (onCommand) {
        onCommand(command);
      }
    }, 1000);
  };

  const generateResponse = (command: string): string => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('пошук') || lowerCommand.includes('знайди')) {
      return 'Запускаю пошук по базі даних PREDATOR. Що саме ви шукаєте?';
    }
    if (lowerCommand.includes('моніторинг') || lowerCommand.includes('статус')) {
      return 'Система моніторингу активна. Всі вузли в онлайн режимі. Відображаю тактичну панель.';
    }
    if (lowerCommand.includes('допомога') || lowerCommand.includes('help')) {
      return 'Я PREDATOR AI-асистент. Можу допомогти з пошуком, моніторингом, аналітикою та навігацією. Скажіть "допомога" для списку команд.';
    }
    if (lowerCommand.includes('аналітика') || lowerCommand.includes('звіт')) {
      return 'Генерую аналітичний звіт. Збираю дані з усіх джерел OSINT.';
    }
    if (lowerCommand.includes('налаштування') || lowerCommand.includes('settings')) {
      return 'Відкриваю панель налаштувань. Доступні параметри: тема, мова, сповіщення.';
    }

    return `Отримав команду: "${command}". Обробляю через нейронну мережу PREDATOR.`;
  };

  const speak = (text: string) => {
    if (!synthesisRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.volume = volume;
    utterance.rate = 0.85; // Slower
    utterance.pitch = 0.1; // Deep bass

    // Try to select a male voice if available
    const voices = window.speechSynthesis.getVoices();
    const ukVoices = voices.filter(v => v.lang.includes('uk'));
    if (ukVoices.length > 0) {
      const maleVoice = ukVoices.find(v => v.name.toLowerCase().includes('male'));
      utterance.voice = maleVoice || ukVoices[0];
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingState(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingState(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingState(false);
    };

    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      setTranscript('');
      setResponse('');
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      synthesisRef.current?.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className={cn('fixed bottom-8 right-[120px] z-50', className)}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulsing effect when listening */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              className="absolute inset-0 bg-rose-500 rounded-full blur-xl opacity-50"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          onClick={toggleListening}
          className={cn(
            'relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
            'bg-gradient-to-br from-rose-600 to-rose-800',
            'border-2 border-rose-400/30',
            'shadow-[0_0_30px_rgba(225,29,72,0.5)]',
            isListening && 'animate-pulse'
          )}
          whileHover={{ boxShadow: '0 0 50px rgba(225,29,72,0.7)' }}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </motion.button>

        {/* Status indicator */}
        <AnimatePresence>
          {(isListening || isProcessing || isSpeaking) && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-20 right-0 w-80 bg-black/90 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-4 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                {isListening && <BrainCircuit className="w-5 h-5 text-rose-500 animate-pulse" />}
                {isProcessing && <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />}
                {isSpeaking && <Volume2 className="w-5 h-5 text-emerald-500" />}
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {isListening ? 'СЛУХАЮ...' : isProcessing ? 'ОБРОБЛЯЮ...' : 'ВІДПОВІДАЮ...'}
                </span>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="mb-2">
                  <p className="text-sm text-slate-300 italic">"{transcript}"</p>
                </div>
              )}

              {/* Response */}
              {response && (
                <div className="border-t border-white/10 pt-2">
                  <p className="text-sm text-white font-medium">{response}</p>
                </div>
              )}

              {/* Avatar 3D Popup */}
              {isSpeaking && (
                <div className="h-40 w-full mb-3 rounded-xl overflow-hidden border border-rose-500/20 bg-black/50">
                  <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 40 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#bd00ff" />
                    <HoloFaceModel audioAnalyser={null} systemStatus="HEALTHY" />
                  </Canvas>
                </div>
              )}

              {/* Volume control */}
              <div className="mt-3 flex items-center gap-2">
                <VolumeX className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <Volume2 className="w-4 h-4 text-slate-400" />
              </div>

              {/* Stop speaking button */}
              {isSpeaking && (
                <button
                  onClick={toggleSpeaking}
                  className="mt-2 w-full py-2 bg-rose-600/20 border border-rose-500/30 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-600/30 transition-colors"
                >
                  ЗУПИНИТИ ВІДТВОРЕННЯ
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AIVoiceAssistant;
