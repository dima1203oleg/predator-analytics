import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { OsintGraphExplorer } from '../OsintGraphExplorer';

// Mock framer-motion to bypass animations in JSDOM
vi.mock('framer-motion', () => {
    const React = require('react');
    return {
        motion: {
            div: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => React.createElement('div', { ref, ...props })),
            button: React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, ...props }: any, ref: any) => React.createElement('button', { ref, ...props })),
        },
        AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    };
});

// Mock the GraphViewer since Cytoscape doesn't work well in JSDOM
vi.mock('../../graph/GraphViewer', () => {
    return {
        default: ({ nodes, onNodeClick, onNodeDoubleClick }: { nodes: any[], onNodeClick: Function, onNodeDoubleClick: Function }) => (
            <div data-testid="mock-graph-viewer">
                {nodes.map(n => (
                    <button 
                        key={n.id} 
                        data-testid={`node-${n.id}`}
                        onClick={() => onNodeClick(n)}
                        onDoubleClick={() => onNodeDoubleClick(n)}
                    >
                        {n.label}
                    </button>
                ))}
            </div>
        )
    };
});

// Mock the API client
const mockSummary = { nodes: [{ id: 'c1', type: 'Organization', riskScore: 80, label: 'ТОВ Тест', properties: { edrpou: '38123456' } }] };
const mockSearch = [{ ueid: 'p1', type: 'Person', name: 'Іванов І.І.', score: 90, cers: 90 }];
const mockNeighbors = { results: [{ m: { ueid: 'p2', name: 'Сидоров П.П.' }, r: { type: 'MANAGED_BY' } }] };
const mockUbo = { results: [{ u: { ueid: 'ubo1', name: 'Бос', cers: 100 } }] };

vi.mock('@/services/api', () => ({
    api: {
        graph: { summary: vi.fn(() => Promise.resolve(mockSummary)) },
        search: { query: vi.fn(() => Promise.resolve(mockSearch)) }
    },
    apiClient: {
        get: vi.fn((url: string) => {
            if (url.includes('/neighbors')) return Promise.resolve({ data: mockNeighbors });
            if (url.includes('/ubo')) return Promise.resolve({ data: mockUbo });
            return Promise.resolve({ data: {} });
        })
    }
}));

describe('OsintGraphExplorer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the left panel with history title', () => {
        render(<OsintGraphExplorer />);
        expect(screen.getByText('Ваші  озслідування')).toBeInTheDocument();
    });

    it('executes global search correctly', async () => {
        render(<OsintGraphExplorer />);
        const searchInput = screen.getByPlaceholderText(/Введіть ЄД ПОУ/i);
        const searchForm = searchInput.closest('form');
        expect(searchForm).not.toBeNull();
        
        fireEvent.change(searchInput, { target: { value: 'Нова Компанія' } });
        fireEvent.submit(searchForm!);
        
        await waitFor(() => {
            expect(screen.getByText('Іванов І.І.')).toBeInTheDocument();
            expect(screen.getByText(/ОГЛЯД/i)).toBeInTheDocument();
        });
    });

    it('loads initial graph state from summary API', async () => {
        render(<OsintGraphExplorer />);
        
        await waitFor(() => {
            expect(screen.getByTestId('node-c1')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByTestId('node-c1'));
        
        await waitFor(() => {
            expect(screen.getByText(/ОГЛЯД/i)).toBeInTheDocument();
            expect(screen.getByText('edrpou')).toBeInTheDocument();
            expect(screen.getByText('38123456')).toBeInTheDocument();
        });
    });

    it('expands node correctly via API', async () => {
        render(<OsintGraphExplorer />);
        
        await waitFor(() => {
            expect(screen.getByTestId('node-c1')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByTestId('node-c1'));
        
        const expandButton = screen.getByText('Оточення').closest('button');
        fireEvent.click(expandButton!);
        
        await waitFor(() => {
            expect(screen.getByTestId('node-p2')).toBeInTheDocument();
        });
    });

    it('runs UBO tracer correctly via API', async () => {
        render(<OsintGraphExplorer />);
        
        await waitFor(() => {
            expect(screen.getByTestId('node-c1')).toBeInTheDocument();
        });
        
        fireEvent.click(screen.getByTestId('node-c1'));
        
        const uboBtn = screen.getByText('Знайти UBO').closest('button');
        fireEvent.click(uboBtn!);
        
        await waitFor(() => {
            expect(screen.getByTestId('node-ubo1')).toBeInTheDocument();
        });
    });
});
