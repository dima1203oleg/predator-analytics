/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Voice Input Controller
 *
 * Використовує Web Speech API (SpeechRecognition) для голосового керування.
 * Мова: uk-UA. Інтегровано зі станом аватара та графу.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useCommandStore } from '../store/useCommandStore';
import { audioFeedback } from './AudioFeedback';

class VoiceInputController {
  private recognition: any = null;
  private isListening = false;
  private ws: WebSocket | null = null;

  public init() {
    this.connectWebSocket();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API не підтримується у цьому браузері.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'uk-UA';

    this.recognition.onstart = () => {
      this.isListening = true;
      audioFeedback.playSelect();
      useCommandStore.getState().setCognitiveState('LISTENING');
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      this.handleCommand(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      useCommandStore.getState().setCognitiveState('DORMANT');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      useCommandStore.getState().setCognitiveState('DORMANT');
    };

    window.addEventListener('keydown', (e) => {
      if ((e.key === 'v' || e.key === 'м') && !e.repeat && !e.ctrlKey && !e.metaKey) {
        this.toggleListening();
      }
    });
  }

  private connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}/api/v1/avatar/stream`);
    
    this.ws.onopen = () => console.log('[Avatar] WebSocket connected');
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const store = useCommandStore.getState();
        
        if (data.type === 'status') {
          if (data.message === 'processing_llm') {
             store.setCognitiveState('THINKING');
          } else if (data.message === 'idle') {
             store.setCognitiveState('DORMANT');
          }
        } else if (data.type === 'token') {
          // LLM is talking back
          store.setCognitiveState('THINKING');
          store.setCognitiveState('PROCESSING');
        } else {
          store.setCognitiveState('LISTENING');
        }
      } catch (e) {
         console.error('[Avatar] WS parse error', e);
      }
    };
    
    this.ws.onclose = () => {
      // Silence spammy disconnect log when backend is down
      setTimeout(() => this.connectWebSocket(), 10000);
    };
  }

  public toggleListening() {
    if (!this.recognition) return;
    
    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (e) {
        console.error(e);
      }
    }
  }

  private handleCommand(transcript: string) {
    const store = useCommandStore.getState();
    store.setCognitiveState('PROCESSING');
    
    // Надсилаємо команду до реального бекенду (LLM)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text: transcript }));
    } else {
      console.warn('[Avatar] WebSocket is not open. Falling back to local heuristic.');
    }
    
    // Залишаємо базову евристику для зміни камери та фокусу локально,
    // поки LLM сервер не почав повноцінно керувати станом камери
    if (transcript.includes('загроз')) {
      const match = transcript.match(/\d/);
      if (match) {
        const level = parseInt(match[0]);
        if (level >= 1 && level <= 5) {
          store.setThreatLevel(level as import('../store/useCommandStore').ThreatLevel);
          store.setCognitiveState('WARNING' as any); // Or just PROCESSING
        }
      }
    } else if (transcript.includes('огляд') || transcript.includes('граф')) {
      store.setCameraMode('OVERVIEW');
      store.setFocusedNode(null);
      store.setCognitiveState('DORMANT');
    } else if (transcript.includes('скинути') || transcript.includes('норма')) {
      store.setThreatLevel(1);
      store.setFocusedNode(null);
      store.setCameraMode('PRESENTATION');
      store.setCognitiveState('DORMANT');
    }

    setTimeout(() => {
      if (store.cognitiveState === 'PROCESSING') {
        store.setCognitiveState('DORMANT');
      }
    }, 1500);
  }
}

export const voiceInputController = new VoiceInputController();
