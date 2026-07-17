/* ─────────────────────────────────────────────────────────
 * 🎨 AvatarProvider — Context wrapper for avatar subsystem
 * Availability check, error boundary, useAvatar() hook.
 * ───────────────────────────────────────────────────────── */
import React, { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { useAvatarStore } from '../../stores/avatarStore';
import { AvatarFSM } from './AvatarFSM';
import type { AvatarState } from '../../types/avatar';

interface AvatarContextValue {
    fsm: AvatarFSM;
    isAvailable: boolean;
    transition: (to: AvatarState) => boolean;
    reset: () => void;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const fsmRef = useRef(new AvatarFSM());
    const transitionTo = useAvatarStore(s => s.transitionTo);
    const setAvailable = useAvatarStore(s => s.setAvailable);

    useEffect(() => {
        const fsm = fsmRef.current;

        // Підключаємо FSM до Zustand store
        fsm.onTransition((_from, to) => {
            transitionTo(to);
        });

        // Перевірка доступності WebGL
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
            if (gl) {
                setAvailable(true);
            } else {
                setAvailable(false);
            }
        } catch {
            setAvailable(false);
        }

        return () => {
            fsm.destroy();
        };
    }, [transitionTo, setAvailable]);

    const value = useMemo<AvatarContextValue>(() => ({
        fsm: fsmRef.current,
        isAvailable: true,
        transition: (to) => fsmRef.current.transition(to),
        reset: () => fsmRef.current.reset(),
    }), []);

    return (
        <AvatarContext.Provider value={value}>
            {children}
        </AvatarContext.Provider>
    );
};

/** Hook для доступу до Avatar FSM */
export function useAvatar(): AvatarContextValue {
    const ctx = useContext(AvatarContext);
    if (!ctx) {
        throw new Error('[useAvatar] Має бути використаний всередині <AvatarProvider>');
    }
    return ctx;
}
