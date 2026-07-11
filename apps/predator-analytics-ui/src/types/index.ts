export type CognitiveWeather = 'calm' | 'exploration' | 'storm' | 'conflict' | 'overload' | 'insight';

export type NodeType = 'person' | 'company' | 'country' | 'offshore' | 'contract' | 'case' | 'customs' | 'risk';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  energy: number; // 0.5 - 1.5
  confidence: number; // 0.0 - 1.0
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  [key: string]: any;
}

export type EdgeType = 'confirmed' | 'unconfirmed' | 'critical';

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: EdgeType;
  strength: number; // 0.0 - 1.0
}

export type AI_Role = 'OSINT' | 'FINANCE' | 'IMPORT' | 'EXPORT' | 'AML' | 'TENDER' | 'TAX' | 'GRAPH' | 'LLM';

export interface AIAgent {
  id: string;
  role: AI_Role;
  active: boolean;
  targetNodeId: string | null;
}
