import { create } from 'zustand';

export type CameraMode = 'observer' | 'analyst' | 'investigation' | 'free';

interface UIState {
  cameraMode: CameraMode;
  isExplainabilityOpen: boolean;
  riskThreshold: number;
  notifications: Array<{ id: string; message: string }>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';

  setCameraMode: (mode: CameraMode) => void;
  toggleExplainability: () => void;
  setRiskThreshold: (val: number) => void;
  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  showKnowledgeGraph: boolean;
  setShowKnowledgeGraph: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  cameraMode: 'observer',
  isExplainabilityOpen: false,
  riskThreshold: 0.0,
  notifications: [],
  connectionStatus: 'disconnected',
  showKnowledgeGraph: true,

  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleExplainability: () => set((state) => ({ isExplainabilityOpen: !state.isExplainabilityOpen })),
  setRiskThreshold: (val) => set({ riskThreshold: val }),
  addNotification: (message) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { id, message }].slice(-5)
    }));
    // Auto-remove after 5s
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setShowKnowledgeGraph: (show) => set({ showKnowledgeGraph: show }),
}));
