import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAvatarStore } from '../../stores/avatarStore';

interface SpeechContextValue {
    isSpeaking: boolean;
    isListening: boolean;
    speak: (text: string) => void;
    startListening: () => void;
    stopListening: () => void;
    transcript: string;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const transitionTo = useAvatarStore(s => s.transitionTo);

    // Speech Synthesis
    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;
        
        window.speechSynthesis.cancel(); // Зупиняємо попереднє мовлення
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'uk-UA'; // Українська мова
        utterance.rate = 1.0;
        utterance.pitch = 0.9; // Трохи нижчий, "кібернетичний" голос

        // Знайти український голос, якщо є
        const voices = window.speechSynthesis.getVoices();
        const ukVoice = voices.find(v => v.lang.includes('uk'));
        if (ukVoice) {
            utterance.voice = ukVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            transitionTo('presenting');
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            transitionTo('idle');
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            transitionTo('idle');
        };

        window.speechSynthesis.speak(utterance);
    }, [transitionTo]);

    // Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.lang = 'uk-UA';
        recognition.continuous = false;
        recognition.interimResults = true;
    }

    const startListening = useCallback(() => {
        if (!recognition) {
            console.warn('SpeechRecognition не підтримується у цьому браузері.');
            return;
        }
        
        try {
            recognition.start();
            setIsListening(true);
            transitionTo('listening');
        } catch (err) {
            console.error('Помилка запуску розпізнавання', err);
        }
    }, [recognition, transitionTo]);

    const stopListening = useCallback(() => {
        if (!recognition) return;
        recognition.stop();
        setIsListening(false);
        transitionTo('idle');
    }, [recognition, transitionTo]);

    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);
            
            // Якщо розпізнано ключове слово "аналіз"
            if (text.toLowerCase().includes('аналіз')) {
                transitionTo('analyzing');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            if (useAvatarStore.getState().currentState === 'listening') {
                transitionTo('idle');
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Помилка розпізнавання мови', event.error);
            setIsListening(false);
            transitionTo('idle');
        };
    }, [recognition, transitionTo]);

    return (
        <SpeechContext.Provider value={{
            isSpeaking,
            isListening,
            speak,
            startListening,
            stopListening,
            transcript
        }}>
            {children}
        </SpeechContext.Provider>
    );
};

export function useSpeech(): SpeechContextValue {
    const ctx = useContext(SpeechContext);
    if (!ctx) {
        throw new Error('[useSpeech] Має бути використаний всередині <SpeechProvider>');
    }
    return ctx;
}
