/**
 * Tests for useInfiniteLoad Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useInfiniteLoad } from '../VirtualList';

describe('useInfiniteLoad', () => {
  const mockFetchMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    mockFetchMore.mockResolvedValue(true);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.loadMore).toBe('function');
  });

  it('does not load when hasMore is false', async () => {
    mockFetchMore.mockResolvedValue(true);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, false)
    );

    act(() => {
      result.current.loadMore();
    });

    expect(mockFetchMore).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('does not load when already loading', async () => {
    mockFetchMore.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    // Start first load
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.loading).toBe(true);

    // Try to load again while still loading
    act(() => {
      result.current.loadMore();
    });

    // Should not call fetchMore again
    expect(mockFetchMore).toHaveBeenCalledTimes(1);
  });

  it('loads data successfully', async () => {
    mockFetchMore.mockResolvedValue(true);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(mockFetchMore).toHaveBeenCalledTimes(1);
    });
  });

  it('handles fetch failure', async () => {
    mockFetchMore.mockResolvedValue(false);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Не вдалося завантажити більше елементів');
      expect(mockFetchMore).toHaveBeenCalledTimes(1);
    });
  });

  it('handles fetch error', async () => {
    mockFetchMore.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Помилка завантаження даних');
      expect(mockFetchMore).toHaveBeenCalledTimes(1);
    });
  });

  it('resets error state on successful load after error', async () => {
    mockFetchMore
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(true);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    // First load fails
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Помилка завантаження даних');
    });

    // Second load succeeds
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    expect(mockFetchMore).toHaveBeenCalledTimes(2);
  });

  it('can be called multiple times', async () => {
    mockFetchMore.mockResolvedValue(true);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    // First load
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Second load
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchMore).toHaveBeenCalledTimes(2);
  });

  it('handles concurrent calls safely', async () => {
    mockFetchMore.mockResolvedValue(true);

    const { result } = renderHook(() => 
      useInfiniteLoad(mockFetchMore, true)
    );

    // Multiple concurrent calls
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only call fetchMore once due to loading state protection
    expect(mockFetchMore).toHaveBeenCalledTimes(1);
  });
});
