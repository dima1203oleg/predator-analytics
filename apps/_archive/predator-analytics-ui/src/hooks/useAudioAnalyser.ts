import { useState, useEffect, useRef, useCallback } from "react";

export const useAudioAnalyser = () => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const initAnalyser = useCallback((audioElement: HTMLAudioElement) => {
    if (audioContextRef.current) return;

    // Ініціалізація аудіо-контексту
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const context = new AudioContextClass();
    const srcAnalyser = context.createAnalyser();
    
    srcAnalyser.fftSize = 256; // Оптимальний розмір вікна для швидкого аналізу частот голосу
    srcAnalyser.smoothingTimeConstant = 0.5; // Плавність руху губ

    const source = context.createMediaElementSource(audioElement);
    source.connect(srcAnalyser);
    srcAnalyser.connect(context.destination);

    audioContextRef.current = context;
    audioNodeRef.current = source;
    setAnalyser(srcAnalyser);
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { analyser, initAnalyser, audioContext: audioContextRef.current };
};
