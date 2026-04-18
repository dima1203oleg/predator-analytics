import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ZradaControlView from '../ZradaControlView';
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
vi.mock('@/components/TacticalCard', () => ({ 
    TacticalCard: ({ children, variant }: any) => <div data-testid={`tactical-card-${variant}`}>{children}</div> 
}));
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
        sourceLabel: 'NVIDIA_PRIMARY',
        statusLabel: 'SYNCHRONIZED'
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('ZradaControlView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок та список об’єктів', async () => {
        render(<ZradaControlView />);
        
        expect(screen.getByText(/СИСТЕМА/i)).toBeInTheDocument();
        expect(screen.getByText(/ЗРАДА/i)).toBeInTheDocument();
        expect(screen.getByText(/Ковальчук Дмитро Олексійович/i)).toBeInTheDocument();
    });

    it('дозволяє вибирати об’єкт для перегляду деталей', async () => {
        render(<ZradaControlView />);
        
        const subject = screen.getByText(/Зінченко Марина Вікторівна/i);
        fireEvent.click(subject);

        await waitFor(() => {
            expect(screen.getByText(/АСОЦІЙОВАНА_ЦІЛЬ/i)).toBeInTheDocument();
            expect(screen.getByText(/БЕТА_ГРУП/i)).toBeInTheDocument();
        });
    });

    it('відкриває модальне вікно додавання об’єкта', async () => {
        render(<ZradaControlView />);
        
        const addBtn = screen.getByText(/ДОДАТИ_ОБ'ЄКТ/i);
        fireEvent.click(addBtn);

        expect(screen.getByText(/АВТОРИЗАЦІЯ ОБ'ЄКТА/i)).toBeInTheDocument();
    });

    it('ініціює predator-error при автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                sourceLabel: 'MIRROR', 
                statusLabel: 'OFFLINE'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<ZradaControlView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'InternalIntegrity',
                        code: 'ZRADA_NODES'
                    })
                })
            );
        });
    });
});
