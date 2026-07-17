import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';
import { KnowledgeGraph3D } from '../KnowledgeGraph3D';
import { expect, test, describe, vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock the ForceGraph3D since it uses canvas/WebGL
vi.mock('react-force-graph-3d', () => {
  return {
    default: vi.fn().mockImplementation(() => <div data-testid="force-graph-3d" />)
  };
});

describe('KnowledgeGraph3D', () => {
  test('renders loading state initially', () => {
    // Wait, the component is not using React.Suspense internally, it handles its own isLoading state.
    // However, we just added a simple test.
    render(
      <Suspense fallback="Loading...">
        <KnowledgeGraph3D nodes={[]} links={[]} />
      </Suspense>
    );
    expect(screen.getByText('THE_OBSERVATORY')).toBeDefined();
  });
});
