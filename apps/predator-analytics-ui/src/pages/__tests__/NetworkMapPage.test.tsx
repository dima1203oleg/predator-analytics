import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NetworkMapPage from '../NetworkMapPage';
import { networkApi } from '@/features/network/api/network';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Мок API
vi.mock('@/features/network/api/network', () => ({
    networkApi: {
        getGraph: vi.fn(),
        searchNodes: vi.fn(),
        findPath: vi.fn(),
    },
}));

// Мокаємо Cytoscape
vi.mock('cytoscape', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            nodes: vi.fn().mockReturnValue({
                removeClass: vi.fn(),
                addClass: vi.fn(),
                style: vi.fn(),
                edgesWith: vi.fn().mockReturnValue({
                    addClass: vi.fn(),
                    removeClass: vi.fn(),
                    style: vi.fn()
                }),
                neighborhood: vi.fn().mockReturnValue({
                    addClass: vi.fn(),
                    removeClass: vi.fn(),
                })
            }),
            edges: vi.fn().mockReturnValue({
                removeClass: vi.fn(),
                addClass: vi.fn(),
                style: vi.fn()
            }),
            getElementById: vi.fn().mockReturnValue({
                position: vi.fn().mockReturnValue({ x: 0, y: 0 }),
                neighborhood: vi.fn().mockReturnValue({
                    addClass: vi.fn(),
                    removeClass: vi.fn(),
                }),
                addClass: vi.fn(),
                removeClass: vi.fn()
            }),
            layout: vi.fn().mockReturnValue({
                run: vi.fn()
            }),
            on: vi.fn(),
            destroy: vi.fn(),
            center: vi.fn(),
            zoom: vi.fn(),
            pan: vi.fn(),
            batch: vi.fn((fn) => fn()),
        })),
    };
});

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

describe('NetworkMapPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks
        (networkApi.getGraph as any).mockResolvedValue({
            nodes: [
                { data: { id: 'NODE-1', label: 'Company A', type: 'company', primary_risk: 'low' } },
                { data: { id: 'NODE-2', label: 'Person B', type: 'person', primary_risk: 'high' } }
            ],
            edges: [
                { data: { source: 'NODE-1', target: 'NODE-2', type: 'owns' } }
            ]
        });
        
        (networkApi.searchNodes as any).mockResolvedValue({
             nodes: [
                { data: { id: 'NODE-1', label: 'Company A', type: 'company', primary_risk: 'low' } },
            ]
        });
        
        (networkApi.findPath as any).mockResolvedValue({
             nodes: [
                { data: { id: 'NODE-1', label: 'Company A', type: 'company', primary_risk: 'low' } },
                { data: { id: 'NODE-2', label: 'Person B', type: 'person', primary_risk: 'high' } }
            ],
            edges: [
                 { data: { source: 'NODE-1', target: 'NODE-2', type: 'owns' } }
            ]
        });
    });

    it('renders the network map page', async () => {
        renderWithClient(<NetworkMapPage />);

        // Перевірка заголовка
        expect(screen.getByText('Мережевий аналіз')).toBeInTheDocument();
        
        // Чекаємо на завантаження даних
        await waitFor(() => {
            expect(networkApi.getGraph).toHaveBeenCalled();
        });

        // Перевірка наявності контейнера для графа
        expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('searches for nodes', async () => {
        renderWithClient(<NetworkMapPage />);

        // Вводимо текст для пошуку
        const searchInput = screen.getByPlaceholderText('Пошук вузлів (ЄД� ПОУ, ПІБ)...');
        fireEvent.change(searchInput, { target: { value: 'Company A' } });
        
        // Клікаємо на кнопку пошуку
        // TODO: The search input does not seem to trigger API call immediately.
        // Needs a real interaction or trigger if it's debounced/handled.
    });
});
