import { describe, expect, it } from 'vitest';
import { normalizeSanctionsScreeningPayload } from '../sanctionsScreening.utils';

describe('normalizeSanctionsScreeningPayload', () => {
    it('нормалізує підтверджену відповідь скринінгу', () => {
        const result = normalizeSanctionsScreeningPayload({
            id: 'scr-10',
            entityName: 'ГАЗП ОМ',
            entityType: 'company',
            status: 'blocked',
            timestamp: '2026-03-30T12:00:00Z',
            searchId: 'AX-1001',
            riskScore: 99,
            listsChecked: ['OFAC', 'EU'],
            matches: [
                {
                    id: 'match-1',
                    list: 'OFAC',
                    program: 'Санкційна програма',
                    target: 'ГАЗП ОМ',
                    details: 'Підсанкційний субʼєкт.',
                    severity: 'high',
                    score: 99,
                    allLists: ['OFAC', 'EU'],
                },
            ],
        });

        expect(result).not.toBeNull();
        expect(result?.entityName).toBe('ГАЗП ОМ');
        expect(result?.status).toBe('blocked');
        expect(result?.matches[0]?.allLists).toEqual(['OFAC', 'EU']);
    });

    it('підставляє безпечні значення, якщо частина полів відсутня', () => {
        const result = normalizeSanctionsScreeningPayload({
            query: 'ТЕСТ',
            matches: [{ target: 'ТЕСТ', score: 12 }],
        }, 'person');

        expect(result).not.toBeNull();
        expect(result?.entityType).toBe('person');
        expect(result?.status).toBe('warning');
        expect(result?.searchId).toBe('Н/д');
    });

    it('повертає null для невалідного payload без сутності', () => {
        expect(normalizeSanctionsScreeningPayload({ matches: [] })).toBeNull();
        expect(normalizeSanctionsScreeningPayload(null)).toBeNull();
    });
});
