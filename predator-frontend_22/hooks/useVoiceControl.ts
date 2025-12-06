
import { useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from '../types';

export type InteractionStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

export const useVoiceControl = (
    status: InteractionStatus, 
    setStatus: Dispatch<SetStateAction<InteractionStatus>>,
    onTranscript: (text: string) => void
) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

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
        // Wrap constructor in try-catch for environments where it might be illegal to instantiate
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'uk-UA';

        recognition.onstart = () => {
            setStatus('LISTENING');
        };
        
        recognition.onend = () => {
            setStatus((prev) => prev === 'LISTENING' ? 'IDLE' : prev);
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
        console.error("[Voice] Failed to construct SpeechRecognition (Illegal constructor):", e);
      }
    } else {
        console.warn("[Voice] Web Speech API not supported in this environment.");
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
      } catch (e) {
        console.error("[Voice] Stop failed:", e);
      }
    }
  }, [status]);

  const speak = useCallback((text: string, interrupt: boolean = true) => {
    if (!synthRef.current) return;
    
    // Safety check to prevent "Illegal constructor" if text is missing or invalid
    if (!text) return;

    if (interrupt) {
        try {
            synthRef.current.cancel();
        } catch (e) {
            console.warn("Speech cancel failed", e);
        }
    }

    try {
        // Safe check for SpeechSynthesisUtterance support
        if (typeof SpeechSynthesisUtterance === 'undefined') {
            console.warn("SpeechSynthesisUtterance not supported");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'uk-UA';
        utterance.pitch = 0.9;
        utterance.rate = 1.1;

        const voices = synthRef.current.getVoices();
        const ukVoice = voices.find(v => v.lang.includes('uk')) || voices.find(v => v.lang.includes('en'));
        if (ukVoice) utterance.voice = ukVoice;

        utterance.onstart = () => setStatus('SPEAKING');
        utterance.onend = () => {
            if (synthRef.current && !synthRef.current.pending) {
                setStatus('IDLE');
            }
        };
        utterance.onerror = (e) => {
            console.error("Speech error", e);
            if (synthRef.current && !synthRef.current.pending) {
                setStatus('IDLE');
            }
        };

        synthRef.current.speak(utterance);
    } catch (e) {
        console.error("[Voice] Failed to create utterance:", e);
        setStatus('IDLE');
    }
  }, [setStatus]);

  return { startListening, stopListening, speak };
};
