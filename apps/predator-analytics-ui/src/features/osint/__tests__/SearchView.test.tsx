import { describe, it, expect } from 'vitest';
import {
    normalizeCompany,
    getRadarMetrics,
    buildDecisionSummary,
    formatDateTime,
} from '../searchView.utils';

describe('searchView.utils', () => {
    it('нормалізує результат пошуку без синтетичних підстановок', () => {
        const company = normalizeCompany(
            {
                id: '123',
                title: 'ТОВ "ТЕСТ"',
                score: 0.91,
                metadata: {
                    edrpou: '12345678',
                    status: 'active',
                    risk_level: 'watchlist',
                    director: 'Іванов І.І.',
                    address: 'Київ, вул. Тестова, 1',
                    capital: '1 000 000 грн',
                    type: 'ТОВ',
                    source: 'ЄД� ПОУ',
                    beneficiaries: ['Петренко П.П.'],
                    connections_count: 4,
                },
            },
            0,
        );

        expect(company.identifier).toBe('12345678');
        expect(company.name).toBe('ТОВ "ТЕСТ"');
        expect(company.risk).toBe('medium');
        expect(company.riskLabel).toBe('Під наглядом');
        expect(company.matchScore).toBe(91);
        expect(company.beneficiaries).toEqual(['Петренко П.П.']);
        expect(company.tags).toContain('ЄД� ПОУ');
    });

    it('залишає порожні поля порожніми, а не підміняє вигаданими значеннями', () => {
        const company = normalizeCompany(
            {
                id: 'x-1',
                title: 'Сутність без деталей',
            },
            1,
        );

        expect(company.director).toBeUndefined();
        expect(company.address).toBeUndefined();
        expect(company.capital).toBeUndefined();
        expect(company.beneficiaries).toEqual([]);
        expect(company.completenessScore).toBeLessThan(100);
    });

    it('будує радар тільки з фактичних числових полів картки', () => {
        const company = normalizeCompany(
            {
                id: '321',
                title: 'ТОВ "� ИЗИК"',
                metadata: {
                    edrpou: '87654321',
                    status: 'bankrupt',
                    risk_level: 'critical',
                    capital: '5000000',
                    connections_count: 9,
                },
            },
            0,
        );

        const radar = getRadarMetrics(company);

        expect(radar.risk).toBeGreaterThan(90);
        expect(radar.connections).toBe(90);
        expect(radar.capital).toBeGreaterThan(0);
        expect(radar.reputation).toBe(20);
    });

    it('формує коректний текст рішення залежно від ризику', () => {
        const highRisk = normalizeCompany(
            { id: '1', title: '� изик', metadata: { edrpou: '100', risk_level: 'high' } },
            0,
        );
        const lowRisk = normalizeCompany(
            { id: '2', title: 'Стабільно', metadata: { edrpou: '200', risk_level: 'stable' } },
            0,
        );

        expect(buildDecisionSummary(highRisk)).toMatch(/поглибленої перевірки/i);
        expect(buildDecisionSummary(lowRisk)).toMatch(/не виявлено критичних ознак/i);
    });

    it('форматує службову дату для українського інтерфейсу', () => {
        expect(formatDateTime('2026-03-30T10:15:00Z')).toMatch(/30\.03\.2026/i);
        expect(formatDateTime(undefined)).toBeNull();
    });
});
