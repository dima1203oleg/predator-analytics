import { create } from 'zustand';

export type CognitiveState = 
  | 'Contemplation' 
  | 'Correlation' 
  | 'Inference' 
  | 'Validation' 
  | 'Discovery' 
  | 'Prediction' 
  | 'Optimization' 
  | 'Alert' 
  | 'Learning';

interface SystemTelemetry {
  computePower: number; // 0 - 100
  energyMW: number;
  parallelProcesses: number;
  temperature: number;
  confidence: number;
}

interface CognitiveStore {
  currentState: CognitiveState;
  telemetry: SystemTelemetry;
  setState: (state: CognitiveState) => void;
  updateTelemetry: (data: Partial<SystemTelemetry>) => void;
}

export const useCognitiveStore = create<CognitiveStore>((set) => ({
  currentState: 'Discovery',
  telemetry: {
    computePower: 87,
    energyMW: 2.14,
    parallelProcesses: 1248376,
    temperature: 46.3,
    confidence: 92.7
  },
  setState: (state) => set({ currentState: state }),
  updateTelemetry: (data) => set((state) => ({ 
    telemetry: { ...state.telemetry, ...data } 
  }))
}));
