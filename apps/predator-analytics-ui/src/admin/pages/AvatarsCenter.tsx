import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Bot, Terminal, Activity, ShieldAlert, Key, Play, Square, Pause } from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi';

export const AvatarsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fleet');
  const { data: agentsData, isLoading } = useAdminApi<any>('/api/v2/admin/agents', 5000);

  const agents = agentsData?.list || [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Центр Керування Аватарами</h1>
        <p className="admin-page-desc">Оркестрація та моніторинг автономних AI-агентів (аватарів) у всіх доменах.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'fleet', label: 'Флот Агентів' },
          { id: 'queue', label: 'Черга Завдань та Логи' },
          { id: 'quotas', label: 'API Квоти та Ключі' }
        ].map(tab => (
          <Button variant="cyber"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--a-text)' : 'var(--a-text-sec)',
              borderBottom: activeTab === tab.id ? '2px solid var(--a-text)' : '2px solid transparent'
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'fleet' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Активні Агенти ({agents.length})</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">Розгорнути Нового Агента</Button>
          </div>
          
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-muted)' }}>Завантаження агентів...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ідентифікатор Агента</th>
                  <th>Доменна Роль</th>
                  <th>Статус</th>
                  <th>Поточне Завдання</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent: any) => (
                  <tr key={agent.id}>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{agent.name}</td>
                    <td><span className="admin-badge">{agent.role}</span></td>
                    <td>
                      <span className={`admin-badge ${agent.is_busy ? 'admin-badge-blue' : agent.is_alive ? 'admin-badge-green' : 'admin-badge-red'}`}>
                        {agent.is_busy ? 'Виконується' : agent.is_alive ? 'Очікування' : 'Офлайн'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--a-text-sec)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.current_task || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <Button variant="cyber" className="admin-btn admin-btn-outline" title="Призупинити" style={{ padding: '0.25rem 0.5rem' }}><Pause size={14} /></Button>
                        <Button variant="cyber" className="admin-btn admin-btn-danger" title="Зупинити" style={{ padding: '0.25rem 0.5rem' }}><Square size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--a-text-muted)' }}>Немає розгорнутих агентів у флоті.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Логи Виконання та Черга Завдань</h3>
            <div style={{ background: '#000', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--a-green)', marginTop: '1rem', height: '300px', overflowY: 'auto', border: '1px solid var(--a-border)' }}>
              <div>[10:42:01] [OSINT_ALPHA] Отримання розвідувального звіту DarkNet ID: 9021...</div>
              <div>[10:42:05] [OSINT_ALPHA] Звіт отримано. Видобування сутностей...</div>
              <div>[10:42:08] [BANKING_GUARDIAN] Виявлено аномальний патерн транзакцій у вузлі EU-West. Додавання в чергу на аналіз.</div>
              <div>[10:42:15] [OSINT_ALPHA] Сутності видобуто. Запис у Neo4j Graph.</div>
              <div>[10:42:18] [BANKING_GUARDIAN] Аналіз завершено. 12 транзакцій позначено для ручної перевірки.</div>
              <div style={{ color: 'var(--a-text-muted)', marginTop: '1rem' }}>_</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quotas' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Квоти Провайдерів</h3>
            <table className="admin-table" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Провайдер</th>
                  <th>Використання (Місяць)</th>
                  <th>Ліміт</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>OpenAI (GPT-4)</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                        <div style={{ width: '45%', height: '100%', background: 'var(--a-blue)', borderRadius: '2px' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>$4,500</span>
                    </div>
                  </td>
                  <td>$10,000</td>
                </tr>
                <tr>
                  <td>Anthropic (Claude-3)</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                        <div style={{ width: '80%', height: '100%', background: 'var(--a-orange)', borderRadius: '2px' }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem' }}>$1,600</span>
                    </div>
                  </td>
                  <td>$2,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">Управління API Ключами</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--a-text-sec)', marginTop: '0.5rem' }}>Забезпечте ротацію ключів кожні 30 днів для максимальної безпеки.</p>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid var(--a-border)', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Основний Ключ OpenAI</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>sk-proj-****...****8x</div>
                </div>
                <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ fontSize: '0.75rem' }}>Ротація</Button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid var(--a-border)', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>Резервний Ключ Anthropic</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>sk-ant-****...****9a</div>
                </div>
                <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ fontSize: '0.75rem' }}>Ротація</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
