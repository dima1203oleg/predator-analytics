import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, AlertCircle,
  CheckCircle, Copy, ThumbsUp, ThumbsDown, RefreshCw,
  FileText, Target, Shield, Zap
} from 'lucide-react';

// ============================================================================
// AI ANALYST PANEL - Predator v45 | Neural Analytics.0
// Interactive AI-powered analysis with beautiful UX
// ============================================================================

interface AnalysisResult {
  answer: string;
  confidence: number;
  sources: { title: string; relevance: number }[];
  processing_time_ms: number;
  model_used: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: { title: string; relevance: number }[];
    model?: string;
    latency?: number;
  };
}

const TypingIndicator = () => (
  <motion.div
    className="flex items-center gap-2 p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-[#00ffcc] rounded-none shadow-[0_0_8px_#00ffcc]"
          animate={{
            y: [0, -6, 0],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
    <span className="text-[10px] font-orbitron uppercase tracking-widest text-[#00ffcc]/70">PREDATOR AI АНАЛІЗУЄ...</span>
  </motion.div>
);

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const getColor = () => {
    if (confidence >= 0.9) return 'bg-[#00ffcc]/20 text-[#00ffcc] border-[#00ffcc]/50 shadow-[0_0_10px_rgba(0,255,204,0.3)]';
    if (confidence >= 0.7) return 'bg-[#ffaa00]/20 text-[#ffaa00] border-[#ffaa00]/50 shadow-[0_0_10px_rgba(255,170,0,0.3)]';
    return 'bg-[#ff007f]/20 text-[#ff007f] border-[#ff007f]/50 shadow-[0_0_10px_rgba(255,0,127,0.3)]';
  };

  return (
    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-orbitron font-bold border ${getColor()} tracking-wider`}>
      {Math.round(confidence * 100)}% ВПЕВНЕНІСТЬ
    </span>
  );
};

const MessageBubble = ({ message, onCopy, onClose }: { message: Message; onCopy: (text: string) => void; onClose?: () => void }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 relative`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'} relative z-10`}>
        {!isUser && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-sm bg-[#00ffcc]/10 border border-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.3)] flex items-center justify-center">
              <Brain size={16} className="text-[#00ffcc]" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }} />
            </div>
            <span className="text-[11px] font-orbitron font-bold uppercase tracking-[0.2em] text-[#00ffcc]" style={{ textShadow: '0 0 5px #00ffcc' }}>PREDATOR AI</span>
            {message.metadata?.confidence && (
              <ConfidenceBadge confidence={message.metadata.confidence} />
            )}
          </div>
        )}

        <div
          className={`
            relative p-5 rounded-sm border backdrop-blur-md shadow-lg
            ${isUser
              ? 'bg-[#050b14]/90 border-[#ff007f]/40 shadow-[0_0_15px_rgba(255,0,127,0.15)] text-white'
              : 'bg-[#050b14]/80 border-[#00ffcc]/30 shadow-[0_0_15px_rgba(0,255,204,0.1)] text-white/90'}
          `}
        >
          {/* Cyber accents */}
          <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${isUser ? 'border-[#ff007f]' : 'border-[#00ffcc]'}`} />
          <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${isUser ? 'border-[#ff007f]' : 'border-[#00ffcc]'}`} />
          
          {/* Content */}
          <div className="prose prose-sm prose-invert max-w-none font-rajdhani text-[14px] leading-relaxed">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>

          {/* Sources */}
          {!isUser && message.metadata?.sources && message.metadata.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#00ffcc]/20">
              <div className="text-[10px] text-[#00ffcc]/60 mb-2 uppercase font-orbitron tracking-widest">ДЖЕРЕЛА:</div>
              <div className="flex flex-wrap gap-2">
                {message.metadata.sources.slice(0, 3).map((source, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-[#00ffcc]/10 border border-[#00ffcc]/20 rounded-sm text-[11px] font-rajdhani text-white flex items-center gap-1.5 shadow-[inset_0_0_5px_rgba(0,255,204,0.1)]"
                  >
                    <FileText size={10} className="text-[#00ffcc]" />
                    {source.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isUser && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#00ffcc]/20">
              <Button variant="cyber"
                onClick={() => onClose?.()}
                className="px-3 py-1.5 border border-[#ff007f]/50 bg-[#ff007f]/10 text-[#ff007f] hover:bg-[#ff007f]/20 transition-colors text-[10px] font-orbitron uppercase tracking-widest rounded-sm shadow-[0_0_5px_rgba(255,0,127,0.2)]"
              >
                ЗАКРИТИ
              </Button>
              <Button variant="cyber"
                onClick={() => onCopy(message.content)}
                className="p-1.5 bg-[#00ffcc]/5 border border-[#00ffcc]/20 hover:bg-[#00ffcc]/20 transition-colors group rounded-sm"
                title="Копіювати"
              >
                <Copy size={14} className="text-[#00ffcc]/60 group-hover:text-[#00ffcc]" />
              </Button>
              <Button variant="cyber" className="p-1.5 bg-[#00ffcc]/5 border border-[#00ffcc]/20 hover:bg-[#00ffcc]/20 transition-colors group rounded-sm" title="Корисно">
                <ThumbsUp size={14} className="text-[#00ffcc]/60 group-hover:text-[#00ffcc]" />
              </Button>
              <Button variant="cyber" className="p-1.5 bg-[#ff007f]/5 border border-[#ff007f]/20 hover:bg-[#ff007f]/20 transition-colors group rounded-sm" title="Не корисно">
                <ThumbsDown size={14} className="text-[#ff007f]/60 group-hover:text-[#ff007f]" />
              </Button>

              {message.metadata?.latency && (
                <span className="ml-auto text-[10px] text-[#00ffcc]/40 font-mono border border-[#00ffcc]/10 px-2 py-1 bg-black/40">
                  {message.metadata.latency}MS • {message.metadata?.model?.toUpperCase()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`text-[9px] font-mono mt-2 ${isUser ? 'text-right text-[#ff007f]/50' : 'text-left text-[#00ffcc]/50'}`}>
          {message.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

// Quick Action Chips
const QuickActions = ({ onSelect }: { onSelect: (query: string) => void }) => {
  const actions = [
    { icon: Target, label: 'АНАЛІЗ АНОМАЛІЙ', query: 'Проаналізуй останні аномалії в даних' },
    { icon: Shield, label: 'ОЦІНКА РИЗИКІВ', query: 'Яка поточна оцінкаризиків?' },
    { icon: Zap, label: 'ШВИДКИЙ ЗВІТ', query: 'Згенеруй короткий звіт за сьогодні' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(action.query)}
          className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[#00ffcc]/30 text-[10px] font-orbitron font-bold tracking-widest text-[#00ffcc] hover:bg-[#00ffcc]/10 shadow-[inset_0_0_10px_rgba(0,255,204,0.05)] transition-all rounded-sm relative"
        >
          <div className="absolute left-0 top-0 w-1 h-full bg-[#00ffcc]/50" />
          <action.icon size={12} className="text-[#00ffcc]" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }} />
          {action.label}
        </motion.button>
      ))}
    </div>
  );
};

interface AIAnalystPanelProps {
  onClose?: () => void;
}

export const AIAnalystPanel: React.FC<AIAnalystPanelProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Вітаю! Я PREDATOR AI — ваш інтелектуальний аналітик. Задайте питання про дані, аномалії або запросіть аналіз.',
      timestamp: new Date(),
      metadata: { confidence: 1, model: 'quantum-core-v45' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      const res = await fetch('/api/v45/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: 'general' }),
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'На жаль, не вдалося отримати відповідь. Спробуйте ще раз.',
        timestamp: new Date(),
        metadata: {
          confidence: data.confidence || 0.85,
          sources: data.sources || [],
          model: data.model_used || 'predator-core-45',
          latency,
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Внутрішня помилка Quantum Core. Повторіть спробу пізніше.',
        timestamp: new Date(),
        metadata: { confidence: 0 }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050b14]/90 border border-[#00ffcc]/30 shadow-[0_0_30px_rgba(0,255,204,0.1)] relative overflow-hidden font-mono">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,204,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,204,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b-2 border-[#00ffcc]/30 bg-[#00ffcc]/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_15px_rgba(0,255,204,0.4)] flex items-center justify-center relative">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white" />
              <Brain size={24} className="text-[#00ffcc]" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }} />
            </div>
            <div>
              <h2 className="font-orbitron font-black text-white text-[16px] tracking-widest flex items-center gap-2" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                PREDATOR AI
                <Sparkles size={14} className="text-[#00ffcc]" style={{ filter: 'drop-shadow(0 0 5px #00ffcc)' }} />
              </h2>
              <p className="text-[10px] font-orbitron uppercase tracking-[0.3em] text-[#00ffcc]/60 mt-1">
                КВАНТОВИЙ АНАЛІТИК v45.0
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[10px] font-orbitron font-bold tracking-widest text-[#00ffcc]" style={{ textShadow: '0 0 5px #00ffcc' }}>
              <div className="w-2 h-2 bg-[#00ffcc] shadow-[0_0_8px_#00ffcc] animate-pulse" />
              СИСТЕМА АКТИВНА
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-2 relative z-10 custom-scrollbar">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onCopy={handleCopy} onClose={onClose} />
          ))}
        </AnimatePresence>
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <div className="p-5 border-t-2 border-[#00ffcc]/20 bg-[#050b14] relative z-10">
        <QuickActions onSelect={handleSubmit} />

        <div className="relative mt-2">
          {/* Neon Input Border Frame */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-[#00ffcc]/50 to-[#ff007f]/50 opacity-30 pointer-events-none" />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
            placeholder="ВВЕДІТЬ ЗАПИТ ДО НЕЙРОМЕРЕЖІ..."
            className="w-full px-5 py-4 pr-16 bg-[#050b14] border border-[#00ffcc]/40 text-white font-rajdhani text-[14px] placeholder-[#00ffcc]/30 focus:border-[#00ffcc] focus:ring-0 focus:outline-none transition-all shadow-[inset_0_0_20px_rgba(0,255,204,0.05)] rounded-none"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSubmit(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-10 flex items-center justify-center bg-[#00ffcc]/20 border border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/40 shadow-[0_0_10px_rgba(0,255,204,0.3)] disabled:opacity-30 disabled:shadow-none transition-all"
          >
            {isLoading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIAnalystPanel;
