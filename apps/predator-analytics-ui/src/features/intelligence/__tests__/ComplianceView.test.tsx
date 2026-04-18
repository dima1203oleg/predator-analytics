import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ComplianceView } from '../ComplianceView';
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

vi.mock('@/services/dataService', () => ({
    security: {
        getAuditLogs: vi.fn(() => Promise.resolve([
            {
                id: 1,
                operator_id: 'analyst_01',
                event_type: 'VIEW_ENTITY',
                target: 'COMPANY_X',
                ip_address: '1.2.3.4',
                status: 'SUCCESS',
                timestamp: '2026-04-12T10:00:00Z'
            }
        ]))
    }
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/components/TacticalCard', () => ({ 
    TacticalCard: ({ children, title }: any) => <div data-testid="tactical-card">{title}{children}</div> 
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('ComplianceView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та журнал аудиту', async () => {
        render(<ComplianceView />);
        
        await waitFor(() => {
            expect(screen.getByText(/ЦЕНТР КОМПЛАЄНСУ/i)).toBeInTheDocument();
            expect(screen.getByText(/analyst_01/i)).toBeInTheDocument();
            expect(screen.getByText(/VIEW_ENTITY/i)).toBeInTheDocument();
        });
    });

    it('відображає статус системи цілісності', async () => {
        render(<ComplianceView />);
        
        expect(screen.getByText(/СИСТЕМА ЗАХИЩЕНА/i)).toBeInTheDocument();
        expect(screen.getByText(/Immutable Logs/i)).toBeInTheDocument();
    });

    it('ініціює predator-error в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<ComplianceView />);

        await waitFor(() => {
            expect(screen.getByText(/OFFLINE_COMPLIANCE/i)).toBeInTheDocument();
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'ComplianceIntel',
                        code: 'COMPLIANCE_NODES'
                    })
                })
            );
        });
    });

    it('ініціює predator-error при успішній синхронізації в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<ComplianceView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        message: expect.stringContaining('Журнал аудиту синхронізовано з локальним дзеркалом')
                    })
                })
            );
        });
    });
});
