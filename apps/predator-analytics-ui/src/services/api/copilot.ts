import { apiClient } from './config';

export interface ChatContext {
    entity_filter?: string;
    date_range?: string;
}

export interface ChatRequest {
    session_id?: string;
    message: string;
    context?: ChatContext;
    context_ueid?: string;
    history?: Array<{ role: string; content: string }>;
}

export interface ChatSource {
    type: string;
    id?: string;
    entity?: string;
    title?: string;
    url?: string;
    relevance: number;
}

export interface ChatResponse {
    message_id: string;
    reply: string;
    sources: ChatSource[];
    tokens_used: number;
}

export interface SessionResponse {
    session_id: string;
    messages: Array<{
        message_id: string;
        role: string;
        content: string;
        timestamp: string;
    }>;
    created_at: string | null;
    updated_at?: string;
    message_count?: number;
    context?: ChatContext;
}

export const copilotApi = {
    /**
     * Відправка повідомлення до Copilot
     */
    chat: async (request: ChatRequest): Promise<ChatResponse> => {
        return (await apiClient.post('/copilot/chat', request)).data;
    },

    /**
     * SSE streaming версія чату
     */
    chatStream: (request: ChatRequest): EventSource => {
        const params = new URLSearchParams();
        params.append('message', request.message);
        if (request.session_id) params.append('session_id', request.session_id);
        if (request.context_ueid) params.append('context_ueid', request.context_ueid);

        // Для SSE потрібен POST, тому використовуємо fetch з ReadableStream
        return new EventSource(`/api/v1/copilot/chat/stream?${params.toString()}`);
    },

    /**
     * Streaming chat з fetch API
     */
    chatStreamFetch: async function* (request: ChatRequest): AsyncGenerator<{
        type: 'thinking' | 'chunk' | 'sources' | 'complete' | 'error';
        data: any;
    }> {
        const response = await fetch('/api/v1/copilot/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

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
                if (line.startsWith('event: ')) {
                    const eventType = line.slice(7).trim();
                    continue;
                }
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        yield { type: data.type || 'chunk', data };
                    } catch {
                        // Ignore parse errors
                    }
                }
            }
        }
    },

    /**
     * Створення нової сесії
     */
    createSession: async (): Promise<{ session_id: string; created_at: string }> => {
        return (await apiClient.post('/copilot/sessions')).data;
    },

    /**
     * Отримання історії сесії
     */
    getSession: async (sessionId: string, limit: number = 50): Promise<SessionResponse> => {
        return (await apiClient.get(`/copilot/sessions/${sessionId}?limit=${limit}`)).data;
    },

    /**
     * Видалення сесії
     */
    deleteSession: async (sessionId: string): Promise<{ deleted: boolean; session_id: string }> => {
        return (await apiClient.delete(`/copilot/sessions/${sessionId}`)).data;
    },
};
