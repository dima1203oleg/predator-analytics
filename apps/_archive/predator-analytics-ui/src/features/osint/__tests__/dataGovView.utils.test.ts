import { describe, expect, it } from 'vitest';
import { formatResourceSize, normalizeDataGovSearchPayload } from '../dataGovView.utils';

describe('dataGovView.utils', () => {
    it('нормалізує пошуковий payload data.gov.ua', () => {
        const payload = {
            count: 2,
            results: [
                {
                    id: 'ds-customs',
                    title: 'Реєстр митних декларацій',
                    description: 'Опис набору',
                    organization: 'Державна митна служба України',
                    modified: '2026-03-30',
                    tags: ['митниця', 'декларації'],
                    records_count: 145,
                    resources: [
                        {
                            id: 'r-1',
                            name: 'declarations.csv',
                            format: 'CSV',
                            size: '128 KB',
                            url: 'https://example.test/declarations.csv',
                        },
                    ],
                },
            ],
        };

        expect(normalizeDataGovSearchPayload(payload)).toEqual({
            datasets: [
                {
                    id: 'ds-customs',
                    title: 'Реєстр митних декларацій',
                    notes: 'Опис набору',
                    organizationTitle: 'Державна митна служба України',
                    metadataModified: '2026-03-30',
                    tags: ['митниця', 'декларації'],
                    recordsCount: 145,
                    resources: [
                        {
                            id: 'r-1',
                            name: 'declarations.csv',
                            format: 'CSV',
                            url: 'https://example.test/declarations.csv',
                            lastModified: 'Н/д',
                            sizeLabel: '128 KB',
                        },
                    ],
                },
            ],
            totalCount: 2,
        });
    });

    it('форматує числовий розмір ресурсу в мегабайти', () => {
        expect(formatResourceSize(1024 * 1024)).toBe('1.00 MB');
    });

    it('повертає Н/д для невідомого розміру', () => {
        expect(formatResourceSize('—')).toBe('Н/д');
        expect(formatResourceSize(null)).toBe('Н/д');
    });
});
