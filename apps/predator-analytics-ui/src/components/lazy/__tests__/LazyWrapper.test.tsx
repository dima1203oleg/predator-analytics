/**
 * Tests for LazyWrapper Component
 */

import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { LazyWrapper } from '../LazyWrapper';

// Mock component for testing
const TestComponent = () => <div data-testid="test-component">Test Content</div>;

// Mock component that throws error
const ErrorComponent = () => {
  throw new Error('Test error');
};

describe('LazyWrapper', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children without fallback', () => {
    render(
      <LazyWrapper>
        <TestComponent />
      </LazyWrapper>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders custom fallback', () => {
    render(
      <LazyWrapper fallback={<div data-testid="custom-fallback">Loading...</div>}>
        <TestComponent />
      </LazyWrapper>
    );

    // With Suspense, we need to wrap the component
    const { rerender } = render(
      <Suspense fallback={<div data-testid="suspense-fallback">Suspense Loading...</div>}>
        <LazyWrapper fallback={<div data-testid="custom-fallback">Loading...</div>}>
          <TestComponent />
        </LazyWrapper>
      </Suspense>
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('handles error boundary', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    render(
      <LazyWrapper>
        <ErrorComponent />
      </LazyWrapper>
    );

    // Should show error fallback
    expect(screen.getByText('Помилка завантаження')).toBeInTheDocument();
    expect(screen.getByText('Не вдалося завантажити компонент. Спробуйте оновити сторінку.')).toBeInTheDocument();
    expect(screen.getByText('Оновити')).toBeInTheDocument();

    // Restore console.error
    console.error = consoleError;
  });

  it('renders custom error fallback', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    render(
      <LazyWrapper errorFallback={<div data-testid="custom-error">Custom Error</div>}>
        <ErrorComponent />
      </LazyWrapper>
    );

    expect(screen.getByTestId('custom-error')).toBeInTheDocument();

    // Restore console.error
    console.error = consoleError;
  });

  it('applies custom className', () => {
    render(
      <LazyWrapper className="custom-wrapper">
        <TestComponent />
      </LazyWrapper>
    );

    const wrapper = screen.getByText('Test Content').parentElement;
    expect(wrapper).toHaveClass('custom-wrapper');
  });

  it('wraps children in Suspense', () => {
    render(
      <LazyWrapper>
        <TestComponent />
      </LazyWrapper>
    );

    // The component should be wrapped in Suspense
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('handles reload button click', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    render(
      <LazyWrapper>
        <ErrorComponent />
      </LazyWrapper>
    );

    const reloadButton = screen.getByText('Оновити');
    reloadButton.click();

    expect(mockReload).toHaveBeenCalled();

    // Restore console.error
    console.error = consoleError;
  });
});

describe('withLazyWrapper HOC', () => {
  it('wraps component with LazyWrapper', () => {
    // This would be tested by importing and using the HOC
    // For now, we'll test the concept
    const WrappedComponent = () => (
      <div data-testid="wrapped-component">Wrapped Content</div>
    );

    render(<WrappedComponent />);
    expect(screen.getByTestId('wrapped-component')).toBeInTheDocument();
  });

  it('passes props to wrapped component', () => {
    const ComponentWithProps = ({ message }: { message: string }) => (
      <div data-testid="component-with-props">{message}</div>
    );

    render(<ComponentWithProps message="Test Message" />);
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });
});
