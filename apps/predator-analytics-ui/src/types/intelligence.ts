/**
 * 🦅 PREDATOR Analytics // INTELLIGENCE TYPES | v61.0-ELITE
 * Centralized type definitions for intelligence modules.
 */

export type RiskLevelValue = 
  | 'critical' 
  | 'high' 
  | 'medium' 
  | 'low' 
  | 'minimal' 
  | 'stable' 
  | 'watchlist' 
  | 'elevated';

export interface RiskEntity {
  id: string;
  ueid?: string;
  name: string;
  edrpou: string;
  riskScore: number;
  risk_score?: number; // Compatibility with snake_case APIs
  riskLevel: RiskLevelValue;
  risk_level?: RiskLevelValue; // Compatibility with snake_case APIs
  flags: string[];
  lastActivity?: string;
  last_updated?: string;
  created_at?: string;
  updated_at?: string;
  totalOperations?: number;
  suspiciousAmount?: number;
  linkedEntities?: number;
  investigations?: number;
  connections?: number;
  type?: 'COMPANY' | 'PERSON' | 'VESSEL' | 'company' | 'person' | 'location';
  status?: string;
  sector?: string | null;
  cers_confidence?: number;
  metadata?: {
    description?: string;
    lastUpdated: string;
    source: string;
  };
}

export interface TradeVolumeData {
  day: string;
  import: number;
  export: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface RiskAlert {
  id: string;
  title: string;
  source: string;
  severity: 'К ИТИЧНА' | 'ВИСОКА' | 'СЕ ЕДНЯ' | 'НИЗЬКА';
  status: string;
  desc: string;
}
