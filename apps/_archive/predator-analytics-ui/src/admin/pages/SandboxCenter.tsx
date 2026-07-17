import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Box, Play, Trash2, Copy, Database, Network, RotateCcw } from 'lucide-react';

export const SandboxCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('replay');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Симуляції та Пісочниця (Sandbox)</h1>
        <p className="admin-page-desc">Ізольовані середовища для тестування ETL пайплайнів, тіньового розгортання та генерації синтетичних даних.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'replay', label: 'Симуляція ETL (Replay)' },
          { id: 'shadow', label: 'Тіньовий Режим (Shadow Mode)' },
          { id: 'synthetic', label: 'Генератор Синтетичних Даних' },
          { id: 'environments', label: 'Ізольовані Середовища' }
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

      {activeTab === 'replay' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Повторний Запуск ETL (Data Replay)</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary"><Play size={14} style={{ marginRight: '0.5rem' }}/> Запустити Replay</Button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Завдання</th>
                <th>Вихідний Топік</th>
                <th>Цільова Колекція</th>
                <th>Пропускна Здатність</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'monospace' }}>REP-1029</td>
                <td>predator.raw.customs</td>
                <td>clickhouse.analytics</td>
                <td>45,000 msg/s</td>
                <td><span className="admin-badge admin-badge-blue">Виконується</span></td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'monospace' }}>REP-1028</td>
                <td>predator.raw.social</td>
                <td>neo4j.graph</td>
                <td>12,000 msg/s</td>
                <td><span className="admin-badge admin-badge-green">Завершено</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'shadow' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Розгортання у Тіньовому Режимі</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem' }}>
            Запуск нових пайплайнів або моделей паралельно з продакшеном без впливу на реальні результати.
          </p>
          <table className="admin-table" style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Тіньовий Екземпляр</th>
                <th>Базовий Продакшен</th>
                <th>Відсоток Розбіжностей</th>
                <th>Статус</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>fraud_detect_v3 (Experimental)</td>
                <td>fraud_detect_v2 (Active)</td>
                <td style={{ color: 'var(--a-orange)' }}>2.4%</td>
                <td><span className="admin-badge">Моніторинг</span></td>
                <td><Button variant="cyber" className="admin-btn admin-btn-outline">Аналіз Розбіжностей</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'synthetic' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Генерація Тестових Даних</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ justifyContent: 'flex-start' }}>
                <Database size={16} style={{ marginRight: '0.5rem' }} /> Згенерувати Реляційні Дані (PostgreSQL)
              </Button>
              <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ justifyContent: 'flex-start' }}>
                <Network size={16} style={{ marginRight: '0.5rem' }} /> Згенерувати Графові Структури (Neo4j)
              </Button>
              <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ justifyContent: 'flex-start' }}>
                <Box size={16} style={{ marginRight: '0.5rem' }} /> Згенерувати Векторні Ембедінги (Qdrant)
              </Button>
            </div>
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">Об'єм Даних</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="admin-label">Кількість Записів для Генерації</label>
                <input type="range" min="1000" max="1000000" defaultValue="50000" style={{ width: '100%' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)', textAlign: 'right' }}>50,000 records</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" defaultChecked /> Включити Аномалії (5%)
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'environments' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Середовища Пісочниці</h3>
          <div className="admin-list" style={{ marginTop: '1rem' }}>
            {['sandbox-alpha (Analytics)', 'sandbox-beta (OSINT)', 'staging-preprod'].map(env => (
              <div key={env} className="admin-list-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--a-text)' }}>{env}</div>
                </div>
                <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                  <RotateCcw size={14} style={{ marginRight: '0.25rem' }} /> Скинути
                </Button>
                <Button variant="cyber" className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
