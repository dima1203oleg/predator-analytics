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

export interface EventLogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface ActiveNeuronData {
  index: number;
  id: string;
  type: string;
  riskScore: number;
  details: string;
  position: [number, number, number];
}

interface CognitiveStore {
  currentState: CognitiveState;
  telemetry: SystemTelemetry;
  eventLog: EventLogEntry[];
  setState: (state: CognitiveState) => void;
  updateTelemetry: (data: Partial<SystemTelemetry>) => void;
  addEvent: (message: string, type?: EventLogEntry['type']) => void;
  insightFlash: number;
  triggerInsightEvent: () => void;
  isProcessing: boolean;
  setProcessing: (val: boolean) => void;
  activeNeuron: ActiveNeuronData | null;
  setActiveNeuron: (neuron: ActiveNeuronData | null) => void;
  startSimulation: () => () => void;
}

const now = () => new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const useCognitiveStore = create<CognitiveStore>((set, get) => ({
  isProcessing: false,
  setProcessing: (val) => set({ isProcessing: val }),
  activeNeuron: null,
  setActiveNeuron: (neuron) => set({ activeNeuron: neuron }),
  currentState: 'Discovery',
  telemetry: {
    computePower: 87,
    energyMW: 2.14,
    parallelProcesses: 1248376,
    temperature: 46.3,
    confidence: 92.7
  },
  eventLog: [
    { id: '1', time: now(), message: 'Систему ініціалізовано', type: 'success' },
    { id: '2', time: now(), message: 'Підключення до NVIDIA Compute Node', type: 'info' },
    { id: '3', time: now(), message: 'Void Forge активовано', type: 'info' },
  ],
  setState: (state) => {
    set({ currentState: state });
    get().addEvent(`Когнітивний стан → ${state}`, 'info');
  },
  updateTelemetry: (data) => set((state) => ({ 
    telemetry: { ...state.telemetry, ...data } 
  })),
  addEvent: (message, type = 'info') => {
    const entry: EventLogEntry = { id: Date.now().toString(), time: now(), message, type };
    set((state) => ({ eventLog: [entry, ...state.eventLog].slice(0, 20) }));
  },
  insightFlash: 0,
  triggerInsightEvent: () => set((state) => ({ insightFlash: state.insightFlash + 1 })),
  startSimulation: () => {
    const interval = setInterval(() => {
      const t = get().telemetry;
      const fluctuate = (v: number, max: number, min: number, delta: number) =>
        Math.max(min, Math.min(max, v + (Math.random() - 0.5) * delta));

      const states: CognitiveState[] = [
        'Contemplation', 'Correlation', 'Inference', 'Validation', 
        'Discovery', 'Prediction', 'Optimization', 'Alert', 'Learning'
      ];
      let stateIndex = states.indexOf(get().currentState);
      if (get().isProcessing || Math.random() > 0.85) {
         stateIndex = (stateIndex + 1) % states.length;
         get().setState(states[stateIndex]);
      }

      set({
        telemetry: {
          computePower: fluctuate(t.computePower, 99, 60, 4),
          energyMW: parseFloat(fluctuate(t.energyMW, 3.5, 1.2, 0.15).toFixed(2)),
          parallelProcesses: Math.round(fluctuate(t.parallelProcesses, 2000000, 800000, 50000)),
          temperature: parseFloat(fluctuate(t.temperature, 78, 32, 2).toFixed(1)),
          confidence: parseFloat(fluctuate(t.confidence, 99.9, 70, 1.5).toFixed(1)),
        }
      });
    }, 400);
    return () => clearInterval(interval);
  }
}));

