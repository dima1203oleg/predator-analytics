/* ─────────────────────────────────────────────────────────
 * 🏥 System Health — статус сервісів, latency, error tracking
 * Auto-refresh кожні 10 секунд.
 * ───────────────────────────────────────────────────────── */
import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useCallback } from 'react';
import { ServiceRow } from '../components/ServiceRow';
import type { ServiceInfo } from '../../types/data';

import { api } from '../../services/api';

export const SystemHealth: React.FC = () => {
    const [services, setServices] = useState<ServiceInfo[]>([]);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const refresh = useCallback(async () => {
        try {
            const healthRes = await api.getLiveHealth();
            if (healthRes && Array.isArray(healthRes.services)) {
                setServices(healthRes.services);
            } else {
                setServices([]);
            }
            setLastRefresh(new Date());
        } catch (err) {
            console.error("Failed to refresh system health from backend", err);
            setServices([]);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 10_000);
        return () => clearInterval(interval);
    }, [refresh]);

    const operational = services.filter(s => s.status === 'operational').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const down = services.filter(s => s.status === 'down').length;

    return (
        <div className="admin-content flex flex-col gap-6">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Стан Системи</h1>
                    <p className="admin-page-desc">
                        Статус мікросервісів PREDATOR · Оновлено: {lastRefresh.toLocaleTimeString('uk-UA')}
                    </p>
                </div>
                <Button variant="cyber"
                    onClick={refresh}
                    className="admin-btn admin-btn-secondary"
                >
                    Оновити зараз
                </Button>
            </div>

            {/* Підсумок */}
            <div style={{ display: 'flex', gap: '1rem' }}>
                <span className="admin-badge operational">
                    <span className="admin-badge-dot" />
                    {operational} operational
                </span>
                <span className="admin-badge degraded">
                    <span className="admin-badge-dot" />
                    {degraded} degraded
                </span>
                <span className="admin-badge down">
                    <span className="admin-badge-dot" />
                    {down} down
                </span>
            </div>

            {/* Список сервісів */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <h2 className="admin-card-title">Системні Сервіси</h2>
                </div>
                <div>
                    {services.map(svc => (
                        <ServiceRow key={svc.name} service={svc} />
                    ))}
                    {services.length === 0 && (
                        <div className="admin-table-empty">
                            Немає даних про сервіси
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
