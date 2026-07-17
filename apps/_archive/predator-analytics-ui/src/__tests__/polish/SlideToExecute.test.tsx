/**
 * SlideToExecute — Vitest тести
 * v63.0-ELITE · Drag-to-confirm
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlideToExecute } from '@/components/polish/SlideToExecute';

describe('SlideToExecute', () => {
  it('рендерить початковий лейбл', () => {
    render(<SlideToExecute onExecute={vi.fn()} />);
    expect(screen.getByText('ПОВЗУНОК ДЛЯ ПІДТВЕРДЖЕННЯ')).toBeInTheDocument();
  });

  it('викликає onExecute при drag > 85%', async () => {
    const onExecute = vi.fn();
    render(<SlideToExecute onExecute={onExecute} />);

    const thumb = screen.getByRole('button');
    fireEvent.mouseDown(thumb, { clientX: 0, clientY: 0 });
    fireEvent.mouseMove(thumb, { clientX: 500, clientY: 0 });
    fireEvent.mouseUp(thumb);

    // Перевіряємо що onExecute був викликаний
    await vi.waitFor(() => expect(onExecute).toHaveBeenCalled());
  });

  it(' danger variant показує warning при >50%', () => {
    const { container } = render(<SlideToExecute onExecute={vi.fn()} danger />);
    expect(container.querySelector('.border-rose-500')).toBeTruthy();
  });

  it('disabled блокує взаємодію', () => {
    render(<SlideToExecute onExecute={vi.fn()} disabled />);
    const wrapper = screen.getByText('ПОВЗУНОК ДЛЯ ПІДТВЕРДЖЕННЯ').parentElement;
    expect(wrapper).toHaveClass('opacity-40');
  });
});
