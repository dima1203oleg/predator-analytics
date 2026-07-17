/**
 * ThermalCard — Vitest тести
 * v63.0-ELITE · CSS radial-gradient hover
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThermalCard } from '@/components/polish/ThermalCard';

describe('ThermalCard', () => {
  it('рендерить children', () => {
    render(
      <ThermalCard>
        <div data-testid="content">Картка ризику</div>
      </ThermalCard>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('застосовує radial-gradient при hover', () => {
    const { container } = render(
      <ThermalCard glowColor="rgba(225,29,72,0.2)">
        <div>Тест</div>
      </ThermalCard>
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });

    expect(card.style.background).toContain('radial-gradient');
    expect(card.style.background).toContain('225,29,72');
  });

  it('скидає ефект при mouseLeave', () => {
    const { container } = render(
      <ThermalCard>
        <div>Тест</div>
      </ThermalCard>
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });
    fireEvent.mouseLeave(card);

    expect(card.style.background).toBe('rgba(0, 0, 0, 0.8)');
  });

  it('підтримує custom className', () => {
    const { container } = render(
      <ThermalCard className="custom-class">
        <div>Тест</div>
      </ThermalCard>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
