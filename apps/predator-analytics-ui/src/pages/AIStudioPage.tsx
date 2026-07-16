import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatHistory, ChatSession } from '../components/ai-studio/ChatHistory';
import { GeminiChat, Message } from '../components/ai-studio/GeminiChat';
import { PromptTemplates } from '../components/ai-studio/PromptTemplates';
import { api } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import '../styles/ai-studio.css'; // Importing specific styles for AI Studio

export const AIStudioPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const { addToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeMessages = activeSessionId ? (messagesMap[activeSessionId] || []) : [];

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await api.copilot.getSessions();
        if (data.sessions) {
          setSessions(data.sessions.map(s => ({
            id: s.session_id,
            title: s.title,
            updatedAt: new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })));
        }
      } catch (err) {
        console.error('Failed to load sessions', err);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!activeSessionId || messagesMap[activeSessionId]) return;
      
      try {
        const data = await api.copilot.getSession(activeSessionId);
        if (data.messages) {
          setMessagesMap(prev => ({
            ...prev,
            [activeSessionId]: data.messages.map(m => ({
              id: m.message_id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.timestamp)
            }))
          }));
        }
      } catch (err) {
        console.error('Failed to load session messages', err);
      }
    };
    loadSessionMessages();
  }, [activeSessionId, messagesMap]);

  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const newSessionId = uuidv4();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Нова розмова',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setMessagesMap(prev => ({ ...prev, [newSessionId]: [] }));
    setIsTyping(false);
  }, []);

  const handleSendMessage = async (content: string) => {
    let currentSessionId = activeSessionId;
    
    // Create session if none exists
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      const newSession: ChatSession = {
        id: currentSessionId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(currentSessionId);
    } else {
      // Update session title if it's the first message
      if (!messagesMap[currentSessionId] || messagesMap[currentSessionId].length === 0) {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, title: content.slice(0, 30) + (content.length > 30 ? '...' : '') } 
            : s
        ));
      }
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessagesMap(prev => ({
      ...prev,
      [currentSessionId as string]: [...(prev[currentSessionId as string] || []), userMessage]
    }));

    setIsTyping(true);
    
    // Create placeholder for assistant response
    const assistantMessageId = uuidv4();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessagesMap(prev => ({
      ...prev,
      [currentSessionId as string]: [...prev[currentSessionId as string], assistantMessage]
    }));

    // Setup abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Create request payload
      const request = {
        session_id: currentSessionId,
        message: content,
        history: messagesMap[currentSessionId as string]?.map(m => ({
          role: m.role,
          content: m.content
        })) || []
      };

      let fullContent = '';
      
      // Since copilotApi.chatStreamFetch doesn't support AbortSignal directly in its signature,
      // we'll try to use the regular chat endpoint if streaming fails or is not needed,
      // or we can implement the streaming manually here using fetch.
      const response = await fetch('/api/v1/copilot/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('predator_auth_token') || ''}`,
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        // Fallback to non-streaming if stream endpoint fails
        const fallbackRes = await api.copilot.chat(request);
        fullContent = fallbackRes.reply;
        setMessagesMap(prev => ({
          ...prev,
          [currentSessionId as string]: prev[currentSessionId as string].map(m => 
            m.id === assistantMessageId ? { ...m, content: fullContent, isStreaming: false } : m
          )
        }));
      } else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'chunk') {
                  const chunkText = parsed.content !== undefined ? parsed.content : (parsed.data?.content || '');
                  fullContent += chunkText;
                  
                  // Optimistic UI update
                  setMessagesMap(prev => {
                    const currentMessages = prev[currentSessionId as string] || [];
                    return {
                      ...prev,
                      [currentSessionId as string]: currentMessages.map(m => 
                        m.id === assistantMessageId ? { ...m, content: fullContent } : m
                      )
                    };
                  });
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
        
        // Finalize message
        setMessagesMap(prev => ({
          ...prev,
          [currentSessionId as string]: prev[currentSessionId as string].map(m => 
            m.id === assistantMessageId ? { ...m, content: fullContent, isStreaming: false } : m
          )
        }));
      }

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('Chat error:', error);
      addToast('ERROR', 'Помилка зв\'язку', 'Не вдалося отримати відповідь від AI.');
      
      // Make sure streaming flag is removed on error
      setMessagesMap(prev => ({
        ...prev,
        [currentSessionId as string]: prev[currentSessionId as string].map(m => 
          m.id === assistantMessageId ? { ...m, isStreaming: false, content: m.content || 'Помилка обробки запиту.' } : m
        )
      }));
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleTemplateSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="ai-studio">
      <ChatHistory 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        <GeminiChat 
          messages={activeMessages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          onSelectTemplate={activeMessages.length === 0 ? handleTemplateSelect : undefined}
        />
      </div>
    </div>
  );
};

export default AIStudioPage;
