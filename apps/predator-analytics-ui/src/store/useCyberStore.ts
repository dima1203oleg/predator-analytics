import { create } from 'zustand';

export type AvatarMode = 'COMMUNICATION' | 'SEARCH' | 'OSINT' | 'ANALYTICS' | 'HIDDEN' | 'DATA_PROCESSING';
export type AIState = 'IDLE' | 'THINKING' | 'SPEAKING';
export type CognitiveState = 'LEARNING' | 'INFERENCE' | 'RISK' | 'IDLE';

interface CyberState {
  avatarMode: AvatarMode;
  aiState: AIState;
  cognitiveState: CognitiveState;
  showHologram: boolean;
  
  setAvatarMode: (mode: AvatarMode) => void;
  setAIState: (state: AIState) => void;
  setCognitiveState: (state: CognitiveState) => void;
  setShowHologram: (show: boolean) => void;
}

export const useCyberStore = create<CyberState>((set) => ({
  avatarMode: 'COMMUNICATION',
  aiState: 'IDLE',
  cognitiveState: 'IDLE',
  showHologram: false,
  
  setAvatarMode: (mode) => set({ avatarMode: mode }),
  setAIState: (state) => set({ aiState: state }),
  setCognitiveState: (state) => set({ cognitiveState: state }),
  setShowHologram: (show) => set({ showHologram: show }),
}));
