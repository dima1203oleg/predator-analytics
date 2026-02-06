import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, Sparkles, Loader2, AlertCircle,
  CheckCircle, Copy, ThumbsUp, ThumbsDown, RefreshCw,
  FileText, Target, Shield, Zap
} from 'lucide-react';

// ============================================================================
// AI ANALYST PANEL - PREDATOR v25.0
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
          className="w-2 h-2 bg-cyan-400 rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
    <span className="text-sm text-slate-400">PREDATOR AI аналізує...</span>
  </motion.div>
);

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const getColor = () => {
    if (confidence >= 0.9) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (confidence >= 0.7) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (confidence >= 0.5) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getColor()}`}>
      {Math.round(confidence * 100)}% ВПЕВНЕНІСТЬ
    </span>
  );
};

const MessageBubble = ({ message, onCopy }: { message: Message; onCopy: (text: string) => void }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-cyan-400">PREDATOR AI</span>
            {message.metadata?.confidence && (
              <ConfidenceBadge confidence={message.metadata.confidence} />
            )}
          </div>
        )}

        <div
          className={`
            relative p-4 rounded-2xl
            ${isUser
              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md'
              : 'bg-slate-800/80 text-slate-100 rounded-bl-md border border-white/10'}
          `}
        >
          {/* Content */}
          <div className="prose prose-sm prose-invert max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{line}</p>
            ))}
          </div>

          {/* Sources */}
          {!isUser && message.metadata?.sources && message.metadata.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Джерела:</div>
              <div className="flex flex-wrap gap-2">
                {message.metadata.sources.slice(0, 3).map((source, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-white/5 rounded-lg text-xs text-slate-300 flex items-center gap-1"
                  >
                    <FileText size={10} />
                    {source.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => onCopy(message.content)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
                title="Копіювати"
              >
                <Copy size={14} className="text-slate-400 group-hover:text-white" />
              </button>
              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group" title="Корисно">
                <ThumbsUp size={14} className="text-slate-400 group-hover:text-emerald-400" />
              </button>
              <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group" title="Не корисно">
                <ThumbsDown size={14} className="text-slate-400 group-hover:text-rose-400" />
              </button>

              {message.metadata?.latency && (
                <span className="ml-auto text-[10px] text-slate-500">
                  {message.metadata.latency}ms • {message.metadata.model}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`text-[10px] text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

// Quick Action Chips
const QuickActions = ({ onSelect }: { onSelect: (query: string) => void }) => {
  const actions = [
    { icon: Target, label: 'Аналіз аномалій', query: 'Проаналізуй останні аномалії в даних' },
    { icon: Shield, label: 'Оцінка ризиків', query: 'Яка поточна оцінка ризиків?' },
    { icon: Zap, label: 'Швидкий звіт', query: 'Згенеруй короткий звіт за сьогодні' },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {actions.map((action) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(action.query)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 hover:border-cyan-500/30 transition-all"
        >
          <action.icon size={14} className="text-cyan-400" />
          {action.label}
        </motion.button>
      ))}
    </div>
  );
};

export const AIAnalystPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Вітаю! Я PREDATOR AI — ваш інтелектуальний аналітик. Задайте питання про дані, аномалії або запросіть аналіз.',
      timestamp: new Date(),
      metadata: { confidence: 1, model: 'claude-3.5-sonnet' }
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      const res = await fetch('/api/v25/analyze', {
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
          model: data.model_used || 'predator-main',
          latency,
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Виникла помилка при обробці запиту. Будь ласка, спробуйте пізніше.',
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
    // Could add toast notification here
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white flex items-center gap-2">
                PREDATOR AI
                <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">Інтелектуальний аналітик v25.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Онлайн
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} onCopy={handleCopy} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-slate-900/80">
        <QuickActions onSelect={handleSubmit} />

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
            placeholder="Задайте питання..."
            className="w-full px-5 py-4 pr-14 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSubmit(input)}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
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
