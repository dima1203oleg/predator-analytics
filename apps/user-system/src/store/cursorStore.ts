import { create } from 'zustand';
import { CursorState, CursorTrail } from '@/types';

interface CursorStore extends CursorState {
  updatePosition: (position: [number, number, number]) => void;
  hoverNode: (nodeId: string | undefined) => void;
  updateTrail: (position: [number, number, number]) => void;
  resetTrail: () => void;
}

export const useCursorStore = create<CursorStore>((set, get) => ({
  position: [0, 0, 0],
  isHovering: false,
  hoveredNode: undefined,
  trail: {
    positions: [],
    maxLength: 50,
    opacity: 1
  },

  updatePosition: (position) => set((state) => ({
    position,
    trail: {
      ...state.trail,
      positions: [...state.trail.positions.slice(-state.trail.maxLength + 1), position]
    }
  })),

  hoverNode: (nodeId) => set({ hoveredNode: nodeId, isHovering: !!nodeId }),

  updateTrail: (position) => set((state) => {
    const trail = {
      ...state.trail,
      positions: [...state.trail.positions.slice(-state.trail.maxLength + 1), position]
    };
    return { trail, position };
  }),

  resetTrail: () => set((state) => ({
    trail: {
      positions: [],
      maxLength: state.trail.maxLength,
      opacity: state.trail.opacity
    }
  }))
}));
