export type Dimension =
  | 'explorer'    // Research & Analysis
  | 'operator'    // Operations & Monitoring
  | 'commander'   // Strategy & Reporting
  | 'architect';  // Configuration & Engineering

export type UserRole =
  | 'analyst'
  | 'operator'
  | 'manager'
  | 'admin'
  | 'guest';

export interface ContextFactors {
  timeOfDay: 'day' | 'night';
  alertLevel: 'normal' | 'elevated' | 'critical';
  activeIncidents: number;
  userActivity: 'active' | 'idle';
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface ShellProps {
  isActive: boolean;
  context: ContextFactors;
  onDimensionSwitch?: (dimension: Dimension) => void;
}

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
