/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OpenSourceSolution {
  id: string;
  name: string;
  category: string;
  license: string;
  licenseType: 'Permissive' | 'Weak Copyleft' | 'Strong Copyleft' | 'Source Available' | 'Commercial';
  productionReady: 'Tak (High)' | 'Tak' | 'Частково' | 'Ні';
  advantages: string[];
  disadvantages: string[];
  compatibilityScore: number;
  description: string;
  role: string;
  techStack: string;
  securityRating: 'A' | 'B' | 'C' | 'D';
}

export interface LicenseMatrixItem {
  license: string;
  saasUsage: string;
  modification: string;
  dynamicLinking: string;
  riskLevel: 'Низький' | 'Середній' | 'Високий' | 'Фінансовий';
  solution: string;
  details: string;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  group: 'Client' | 'Gateway' | 'Core' | 'Database' | 'Event' | 'Worker' | 'AI' | 'External';
  description: string;
  details: string;
  tech: string;
  security: string;
  scaling: string;
}

export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  type?: 'sync' | 'async' | 'external';
}

export interface GapItem {
  id: string;
  title: string;
  category: 'direct' | 'adapt' | 'replace' | 'not_recommended' | 'in_house';
  categoryLabel: string;
  description: string;
  actionItems: string[];
  difficulty: 'Легка' | 'Середня' | 'Висока' | 'Критична';
  timeEstimate: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  timeframe: string;
  focus: string;
  components: string[];
  risks: string[];
  milestones: { text: string; done: boolean }[];
  gpuRequirements?: string;
}
