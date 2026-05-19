/**
 * BrandLoader — Vitest тести
 * v63.0-ELITE · Decryption reveal
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import BrandLoader, { BrandLoaderFallback } from '@/components/polish/BrandLoader';

describe('BrandLoader', () => {
  it('рендерить дешифрування з початковим текстом', async () => {
    vi.useFakeTimers();
    render(<BrandLoader text="PREDATOR" subtext="ЗАВАНТАЖЕННЯ" duration={500} />);

    expect(screen.getByText(/PREDATOR|А|Б|В|Г/)).toBeInTheDocument();
    expect(screen.getByText('ЗАВАНТАЖЕННЯ')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    await waitFor(() => expect(screen.getByText('PREDATOR')).toBeInTheDocument());

    vi.useRealTimers();
  });

  it('викликає onComplete після завершення', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<BrandLoader text="TEST" onComplete={onComplete} duration={100} />);

    act(() => { vi.advanceTimersByTime(1000); });

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    vi.useRealTimers();
  });
});

describe('BrandLoaderFallback', () => {
  it('рендерить статичний текст без анімації', () => {
    render(<BrandLoaderFallback text="КУЗНЯ" subtext="ПІДГОТОВКА" />);
    expect(screen.getByText('КУЗНЯ')).toBeInTheDocument();
    expect(screen.getByText('ПІДГОТОВКА')).toBeInTheDocument();
  });
});
