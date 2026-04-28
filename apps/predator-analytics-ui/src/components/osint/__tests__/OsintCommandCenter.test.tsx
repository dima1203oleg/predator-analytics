/**
 * 🧪 OSINT Command Center — Vitest + React Testing Library
 *
 * Тести покривають:
 * -  ендеринг стану завантаження
 * - Відображення OSINT інструментів
 * - Перемикання вкладок (ІНСТ УМЕНТИ, РЕЄСТРИ, СТ ІЧКА ПОДІЙ, АНАЛІТИКА)
 * - Пошук реєстрів
 * - Фільтрація стрічки подій за severity
 * - Запуск сканування
 * - Панель деталей інструменту
 *
 * Всі тексти — українською (HR-03/HR-04)
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';

// ─── Моки залежностей ──────────────────────────────────
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, onClick, ...props }: any) => (
            <div className={className} onClick={onClick} data-testid={props['data-testid']}>{children}</div>
        ),
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('lucide-react', () => {
    const createIcon = (name: string) => ({ size, className, ...props }: any) => (
        <span data-testid={`icon-${name.toLowerCase()}`} className={className} {...props} />
    );
    return {
        Globe: createIcon('Globe'),
        Shield: createIcon('Shield'),
        Activity: createIcon('Activity'),
        AlertTriangle: createIcon('AlertTriangle'),
        Database: createIcon('Database'),
        Eye: createIcon('Eye'),
        Radio: createIcon('Radio'),
        Wifi: createIcon('Wifi'),
        WifiOff: createIcon('WifiOff'),
        ChevronRight: createIcon('ChevronRight'),
        Search: createIcon('Search'),
        ScanLine: createIcon('ScanLine'),
        Building2: createIcon('Building2'),
        Scale: createIcon('Scale'),
        ShoppingCart: createIcon('ShoppingCart'),
        Landmark: createIcon('Landmark'),
        Banknote: createIcon('Banknote'),
        FileWarning: createIcon('FileWarning'),
        Skull: createIcon('Skull'),
        Bot: createIcon('Bot'),
        Home: createIcon('Home'),
        Receipt: createIcon('Receipt'),
        Ban: createIcon('Ban'),
        GitBranch: createIcon('GitBranch'),
        Target: createIcon('Target'),
        Radar: createIcon('Radar'),
        Zap: createIcon('Zap'),
        TrendingUp: createIcon('TrendingUp'),
        Lock: createIcon('Lock'),
        Crosshair: createIcon('Crosshair'),
        BarChart3: createIcon('BarChart3'),
        PieChart: createIcon('PieChart'),
        Server: createIcon('Server'),
        Clock: createIcon('Clock'),
        Check: createIcon('Check'),
        X: createIcon('X'),
        ArrowUpRight: createIcon('ArrowUpRight'),
        Layers: createIcon('Layers'),
        CircleDot: createIcon('CircleDot'),
        RefreshCw: createIcon('RefreshCw'),
        Cpu: createIcon('Cpu'),
    };
});

vi.mock('@/utils/cn', () => ({
    cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock apiClient
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('@/services/api/config', () => ({
    apiClient: {
        get: (...args: any[]) => mockGet(...args),
        post: (...args: any[]) => mockPost(...args),
    },
}));

// ─── Тестові дані ──────────────────────────────────────
const mockTools = [
    { id: 'sherlock', name: 'Sherlock', category: 'СОЦМЕ ЕЖІ', status: 'СКАНУЄ', findings: 1420, lastScan: 'Зараз', color: '#a855f7', description: 'Пошук профілів за username', accuracy: 94 },
    { id: 'amass', name: 'Amass', category: 'МЕ ЕЖА', status: 'ОНЛАЙН', findings: 872, lastScan: '2хв тому', color: '#3b82f6', description: 'DNS enumeration', accuracy: 97 },
    { id: 'ghunt', name: 'GHunt', category: 'GOOGLE', status: 'ОФЛАЙН', findings: 56, lastScan: '1г тому', color: '#64748b', description: 'Google розвідка', accuracy: 78 },
];

const mockRegistries = {
    categories: [
        {
            id: 'EDR', name: 'Держреєстрація', icon: 'Building2', color: '#10b981', count: 42,
            registries: [
                { id: 'edr-1', name: 'Єдиний Державний Реєстр (ЄД )', status: 'ACTIVE', records: 3200000, lastSync: '2024-03-01', api: 'REST' },
                { id: 'edr-2', name: 'Реєстр ФОП', status: 'ACTIVE', records: 1800000, lastSync: '2024-03-01', api: 'REST' },
            ],
        },
        {
            id: 'TAX', name: 'Податкова', icon: 'Receipt', color: '#f59e0b', count: 35,
            registries: [
                { id: 'tax-1', name: 'Реєстр платників ПДВ', status: 'ACTIVE', records: 450000, lastSync: '2024-03-01', api: 'SOAP' },
            ],
        },
    ],
    coverageStats: {
        totalSources: 267,
        active: 184,
        syncing: 23,
        offline: 40,
        pending: 20,
        totalRecords: '312B+',
        dataFreshness: '98.7%',
    },
};

const mockFeed = [
    { id: 'f1', source: 'SpiderFoot', type: 'alert', severity: 'CRITICAL', target: 'ТОВ "МЕГА"', finding: 'Email у витоку', timestamp: new Date().toISOString(), category: 'breach' },
    { id: 'f2', source: 'Sherlock', type: 'find', severity: 'MEDIUM', target: 'Іванов І.І.', finding: '14 профілів', timestamp: new Date().toISOString(), category: 'social' },
    { id: 'f3', source: 'РНБО', type: 'alert', severity: 'HIGH', target: 'Offshore Ltd.', finding: 'Санкційний список', timestamp: new Date().toISOString(), category: 'sanctions' },
];

const mockStats = {
    totalFindings: 48923,
    criticalAlerts: 127,
    activeScans: 3,
    toolsOnline: 10,
    toolsTotal: 12,
    registriesConnected: 184,
    registriesTotal: 267,
    findingsByCategory: [
        { category: 'СОЦМЕ ЕЖІ', count: 8420, pct: 17.2, color: '#a855f7' },
        { category: 'МЕ ЕЖА', count: 6102, pct: 12.5, color: '#3b82f6' },
    ],
    riskHeatmap: [
        { source: 'DarkWeb Витоки', risk: 98, count: 4499 },
        { source: 'Санкційні списки', risk: 95, count: 2890 },
    ],
    timeline: [
        { hour: '00:00', findings: 120, critical: 5 },
        { hour: '01:00', findings: 85, critical: 2 },
    ],
};

// ─── Хелпер для налаштування моків API ─────────────────
function setupApiMocks() {
    mockGet.mockImplementation((url: string) => {
        if (url === '/osint/tools') return Promise.resolve({ data: mockTools });
        if (url === '/osint/registries') return Promise.resolve({ data: mockRegistries });
        if (url === '/osint/feed') return Promise.resolve({ data: mockFeed });
        if (url === '/osint/stats') return Promise.resolve({ data: mockStats });
        return Promise.reject(new Error(`Невідомий URL: ${url}`));
    });
    mockPost.mockResolvedValue({ data: { status: 'started', scan_id: 'scan-test-123' } });
}

// ─── Імпорт після моків ────────────────────────────────
import { OsintCommandCenter } from '../OsintCommandCenter';

// ═══════════════════════════════════════════════════════
// 🧪 ТЕСТИ
// ═══════════════════════════════════════════════════════
describe('OsintCommandCenter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
        setupApiMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ───  ендеринг ──────────────────────────────────────
    describe(' ендеринг', () => {
        it('повинен показати стан завантаження', () => {
            // Затримуємо відповідь API щоб побачити loader
            mockGet.mockImplementation(() => new Promise(() => {}));
            render(<OsintCommandCenter />);
            expect(screen.getByText(/ІНІЦІАЛІЗАЦІЯ OSINT ЯД А/i)).toBeInTheDocument();
        });

        it('повинен відобразити статистику після завантаження', async () => {
            render(<OsintCommandCenter />);
            
            await waitFor(() => {
                // toLocaleString може форматувати по різному (48 923, 48,923)
                expect(screen.getByText(/48/)).toBeInTheDocument();
            });
            expect(screen.getByText('127')).toBeInTheDocument();
            expect(screen.getByText('ЗНАХІДОК')).toBeInTheDocument();
            expect(screen.getByText('КрИТИЧНИХ')).toBeInTheDocument();
            expect(screen.getByText('ІНСТ УМЕНТІВ')).toBeInTheDocument();
        });

        it('повинен відобразити інструменти на вкладці за замовчуванням', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('Sherlock')).toBeInTheDocument();
            });
            expect(screen.getByText('Amass')).toBeInTheDocument();
            expect(screen.getByText('GHunt')).toBeInTheDocument();
        });
    });

    // ─── Вкладки ────────────────────────────────────────
    describe('Навігація вкладками', () => {
        it('повинен мати всі 4 вкладки', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('ІНСТ УМЕНТИ')).toBeInTheDocument();
            });
            expect(screen.getByText('РЕЄСТРИ')).toBeInTheDocument();
            expect(screen.getByText('СТ ІЧКА ПОДІЙ')).toBeInTheDocument();
            expect(screen.getByText('АНАЛІТИКА')).toBeInTheDocument();
        });

        it('повинен перемикати на вкладку РЕЄСТРИ', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('РЕЄСТРИ')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('РЕЄСТРИ'));

            await waitFor(() => {
                expect(screen.getByText('Держреєстрація')).toBeInTheDocument();
            });
            expect(screen.getByText('Податкова')).toBeInTheDocument();
        });

        it('повинен перемикати на вкладку СТ ІЧКА ПОДІЙ', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('СТ ІЧКА ПОДІЙ')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('СТ ІЧКА ПОДІЙ'));

            await waitFor(() => {
                expect(screen.getByText(/СТ ІЧКА ПОДІЙ У РЕАЛЬНОМУ ЧАСІ/i)).toBeInTheDocument();
            });
        });

        it('повинен перемикати на вкладку АНАЛІТИКА', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('АНАЛІТИКА')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('АНАЛІТИКА'));

            await waitFor(() => {
                expect(screen.getByText('РОЗПОДІЛ ЗА КАТЕГОРІЯМИ')).toBeInTheDocument();
            });
            expect(screen.getByText('КА ТА РИЗИКІВ ЗА ДЖЕРЕЛОМ')).toBeInTheDocument();
            expect(screen.getByText('АКТИВНІСТЬ ЗА 24 ГОДИНИ')).toBeInTheDocument();
        });
    });

    // ─── Пошук реєстрів ─────────────────────────────────
    describe('Пошук реєстрів', () => {
        it('повинен фільтрувати реєстри за пошуковим запитом', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('РЕЄСТРИ')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('РЕЄСТРИ'));

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Пошук реєстрів...')).toBeInTheDocument();
            });

            const search = screen.getByPlaceholderText('Пошук реєстрів...');
            fireEvent.change(search, { target: { value: 'Податкова' } });

            // Повинна залишитись лише категорія Податкова
            expect(screen.getByText('Податкова')).toBeInTheDocument();
            expect(screen.queryByText('Держреєстрація')).not.toBeInTheDocument();
        });

        it('повинен показуватиповідомлення коли нічого не знайдено', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('РЕЄСТРИ')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('РЕЄСТРИ'));

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Пошук реєстрів...')).toBeInTheDocument();
            });

            fireEvent.change(screen.getByPlaceholderText('Пошук реєстрів...'), {
                target: { value: 'неіснуючий_запит_xyz' },
            });

            expect(screen.getByText(/Нічого не знайдено/i)).toBeInTheDocument();
        });
    });

    // ─── Фільтр подій ───────────────────────────────────
    describe('Фільтрація стрічки подій', () => {
        it('повинен фільтрувати подій за severity', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('СТ ІЧКА ПОДІЙ')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('СТ ІЧКА ПОДІЙ'));

            await waitFor(() => {
                expect(screen.getByText('ВСІ')).toBeInTheDocument();
            });

            // Знаходимо кнопку фільтра CRITICAL (шукаємо саме серед кнопок)
            const criticalButtons = screen.getAllByRole('button').filter(
                btn => btn.textContent === 'CRITICAL'
            );
            expect(criticalButtons.length).toBeGreaterThan(0);
            fireEvent.click(criticalButtons[0]);

            // Повинні бачити тільки CRITICAL подію
            await waitFor(() => {
                expect(screen.getByText('ТОВ "МЕГА"')).toBeInTheDocument();
            });
            expect(screen.queryByText('Іванов І.І.')).not.toBeInTheDocument();
        });
    });

    // ─── Панель деталей інструменту ──────────────────────
    describe('Деталі інструменту', () => {
        it('повинен показувати детальну панель при кліку на інструмент', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('Sherlock')).toBeInTheDocument();
            });

            // Клікаємо на інструмент Sherlock
            fireEvent.click(screen.getByText('Sherlock').closest('div[class]')!);

            await waitFor(() => {
                expect(screen.getByText('ЗАГАЛЬНІ ЗНАХІДКИ')).toBeInTheDocument();
            });
            expect(screen.getByText('ОСТАННЄ СКАНУВАННЯ')).toBeInTheDocument();
        });
    });

    // ─── Запуск сканування ───────────────────────────────
    describe('Запуск сканування', () => {
        it('повинен мати кнопку СКАН для ОНЛАЙН інструментів', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('Amass')).toBeInTheDocument();
            });

            // Amass в статусі ОНЛАЙН — повинна бути кнопка СКАН
            const scanButtons = screen.getAllByText('СКАН');
            expect(scanButtons.length).toBeGreaterThan(0);
        });
    });

    // ─── API ────────────────────────────────────────────
    describe('API інтеграція', () => {
        it('повинен зробити запити до всіх OSINT ендпоїнтів', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(mockGet).toHaveBeenCalledWith('/osint/tools');
                expect(mockGet).toHaveBeenCalledWith('/osint/registries');
                expect(mockGet).toHaveBeenCalledWith('/osint/feed');
                expect(mockGet).toHaveBeenCalledWith('/osint/stats');
            });
        });

        it('повинен обробляти помилки API gracefully', async () => {
            mockGet.mockRejectedValue(new Error('Network Error'));

            render(<OsintCommandCenter />);

            // Повинен пройти завантаження навіть при помилці
            await waitFor(() => {
                expect(screen.queryByText(/ІНІЦІАЛІЗАЦІЯ OSINT ЯД А/i)).not.toBeInTheDocument();
            });
        });
    });

    // ─── Українська локалізація ──────────────────────────
    describe('Локалізація (HR-03/HR-04)', () => {
        it('всі основні лейбли повинні бути українською', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                // Статистичні картки
                expect(screen.getByText('ЗНАХІДОК')).toBeInTheDocument();
                expect(screen.getByText('КрИТИЧНИХ')).toBeInTheDocument();
                expect(screen.getByText('ІНСТ УМЕНТІВ')).toBeInTheDocument();
                expect(screen.getByText('СКАНУЮТЬСЯ')).toBeInTheDocument();
                expect(screen.getByText('РЕЄСТРІВ')).toBeInTheDocument();
                expect(screen.getByText('СВІЖІСТЬ')).toBeInTheDocument();
            });
        });

        it('вкладки повинні мати українські назви', async () => {
            render(<OsintCommandCenter />);

            await waitFor(() => {
                expect(screen.getByText('ІНСТ УМЕНТИ')).toBeInTheDocument();
                expect(screen.getByText('РЕЄСТРИ')).toBeInTheDocument();
                expect(screen.getByText('СТ ІЧКА ПОДІЙ')).toBeInTheDocument();
                expect(screen.getByText('АНАЛІТИКА')).toBeInTheDocument();
            });
        });
    });
});
