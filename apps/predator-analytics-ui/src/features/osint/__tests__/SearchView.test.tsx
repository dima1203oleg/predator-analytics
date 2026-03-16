import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchView } from '../SearchView';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

// Mock dependencies
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('lucide-react', () => {
    const MockIcon = ({ "data-testid": testId }: any) => <div data-testid={testId} />;
    return {
        Search: () => <MockIcon data-testid="icon-search" />,
        Building2: () => <MockIcon data-testid="icon-building" />,
        User: () => <MockIcon data-testid="icon-user" />,
        AlertTriangle: () => <MockIcon data-testid="icon-alert" />,
        CheckCircle: () => <MockIcon data-testid="icon-check" />,
        Lock: () => <MockIcon data-testid="icon-lock" />,
        Network: () => <MockIcon data-testid="icon-network" />,
        ChevronRight: () => <MockIcon data-testid="icon-chevron" />,
        Briefcase: () => <MockIcon data-testid="icon-briefcase" />,
        FileText: () => <MockIcon data-testid="icon-file" />,
        Globe: () => <MockIcon data-testid="icon-globe" />,
        Shield: () => <MockIcon data-testid="icon-shield" />,
        MapPin: () => <MockIcon data-testid="icon-map-pin" />,
        BrainCircuit: () => <MockIcon data-testid="icon-brain" />,
        Sparkles: () => <MockIcon data-testid="icon-sparkles" />,
        RefreshCw: () => <MockIcon data-testid="icon-refresh" />,
        Target: () => <MockIcon data-testid="icon-target" />,
        Activity: () => <MockIcon data-testid="icon-activity" />,
        Zap: () => <MockIcon data-testid="icon-zap" />,
        Fingerprint: () => <MockIcon data-testid="icon-fingerprint" />,
        Radio: () => <MockIcon data-testid="icon-radio" />,
        Scan: () => <MockIcon data-testid="icon-scan" />,
        Database: () => <MockIcon data-testid="icon-database" />,
        SearchCode: () => <MockIcon data-testid="icon-search-code" />,
        Radar: () => <MockIcon data-testid="icon-radar" />,
        XCircle: () => <MockIcon data-testid="icon-x-circle" />,
        SearchIcon: () => <MockIcon data-testid="icon-search-main" />
    };
});

vi.mock('@/store/useAppStore', () => ({
    useAppStore: vi.fn()
}));

vi.mock('@/services/api', () => ({
    api: {
        search: {
            query: vi.fn()
        },
        v45: {
            analyze: vi.fn()
        }
    }
}));

vi.mock('@/components/premium/SearchResultRadar', () => ({
    SearchResultRadar: () => <div data-testid="radar-chart" />
}));

vi.mock('@/features/ai/AIInsightsHub', () => ({
    __esModule: true,
    default: () => <div data-testid="ai-insights-hub" />
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats }: any) => (
        <header>
            <h1>{title}</h1>
            {stats && stats.map((s: any, i: number) => (
                <div key={i}>{s.label}: {s.value}</div>
            ))}
        </header>
    )
}));

vi.mock('@/components/TacticalCard', () => ({
    TacticalCard: ({ children, title, subtitle, actions }: any) => (
        <div data-testid="tactical-card">
            {title && <h2>{title}</h2>}
            {subtitle && <h3>{subtitle}</h3>}
            {children}
            {actions && actions.map((a: any, i: number) => (
                <button key={i} onClick={a.onClick}>{a.label}</button>
            ))}
        </div>
    )
}));

vi.mock('@/components/CyberOrb', () => ({
    CyberOrb: () => <div data-testid="cyber-orb" />
}));

vi.mock('@/components/HoloContainer', () => ({
    HoloContainer: ({ children }: any) => <div data-testid="holo-container">{children}</div>
}));

vi.mock('@/components/explain/ExplainabilityPanel', () => ({
    ExplainabilityPanel: ({ entityName }: any) => <div data-testid="explain-panel">Пояснення для {entityName}</div>
}));

