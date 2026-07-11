import { create } from 'zustand';
import { EntityNode, EntityLink } from '../../types/domain';

interface GraphState {
  nodes: EntityNode[];
  links: EntityLink[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  isTimelineMode: boolean;
  graphEngineRef: any; // Reference to force-graph engine for direct mutations
  setGraphData: (nodes: EntityNode[], links: EntityLink[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  setTimelineMode: (mode: boolean) => void;
  setGraphEngineRef: (ref: any) => void;
  emitRiskPulse: (linkId: string) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  links: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  isTimelineMode: false,
  graphEngineRef: null,
  
  setGraphData: (nodes, links) => set({ nodes, links }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  setTimelineMode: (mode) => set({ isTimelineMode: mode }),
  setGraphEngineRef: (ref) => set({ graphEngineRef: ref }),
  
  emitRiskPulse: (linkId) => {
    const state = get();
    if (state.graphEngineRef) {
      const link = state.links.find(l => l.id === linkId);
      if (link) {
        state.graphEngineRef.emitParticle(link);
      }
    }
  },
  
  clearGraph: () => set({ nodes: [], links: [], selectedNodeId: null, hoveredNodeId: null }),
}));
