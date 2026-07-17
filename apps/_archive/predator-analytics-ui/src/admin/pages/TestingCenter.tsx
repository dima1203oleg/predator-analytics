import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Play, Activity, Server, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const TestingCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Операції та Валідація</h1>
        <p className="admin-page-desc">Комплексна перевірка підсистем, E2E-тести та діагностика.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'health', label: 'Health Check & Map' },
          { id: 'e2e', label: 'E2E Тести' },
          { id: 'load', label: 'Навантаження (Load Test)' },
          { id: 'logs', label: 'Центр Логування' },
          { id: 'reports', label: 'Звіти' }
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

      {activeTab === 'health' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="admin-card" style={{ gridColumn: 'span 2' }}>
            <h3 className="admin-card-title">Інтерактивна карта стану</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {[
                { name: 'Backend API', status: 'ok' },
                { name: 'Frontend', status: 'ok' },
                { name: 'PostgreSQL', status: 'ok' },
                { name: 'ClickHouse', status: 'warn' },
                { name: 'Neo4j', status: 'ok' },
                { name: 'Qdrant', status: 'ok' },
                { name: 'OpenSearch', status: 'ok' },
                { name: 'Redis', status: 'ok' },
                { name: 'Redpanda', status: 'error' },
              ].map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--a-border)', borderRadius: '6px' }}>
                  {s.status === 'ok' && <CheckCircle size={16} color="var(--a-green)" />}
                  {s.status === 'warn' && <AlertTriangle size={16} color="var(--a-orange)" />}
                  {s.status === 'error' && <XCircle size={16} color="var(--a-red)" />}
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">Самодіагностика</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--a-text-sec)', marginTop: '0.5rem' }}>
              Виявлено проблему з підключенням до Redpanda кластера. 
            </p>
            <Button variant="cyber" className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }}>Авто-відновлення</Button>
          </div>
        </div>
      )}

      {activeTab === 'e2e' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Автоматичні E2E-сценарії</h3>
            <div className="admin-list" style={{ marginTop: '1rem' }}>
              {[
                'Авторизація', 'Імпорт Excel', 'ETL', 'Генерація ембедингів', 'RAG-пошук', 'AI-чат', 'Графові зв’язки'
              ].map(test => (
                <div key={test} className="admin-list-item">
                  <div style={{ flex: 1, fontWeight: 500, color: 'var(--a-text)' }}>{test}</div>
                  <Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}><Play size={14} /></Button>
                </div>
              ))}
            </div>
            <Button variant="cyber" className="admin-btn admin-btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Запустити всі E2E тести</Button>
          </div>
        </div>
      )}

      {activeTab === 'load' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Навантажувальне тестування</h3>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            {['10', '100', '1 000', '10 000', '100 000'].map(users => (
              <Button variant="cyber" key={users} className="admin-btn admin-btn-outline">
                {users} Користувачів
              </Button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="admin-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="admin-card-title">Центр логування (Unified Console)</h3>
          <div style={{ flex: 1, background: '#111', color: '#0f0', fontFamily: 'monospace', padding: '1rem', borderRadius: '6px', marginTop: '1rem', overflowY: 'auto', fontSize: '0.8125rem' }}>
            <div>[INFO] [Backend] Starting API Server on :8080...</div>
            <div>[INFO] [ETL] Task #9213 completed.</div>
            <div style={{ color: 'var(--a-red)' }}>[ERROR] [Redpanda] Connection timeout. Retry 1/5.</div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Звіти та аудит</h3>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <Button variant="cyber" className="admin-btn admin-btn-outline"><FileText size={16} style={{ marginRight: '0.5rem' }} /> Завантажити PDF</Button>
            <Button variant="cyber" className="admin-btn admin-btn-outline"><FileText size={16} style={{ marginRight: '0.5rem' }} /> Завантажити HTML</Button>
            <Button variant="cyber" className="admin-btn admin-btn-outline"><FileText size={16} style={{ marginRight: '0.5rem' }} /> Завантажити JSON</Button>
          </div>
        </div>
      )}
    </div>
  );
};
