import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
        default: ({ nodes, onNodeClick }: { nodes: any[], onNodeClick: Function }) => (
            <div data-testid="mock-graph-viewer">
                {nodes.map(n => (
                    <button 
                        key={n.id} 
                        data-testid={`node-${n.id}`}
                        onClick={() => onNodeClick(n)}
                    >
                        {n.label}
                    </button>
                ))}
            </div>
        )
    };
});

describe('OsintGraphExplorer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('renders the left panel with saved targets', () => {
        render(<OsintGraphExplorer />);
        
        expect(screen.getByText('Ваші Розслідування')).toBeInTheDocument();
        expect(screen.getAllByText('ТОВ "МЕГА БУД"').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Іванов І.І.').length).toBeGreaterThan(0);
        expect(screen.getAllByText('БФ "Допомога"').length).toBeGreaterThan(0);
    });

    it('can load a target from the history', () => {
        render(<OsintGraphExplorer />);
        
        // Initial node is C1
        expect(screen.getByTestId('node-c1')).toBeInTheDocument();
        
        // Load P1
        fireEvent.click(screen.getByText('Іванов І.І.'));
        
        expect(screen.queryByTestId('node-c1')).not.toBeInTheDocument();
        expect(screen.getByTestId('node-p1')).toBeInTheDocument();
    });

    it('executes global search correctly', () => {
        render(<OsintGraphExplorer />);
        
        const searchInput = screen.getByPlaceholderText(/Введіть ЄДРПОУ/i);
        const searchForm = searchInput.closest('form');
        
        expect(searchForm).not.toBeNull();
        
        fireEvent.change(searchInput, { target: { value: 'Нова Компанія' } });
        fireEvent.submit(searchForm!);
        
        // Search should add a new node and make it active
        expect(screen.getAllByText('Нова Компанія').length).toBeGreaterThan(0);
        expect(screen.getByText(/ОГЛЯД/i)).toBeInTheDocument(); // Right panel appears
    });

    it('displays the entity profile correctly on node click', () => {
        render(<OsintGraphExplorer />);
        
        // Click on the initial node directly
        fireEvent.click(screen.getByTestId('node-c1'));
        
        expect(screen.getByText(/ОГЛЯД/i)).toBeInTheDocument();
        expect(screen.getByText(/РЕЄСТРИ/i)).toBeInTheDocument();
        expect(screen.getByText(/ЗВ'ЯЗКИ/i)).toBeInTheDocument();
        
        // Check properties
        expect(screen.getByText('edrpou')).toBeInTheDocument();
        expect(screen.getByText('38123456')).toBeInTheDocument();
    });

    it('expands node correctly', async () => {
        render(<OsintGraphExplorer />);
        
        // Click to show profile
        fireEvent.click(screen.getByTestId('node-c1'));
        
        // Click Expand
        const expandButton = screen.getByText('РОЗГОРНУТИ В ГРАФІ');
        fireEvent.click(expandButton);
        
        // Expansion takes 800ms simulated
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        
        // Should appear in the graph
        expect(screen.getByTestId('node-p1')).toBeInTheDocument();
        expect(screen.getByTestId('node-p2')).toBeInTheDocument();
        expect(screen.getByTestId('node-l1')).toBeInTheDocument();
    });

    it('switches profile tabs correctly', () => {
        render(<OsintGraphExplorer />);
        
        fireEvent.click(screen.getByTestId('node-c1'));
        
        // Test Docs Tab
        fireEvent.click(screen.getByText(/РЕЄСТРИ/i));
        expect(screen.getByText(/ЄДР Виписка/i)).toBeInTheDocument();
        
        // Test Relations Tab
        fireEvent.click(screen.getByText(/ЗВ'ЯЗКИ/i));
        expect(screen.getByText(/Відомі зв'язки/i)).toBeInTheDocument();
    });

    it('resets graph correctly', () => {
        render(<OsintGraphExplorer />);
        
        // Search someone else
        const searchInput = screen.getByPlaceholderText(/Введіть ЄДРПОУ/i);
        fireEvent.change(searchInput, { target: { value: 'Something' } });
        fireEvent.submit(searchInput.closest('form')!);
        
        expect(screen.queryByTestId('node-c1')).not.toBeInTheDocument();
        
        // Reset via toolbar
        // The reset button is the one with RefreshCw icon and "Скинути Граф" tooltip
        const resetBtn = screen.getByText('Скинути Граф').closest('button');
        fireEvent.click(resetBtn!);
        
        expect(screen.getByTestId('node-c1')).toBeInTheDocument();
    });
});
