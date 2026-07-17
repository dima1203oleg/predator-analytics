import { apiClient } from '@/services/api';

export const networkApi = {
    getGraph: async (params?: any) => {
        const response = await apiClient.get('/graph/summary', { params });
        return {
            nodes: response.data.nodes || [],
            edges: response.data.links || response.data.edges || []
        };
    },
    
    searchNodes: async (query: string) => {
        try {
            const response = await apiClient.get('/graph/search', { params: { query } });
            return {
                nodes: response.data.nodes || [],
                edges: response.data.links || response.data.edges || []
            };
        } catch (error) {
            console.error("Failed to search nodes", error);
            return { nodes: [], edges: [] };
        }
    },
    
    findPath: async (source: string, target: string) => {
        return { nodes: [], edges: [] };
    }
};