describe('SearchView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppStore as any).mockReturnValue({ userRole: 'premium' });
    });

    it('повинен успішно відмальовуватись з початковими елементами', () => {
        render(<SearchView />);
        expect(screen.getByText(/НЕЙРОННА МАТРИЦЯ ПОШУКУ/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Введіть код ЄДРПОУ/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /SEARCH/i })).toBeInTheDocument();
    });

    it('повинен виконувати пошук та відображати результати', async () => {
        const mockResults = [
            {
                id: '123',
                title: 'ТЕСТОВА КОМПАНІЯ',
                score: 0.9,
                metadata: {
                    edrpou: '12345678',
                    status: 'active',
                    risk_level: 'low',
                    director: 'Іванов І.І.',
                    address: 'Київ, вул. Тестова, 1',
                    capital: '1 000 000 грн',
                    type: 'ТОВ',
                    connections_count: 5
                }
            }
        ];

        (api.search.query as any).mockResolvedValue(mockResults);
        (api.v45.analyze as any).mockResolvedValue({ result: 'AI Аналіз завершено' });

        render(<SearchView />);

        const input = screen.getByPlaceholderText(/Введіть код ЄДРПОУ/i);
        fireEvent.change(input, { target: { value: 'Тест' } });
        
        const searchBtn = screen.getByRole('button', { name: /SEARCH/i });
        fireEvent.click(searchBtn);

        // Результати
        const companyName = await screen.findByText(/ТЕСТОВА КОМПАНІЯ/i);
        expect(companyName).toBeInTheDocument();
        expect(screen.getByText(/12345678/i)).toBeInTheDocument();
        
        // AI Результати
        const aiAnswer = await screen.findByText(/AI Аналіз завершено/i);
        expect(aiAnswer).toBeInTheDocument();
    });

    it('повинен перемикати Hacker Mode', () => {
        render(<SearchView />);
        
        const hackerBtn = screen.getByTitle(/Hacker Mode/i);
        fireEvent.click(hackerBtn);

        expect(screen.getByText(/> PREDATOR_QUERY_HUB/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ВВЕДІТЬ_ЄДРПОУ_АБО_ЗАПИТ/i)).toBeInTheDocument();
    });

    it('повинен розгортати панель пояснення при натисканні', async () => {
        const mockResults = [
            {
                id: '1',
                title: 'COMPANY_X',
                score: 0.9,
                metadata: { edrpou: '111', type: 'ТОВ' }
            }
        ];
        (api.search.query as any).mockResolvedValue(mockResults);
        (api.v45.analyze as any).mockResolvedValue({ result: 'Analysis' });

        render(<SearchView />);
        fireEvent.change(screen.getByPlaceholderText(/Введіть код ЄДРПОУ/i), { target: { value: 'X' } });
        fireEvent.click(screen.getByRole('button', { name: /SEARCH/i }));

        const explainBtn = await screen.findByRole('button', { name: /ПОЯСНИТИ РІШЕННЯ/i });
        fireEvent.click(explainBtn);

        expect(await screen.findByTestId('explain-panel')).toBeInTheDocument();
        expect(screen.getByText(/Пояснення для COMPANY_X/i)).toBeInTheDocument();
    });

    it('повинен відображати "ДОСТУП_ОБМЕЖЕНО" для не-преміум користувачів', async () => {
        (useAppStore as any).mockReturnValue({ userRole: 'viewer' });
        (api.search.query as any).mockResolvedValue([]);
        (api.v45.analyze as any).mockResolvedValue({ result: 'Restricted' });

        render(<SearchView />);
        fireEvent.change(screen.getByPlaceholderText(/Введіть код ЄДРПОУ/i), { target: { value: 'Test' } });
        fireEvent.click(screen.getByRole('button', { name: /SEARCH/i }));

        expect(await screen.findByText(/ДОСТУП_ОБМЕЖЕНО/i)).toBeInTheDocument();
    });
});
