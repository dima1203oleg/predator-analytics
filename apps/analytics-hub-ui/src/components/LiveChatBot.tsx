import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, AlertCircle, Send, X, MessageSquare, Bot, Volume2, VolumeX } from 'lucide-react';

function pcmToBase64(pcmData: Float32Array): string {
  const buffer = new ArrayBuffer(pcmData.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < pcmData.length; i++) {
    let s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export function LiveChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isTTSMuted, setIsTTSMuted] = useState(false);
  const isTTSMutedRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('mariarti_chat_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
    return [];
  });

  useEffect(() => {
    isTTSMutedRef.current = isTTSMuted;
  }, [isTTSMuted]);

  useEffect(() => {
    localStorage.setItem('mariarti_chat_history', JSON.stringify(messages));
  }, [messages]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [frequencies, setFrequencies] = useState<number[]>(new Array(16).fill(0));

  useEffect(() => {
    let animationFrameId: number;
    const updateFrequencies = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const step = Math.floor(dataArray.length / 16);
        const newFreqs = [];
        for (let i = 0; i < 16; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j];
          }
          newFreqs.push(sum / step);
        }
        setFrequencies(newFreqs);
      }
      animationFrameId = requestAnimationFrame(updateFrequencies);
    };
    updateFrequencies();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to WS on mount to allow text chatting without mic
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/live`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.text) {
        setMessages(prev => {
          // If the last message is from bot, append to it, else create new
          const newMsgs = [...prev];
          if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].sender === 'bot') {
            newMsgs[newMsgs.length - 1].text += msg.text;
          } else {
            newMsgs.push({ id: Date.now().toString(), sender: 'bot', text: msg.text });
          }
          return newMsgs;
        });
      }
      
      if (msg.audio && outputAudioCtxRef.current) {
        const outputAudioCtx = outputAudioCtxRef.current;
        const binary = atob(msg.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 0x8000;
        }

        const audioBuffer = outputAudioCtx.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const sourceNode = outputAudioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        
        // Deepen and mask the voice by lowering playback rate
        sourceNode.playbackRate.value = 0.82; // Lower pitch slightly for depth

        // Anonymous/Masked voice effect: Bandpass filter
        const bandpass = outputAudioCtx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1000;
        bandpass.Q.value = 0.8;

        // Add a bit of distortion
        const distortion = outputAudioCtx.createWaveShaper();
        function makeDistortionCurve(amount) {
          const k = typeof amount === 'number' ? amount : 50,
            n_samples = 44100,
            curve = new Float32Array(n_samples),
            deg = Math.PI / 180;
          for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
          }
          return curve;
        }
        distortion.curve = makeDistortionCurve(10);
        distortion.oversample = '4x';


        if (!analyserRef.current) {
          analyserRef.current = outputAudioCtx.createAnalyser();
          analyserRef.current.fftSize = 64;
        }
        
        // We connect source to a specific gain node for volume control, then to analyser, then to destination.
        // Wait, if it's muted, we want visualizer to still work.
        // So source -> analyser -> gain -> destination.
        // To avoid connecting analyser to multiple gain nodes, we just create a single gain node per outputAudioCtx, but we don't have a ref for it.
        // Let's just mute at the source if we don't care about visualizer when muted, OR we can attach the gainNode to the outputAudioCtxRef.
        // Actually, if we just set gainNode per source before analyser, visualizer won't work when muted.
        // To keep it simple, let's just make the volume 0 for the source if muted, visualizer will be flat. 
        // Or better: source -> gainNode -> analyser -> destination (analyser is connected to destination once).
        // Wait, if gain is 0, analyser gets 0.
        // Let's do: source -> analyser -> destination. And if muted, just don't play? The user asked to toggle TTS, they probably expect visualizer to still show the bot is speaking.
        // Let's add a gainNodeRef.
        
        if (!analyserRef.current) {
            // First time setup
            const analyser = outputAudioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;
            
            const gainNode = outputAudioCtx.createGain();
            gainNodeRef.current = gainNode;
            
            // source -> analyser -> gain -> destination
            analyser.connect(gainNode);
            gainNode.connect(outputAudioCtx.destination);
        }
        
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isTTSMutedRef.current ? 0 : 1;
        }
        
        sourceNode.connect(distortion);
          distortion.connect(bandpass);
          bandpass.connect(analyserRef.current);
        
        if (nextStartTimeRef.current < outputAudioCtx.currentTime) {
          nextStartTimeRef.current = outputAudioCtx.currentTime;
        }
        sourceNode.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
      }
      
      if (msg.interrupted && outputAudioCtxRef.current) {
         nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
      }
    };

    ws.onclose = () => {
      stopMic();
    };

    return () => {
      ws.close();
      stopMic();
    };
  }, []);

  const startMic = async () => {
    try {
      setError(null);
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket disconnected. Please refresh the page.");
      }

      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      setIsActive(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start microphone.");
      stopMic();
    }
  };

  const stopMic = () => {
    setIsActive(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    // We don't close outputAudioCtx because we might still get voice from text messages!
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !wsRef.current) return;
    
    // Check if output ctx is initialized for text-triggered audio
    if (!outputAudioCtxRef.current) {
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: textInput }]);
    
    wsRef.current.send(JSON.stringify({ text: textInput }));
    setTextInput('');
  };

  const handleSuggestionClick = (text: string) => {
    if (!wsRef.current) return;
    
    if (!outputAudioCtxRef.current) {
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: text }]);
    wsRef.current.send(JSON.stringify({ text: text }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] glass-panel-premium border-slate-800 border-glow rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-2 py-1.5 bg-black/30 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">MARIARTI</h3>
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE / VOICE + TEXT
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="opacity-50 flex flex-col items-center justify-center space-y-2">
                    <Bot className="w-12 h-12 text-blue-400" />
                    <p className="text-xs text-slate-300 font-mono">MARIARTI готовий.<br/>Задайте питання або увімкніть мікрофон.</p>
                  </div>
                  <div className="w-full px-2 pt-2 space-y-1.5 text-left">
                    <p className="text-xs uppercase tracking-wider font-mono text-blue-400/70 font-semibold px-1">Швидкі розслідування:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        "Проаналізуй ТОВ 'СпецТехПостач'",
                        "Знайди бенефіціарів Коваленка Ігоря",
                        "Перевір Bitcoin гаманець 0x38ac",
                        "Які діють санкції РНБО проти компаній?"
                      ].map((item, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.01, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSuggestionClick(item)}
                          className="w-full text-left p-2.5 rounded-2xl border border-slate-800 hover:border-slate-800 bg-black/20 text-xs text-slate-300 font-mono transition-all"
                        >
                          ⚡ {item}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-2 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-black/40 border border-slate-800 text-slate-300'}`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Toast */}
            {error && (
              <div className="bg-red-950/90 border-t border-red-500/50 text-red-200 px-2 py-1.5 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="truncate">{error}</p>
              </div>
            )}

            {/* Input Area */}
            <div className="p-2 bg-slate-900/60 border-t border-slate-800">
              <form onSubmit={handleSendText} className="flex items-center gap-1.5 bg-slate-950/40 backdrop-blur-md shadow-[0_4px_40px_rgba(30,58,138,0.15)] p-1.5 rounded-2xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={isActive ? stopMic : startMic}
                  className={`p-2 rounded-2xl transition-all ${
                    isActive 
                      ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={isActive ? "Вимкнути мікрофон" : "Увімкнути мікрофон"}
                >
                  {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTTSMuted(!isTTSMuted)}
                  className={`p-2 rounded-2xl transition-all ${
                    isTTSMuted 
                      ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' 
                      : 'text-emerald-400 hover:bg-slate-800 bg-emerald-500/10'
                  }`}
                  title={isTTSMuted ? "Увімкнути звук" : "Вимкнути звук"}
                >
                  {isTTSMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Повідомлення..."
                  className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-200 focus:outline-none placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2 rounded-2xl transition-all bg-blue-600 hover:bg-blue-500 disabled:bg-transparent disabled:text-slate-600 text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all border bg-slate-900/50 backdrop-blur-md shadow-[0_4px_30px_rgba(30,58,138,0.1)] hover:bg-slate-800 text-slate-300 border-slate-800 relative"
      >
        <MessageSquare className="w-5 h-5" />
        {isActive && (
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
