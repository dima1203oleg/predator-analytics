import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Globe, ShieldAlert, FileText, Network, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi';

export const OsintCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('white');
  const { data: sourcesData } = useAdminApi<any>('/api/v2/admin/osint/sources', 5000);
  const { data: quarantineData } = useAdminApi<any>('/api/v2/admin/osint/quarantine', 5000);
  const { data: policiesData } = useAdminApi<any>('/api/v2/admin/osint/policies', 10000);

  const whiteSources = sourcesData?.white || [];
  const darkSources = sourcesData?.dark || [];
  const quarantine = Array.isArray(quarantineData) ? quarantineData : (quarantineData?.items || []);
  const policies = policiesData || [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">OSINT Центр</h1>
        <p className="admin-page-desc">Управління розподіленим збором даних, ризик-гейтами та політиками.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--a-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'white', label: 'White OSINT (Публічний)' },
          { id: 'dark', label: 'Risk / Dark OSINT' },
          { id: 'policy', label: 'Політики (Policy Engine)' },
          { id: 'flow', label: 'Граф Потоку Даних' }
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

      {activeTab === 'white' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="admin-card-title">Авторизовані Джерела</h3>
            <Button variant="cyber" className="admin-btn admin-btn-primary">Підключити Джерело</Button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Назва Джерела</th>
                <th>Статус</th>
                <th>Здоров'я</th>
                <th>API Квота</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {whiteSources.map((src: any) => (
                <tr key={src.id}>
                  <td style={{ fontWeight: 500 }}>{src.name}</td>
                  <td>
                    <span className={`admin-badge ${src.status === 'active' ? 'admin-badge-green' : 'admin-badge-orange'}`}>
                      {src.status}
                    </span>
                  </td>
                  <td>{src.health}</td>
                  <td style={{ fontFamily: 'monospace' }}>{src.quota}</td>
                  <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Налаштувати</Button></td>
                </tr>
              ))}
              {whiteSources.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--a-text-muted)' }}>Завантаження джерел...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'dark' && (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="admin-card">
            <h3 className="admin-card-title">Джерела з Обмеженнями</h3>
            <table className="admin-table" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Джерело</th>
                  <th>Risk Score</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {darkSources.map((src: any) => (
                  <tr key={src.id}>
                    <td>{src.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--a-border)', borderRadius: '2px' }}>
                          <div style={{ width: `${src.risk_score}%`, height: '100%', background: src.risk_score > 90 ? 'var(--a-red)' : 'var(--a-orange)', borderRadius: '2px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: src.risk_score > 90 ? 'var(--a-red)' : 'var(--a-orange)' }}>{src.risk_score}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${src.status === 'blocked' ? 'admin-badge-red' : ''}`}>{src.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Черга Карантину</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Дані, заблоковані агентом Risk Gateway.
            </p>
            <div className="admin-list">
              {quarantine.map((q: any) => (
                <div key={q.id} className="admin-list-item" style={{ borderLeft: '3px solid var(--a-red)' }}>
                  <ShieldAlert size={16} color="var(--a-red)" />
                  <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                    <div style={{ fontWeight: 500, color: 'var(--a-text)' }}>{q.reason}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--a-text-sec)' }}>{q.source} | {q.id}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--a-text-muted)' }}>
                    {q.timestamp ? (q.timestamp.includes(' ') ? q.timestamp.split(' ')[1] : q.timestamp) : (q.created_at ? (q.created_at.includes('T') ? q.created_at.split('T')[1].substring(0, 5) : q.created_at) : '')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policy' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Політики Доступу Доменів</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Налаштуйте, які домени можуть використовувати певні типи OSINT-даних.
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Домен</th>
                <th>Дозволені Типи Даних</th>
                <th>Строгий Режим</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{p.domain}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {p.allowed_sources.map((src: string, i: number) => (
                        <span key={i} className="admin-badge" style={{ fontSize: '0.7rem' }}>{src}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {p.strict_mode ? <CheckCircle size={16} color="var(--a-green)" /> : <XCircle size={16} color="var(--a-text-muted)" />}
                  </td>
                  <td><Button variant="cyber" className="admin-btn admin-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>Редагувати</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'flow' && (
        <div className="admin-card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="admin-card-title">Живий Потік Даних (CSS Граф)</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--a-text-sec)', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Моніторинг подієвої (event-driven) архітектури.
          </p>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '900px', justifyContent: 'space-between', alignItems: 'center' }}>
              
              {/* Sources Layer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: 'var(--a-bg)', textAlign: 'center' }}>
                  <Globe size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--a-blue)' }} />
                  <div>White OSINT</div>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: 'var(--a-bg)', textAlign: 'center' }}>
                  <ShieldAlert size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--a-red)' }} />
                  <div>Dark OSINT</div>
                </div>
              </div>

              {/* Arrows */}
              <div style={{ flex: 1, height: '2px', background: 'var(--a-border)', position: 'relative', margin: '0 1rem' }}>
                <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--a-text-sec)' }}>Збір (Fetch)</div>
              </div>

              {/* Event Bus Layer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem 2rem', border: '1px solid var(--a-border)', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                  <Network size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--a-text)' }} />
                  <div style={{ fontWeight: 600 }}>Redpanda (Шина Подій)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--a-text-sec)', marginTop: '0.5rem' }}>osint.white.fetched<br/>osint.dark.quarantined</div>
                </div>
              </div>

              {/* Arrows */}
              <div style={{ flex: 1, height: '2px', background: 'var(--a-border)', position: 'relative', margin: '0 1rem' }}>
                <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--a-text-sec)' }}>Обробка (Consume)</div>
              </div>

              {/* Workers & Storage */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--a-green)', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.1)', textAlign: 'center' }}>
                  <FileText size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--a-green)' }} />
                  <div>ETL Worker</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--a-green)', marginTop: '0.25rem' }}>→ PostgreSQL</div>
                </div>
                <div style={{ padding: '1rem', border: '1px solid var(--a-orange)', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.1)', textAlign: 'center' }}>
                  <AlertTriangle size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--a-orange)' }} />
                  <div>Risk Analyzer</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--a-orange)', marginTop: '0.25rem' }}>→ Quarantine</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
