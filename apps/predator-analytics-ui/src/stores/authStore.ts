import { create } from 'zustand';

interface AuthState {
    isAuthenticated: boolean;
    userRole: 'admin' | 'analyst' | 'operator' | 'viewer' | null;
    userName: string | null;
    login: (role: 'admin' | 'analyst' | 'operator' | 'viewer', name: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    userRole: null,
    userName: null,
    login: (role, name) => set({ isAuthenticated: true, userRole: role, userName: name }),
    logout: () => set({ isAuthenticated: false, userRole: null, userName: null })
}));
