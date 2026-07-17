import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const useVoiceServices = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);


  const transcribeAudio = useCallback(
    async (file: File): Promise<string | null> => {
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Помилка транскрипції: ${response.statusText}`);
        }

        const data = await response.json();
        return data.text;
      } catch (error) {
        console.error('Transcribe error:', error);
        return null;
      } finally {
        setIsTranscribing(false);
      }
    },
    []
  );

  const synthesizeSpeech = useCallback(
    async (text: string): Promise<Blob | null> => {
      setIsSynthesizing(true);
      try {
        const response = await fetch(`${API_BASE_URL}/voice/synthesize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`Помилка синтезу: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        return audioBlob;
      } catch (error) {
        console.error('Synthesize error:', error);
        return null;
      } finally {
        setIsSynthesizing(false);
      }
    },
    []
  );

  const playSynthesizedSpeech = useCallback(
    async (text: string) => {
      const audioBlob = await synthesizeSpeech(text);
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
        };
        
        await audio.play();
      }
    },
    [synthesizeSpeech]
  );

  return {
    transcribeAudio,
    synthesizeSpeech,
    playSynthesizedSpeech,
    isTranscribing,
    isSynthesizing,
  };
};
