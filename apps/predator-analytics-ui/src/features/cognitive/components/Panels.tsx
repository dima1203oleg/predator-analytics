import React, { useState, useEffect } from 'react';

// --- ЛІВА ПАНЕЛЬ ---
export const VerificationPanel = () => {
  return (
    <div className="cognitive-panel">
      <div className="cognitive-panel-header">ВІКТОРИНІ ПЕРЕВІРКИ ГРАФУ</div>
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        Генерація | Тест | Супервізій <span style={{ color: 'var(--neon-cyan)' }}>Real-Time</span>
      </div>
      <ul style={{ listStyle: 'none', fontSize: '12px', padding: 0 }}>
        <li className="critical-pulse" style={{ marginBottom: '8px' }}>⚠️ ТОВ "ЕНЕРДЖІ ГРУП" — перевірка</li>
        <li style={{ color: 'var(--neon-orange)', marginBottom: '8px' }}>⚠️ Консорцедований зв'язок: 13 офшорів</li>
        <li style={{ color: 'var(--neon-cyan)', marginBottom: '8px' }}>✅ Аналіз завершено: 4 ключові зв'язки</li>
      </ul>
    </div>
  );
};

export const ActiveProcesses = () => {
  const [thoughts, setThoughts] = useState<{id: string, text: string, type: 'thought'|'tool'|'progress'}[]>([
    { id: '1', text: 'Ініціалізація когнітивного ядра...', type: 'progress' }
  ]);

  useEffect(() => {
    import('../../../store/useEventBus').then(({ useEventBus }) => {
      const bus = useEventBus.getState();
      
      const unsub1 = bus.subscribe('AI_THOUGHT_LOG', (e) => {
        setThoughts(prev => [{ id: e.id, text: e.payload.text, type: 'thought' }, ...prev].slice(0, 10));
      });
      const unsub2 = bus.subscribe('AI_TOOL_CALL', (e) => {
        setThoughts(prev => [{ id: e.id, text: `Виклик MCP: ${e.payload.tool}`, type: 'tool' }, ...prev].slice(0, 10));
      });
      const unsub3 = bus.subscribe('ETL_PROGRESS', (e) => {
        setThoughts(prev => [{ id: e.id, text: `Прогрес: ${e.payload.stage}`, type: 'progress' }, ...prev].slice(0, 10));
      });

      return () => {
        unsub1();
        unsub2();
        unsub3();
      };
    });
  }, []);

  return (
    <div className="cognitive-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="cognitive-panel-header">РЕЖИМ МИСЛЕННЯ (SAFE LOG)</div>
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        Генерація | Тест | Супервізій <span style={{ color: 'var(--neon-cyan)' }}>Real-Time</span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {thoughts.map((t) => (
          <div key={t.id} style={{ 
            fontSize: '12px', 
            color: t.type === 'tool' ? 'var(--neon-orange)' : (t.type === 'progress' ? 'var(--neon-cyan)' : 'var(--text-dim)')
          }}>
            {t.type === 'tool' ? '⚙️ ' : (t.type === 'progress' ? '▶ ' : '🧠 ')}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ЦЕНТРАЛЬНА ПАНЕЛЬ ---
export const ChatAssistant = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'user', text: "Системний запит ініціалізовано..." },
    { role: 'ai', text: "Слухаю вказівки. Готовий до аналізу." }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Підключення до локального WebSocket для Голосу / Тексту
    const ws = new WebSocket('ws://localhost:9080');
    ws.onopen = () => console.log('[ChatAssistant] WS connected');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcription') {
          setMessages(prev => [...prev, { role: 'user', text: data.text }]);
        } else if (data.type === 'token') {
          // Імітуємо потік тексту
          setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'ai' && isProcessing) {
              newMsgs[newMsgs.length - 1].text += data.text;
            } else {
              newMsgs.push({ role: 'ai', text: data.text });
              setIsProcessing(true);
            }
            return newMsgs;
          });
          // Відправляємо подію для Avatar (Lip Sync)
          import('../../../store/useEventBus').then(({ useEventBus }) => {
            useEventBus.getState().emit('AVATAR_VISEME', { value: Math.random() * 0.8, speaking: true });
          });
        } else if (data.type === 'status' && data.message === 'idle') {
          setIsProcessing(false);
          import('../../../store/useEventBus').then(({ useEventBus }) => {
            useEventBus.getState().emit('AVATAR_VISEME', { value: 0, speaking: false });
          });
        }
      } catch (e) {}
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [isProcessing]);

  const toggleListen = async () => {
    if (isListening) {
      setIsListening(false);
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(e.data);
          }
        };
        mediaRecorder.start(1000);
        mediaRecorderRef.current = mediaRecorder;
        setIsListening(true);
      } catch (err) {
        console.error('Mic error:', err);
      }
    }
  };

  return (
    <div className="cognitive-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="cognitive-panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>CHAT & AI-ASSISTANT</span>
        <button 
          onClick={toggleListen}
          style={{ 
            background: 'transparent', border: 'none', cursor: 'pointer', 
            color: isListening ? 'var(--neon-pink)' : 'var(--neon-cyan)',
            animation: isListening ? 'pulse 1s infinite' : 'none'
          }}
        >
          {isListening ? '[ЗУПИНИТИ ЗАПИС]' : '[МІКРОФОН]'}
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} className={`cognitive-chat-message ${m.role === 'user' ? 'cognitive-chat-user' : ''}`}>
            {m.role === 'user' ? '👤 ' : '🤖 '}
            {m.text}
          </div>
        ))}
      </div>
      
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
        <input 
          type="text" 
          placeholder="Введіть запит... (Enter для відправки)" 
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
              setMessages(prev => [...prev, { role: 'user', text: e.currentTarget.value }]);
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'text', text: e.currentTarget.value }));
              }
              e.currentTarget.value = '';
            }
          }}
          style={{ 
            width: '100%', background: '#111', border: '1px solid var(--neon-cyan)', 
            color: 'var(--neon-cyan)', padding: '8px', fontFamily: 'monospace', outline: 'none'
          }} 
        />
      </div>
    </div>
  );
};

