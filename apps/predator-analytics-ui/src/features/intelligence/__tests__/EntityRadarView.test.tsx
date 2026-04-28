import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EntityRadarView from '../EntityRadarView';
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

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, badges, actions }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="stats-list">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
            <div data-testid="header-actions">{actions}</div>
        </div>
    )
}));

vi.mock('@/components/ECharts', () => ({ default: () => <div data-testid="echarts-radar" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));

vi.mock('@/services/api/config', () => ({
    apiClient: {
        premium: {
            getCompetitorRadar: vi.fn(() => Promise.resolve([
                {
                    ueid: '123',
                    name: '� АДА� _ТЕСТ_1',
                    edrpou: '11111111',
                    sector: 'Логістика',
                    cers_score: 85,
                    cers_level: 'CRITICAL',
                    trend: 'increasing',
                    confidence: 0.98,
                    last_updated: new Date().toISOString(),
                    risk_factors: ['АНТИТЕ� СТ_СИГНАЛ']
                }
            ]))
        }
    }
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('EntityRadarView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс радару суб\'єктів та завантажує дані', async () => {
        render(<EntityRadarView />);
        
        expect(screen.getByText(/� АДА� /i)).toBeInTheDocument();
        expect(screen.getByText(/СУБ'ЄКТІВ/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('� АДА� _ТЕСТ_1')).toBeInTheDocument();
        });
    });

    it('ініціює RADAR_SUCCESS при старті сканування', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<EntityRadarView />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'RADAR_SUCCESS'
                    })
                })
            );
        });
    });

    it('розгортає тактичну панель суб\'єкта при кліку', async () => {
        render(<EntityRadarView />);
        
        await waitFor(() => {
            const entityRow = screen.getByText('� АДА� _ТЕСТ_1');
            fireEvent.click(entityRow);
        });
        
        expect(screen.getByText(/АКТИВНІ_ПОГ� ОЗИ/i)).toBeInTheDocument();
        expect(screen.getByText(/ВЕ� ДИКТ_PREDATOR_AI/i)).toBeInTheDocument();
        expect(screen.getByTestId('echarts-radar')).toBeInTheDocument();
    });

    it('виконує пошук за назвою або ЄД� ПОУ', async () => {
        render(<EntityRadarView />);
        
        await waitFor(() => {
            expect(screen.getByText('� АДА� _ТЕСТ_1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText(/ПОШУК СЕ� ЕД К� ИТИЧНИХ/i);
        fireEvent.change(searchInput, { target: { value: '99999999' } });
        
        expect(screen.queryByText('� АДА� _ТЕСТ_1')).not.toBeInTheDocument();
        expect(screen.getByText(/ОБ'ЄКТІВ_НЕ_ВИЯВЛЕНО/i)).toBeInTheDocument();
    });

    it('відображає MIRROR_SCAN в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        render(<EntityRadarView />);
        
        expect(screen.getByText(/MIRROR_SCAN/i)).toBeInTheDocument();
    });
});
