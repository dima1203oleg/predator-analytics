'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceAssistantReturn {
  isListening: boolean;
  transcript: string;
  isSpeaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  startListening: () => void;
  stopListening: () => void;
  supported: boolean;
  cleanVoiceMode: boolean;
  setCleanVoiceMode: (val: boolean) => void;
  language: 'uk' | 'en';
  setLanguage: (lang: 'uk' | 'en') => void;
}

export function useVoiceAssistant(onResult?: (text: string) => void): UseVoiceAssistantReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [cleanVoiceMode, setCleanVoiceMode] = useState(false);
  const [language, setLanguage] = useState<'uk' | 'en'>('uk');

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickOscRef = useRef<OscillatorNode | null>(null);
  const clickGainRef = useRef<GainNode | null>(null);
  const growlOscRef = useRef<OscillatorNode | null>(null);
  const growlGainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Ініціалізація Web Audio API для ефектів Хижака
  const initAudioEffects = useCallback(() => {
    if (audioCtxRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }, []);

  // Генерація характерного "потріскування" (clicking) Хижака
  const startPredatorClicks = useCallback(() => {
    if (cleanVoiceMode) return; // Не створюємо ефекти у режимі "чистого голосу"
    initAudioEffects();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      // 1. Створюємо генератор потріскування (Clicks)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.Q.setValueAtTime(8, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(16, ctx.currentTime); // 16 кліків на секунду
      lfoGain.gain.setValueAtTime(0.5, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      lfo.start();
      osc.start();

      clickOscRef.current = osc;
      clickGainRef.current = gain;
      lfoRef.current = lfo;

      // 2. Створюємо низькочастотне "гарчання" (Growl)
      const growlOsc = ctx.createOscillator();
      const growlGain = ctx.createGain();
      const growlFilter = ctx.createBiquadFilter();

      growlOsc.type = 'triangle';
      growlOsc.frequency.setValueAtTime(35, ctx.currentTime); // Суб-бас

      growlFilter.type = 'lowpass';
      growlFilter.frequency.setValueAtTime(120, ctx.currentTime);

      const growlLfo = ctx.createOscillator();
      const growlLfoGain = ctx.createGain();
      growlLfo.frequency.setValueAtTime(8, ctx.currentTime);
      growlLfoGain.gain.setValueAtTime(10, ctx.currentTime);

      growlLfo.connect(growlLfoGain);
      growlLfoGain.connect(growlOsc.frequency);

      growlOsc.connect(growlFilter);
      growlFilter.connect(growlGain);
      growlGain.connect(ctx.destination);

      growlGain.gain.setValueAtTime(0.12, ctx.currentTime);

      growlLfo.start();
      growlOsc.start();

      growlOscRef.current = growlOsc;
      growlGainRef.current = growlGain;

    } catch (e) {
      console.error('Failed to start audio effects', e);
    }
  }, [initAudioEffects, cleanVoiceMode]);

  const stopPredatorEffects = useCallback(() => {
    try {
      if (clickOscRef.current) {
        clickOscRef.current.stop();
        clickOscRef.current.disconnect();
        clickOscRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      if (clickGainRef.current) {
        clickGainRef.current.disconnect();
        clickGainRef.current = null;
      }
      if (growlOscRef.current) {
        growlOscRef.current.stop();
        growlOscRef.current.disconnect();
        growlOscRef.current = null;
      }
      if (growlGainRef.current) {
        growlGainRef.current.disconnect();
        growlGainRef.current = null;
      }
    } catch (e) {
      console.warn('Error stopping audio nodes', e);
    }
  }, []);

  // Синтез мовлення TTS
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    
    // Зупиняємо попереднє мовлення
    window.speechSynthesis.cancel();
    stopPredatorEffects();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Шукаємо голос відповідно до обраної мови
    const voices = window.speechSynthesis.getVoices();
    const matchLang = language === 'uk' ? 'uk' : 'en';
    const selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(matchLang));
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.lang = language === 'uk' ? 'uk-UA' : 'en-US';

    if (cleanVoiceMode) {
      utterance.pitch = 1.0; // Стандартний голос
      utterance.rate = 1.0;
    } else {
      utterance.pitch = language === 'uk' ? 0.35 : 0.45; // Знижений тон для Хижака
      utterance.rate = 0.78;  // Сповільнений темп
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (!cleanVoiceMode) {
        startPredatorClicks();
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      stopPredatorEffects();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      stopPredatorEffects();
    };

    window.speechSynthesis.speak(utterance);
  }, [startPredatorClicks, stopPredatorEffects, cleanVoiceMode, language]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopPredatorEffects();
  }, [stopPredatorEffects]);

  // Ініціалізація та оновлення STT при зміні мови
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    setSupported(true);

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language === 'uk' ? 'uk-UA' : 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    rec.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      if (onResult) {
        onResult(resultText);
      }
    };

    rec.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult, language]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition already started', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Очищення ресурсів при розмонтуванні
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    isListening,
    transcript,
    isSpeaking,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    supported,
    cleanVoiceMode,
    setCleanVoiceMode,
    language,
    setLanguage
  };
}

