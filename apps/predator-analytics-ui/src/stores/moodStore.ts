import { create } from 'zustand';

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

interface MoodState {
    globalThreatLevel: ThreatLevel;
    ambientColor: string; // Used for glitch effects or atmosphere
    setThreatLevel: (level: ThreatLevel) => void;
}

const getAtmosphereColor = (level: ThreatLevel) => {
    switch(level) {
        case 'critical': return '#ef4444'; // Red
        case 'high': return '#f59e0b'; // Amber
        case 'medium': return '#3b82f6'; // Blue
        case 'low': 
        default: return '#10b981'; // Emerald
    }
};

export const useMoodStore = create<MoodState>((set) => ({
    globalThreatLevel: 'low',
    ambientColor: getAtmosphereColor('low'),
    setThreatLevel: (level) => set({ 
        globalThreatLevel: level,
        ambientColor: getAtmosphereColor(level)
    })
}));
