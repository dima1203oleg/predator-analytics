/**
 * AnimatedPage — Vitest тести
 * v63.0-ELITE · Framer Motion transitions
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedPage } from '@/components/polish/AnimatedPage';

describe('AnimatedPage', () => {
  it('рендерить children', async () => {
    render(
      <AnimatedPage pageKey="test" variant="fade">
        <div data-testid="content">Тестовий контент</div>
      </AnimatedPage>
    );
    await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument());
  });

  it('змінює key при навігації', () => {
    const { rerender } = render(
      <AnimatedPage pageKey="page-1" variant="slideUp">
        <div data-testid="p1">Сторінка 1</div>
      </AnimatedPage>
    );
    expect(screen.getByTestId('p1')).toBeInTheDocument();

    rerender(
      <AnimatedPage pageKey="page-2" variant="slideUp">
        <div data-testid="p2">Сторінка 2</div>
      </AnimatedPage>
    );
    expect(screen.getByTestId('p2')).toBeInTheDocument();
  });

  it('підтримує всі 5 варіантів без помилок', () => {
    const variants = ['fade', 'slideUp', 'slideLeft', 'tactical', 'decrypt'] as const;
    variants.forEach((v) => {
      const { unmount } = render(
        <AnimatedPage pageKey={v} variant={v}>
          <div>Variant {v}</div>
        </AnimatedPage>
      );
      expect(screen.getByText(`Variant ${v}`)).toBeInTheDocument();
      unmount();
    });
  });
});
