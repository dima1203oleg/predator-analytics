import { create } from 'zustand';
import { GraphNode, GraphEdge, CognitiveWeather } from '../types/index';

interface PredatorState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  systemLoad: number; // 0.0 - 1.0
  activeAgents: string[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  
  // Actions
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  addNodes: (nodes: GraphNode[]) => void;
  addEdges: (edges: GraphEdge[]) => void;
  updateSystemLoad: (load: number) => void;
  setActiveAgents: (agents: string[]) => void;
  selectNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  updateNodeRisk: (id: string, riskScore: number) => void;
}

export const usePredatorStore = create<PredatorState>((set) => ({
  nodes: [],
  edges: [],
  systemLoad: 0.1,
  activeAgents: [],
  selectedNodeId: null,
  hoveredNodeId: null,
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNodes: (newNodes) => set((state) => ({ nodes: [...state.nodes, ...newNodes] })),
  addEdges: (newEdges) => set((state) => ({ edges: [...state.edges, ...newEdges] })),
  updateSystemLoad: (load) => set({ systemLoad: load }),
  setActiveAgents: (agents) => set({ activeAgents: agents }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  updateNodeRisk: (id, riskScore) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, riskScore } : n)
  })),
}));
