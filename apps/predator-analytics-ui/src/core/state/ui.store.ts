import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  isAiWorkspaceOpen: boolean;
  activePanel: 'graph' | 'map' | 'documents' | 'none';
  toggleSidebar: () => void;
  toggleAiWorkspace: () => void;
  setActivePanel: (panel: 'graph' | 'map' | 'documents' | 'none') => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  isAiWorkspaceOpen: false,
  activePanel: 'graph',
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleAiWorkspace: () => set((state) => ({ isAiWorkspaceOpen: !state.isAiWorkspaceOpen })),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));
