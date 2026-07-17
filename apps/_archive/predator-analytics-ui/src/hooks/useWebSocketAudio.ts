import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

const WS_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/^http/, 'ws');

export const useWebSocketAudio = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsStatus, setWsStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  


  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsStreaming(false);
    setWsStatus('DISCONNECTED');
  }, []);

  const connectAndStream = useCallback(async () => {
    try {
      setWsStatus('CONNECTING');
      
      // 1. Establish WebSocket
      // Passing token via query param is common for WS, but depends on your auth logic.
      // Assuming FastAPI ignores token for now or handles it appropriately.
      const wsUrl = `${WS_BASE_URL}/voice/stream`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      
      ws.onopen = () => {
        setWsStatus('CONNECTED');
        setIsStreaming(true);
      };
      
      ws.onclose = () => {
        disconnect();
      };
      
      ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        disconnect();
      };
      
      ws.onmessage = async (event) => {
        // Incoming audio from TTS (Piper)
        if (event.data instanceof ArrayBuffer) {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          try {
            const audioBuffer = await audioCtx.decodeAudioData(event.data);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start(0);
          } catch (err) {
            console.error("Помилка декодування аудіо з WS:", err);
          }
        }
      };
      
      wsRef.current = ws;

      // 2. Setup Audio Recording (16kHz PCM)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // ScriptProcessor is deprecated but easiest for raw PCM capture without AudioWorklet.
      // 4096 buffer size is a good balance for streaming.
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0); // Float32Array [-1.0, 1.0]
          
          // Convert Float32 to Int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          wsRef.current.send(pcmData.buffer);
        }
      };
      
      source.connect(processor);
      processor.connect(audioCtx.destination);
      
    } catch (error) {
      console.error('Не вдалося ініціалізувати запис аудіо:', error);
      disconnect();
    }
  }, [disconnect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isStreaming,
    wsStatus,
    startStreaming: connectAndStream,
    stopStreaming: disconnect
  };
};
