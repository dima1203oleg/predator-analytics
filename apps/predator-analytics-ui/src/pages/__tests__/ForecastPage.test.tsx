import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForecastPage from '../ForecastPage';
import { forecastApi } from '@/features/forecast/api/forecast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Мок API
vi.mock('@/features/forecast/api/forecast', () => ({
    forecastApi: {
        getDemandForecast: vi.fn(),
        getModels: vi.fn(),
    },
}));

// Мок ECharts щоб уникнути помилок рендерингу canvas в jsdom
vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="mock-echarts">Chart</div>,
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithClient = (ui: React.ReactElement) => {
    return render(
        <QueryClientProvider client={queryClient}>
            {ui}
        </QueryClientProvider>
    );
};

describe('ForecastPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Setup default mocks
        (forecastApi.getDemandForecast as any).mockResolvedValue({
            product_code: '84713000',
            product_name: 'Ноутбуки',
            months_ahead: 6,
            model_used: 'prophet',
            source: 'real',
            forecast: [
                { date: '2024-06-01', predicted_volume: 1000, confidence_lower: 900, confidence_upper: 1100 },
                { date: '2024-07-01', predicted_volume: 1100, confidence_lower: 950, confidence_upper: 1250 },
            ],
            confidence_score: 0.85,
            mape: 0.12,
            interpretation_uk: 'Очікується зростання попиту в наступні місяці.',
            generated_at: '2024-05-20T10:00:00Z',
        });

        (forecastApi.getModels as any).mockResolvedValue({
            models: [
                { key: 'prophet', name_uk: 'Prophet', description_uk: 'Опис моделі Prophet' },
                { key: 'arima', name_uk: 'ARIMA', description_uk: 'Опис моделі ARIMA' },
            ]
        });
    });

    it('renders the forecast page and default tab (Demand)', async () => {
        renderWithClient(<ForecastPage />);

        // Перевірка заголовка сторінки
        expect(screen.getByText('Прогнозування')).toBeInTheDocument();
        
        // Перевірка чи вибрано вкладку "Прогноз попиту"
        const demandTab = screen.getByText('Прогноз попиту');
        expect(demandTab).toBeInTheDocument();
        
        // Чекаємо на завантаження даних
        await waitFor(() => {
            expect(forecastApi.getDemandForecast).toHaveBeenCalledWith({
                product_code: '84713000',
                months_ahead: 6,
                model: 'prophet'
            });
        });

        // Перевірка метрик
        expect(await screen.findByText('12.0%')).toBeInTheDocument(); // MAPE
        expect(await screen.findByText('+10%')).toBeInTheDocument(); // Прогнозний ріст
        expect(await screen.findByText('85%')).toBeInTheDocument(); // Впевненість

        // Перевірка графіка
        expect(await screen.findByTestId('mock-echarts')).toBeInTheDocument();

        // Перевірка AI інтерпретації
        expect(await screen.findByText('Очікується зростання попиту в наступні місяці.')).toBeInTheDocument();

        // Перевірка таблиці
        expect(await screen.findByText('2024-06-01')).toBeInTheDocument();
        expect(await screen.findByText('Ноутбуки (84713000)')).toBeInTheDocument();
    });

    it('switches to ML Models tab and loads data', async () => {
        renderWithClient(<ForecastPage />);

        // Клікаємо на вкладку "ML Моделі"
        fireEvent.click(screen.getByText(/ML моделі/i));

        await waitFor(() => {
            expect(forecastApi.getModels).toHaveBeenCalled();
        });

        // Перевірка чи відображаються моделі
        expect(await screen.findByText('Prophet')).toBeInTheDocument();
        expect(await screen.findByText('Опис моделі Prophet')).toBeInTheDocument();
        expect(await screen.findByText('ARIMA')).toBeInTheDocument();
        expect(await screen.findByText('Опис моделі ARIMA')).toBeInTheDocument();
    });

    it('switches to Scenarios tab and displays simulator info', async () => {
        renderWithClient(<ForecastPage />);

        // Клікаємо на вкладку "Сценарії"
        fireEvent.click(screen.getByText('Сценарії'));

        // Перевірка контенту вкладки сценаріїв
        expect(await screen.findByText('Сценарний простір')).toBeInTheDocument();
        expect(await screen.findByText(/Сценарії будуються на базі останнього отриманого прогнозу/i)).toBeInTheDocument();
        expect(await screen.findByText('Консервативний')).toBeInTheDocument();
    });

    it('displays error when forecast API fails', async () => {
        (forecastApi.getDemandForecast as any).mockRejectedValue(new Error('Network error'));
        renderWithClient(<ForecastPage />);

        await waitFor(() => {
            expect(screen.getByText('Не вдалося отримати прогноз. Спробуйте ще раз або перевірте бекенд.')).toBeInTheDocument();
        });
    });

    it('displays synthetic badge when source is synthetic', async () => {
        (forecastApi.getDemandForecast as any).mockResolvedValue({
            product_code: '84713000',
            product_name: 'Ноутбуки',
            months_ahead: 6,
            model_used: 'prophet',
            source: 'synthetic',
            forecast: [
                { date: '2024-06-01', predicted_volume: 950, confidence_lower: 855, confidence_upper: 1064 },
            ],
            confidence_score: 0.91,
            mape: 0.09,
            interpretation_uk: 'Синтетичний прогноз.',
        });

        renderWithClient(<ForecastPage />);

        await waitFor(() => {
            expect(screen.getByText('Синтетичні')).toBeInTheDocument();
            expect(screen.queryByText('� еальні дані')).not.toBeInTheDocument();
        });
    });

    it('displays empty state when models list is empty', async () => {
        (forecastApi.getModels as any).mockResolvedValue({ models: [] });
        renderWithClient(<ForecastPage />);

        fireEvent.click(screen.getByText(/ML моделі/i));

        await waitFor(() => {
            expect(screen.getByText('Немає доступних моделей. Запустіть тренування або перевірте конфігурацію бекенду.')).toBeInTheDocument();
        });
    });

    it('displays error when models API fails', async () => {
        (forecastApi.getModels as any).mockRejectedValue(new Error('API error'));
        renderWithClient(<ForecastPage />);

        fireEvent.click(screen.getByText(/ML моделі/i));

        await waitFor(() => {
            expect(screen.getByText('Не вдалося завантажити перелік моделей. Перевірте бекенд.')).toBeInTheDocument();
        });
    });
});
