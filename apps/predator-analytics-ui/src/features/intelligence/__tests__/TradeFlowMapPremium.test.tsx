import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TradeFlowMapPremium from '../TradeFlowMapPremium';
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
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('TradeFlowMapPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає карту та заголовок', async () => {
        render(<TradeFlowMapPremium />);
        
        expect(screen.getByText(/КАРТА/i)).toBeInTheDocument();
        expect(screen.getByText(/ПОТОКІВ/i)).toBeInTheDocument();
        expect(screen.getByText(/UA/i)).toBeInTheDocument(); // Code on map
        expect(screen.getByText(/АКТИВНІ_ПОТОКИ/i)).toBeInTheDocument();
    });

    it('дозволяє зумувати карту', async () => {
        render(<TradeFlowMapPremium />);
        
        const zoomInBtn = screen.getByTestId('icon-zoomin').parentElement!;
        fireEvent.click(zoomInBtn);
        
        expect(screen.getByText(/x1.2/i)).toBeInTheDocument();
    });

    it('вибирає країну при кліку', async () => {
        render(<TradeFlowMapPremium />);
        
        const countryNode = screen.getByText(/CN/i);
        fireEvent.click(countryNode);

        await waitFor(() => {
            expect(screen.getByText(/Китай/i)).toBeInTheDocument();
            expect(screen.getByText(/ІМПОРТ_З_КРАЇНИ/i)).toBeInTheDocument();
        });
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<TradeFlowMapPremium />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'GeoIntel',
                        code: 'GEOSPATIAL_NODES'
                    })
                })
            );
        });
    });

    it('ініціює predator-error при успішному оновленні в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<TradeFlowMapPremium />);

        const refreshBtn = screen.getByTestId('icon-refreshcw').parentElement!;
        
        await act(async () => {
            fireEvent.click(refreshBtn);
        });

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        message: expect.stringContaining('Геопросторова синхронізація через MIRROR_CHANNEL завершена успішно')
                    })
                })
            );
        }, { timeout: 2000 });
    });
});
