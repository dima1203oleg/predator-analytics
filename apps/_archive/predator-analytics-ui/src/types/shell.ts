import type { LucideIcon } from 'lucide-react';

export type CommandPaletteEntryKind =
  | 'route'
  | 'favorite'
  | 'recent'
  | 'recommended'
  | 'assistant';

export interface CommandPaletteEntry {
  id: string;
  label: string;
  subtitle: string;
  kind: CommandPaletteEntryKind;
  icon: LucideIcon;
  path?: string;
  keywords: string[];
  source: string;
  action?: 'ask-ai' | 'generate-report' | 'analyze' | 'open-agents';
}

export type ContextTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface ContextRailAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone?: ContextTone;
  path?: string;
  action?: 'favorite-current' | 'ask-ai' | 'open-agents' | 'open-palette';
}

export interface ContextRailMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: ContextTone;
}

export interface ContextRailDocument {
  id: string;
  label: string;
  detail: string;
  path?: string;
}

export interface ContextRailRisk {
  id: string;
  label: string;
  detail: string;
  tone: ContextTone;
}

export interface ContextRailPayload {
  entityId: string;
  entityType: string;
  title: string;
  subtitle: string;
  status: {
    label: string;
    tone: ContextTone;
  };
  actions: ContextRailAction[];
  insights: ContextRailMetric[];
  relations: ContextRailMetric[];
  documents: ContextRailDocument[];
  risks: ContextRailRisk[];
  sourcePath: string;
}

export interface UserWorkspaceState {
  favorites: string[];
  recent: string[];
}
