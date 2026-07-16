import React from 'react';
import { Plus, MessageSquare, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  onToggle
}) => {
  return (
    <>
      <div className={`ai-studio-sidebar ${!isOpen ? 'collapsed' : ''}`}>
        <div className="ai-sidebar-header">
          <div className="ai-sidebar-brand">
            <div className="ai-sidebar-brand-icon">
              <Sparkles size={16} />
            </div>
            <span className="ai-sidebar-brand-text">AI Studio</span>
          </div>
          <button className="ai-sidebar-toggle md:hidden" onClick={onToggle}>
            <ChevronLeft size={16} />
          </button>
        </div>

        <button className="ai-new-chat-btn" onClick={onNewChat}>
          <Plus size={16} />
          Новий чат
        </button>

        <div className="ai-history-list">
          {sessions.length === 0 ? (
            <div className="text-xs text-center text-slate-500 mt-4">Немає історії</div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className={`ai-history-item ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={12} className={activeSessionId === session.id ? 'text-purple-400' : 'text-slate-500'} />
                  <span className="ai-history-item-title">{session.title}</span>
                </div>
                <span className="ai-history-item-date">{session.updatedAt}</span>
              </div>
            ))
          )}
        </div>
      </div>
      
      {!isOpen && (
        <button 
          className="absolute top-4 left-4 z-50 ai-sidebar-toggle bg-[#111118] border-[#ffffff10]" 
          onClick={onToggle}
          title="Відкрити історію"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </>
  );
};
