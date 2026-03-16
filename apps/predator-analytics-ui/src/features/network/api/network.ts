import { api } from '@/services/api';

export const networkApi = {
    getGraph: async (params?: any) => {
        const response = await api.get('/network/graph', { params });
        return response.data;
    },
    
    searchNodes: async (query: string) => {
        const response = await api.get('/network/nodes/search', { params: { q: query } });
        return response.data;
    },
    
    findPath: async (source: string, target: string) => {
        const response = await api.get('/network/path', { params: { source, target } });
        return response.data;
    }
};
