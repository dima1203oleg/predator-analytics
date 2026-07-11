import React from 'react';
import { useAdminApi } from '../hooks/useAdminApi';
import { Database, Clock, Activity, CheckCircle, AlertTriangle, XCircle, HardDrive } from 'lucide-react';

export const StorageCenter: React.FC = () => {
  const { data: telemetry, isLoading } = useAdminApi<any>('/api/v2/admin/telemetry', 10000);

  const services = telemetry?.services || [];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Моніторинг Сховищ Даних</h1>
        <p className="admin-page-desc">Технічні показники 8 ключових сховищ системи PREDATOR Intelligence OS.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--a-text-muted)' }}>Завантаження стану сховищ...</div>
      ) : (
        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {services.map((svc: any) => {
            let statusColor = 'var(--a-text-muted)';
            let StatusIcon = Activity;
            if (svc.status === 'ok') {
              statusColor = 'var(--a-green)';
              StatusIcon = CheckCircle;
            } else if (svc.status === 'warn' || svc.status === 'degraded') {
              statusColor = 'var(--a-orange)';
              StatusIcon = AlertTriangle;
            } else if (svc.status === 'down') {
              statusColor = 'var(--a-red)';
              StatusIcon = XCircle;
            }

            return (
              <div key={svc.name} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `3px solid ${statusColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HardDrive size={18} color={statusColor} />
                    <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: 0 }}>{svc.name}</h3>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <div style={{ color: 'var(--a-text-sec)' }}>Статус:</div>
                  <div style={{ color: statusColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <StatusIcon size={12} />
                    {svc.status.toUpperCase()}
                  </div>
                  
                  <div style={{ color: 'var(--a-text-sec)' }}>Затримка:</div>
                  <div style={{ color: 'var(--a-text)' }}>{svc.latencyMs} ms</div>
                  
                  <div style={{ color: 'var(--a-text-sec)' }}>Версія:</div>
                  <div style={{ color: 'var(--a-text)' }}>{svc.version}</div>
                  
                  <div style={{ color: 'var(--a-text-sec)' }}>Оновлено:</div>
                  <div style={{ color: 'var(--a-text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} /> {svc.lastCheck}
                  </div>
                </div>
              </div>
            );
          })}
          {services.length === 0 && (
            <div className="admin-card" style={{ gridColumn: 'span 4' }}>
              <div className="admin-table-empty">Немає даних про сховища.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
