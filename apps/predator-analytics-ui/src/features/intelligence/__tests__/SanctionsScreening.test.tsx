import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SanctionsScreening from '../SanctionsScreening';
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
})

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/CyberOrb', () => ({ CyberOrb: () => <div data-testid="cyber-orb" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/services/api/config', () => ({
    apiClient: {
        post: vi.fn(),
    }
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        sourceLabel: 'NVIDIA_PRIMARY',
        statusLabel: 'SYNCHRONIZED'
    })
}));

vi.mock('../sanctionsScreening.utils', () => ({
    normalizeSanctionsScreeningPayload: vi.fn((data, type) => ({
        id: 'test-id',
        searchId: 'SCAN-123',
        timestamp: new Date().toISOString(),
        entityName: data.query || 'Test Entity',
        entityType: type,
        status: data.query === 'BLOCKED' ? 'blocked' : 'clean',
        riskScore: 85,
        matches: data.query === 'BLOCKED' ? [{
            id: 'm1',
            list: 'OFAC',
            program: 'SDN',
            target: 'BLOCKED ENTITY',
            details: 'Extreme risk',
            severity: 'high',
            allLists: ['OFAC', 'EU']
        }] : [],
        listsChecked: ['OFAC', 'EU', 'UN']
    }))
}));

import { apiClient } from '@/services/api/config';

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('SanctionsScreening', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та форму пошуку', async () => {
        render(<SanctionsScreening />);
        
        expect(screen.getByText(/САНКЦІЙНА/i)).toBeInTheDocument();
        expect(screen.getByText(/МАТ� ИЦЯ/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Введіть назву компанії/i)).toBeInTheDocument();
    });

    it('виконує пошук та відображає результат', async () => {
        (apiClient.post as any).mockResolvedValue({ data: { query: 'TEST' } });
        
        render(<SanctionsScreening />);
        
        const input = screen.getByPlaceholderText(/Введіть назву компанії/i);
        fireEvent.change(input, { target: { value: 'TEST ENTITY' } });
        
        const btn = screen.getByText(/EXECUTE_VETTING/i);
        await act(async () => {
            fireEvent.click(btn);
        });

        await waitFor(() => {
            expect(screen.getByText(/TEST ENTITY/i)).toBeInTheDocument();
            expect(screen.getByText(/NULL_RISK_DETECTED/i)).toBeInTheDocument();
        });
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true, sourceLabel: 'MIRROR', statusLabel: 'OFFLINE' })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<SanctionsScreening />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'SanctionsHub',
                        code: 'COMPLIANCE_NODES'
                    })
                })
            );
        });
    });
});
