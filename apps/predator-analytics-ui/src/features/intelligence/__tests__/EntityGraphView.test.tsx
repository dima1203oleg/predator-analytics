import { render, screen, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EntityGraphView from '../EntityGraphView';
import React from 'react';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: any) => <div data-testid="three-canvas">{children}</div>,
    useFrame: vi.fn(),
    useThree: () => ({ size: { width: 1000, height: 800 } })
}));

vi.mock('@react-three/drei', () => ({
    OrbitControls: () => <div data-testid="orbit-controls" />,
    Html: ({ children }: any) => <div data-testid="html-overlay">{children}</div>,
    Stars: () => null,
    PerspectiveCamera: () => null
}));

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

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

// Mock fetch for graph data
const mockGraphData = {
    nodes: [
        { id: 'predator_core', label: 'PREDATOR_CORE', type: 'system', riskScore: 0, connections: 10 },
        { id: 'node_1', label: 'TARGET_ENTITY', type: 'company', riskScore: 95, connections: 5 }
    ],
    links: [
        { source: 'predator_core', target: 'node_1', value: 1, type: 'risk' }
    ]
};

global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGraphData),
    })
) as any;

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('EntityGraphView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс графу після завантаження', async () => {
        render(<EntityGraphView />);
        
        await waitFor(() => {
            expect(screen.queryByText(/ЗАВАНТАЖЕННЯ/i)).not.toBeInTheDocument();
            expect(screen.getByTestId('three-canvas')).toBeInTheDocument();
            expect(screen.getByText(/Г� АФ/i)).toBeInTheDocument();
            expect(screen.getByText(/ОБ'ЄКТІВ/i)).toBeInTheDocument();
        });
    });

    it('відображає HUD із кількістю вузлів та зв\'язків', async () => {
        render(<EntityGraphView />);
        
        await waitFor(() => {
            expect(screen.getByText('2')).toBeInTheDocument(); // Nodes count
            expect(screen.getByText('1')).toBeInTheDocument(); // Links count (1 real link)
        });
    });

    it('ініціює predator-error та відображає OFFLINE_MODE в автономному режимі', async () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<EntityGraphView />);

        await waitFor(() => {
            expect(screen.getByText(/OFFLINE_GRAPH_MODE/i)).toBeInTheDocument();
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'predator-error',
                    detail: expect.objectContaining({
                        service: 'GraphIntel',
                        code: 'GRAPH_NODES'
                    })
                })
            );
        });
    });

    it('ініціює predator-error при помилці API', async () => {
        (global.fetch as any).mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                status: 500
            })
        );

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(<EntityGraphView />);

        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        severity: 'critical',
                        message: expect.stringContaining('ПОМИЛКА ДОСТУПУ ДО ВУЗЛА Г� АФУ')
                    })
                })
            );
        });
    });
});
