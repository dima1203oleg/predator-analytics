import { describe, expect, it } from 'vitest';
import {
    getLatestSupplyChainTimestamp,
    normalizeSupplyChainRoutesPayload,
    normalizeSupplyChainStatsPayload,
    normalizeSupplyChainTrackingPayload,
} from '../supplyChainAnalytics.utils';

describe('supplyChainAnalytics.utils', () => {
    it('нормалізує картки статистики', () => {
        const result = normalizeSupplyChainStatsPayload({
            generated_at: '2026-03-30T10:00:00Z',
            globalStats: [
                { label: 'ТОВА� И В � УСІ', value: '18 ОБʼЄКТІВ', sub: '6 кораблів', icon: 'Package', color: 'text-cyan-400' },
            ],
        });

        expect(result.generatedAt).toBe('2026-03-30T10:00:00.000Z');
        expect(result.items).toEqual([
            {
                label: 'ТОВА� И В � УСІ',
                value: '18 ОБʼЄКТІВ',
                sub: '6 кораблів',
                iconKey: 'Package',
                color: 'text-cyan-400',
            },
        ]);
    });

    it('нормалізує трекінг і маршрути', () => {
        const tracking = normalizeSupplyChainTrackingPayload({
            tracking_id: 'TRK-100',
            current_status: 'На митниці',
            estimated_arrival: '2026-04-02T12:00:00Z',
            generated_at: '2026-03-30T10:05:00Z',
            events: [
                {
                    id: 'evt-1',
                    timestamp: '2026-03-30T09:00:00Z',
                    location: 'Порт Одеса',
                    status: 'В порту',
                    description: 'Контейнер прибув до терміналу.',
                    risk_score: 82,
                    country: 'Україна',
                    value_usd: 120000,
                },
            ],
        });
        const routes = normalizeSupplyChainRoutesPayload({
            generated_at: '2026-03-30T10:07:00Z',
            routes: [
                {
                    id: 'route-1',
                    origin: 'Туреччина',
                    destination: 'Україна',
                    via: 'Порт Одеса',
                    risk_score: 61,
                    total_value_usd: 450000,
                    transit_time_days: 12,
                    cost_per_kg: 1.35,
                    reliability: 78,
                    ai_recommendation: 'Оптимальний',
                },
            ],
        });

        expect(tracking.events[0]?.riskScore).toBe(82);
        expect(routes.routes[0]?.reliability).toBe(78);
        expect(routes.routes[0]?.recommendation).toBe('Оптимальний');
    });

    it('обчислює останній timestamp серед доступних джерел', () => {
        expect(
            getLatestSupplyChainTimestamp(
                '2026-03-30T10:00:00Z',
                null,
                '2026-03-30T11:30:00Z',
            ),
        ).toBe('2026-03-30T11:30:00.000Z');
    });
});
