import axios from 'axios';
import { useCallback, useRef, useState } from 'react';

export const useVoiceAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);
    try {
      const response = await axios.post('/voice/tts', { text }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(response.data);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendAudioToSTT(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording Error:', error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise<string | undefined>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await sendAudioToSTT(audioBlob);
          resolve(text);
        };
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        resolve(undefined);
      }
    });
  }, [isRecording]);

  const sendAudioToSTT = async (blob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    try {
      const response = await axios.post('/voice/stt', formData);
      const text = response.data.text;
      console.log('STT Result:', text);
      // Here we could trigger a command or a chat response
      setIsProcessing(false);
      return text;
    } catch (error) {
      console.error('STT Error:', error);
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isSpeaking,
    isProcessing,
    speak,
    startRecording,
    stopRecording
  };
};
