import { apiClient } from './config';

export interface AIThought {
    id: string;
    stage: 'observation' | 'analysis' | 'decision' | 'action';
    content: string;
    confidence: number;
    timestamp: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    thought_process?: AIThought[];
}

export const aiApi = {
    chat: async (messages: ChatMessage[], model?: string) => {
        return (await apiClient.post('/ai/chat', { messages, model })).data;
    },
    getThoughts: async (limit: number = 10): Promise<AIThought[]> => {
        return (await apiClient.get(`/ai/thoughts?limit=${limit}`)).data;
    },
    getAutonomousStatus: async () => {
        return (await apiClient.get('/ai/autonomous/status')).data;
    }
};
