import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingWizard from '../components/premium/OnboardingWizard';

vi.mock('../locales/uk/premium', () => ({
  premiumLocales: {
    onboarding: {
      steps: {
        welcome: {
          title: 'Ласкаво просимо до Навігатора Прибутку',
          description: 'Єдина бізнес-орієнтована навігація для швидкого доступу до розвідки, торгівлі, контрагентів, ШІ та системи.',
        },
        documents: {
          title: 'Глобальний шар швидкого доступу',
          description: 'Шукайте маршрути, обране, нещодавні дії та AI-рекомендації без переходу між розділами.',
          action: 'Відкрити пошук',
        },
        search: {
          title: 'Контекстна права панель',
          description: 'Працюйте з клієнтом, компанією, товаром або судном, не втрачаючи бізнес-контексту.',
          action: 'Перейти до панелі',
        },
        analytics: {
          title: 'ROI на головному дашборді',
          description: 'Дивіться, скільки годин, грошей та ризиків платформа заощаджує для вашого бізнесу.',
          action: 'Відкрити ROI',
        },
        monitoring: {
          title: 'Командний центр',
          description: 'Операційний контроль, ранковий брифінг, моніторинг і стратегічний огляд в одному місці.',
          action: 'Перейти до центру',
        },
        ready: {
          title: 'Ви готові запускати прибуток',
          description: 'Навігація, пошук, контекст і ROI уже працюють. Почніть першу бізнес-дію прямо зараз.',
        },
      },
      ui: {
        step: 'Крок',
        of: 'з',
        next: 'Далі',
        back: 'Назад',
        finish: 'Розпочати',
        close: 'Закрити',
      },
    },
  },
}));

vi.mock('framer-motion', async () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('показує новий onboarding після стартової затримки', () => {
    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>,
    );

    vi.advanceTimersByTime(2000);

    expect(screen.getByText('Ласкаво просимо до Навігатора Прибутку')).toBeInTheDocument();
    expect(screen.getByText('Глобальний шар швидкого доступу')).toBeInTheDocument();
  });

  it('позначає onboarding як завершений після закриття', () => {
    render(
      <MemoryRouter>
        <OnboardingWizard />
      </MemoryRouter>,
    );

    vi.advanceTimersByTime(2000);
    fireEvent.click(screen.getByTitle('Закрити'));

    expect(localStorage.getItem('predator_onboarding_completed')).toBe('true');
  });
});
