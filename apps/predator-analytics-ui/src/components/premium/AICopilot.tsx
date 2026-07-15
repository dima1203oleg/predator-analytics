/**
 * 🎯 PREDATOR AI Copilot - v63.0-ELITE
 * -------------------------------------------------------------
 * Sovereign AI Assistant with Neuro-Voice Integration.
 * Focused on Strategic Customs Analytics and Threat Intelligence.
 * 
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Brain,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  Ear,
  Eye,
  Activity,
  Cpu,
  ShieldAlert,
  Fingerprint,
  Layers,
  Search,
  Terminal
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { factoryApi } from '../../services/api/factory';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { NeuralPulse } from '@/components/ui/NeuralPulse';
import { useWebSocket } from '../../hooks/useWebSocket';

import { API_BASE_URL } from '@/services/api/config';

interface Suggestion {
  id: string;
  type: 'insight' | 'warning' | 'opportunity' | 'action';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export const Predator: React.FC = () => {
  const { isCopilotOpen: isOpen, setCopilotOpen: setIsOpen } = useAppStore();
  const backendStatus = useBackendStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const wasExpandedRef = useRef(false);
  const isClosingRef = useRef(false);

  // Запам'ятовуємо розмір панелі при відкритті для коректної анімації закриття
  useEffect(() => {
    if (isOpen && !isClosingRef.current) {
      wasExpandedRef.current = isExpanded;
    }
  }, [isOpen, isExpanded]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    wasExpandedRef.current = isExpanded;

    if (isExpanded) {
      // Спочатку згортаємо, потім закриваємо
      setIsExpanded(false);
      setTimeout(() => {
        setIsOpen(false);
        isClosingRef.current = false;
      }, 400);
    } else {
      setIsOpen(false);
      setTimeout(() => { isClosingRef.current = false; }, 400);
    }
  };
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [activeAgent, setActiveAgent] = useState<string>('');
  const [history, setHistory] = useState<Array<{ role: string, content: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [vramInfo, setVramInfo] = useState<{ used_gb: number, total_gb: number, critical: boolean, mode: string } | null>(null);
  const [nodeStatus, setNodeStatus] = useState<'SOVEREIGN' | 'KAGGLE_RESERVE'>('SOVEREIGN');
  const [ramUsage, setRamUsage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speakIdRef = useRef<number>(0);

  const { sendMessage } = useWebSocket('/ws/copilot', {
    reconnect: true,
    onMessage: (msg: any) => {
      if (msg.type === 'thinking') {
        setAiResponse('');
        setIsStreaming(true);
        if (msg.vram) {
          setVramInfo(msg.vram);
          setActiveAgent(`${msg.vram.mode === 'CLOUD' ? 'GEMINI-PRO (CLOUD)' : 'NEMOTRON-30B (SOVEREIGN)'}`);
        } else {
          setActiveAgent(`GLM-5.1 ↔ [${backendStatus.nodeSource}]`);
        }
      } else if (msg.type === 'chunk') {
        setAiResponse(prev => prev + (msg.text || ''));
      } else if (msg.type === 'complete') {
        setIsStreaming(false);
        setHistory(prev => [...prev, { role: 'assistant', content: msg.reply }]);
        speak(msg.reply);
        
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AICopilot',
            message: `ЗАПИТ ВИКОНАНО [GLM-5.1]: СТРАТЕГІЧНИЙ АНАЛІЗ ЗАВЕРШЕНО`,
            severity: 'success',
            timestamp: new Date().toISOString(),
            code: 'AI_WS_SUCCESS'
          }
        }));
      } else if (msg.type === 'error') {
        setIsStreaming(false);
        setAiResponse(`ПОМИЛКА СУВЕРЕННОГО КЛАСТЕРА: ${msg.message}`);
      }
    }
  });

  useEffect(() => {
    let mounted = true;

    const fetchInsights = async () => {
      try {
        const [stats, goldPatterns, wargamingScenarios] = await Promise.all([
          factoryApi.getStats(),
          factoryApi.getGoldPatterns(),
          factoryApi.getWargamingScenarios()
        ]);

        if (!mounted) return;

        const dynamicSuggestions: Suggestion[] = [];

        // War-Gaming Scenarios
        if (wargamingScenarios && wargamingScenarios.length > 0) {
          wargamingScenarios.forEach((scenario: any) => {
            if (scenario.probability > 50) {
              dynamicSuggestions.push({
                id: `war-${scenario.id}-${Date.now()}`,
                type: 'warning',
                title: `ЗАГРОЗА: ${scenario.name}`,
                description: scenario.description,
                confidence: scenario.probability / 100,
                impact: scenario.impact_level?.toLowerCase() || 'high'
              });
            }
          });
        }

        if (stats && stats.total_patterns !== undefined) {
          setRamUsage(stats.ram_usage_percent || 0);
          dynamicSuggestions.push({
            id: `stat-${Date.now()}`,
            type: 'insight',
            title: 'АНАЛІТИКА GLM-5.1 ELITE',
            description: `СУВЕРЕННЕ ЯДРО: ${stats.total_patterns} патернів. Тунель ZROK: ${backendStatus.nodeSource}.`,
            confidence: 0.99,
            impact: 'high'
          });
        }

        if (goldPatterns && goldPatterns.length > 0) {
          const topPattern = goldPatterns[0];
          dynamicSuggestions.push({
            id: `gold-${Date.now()}`,
            type: 'action',
            title: 'АГЕНТНИЙ АНАЛІЗ GLM-5.1',
            description: `Виявлено критичну аномалію "${topPattern.name}". Рекомендовано SWE-Bench перевірку.`,
            confidence: 0.98,
            impact: 'high'
          });
        }

        if (dynamicSuggestions.length === 0) {
          dynamicSuggestions.push({
            id: `default-${Date.now()}`,
            type: 'opportunity',
            title: 'СУВЕРЕННИЙ АГЕНТ ОНЛАЙН',
            description: `GLM-5.1 активовано. Вузол: ${backendStatus.nodeSource}. Очікування директив...`,
            confidence: 0.99,
            impact: 'low'
          });
        }

        setSuggestions(dynamicSuggestions);
        
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AICopilot',
            message: `СИНХРОНІЗАЦІЯ GLM-5.1 [${backendStatus.nodeSource}]: АКТИВНО. ${stats?.total_patterns || 0} ПАТТЕРНІВ.`,
            severity: 'info',
            timestamp: new Date().toISOString(),
            code: 'AI_SYNC_ELITE'
          }
        }));
      } catch (error: any) {
         if (mounted) {
           window.dispatchEvent(new CustomEvent('predator-error', {
             detail: {
               service: 'AICopilot',
               message: `КРИТИЧНА ПОМИЛКА КОГНІТИВНОГО ПОРТУ: ${error?.message || 'TIMEOUT'}. ВУЗОЛ: ${backendStatus.nodeSource}`,
               severity: 'error',
               timestamp: new Date().toISOString(),
               code: 'AI_PORT_FAILURE'
             }
           }));
           setSuggestions([{
              id: `error-${Date.now()}`,
              type: 'warning',
              title: 'СЕКТОРНИЙ ТАЙМ-АУТ',
              description: 'Спроба підключення до Strategic Knowledge Map завершилась затримкою.',
              confidence: 0.5,
              impact: 'medium'
           }]);
         }
      }
    };

    fetchInsights();
    const interval = setInterval(fetchInsights, 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const speak = async (text: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const currentSpeakId = ++speakIdRef.current;
      const response = await fetch(`${API_BASE_URL}/ai/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', },
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error('TTS Failed');
      if (speakIdRef.current !== currentSpeakId) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    } catch (e) {
      console.error("TTS Error:", e);
    }
  };

  const handleSend = async (forcedQuery?: string) => {
    const query = forcedQuery || message;
    if (!query.trim()) return;
    if (!forcedQuery) setMessage('');
    
    setAiResponse('ІНІЦІАЛІЗАЦІЯ КАНАЛУ GLM-5.1...');
    setHistory(prev => [...prev, { role: 'user', content: query }]);
    
    if (!backendStatus.isOffline) {
      sendMessage({
        type: 'copilot_query',
        payload: { message: query, history }
      });
    } else {
      console.warn("WS disconnected. Using HTTP fallback.");
      try {
        const response = await fetch(`${API_BASE_URL}/copilot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query, history })
        });
        if (response.ok) {
          const data = await response.json();
          setAiResponse(data.response);
          speak(data.response);
        } else {
          setAiResponse("ПОМИЛКА З'ЄДНАННЯ (HTTP FALLBACK)");
        }
      } catch (err) {
        setAiResponse("ВІДСУТНІЙ ЗВ'ЯЗОК З СЕРВЕРОМ");
      }
    }
  };

  const handleVoiceToggle = async () => {
    if (!isListening) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          setIsListening(false);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          try {
            const response = await fetch(`${API_BASE_URL}/ai/stt`, {
              method: 'POST',
              body: formData,
            });
            if (response.ok) {
              const data = await response.json();
              if (data.text) {
                setMessage(data.text);
                handleSend(data.text);
              }
            }
          } catch (e) {
            console.error("STT Error:", e);
          }
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        setIsListening(false);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, shadow: "0 0 0px transparent" }} 
            animate={{ scale: 1, shadow: "0 0 50px rgba(34,211,238,0.3)" }} 
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-[100] w-24 h-24 rounded-[32px] bg-black border-2 border-cyan-400/40 flex items-center justify-center group overflow-hidden shadow-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-cyan-400/5 " />
            <Brain className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform relative z-10" strokeWidth={1.5} />
            <motion.div 
               className="absolute inset-0 border-2 border-cyan-400/40 rounded-[32px]" 
               animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }} 
               transition={{ duration: 3, repeat: Infinity }} 
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="popLayout">
        {isOpen && (
          <motion.div
            key="copilot-panel"
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 200, x: 100 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={(definition) => {
              if (definition === 'exit') {
                isClosingRef.current = false;
              }
            }}
            className={cn(
              "fixed z-[150] bg-black/95 rounded-[40px] border-2 border-rose-500/20 shadow-[0_50px_150px_rgba(0,0,0,1)] overflow-hidden flex flex-col",
              (isClosingRef.current ? wasExpandedRef.current : isExpanded)
                ? "inset-4 sm:inset-8 rounded-[2rem] sm:rounded-[4rem]" : "bottom-12 right-4 sm:right-12 w-[calc(100vw-2rem)] sm:w-[520px] h-[80vh] sm:h-[850px] rounded-[2rem] sm:rounded-[3rem]"
            )}
          >
            {/* Elite Header */}
            <div className="p-10 border-b border-rose-500/10 bg-gradient-to-r from-rose-500/5 via-transparent to-rose-500/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl shadow-xl">
                  <Fingerprint className="w-10 h-10 text-rose-500 " />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3 hover-chromatic transition-all duration-300">
                    PREDATOR <span className="text-rose-500">AI</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_#e11d48]" />
                    <p className="text-[10px] text-rose-500/60 font-black uppercase tracking-[0.4em] font-mono">СУВЕРЕН_ЕЛІТ_v63.0-ELITE</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={cn("text-[8px] font-black px-2 py-0.5 rounded border", backendStatus.isOffline ? "border-rose-500/40 text-rose-500 bg-rose-500/5" : (backendStatus.activeFailover ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/5" : "border-rose-500/40 text-rose-500 bg-rose-500/5"))}>
                          ВУЗОЛ: {backendStatus.isOffline ? "ВІДНОВЛЕННЯ" : (backendStatus.activeFailover ? "РЕЗЕРВ_ZROK" : "ОСНОВНИЙ_КЛАСТЕР")}
                       </span>
                       {vramInfo && (
                         <span className={cn("text-[8px] font-black px-2 py-0.5 rounded border", vramInfo.critical ? "border-rose-500 bg-rose-500/20 text-white " : "border-white/10 text-slate-400")}>
                           VRAM: {vramInfo.used_gb} / {vramInfo.total_gb} GB
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="cyber" onClick={() => { if (!isClosingRef.current) setIsExpanded(!isExpanded); }} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:text-rose-500 transition-all hover:bg-rose-500/10" title={isExpanded ? "Згорнути" : "Розширити"}>
                  {isExpanded ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </Button>
                <Button variant="cyber" onClick={handleClose} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:text-rose-500 transition-all hover:bg-rose-500/10" title="Закрити">
                  <X size={24} />
                </Button>
              </div>
            </div>

            {/* Node Status & RAM Guard — v63.0-ELITE */}
            <div className="flex items-center gap-6 px-10 py-4 bg-white/[0.02] border-b border-rose-500/10 ">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full  shadow-lg ${nodeStatus === 'KAGGLE_RESERVE' ? 'bg-blue-400 shadow-blue-500/50' : 'bg-emerald-400 shadow-emerald-500/50'}`} />
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">
                  Active_Node: <span className="text-white/80">{nodeStatus === 'KAGGLE_RESERVE' ? 'Kaggle_Reserve_Node_01' : 'Sovereign_Primary_NVIDIA'}</span>
                </span>
              </div>
              
              <div className="h-6 w-[1px] bg-rose-500/10" />
              
              <div className="flex items-center gap-4 flex-1">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">RAM_Guard:</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${ramUsage}%` }}
                    className={`h-full transition-all duration-1000 ${ramUsage > 85 ? 'bg-rose-600' : ramUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
                <span className="text-[10px] font-mono font-black text-white/60">{ramUsage}%</span>
              </div>

              {ramUsage > 80 && (
                <motion.button 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setNodeStatus(nodeStatus === 'SOVEREIGN' ? 'KAGGLE_RESERVE' : 'SOVEREIGN')}
                  className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 rounded-xl text-[9px] uppercase font-black text-rose-500 transition-all shadow-lg"
                >
                  Failover_to_Kaggle
                </motion.button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar relative">
               <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                  <NeuralPulse color="rgba(244, 63, 94, 0.08)" size={800} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/5 blur-[120px] rounded-full " />
               </div>
               
               <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none group-hover:rotate-6 transition-transform duration-1000">
                  <Brain size={450} className="text-rose-500" />
               </div>

               <div className="space-y-6 relative z-10">
                  <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] italic flex items-center gap-4">
                    <Layers size={16} className="text-rose-500" /> СТРАТЕГІЧНИЙ_ФІД_ELITE
                  </h4>
                  {suggestions.map((s) => (
                    <motion.div 
                        key={s.id} 
                        whileHover={{ y: -4, border: '1px solid rgba(225,29,72,0.4)' }}
                        className="p-8 bg-white/[0.03] border border-white/5 rounded-[40px] transition-all cursor-pointer group shadow-2xl relative overflow-hidden panel-3d"
                    >
                      {/* Nexus Corners */}
                      <div className="hud-corner-tl hud-corner-nexus" />
                      <div className="hud-corner-tr hud-corner-nexus" />
                      <div className="hud-corner-bl hud-corner-nexus" />
                      <div className="hud-corner-br hud-corner-nexus" />
                      <div className="scanline-nexus opacity-10" />
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 via-rose-500 to-transparent opacity-40" />
                      <div className="flex items-start gap-6">
                        <div className="p-4 bg-black border border-white/10 rounded-2xl group-hover:bg-rose-500/10 group-hover:border-rose-500/40 transition-all shadow-inner">
                          {getSuggestionIcon(s.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                             <h5 className="text-[16px] font-black text-white uppercase italic tracking-wide">{s.title}</h5>
                             <span className={cn("text-[9px] font-black uppercase px-3 py-1.5 border rounded-xl shadow-lg", getImpactColor(s.impact))}>{s.impact}</span>
                          </div>
                          <p className="text-[13px] text-slate-400 font-bold leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">{s.description}</p>
                          <div className="mt-6 h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s.confidence * 100}%` }} className="h-full bg-gradient-to-r from-rose-600 to-rose-400" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
               </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    className="p-12 bg-rose-950/20  border-2 border-rose-500/30 rounded-[3.5rem] relative overflow-hidden shadow-3xl group holo-shimmer"
                >
                  <div className="hud-corner-tl hud-corner-nexus hud-corner-rose opacity-40" />
                  <div className="hud-corner-tr hud-corner-nexus hud-corner-rose opacity-40" />
                  <div className="hud-corner-bl hud-corner-nexus hud-corner-rose opacity-40" />
                  <div className="hud-corner-br hud-corner-nexus hud-corner-rose opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full -mr-10 -mt-10 " />
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="relative">
                          <Zap size={28} className="text-rose-500  relative z-10" />
                          <div className="absolute inset-0 bg-rose-500 blur-lg opacity-40 animate-ping" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[12px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono leading-none">{activeAgent}</span>
                          <span className="text-[8px] font-black text-rose-500/40 uppercase tracking-[0.3em] mt-1 italic">НЕЙРО_ПОТІК_РЕАЛЬНОГО_ЧАСУ</span>
                       </div>
                    </div>
                    <p className="text-2xl font-black text-white italic leading-relaxed tracking-tight underline decoration-rose-500/20 underline-offset-8 decoration-8 group-hover:text-rose-50 transition-colors">
                       {aiResponse}
                       {isStreaming && <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-1.5 h-7 bg-rose-500 ml-2 align-middle shadow-[0_0_10px_#e11d48]" />}
                    </p>
                    <div className="mt-8 flex items-center gap-4 text-[9px] font-black text-rose-500/30 uppercase tracking-[0.4em] italic font-mono">
                       <Activity size={12} className="" /> СИЛА_СИГНАЛУ: 99.8% // ШИФРОВАНИЙ_ЗВ'ЯЗОК_АКТИВНО
                    </div>
                  </div>
                </motion.div>
            </div>

            {/* Premium Input Area */}
            <div className="p-10 bg-black border-t border-rose-500/10">
              <div className="flex items-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleVoiceToggle} 
                  className={cn(
                    "p-8 rounded-[2.5rem] transition-all shadow-3xl flex items-center justify-center",
                    isListening ? "bg-rose-600 text-white  shadow-[0_0_30px_#e11d48]" : "bg-slate-900 border border-rose-500/20 text-rose-500 hover:border-rose-500/50 hover:text-white"
                  )}
                >
                  {isListening ? <Activity size={32} /> : <Mic size={32} />}
                </motion.button>
                <div className="flex-1 relative group">
                    <input 
                      type="text" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="ВВЕДІТЬ_СТРАТЕГІЧНУ_КОМАНДУ..."
                      className="w-full bg-slate-950 border-2 border-rose-500/10 rounded-[2.5rem] px-12 py-9 text-white font-mono text-[17px] uppercase italic tracking-[0.1em] focus:outline-none focus:border-rose-500/50 transition-all placeholder:text-slate-900 shadow-2xl relative z-10"
                    />
                    <div className="absolute inset-0 bg-rose-500/5 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute top-1/2 right-12 -translate-y-1/2 flex items-center gap-5 text-slate-800 z-20">
                        <Terminal size={22} className="group-focus-within:text-rose-500 transition-colors" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] group-focus-within:text-rose-500 transition-colors">ГОТОВО</span>
                    </div>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSend()} 
                    className="p-8 bg-rose-500 text-black rounded-[2.5rem] font-black  hover: transition-all"
                >
                  <Send size={32} />
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-800 text-center mt-6 font-black uppercase tracking-[0.5em] italic">ЗАСЕКРЕЧЕНЕ СЕРЕДОВИЩЕ PREDATOR // ВИМАГАЄТЬСЯ ДОПУСК ТІР-1</p>
            </div>
            <audio ref={audioRef} style={{ display: 'none' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'insight': return <Lightbulb size={24} className="text-rose-500" />;
    case 'warning': return <AlertTriangle size={24} className="text-rose-700" />;
    case 'opportunity': return <Target size={24} className="text-emerald-500" />;
    case 'action': return <Zap size={24} className="text-rose-600" />;
    default: return <Brain size={24} />;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    case 'medium': return 'bg-rose-600/10 text-rose-600 border-rose-600/20';
    case 'low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};

export default Predator;
