import { create } from 'zustand';

export interface AnomalyPulse {
  id: string;
  linkId: string;
  sourceId: string;
  targetId: string;
  timestamp: number;
}

interface GraphState {
  focusedNodeId: string | null;
  activeAnomalies: AnomalyPulse[];
  highlightedEntityId: string | null;
  
  focusNode: (id: string | null) => void;
  triggerAnomalyPulse: (linkId: string, sourceId: string, targetId: string) => void;
  removeAnomalyPulse: (id: string) => void;
  syncWithDocument: (entityId: string) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  focusedNodeId: null,
  activeAnomalies: [],
  highlightedEntityId: null,

  focusNode: (id) => set({ focusedNodeId: id }),
  
  triggerAnomalyPulse: (linkId, sourceId, targetId) => {
    const newPulse: AnomalyPulse = {
      id: Math.random().toString(36).substring(2, 9),
      linkId,
      sourceId,
      targetId,
      timestamp: Date.now()
    };
    
    set((state) => ({
      activeAnomalies: [...state.activeAnomalies, newPulse]
    }));
    
    // Auto-remove pulse after 2 seconds
    setTimeout(() => {
      set((state) => ({
        activeAnomalies: state.activeAnomalies.filter(p => p.id !== newPulse.id)
      }));
    }, 2000);
  },
  
  removeAnomalyPulse: (id) => set((state) => ({
    activeAnomalies: state.activeAnomalies.filter(p => p.id !== id)
  })),

  syncWithDocument: (entityId) => set({ 
    highlightedEntityId: entityId,
    focusedNodeId: entityId // automatically focus when synced
  })
}));
