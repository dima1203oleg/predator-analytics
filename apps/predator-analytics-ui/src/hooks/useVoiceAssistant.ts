/**
 * 🎤 useVoiceAssistant Hook | PREDATOR v66.0-ELITE
 * Голосовий пайплайн: MediaRecorder → Backend STT (Whisper) → TTS
 * Fallback: Native SpeechRecognition (якщо бекенд недоступний)
 */
import axios from 'axios';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useVoiceAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // ─── TTS (Text-to-Speech) ───────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);

    // Зупиняємо поточне відтворення
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Нативний TTS як запасний варіант
    const speakNative = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uk-UA';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    try {
      const response = await axios.post('/api/v1/voice/synthesize', { text }, {
        responseType: 'blob',
        timeout: 5000,
      });

      // Якщо бекенд повернув порожній WAV — нативний TTS
      if (!response.data || response.data.size < 1000) {
        console.warn('[TTS] Бекенд повернув порожній аудіо, нативний TTS');
        speakNative();
        return;
      }

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        console.warn('[TTS] Помилка відтворення, нативний TTS');
        URL.revokeObjectURL(audioUrl);
        speakNative();
      };
      await audio.play();
    } catch {
      console.warn('[TTS] Бекенд недоступний, нативний TTS');
      speakNative();
    }
  }, []);

  const stopSpeak = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ─── STT (Speech-to-Text) ──────────────────────────────────────────

  /** Запис через MediaRecorder (основний режим) */
  const startRecording = useCallback(async () => {
    // Зупиняємо попередній запис, якщо він є
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      console.log('[STT] Запитуємо доступ до мікрофона...');
      
      // РАЗБЛОКУВАННЯ АУДІО ДЛЯ SAFARI/CHROME (щоб дозволити відтворення після довгої генерації)
      try {
        const dummyAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        dummyAudio.volume = 0.01;
        dummyAudio.play().catch(() => {});
        const dummyUtterance = new SpeechSynthesisUtterance('');
        dummyUtterance.volume = 0;
        window.speechSynthesis.speak(dummyUtterance);
      } catch (e) {
        console.warn('[Audio Unlock] не вдалося', e);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('[STT] ✅ Мікрофон отримано');

      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Записуємо дані кожні 250мс для надійності
      mediaRecorder.start(250);
      setIsRecording(true);
      console.log('[STT] 🎙️ Запис розпочато');
    } catch (error: any) {
      console.error('[STT] ❌ Помилка мікрофона:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Доступ до мікрофона заборонено. Дозвольте доступ у налаштуваннях браузера.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Мікрофон не знайдено. Підключіть мікрофон і спробуйте знову.');
      } else {
        toast.error(`Помилка мікрофона: ${error.message || error}`);
      }
    }
  }, []);

  /** Зупинка запису + відправка на бекенд для розпізнавання */
  const stopRecording = useCallback((): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        console.warn('[STT] Немає активного запису');
        setIsRecording(false);
        resolve(undefined);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log('[STT] Запис зупинено, чанків:', chunksRef.current.length);

        // Зупиняємо потік мікрофона
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        if (chunksRef.current.length === 0) {
          toast.error('Запис порожній. Спробуйте ще раз.');
          resolve(undefined);
          return;
        }

        const audioType = (mediaRecorderRef.current?.mimeType) || 'audio/webm';
        const ext = audioType.includes('mp4') ? 'mp4' : 'webm';
        const audioBlob = new Blob(chunksRef.current, { type: audioType });
        console.log('[STT] Розмір аудіо:', audioBlob.size, 'байт', 'Формат:', audioType);

        if (audioBlob.size < 100) {
          toast.error('Запис занадто короткий.');
          resolve(undefined);
          return;
        }

        // Відправляємо на бекенд
        setIsProcessing(true);
        try {
          const formData = new FormData();
          formData.append('file', audioBlob, `audio.${ext}`);
          const response = await axios.post('/api/v1/voice/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 15000,
          });
          const text = response.data?.text?.trim();
          console.log('[STT] ✅ Розпізнано:', text);
          if (!text) {
            toast.error('Голос не розпізнано. Спробуйте говорити голосніше.');
          }
          setIsProcessing(false);
          resolve(text || undefined);
        } catch (error) {
          console.error('[STT] ❌ Помилка транскрибації:', error);
          toast.error('Помилка розпізнавання голосу. Сервер недоступний.');
          setIsProcessing(false);
          resolve(undefined);
        }
      };

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('[STT] ⏹️ Зупиняємо запис...');
    });
  }, []);

  return {
    isRecording,
    isSpeaking,
    isProcessing,
    speak,
    stopSpeak,
    startRecording,
    stopRecording,
  };
};
