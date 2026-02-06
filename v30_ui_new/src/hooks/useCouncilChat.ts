
import { useState, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { AvatarEmotion, CouncilResult } from '../types';
import { useToast } from '../context/ToastContext';

export const useCouncilChat = () => {
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SPEAKING'>('IDLE');
    const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>('idle');
    const [lastResult, setLastResult] = useState<CouncilResult | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
    const toast = useToast();

    // Reset when speech ends
    const handleSpeechEnd = useCallback(() => {
        setAvatarEmotion('idle');
        setStatus('IDLE');
    }, []);

    const sendMessage = useCallback(async (query: string) => {
        if (!query.trim()) return;

        setStatus('PROCESSING');
        setAvatarEmotion('thinking');
        
        try {
            const result = await api.runCouncil(query);
            setLastResult(result);
            
            // If backend provides audio URL (TTS), use it
            if (result.audio_url) {
                setAudioUrl(result.audio_url);
                setAvatarEmotion('speaking');
                setStatus('SPEAKING');
            } else {
                // No Audio? Just show text (Idle)
                setAvatarEmotion('idle');
                setStatus('IDLE');
            }
        } catch (e) {
            console.error("Council Error:", e);
            setAvatarEmotion('alert');
            setStatus('IDLE');
            toast.error("Council Error", "Failed to reach LLM Council backend.");
        }
    }, [toast]);

    return {
        status,
        avatarEmotion,
        lastResult,
        audioUrl,
        sendMessage,
        handleSpeechEnd,
        setAvatarEmotion
    };
};
