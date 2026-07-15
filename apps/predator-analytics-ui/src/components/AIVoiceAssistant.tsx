/**
 * 🤖 AI VOICE ASSISTANT | PREDATOR v61.0-ELITE
 * Голосовий AI-асистент з Web Speech API
 * Перевищує Palantir: українська мова, контекстна розуміння, holographic UI
 */
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, BrainCircuit, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/useAppStore';
import { Canvas } from '@react-three/fiber';
import { HoloFaceModel } from '../features/nexus/components/HoloFaceModel';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import axios from 'axios';

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
  const { setSpeakingState } = useAppStore();
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [volume, setVolume] = useState(1);
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  const {
    isRecording,
    isSpeaking,
    isProcessing,
    speak,
    startRecording,
    stopRecording
  } = useVoiceAssistant();

  // Sync isSpeaking with global store
  useEffect(() => {
    setSpeakingState(isSpeaking);
  }, [isSpeaking, setSpeakingState]);

  const handleCommand = async (command: string) => {
    if (!command) return;
    setIsProcessingChat(true);
    setTranscript(command);
    
    try {
      const res = await axios.post('/api/v1/copilot/chat', { message: command });
      const aiResponse = res.data.reply || 'Помилка генерації';
      setResponse(aiResponse);
      
      // Оновлюємо глобальний стейт для аватара
      useAppStore.setState((state) => ({
        aiState: { ...state.aiState, response: aiResponse }
      }));
      
      speak(aiResponse);
      
      if (onCommand) {
        onCommand(command);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      const errRes = 'Помилка з\'єднання з нейронною мережею PREDATOR.';
      setResponse(errRes);
      speak(errRes);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const toggleListening = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        handleCommand(text);
      }
    } else {
      setTranscript('');
      setResponse('');
      await startRecording();
    }
  };

  const toggleSpeaking = () => {
    // Cannot easily stop TTS via Audio blob once playing, but we can try 
    // Usually it stops when Audio object is paused, which is handled inside useVoiceAssistant (speak function revokes previous).
    // Let's leave it as is or add a stopSpeak to the hook later.
  };

  const showOverlay = isRecording || isProcessing || isProcessingChat || isSpeaking;
  const statusText = isRecording ? 'СЛУХАЮ...' : (isProcessing || isProcessingChat) ? 'ОБРОБЛЯЮ...' : 'ВІДПОВІДАЮ...';

  return (
    <div className={cn('fixed bottom-8 right-[120px] z-50', className)}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulsing effect when listening */}
        <AnimatePresence>
          {isRecording && (
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
            isRecording && 'animate-pulse'
          )}
          whileHover={{ boxShadow: '0 0 50px rgba(225,29,72,0.7)' }}
        >
          {isRecording ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </motion.button>

        {/* Status indicator */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="absolute bottom-20 right-0 w-80 bg-black/90 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-4 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                {isRecording && <BrainCircuit className="w-5 h-5 text-rose-500 animate-pulse" />}
                {(isProcessing || isProcessingChat) && <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />}
                {isSpeaking && <Volume2 className="w-5 h-5 text-emerald-500" />}
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {statusText}
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

              {/* Stop speaking button */}
              {isSpeaking && (
                <Button variant="cyber"
                  onClick={() => window.location.reload()}
                  className="mt-2 w-full py-2 bg-rose-600/20 border border-rose-500/30 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-600/30 transition-colors"
                >
                  ПЕРЕЗАВАНТАЖИТИ
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AIVoiceAssistant;
