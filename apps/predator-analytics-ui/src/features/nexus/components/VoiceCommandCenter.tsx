import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { motion } from 'framer-motion';

export const VoiceCommandCenter = () => {
  const { processAICommand, aiState } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:9080');
    
    ws.onopen = () => console.log('Avatar WS connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription') {
          setTranscript(data.text);
        } else if (data.type === 'status') {
          if (data.message === 'processing_llm') {
            useAppStore.setState(s => ({
              aiState: { ...s.aiState, isReasoning: true }
            }));
          } else if (data.message === 'idle') {
            useAppStore.setState(s => ({
              aiState: { ...s.aiState, isReasoning: false, isSpeaking: false }
            }));
          }
        } else if (data.type === 'token') {
          // Streaming text - in a real app we'd accumulate it
          // and trigger TTS or use the viseme for Avatar
          useAppStore.setState(s => ({
            aiState: { ...s.aiState, isSpeaking: true }
          }));
        }
      } catch(e) {}
    };
    
    wsRef.current = ws;

    return () => ws.close();
  }, []);

  const handleToggleListen = async () => {
    if (isListening) {
      setIsListening(false);
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data);
          }
        };

        mediaRecorder.start(1000); // Send chunk every second
        mediaRecorderRef.current = mediaRecorder;
        setIsListening(true);
        setTranscript('Запис аудіо...');
      } catch (err) {
        console.error('Mic error:', err);
      }
    }
  };

  // When listening stops and we have a transcript, send it
  useEffect(() => {
    if (!isListening && transcript && transcript !== 'Запис аудіо...' && !aiState.isReasoning) {
      processAICommand(transcript);
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
