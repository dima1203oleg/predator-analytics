import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CargoManifestPremium from '../CargoManifestPremium';
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
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY',
        healingProgress: 100
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('CargoManifestPremium', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та список маніфестів', async () => {
        render(<CargoManifestPremium />);
        
        expect(screen.getByText(/МИТНА/i)).toBeInTheDocument();
        expect(screen.getByText(/ФО ЕНЗИКА/i)).toBeInTheDocument();
        expect(screen.getByText(/UA\/ODS\/22901/i)).toBeInTheDocument();
    });

    it('дозволяє вибирати маніфест для перегляду деталей', async () => {
        render(<CargoManifestPremium />);
        
        const manifest = screen.getByText(/UA\/LVV\/11405/i);
        fireEvent.click(manifest);

        await waitFor(() => {
            expect(screen.getByText(/АГ О_ТЕХ_СЕ ВІС_ПЛЮС/i)).toBeInTheDocument();
            expect(screen.getByText(/AGRO_GLOBAL_GMBH_BERLIN/i)).toBeInTheDocument();
        });
    });

    it('фільтрує маніфести через пошук', async () => {
        render(<CargoManifestPremium />);
        
        const input = screen.getByPlaceholderText(/ID МАНІФЕСТА АБО КОМПАНІЯ.../i);
        fireEvent.change(input, { target: { value: 'ТЕХНО_П ОМ' } });

        expect(screen.getByText(/UA\/ODS\/22912/i)).toBeInTheDocument();
        expect(screen.queryByText(/UA\/ODS\/22901/i)).not.toBeInTheDocument();
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 45
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CargoManifestPremium />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'CargoForensic',
                        code: 'MANIFEST_NODES'
                    })
                })
            );
        });
    });

    it('ініціює predator-error при натисканні оновлення в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER',
                healingProgress: 45
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<CargoManifestPremium />);

        // Refresh icon has data-testid icon-refreshcw based on mock
        const refreshBtn = screen.getByTestId('icon-refreshcw').parentElement!;
        
        await act(async () => {
            fireEvent.click(refreshBtn);
        });

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        message: expect.stringContaining('Синхронізація через резервний канал MOCK/ZROK пройшла успішно')
                    })
                })
            );
        }, { timeout: 2000 });
    });
});
