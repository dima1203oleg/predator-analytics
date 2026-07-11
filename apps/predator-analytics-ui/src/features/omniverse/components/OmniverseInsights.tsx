import { Button } from '@/components/ui/button';
import { BrandLoaderFallback } from '@/components/polish/BrandLoader';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Send, 
  Sparkles, 
  Bot, 
  User,
  Database,
  ArrowRight,
  Loader
} from 'lucide-react';
import { omniverseService } from '../../../services/omniverse';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const OmniverseInsights: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [mode, setMode] = useState<'CHAT' | 'PREDICT' | 'ANOMALIES'>('CHAT');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadTables = async () => {
    try {
      const list = await omniverseService.getTables();
      setTables(list);
      if (list.length > 0) setSelectedTable(list[0]);
    } catch (error) {
      console.error("Failed to load tables", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedTable || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let res;
      if (mode === 'PREDICT') {
        res = await omniverseService.predict(selectedTable, input);
        const assistantMsg: Message = { role: 'assistant', content: res.prediction };
        setMessages(prev => [...prev, assistantMsg]);
      } else if (mode === 'ANOMALIES') {
        res = await omniverseService.detectAnomalies(selectedTable, input);
        const assistantMsg: Message = { role: 'assistant', content: res.analysis };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        res = await omniverseService.askInsight(selectedTable, input);
        const assistantMsg: Message = { role: 'assistant', content: res.answer };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error: any) {
      const errorMsg: Message = { role: 'assistant', content: `❌ Помилка: ${error.response?.data?.detail || error.message}` };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar: Context Selector */}
      <div className="w-80 space-y-6 flex flex-col">
        <div className="p-6 bg-black/40  border border-white/5 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="font-bold text-white text-sm uppercase tracking-widest">Active Context</h3>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] text-white/40 uppercase font-bold px-1">Select Data Source</label>
            <div className="space-y-1">
              {tables.map(t => (
                <Button variant="cyber"
                  key={t}
                  onClick={() => setSelectedTable(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between group ${
                    selectedTable === t 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="truncate">{t.replace(/omniverse_[^_]+_/, 'DATA_')}</span>
                  {selectedTable === t && <ArrowRight size={12} />}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Capabilities Card */}
        <div className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/10 flex-1 space-y-6">
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
              <Cpu className="w-3 h-3 text-blue-400" /> Analysis Mode
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'CHAT', label: 'Reasoning Chat', icon: Bot },
                { id: 'PREDICT', label: 'Predictive Trend', icon: Sparkles },
                { id: 'ANOMALIES', label: 'Anomaly Search', icon: Cpu }
              ].map(m => (
                <Button variant="cyber"
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                    mode === m.id 
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20' 
                      : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                  }`}
                >
                  <m.icon size={14} />
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h4 className="text-white font-bold uppercase text-[10px] tracking-widest">Active Model</h4>
            </div>
            <ul className="space-y-3">
              {[
                'Anomaly Detection in Dynamic Sets',
                'Relationship Extraction (Neo4j)',
                'Trend Forecasting',
                'Strategic Risk Assessment'
              ].map((cap, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] text-white/50">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Main: Chat Interface */}
      <div className="flex-1 flex flex-col bg-black/40  border border-white/5 rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">Sovereign Advisor</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full " />
                READY TO REASON
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <Cpu className="w-16 h-16 text-blue-400" />
              <div>
                <p className="text-white font-bold">Запитайте AI про ваші дані</p>
                <p className="text-xs text-white/60 mt-1 max-w-xs">Я можу проаналізувати структуру та вміст завантаженого датасету, знайти зв'язки та аномалії.</p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-zinc-800' : 'bg-blue-600'
                  }`}>
                    {msg.role === 'user' ? <User size={14} className="text-white/70" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-800 text-white rounded-tr-none' 
                      : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none prose prose-invert prose-p:my-0'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3 items-center text-blue-400/60 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/10">
                <Loader size={14} className="animate-spin" />
                <span className="text-xs font-mono tracking-widest uppercase">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/5">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={selectedTable ? `Спитати про ${selectedTable.replace(/omniverse_[^_]+_/, 'DATA_')}...` : "Оберіть контекст..."}
              disabled={!selectedTable || loading}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-6 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none pr-16 transition-all"
            />
            <Button variant="cyber"
              onClick={handleSend}
              disabled={!input.trim() || !selectedTable || loading}
              className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-lg transition-all flex items-center justify-center shadow-lg shadow-blue-600/20"
            >
              <Send size={18} />
            </Button>
          </div>
          <p className="text-[10px] text-white/20 mt-3 text-center uppercase tracking-widest">Powered by Sovereign Reasoning Engine v61.0</p>
        </div>
      </div>
    </div>
  );
};
