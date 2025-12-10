import { useEffect, useRef, useCallback, Dispatch, SetStateAction, useState } from 'react';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';
import { api } from '../services/api';

export type InteractionStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

export const useVoiceControl = (
  status: InteractionStatus,
  setStatus: Dispatch<SetStateAction<InteractionStatus>>,
  onTranscript: (text: string) => void
) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Synthesis safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    } catch (e) {
      console.warn("[Voice] SpeechSynthesis access failed:", e);
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      try {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'uk-UA';

        recognition.onstart = () => {
          setStatus('LISTENING');
        };

        recognition.onend = () => {
          // Delay setting IDLE slightly to prevent flickering if processing follows immediately
          setTimeout(() => {
            setStatus((prev) => prev === 'LISTENING' ? 'IDLE' : prev);
          }, 100);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
              onTranscript(transcript);
            }
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('[Voice] Recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setStatus('IDLE');
          }
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.error("[Voice] Failed to construct SpeechRecognition:", e);
      }
    }
  }, [onTranscript, setStatus]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && status === 'IDLE') {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("[Voice] Start failed:", e);
        setStatus('IDLE');
      }
    }
  }, [status, setStatus]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && status === 'LISTENING') {
      try {
        recognitionRef.current.stop();
      } catch (e) { console.error(e); }
    }
  }, [status]);

  const speak = useCallback(async (text: string, interrupt: boolean = true) => {
    if (!text) return;

    if (interrupt) {
      try {
        if (synthRef.current) synthRef.current.cancel();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      } catch (e) { console.warn("Cancel failed", e); }
    }

    setStatus('PROCESSING');

    // 1. Try Cloud TTS (Nexus/Gemini)
    if (navigator.onLine) {
      try {
        const data = await api.nexus.speak(text);
        if (data && data.audioContent) {
          // Play binary audio
          const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
          const audio = new Audio(audioSrc);
          audioRef.current = audio;

          audio.onplay = () => setStatus('SPEAKING');
          audio.onended = () => setStatus('IDLE');
          audio.onerror = () => {
            // Fallback to local if audio fails
            console.warn("[Voice] Cloud Audio failed, falling back to local.");
            speakLocal(text);
          };

          await audio.play();
          return;
        }
      } catch (e) {
        console.warn("[Voice] Cloud TTS failed:", e);
        // Fallthrough to local
      }
    }

    // 2. Fallback to Local TTS
    speakLocal(text);

  }, [setStatus]);

  const speakLocal = useCallback((text: string) => {
    if (!synthRef.current) {
      setStatus('IDLE');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uk-UA';
      utterance.pitch = 0.95;
      utterance.rate = 1.05;

      const voices = synthRef.current.getVoices();
      // Prefer Google uk-UA or Microsoft
      const ukVoice = voices.find(v => v.lang.includes('uk') && v.name.includes('Google')) ||
        voices.find(v => v.lang.includes('uk'));
      if (ukVoice) utterance.voice = ukVoice;

      utterance.onstart = () => setStatus('SPEAKING');
      utterance.onend = () => setStatus('IDLE');
      utterance.onerror = () => setStatus('IDLE');

      synthRef.current.speak(utterance);
    } catch (e) {
      console.error("Local TTS failed", e);
      setStatus('IDLE');
    }
  }, [setStatus]);

  return { startListening, stopListening, speak };
};
