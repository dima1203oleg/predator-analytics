/**
 * PREDATOR v57.2-WRAITH | Newspaper API — Газета PREDATOR
 * Сервіс для отримання даних газети: компромат, тренди, митниця, алерти.
 */

import { apiClient } from './config';

// ========================
// Типи даних
// ========================

export interface NewspaperHeadline {
  title: string;
  subtitle: string;
  riskScore: number;
  tag: string;
  hook: string;
  edrpou: string;
  declarationNumber: string;
  date: string;
}

export interface ComprommatItem {
  id: string;
  title: string;
  subtitle: string;
  risk: string;
  hook: string;
  riskLevel: 'high' | 'medium' | 'low';
  source: string;
}

export interface TrendItem {
  id: string;
  title: string;
  subtitle: string;
  hook: string;
  direction: 'up' | 'down';
  percent: number;
  hsCode: string;
  count: number;
  totalValue: number;
}

export interface CustomsItem {
  id: string;
  title: string;
  subtitle: string;
  hook: string;
  type: 'opportunity' | 'risk';
  avgRisk: number;
}

export interface AlertItem {
  id: string;
  text: string;
  urgency: 'high' | 'medium' | 'info';
  time: string;
}

export interface NewspaperMetrics {
  materials: number;
  riskAlerts: number;
  trends: number;
  customsEvents: number;
  totalDeclarations: number;
  totalValueUsd: number;
  importCount: number;
  exportCount: number;
}

export interface NewspaperData {
  headline: NewspaperHeadline;
  compromat: ComprommatItem[];
  trends: TrendItem[];
  customs: CustomsItem[];
  alerts: AlertItem[];
  metrics: NewspaperMetrics;
  summary: string;
  generated_at: string;
}

// ========================
// API методи
// ========================

export const newspaperApi = {
  getData: async (): Promise<NewspaperData> => {
    const response = await apiClient.get('/newspaper');
    return response.data;
  },
};
