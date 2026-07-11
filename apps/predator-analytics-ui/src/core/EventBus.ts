import mitt from 'mitt';
import { CognitiveWeather } from '../types/index';
import { CameraMode } from '../stores/useUIStore';

type Events = {
  'camera:flyTo': { x: number; y: number; z: number; targetX?: number; targetY?: number; targetZ?: number };
  'insight:explode': void;
  'spark:create': { count: number; origin: [number, number, number] };
  
  // New UI Events
  'SET_WEATHER': CognitiveWeather;
  'SELECT_NODE': string | null;
  'SET_CAMERA_MODE': CameraMode;
  'SET_RISK_THRESHOLD': number;
};

export const eventBus = mitt<Events>();
