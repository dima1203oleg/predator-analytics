import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Network, Activity, AlertTriangle, Inbox } from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi';

export const DataRoutingMatrix: React.FC = () => {
  const [activeTab, setActiveTab] = useState('topology');
  const { data: dataops, isLoading } = useAdminApi<any>('/api/v2/admin/dataops', 5000);
  
  const topics = dataops?.kafkaTopics || [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Матриця Маршрутизації Даних</h1>
        <p className="admin-page-desc">Моніторинг пайплайнів, пропускної здатності топіків та Dead Letter Queues (DLQ).</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'topology', label: 'Топологія Пайплайнів' },
          { id: 'topics', label: 'Топіки Redpanda' },
          { id: 'dlq', label: 'Dead Letter Queue (DLQ)' }
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

      {activeTab === 'topology' && (
        <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Жива Топологія Пайплайнів</h3>
            <div style={{ marginTop: '1rem', padding: '2rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: '#0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: 'var(--a-bg)' }}>Джерела (API, Скрапери)</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--a-green)' }}>↑ Очікування</div>
              </div>
              <div style={{ flex: 1, height: '2px', background: 'var(--a-border)', margin: '0 1rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--a-text-sec)' }}>Redpanda</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--a-blue)', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)' }}>ETL та AI Парсери</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--a-text-sec)' }}>~ Затримка</div>
              </div>
              <div style={{ flex: 1, height: '2px', background: 'var(--a-border)', margin: '0 1rem' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: 'var(--a-bg)' }}>Сховища (8 Баз)</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--a-green)' }}>↓ Очікування</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Топіки Redpanda</h3>
            <Button variant="cyber" className="admin-btn admin-btn-outline">Оновити Дані</Button>
          </div>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-muted)' }}>Завантаження даних...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Назва Топіка</th>
                  <th>Партиції</th>
                  <th>Пропускна здатність</th>
                  <th>Споживачі</th>
                  <th>Відставання (Lag)</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t: any) => (
                  <tr key={t.name}>
                    <td style={{ fontWeight: 500, fontFamily: 'monospace' }}>{t.name}</td>
                    <td>{t.partitions}</td>
                    <td>{t.throughput}</td>
                    <td>{t.consumers}</td>
                    <td>{t.lag}</td>
                    <td>
                      <span className={`admin-badge ${t.status === 'ok' ? 'admin-badge-green' : t.status === 'offline' ? 'admin-badge-red' : 'admin-badge-orange'}`}>
                        {t.status === 'ok' ? 'В нормі' : t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {topics.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: 'var(--a-text-muted)' }}>Топіки не знайдено.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'dlq' && (
        <DLQTab />
      )}
    </div>
  );
};

const DLQTab: React.FC = () => {
  const { data: dlqData, isLoading } = useAdminApi<any[]>('/api/v2/admin/dlq/default', 10000);
  const items = dlqData || [];

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Dead Letter Queue (DLQ)</h3>
      <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Повідомлення, які не пройшли парсинг, валідацію або збереження.
      </p>
      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-muted)' }}>Завантаження даних...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Час</th>
              <th>Вихідний Топік</th>
              <th>Причина Помилки</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{new Date(item.timestamp).toLocaleString('uk-UA')}</td>
                <td style={{ fontFamily: 'monospace' }}>{item.topic}</td>
                <td style={{ color: 'var(--a-red)' }}>{item.payload?.error || 'Невідома помилка'}</td>
                <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Деталі</Button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: 'var(--a-text-muted)' }}>DLQ порожня. Усі повідомлення оброблено.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
