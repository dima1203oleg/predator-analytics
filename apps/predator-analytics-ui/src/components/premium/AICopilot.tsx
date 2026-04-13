/**
 * 🎯 PREDATOR AI Copilot - Revolutionary AI Assistant
 *
 * Killer Feature #1: Інтелектуальний помічник з голосовим управлінням
 * та предиктивною аналітикою
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
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';

import { useAppStore } from '../../store/useAppStore';

import { factoryApi } from '../../services/api/factory';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [activeAgent, setActiveAgent] = useState<string>('');
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
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
            title: 'АНАЛІТИКА ФАБРИКИ v56.4',
            description: `У базі ${stats.total_patterns} патернів. Золотий фонд: ${stats.gold_patterns}. Середній бал: ${stats.avg_score?.toFixed(1) || 0}%.`,
            confidence: 0.95,
            impact: 'medium'
          });
        }

        if (goldPatterns && goldPatterns.length > 0) {
          const topPattern = goldPatterns[0];
          dynamicSuggestions.push({
            id: `gold-${Date.now()}`,
            type: 'action',
            title: 'АКТИВАЦІЯ ЗОЛОТОГО ПАТЕРНУ',
            description: `Патерн "${topPattern.name}" має score ${topPattern.score}. Необхідне негайне втручання.`,
            confidence: topPattern.score / 100,
            impact: 'high'
          });
        }

        if (dynamicSuggestions.length === 0) {
          dynamicSuggestions.push({
            id: `default-${Date.now()}`,
            type: 'opportunity',
            title: 'SOVEREIGN NEXUS ГОТОВИЙ',
            description: 'AI Copilot підключено до суверенного ядра. Очікування цілі...',
            confidence: 0.99,
            impact: 'low'
          });
        }

        setSuggestions(dynamicSuggestions);
      } catch (error) {
         console.warn("Failed to fetch Factory insights for Copilot:", error);
         if (mounted) {
           setSuggestions([{
              id: `error-${Date.now()}`,
              type: 'warning',
              title: 'СИСТЕМНА ПОМИЛКА D-102',
              description: 'Спроба підключення до Knowledge Map завершилась тайм-аутом.',
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
    setAiResponse('СКАНУВАННЯ СУВЕРЕННИМ ЯДРОМ...');
    setActiveAgent('АГЕНТ: ТИТАН-АЛЬФА');
    try {
      const res = await api.premium.query(query);
      const answer = res.answer || res.response || res.result;
      if (answer) {
        setAiResponse(answer);
        setActiveAgent(res.agent || 'PREDATOR_CORE');
        speak(answer);
      } else {
        setAiResponse(`✨ ЗАПИТ ВИКОНАНО. ДАНІ ІНТЕГРОВАНО.`);
      }
    } catch (e: any) {
      setAiResponse(`ПОМИЛКА КЛАСТЕРА: ${e?.message}. ПЕРЕВІРТЕ СТАТУС ВІРТУАЛЬНОЇ МАШИНИ.`);
    }
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'uk-UA';
        recognition.continuous = isInteractiveMode;
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setMessage(transcript);
          handleSend(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => isInteractiveMode && isListening ? recognition.start() : setIsListening(false);
        recognition.start();
      }
    } else {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Cpu className="w-5 h-5 text-amber-500" />;
      case 'warning': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'opportunity': return <Zap className="w-5 h-5 text-emerald-500" />;
      case 'action': return <Target className="w-5 h-5 text-amber-600" />;
      default: return <Activity className="w-5 h-5 text-amber-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
      case 'medium': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      case 'low': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      default: return 'text-slate-500 border-slate-500/30 bg-slate-500/10';
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-10 right-10 z-[60] w-20 h-20 rounded-3xl bg-black border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
            <Brain className="w-10 h-10 text-amber-500 group-hover:scale-110 transition-transform relative z-10" />
            <motion.div className="absolute inset-0 border-2 border-amber-500/40 rounded-3xl" animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className={cn(
              "fixed z-[150] bg-black/90 backdrop-blur-3xl border-2 border-amber-500/20 shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col",
              isExpanded ? "inset-10 rounded-[3rem]" : "bottom-10 right-10 w-[450px] h-[750px] rounded-[2.5rem]"
            )}
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">PREDATOR AI</h3>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <p className="text-[9px] text-amber-500/60 font-black uppercase tracking-[0.3em] font-mono">SOVEREIGN_CORE_v56.4</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:text-amber-500 transition-colors">
                  {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Suggestions & Response Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic flex items-center gap-3">
                   <Target size={14} className="text-amber-500" /> ТАКТИЧНИЙ_ФІД
                 </h4>
                 {suggestions.map((s) => (
                   <motion.div key={s.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-amber-500/30 transition-all cursor-pointer group">
                     <div className="flex items-start gap-5">
                       <div className="p-3 bg-black border border-white/10 rounded-xl group-hover:border-amber-500/40 transition-colors">
                         {getSuggestionIcon(s.type)}
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center justify-between mb-2">
                            <h5 className="text-[14px] font-black text-white uppercase italic tracking-tight">{s.title}</h5>
                            <span className={cn("text-[8px] font-black uppercase px-2 py-1 border rounded-lg", getImpactColor(s.impact))}>{s.impact}</span>
                         </div>
                         <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic">{s.description}</p>
                         <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${s.confidence * 100}%` }} className="h-full bg-amber-500" />
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 ))}
              </div>

              {aiResponse && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-amber-500/5 border-2 border-amber-500/20 rounded-[2rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Brain size={120} className="text-amber-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                       <Zap size={20} className="text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{activeAgent}</span>
                    </div>
                    <p className="text-lg font-black text-white italic leading-relaxed tracking-tight">{aiResponse}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleVoiceToggle} 
                  className={cn(
                    "p-6 rounded-3xl transition-all shadow-2xl",
                    isListening ? "bg-rose-600 text-white animate-pulse" : "bg-black border border-white/10 text-amber-500 hover:text-white"
                  )}
                >
                  {isListening ? <Activity size={24} /> : <Mic size={24} />}
                </button>
                <input 
                  type="text" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="ВВЕДІТЬ_КОМАНДУ_ДЛЯ_PREDATOR..."
                  className="flex-1 bg-black border-2 border-white/5 rounded-3xl px-8 py-6 text-white font-mono text-[14px] uppercase italic tracking-widest focus:outline-none focus:border-amber-500/40 transition-all placeholder:text-slate-800"
                />
                <button onClick={() => handleSend()} className="p-6 bg-amber-500 text-black rounded-3xl font-black shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all">
                  <Zap size={24} />
                </button>
              </div>
            </div>
            <audio ref={audioRef} style={{ display: 'none' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Predator;
