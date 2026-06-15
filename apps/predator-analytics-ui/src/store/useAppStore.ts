import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserRole } from '../config/roles';

export type InterlinkPersona = 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'BUSINESS' | 'GOVERNMENT' | 'INTELLIGENCE' | 'BANKING' | 'MEDIA';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type ApiLanguage = 'ua' | 'en';

interface AppState {
  // User & Access
  userRole: UserRole | string;
  persona: InterlinkPersona;
  
  // UI State
  deviceMode: DeviceMode;
  isSidebarOpen: boolean;
  language: ApiLanguage;
  isTerminalOpen: boolean;
  highVisibility: boolean;
  
  // AZR Status
  azrStatus: {
    status: 'learning' | 'stable' | 'optimizing';
    progress: number;
    message: string;
  };

  // V55.1 New Scaffold State
  tenant: string;
  isPlanMode: boolean;
  isCopilotOpen: boolean;
  
  // AI Copilot State (for Client Portal)
  aiState: {
    isReasoning: boolean;
    isSpeaking: boolean;
    activeTools: string[];
    response: string | null;
    threatLevel: 'NORMAL' | 'HIGH';
    activeTargetId: string | null;
  };
  
  // Actions
  setRole: (role: UserRole | string) => void;
  setPersona: (persona: InterlinkPersona) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLanguage: (lang: ApiLanguage) => void;
  setTerminalOpen: (open: boolean) => void;
  setHighVisibility: (enabled: boolean) => void;
  updateAzrStatus: (status: Partial<AppState['azrStatus']>) => void;
  setTenant: (tenant: string) => void;
  setPlanMode: (isPlanMode: boolean) => void;
  setCopilotOpen: (isCopilotOpen: boolean) => void;
  
  // AI Actions
  processAICommand: (command: string) => void;
  resetAIState: () => void;
  setSpeakingState: (isSpeaking: boolean) => void;
  speakText: (text: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: UserRole.CLIENT_BASIC,
      persona: 'SOVEREIGN',

      deviceMode: 'desktop',
      isSidebarOpen: true,
      language: 'ua',
      isTerminalOpen: false,
      highVisibility: true,
      azrStatus: {
        status: 'stable',
        progress: 100,
        message: 'Стан оптимальний'
      },
      tenant: 'Держмитслужба',
      isPlanMode: true,
      isCopilotOpen: false,
      aiState: {
        isReasoning: false,
        isSpeaking: false,
        activeTools: [],
        response: null,
        threatLevel: 'NORMAL',
        activeTargetId: null,
      },

      setRole: (userRole) => set({ userRole }),
      setPersona: (persona) => set({ persona }),
      setDeviceMode: (deviceMode) => set({ deviceMode }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setLanguage: (language) => set({ language }),
      setTerminalOpen: (isTerminalOpen) => set({ isTerminalOpen }),
      setHighVisibility: (highVisibility) => set({ highVisibility }),
      updateAzrStatus: (status) => set((state) => ({ 
        azrStatus: { ...state.azrStatus, ...status } 
      })),
      setTenant: (tenant) => set({ tenant }),
      setPlanMode: (isPlanMode) => set({ isPlanMode }),
      setCopilotOpen: (isCopilotOpen) => set({ isCopilotOpen }),

      // Async AI Processing Action with Mock API
      processAICommand: async (command) => {
        set((state) => ({
          aiState: {
            ...state.aiState,
            isReasoning: true,
            response: null,
            activeTools: ['RAG Search', 'Graph Analysis', 'Mock DB Query'],
          }
        }));

        try {
          const res = await fetch('http://localhost:9080/api/v1/copilot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: command })
          });
          
          if (!res.ok) throw new Error('API Error');
          
          const data = await res.json();
          
          const replyText = data.reply || 'Аналіз завершено. (Fallback response)';
          set((state) => ({
            aiState: {
              ...state.aiState,
              isReasoning: false,
              response: replyText,
              threatLevel: data.sources && data.sources.length > 0 ? 'HIGH' : 'NORMAL',
              activeTargetId: data.sources && data.sources.length > 0 ? 'target-x' : null
            }
          }));
          
          // Trigger TTS
          set().speakText(replyText);
        } catch (error) {
          console.error('AI Command Error:', error);
          set((state) => ({
            aiState: {
              ...state.aiState,
              isReasoning: false,
              response: `Помилка з'єднання з AI сервером: ${error instanceof Error ? error.message : 'Невідома помилка'}`,
            }
          }));
        }
      },

      resetAIState: () => {
         window.speechSynthesis.cancel();
         set((state) => ({
           aiState: {
             isReasoning: false,
             isSpeaking: false,
             activeTools: [],
             response: null,
             threatLevel: 'NORMAL',
             activeTargetId: null,
           }
         }));
      },

      setSpeakingState: (isSpeaking) => set((state) => ({
        aiState: { ...state.aiState, isSpeaking }
      })),

      speakText: (text) => {
        window.speechSynthesis.cancel(); // stop current
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'uk-UA';
        utterance.rate = 1.1;
        utterance.pitch = 0.9; // Slightly lower pitch for cyber feel
        
        utterance.onstart = () => set().setSpeakingState(true);
        utterance.onend = () => set().setSpeakingState(false);
        utterance.onerror = () => set().setSpeakingState(false);
        
        window.speechSynthesis.speak(utterance);
      },
    }),
    {
      name: 'predator-app-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        persona: state.persona,
        language: state.language,
        highVisibility: state.highVisibility,
        tenant: state.tenant,
        isPlanMode: state.isPlanMode,
      }),
    }
  )
);
