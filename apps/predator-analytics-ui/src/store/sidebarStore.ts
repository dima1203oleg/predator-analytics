import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  openSections: string[];
  toggleSection: (sectionId: string) => void;
  setOpenSections: (sectionIds: string[]) => void;
  reset: () => void;
}

const DEFAULT_OPEN_SECTIONS = ['/'];

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      openSections: DEFAULT_OPEN_SECTIONS,
      toggleSection: (sectionId) =>
        set((state) => {
          const isOpen = state.openSections.includes(sectionId);
          return {
            openSections: isOpen
              ? state.openSections.filter((currentId) => currentId !== sectionId)
              : [...state.openSections, sectionId],
          };
        }),
      setOpenSections: (sectionIds) => set({ openSections: sectionIds }),
      reset: () => set({ openSections: DEFAULT_OPEN_SECTIONS }),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ openSections: state.openSections }),
    },
  ),
);
