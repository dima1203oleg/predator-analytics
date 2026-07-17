import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CustomsIntelligencePremium from '../CustomsIntelligencePremium';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => {
    const motionProxy = new Proxy(
        {},
        {
            get: (_target, prop) => {
                return ({ children, ...props }: any) => {
                    const Tag = typeof prop === 'string' ? prop : 'div';
                    return <Tag {...props}>{children}</Tag>;
                };
            },
        }
    );
    return {
        motion: motionProxy,
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

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

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, actions }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
            <div data-testid="view-actions">{actions}</div>
        </div>
    )
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        activeFailover: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('CustomsIntelligencePremium', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок преміум модуля та KPI блоки', async () => {
        render(<CustomsIntelligencePremium />);
        
        expect(screen.getByText(/МИТНИЙ/i)).toBeInTheDocument();
        expect(screen.getByText(/PROJECT/i)).toBeInTheDocument();
        expect(screen.getByText(/ ИНКОВА_ЧАСТКА_СУБ'ЄКТА/i)).toBeInTheDocument();
        expect(screen.getByText(/42.8%/i)).toBeInTheDocument();
    });

    it('відображає список топ імпортерів', async () => {
        render(<CustomsIntelligencePremium />);
        
        expect(screen.getByText(/ТОВ "МЕТАЛ-Т ЕЙД ОПТ"/i)).toBeInTheDocument();
        expect(screen.getByText(/П АТ "ЕНЕ ГО-СИСТЕМИ"/i)).toBeInTheDocument();
        expect(screen.getByText(/12%/i)).toBeInTheDocument();
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                activeFailover: false,
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CustomsIntelligencePremium />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'CustomsPremium',
                        code: 'COMMERCIAL_NODES'
                    })
                })
            );
        });
    });

    it('ініціює predator-error при натисканні оновлення в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                activeFailover: false,
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CustomsIntelligencePremium />);

        // Refresh icon has data-testid icon-refreshcw based on mock
        const refreshBtn = screen.getByTestId('icon-refreshcw').parentElement!;
        
        await act(async () => {
            fireEvent.click(refreshBtn);
        });

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        message: expect.stringContaining('Примусове оновлення преміум-даних через MIRROR_CHANNEL завершено')
                    })
                })
            );
        }, { timeout: 2000 });
    });
});
