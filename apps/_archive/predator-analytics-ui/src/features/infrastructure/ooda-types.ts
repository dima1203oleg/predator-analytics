export type OODAStatus = 'OBSERVING' | 'ORIENTING' | 'DECIDING' | 'ACTING' | 'RESOLVED' | 'STANDBY';

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  avatar?: string;
}

export interface OODAStep {
  id: string;
  timestamp: string;
  status: OODAStatus;
  component: string;
  finding: string;
  action_plan?: string[];
  automated: boolean;
  human_approval_required: boolean;
  assigned_agent?: AgentInfo;
}

export interface OODALoopState {
  current_step: OODAStatus;
  active_incidents: OODAStep[];
  system_health: number;
}
