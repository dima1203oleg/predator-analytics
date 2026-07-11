import { create } from 'zustand';
import { AvatarState, AvatarBehavior, FingerState } from '@/types';

interface AvatarBehaviorStore extends AvatarBehavior {
  setState: (state: AvatarState) => void;
  updateExpression: (expression: Partial<AvatarBehavior['expression']>) => void;
  updateGestures: (gestures: Partial<AvatarBehavior['gestures']>) => void;
  updateEmotionalReactivity: (reactivity: Partial<AvatarBehavior['emotionalReactivity']>) => void;
  triggerGesture: (gestureType: 'point' | 'wave' | 'reach' | 'confirm') => void;
}

export const useAvatarBehaviorStore = create<AvatarBehaviorStore>((set, get) => ({
  state: AvatarState.IDLE,
  expression: {
    eyes: {
      gazeDirection: [0, 0, 1],
      blinkState: 'open' as const,
      blinkTimer: 0
    },
    eyebrows: {
      position: [0, 0, 0],
      tension: 0
    },
    mouth: {
      shape: 'neutral' as const,
      openness: 0
    }
  },
  gestures: {
    posture: {
      rotation: [0, 0, 0],
      position: [0, 0, 0]
    },
    hand: {
      position: [0, 0, 0],
      fingers: [
        { finger: 'thumb', position: [0, 0, 0], curl: 0, stretch: 1 },
        { finger: 'index', position: [0, 0, 0], curl: 0, stretch: 1 },
        { finger: 'middle', position: [0, 0, 0], curl: 0, stretch: 1 },
        { finger: 'ring', position: [0, 0, 0], curl: 0, stretch: 1 },
        { finger: 'pinky', position: [0, 0, 0], curl: 0, stretch: 1 }
      ]
    }
  },
  emotionalReactivity: {
    level: 0.5,
    intensity: 0
  },

  setState: (state) => set({ state }),

  updateExpression: (expression) => set((state) => ({
    expression: { ...state.expression, ...expression }
  })),

  updateGestures: (gestures) => set((state) => ({
    gestures: { ...state.gestures, ...gestures }
  })),

  updateEmotionalReactivity: (reactivity) => set((state) => ({
    emotionalReactivity: { ...state.emotionalReactivity, ...reactivity }
  })),

  triggerGesture: (gestureType) => set((state) => {
    const gesturePositions = {
      point: [1.5, 0.5, 0.5],
      wave: [1.5, 0.5, 0],
      reach: [0, 0, 0.5],
      confirm: [1, 0, 0.5]
    };

    return {
      gestures: {
        ...state.gestures,
        hand: {
          ...state.gestures.hand,
          position: gesturePositions[gestureType],
          fingers: state.gestures.hand.fingers.map(f => ({
            ...f,
            curl: gestureType === 'wave' ? 0.3 : 0
          }))
        }
      }
    };
  })
}));
