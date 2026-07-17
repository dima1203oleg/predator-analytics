import { create } from 'zustand';

interface TelemetryMetrics {
  gpu: number;
  cpu: number;
  memory: number;
  activeAgents: number;
  networkLatency: number;
}

interface TelemetryState {
  metrics: TelemetryMetrics;
  updateMetrics: (newMetrics: Partial<TelemetryMetrics>) => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  metrics: {
    gpu: 0,
    cpu: 0,
    memory: 0,
    activeAgents: 0,
    networkLatency: 0,
  },
  updateMetrics: (newMetrics) =>
    set((state) => ({
      metrics: { ...state.metrics, ...newMetrics },
    })),
}));
