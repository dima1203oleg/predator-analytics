import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SovereignIntelHub from '../SovereignIntelHub';
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
vi.mock('@/components/TacticalCard', () => ({ TacticalCard: ({ children, className }: any) => <div className={className}>{children}</div> }));
vi.mock('@/components/HoloContainer', () => ({ HoloContainer: ({ children, className }: any) => <div className={className}>{children}</div> }));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY',
        healingProgress: 100
    })
}));

// Mock API service
vi.mock('@/services/api/ai', () => ({
    aiApi: {
        chat: vi.fn().mockResolvedValue({
            choices: [{
                message: {
                    content: 'Test response',
                    thought_process: [{ id: 't1', stage: 'decision', content: 'Final thought', confidence: 0.99 }]
                }
            }]
        })
    }
}));

// Mock Query hooks
vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn(),
    useMutation: ({ mutationFn, onSuccess }: any) => ({
        mutate: async (vars: any) => {
            const data = await mutationFn(vars);
            onSuccess(data);
        },
        isPending: false
    })
}));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('SovereignIntelHub', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає заголовок хабу та привітання системи', async () => {
        render(<SovereignIntelHub />);
        
        expect(screen.getByText(/ХАБ/i)).toBeInTheDocument();
        expect(screen.getByText(/ІНТЕЛЕКТУ/i)).toBeInTheDocument();
        expect(screen.getByText(/СУВЕ ЕННИЙ ІНТЕЛЕКТ П ЕДАТО /i)).toBeInTheDocument();
    });

    it('ініціює predator-error (SOVEREIGN_SUCCESS) при успішному зв’язку', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<SovereignIntelHub />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'SOVEREIGN_SUCCESS',
                        service: 'SovereignHub'
                    })
                })
            );
        });
    });

    it('ініціює predator-error (LOCAL_CORE) в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'LOCAL_MIRROR',
                healingProgress: 50
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<SovereignIntelHub />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'LOCAL_CORE',
                        service: 'SovereignHub'
                    })
                })
            );
        });
    });

    it('дозволяє відправляти повідомлення та отримувати відповідь', async () => {
        render(<SovereignIntelHub />);
        
        const input = screen.getByPlaceholderText(/Введіть директиву для GLM-5.1/i);
        fireEvent.change(input, { target: { value: 'Test query' } });
        
        const sendBtn = screen.getByTestId('icon-send').parentElement!;
        
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        await waitFor(() => {
            expect(screen.getByText('Test response')).toBeInTheDocument();
            expect(screen.getByText('Final thought')).toBeInTheDocument();
        });
    });
});
