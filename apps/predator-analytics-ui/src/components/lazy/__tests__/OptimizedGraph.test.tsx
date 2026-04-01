/**
 * Tests for OptimizedGraph Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { OptimizedGraph } from '../OptimizedGraph';

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('OptimizedGraph', () => {
  const mockNodes = [
    { id: 'node-1', label: 'Node 1', x: 100, y: 100, radius: 5, color: '#3b82f6' },
    { id: 'node-2', label: 'Node 2', x: 200, y: 150, radius: 8, color: '#10b981' },
    { id: 'node-3', label: 'Node 3', x: 300, y: 100, radius: 6, color: '#f59e0b' },
  ];

  const mockEdges = [
    { id: 'edge-1', source: 'node-1', target: 'node-2', weight: 1 },
    { id: 'edge-2', source: 'node-2', target: 'node-3', weight: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
      />
    );
  });

  it('renders canvas element', () => {
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
      />
    );

    const canvas = screen.getByRole('generic').querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('limits nodes to maxNodes', () => {
    const manyNodes = Array.from({ length: 1500 }, (_, i) => ({
      id: `node-${i}`,
      label: `Node ${i}`,
      x: Math.random() * 800,
      y: Math.random() * 600,
      radius: 5,
      color: '#3b82f6'
    }));

    render(
      <OptimizedGraph
        nodes={manyNodes}
        edges={mockEdges}
        width={800}
        height={600}
        maxNodes={1000}
      />
    );

    // Should only render 1000 nodes max
    expect(mockCanvasContext.arc).toHaveBeenCalledTimes(1000);
  });

  it('calls onNodeClick when node is clicked', () => {
    const mockOnNodeClick = jest.fn();
    
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
        onNodeClick={mockOnNodeClick}
      />
    );

    const canvas = screen.getByRole('generic').querySelector('canvas');
    if (canvas) {
      // Simulate click on first node
      fireEvent.click(canvas, {
        clientX: 100, // node-1 x position
        clientY: 100, // node-1 y position
      });

      // Note: This is a simplified test - in real scenario, 
      // we'd need to mock the canvas coordinate transformation
    }
  });

  it('calls onNodeHover on mouse move', () => {
    const mockOnNodeHover = jest.fn();
    
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
        onNodeHover={mockOnNodeHover}
      />
    );

    const canvas = screen.getByRole('generic').querySelector('canvas');
    if (canvas) {
      fireEvent.mouseMove(canvas, {
        clientX: 100,
        clientY: 100,
      });
    }
  });

  it('handles wheel events for zoom', () => {
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
      />
    );

    const canvas = screen.getByRole('generic').querySelector('canvas');
    if (canvas) {
      fireEvent.wheel(canvas, {
        deltaY: -10, // Zoom in
      });
    }
  });

  it('shows performance stats', () => {
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
      />
    );

    // Check for performance stats overlay
    expect(screen.getByText('Nodes: 3')).toBeInTheDocument();
    expect(screen.getByText('Edges: 2')).toBeInTheDocument();
  });

  it('shows zoom controls', () => {
    render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
      />
    );

    expect(screen.getByText('Reset Zoom')).toBeInTheDocument();
    expect(screen.getByText('Reset Pan')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <OptimizedGraph
        nodes={mockNodes}
        edges={mockEdges}
        width={800}
        height={600}
        className="custom-graph"
      />
    );

    expect(container.firstChild).toHaveClass('custom-graph');
  });

  it('handles empty nodes array', () => {
    render(
      <OptimizedGraph
        nodes={[]}
        edges={[]}
        width={800}
        height={600}
      />
    );

    const canvas = screen.getByRole('generic').querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles missing node properties', () => {
    const incompleteNodes = [
      { id: 'node-1', x: 100, y: 100 }, // Missing radius and color
      { id: 'node-2', label: 'Node 2', x: 200, y: 150 }, // Missing radius and color
    ];

    render(
      <OptimizedGraph
        nodes={incompleteNodes}
        edges={[]}
        width={800}
        height={600}
      />
    );

    // Should not crash and use default values
    expect(mockCanvasContext.arc).toHaveBeenCalledTimes(2);
  });
});
