import { eventBus } from './EventBus';
import { usePredatorStore } from '../stores/usePredatorStore';
import { useMoodStore } from '../stores/useMoodStore';
import { useUIStore } from '../stores/useUIStore';

export function initListeners() {
  eventBus.on('SET_WEATHER', (weather) => {
    useMoodStore.getState().setWeather(weather);
  });
  
  eventBus.on('SELECT_NODE', (id) => {
    usePredatorStore.getState().selectNode(id);
  });
  
  eventBus.on('SET_CAMERA_MODE', (mode) => {
    useUIStore.getState().setCameraMode(mode);
  });
  
  eventBus.on('SET_RISK_THRESHOLD', (val) => {
    useUIStore.getState().setRiskThreshold(val);
  });
}
