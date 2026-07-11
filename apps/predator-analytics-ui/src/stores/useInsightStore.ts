/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR — Insight Store (Zustand)
 * Зберігає та керує потоком аналітичних інсайтів системи
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type InsightSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'DISCOVERY';
export type InsightCategory  = 'ANOMALY' | 'CONNECTION' | 'RISK_ALERT' | 'TREND' | 'PATTERN';

export interface Insight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  timestamp: number;
  linkedNodeId?: string;
  linkedDocumentId?: string;
  position?: [number, number, number]; // 3D позиція в просторі
  isRead: boolean;
  isActive: boolean; // аватар зараз "представляє" цей інсайт
  confidence: number; // 0..1
}

interface InsightState {
  insights: Insight[];
  activeInsightId: string | null;
  insightQueue: string[]; // IDs для послідовного представлення

  // Дії
  addInsight: (insight: Omit<Insight, 'id' | 'timestamp' | 'isRead' | 'isActive'>) => string;
  markRead: (id: string) => void;
  setActiveInsight: (id: string | null) => void;
  dismissInsight: (id: string) => void;
  clearAll: () => void;
  enqueueInsight: (id: string) => void;
  dequeueNextInsight: () => string | null;
}

export const useInsightStore = create<InsightState>()(
  subscribeWithSelector((set, get) => ({
    insights: [],
    activeInsightId: null,
    insightQueue: [],

    addInsight: (data) => {
      const id = crypto.randomUUID();
      const position: [number, number, number] = [
        Math.random() * 4 - 2, // x between -2 and 2
        Math.random() * 2 + 1, // y between 1 and 3
        Math.random() * -4 - 2 // z between -2 and -6 (in front of camera)
      ];
      const insight: Insight = {
        ...data,
        id,
        timestamp: Date.now(),
        isRead: false,
        isActive: false,
        position,
      };
      set((state) => ({
        insights: [insight, ...state.insights].slice(0, 100), // максимум 100
      }));
      return id;
    },

    markRead: (id) => set((state) => ({
      insights: state.insights.map(i => i.id === id ? { ...i, isRead: true } : i),
    })),

    setActiveInsight: (id) => set((state) => ({
      activeInsightId: id,
      insights: state.insights.map(i => ({
        ...i,
        isActive: i.id === id,
      })),
    })),

    dismissInsight: (id) => set((state) => ({
      insights: state.insights.filter(i => i.id !== id),
      activeInsightId: state.activeInsightId === id ? null : state.activeInsightId,
    })),

    clearAll: () => set({ insights: [], activeInsightId: null, insightQueue: [] }),

    enqueueInsight: (id) => set((state) => ({
      insightQueue: [...state.insightQueue, id],
    })),

    dequeueNextInsight: () => {
      const { insightQueue } = get();
      if (insightQueue.length === 0) return null;
      const [next, ...rest] = insightQueue;
      set({ insightQueue: rest });
      return next;
    },
  }))
);

// ─── Селектори ───────────────────────────────────────────────────────────────

export const useUnreadInsights = () =>
  useInsightStore(s => s.insights.filter(i => !i.isRead));

export const useCriticalInsights = () =>
  useInsightStore(s => s.insights.filter(i => i.severity === 'CRITICAL'));

export const useActiveInsight = () =>
  useInsightStore(s => s.insights.find(i => i.id === s.activeInsightId) ?? null);
