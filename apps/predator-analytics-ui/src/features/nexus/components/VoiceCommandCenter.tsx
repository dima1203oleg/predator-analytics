import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { motion } from 'framer-motion';

export const VoiceCommandCenter = () => {
  const { processAICommand, aiState } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'uk-UA';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      rec.onend = () => {
        setIsListening(false);
        // We handle sending in a separate effect or directly if transcript is long enough
        // but since onend fires, we can use the transcript from state if it's there
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  }, []);

  const handleToggleListen = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  // When listening stops and we have a transcript, send it
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0 && !aiState.isReasoning) {
      processAICommand(transcript.trim());
      setTranscript('');
    }
  }, [isListening, transcript, aiState.isReasoning, processAICommand]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-emerald-500/30 rounded-lg backdrop-blur-sm">
      <button
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
      </button>
      
      <div className="mt-4 min-h-[40px] text-sm text-center">
        {isListening ? (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-emerald-400 font-mono"
          >
            {transcript || "Слухаю..."}
          </motion.p>
        ) : aiState.isReasoning ? (
          <p className="text-emerald-500/50 font-mono animate-pulse">Обробка директиви...</p>
        ) : (
          <p className="text-slate-500 font-mono text-xs">Натисніть для голосової команди</p>
        )}
      </div>
    </div>
  );
};
