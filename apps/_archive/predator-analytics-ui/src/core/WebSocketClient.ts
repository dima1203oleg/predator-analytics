import { usePredatorStore } from '../stores/usePredatorStore';
import { useMoodStore } from '../stores/useMoodStore';
import { useUIStore } from '../stores/useUIStore';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  public connect(url?: string) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    const wsUrl = url || import.meta.env.VITE_WS_URL || 'ws://194.177.1.240:6666/ws/realtime';
    console.log('Connecting to WS:', wsUrl);
    
    useUIStore.getState().setConnectionStatus('connecting');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to Predator Realtime API');
        useUIStore.getState().setConnectionStatus('connected');
        useUIStore.getState().addNotification('Connected to Realtime Gateway');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.warn('Disconnected from Realtime API. Reconnecting in 5s...');
        useUIStore.getState().setConnectionStatus('disconnected');
        this.reconnectTimeout = setTimeout(() => this.connect(url), 5000);
      };
      
      this.ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
      };
    } catch (err) {
      console.error('Error creating WebSocket instance:', err);
      useUIStore.getState().setConnectionStatus('disconnected');
      this.reconnectTimeout = setTimeout(() => this.connect(url), 5000);
    }
  }

  private handleEvent(data: any) {
    const { event, payload } = data;

    switch (event) {
      case 'risk.updated':
        if (payload.entity_id && payload.risk_score !== undefined) {
          usePredatorStore.getState().updateNodeRisk(payload.entity_id, payload.risk_score);
          if (payload.risk_score > 0.8) {
            useUIStore.getState().addNotification(`Critical risk spike on node ${payload.entity_id}`);
          }
        }
        break;
        
      case 'system.state.changed':
        if (payload.weather) {
          useMoodStore.getState().setWeather(payload.weather);
          useUIStore.getState().addNotification(`System State Changed: ${payload.weather}`);
        }
        break;
        
      default:
        console.log('Unhandled event type:', event);
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    useUIStore.getState().setConnectionStatus('disconnected');
  }
}

export const wsClient = new WebSocketClient();
