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
  return (
    <div className="cognitive-panel">
      <div className="cognitive-panel-header">АКТИВНІ ПРОЦЕСИ МИСЛЕННЯ ШІ</div>
      <div style={{ fontSize: '11px' }}>
        Генерація | Тест | Супервізій <span style={{ color: 'var(--neon-cyan)' }}>Real-Time</span>
      </div>
      <div style={{ marginTop: '12px' }}>
        <div style={{ width: '100%', height: '4px', background: '#111', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '67%', height: '100%', background: 'var(--neon-cyan)', boxShadow: '0 0 5px var(--neon-cyan)' }}></div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-primary)' }}>▶ Сканування графу...</div>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>▶ Аналіз офшорних зв'язків...</div>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>▶ Виявлення бенефіціарів...</div>
      </div>
    </div>
  );
};

// --- ЦЕНТРАЛЬНА ПАНЕЛЬ ---
export const ChatAssistant = () => {
  return (
    <div className="cognitive-panel">
      <div className="cognitive-panel-header">CHAT & AI-ASSISTANT</div>
      <div className="cognitive-chat-message cognitive-chat-user">
        👤 Покажи зв'язки мого контрагента "X" з сумами транзакцій
      </div>
      <div className="cognitive-chat-message">
        🤖 Аналіз завершено, Виявлено 4 ключові зв'язки.<br/>
        Деталі: 2 активні судові справи; 1 зв'язок з бенефіціаром (раніше: блогер); 1 ідентифікований конкурент.
      </div>
      <button className="cognitive-glow-button" style={{ marginTop: '12px' }}>Повторити?</button>
      
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
        <input 
          type="text" 
          placeholder="Enter detailed query... (0/500)" 
          style={{ 
            width: '100%', background: '#111', border: '1px solid var(--neon-cyan)', 
            color: 'var(--neon-cyan)', padding: '8px', fontFamily: 'monospace' 
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
