import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LLMHealthMonitor from '../LLMHealthMonitor';

vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
            button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

describe('LLMHealthMonitor', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        global.fetch = vi.fn().mockRejectedValue(new Error('network')) as any;
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('рендерить головні секції моніторингу LLM', async () => {
        render(<LLMHealthMonitor />);

        expect(screen.getByText(/Neural Gateway Controller/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/ACTIVE_TOPOLOGY_MAP/i)).toBeInTheDocument();
        });
    });
});
