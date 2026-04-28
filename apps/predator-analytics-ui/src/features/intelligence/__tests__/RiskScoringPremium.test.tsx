import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import RiskScoringPremium from '../RiskScoringPremium';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
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
        nodeSource: 'NVIDIA_PRIMARY',
        healingProgress: 0
    })
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, badges }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="stats-list">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
        </div>
    )
}));

vi.mock('@/components/risk/Cers5LayerGauge', () => ({ Cers5LayerGauge: () => <div data-testid="cers-gauge" /> }));
vi.mock('@/components/intelligence/SovereignReportWidget', () => ({ SovereignReportWidget: () => <div data-testid="sovereign-report" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));

vi.mock('@/features/diligence', () => ({
    diligenceApi: {
        searchCompanies: vi.fn(() => Promise.resolve({
            items: [
                {
                    id: '123',
                    name: 'ТЕСТ_РИЗИК_1',
                    edrpou: '11111111',
                    risk_score: 0.95,
                    sanctions: ['BLOCK'],
                    owners: [{}, {}]
                }
            ]
        }))
    }
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('RiskScoringPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс моніторингуризиків та завантажує суб\'єктів', async () => {
        render(<RiskScoringPremium />);
        
        expect(screen.getByText(/РИЗИК/i)).toBeInTheDocument();
        expect(screen.getByText(/МОНІТОРИНГ/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('ТЕСТ_РИЗИК_1')).toBeInTheDocument();
        });
    });

    it('ініціює RISK_ENGINE_SUCCESS при завантаженні даних', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<RiskScoringPremium />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'RISK_ENGINE_SUCCESS'
                    })
                })
            );
        });
    });

    it('розгортає бічну панель деталізації суб\'єкта при кліку', async () => {
        render(<RiskScoringPremium />);
        
        await waitFor(() => {
            const entityRow = screen.getByText('ТЕСТ_РИЗИК_1');
            fireEvent.click(entityRow);
        });
        
        expect(screen.getByText(/CERS 5-ША ОВА МОДЕЛЬ РИЗИКУ/i)).toBeInTheDocument();
        expect(screen.getByTestId('cers-gauge')).toBeInTheDocument();
        expect(screen.getByTestId('sovereign-report')).toBeInTheDocument();
    });

    it('виконує пошук суб\'єктів', async () => {
        render(<RiskScoringPremium />);
        
        await waitFor(() => {
            expect(screen.getByText('ТЕСТ_РИЗИК_1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/ПОШУК СУБ'ЄКТА ЗА НАЗВОЮ/i);
        fireEvent.change(searchInput, { target: { value: '99999999' } });
        
        expect(screen.queryByText('ТЕСТ_РИЗИК_1')).not.toBeInTheDocument();
    });

    it('відображає MIRROR_SCAN в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 15
            })
        }));

        render(<RiskScoringPremium />);
        
        expect(screen.getByText(/MIRROR_SCAN/i)).toBeInTheDocument();
    });
});
