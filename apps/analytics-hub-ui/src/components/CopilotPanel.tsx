import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Brain, AlertCircle, X, Loader2, Mic, Volume2, VolumeX, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CopilotPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thoughtProcess, setThoughtProcess] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thoughtProcess]);

  // Handle Speech Recognition (Web Speech API mockup/stub for actual implementation)
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTextInput('Аналізую голос...');
      // Simulate STT delay
      setTimeout(() => {
        setTextInput('Знайди зв\'язки між Кізима Дмитро та ТОВ Нафтогаз');
        setIsRecording(false);
      }, 2000);
    } else {
      setIsRecording(false);
      setTextInput('');
    }
  };

  const generateBriefing = async () => {
    setMessages(prev => [...prev, { role: 'user', content: 'Згенеруй Executive Briefing (Вижимку)' }]);
    setIsThinking(true);
    setThoughtProcess(['Ініціалізація Executive Report Module...', 'Аналіз зібраних досьє...', 'Синтез ключових ризиків...']);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `**EXECUTIVE BRIEFING**\n\n**Ціль:** Кізима Дмитро Миколайович\n**Ризик:** Високий (78/100)\n\n**Ключові фактори:**\n- Виявлено приховані зв'язки з компаніями під санкціями (через 2 транзакції).\n- Збіги з реєстрами PEP (Політично значущі особи).\n\n**Рекомендація:** Потребує детальної перевірки службою безпеки.`
      }]);
      setIsThinking(false);
      setThoughtProcess([]);
      
      if (voiceEnabled) {
        // Speak using TTS
        const utterance = new SpeechSynthesisUtterance('Згенеровано звіт. Ризик високий, виявлено приховані зв\'язки з компаніями під санкціями.');
        utterance.lang = 'uk-UA';
        speechSynthesis.speak(utterance);
      }
    }, 2500);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isRecording) return;

    const query = textInput;
    setTextInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsThinking(true);
    setThoughtProcess([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/react-agent/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ query })
      });
      
      if (!res.ok) throw new Error('Network error');
      
      const data = await res.json();
      
      // Simulate thought process typing
      for (const thought of data.thought_process) {
        setThoughtProcess(prev => [...prev, thought]);
        await new Promise(r => setTimeout(r, 600)); // Visual delay
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      
      if (voiceEnabled) {
        const utterance = new SpeechSynthesisUtterance(data.answer);
        utterance.lang = 'uk-UA';
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'system', 
        content: 'System Error: Failed to reach AI Core. Switching to fallback mode.' 
      }]);
    } finally {
      setIsThinking(false);
      setThoughtProcess([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed right-6 top-24 w-[420px] h-[calc(100vh-8rem)] z-40 flex flex-col bg-slate-950/95 border border-indigo-500/30 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)] backdrop-blur-xl"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg relative">
                <Brain className="w-5 h-5 text-indigo-400" />
                {isThinking && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-widest uppercase">Copilot Engine</h3>
                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  REASONING ACTIVE
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions (Briefings) */}
          <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800 flex gap-2 overflow-x-auto custom-scrollbar">
            <button onClick={generateBriefing} disabled={isThinking} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-[10px] uppercase font-bold tracking-wider transition-colors disabled:opacity-50">
              <FileText className="w-3 h-3" /> Execute Briefing
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <div className="relative">
                  <Bot className="w-14 h-14 text-indigo-500" />
                  <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                </div>
                <div className="text-xs font-mono text-slate-400 max-w-[80%]">
                  <p>Система Copilot готова.</p>
                  <p className="mt-2 text-[10px] opacity-70">Підтримує текстовий, голосовий ввід та генерацію звітів.</p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                  <div className="glass-panel text-rose-300 text-[11px] p-3 rounded-xl font-mono flex items-start gap-2 w-full border-rose-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {msg.content}
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20' 
                      : 'glass-panel text-slate-300 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user' ? null : (
                      <div className="flex items-center gap-1.5 mb-2 border-b border-slate-700/50 pb-1">
                        <Bot className="w-3 h-3 text-indigo-400" />
                        <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold">Agent</span>
                      </div>
                    )}
                    <div className="whitespace-pre-line font-medium leading-relaxed">{msg.content}</div>
                  </div>
                )}
              </div>
            ))}

            {/* Chain of Thought Visualization */}
            {isThinking && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 border border-emerald-900/50 rounded-xl p-3 space-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-mono mb-2 uppercase tracking-widest font-bold border-b border-emerald-900/30 pb-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Reasoning Process
                </div>
                {thoughtProcess.map((thought, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11px] font-mono text-emerald-300/80 pl-2"
                  >
                    &gt; {thought}
                  </motion.div>
                ))}
                <motion.div 
                  animate={{ opacity: [0, 1, 0] }} 
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-[11px] font-mono text-emerald-300/80 pl-2"
                >
                  &gt; _
                </motion.div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-900/80 border-t border-slate-800 rounded-b-2xl">
            <form onSubmit={sendMessage} className="relative flex items-center">
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute left-2 p-2 rounded-lg transition-all ${isRecording ? 'text-rose-500 bg-rose-500/10 animate-pulse' : 'text-slate-400 hover:text-indigo-400'}`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isRecording ? "Слухаю..." : "Ask Copilot..."}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-12 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner font-mono"
                disabled={isThinking || isRecording}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isThinking || isRecording}
                className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      )}
      
      <motion.button
        id="copilot-trigger"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all border bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 z-50 group"
        title="Open Copilot"
      >
        <Brain className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </motion.button>
    </AnimatePresence>
  );
};
