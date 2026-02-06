import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IngestionJob {
  id: string;
  filename: string;
  filesize: number;
  type?: 'excel' | 'csv' | 'pdf' | 'telegram' | 'website' | 'image' | 'word' | 'api' | 'rss' | 'audio' | 'video';
  status: 'uploading' | 'validating' | 'parsing' | 'chunking' | 'embedding' | 'indexing' | 'ready' | 'failed';
  stage: string;
  subPhase?: string; // e.g. "Allocating resource", "Inferring types"
  percent: number;
  message: string;
  error?: string;
  startedAt: number;
  totalItems?: number;
  currentItem?: number;
}

interface IngestionState {
  activeJobs: Record<string, IngestionJob>;
  minimized: boolean;
  isHubOpen: boolean; // Global Process Hub Visibility

  // Actions
  addJob: (id: string, filename: string, filesize: number, type?: IngestionJob['type']) => void;
  updateJob: (id: string, updates: Partial<IngestionJob>) => void;
  removeJob: (id: string) => void;
  setMinimized: (v: boolean) => void;
  setHubOpen: (v: boolean) => void;
  clearCompleted: () => void;
}

export const useIngestionStore = create<IngestionState>()(
  persist(
    (set) => ({
      activeJobs: {},
      minimized: false,
      isHubOpen: false,

      addJob: (id, filename, filesize, type) => set((state) => ({
        activeJobs: {
          ...state.activeJobs,
          [id]: {
            id,
            filename,
            filesize,
            type,
            status: 'uploading',
            stage: 'init',
            percent: 0,
            message: 'Initializing upload...',
            startedAt: Date.now()
          }
        },
        minimized: false,
        isHubOpen: true // Auto-open hub on new job
      })),

      updateJob: (id, updates) => set((state) => {
        const job = state.activeJobs[id];
        if (!job) return state;
        return {
          activeJobs: {
            ...state.activeJobs,
            [id]: { ...job, ...updates }
          }
        };
      }),

      removeJob: (id) => set((state) => {
        const newJobs = { ...state.activeJobs };
        delete newJobs[id];
        return { activeJobs: newJobs };
      }),

      setMinimized: (minimized) => set({ minimized }),
      setHubOpen: (isHubOpen) => set({ isHubOpen }),

      clearCompleted: () => set((state) => {
        const newJobs = { ...state.activeJobs };
        Object.keys(newJobs).forEach(id => {
          if (['ready', 'failed'].includes(newJobs[id].status)) {
            delete newJobs[id];
          }
        });
        return { activeJobs: newJobs };
      })
    }),
    {
      name: 'predator-ingestion-storage',
      partialize: (state) => ({ activeJobs: state.activeJobs }), // Don't persist UI state like 'minimized' permanently if not desired, but here we persist jobs
    }
  )
);
