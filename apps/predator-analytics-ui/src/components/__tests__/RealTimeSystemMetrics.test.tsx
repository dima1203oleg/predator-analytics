import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RealTimeSystemMetrics from '../RealTimeSystemMetrics';

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

class MockWebSocket {
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    close() {}
}

describe('RealTimeSystemMetrics', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                cpu: { percent: 42 },
                memory: { percent: 37 },
                disk: { percent: 55 },
                connections: 128,
                rps: 512,
                latency: { p50: 12, p95: 48, p99: 120 },
                errorRate: 0.3,
                uptime: 99.98,
                healthScore: 96
            })
        }) as any;
        (global as any).WebSocket = MockWebSocket as any;
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('рендерить ключові секції моніторингу', async () => {
        render(<RealTimeSystemMetrics />);

        expect(screen.getByText(/MATRIX/i)).toBeInTheDocument();
        expect(screen.getByText('Коефіцієнт Живучості')).toBeInTheDocument();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });
});
