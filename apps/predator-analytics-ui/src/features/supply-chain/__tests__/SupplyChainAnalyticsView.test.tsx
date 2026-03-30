import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupplyChainAnalyticsView from '../SupplyChainAnalyticsView';

const { get } = vi.hoisted(() => ({
    get: vi.fn(),
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

vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />,
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title }: { children: React.ReactNode; title?: string }) => (
        <div data-testid="tactical-card">
            {title ? <div>{title}</div> : null}
            {children}
        </div>
    ),
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, subtitle, stats, actions }: { title: React.ReactNode; subtitle?: React.ReactNode; stats?: Array<{ label: string; value: string }>; actions?: React.ReactNode }) => (
        <div data-testid="view-header">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
            {stats?.map((stat) => (
                <div key={stat.label}>
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                </div>
            ))}
            {actions}
        </div>
    ),
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
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
        get,
    },
}));

const statsPayload = {
    globalStats: [
        { label: 'ТОВАРИ В РУСІ', value: '18 ОБʼЄКТІВ', sub: '6 кораблів, 8 фур, 4 поїзди', icon: 'Package', color: 'text-cyan-400' },
        { label: 'РИЗИК ЛАНЦЮГА', value: 'HIGH', sub: '4 критичні аномалії', icon: 'ShieldAlert', color: 'text-rose-400' },
        { label: 'ЕКОНОМІЯ AI', value: '$120K', sub: 'Оцінка оптимізації', icon: 'DollarSign', color: 'text-emerald-400' },
    ],
    generated_at: '2026-03-30T10:00:00Z',
};

const trackingPayload = {
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
        {
            id: 'evt-2',
            timestamp: '2026-03-30T08:00:00Z',
            location: 'Львівська митниця',
            status: 'На митниці',
            description: 'Партія очікує огляд.',
            risk_score: 55,
            country: 'Польща',
            value_usd: 89000,
        },
    ],
};

const routesPayload = {
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
        {
            id: 'route-2',
            origin: 'Румунія',
            destination: 'Україна',
            via: 'Порт Чорноморськ',
            risk_score: 35,
            total_value_usd: 210000,
            transit_time_days: 8,
            cost_per_kg: 0.95,
            reliability: 88,
            ai_recommendation: 'Зберегти коридор',
        },
    ],
};

describe('SupplyChainAnalyticsView', () => {
    beforeEach(() => {
        get.mockReset();
        get.mockImplementation((url: string) => {
            if (url === '/supply-chain/stats') {
                return Promise.resolve({ data: statsPayload });
            }

            if (url === '/supply-chain/tracking') {
                return Promise.resolve({ data: trackingPayload });
            }

            if (url === '/supply-chain/routes') {
                return Promise.resolve({ data: routesPayload });
            }

            return Promise.reject(new Error(`Unexpected url: ${url}`));
        });
    });

    it('рендерить підтверджені KPI, події та джерела', async () => {
        render(<SupplyChainAnalyticsView />);

        expect(await screen.findByText(/ЛАНЦЮГИ ПОСТАЧАННЯ/i)).toBeInTheDocument();
        expect(screen.getByText('Джерела: /supply-chain/stats, /supply-chain/tracking, /supply-chain/routes')).toBeInTheDocument();
        expect(screen.getByText('ТОВАРИ В РУСІ')).toBeInTheDocument();
        expect((await screen.findAllByText('Порт Одеса')).length).toBeGreaterThan(0);
        expect(screen.getByText(/Туреччина → Україна/i)).toBeInTheDocument();
    });

    it('відкриває деталізацію події без synthetic timeline', async () => {
        render(<SupplyChainAnalyticsView />);

        await screen.findByText(/Операційне зведення/i);
        fireEvent.click(screen.getByRole('button', { name: /Ланцюг відстеження/i }));

        expect(await screen.findByText(/Картка події/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Контейнер прибув до терміналу\./i).length).toBeGreaterThan(0);
        expect(
            screen.getAllByText((_, element) =>
                element?.tagName === 'DIV' && element.textContent?.replace(/\s/g, '') === '$120000',
            ).length,
        ).toBeGreaterThan(0);
    });

    it('показує часткову відмову і не підставляє defaultStats', async () => {
        get.mockImplementation((url: string) => {
            if (url === '/supply-chain/stats') {
                return Promise.reject(new Error('stats offline'));
            }

            if (url === '/supply-chain/tracking') {
                return Promise.resolve({ data: { tracking_id: 'TRK-200', generated_at: '2026-03-30T10:10:00Z', events: [] } });
            }

            if (url === '/supply-chain/routes') {
                return Promise.resolve({ data: { generated_at: '2026-03-30T10:12:00Z', routes: [] } });
            }

            return Promise.reject(new Error(`Unexpected url: ${url}`));
        });

        render(<SupplyChainAnalyticsView />);

        expect(await screen.findByText(/Частина маршрутів тимчасово недоступна/i)).toBeInTheDocument();
        expect(screen.getByText(/Підтверджені KPI відсутні/i)).toBeInTheDocument();
        expect(screen.queryByText(/23 ОБ'ЄКТИ/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/\$240K/i)).not.toBeInTheDocument();
    });
});
