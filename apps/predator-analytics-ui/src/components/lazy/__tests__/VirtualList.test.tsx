/**
 * Tests for VirtualList Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualList } from '../VirtualList';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

describe('VirtualList', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    label: `Item ${i}`,
    height: 50,
    data: { value: i }
  }));

  const mockRenderItem = (item: any, index: number) => (
    <div data-testid={`item-${index}`} style={{ height: item.height }}>
      {item.label}
    </div>
  );

  it('renders without crashing', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={400}
      />
    );
  });

  it('renders only visible items', async () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={400}
        overscan={0}
      />
    );

    // Should render only items visible in 400px container with 50px height items
    // 400px / 50px = 8 items visible
    await waitFor(() => {
      const visibleItems = screen.getAllByTestId(/item-/);
      expect(visibleItems.length).toBeLessThanOrEqual(8);
    });
  });

  it('handles dynamic item heights', () => {
    const dynamicItems = mockItems.map((item, i) => ({
      ...item,
      height: 30 + (i % 3) * 20 // Heights: 30, 50, 70
    }));

    render(
      <VirtualList
        items={dynamicItems}
        itemHeight={(item) => item.height}
        renderItem={mockRenderItem}
        containerHeight={400}
      />
    );

    expect(screen.getByTestId('item-0')).toBeInTheDocument();
  });

  it('calls onScrollEnd when scrolled to bottom', async () => {
    const mockOnScrollEnd = jest.fn();

    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={200}
        onScrollEnd={mockOnScrollEnd}
      />
    );

    const scrollContainer = screen.getByRole('generic').querySelector('div[style*="overflow-y"]');
    
    if (scrollContainer) {
      // Simulate scrolling to bottom
      fireEvent.scroll(scrollContainer, {
        target: { scrollTop: 1000 }
      });

      await waitFor(() => {
        expect(mockOnScrollEnd).toHaveBeenCalled();
      });
    }
  });

  it('shows custom scrollbar when enabled', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={400}
        showScrollbar={true}
      />
    );

    // Check for scrollbar indicator
    const scrollbar = document.querySelector('.absolute.right-2.top-2');
    expect(scrollbar).toBeInTheDocument();
  });

  it('hides scrollbar when disabled', () => {
    render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={400}
        showScrollbar={false}
      />
    );

    // Check that scrollbar indicator is hidden
    const scrollbar = document.querySelector('.absolute.right-2.top-2');
    expect(scrollbar).not.toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(
      <VirtualList
        items={[]}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={400}
      />
    );

    // Should not crash and should not render any items
    const items = screen.queryAllByTestId(/item-/);
    expect(items).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        renderItem={mockRenderItem}
        containerHeight={400}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
