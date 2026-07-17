import { create } from 'zustand';

interface AdminState {
    systemHealth: 'optimal' | 'degraded' | 'critical';
    activeUsers: number;
    setSystemHealth: (health: 'optimal' | 'degraded' | 'critical') => void;
}

export const useAdminStore = create<AdminState>((set) => ({
    systemHealth: 'optimal',
    activeUsers: 0,
    setSystemHealth: (health) => set({ systemHealth: health })
}));
