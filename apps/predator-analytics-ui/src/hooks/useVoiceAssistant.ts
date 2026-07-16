import axios from 'axios';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useVoiceAssistant = (options?: { onResult?: (text: string) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useNativeSTT, setUseNativeSTT] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const nativeRecognitionRef = useRef<any>(null);
  const nativeTranscriptRef = useRef<string>('');
  const stopPromiseResolveRef = useRef<((value: string | undefined) => void) | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    
    // Stop any native speech
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Спочатку завжди пробуємо нативний TTS — він працює без бекенду
    const speakNative = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uk-UA';
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    try {
      const response = await axios.post('/api/v1/voice/synthesize', { text }, { responseType: 'blob' });
      
      // Якщо бекенд повернув занадто маленький blob (порожній WAV) — використовуємо нативний TTS
      if (!response.data || response.data.size < 1000) {
        console.warn('TTS: Бекенд повернув порожній аудіо, використовую нативний TTS');
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
        console.warn('TTS: Помилка відтворення аудіо, використовую нативний TTS');
        URL.revokeObjectURL(audioUrl);
        speakNative();
      };
      await audio.play();
    } catch (error) {
      console.warn('TTS Backend Error, falling back to native TTS:', error);
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

  const sendAudioToSTT = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const response = await axios.post('/api/v1/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const text = response.data.text;
      console.log('STT Result:', text);
      setIsProcessing(false);
      return text;
    } catch (error) {
      console.warn('STT Backend Error, falling back to native STT for next time:', error);
      setUseNativeSTT(true);
      setIsProcessing(false);
      return undefined;
    }
  };

  const startRecording = useCallback(async () => {
    nativeTranscriptRef.current = '';
    
    if (useNativeSTT) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'uk-UA';
        recognition.interimResults = true;
        recognition.continuous = true;
        
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          nativeTranscriptRef.current = currentTranscript;
        };
        
        recognition.onend = () => {
          setIsRecording(false);
          const final = nativeTranscriptRef.current.trim();
          
          if (stopPromiseResolveRef.current) {
            if (!final) toast.error('Голос не розпізнано. Спробуйте ще раз.');
            stopPromiseResolveRef.current(final || undefined);
            stopPromiseResolveRef.current = null;
          } else if (final && options?.onResult) {
            options.onResult(final);
          } else if (!final && !stopPromiseResolveRef.current) {
            // Auto-stopped due to silence or browser error
            toast.error('Браузер не розпізнав голос. Перемикаємо на серверний Whisper. Спробуйте ще раз.');
            setUseNativeSTT(false);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Native STT Error:', event.error);
          toast.error(`Помилка мікрофону: ${event.error}`);
          setIsRecording(false);
          if (stopPromiseResolveRef.current) {
            stopPromiseResolveRef.current(undefined);
            stopPromiseResolveRef.current = null;
          }
        };

        nativeRecognitionRef.current = recognition;
        try {
          recognition.start();
          setIsRecording(true);
        } catch (err: any) {
          console.error('Native STT Start Error:', err);
          toast.error(`Не вдалося запустити мікрофон: ${err.message || err}`);
          setIsRecording(false);
        }
        return;
      } else {
        toast.error('Ваш браузер не підтримує Native STT. Перемикаюсь на бекенд.');
        setUseNativeSTT(false);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording Error:', error);
      setUseNativeSTT(true);
    }
  }, [useNativeSTT]);

  const stopRecording = useCallback(() => {
    return new Promise<string | undefined>((resolve) => {
      if (useNativeSTT && nativeRecognitionRef.current) {
        stopPromiseResolveRef.current = resolve;
        try {
          nativeRecognitionRef.current.stop();
        } catch (e) {
          resolve(undefined);
        }
      } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await sendAudioToSTT(audioBlob);
          resolve(text);
          
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        setIsRecording(false);
        resolve(undefined);
      }
    });
  }, [useNativeSTT]);

  return {
    isRecording,
    isSpeaking,
    isProcessing,
    speak,
    stopSpeak,
    startRecording,
    stopRecording
  };
};
