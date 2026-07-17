import { describe, expect, it } from 'vitest';
import { normalizePortsPayload, normalizeVesselsPayload } from '../maritimeView.utils';

describe('maritimeView.utils', () => {
    it('повертає порожні масиви для невалідних payload', () => {
        expect(normalizeVesselsPayload(null)).toEqual([]);
        expect(normalizePortsPayload({ items: [{}] })).toEqual([]);
    });

    it('нормалізує масив суден із payload.items', () => {
        const payload = {
            items: [
                {
                    id: 'v-1',
                    name: 'OCEAN_TITAN',
                    flag: 'PANAMA',
                    type: 'Container Ship',
                    location: { lat: 46.48, lon: 30.72 },
                    status: 'at_anchor',
                    destination: 'Odesa Port',
                    risk_score: '12',
                    imo: '9234567',
                    mmsi: '235078000',
                    speed: '0.1',
                    last_seen: '2 хв тому',
                },
            ],
        };

        expect(normalizeVesselsPayload(payload)).toEqual([
            {
                id: 'v-1',
                name: 'OCEAN_TITAN',
                flag: 'PANAMA',
                type: 'Container Ship',
                location: { lat: 46.48, lon: 30.72 },
                status: 'at_anchor',
                destination: 'Odesa Port',
                risk_score: 12,
                imo: '9234567',
                mmsi: '235078000',
                speed: 0.1,
                last_seen: '2 хв тому',
            },
        ]);
    });

    it('нормалізує порти з payload.ports', () => {
        const payload = {
            ports: [
                {
                    id: 'p-1',
                    name: 'Одеський Морський Порт',
                    country: 'Ukraine',
                    location: { lat: 46.48, lon: 30.72 },
                    vessel_count: '42',
                    capacity: '85',
                    risk_level: 'LOW',
                    status: 'operational',
                },
            ],
        };

        expect(normalizePortsPayload(payload)).toEqual([
            {
                id: 'p-1',
                name: 'Одеський Морський Порт',
                country: 'Ukraine',
                location: { lat: 46.48, lon: 30.72 },
                vessel_count: 42,
                capacity: 85,
                risk_level: 'LOW',
                status: 'operational',
            },
        ]);
    });
});
