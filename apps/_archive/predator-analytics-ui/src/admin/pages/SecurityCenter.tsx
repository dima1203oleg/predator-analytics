import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { ShieldAlert, Key, Lock, Eye, AlertTriangle, Users, FileText } from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi';

export const SecurityCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('rbac');
  const { data: auditLogs, isLoading: isAuditLoading } = useAdminApi<any[]>('/api/v2/admin/security/audit', 10000);
  const { data: keysData, isLoading: isKeysLoading } = useAdminApi<any[]>('/api/v2/admin/security/keys', 10000);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Центр Безпеки та Політик (Security Center)</h1>
        <p className="admin-page-desc">Управління доступом на основі ролей (RBAC), класифікація даних та аудит безпеки.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'rbac', label: 'Матриця RBAC' },
          { id: 'classification', label: 'Класифікація Даних' },
          { id: 'audit', label: 'Логи Аудиту та Комплаєнс' },
          { id: 'serviceaccounts', label: 'Сервісні Акаунти' }
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

      {activeTab === 'rbac' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Управління Доступом (RBAC)</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">Створити Роль</Button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Назва Ролі</th>
                <th>Користувачів</th>
                <th>Права Доступу</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>CORE_ADMIN</td>
                <td>4</td>
                <td style={{ color: 'var(--a-text-sec)', fontSize: '0.85rem' }}>Повний Доступ до Системи, Управління Безпекою</td>
                <td><span className="admin-badge admin-badge-green">Активно</span></td>
                <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Редагувати</Button></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>DATA_ANALYST_L2</td>
                <td>12</td>
                <td style={{ color: 'var(--a-text-sec)', fontSize: '0.85rem' }}>Читання Даних L1-L2, Перегляд Дашбордів</td>
                <td><span className="admin-badge admin-badge-green">Активно</span></td>
                <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Редагувати</Button></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>OSINT_OPERATOR</td>
                <td>8</td>
                <td style={{ color: 'var(--a-text-sec)', fontSize: '0.85rem' }}>Читання Даних L1-L3, Запуск OSINT Агентів</td>
                <td><span className="admin-badge admin-badge-green">Активно</span></td>
                <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Редагувати</Button></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'classification' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Рівні Класифікації Даних</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Визначення політик для зберігання, шифрування та доступу до даних на основі їх класифікації.
          </p>
          <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { level: 'L1', name: 'Публічні (Public)', desc: 'Відкриті дані, загальна інформація.', color: 'var(--a-green)' },
              { level: 'L2', name: 'Внутрішні (Internal)', desc: 'Внутрішні операційні дані, телеметрія.', color: 'var(--a-blue)' },
              { level: 'L3', name: 'Конфіденційні (Confidential)', desc: 'Персональні дані, фінанси, митні декларації.', color: 'var(--a-orange)' },
              { level: 'L4', name: 'Суворо Секретні (Restricted)', desc: 'Надчутлива розвідка, національна безпека.', color: 'var(--a-red)' }
            ].map(cls => (
              <div key={cls.level} style={{ padding: '1rem', border: `1px solid var(--a-border)`, borderRadius: '6px', borderTop: `3px solid ${cls.color}` }}>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{cls.level} - {cls.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--a-text-sec)', marginTop: '0.5rem' }}>{cls.desc}</div>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>
                  <span>Шифрування: AES-256</span>
                  <span>Доступ: Обмежено</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="admin-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Аномалії Безпеки та Логи Аудиту</h3>
            {isAuditLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-muted)' }}>Завантаження логів...</div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="admin-list" style={{ marginTop: '1rem' }}>
                {auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className="admin-list-item" style={{ borderLeft: `3px solid ${log.severity === 'critical' ? 'var(--a-red)' : 'var(--a-orange)'}` }}>
                    <AlertTriangle size={16} color={log.severity === 'critical' ? 'var(--a-red)' : 'var(--a-orange)'} />
                    <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--a-text)' }}>{log.event}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--a-text-sec)' }}>{log.details}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>{log.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-table-empty">Аномалій не виявлено (чисто).</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'serviceaccounts' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Сервісні Акаунти та API Ключі</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">Згенерувати Новий Ключ</Button>
          </div>
          {isKeysLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-muted)' }}>Завантаження ключів...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Назва Акаунта / Ключ</th>
                  <th>Роль</th>
                  <th>Останнє Використання</th>
                  <th>Статус</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {keysData && keysData.length > 0 ? keysData.map((key: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{key.name}</td>
                    <td>{key.role}</td>
                    <td>{key.lastUsed}</td>
                    <td><span className="admin-badge admin-badge-green">Активно</span></td>
                    <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Відкликати</Button></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--a-text-muted)' }}>Немає активних API ключів.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
