import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SanctionsScreening from '../SanctionsScreening';

const { post } = vi.hoisted(() => ({
    post: vi.fn(),
}));

vi.mock('framer-motion', () => {
    const React = require('react');

    return {
        motion: {
            div: React.forwardRef(({ children, ...props }: any, ref: any) => <div {...props} ref={ref}>{children}</div>),
            button: React.forwardRef(({ children, ...props }: any, ref: any) => <button {...props} ref={ref}>{children}</button>),
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

vi.mock('lucide-react', () => {
    const React = require('react');
    const icon = (name: string) => (props: any) => <span data-testid={name} {...props} />;

    return {
        AlertCircle: icon('icon-alert-circle'),
        AlertOctagon: icon('icon-alert-octagon'),
        AlertTriangle: icon('icon-alert-triangle'),
        Building2: icon('icon-building-2'),
        Crown: icon('icon-crown'),
        Database: icon('icon-database'),
        History: icon('icon-history'),
        Radio: icon('icon-radio'),
        RefreshCw: icon('icon-refresh'),
        ScanLine: icon('icon-scan-line'),
        Search: icon('icon-search'),
        Shield: icon('icon-shield'),
        ShieldAlert: icon('icon-shield-alert'),
        ShieldCheck: icon('icon-shield-check'),
        User: icon('icon-user'),
        Zap: icon('icon-zap'),
    };
});

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: { children: React.ReactNode }) => <div data-testid="page-transition">{children}</div>,
}));

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />,
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />,
}));

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />,
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title, className }: { children: React.ReactNode; title?: string; className?: string }) => (
        <div data-testid="tactical-card" className={className}>
            {title ? <div>{title}</div> : null}
            {children}
        </div>
    ),
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: { title: React.ReactNode; stats?: Array<{ label: string; value: string }> }) => (
        <div data-testid="view-header">
            <h1>{title}</h1>
            {stats?.map((stat) => (
                <div key={stat.label}>
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                </div>
            ))}
        </div>
    ),
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        isTruthOnly: true,
        modeLabel: 'Режим правдивих даних',
        sourceLabel: 'localhost:9080/api/v1',
        sourceType: 'local',
        statusLabel: 'Зʼєднання активне',
    }),
}));

vi.mock('@/services/api/config', () => ({
    apiClient: {
        post,
    },
}));

describe('SanctionsScreening', () => {
    beforeEach(() => {
        post.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('рендерить базову структуру і правдивий порожній журнал', () => {
        render(<SanctionsScreening />);

        expect(screen.getByText(/САНКЦІЙНА МАТРИЦЯ/i)).toBeInTheDocument();
        expect(screen.getByTestId('advanced-background')).toBeInTheDocument();
        expect(screen.getByText(/Сесійний журнал поки порожній/i)).toBeInTheDocument();
        expect(screen.getByText('Джерело: /sanctions/screen')).toBeInTheDocument();
    });

    it('дозволяє перемикати тип сутності та перелік реєстрів', () => {
        render(<SanctionsScreening />);

        const personButton = screen.getByRole('button', { name: /ОСОБА/i });
        const ofacButton = screen.getByRole('button', { name: /🇺🇸 OFAC/i });

        fireEvent.click(personButton);
        fireEvent.click(ofacButton);

        expect(personButton.className).toContain('bg-rose-500/20');
        expect(ofacButton.className).not.toContain('text-blue-300');
    });

    it('додає до журналу лише підтверджений результат `/sanctions/screen`', async () => {
        post.mockResolvedValue({
            data: {
                id: 'scr-1',
                entityName: 'ГАЗПРОМ',
                entityType: 'company',
                status: 'blocked',
                timestamp: '2026-03-30T12:00:00Z',
                searchId: 'AX-1001',
                riskScore: 99,
                listsChecked: ['OFAC', 'EU', 'РНБО'],
                matches: [
                    {
                        id: 'match-1',
                        list: 'OFAC',
                        program: 'Санкційна програма',
                        target: 'ГАЗПРОМ',
                        details: 'Субʼєкт під міжнародними санкціями.',
                        severity: 'high',
                        score: 99,
                        allLists: ['OFAC', 'EU', 'РНБО'],
                    },
                ],
            },
        });

        render(<SanctionsScreening />);

        fireEvent.change(screen.getByPlaceholderText(/Введіть назву компанії/i), {
            target: { value: 'ГАЗПРОМ' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ПЕРЕВІРИТИ/i }));

        await waitFor(() => {
            expect(post).toHaveBeenCalledWith('/sanctions/screen', {
                query: 'ГАЗПРОМ',
                entity_type: 'company',
                lists: ['OFAC', 'EU', 'UN', 'UK', 'РНБО', 'PEP'],
            });
        });

        expect(await screen.findAllByText('ГАЗПРОМ')).not.toHaveLength(0);
        expect(screen.getByText(/Субʼєкт під міжнародними санкціями\./i)).toBeInTheDocument();
        expect(screen.getByText(/ПЕРЕВІРЕНІ РЕЄСТРИ/i)).toBeInTheDocument();
    });

    it('показує чистий стан без локально вигаданих збігів', async () => {
        post.mockResolvedValue({
            data: {
                id: 'scr-2',
                entityName: 'ТОВ "ЧИСТИЙ ІМПОРТ"',
                entityType: 'company',
                status: 'clean',
                timestamp: '2026-03-30T12:10:00Z',
                searchId: 'AX-1002',
                riskScore: 0,
                listsChecked: ['OFAC', 'EU'],
                matches: [],
            },
        });

        render(<SanctionsScreening />);

        fireEvent.change(screen.getByPlaceholderText(/Введіть назву компанії/i), {
            target: { value: 'ТОВ "ЧИСТИЙ ІМПОРТ"' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ПЕРЕВІРИТИ/i }));

        expect(await screen.findByText(/ЗБІГІВ НЕ ЗНАЙДЕНО/i)).toBeInTheDocument();
        expect(screen.getByText(/Статус —/i)).toHaveTextContent(/ЧИСТО/i);
    });

    it('показує помилку і не повертається до демо-історії при збої API', async () => {
        post.mockRejectedValue(new Error('network error'));

        render(<SanctionsScreening />);

        fireEvent.change(screen.getByPlaceholderText(/Введіть назву компанії/i), {
            target: { value: 'ГАЗПРОМ' },
        });
        fireEvent.click(screen.getByRole('button', { name: /ПЕРЕВІРИТИ/i }));

        expect(
            await screen.findByText(/Не вдалося виконати підтверджений скринінг через `\/sanctions\/screen`/i),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Владімір Путін/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Maritime Nexus Ltd/i)).not.toBeInTheDocument();
    });
});
