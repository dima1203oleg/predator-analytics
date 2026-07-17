import { create } from 'zustand';

interface VibeState {
  mode: 'strict' | 'creative';
  toggleVibe: () => void;
  setMode: (mode: 'strict' | 'creative') => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  mode: 'strict',
  toggleVibe: () => set((state) => ({ 
    mode: state.mode === 'strict' ? 'creative' : 'strict' 
  })),
  setMode: (mode) => set({ mode }),
}));
