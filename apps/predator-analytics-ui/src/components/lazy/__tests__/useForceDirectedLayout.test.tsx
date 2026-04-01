/**
 * Tests for useForceDirectedLayout Hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useForceDirectedLayout } from '../OptimizedGraph';

describe('useForceDirectedLayout', () => {
  const mockNodes = [
    { id: 'node-1', label: 'Node 1', x: 100, y: 100 },
    { id: 'node-2', label: 'Node 2', x: 200, y: 150 },
    { id: 'node-3', label: 'Node 3', x: 300, y: 100 },
  ];

  const mockEdges = [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-2', target: 'node-3' },
  ];

  it('initializes with input nodes', () => {
    const { result } = renderHook(() => 
      useForceDirectedLayout(mockNodes, mockEdges, 800, 600)
    );

    expect(result.current).toHaveLength(mockNodes.length);
    expect(result.current[0].id).toBe('node-1');
    expect(result.current[1].id).toBe('node-2');
    expect(result.current[2].id).toBe('node-3');
  });

  it('applies force-directed layout algorithm', async () => {
    const { result } = renderHook(() => 
      useForceDirectedLayout(mockNodes, mockEdges, 800, 600)
    );

    // Wait for layout algorithm to complete
    await waitFor(() => {
      const layoutNodes = result.current;
      
      // Nodes should be repositioned from initial positions
      expect(layoutNodes[0].x).not.toBe(100);
      expect(layoutNodes[0].y).not.toBe(100);
      
      // Nodes should be within bounds
      layoutNodes.forEach(node => {
        expect(node.x).toBeGreaterThanOrEqual(20);
        expect(node.x).toBeLessThanOrEqual(780);
        expect(node.y).toBeGreaterThanOrEqual(20);
        expect(node.y).toBeLessThanOrEqual(580);
      });
    });
  });

  it('handles empty nodes array', () => {
    const { result } = renderHook(() => 
      useForceDirectedLayout([], [], 800, 600)
    );

    expect(result.current).toHaveLength(0);
  });

  it('handles disconnected nodes', async () => {
    const disconnectedNodes = [
      { id: 'node-1', label: 'Node 1', x: 100, y: 100 },
      { id: 'node-2', label: 'Node 2', x: 200, y: 150 },
      { id: 'node-3', label: 'Node 3', x: 300, y: 100 },
    ];

    const { result } = renderHook(() => 
      useForceDirectedLayout(disconnectedNodes, [], 800, 600)
    );

    await waitFor(() => {
      const layoutNodes = result.current;
      
      // Nodes should still be positioned within bounds
      layoutNodes.forEach(node => {
        expect(node.x).toBeGreaterThanOrEqual(20);
        expect(node.x).toBeLessThanOrEqual(780);
        expect(node.y).toBeGreaterThanOrEqual(20);
        expect(node.y).toBeLessThanOrEqual(580);
      });
    });
  });

  it('updates when nodes change', async () => {
    const { result, rerender } = renderHook(
      ({ nodes, edges }) => useForceDirectedLayout(nodes, edges, 800, 600),
      {
        initialProps: { nodes: mockNodes, edges: mockEdges }
      }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    // Update nodes
    const newNodes = [
      { id: 'node-1', label: 'Node 1', x: 50, y: 50 },
      { id: 'node-2', label: 'Node 2', x: 150, y: 100 },
    ];

    rerender({ nodes: newNodes, edges: [] });

    await waitFor(() => {
      expect(result.current).toHaveLength(2);
      expect(result.current[0].id).toBe('node-1');
      expect(result.current[1].id).toBe('node-2');
    });
  });

  it('updates when edges change', async () => {
    const { result, rerender } = renderHook(
      ({ nodes, edges }) => useForceDirectedLayout(nodes, edges, 800, 600),
      {
        initialProps: { nodes: mockNodes, edges: mockEdges }
      }
    );

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    // Update edges to create different connections
    const newEdges = [
      { id: 'edge-1', source: 'node-1', target: 'node-3' },
    ];

    rerender({ nodes: mockNodes, edges: newEdges });

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
      // Layout should be different due to different edge connections
      const layoutNodes = result.current;
      expect(layoutNodes[0].x).toBeDefined();
      expect(layoutNodes[0].y).toBeDefined();
    });
  });

  it('handles different canvas sizes', async () => {
    const { result } = renderHook(() => 
      useForceDirectedLayout(mockNodes, mockEdges, 400, 300)
    );

    await waitFor(() => {
      const layoutNodes = result.current;
      
      // Nodes should be within smaller bounds
      layoutNodes.forEach(node => {
        expect(node.x).toBeGreaterThanOrEqual(20);
        expect(node.x).toBeLessThanOrEqual(380);
        expect(node.y).toBeGreaterThanOrEqual(20);
        expect(node.y).toBeLessThanOrEqual(280);
      });
    });
  });

  it('preserves node properties during layout', async () => {
    const nodesWithProperties = [
      { id: 'node-1', label: 'Node 1', x: 100, y: 100, color: '#ff0000', data: { value: 1 } },
      { id: 'node-2', label: 'Node 2', x: 200, y: 150, color: '#00ff00', data: { value: 2 } },
    ];

    const { result } = renderHook(() => 
      useForceDirectedLayout(nodesWithProperties, mockEdges, 800, 600)
    );

    await waitFor(() => {
      const layoutNodes = result.current;
      
      // Should preserve all original properties except x, y
      expect(layoutNodes[0].id).toBe('node-1');
      expect(layoutNodes[0].label).toBe('Node 1');
      expect(layoutNodes[0].color).toBe('#ff0000');
      expect(layoutNodes[0].data).toEqual({ value: 1 });
      
      expect(layoutNodes[1].id).toBe('node-2');
      expect(layoutNodes[1].label).toBe('Node 2');
      expect(layoutNodes[1].color).toBe('#00ff00');
      expect(layoutNodes[1].data).toEqual({ value: 2 });
    });
  });
});
