import { create } from 'zustand';
import { SpatialNode, SpatialEdge, SpatialDataLayer, DataState } from '@/types';
import { nanoid } from 'nanoid';

interface SpatialDataStore {
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  layers: SpatialDataLayer[];
  activeLayerId: string | null;
  selectedNodes: Set<string>;

  addNode: (node: Omit<SpatialNode, 'id'>) => SpatialNode;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<SpatialNode>) => void;
  addEdge: (edge: Omit<SpatialEdge, 'id'>) => SpatialEdge;
  removeEdge: (edgeId: string) => void;
  updateEdge: (edgeId: string, updates: Partial<SpatialEdge>) => void;

  createLayer: (name: string, nodes?: SpatialNode[], edges?: SpatialEdge[]) => SpatialDataLayer;
  activateLayer: (layerId: string) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<SpatialDataLayer>) => void;
  toggleNodeSelection: (nodeId: string) => void;
  clearSelection: () => void;

  setNodes: (nodes: SpatialNode[]) => void;
  setEdges: (edges: SpatialEdge[]) => void;
  resetData: () => void;
}

export const useSpatialDataStore = create<SpatialDataStore>((set, get) => ({
  nodes: [],
  edges: [],
  layers: [],
  activeLayerId: null,
  selectedNodes: new Set(),

  addNode: (nodeData) => {
    const node: SpatialNode = {
      ...nodeData,
      id: nanoid(),
      position: nodeData.position || [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5],
      dataState: nodeData.dataState || DataState.CONFIRMED,
      connections: nodeData.connections || []
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
    return node;
  },

  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== nodeId),
    edges: state.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
  })),

  updateNode: (nodeId, updates) => set((state) => ({
    nodes: state.nodes.map(n =>
      n.id === nodeId ? { ...n, ...updates, meshRef: n.meshRef, pointRef: n.pointRef } : n
    )
  })),

  addEdge: (edgeData) => {
    const edge: SpatialEdge = {
      ...edgeData,
      strength: edgeData.strength || 0.5
    };
    set((state) => ({ edges: [...state.edges, edge] }));
    return edge;
  },

  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter(e => e.from !== edgeId && e.to !== edgeId)
  })),

  updateEdge: (edgeId, updates) => set((state) => ({
    edges: state.edges.map(e => e.from === edgeId || e.to === edgeId ? { ...e, ...updates } : e)
  })),

  createLayer: (name, initialNodes = [], initialEdges = []) => {
    const layer: SpatialDataLayer = {
      id: nanoid(),
      name,
      timestamp: Date.now(),
      nodes: new Map(initialNodes.map(n => [n.id, n])),
      edges: initialEdges,
      cameraTransform: [0, 0, 0, 0, 0, 0],
      thoughts: [],
      visibility: true
    };
    set((state) => ({
      layers: [...state.layers, layer],
      nodes: [...state.nodes, ...initialNodes],
      edges: [...state.edges, ...initialEdges]
    }));
    return layer;
  },

  activateLayer: (layerId) => set({
    activeLayerId: layerId,
    selectedNodes: new Set()
  }),

  removeLayer: (layerId) => set((state) => {
    const layer = state.layers.find(l => l.id === layerId);
    return {
      layers: state.layers.filter(l => l.id !== layerId),
      nodes: layer ? state.nodes.filter(n => !layer.nodes.has(n.id)) : state.nodes,
      edges: layer ? state.edges.filter(e =>
        !layer.nodes.has(e.from) && !layer.nodes.has(e.to)
      ) : state.edges,
      activeLayerId: state.activeLayerId === layerId ? null : state.activeLayerId
    };
  }),

  updateLayer: (layerId, updates) => set((state) => ({
    layers: state.layers.map(l =>
      l.id === layerId ? { ...l, ...updates } : l
    )
  })),

  toggleNodeSelection: (nodeId) => set((state) => {
    const newSelection = new Set(state.selectedNodes);
    if (newSelection.has(nodeId)) {
      newSelection.delete(nodeId);
    } else {
      newSelection.add(nodeId);
    }
    return { selectedNodes: newSelection };
  }),

  clearSelection: () => set({ selectedNodes: new Set() }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  resetData: () => set({
    nodes: [],
    edges: [],
    layers: [],
    activeLayerId: null,
    selectedNodes: new Set()
  })
}));
