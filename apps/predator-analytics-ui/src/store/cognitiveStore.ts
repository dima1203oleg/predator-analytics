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
    // Підключення до реального бекенду замість симуляції
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    
    // Fallback симуляція станів когнітивного ядра
    const interval = setInterval(() => {
      const states: CognitiveState[] = [
        'Contemplation', 'Correlation', 'Inference', 'Validation', 
        'Discovery', 'Prediction', 'Optimization', 'Alert', 'Learning'
      ];
      let stateIndex = states.indexOf(get().currentState);
      if (get().isProcessing || Math.random() > 0.85) {
         stateIndex = (stateIndex + 1) % states.length;
         get().setState(states[stateIndex]);
      }
    }, 2000);

    // SSE підключення до NVIDIA сервера
    const eventSource = new EventSource(`${API_BASE_URL}/telemetry/stream`);
    
    eventSource.addEventListener('telemetry', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Витягуємо дані з першого доступного GPU (або симульованого Tensor Core з бекенду)
        const mainGpu = data.gpus && data.gpus.length > 0 ? data.gpus[0] : null;
        
        set({
          telemetry: {
            computePower: mainGpu ? mainGpu.utilization : data.cpu_percent,
            energyMW: parseFloat(((mainGpu ? mainGpu.utilization * 1.5 : data.cpu_percent) / 100 * 3.5 + 0.5).toFixed(2)),
            parallelProcesses: Math.round(data.ram_percent * 10000),
            temperature: mainGpu ? mainGpu.temperature : 40 + (data.cpu_percent * 0.4),
            confidence: get().telemetry.confidence, // Залишаємо поточне або логіка
          }
        });
      } catch (e) {
        console.error('Помилка парсингу телеметрії', e);
      }
    });

    eventSource.onerror = (e) => {
      console.error('SSE connection error in CognitiveStore', e);
      // Optional: fallback to random simulation on disconnect
    };

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }
}));

