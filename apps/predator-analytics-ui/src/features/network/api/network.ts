import { apiClient } from '@/services/api';

export const networkApi = {
    getGraph: async (params?: any) => {
        try {
            const response = await apiClient.get('/graph/summary', { params });
            // Map 'links' to 'edges' because cytoscape expects edges
            return {
                nodes: response.data.nodes || [],
                edges: response.data.links || response.data.edges || []
            };
        } catch (error) {
            console.error("Failed to load /graph/summary", error);
            return { nodes: [], edges: [] };
        }
    },
    
    searchNodes: async (query: string) => {
        // Fallback or use a proper search endpoint if available
        return { nodes: [], edges: [] };
    },
    
    findPath: async (source: string, target: string) => {
        return { nodes: [], edges: [] };
    }
};