export const ConsoleCommands = () => {
  const [logs, setLogs] = useState([
    '> $ scan-company "ТОВ ЕНЕРДЖІ ГРУП"',
    '> 🟢 Виявлено 12 зв\'язків',
    '> 🔴 Знайдено офшорний ланцюг'
  ]);

  return (
    <div className="cognitive-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="cognitive-panel-header">КОНСОЛЬ УПРАВЛІННЯ КОМАНДАМИ</div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px' }}>
        <span className="cognitive-glow-button">Генерація</span>
        <span className="cognitive-glow-button">[Голос]</span>
        <span className="cognitive-glow-button">[Сценарій]</span>
        <span style={{ marginLeft: 'auto', color: 'var(--neon-cyan)', alignSelf: 'center' }}>Real-Time</span>
      </div>
      <div className="cognitive-console">
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.includes('🔴') ? 'var(--neon-pink)' : 'var(--text-primary)', marginBottom: '4px' }}>
            {log}
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <span style={{ color: 'var(--neon-cyan)' }}>$</span>
          <input 
            type="text" 
            placeholder="введіть команду..." 
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontFamily: 'monospace', outline: 'none' }} 
          />
        </div>
      </div>
    </div>
  );
};

// --- ПРАВА ПАНЕЛЬ ---
export const RiskMapPanel = () => {
  return (
    <div className="cognitive-panel">
      <div className="cognitive-panel-header">КАРТА РИЗИКІВ САНКЦІЙ РНБО</div>
      {/* Заглушка карти */}
      <div style={{ height: '150px', background: 'linear-gradient(135deg, #001a1a, #000)', border: '1px solid var(--neon-cyan)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5 }}>
          [ ІНТЕРАКТИВНА КАРТА ]
        </div>
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px' }}>
        <div style={{ marginBottom: '4px' }}><span style={{ color: 'var(--neon-pink)' }}>⬤</span> ТОВ "ЕНЕРДЖІ ГРУП" — КРИТИЧНИЙ</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: 'var(--neon-orange)' }}>⬤</span> ПРАЙМ ЕНЕРДЖІ — ВИСОКИЙ</div>
        <div><span style={{ color: 'var(--neon-yellow)' }}>⬤</span> ЮГ НАФТА — СЕРЕДНІЙ</div>
      </div>
    </div>
  );
};

export const PriceAnomalies = () => {
  return (
    <div className="cognitive-panel">
      <div className="cognitive-panel-header">ПРОДУКТИВНИЙ АНАЛІЗ ЦІНОВИХ АНОМАЛІЙ</div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px' }}>
        <span className="cognitive-glow-button">Генерація</span>
        <span className="cognitive-glow-button">[Сценарій]</span>
        <span style={{ marginLeft: 'auto', color: 'var(--neon-cyan)', alignSelf: 'center' }}>Real-Time</span>
      </div>
      
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--neon-cyan)' }}>
            <th style={{ paddingBottom: '4px' }}>Контрагент</th>
            <th style={{ paddingBottom: '4px' }}>Відхилення</th>
            <th style={{ paddingBottom: '4px' }}>Ризик</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ paddingTop: '8px' }}>ТОВ "X"</td>
            <td style={{ color: 'var(--neon-pink)', paddingTop: '8px' }}>+18%</td>
            <td className="critical-pulse" style={{ paddingTop: '8px' }}>КРИТИЧНИЙ</td>
          </tr>
          <tr>
            <td style={{ paddingTop: '4px' }}>ТОВ "Y"</td>
            <td style={{ color: 'var(--neon-orange)', paddingTop: '4px' }}>+9%</td>
            <td style={{ color: 'var(--neon-orange)', paddingTop: '4px' }}>ВИСОКИЙ</td>
          </tr>
        </tbody>
      </table>
      
      <div style={{ marginTop: '16px', borderTop: '1px solid var(--neon-pink)', paddingTop: '12px' }}>
        <div className="cognitive-panel-header" style={{ marginBottom: '8px', border: 'none', padding: 0 }}>КОМПАНІЯ В</div>
        <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Зв'язки: 23 контрагенти</div>
        <div style={{ fontSize: '12px', color: 'var(--neon-pink)' }}>Санкції: РНБО (2024-12-15)</div>
      </div>
    </div>
  );
};
