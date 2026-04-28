import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UBOMapView from '../UBOMapView';
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

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/services/dataService', () => ({
    intelligence: {
        getUBOMap: vi.fn(),
    }
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'PRIMARY_CORE',
        healingProgress: 100
    })
}));

import { intelligence } from '@/services/dataService';

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('UBOMapView', () => {
    const mockUbo = {
        id: 'root',
        name: 'ТЕСТОВА КОМПАНІЯ',
        type: 'company',
        risk: 50,
        country: '🇺🇦',
        children: [
            { id: 'c1', name: 'Offshore One', type: 'offshore', share: 100, risk: 90, country: '🇻🇬', children: [] }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (intelligence.getUBOMap as any).mockResolvedValue(mockUbo);
    });

    it('відображає завантаження, а потім дерево бенефіціарів', async () => {
        render(<UBOMapView />);
        
        expect(screen.getByText(/Scanning_Beneficiary_Nodes/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText(/ТЕСТОВА КОМПАНІЯ/i)).toBeInTheDocument();
        });
        
        expect(screen.getByText(/Offshore One/i)).toBeInTheDocument();
    });

    it('перемикає вкладки (UBO_STRUCTURE -> PEP_INTEL)', async () => {
        await act(async () => {
            render(<UBOMapView />);
        });

        await waitFor(() => expect(screen.getByText(/ТЕСТОВА КОМПАНІЯ/i)).toBeInTheDocument());

        const pepBtn = screen.getByText(/PEP_INTEL/i);
        await act(async () => {
            fireEvent.click(pepBtn);
        });

        expect(screen.getByText(/SOVEREIGN_PEP_REGISTRY/i)).toBeInTheDocument();
    });

    it('відображає помилку при невдалому завантаженні', async () => {
        (intelligence.getUBOMap as any).mockRejectedValue(new Error('Connection failure'));
        
        render(<UBOMapView />);

        await waitFor(() => {
            expect(screen.getByText(/КРИТИЧНИЙ ЗБІЙ  РОЗВІДКИ/i)).toBeInTheDocument();
        });
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ isOffline: true, nodeSource: 'OFFLINE_CACHE', healingProgress: 50 })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<UBOMapView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'UBONexus',
                        code: 'OWNERSHIP_NODES'
                    })
                })
            );
        });
    });
});
