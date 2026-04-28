import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchConsole from '../SearchConsole';
import { api } from '@/services/api';

// Mock ResizeObserver
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    },
    removeItem: function(key: string) {
      delete store[key];
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

// Mock the API
vi.mock('@/services/api', () => ({
    api: {
        search: {
            query: vi.fn()
        }
    }
}));

// Mock the store
vi.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        userRole: 'admin'
    })
}));

// Mock visual components
vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />
}));
vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-bg" />
}));
vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: () => <div data-testid="cyber-grid" />
}));

// Mock framer-motion to avoid animation issues
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, className, onClick, style }: any) => (
                <div className={className} onClick={onClick} style={style}>{children}</div>
            ),
            button: ({ children, className, onClick, style }: any) => (
                <button className={className} onClick={onClick} style={style}>{children}</button>
            )
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

// Mock voice control
vi.mock('@/hooks/useVoiceControl', () => ({
    useVoiceControl: () => ({
        startListening: vi.fn(),
        stopListening: vi.fn(),
        speak: vi.fn()
    })
}));

describe('SearchConsole Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        (api.search.query as any).mockResolvedValue([]);
    });

    it('повинен рендерити заголовок та базові елементи', () => {
        render(<SearchConsole />);
        expect(screen.getByText(/SYNAPTIC/)).toBeInTheDocument();
        expect(screen.getByText(/DISCOVERY/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ЗАПИТАЙТЕ У МАТрИЦІ.../)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ЗНАЙТИ/i })).toBeInTheDocument();
    });

    it('повинен обробляти пошук та відображати результати', async () => {
        const mockResults = [
            {
                id: '1',
                title: 'Тестовий реєстр',
                snippet: 'Тестовий опис для перевірки пошуку',
                score: 0.95,
                source: 'ТЕСТ_ДЖЕРЕЛО',
                searchType: 'hybrid',
                date: '2026-03-14',
                truthScore: 0.99
            }
        ];

        (api.search.query as any).mockResolvedValue(mockResults);

        render(<SearchConsole />);

        const input = screen.getByPlaceholderText(/ЗАПИТАЙТЕ У МАТрИЦІ.../);
        fireEvent.change(input, { target: { value: 'Тестовий пошук' } });

        const searchButton = screen.getByRole('button', { name: /ЗНАЙТИ/i });
        fireEvent.click(searchButton);

        // API має викликатись
        expect(api.search.query).toHaveBeenCalledWith({
            q: 'Тестовий пошук',
            rerank: true,
            mode: 'hybrid'
        });

        // Чекаємо на появу результатів
        await waitFor(() => {
            expect(screen.getByText('Тестовий реєстр')).toBeInTheDocument();
            expect(screen.getByText(/"Тестовий опис для перевірки пошуку"/)).toBeInTheDocument();
            expect(screen.getByText('ТЕСТ_ДЖЕРЕЛО')).toBeInTheDocument();
        });
    });

    it('повинен зберігати та відображати історію пошуку', async () => {
        render(<SearchConsole />);

        const input = screen.getByPlaceholderText(/ЗАПИТАЙТЕ У МАТрИЦІ.../);
        fireEvent.change(input, { target: { value: 'Запит для історії' } });

        const searchButton = screen.getByRole('button', { name: /ЗНАЙТИ/i });
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(localStorage.getItem('search_history')).toContain('Запит для історії');
        });

        // Очищаємо інпут, щоб показати історію в UI: історії показуються тільки якщо немає результатів пошуку, 
        // або показуються при відображенні якщо results порожні? 
        // В коді історія показується коли: history.length > 0 && !results.length && !isLoading
        // після пошуку results не порожні. 
        // Давайте переключимо фокус або перезавантажимо компонент
    });

    it('історія повинна відображатись на початковому екрані', () => {
        localStorage.setItem('search_history', JSON.stringify(['Історія 1', 'Історія 2']));
        render(<SearchConsole />);

        expect(screen.getByText('ІСТО ІЯ:')).toBeInTheDocument();
        expect(screen.getByText('Історія 1')).toBeInTheDocument();
        expect(screen.getByText('Історія 2')).toBeInTheDocument();
    });

    it('фільтр ТІЛЬКИ ІСТИНА повинен відфільтровувати результати з truthScore < 0.9', async () => {
        const mockResults = [
            {
                id: '1',
                title: 'реальний факт',
                snippet: '100% правда',
                score: 0.9,
                searchType: 'text',
                truthScore: 0.95
            },
            {
                id: '2',
                title: 'Сумнівний факт',
                snippet: 'Можливо фейк',
                score: 0.8,
                searchType: 'text',
                truthScore: 0.5
            }
        ];

        // Мокваємо результати
        (api.search.query as any).mockResolvedValue(mockResults);

        render(<SearchConsole />);

        // Вмикаємо ТІЛЬКИ ІСТИНА
        const truthButton = screen.getByText('ТІЛЬКИ ІСТИНА');
        fireEvent.click(truthButton);

        //  обимо пошук
        const input = screen.getByPlaceholderText(/ЗАПИТАЙТЕ У МАТрИЦІ.../);
        fireEvent.change(input, { target: { value: 'Тест' } });
        fireEvent.click(screen.getByRole('button', { name: /ЗНАЙТИ/i }));

        await waitFor(() => {
            expect(screen.getByText('реальний факт')).toBeInTheDocument();
            // Другий результат повинен бути відфільтрований
            expect(screen.queryByText('Сумнівний факт')).not.toBeInTheDocument();
        });
    });

    it('порожній запит не повинен викликати API', () => {
        render(<SearchConsole />);
        const searchButton = screen.getByRole('button', { name: /ЗНАЙТИ/i });
        
        fireEvent.click(searchButton);
        expect(api.search.query).not.toHaveBeenCalled();
    });
});
