import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EvolutionView from '../EvolutionView';
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
    ViewHeader: ({ title, stats, badges }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="stats-list">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
        </div>
    )
}));

vi.mock('@/components/CyberOrb', () => ({ CyberOrb: () => <div data-testid="cyber-orb" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));

// Mock leaf components
vi.mock('@/components/super/EvolutionDashboard', () => ({ default: () => <div data-testid="evolution-dashboard" /> }));
vi.mock('@/components/super/TruthLedgerTerminal', () => ({ default: () => <div data-testid="truth-ledger" /> }));
vi.mock('@/components/super/EvolutionForge', () => ({ default: () => <div data-testid="evolution-forge" /> }));
vi.mock('@/components/super/AZRImprovementTrace', () => ({ AZRImprovementTrace: () => <div data-testid="azr-trace" /> }));
vi.mock('@/components/super/AZRDeploymentCenter', () => ({ AZRDeploymentCenter: () => <div data-testid="azr-deployment" /> }));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('EvolutionView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс двигуна еволюції та огляд мутацій', () => {
        render(<EvolutionView />);
        
        expect(screen.getByText(/ДВИГУН/i)).toBeInTheDocument();
        expect(screen.getByText(/ЕВОЛЮЦІЇ/i)).toBeInTheDocument();
        expect(screen.getByTestId('evolution-dashboard')).toBeInTheDocument();
    });

    it('ініціює EVOLUTION_SUCCESS при запуску двигуна', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<EvolutionView />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'EVOLUTION_SUCCESS'
                    })
                })
            );
        });
    });

    it('ініціює EVOLUTION_SUCCESS після ручного оновлення (синтезу)', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<EvolutionView />);
        
        const refreshBtn = screen.getByTestId('icon-refreshcw').parentElement;
        fireEvent.click(refreshBtn!);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'EVOLUTION_SUCCESS',
                        message: expect.stringContaining('Глобальний синтез AZR успішно завершено')
                    })
                })
            );
        }, { timeout: 2000 });
    });

    it('перемикає вкладки матриці (Trace, Deployment, Ledger)', () => {
        render(<EvolutionView />);
        
        // Ledger tab
        const ledgerTab = screen.getByText(/РЕЄСТР/i);
        fireEvent.click(ledgerTab);
        expect(screen.getByTestId('truth-ledger')).toBeInTheDocument();

        // Trace tab
        const traceTab = screen.getByText(/ШЛЯХ/i);
        fireEvent.click(traceTab);
        expect(screen.getByTestId('azr-trace')).toBeInTheDocument();

        // Deployment tab
        const deployTab = screen.getByText(/ДЕПЛОЙ/i);
        fireEvent.click(deployTab);
        expect(screen.getByTestId('azr-deployment')).toBeInTheDocument();
    });

    it('відображає MIRROR_MUTATION в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        render(<EvolutionView />);
        
        expect(screen.getByText(/MIRROR_MUTATION/i)).toBeInTheDocument();
    });
});
