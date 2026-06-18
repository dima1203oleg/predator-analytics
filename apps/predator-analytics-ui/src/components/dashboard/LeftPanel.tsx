/**
 * 🧠 AI Cognitive Panel Component
 * 
 * Ліва панель з чат-інтерфейсом та метриками
 * згідно з технічною специфікацією PREDATOR
 */

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useCyberDashboardStore } from '../../store/cyber-dashboard-store';
import { Mic, Send, FileText, Activity, Database } from 'lucide-react';

export default function LeftPanel() {
  const { chatMessages, addChatMessage, isPanelCollapsed } = useCyberDashboardStore();
  const [inputValue, setInputValue] = useState('');
  
  // Анімовані лічильники
  const documentsCount = useSpring(249);
  const documentsRounded = useTransform(documentsCount, (v) => Math.round(v));
  const analysisCount = useSpring(1200);
  const analysisRounded = useTransform(analysisCount, (v) => Math.round(v));
  const memoryUsage = useSpring(67);
  const memoryRounded = useTransform(memoryUsage, (v) => Math.round(v));
  
  // Автоматична прокрутка до нових повідомлень
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addChatMessage({
      sender: 'user',
      text: inputValue,
    });
    
    // Simulate AI response
    setTimeout(() => {
      addChatMessage({
        sender: 'ai',
        text: `Обробка запиту: "${inputValue.substring(0, 20)}..."`,
      });
    }, 1000);
    
    setInputValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (isPanelCollapsed.left) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-80 bg-cyber-surface/70 backdrop-blur-md border-r border-cyber-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <h2 className="text-cyber-neon font-cyber text-lg font-bold tracking-wider flex items-center gap-2">
          <Activity className="w-5 h-5 animate-pulse" />
          AI КОГНІТИВНА ПАНЕЛЬ
        </h2>
        <div className="text-xs text-cyber-neon/50 mt-1 font-mono">
          STATUS: ONLINE
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="text-center text-cyber-neon/30 py-8">
            <div className="text-sm font-mono">Очікування введення...</div>
          </div>
        ) : (
          chatMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                p-3 rounded-lg border
                ${message.sender === 'user' 
                  ? 'bg-cyber-neon/10 border-cyber-neon/30 ml-8' 
                  : 'bg-cyber-green/10 border-cyber-green/30 mr-8'
                }
              `}
            >
              <div className="text-xs text-cyber-neon/70 mb-1 font-mono">
                {message.sender === 'user' ? 'USER' : 'AI SYSTEM'}
              </div>
              <div className="text-sm text-gray-200 break-words">
                {message.text}
              </div>
              <div className="text-xs text-cyber-neon/40 mt-1 font-mono">
                {message.timestamp.toLocaleTimeString('uk-UA')}
              </div>
            </motion.div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-cyber-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введіть команду..."
            className="flex-1 bg-cyber-bg/50 border border-cyber-border/30 rounded px-3 py-2 text-sm text-gray-200 placeholder-cyber-neon/30 focus:outline-none focus:border-cyber-neon/50 font-mono"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="p-2 bg-cyber-neon/20 border border-cyber-neon/30 rounded hover:bg-cyber-neon/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-cyber-neon" />
          </button>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="p-4 border-t border-cyber-border space-y-4">
        <h3 className="text-cyber-neon/70 text-xs font-cyber tracking-wider mb-3">
          СИСТЕМНІ МЕТРИКИ
        </h3>
        
        {/* Documents */}
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-cyber-neon" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">ДОКУМЕНТІВ</span>
              <motion.span className="text-cyber-neon font-mono">
                {documentsRounded}
              </motion.span>
            </div>
            <div className="h-1 bg-cyber-bg/50 rounded overflow-hidden">
              <motion.div
                className="h-full bg-cyber-neon"
                initial={{ width: 0 }}
                animate={{ width: '67%' }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>
        
        {/* Analysis */}
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-cyber-green" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">АНАЛІЗІВ</span>
              <motion.span className="text-cyber-green font-mono">
                {analysisRounded}
              </motion.span>
            </div>
            <div className="h-1 bg-cyber-bg/50 rounded overflow-hidden">
              <motion.div
                className="h-full bg-cyber-green"
                initial={{ width: 0 }}
                animate={{ width: '82%' }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
        
        {/* Memory */}
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-cyber-gold" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">ПАМ'ЯТЬ</span>
              <motion.span className="text-cyber-gold font-mono">
                {memoryRounded}%
              </motion.span>
            </div>
            <div className="h-1 bg-cyber-bg/50 rounded overflow-hidden">
              <motion.div
                className="h-full bg-cyber-gold"
                initial={{ width: 0 }}
                animate={{ width: `${memoryUsage.get()}%` }}
                transition={{ duration: 1, delay: 0.4 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
