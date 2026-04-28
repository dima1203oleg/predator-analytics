/**
 * 🎯 PREDATOR AI Copilot - v58.2-WRAITH
 * -------------------------------------------------------------
 * Sovereign AI Assistant with Neuro-Voice Integration.
 * Focused on Strategic Customs Analytics and Threat Intelligence.
 */

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
  Search
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { factoryApi } from '../../services/api/factory';
import { useBackendStatus } from '../../hooks/useBackendStatus';
import { Terminal } from 'lucide-react';

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
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [activeAgent, setActiveAgent] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const speakIdRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const fetchInsights = async () => {
      try {
        const [stats, goldPatterns] = await Promise.all([
          factoryApi.getStats(),
          factoryApi.getGoldPatterns()
        ]);

        if (!mounted) return;

        const dynamicSuggestions: Suggestion[] = [];

        if (stats && stats.total_patterns !== undefined) {
          dynamicSuggestions.push({
            id: `stat-${Date.now()}`,
            type: 'insight',
            title: 'АНАЛІТИКА GLM-5.1 WRAITH',
            description: `СУВЕ� ЕННЕ ЯД� О: ${stats.total_patterns} паттернів. ZROK Tunnel: ${backendStatus.nodeSource}.`,
            confidence: 0.99,
            impact: 'high'
          });
        }

        if (goldPatterns && goldPatterns.length > 0) {
          const topPattern = goldPatterns[0];
          dynamicSuggestions.push({
            id: `gold-${Date.now()}`,
            type: 'action',
            title: 'АҐЕНТНИЙ АНАЛІЗ GLM-5.1',
            description: `Виявлено критичну аномалію "${topPattern.name}". � екомендовано SWE-Bench перевірку.`,
            confidence: 0.98,
            impact: 'high'
          });
        }

        if (dynamicSuggestions.length === 0) {
          dynamicSuggestions.push({
            id: `default-${Date.now()}`,
            type: 'opportunity',
            title: 'SOVEREIGN AGENT ONLINE',
            description: `GLM-5.1 активовано. Вузол: ${backendStatus.nodeSource}. Очікування директив...`,
            confidence: 0.99,
            impact: 'low'
          });
        }

        setSuggestions(dynamicSuggestions);
        
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AICopilot',
            message: `СИНХ� ОНІЗАЦІЯ GLM-5.1 [${backendStatus.nodeSource}]: АКТИВНО. ${stats?.total_patterns || 0} ПАТТЕ� НІВ.`,
            severity: 'info',
            timestamp: new Date().toISOString(),
            code: 'AI_SYNC_WRAITH'
          }
        }));
      } catch (error: any) {
         if (mounted) {
           window.dispatchEvent(new CustomEvent('predator-error', {
             detail: {
               service: 'AICopilot',
               message: `К� ИТИЧНА ПОМИЛКА КОГНІТИВНОГО ПО� ТУ: ${error?.message || 'TIMEOUT'}. ВУЗОЛ: ${backendStatus.nodeSource}`,
               severity: 'error',
               timestamp: new Date().toISOString(),
               code: 'AI_PORT_FAILURE'
             }
           }));
           setSuggestions([{
              id: `error-${Date.now()}`,
              type: 'warning',
              title: 'СЕКТО� НИЙ ТАЙМ-АУТ',
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
      const response = await fetch('/api/v1/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setAiResponse('ГЛУБОКЕ СКАНУВАННЯ GLM-5.1 [SOVEREIGN AGENT]...');
    setActiveAgent(`GLM-5.1 ↔ ZROK [${backendStatus.nodeSource}]`);
    try {
      const res = await api.premium.query(query);
      const answer = res.answer || res.response || res.result;
      if (answer) {
        setAiResponse(answer);
        setActiveAgent(res.agent || 'PREDATOR_CORE');
        speak(answer);
        
        window.dispatchEvent(new CustomEvent('predator-error', {
          detail: {
            service: 'AICopilot',
            message: `ЗАПИТ ВИКОНАНО [${res.agent || 'CORE'}]: ${query.substring(0, 30)}... [GLM-5.1]`,
            severity: 'success',
            timestamp: new Date().toISOString(),
            code: 'AI_QUERY_SUCCESS'
          }
        }));
      } else {
        setAiResponse(`✨ КОМАНДУ ВИКОНАНО. СТ� АТЕГІЧНІ ДАНІ ОНОВЛЕНО.`);
      }
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'AICopilot',
          message: `ПОМИЛКА ВИКОНАННЯ ЗАПИТУ: ${e?.message}. ВУЗОЛ: ${backendStatus.nodeSource}`,
          severity: 'error',
          timestamp: new Date().toISOString(),
          code: 'AI_QUERY_FAILURE'
        }
      }));
      setAiResponse(`ПОМИЛКА СУВЕ� ЕННОГО КЛАСТЕ� А: ${e?.message}. Перевірте статус NVIDIA сертифіката.`);
    }
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'uk-UA';
        recognition.continuous = false;
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          if (transcript) {
             setMessage(transcript);
             handleSend(transcript);
          }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
      }
    } else {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, shadow: "0 0 0px transparent" }} 
            animate={{ scale: 1, shadow: "0 0 50px rgba(225,29,72,0.3)" }} 
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-12 right-12 z-[100] w-24 h-24 rounded-[32px] bg-black border-2 border-rose-500/40 flex items-center justify-center group overflow-hidden shadow-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-rose-500/5 animate-pulse" />
            <Brain className="w-12 h-12 text-rose-500 group-hover:scale-110 transition-transform relative z-10" strokeWidth={1.5} />
            <motion.div 
               className="absolute inset-0 border-2 border-rose-500/40 rounded-[32px]" 
               animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }} 
               transition={{ duration: 3, repeat: Infinity }} 
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed z-[150] bg-black/95 backdrop-blur-[40px] border-2 border-rose-500/20 shadow-[0_50px_150px_rgba(0,0,0,1)] overflow-hidden flex flex-col transition-all duration-700",
              isExpanded ? "inset-8 rounded-[4rem]" : "bottom-12 right-12 w-[520px] h-[850px] rounded-[3rem]"
            )}
          >
            {/* Elite Header */}
            <div className="p-10 border-b border-rose-500/10 bg-gradient-to-r from-rose-500/5 via-transparent to-rose-500/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl shadow-xl">
                  <Fingerprint className="w-10 h-10 text-rose-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                    PREDATOR <span className="text-rose-500">AI</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_#e11d48]" />
                    <p className="text-[10px] text-rose-500/60 font-black uppercase tracking-[0.4em] font-mono">SOVEREIGN_WRAITH_v58.2_GLM-5.1</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={cn("text-[8px] font-black px-2 py-0.5 rounded border", backendStatus.isOffline ? "border-rose-500/40 text-rose-500 bg-rose-500/5" : (backendStatus.activeFailover ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/5" : "border-rose-500/40 text-rose-500 bg-rose-500/5"))}>
                          ВУЗОЛ: {backendStatus.isOffline ? "ВІДНОВЛЕННЯ" : (backendStatus.activeFailover ? "ZROK_FAILOVER" : "PRIMARY_CLUSTER")}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:text-rose-500 transition-all hover:bg-rose-500/10">
                  {isExpanded ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar relative">
             <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
                  <Brain size={400} className="text-rose-500" />
               </div>

               <div className="space-y-6 relative z-10">
                  <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] italic flex items-center gap-4">
                    <Layers size={16} className="text-rose-500" /> СТ� АТЕГІЧНИЙ_ФІД_WRAITH
                  </h4>
                  {suggestions.map((s) => (
                    <motion.div 
                        key={s.id} 
                        whileHover={{ y: -4, border: '1px solid rgba(225,29,72,0.4)' }}
                        className="p-8 bg-white/[0.03] border border-white/5 rounded-[40px] transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
                    >
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

               {aiResponse && (
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="p-10 bg-rose-500/5 border-2 border-rose-500/20 rounded-[3rem] relative overflow-hidden shadow-3xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-6">
                       <Zap size={24} className="text-rose-500 animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.6)]" />
                       <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono">{activeAgent}</span>
                    </div>
                    <p className="text-xl font-black text-white italic leading-relaxed tracking-tight underline decoration-rose-500/10 underline-offset-8 decoration-4">{aiResponse}</p>
                  </div>
                </motion.div>
              )}
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
                    isListening ? "bg-rose-600 text-white animate-pulse shadow-[0_0_30px_#e11d48]" : "bg-slate-900 border border-rose-500/20 text-rose-500 hover:border-rose-500/50 hover:text-white"
                  )}
                >
                  {isListening ? <Activity size={32} /> : <Mic size={32} />}
                </motion.button>
                <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="ВВЕДІТЬ_СТ� АТЕГІЧНУ_КОМАНДУ..."
                      className="w-full bg-slate-950 border-2 border-rose-500/10 rounded-[2.5rem] px-10 py-8 text-white font-mono text-[16px] uppercase italic tracking-[0.1em] focus:outline-none focus:border-rose-500/40 transition-all placeholder:text-slate-800 shadow-inner"
                    />
                    <div className="absolute top-1/2 right-10 -translate-y-1/2 flex items-center gap-4 text-slate-800">
                        <Terminal size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">ГОТОВИЙ</span>
                    </div>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSend()} 
                    className="p-8 bg-rose-500 text-black rounded-[2.5rem] font-black shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:shadow-[0_0_60px_rgba(225,29,72,0.6)] transition-all"
                >
                  <Send size={32} />
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-800 text-center mt-6 font-black uppercase tracking-[0.5em] italic">ЗАСЕК� ЕЧЕНЕ СЕ� ЕДОВИЩЕ PREDATOR // ВИМАГАЄТЬСЯ ДОПУСК ТІ� -1</p>
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
