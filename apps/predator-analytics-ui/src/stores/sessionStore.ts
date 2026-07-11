import { create } from 'zustand';

interface SessionLayer {
    id: string;
    timestamp: string;
    summary: string;
    depth: number; // Z-axis index
}

interface SessionState {
    historyLayers: SessionLayer[];
    activeLayerId: string | null;
    pushLayer: (summary: string) => void;
    activateLayer: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    historyLayers: [],
    activeLayerId: null,
    pushLayer: (summary) => set((state) => {
        const newLayer = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            summary,
            depth: state.historyLayers.length
        };
        return {
            historyLayers: [...state.historyLayers, newLayer],
            activeLayerId: newLayer.id
        };
    }),
    activateLayer: (id) => set({ activeLayerId: id })
}));
