import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PromptTemplates } from './PromptTemplates';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface GeminiChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  onSelectTemplate?: (prompt: string) => void;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
  messages,
  onSendMessage,
  isTyping,
  onSelectTemplate
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (messages.length > 0 || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="ai-studio-main">

      <div className="ai-chat-container">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <div className="ai-welcome-logo">
              <Sparkles size={40} className="text-white" />
            </div>
            <h1 className="ai-welcome-title">PREDATOR AI Studio</h1>
            
            {onSelectTemplate && (
              <div className="w-full max-w-3xl mx-auto mt-6">
                <PromptTemplates onSelect={onSelectTemplate} />
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`ai-message ${msg.role}`}>
              <div className={`ai-message-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className="ai-message-content">
                {msg.role === 'assistant' ? (
                  <div className={msg.isStreaming ? 'ai-stream-cursor' : ''}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content || '...'}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))
                )}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="ai-typing-indicator">
            <div className="ai-message-avatar ai-avatar">
              <Sparkles size={16} />
            </div>
            <div className="flex gap-1 ml-4 pt-2">
              <div className="ai-typing-dot" />
              <div className="ai-typing-dot" />
              <div className="ai-typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-area">
        <div className="ai-input-wrapper">
          <textarea
            ref={inputRef}
            className="ai-input-field"
            placeholder="Запитайте щось про митну аналітику або оберіть шаблон..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isTyping}
          />
          <button 
            className="ai-send-btn" 
            onClick={handleSubmit}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} />
          </button>
        </div>
        <div className="ai-input-footer">
          <span className="ai-input-footer-text">
            AI може робити помилки. Перевіряйте важливу інформацію.
          </span>
        </div>
      </div>
    </div>
  );
};
