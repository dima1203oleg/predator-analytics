import { create } from 'zustand';
import { Thought, ThoughtParticle, ThoughtConnection } from '@/types';
import { nanoid } from 'nanoid';

interface ThoughtVisualizationStore {
  thoughts: Thought[];
  activeThoughtId: string | null;
  particleSystemRef: React.MutableRefObject<THREE.Points | null> | undefined;
  activeThought: Thought | null;

  addThought: (content: string) => Thought;
  removeThought: (thoughtId: string) => void;
  updateThought: (thoughtId: string, updates: Partial<Thought>) => void;
  activateThought: (thoughtId: string) => void;
  deactivateThought: () => void;
  updateThoughtParticles: (thoughtId: string, particles: ThoughtParticle[]) => void;
  updateThoughtConnections: (thoughtId: string, connections: ThoughtConnection[]) => void;
  clearThoughts: () => void;
  createThoughtNode: (thoughtId: string) => void;
  updateParticleVelocity: (particleId: string, velocity: [number, number, number]) => void;
}

export const useThoughtVisualizationStore = create<ThoughtVisualizationStore>((set, get) => ({
  thoughts: [],
  activeThoughtId: null,
  particleSystemRef: undefined,
  activeThought: null,

  addThought: (content) => {
    const thought: Thought = {
      id: nanoid(),
      timestamp: Date.now(),
      content,
      state: 'forming' as const,
      particles: [],
      connections: []
    };
    set((state) => ({
      thoughts: [...state.thoughts, thought],
      activeThoughtId: thought.id
    }));
    return thought;
  },

  removeThought: (thoughtId) => set((state) => ({
    thoughts: state.thoughts.filter(t => t.id !== thoughtId),
    activeThoughtId: state.activeThoughtId === thoughtId ? null : state.activeThoughtId
  })),

  updateThought: (thoughtId, updates) => set((state) => ({
    thoughts: state.thoughts.map(t =>
      t.id === thoughtId ? { ...t, ...updates } : t
    )
  })),

  activateThought: (thoughtId) => set({
    activeThoughtId: thoughtId,
    activeThought: get().thoughts.find(t => t.id === thoughtId) || null
  }),

  deactivateThought: () => set({
    activeThoughtId: null,
    activeThought: null
  }),

  updateThoughtParticles: (thoughtId, particles) => set((state) => ({
    thoughts: state.thoughts.map(t =>
      t.id === thoughtId ? { ...t, particles } : t
    )
  })),

  updateThoughtConnections: (thoughtId, connections) => set((state) => ({
    thoughts: state.thoughts.map(t =>
      t.id === thoughtId ? { ...t, connections } : t
    )
  })),

  clearThoughts: () => set({
    thoughts: [],
    activeThoughtId: null,
    activeThought: null
  }),

  createThoughtNode: (thoughtId) => {
    // Create initial thought particles near avatar position
    const thought = get().thoughts.find(t => t.id === thoughtId);
    if (!thought) return;

    const particles: ThoughtParticle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: nanoid(),
        position: [Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25, Math.random() * 0.3],
        velocity: [Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01],
        lifetime: 0,
        maxLifetime: 300 + Math.random() * 200
      });
    }

    set((state) => ({
      thoughts: state.thoughts.map(t =>
        t.id === thoughtId
          ? {
              ...t,
              particles,
              connections: [],
              state: 'active' as const
            }
          : t
      )
    }));
  },

  updateParticleVelocity: (particleId, velocity) => set((state) => ({
    thoughts: state.thoughts.map(t => ({
      ...t,
      particles: t.particles.map(p =>
        p.id === particleId ? { ...p, velocity: velocity as [number, number, number] } : p
      )
    }))
  }))
}));
