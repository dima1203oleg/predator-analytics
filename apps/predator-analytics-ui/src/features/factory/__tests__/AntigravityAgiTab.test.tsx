import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AntigravityAgiTab } from '../components/AntigravityAgiTab';
import { factoryApi } from '@/services/api/factory';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Мокаємо API
vi.mock('@/services/api/factory', () => ({
  factoryApi: {
    getAntigravityStatus: vi.fn(),
    getAntigravityTasks: vi.fn(),
    getAntigravityTaskLogs: vi.fn(),
    createAntigravityTask: vi.fn(),
    cancelAntigravityTask: vi.fn(),
  },
}));

// Очищаємо моки перед кожним тестом
describe('AntigravityAgiTab Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AntigravityAgiTab />
      </QueryClientProvider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('рендерить заголовок та базові елементи інтерфейсу', async () => {
    vi.mocked(factoryApi.getAntigravityStatus).mockResolvedValue({ is_running: true, agents: [] });
    vi.mocked(factoryApi.getAntigravityTasks).mockResolvedValue([]);

    renderComponent();

    expect(await screen.findByText((content) => content.includes('AGI Оркестратор'))).toBeInTheDocument();
    expect(await screen.findByText(/Оновити/i)).toBeInTheDocument();
  });

  it('відображає матрицю агентів при отриманні статусів', async () => {
    vi.mocked(factoryApi.getAntigravityStatus).mockResolvedValue({
      is_running: true,
      agents: [
        { type: 'architect', name: 'Architect', is_busy: false, tasks_completed: 5 },
        { type: 'surgeon', name: 'Surgeon', is_busy: true, tasks_completed: 12 },
      ],
    });
    vi.mocked(factoryApi.getAntigravityTasks).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Агент-Архітектор/i)).toBeInTheDocument();
      expect(screen.getByText(/Агент-Хірург/i)).toBeInTheDocument();
      // Оскільки "Активний" може бути як у заголовку, так і в картці агента
      expect(screen.getAllByText(/Активний/i).length).toBeGreaterThan(0);
    });
  });

  it('відображає список задач та відкриває форму створення', async () => {
    vi.mocked(factoryApi.getAntigravityStatus).mockResolvedValue({ is_running: true, agents: [] });
    vi.mocked(factoryApi.getAntigravityTasks).mockResolvedValue([
      {
        task_id: 'task-123',
        description: 'Перша тестова задача',
        status: 'pending',
        priority: 'medium',
        created_at: new Date().toISOString(),
      },
    ]);

    renderComponent();

    // Перевірка списку задач
    await waitFor(() => {
      expect(screen.getByText(/Перша тестова задача/i)).toBeInTheDocument();
      expect(screen.getByText(/В черзі/i)).toBeInTheDocument();
    });

    // Відкриття форми
    const addButton = screen.getByRole('button', { name: /Нова задача/i });
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText(/Наприклад: Створити FastAPI сервіс/i)).toBeInTheDocument();
    expect(screen.getByText(/Запустити AGI-задачу/i)).toBeInTheDocument();
  });

  it('валідує опис задачі перед відправкою', async () => {
    vi.mocked(factoryApi.getAntigravityStatus).mockResolvedValue({ is_running: true, agents: [] });
    vi.mocked(factoryApi.getAntigravityTasks).mockResolvedValue([]);

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Нова задача/i }));

    const textarea = screen.getByPlaceholderText(/Наприклад: Створити FastAPI сервіс/i);
    const submitButton = screen.getByText(/Запустити AGI-задачу/i);

    // Вводимо короткий опис
    fireEvent.change(textarea, { target: { value: 'Коротко' } });
    
    // Кнопка має бути заблокована ( disabled={creating || formDesc.trim().length < 10} )
    expect(submitButton).toBeDisabled();
  });

  it('викликає API при створенні валідної задачі', async () => {
    vi.mocked(factoryApi.getAntigravityStatus).mockResolvedValue({ is_running: true, agents: [] });
    vi.mocked(factoryApi.getAntigravityTasks).mockResolvedValue([]);
    vi.mocked(factoryApi.createAntigravityTask).mockResolvedValue({ task_id: 'new-agi-id' });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: /Нова задача/i }));

    const textarea = screen.getByPlaceholderText(/Наприклад: Створити FastAPI сервіс/i);
    const submitButton = screen.getByRole('button', { name: /Запустити AGI-задачу/i });

    fireEvent.change(textarea, { target: { value: ' озробка нового модуля аналітики для PREDATOR v57' } });
    
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(factoryApi.createAntigravityTask).toHaveBeenCalledWith(expect.objectContaining({
        description: ' озробка нового модуля аналітики для PREDATOR v57',
        priority: 'medium',
      }));
    });
  });
});
