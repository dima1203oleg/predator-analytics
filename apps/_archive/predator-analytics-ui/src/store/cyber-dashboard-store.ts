/**
 * 🤖 PREDATOR Cyberpunk Dashboard Store
 * 
 * Zustand store для керування станом тактичного AI дашборду
 * згідно з технічною специфікацією
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Типи для стану
type PanelType = 'left' | 'right' | 'bottom' | null;

interface CyberDashboardState {
  // UI стани панелей
  activePanel: PanelType;
  isPanelCollapsed: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
  
  // Аудіо стан
  isListening: boolean;
  audioData: Uint8Array | null;
  audioLevel: number; // 0-1
  
  // 3D аватар стан
  headTargetRotation: {
    x: number;
    y: number;
  };
  headCurrentRotation: {
    x: number;
    y: number;
  };
  isHeadTracking: boolean;
  
  // Тактичний стан
  threatLevel: number; // 1-5
  interceptionActive: boolean;
  systemStatus: 'online' | 'offline' | 'degraded';
  
  // Чат та комунікація
  chatMessages: Array<{
    id: string;
    sender: 'user' | 'ai' | 'system';
    text: string;
    timestamp: Date;
  }>;
  
  // Дії UI
  setActivePanel: (panel: PanelType) => void;
  togglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  collapsePanel: (panel: 'left' | 'right' | 'bottom') => void;
  
  // Аудіо дії
  startListening: () => Promise<void>;
  stopListening: () => void;
  updateAudioData: (data: Uint8Array) => void;
  
  // 3D аватар дії
  setHeadTargetRotation: (x: number, y: number) => void;
  updateHeadRotation: () => void;
  toggleHeadTracking: (enabled: boolean) => void;
  
  // Тактичні дії
  setThreatLevel: (level: number) => void;
  setInterceptionActive: (active: boolean) => void;
  setSystemStatus: (status: 'online' | 'offline' | 'degraded') => void;
  
  // Чат дії
  addChatMessage: (message: Omit<CyberDashboardState['chatMessages'][0], 'id' | 'timestamp'>) => void;
  clearChat: () => void;
}

// Створення store з підпискою для оптимізації
export const useCyberDashboardStore = create<CyberDashboardState>()(
  subscribeWithSelector((set, get) => ({
    // Початковий стан
    activePanel: null,
    isPanelCollapsed: {
      left: false,
      right: false,
      bottom: false,
    },
    
    isListening: false,
    audioData: null,
    audioLevel: 0,
    
    headTargetRotation: { x: 0, y: 0 },
    headCurrentRotation: { x: 0, y: 0 },
    isHeadTracking: true,
    
    threatLevel: 1,
    interceptionActive: false,
    systemStatus: 'online',
    
    chatMessages: [],
    
    // UI дії
    setActivePanel: (panel) => set({ activePanel: panel }),
    
    togglePanel: (panel) => set((state) => ({
      isPanelCollapsed: {
        ...state.isPanelCollapsed,
        [panel]: !state.isPanelCollapsed[panel],
      },
    })),
    
    collapsePanel: (panel) => set((state) => ({
      isPanelCollapsed: {
        ...state.isPanelCollapsed,
        [panel]: true,
      },
    })),
    
    // Аудіо дії
    startListening: async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          set({ 
            audioData: dataArray,
            audioLevel: dataArray.reduce((a, b) => a + b) / dataArray.length / 255,
          });
          requestAnimationFrame(updateAudio);
        };
        
        updateAudio();
        set({ isListening: true });
      } catch (error) {
        console.error('Помилка доступу до мікрофона:', error);
        set({ isListening: false });
        throw error;
      }
    },
    
    stopListening: () => {
      set({ 
        isListening: false,
        audioData: null,
        audioLevel: 0,
      });
    },
    
    updateAudioData: (data) => set({ 
      audioData: data,
      audioLevel: data.reduce((a, b) => a + b) / data.length / 255,
    }),
    
    // 3D аватар дії
    setHeadTargetRotation: (x, y) => set({ 
      headTargetRotation: { x, y } 
    }),
    
    updateHeadRotation: () => set((state) => {
      if (!state.isHeadTracking) return state;
      
      // Плавна інтерполяція до цільового обертання
      const lerp = (start: number, end: number, factor: number) => 
        start + (end - start) * factor;
      
      return {
        headCurrentRotation: {
          x: lerp(state.headCurrentRotation.x, state.headTargetRotation.x, 0.05),
          y: lerp(state.headCurrentRotation.y, state.headTargetRotation.y, 0.05),
        },
      };
    }),
    
    toggleHeadTracking: (enabled) => set({ isHeadTracking: enabled }),
    
    // Тактичні дії
    setThreatLevel: (level) => set({ threatLevel: Math.min(5, Math.max(1, level)) }),
    setInterceptionActive: (active) => set({ interceptionActive: active }),
    setSystemStatus: (status) => set({ systemStatus: status }),
    
    // Чат дії
    addChatMessage: (message) => set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ].slice(-50), // Зберігати тільки останні 50 повідомлень
    })),
    
    clearChat: () => set({ chatMessages: [] }),
  }))
);

// Селектори для оптимізації рендерингу
export const useAudioData = () => useCyberDashboardStore((state) => state.audioData);
export const useIsListening = () => useCyberDashboardStore((state) => state.isListening);
export const useHeadRotation = () => useCyberDashboardStore((state) => state.headCurrentRotation);
export const useThreatLevel = () => useCyberDashboardStore((state) => state.threatLevel);
export const useChatMessages = () => useCyberDashboardStore((state) => state.chatMessages);
