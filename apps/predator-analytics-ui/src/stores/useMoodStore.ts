import { create } from 'zustand';
import { CognitiveWeather } from '../types/index';

interface MoodState {
  weather: CognitiveWeather;
  setWeather: (weather: CognitiveWeather) => void;
}

export const useMoodStore = create<MoodState>((set) => ({
  weather: 'calm',
  setWeather: (weather) => set({ weather }),
}));
