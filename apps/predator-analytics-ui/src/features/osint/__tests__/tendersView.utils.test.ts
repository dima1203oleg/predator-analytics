import { describe, expect, it } from 'vitest';
import { normalizeTenderAnalytics, normalizeTendersPayload } from '../tendersView.utils';

describe('tendersView.utils', () => {
    it('повертає порожній список для невалідного набору тендерів', () => {
        expect(normalizeTendersPayload(null)).toEqual([]);
        expect(normalizeTendersPayload({ items: [{}] })).toEqual([]);
    });

    it('нормалізує тендери з полем procuring_entity', () => {
        const payload = {
            items: [
                {
                    id: 'UA-2026-03-30-000001-a',
                    title: 'Закупівля серверного обладнання',
                    value: '1200000',
                    currency: 'UAH',
                    status: 'active',
                    procuring_entity: 'ДП "Інфоцентр"',
                    date: '2026-03-30',
                    risk_score: '82',
                    bids_count: 1,
                },
            ],
        };

        expect(normalizeTendersPayload(payload)).toEqual([
            {
                id: 'UA-2026-03-30-000001-a',
                title: 'Закупівля серверного обладнання',
                value: 1200000,
                currency: 'UAH',
                status: 'active',
                procuringEntity: 'ДП "Інфоцентр"',
                date: '2026-03-30',
                risk_score: 82,
                bids_count: 1,
            },
        ]);
    });

    it('не створює аналітику з неповного payload', () => {
        expect(normalizeTenderAnalytics({ analytics: { total_value: 1000 } })).toBeNull();
    });

    it('нормалізує валідну аналітику без синтетичних значень', () => {
        const payload = {
            analytics: {
                total_value: 15000000,
                avg_risk: '67',
                critical_tenders: 3,
                categories: [
                    { name: 'ІТ', value: '9000000', color: '#00ffaa' },
                ],
                trends: [
                    { date: '30.03', value: '15000000' },
                ],
            },
        };

        expect(normalizeTenderAnalytics(payload)).toEqual({
            total_value: 15000000,
            avg_risk: 67,
            critical_tenders: 3,
            categories: [
                { name: 'ІТ', value: 9000000, color: '#00ffaa' },
            ],
            trends: [
                { date: '30.03', value: 15000000 },
            ],
        });
    });
});
