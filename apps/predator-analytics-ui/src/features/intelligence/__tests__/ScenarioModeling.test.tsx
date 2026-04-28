import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ScenarioModeling from '../ScenarioModeling';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return new Proxy(actual, {
        get: (target, prop) => {
            if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
                return (props: any) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
            }
            return target[prop];
        }
    });
});

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

vi.mock('@/components/ECharts', () => ({ default: () => <div data-testid="echarts-scenario" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, actions, badges }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="stats-list">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    )
}));

vi.mock('@/services/api/config', () => ({
    apiClient: {
        post: vi.fn(() => Promise.resolve({
            data: {
                forecast: Array.from({ length: 12 }, (_, i) => ({ forecast: 150 + i * 5 }))
            }
        }))
    }
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('ScenarioModeling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс моделювання сценаріїв', () => {
        render(<ScenarioModeling />);
        
        expect(screen.getByText(/МОДЕЛЮВАННЯ СЦЕНА� ІЇВ/i)).toBeInTheDocument();
        expect(screen.getByText(/Параметри Сценарію/i)).toBeInTheDocument();
        expect(screen.getByTestId('echarts-scenario')).toBeInTheDocument();
    });

    it('виконує симуляцію та ініціює SCENARIO_SUCCESS', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<ScenarioModeling />);
        
        const runButton = screen.getByText('Запустити');
        fireEvent.click(runButton);
        
        expect(screen.getByText(/� озрахунок.../i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'SCENARIO_SUCCESS'
                    })
                })
            );
        }, { timeout: 5000 });
    });

    it('змінює параметри сценарію (мито на імпорт)', () => {
        render(<ScenarioModeling />);
        
        const dutyLabel = screen.getByText(/Мито на імпорт/i);
        expect(dutyLabel).toBeInTheDocument();
        
        const slider = screen.getAllByRole('slider')[0];
        fireEvent.change(slider, { target: { value: '25' } });
        
        expect(screen.getByText('25 %')).toBeInTheDocument();
    });

    it('відображає MIRROR_SIMULATION в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        render(<ScenarioModeling />);
        
        expect(screen.getByText(/MIRROR_SIMULATION/i)).toBeInTheDocument();
    });

    it('відображає розрахунок Монте-Карло при симуляції', async () => {
        render(<ScenarioModeling />);
        
        const runButton = screen.getByText('Запустити');
        fireEvent.click(runButton);
        
        expect(screen.getByText(/Запуск Монте-Карло.../i)).toBeInTheDocument();
    });
});
