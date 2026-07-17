/* Zustand store: Data — графові вузли, ребра, документи, KPI, timeline */
import { create } from 'zustand';
import type { GraphNode, GraphEdge, IntelligenceDocument, TimelineEvent, KPIMetric } from '../types/data';

interface DataState {
    nodes: GraphNode[];
    edges: GraphEdge[];
    documents: IntelligenceDocument[];
    timelineEvents: TimelineEvent[];
    kpiMetrics: KPIMetric[];
    selectedNodeId: string | null;
    selectedDocumentId: string | null;

    setNodes: (nodes: GraphNode[]) => void;
    setEdges: (edges: GraphEdge[]) => void;
    setGraphData: (nodes: GraphNode[], edges: GraphEdge[]) => void;
    setDocuments: (docs: IntelligenceDocument[]) => void;
    setTimelineEvents: (events: TimelineEvent[]) => void;
    setKPIMetrics: (metrics: KPIMetric[]) => void;
    selectNode: (id: string | null) => void;
    selectDocument: (id: string | null) => void;
    addDocument: (doc: IntelligenceDocument) => void;
}

export const useDataStore = create<DataState>((set) => ({
    nodes: [],
    edges: [],
    documents: [],
    timelineEvents: [],
    kpiMetrics: [],
    selectedNodeId: null,
    selectedDocumentId: null,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setGraphData: (nodes, edges) => set({ nodes, edges }),
    setDocuments: (docs) => set({ documents: docs }),
    setTimelineEvents: (events) => set({ timelineEvents: events }),
    setKPIMetrics: (metrics) => set({ kpiMetrics: metrics }),
    selectNode: (id) => set({ selectedNodeId: id }),
    selectDocument: (id) => set({ selectedDocumentId: id }),
    addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
}));
