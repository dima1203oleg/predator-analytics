import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Command } from 'lucide-react';
import { api } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PromptTemplates } from './PromptTemplates';
import { SlashCommandMenu, SlashCommand, SLASH_COMMANDS } from './SlashCommands';

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
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [pendingCmd, setPendingCmd] = useState<SlashCommand | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setInput('/');
        setSlashQuery('');
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith('/') && !pendingCmd) {
      setSlashQuery(val.slice(1));
    } else {
      setSlashQuery(null);
    }

    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const handleCommandSelect = useCallback((cmd: SlashCommand) => {
    setSlashQuery(null);
    setPendingCmd(cmd);
    setInput(cmd.trigger + ' ');
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    let finalMessage = input.trim();

    if (pendingCmd) {
      const trigger = pendingCmd.trigger + ' ';
      if (finalMessage.startsWith(trigger)) {
        const arg = finalMessage.slice(trigger.length).trim();
        finalMessage = arg
          ? pendingCmd.template.replace('{arg}', arg)
          : pendingCmd.template.replace(' {arg}', '').replace('{arg}', '');
      }
      setPendingCmd(null);
    }

    onSendMessage(finalMessage);
    setInput('');
    setSlashQuery(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (slashQuery !== null && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && slashQuery !== null) {
      setSlashQuery(null);
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
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Введіть <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded text-[10px] font-mono text-cyan-400">/</kbd> для швидких команд аналізу
            </p>
            
            {onSelectTemplate && (
              <div className="w-full max-w-3xl mx-auto mt-2">
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
        {pendingCmd && (
          <div className="flex items-center gap-2 px-4 py-1.5 mb-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mx-1">
            <Command size={11} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] font-mono text-cyan-300">{pendingCmd.trigger}</span>
            <span className="text-[11px] text-slate-400">→ введіть</span>
            <span className="text-[11px] text-slate-300 italic">{pendingCmd.argHint}</span>
            <button
              onClick={() => { setPendingCmd(null); setInput(''); inputRef.current?.focus(); }}
              className="ml-auto text-slate-600 hover:text-slate-400 text-[10px] font-mono"
            >
              ✕
            </button>
          </div>
        )}

        <div className="ai-input-wrapper relative">
          {slashQuery !== null && (
            <SlashCommandMenu
              query={slashQuery}
              onSelect={handleCommandSelect}
              onClose={() => setSlashQuery(null)}
            />
          )}

          <textarea
            ref={inputRef}
            className="ai-input-field"
            placeholder={
              pendingCmd
                ? `Введіть ${pendingCmd.argHint ?? 'аргумент'}...`
                : 'Запитайте щось або введіть / для команд...'
            }
            value={input}
            onChange={handleInputChange}
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
          <span className="text-[9px] text-slate-600 font-mono hidden sm:flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-800 border border-white/10 rounded">/</kbd> команди ·
            <kbd className="px-1 py-0.5 bg-slate-800 border border-white/10 rounded">Ctrl+/</kbd> меню
          </span>
        </div>
      </div>
    </div>
  );
};
