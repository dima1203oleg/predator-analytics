/**
 * Test Configuration for Lazy Components
 * 
 * This file contains test utilities and mocks for lazy loading components
 */

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Suspense } from 'react';

// Custom render function for lazy components
const customRender = (
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
      {children}
    </Suspense>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock canvas context
const createMockCanvasContext = () => ({
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  rect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  setLineDash: jest.fn(),
  getLineDash: jest.fn(() => []),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  drawImage: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),
  clip: jest.fn(),
});

// Mock canvas element
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => createMockCanvasContext()),
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
  },
  writable: true,
});

// Mock ResizeObserver for component testing
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Test data generators
export const generateTestNodes = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    label: `Node ${i + 1}`,
    x: Math.random() * 800,
    y: Math.random() * 600,
    radius: 5 + Math.random() * 10,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)],
    data: { value: Math.random() * 100 }
  }));

export const generateTestEdges = (nodeCount: number, edgeCount: number) =>
  Array.from({ length: edgeCount }, (_, i) => ({
    id: `edge-${i}`,
    source: `node-${Math.floor(Math.random() * nodeCount)}`,
    target: `node-${Math.floor(Math.random() * nodeCount)}`,
    weight: Math.random()
  }));

export const generateTestItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    label: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    height: 60 + Math.random() * 40,
    data: {
      value: Math.random() * 100,
      category: ['Category A', 'Category B', 'Category C'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }
  }));

// Mock fetch for API tests
export const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: jest.fn(),
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  jest.clearAllMocks();
});

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper function to create mock component
export const createMockComponent = (name: string) => {
  const MockComponent = ({ children, ...props }: any) => (
    <div data-testid={name} {...props}>
      {children}
    </div>
  );
  MockComponent.displayName = name;
  return MockComponent;
};

// Helper function to create mock async component
export const createMockAsyncComponent = (name: string, delay = 100) => {
  const MockAsyncComponent = ({ children, ...props }: any) => {
    const [loaded, setLoaded] = React.useState(false);
    
    React.useEffect(() => {
      const timer = setTimeout(() => setLoaded(true), delay);
      return () => clearTimeout(timer);
    }, []);

    if (!loaded) {
      return <div data-testid={`${name}-loading`}>Loading...</div>;
    }

    return (
      <div data-testid={name} {...props}>
        {children}
      </div>
    );
  };
  MockAsyncComponent.displayName = name;
  return MockAsyncComponent;
};
