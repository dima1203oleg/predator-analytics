import { create } from 'zustand';

// Когнітивні типи подій для платформи v70.0
export type SystemEventType = 
  | 'WS_CONNECTED' 
  | 'WS_DISCONNECTED' 
  | 'AI_THOUGHT_LOG'
  | 'AI_TOOL_CALL'
  | 'AI_RESPONSE_START'
  | 'AI_RESPONSE_END'
  | 'AVATAR_VISEME'
  | 'AVATAR_EXPRESSION'
  | 'VOICE_RECORDING_START'
  | 'VOICE_RECORDING_STOP'
  | 'ETL_PROGRESS'
  | 'DOM_ERROR'
  | 'METRIC_UPDATE';

export interface SystemEvent {
  id: string;
  type: SystemEventType;
  payload?: any;
  timestamp: number;
}

interface EventBusState {
  events: SystemEvent[];
  listeners: Record<SystemEventType, Array<(event: SystemEvent) => void>>;
  
  // Публікація події
  emit: (type: SystemEventType, payload?: any) => void;
  
  // Підписка на подію (повертає функцію відписки)
  subscribe: (type: SystemEventType, callback: (event: SystemEvent) => void) => () => void;
  
  // Очищення історії
  clearEvents: () => void;
}

/**
 * Глобальна шина подій (Cognitive UI Event Bus)
 * Використовується для зв'язку між компонентами, WebSocket клієнтом, 
 * 3D-аватаром та DOM Intelligence Engine.
 */
export const useEventBus = create<EventBusState>((set, get) => ({
  events: [],
  listeners: {} as Record<SystemEventType, Array<(event: SystemEvent) => void>>,
  
  emit: (type, payload) => {
    const event: SystemEvent = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now()
    };
    
    set((state) => {
      // Додаємо подію в історію (ліміт 100 подій для пам'яті)
      const newEvents = [event, ...state.events].slice(0, 100);
      return { events: newEvents };
    });
    
    // Викликаємо слухачів
    const { listeners } = get();
    if (listeners[type]) {
      listeners[type].forEach(callback => {
        try {
          callback(event);
        } catch (err) {
          console.error(`[EventBus] Помилка в слухачі події ${type}:`, err);
        }
      });
    }
  },
  
  subscribe: (type, callback) => {
    set((state) => {
      const currentListeners = state.listeners[type] || [];
      return {
        listeners: {
          ...state.listeners,
          [type]: [...currentListeners, callback]
        }
      };
    });
    
    // Повертаємо функцію відписки
    return () => {
      set((state) => {
        const currentListeners = state.listeners[type] || [];
        return {
          listeners: {
            ...state.listeners,
            [type]: currentListeners.filter(cb => cb !== callback)
          }
        };
      });
    };
  },
  
  clearEvents: () => set({ events: [] })
}));
