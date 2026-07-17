/* Zustand store: Avatar — FSM з transition validation, fallback */
import { create } from 'zustand';
import type { AvatarState, AvatarFallbackMode, GazeTarget } from '../types/avatar';
import { AVATAR_TRANSITIONS } from '../types/avatar';

interface AvatarStoreState {
    currentState: AvatarState;
    previousState: AvatarState;
    isAvailable: boolean;
    isVisible: boolean;
    fallbackMode: AvatarFallbackMode;
    gazeTarget: GazeTarget | null;

    /** Перехід у новий стан з валідацією дозволених переходів */
    transitionTo: (state: AvatarState) => void;
    setAvailable: (available: boolean) => void;
    toggleVisibility: () => void;
    setFallbackMode: (mode: AvatarFallbackMode) => void;
    setGazeTarget: (target: GazeTarget | null) => void;
}

export const useAvatarStore = create<AvatarStoreState>((set, get) => ({
    currentState: 'idle',
    previousState: 'idle',
    isAvailable: false,
    isVisible: true,
    fallbackMode: 'sphere',
    gazeTarget: null,

    transitionTo: (newState) => {
        const { currentState } = get();
        const allowedTransitions = AVATAR_TRANSITIONS[currentState];
        if (allowedTransitions.includes(newState)) {
            set({ previousState: currentState, currentState: newState });
        } else {
            console.warn(
                `[AvatarFSM] Неприпустимий перехід: ${currentState} → ${newState}. ` +
                `Дозволені: ${allowedTransitions.join(', ')}`
            );
        }
    },
    setAvailable: (available) => set({ isAvailable: available }),
    toggleVisibility: () => set((state) => ({ isVisible: !state.isVisible })),
    setFallbackMode: (mode) => set({ fallbackMode: mode }),
    setGazeTarget: (target) => set({ gazeTarget: target }),
}));
