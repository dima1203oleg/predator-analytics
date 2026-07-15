import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { UserRole } from '../config/roles';
import { apiClient } from '../services/api/config';

export type InterlinkPersona = 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'BUSINESS' | 'GOVERNMENT' | 'INTELLIGENCE' | 'BANKING' | 'MEDIA';
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';
export type ApiLanguage = 'ua' | 'en';
export type ExperienceLevel = 'explorer' | 'professional' | 'expert';

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
  
  // Universe UI
  experienceLevel: ExperienceLevel;
  isUniverseMode: boolean;
  
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
    (set, get) => ({
      userRole: UserRole.CLIENT_BASIC,
      persona: 'SOVEREIGN',

      deviceMode: 'desktop',
      isSidebarOpen: true,
      language: 'ua',
      isTerminalOpen: false,
      highVisibility: true,
      experienceLevel: 'professional',
      isUniverseMode: true,
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

      // Async AI Processing — з'єднання з реальним Backend через apiClient (JWT auto)
      processAICommand: async (command) => {
        set((state) => ({
          aiState: {
            ...state.aiState,
            isReasoning: true,
            response: null,
            activeTools: ['RAG Search', 'Graph Analysis', 'DB Query'],
          }
        }));

        try {
          // apiClient вже має baseURL і JWT через interceptor (config.ts)
          const { data } = await apiClient.post('/copilot/chat', { message: command });
          
          const replyText = data.reply || 'Аналіз завершено.';
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
          get().speakText(replyText);
        } catch (error: any) {
          console.error('AI Command Error:', error);
          // Визначаємо тип помилки для зрозумілого повідомлення
          let errorMsg: string;
          const status = error?.response?.status;
          if (status === 401) {
            errorMsg = '⚠️ Сесія авторизації закінчилась. Будь ласка, увійдіть знову.';
          } else if (status === 503 || status === 502) {
            errorMsg = '⚠️ AI сервер тимчасово недоступний. Спробуйте через хвилину.';
          } else if (!error?.response) {
            errorMsg = `⚠️ Немає з'єднання з сервером. Перевірте мережу.`;
          } else {
            errorMsg = `⚠️ Помилка AI (${status}): ${error?.response?.data?.detail || error.message || 'Невідома помилка'}`;
          }
          set((state) => ({
            aiState: {
              ...state.aiState,
              isReasoning: false,
              response: errorMsg,
            }
          }));
          // Trigger TTS even for errors so the face animates!
          get().speakText(errorMsg);
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
        utterance.rate = 0.85; // Slower
        utterance.pitch = 0.1; // Deep bass for male cyber feel
        
        // Try to select a male voice if available (some OS have multiple)
        const voices = window.speechSynthesis.getVoices();
        const ukVoices = voices.filter(v => v.lang.includes('uk'));
        if (ukVoices.length > 0) {
          // If we find one containing 'male' or just use the first and rely on pitch
          const maleVoice = ukVoices.find(v => v.name.toLowerCase().includes('male'));
          utterance.voice = maleVoice || ukVoices[0];
        }

        utterance.onstart = () => get().setSpeakingState(true);
        utterance.onend = () => get().setSpeakingState(false);
        utterance.onerror = () => get().setSpeakingState(false);
        
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
