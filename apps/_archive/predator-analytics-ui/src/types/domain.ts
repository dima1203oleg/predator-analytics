export interface EntityNode {
  id: string;
  type: 'COMPANY' | 'PERSON' | 'DOCUMENT' | 'CONTAINER';
  label: string;
  confidenceScore: number;
  metadata: Record<string, any>;
  position?: { x: number; y: number; z: number };
  timestamp?: number; // Added for spatial timeline (DAG)
}

export interface EntityLink {
  id: string;
  source: string; // EntityNode.id
  target: string; // EntityNode.id
  type: 'OWNERSHIP' | 'TRANSACTION' | 'MENTION';
  weight: number;
  hasRisk: boolean;
}

export interface RiskInsight {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  relatedEntities: string[]; // EntityNode.ids
  confidence: number;
  recommendedAction: string;
}
