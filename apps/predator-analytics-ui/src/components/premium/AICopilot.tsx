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

interface Suggestion {
  id: string;
  type: 'insight' | 'warning' | 'opportunity' | 'action';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export const Predator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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
    // Simulate AI generating suggestions
    const interval = setInterval(() => {
      const newSuggestion: Suggestion = {
        id: `sug-${Date.now()}`,
        type: ['insight', 'warning', 'opportunity', 'action'][Math.floor(Math.random() * 4)] as any,
        title: [
          'Виявлено аномалію в декларації',
          'Нова можливість для оптимізації',
          'Рекомендація щодо постачальника',
          'Попередження про ризик'
        ][Math.floor(Math.random() * 4)],
        description: 'AI виявив важливу інформацію, яка потребує вашої уваги',
        confidence: 0.7 + Math.random() * 0.3,
        impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any
      };

      setSuggestions(prev => [newSuggestion, ...prev].slice(0, 5));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const speak = async (text: string) => {
    try {
      console.log("🔊 Predator attempting to speak:", text.substring(0, 50) + "...");

      // Stop and clear previous audio to prevent overlapping
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

      // If a new speak call was made while we were fetching this one, abort playback
      if (speakIdRef.current !== currentSpeakId) {
        console.log("⏭️ Skipping outdated audio playback");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      audioRef.current.play().catch(e => {
        console.warn("Autoplay prevented, retrying with new Audio:", e);
        audioRef.current = new Audio(url);
        audioRef.current.play().catch(err => console.error("Playback failed completely:", err));
      });
    } catch (e) {
      console.error("TTS Error:", e);
    }
  };

  const handleSend = async (forcedQuery?: string) => {
    const query = forcedQuery || message;
    if (!query.trim()) return;

    if (!forcedQuery) setMessage('');
    setAiResponse('Аналізую ваші дані через Neural Core...');
    setActiveAgent('Активація каскаду агентів...');

    try {
      const res = await api.ai.query(query);
      const answer = res.answer || res.response || res.result;

      if (answer) {
        setAiResponse(answer);
        setActiveAgent(res.agent || 'Neural Alpha');
        // Автоматично озвучуємо відповідь для інтерактивності
        speak(answer);
      } else {
        setAiResponse(`✨ Запит оброблено. Результат зафіксовано в системі.`);
      }
    } catch (e: any) {
      console.error("AI Copilot Error:", e);
      setAiResponse(`Помилка: ${e?.message}. Можливо, сервер Ollama або API недоступні.`);
    }
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'uk-UA';
        recognition.continuous = isInteractiveMode; // Use continuous if in interactive mode
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setMessage(transcript);
          handleSend(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => {
          if (isInteractiveMode && isListening) {
            recognition.start(); // Restart if in interactive mode
          } else {
            setIsListening(false);
          }
        };
        recognition.start();
      } else {
        alert('Browser speech recognition not supported.');
      }
    } else {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  const handlePulseRead = () => {
    setIsPulseActive(true);
    const summary = suggestions.map(s => `${s.title}. ${s.description}`).join('... ');
    const fullText = `Звіт Predator. ${summary}. Чекаю на ваші вказівки.`;
    speak(fullText);
    setTimeout(() => setIsPulseActive(false), 5000);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'action': return <Target className="w-5 h-5 text-blue-400" />;
      default: return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-10 right-6 z-[60] w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-center justify-center group"
          >
            <Brain className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {suggestions.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
              >
                {suggestions.length}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Copilot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-[150] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl ${isExpanded
              ? 'inset-4'
              : 'bottom-6 right-6 w-[450px] h-[600px]'
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-8 h-8 text-cyan-400" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-full h-full border border-cyan-500/30 border-dashed rounded-full" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">PREDATOR</h3>
                  <div className="flex items-center gap-2">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest">Neural Core v45.0</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePulseRead}
                  className={`p-2 rounded-lg transition-all ${isPulseActive ? 'bg-cyan-500/30 text-cyan-400' : 'hover:bg-cyan-500/10 text-cyan-300'}`}
                  title="Прочитати звіт"
                >
                  <Volume2 className={`w-5 h-5 ${isPulseActive ? 'animate-bounce' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsInteractiveMode(!isInteractiveMode);
                    if (!isInteractiveMode && !isListening) {
                      setTimeout(handleVoiceToggle, 100); // Auto-start listening when enabling
                    }
                  }}
                  className={`p-2 rounded-lg transition-all ${isInteractiveMode ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50' : 'hover:bg-cyan-500/10 text-cyan-300'}`}
                  title="Інтерактивний режим (Predator Ear)"
                >
                  <Ear className={`w-5 h-5 ${isInteractiveMode ? 'animate-pulse text-cyan-400' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-5 h-5 text-gray-300" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-300" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-400" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col h-[calc(100%-80px)]">
              {/* AI Suggestions */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-sm font-semibold text-purple-300 mb-3">
                  <Zap className="w-4 h-4 inline mr-2" />
                  Рекомендації AI
                </h4>

                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {suggestion.title}
                          </h5>
                          <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(suggestion.impact)}`}>
                            {suggestion.impact === 'high' ? 'Високий' : suggestion.impact === 'medium' ? 'Середній' : 'Низький'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{suggestion.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${suggestion.confidence * 100}%` }}
                              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Brain className="w-6 h-6 text-purple-400 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                            {activeAgent || 'Neural Core'}
                          </span>
                          <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        </div>
                        <p className="text-sm text-white whitespace-pre-line leading-relaxed">{aiResponse}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-cyan-500/30 bg-black/40">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceToggle}
                    className={`p-3 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] ${isListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                      }`}
                  >
                    {isListening ? <Activity className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </motion.button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isInteractiveMode ? "Predator слухає активне середовище..." : "Введіть команду для Predator..."}
                    className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/60 transition-all font-mono text-sm"
                  />

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    className="p-3 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
                  >
                    <Zap className="w-5 h-5" />
                  </motion.button>
                </div>
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
