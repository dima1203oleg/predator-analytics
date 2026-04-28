import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MarketPage from '../MarketPage';
import { dashboardApi, marketApi, competitorsApi } from '@/services/api';

// Моки API
vi.mock('@/services/api', () => ({
    dashboardApi: {
        getOverview: vi.fn()
    },
    marketApi: {
        getDeclarations: vi.fn()
    },
    competitorsApi: {
        getActive: vi.fn()
    }
}));

// Мок framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual as any,
        motion: {
            div: ({ children, className, onClick, style }: any) => (
                <div className={className} onClick={onClick} style={style} data-testid="motion-div">{children}</div>
            ),
            tr: ({ children, className }: any) => (
                <tr className={className}>{children}</tr>
            )
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

// Мок echarts
vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock">Chart Mock</div>
}));

const mockOverviewData = {
    overview: {
        stats: {
            total_declarations: 15400,
            declarations_change: 5,
            total_value_usd: 120000000,
            value_change: -2,
            active_companies: 3200,
            companies_change: 1,
            total_products: 4500,
            products_change: 0
        },
        top_products: [
            { product_code: '8517', product_name: 'Телефони', total_value_usd: 50000000, growth_rate: 15 },
            { product_code: '8703', product_name: 'Автомобілі', total_value_usd: 30000000, growth_rate: -5 }
        ]
    }
};

const mockDeclarationsData = {
    items: [
        { id: '1', declaration_date: '2026-03-01T10:00:00Z', declaration_number: 'UA12345', company_name: 'Company A', product_code: '8517', value_usd: 10000, weight_kg: 50 },
        { id: '2', declaration_date: '2026-03-02T11:00:00Z', declaration_number: 'UA54321', company_name: 'Company B', product_code: '8703', value_usd: 50000, weight_kg: 1500 }
    ],
    total: 2,
    page: 1,
    size: 15
};

const mockCompetitorsData = [
    { edrpou: '11111111', name: 'Competitor X', declaration_count: 50, total_value_usd: 2000000 },
    { edrpou: '22222222', name: 'Competitor Y', declaration_count: 30, total_value_usd: 1500000 }
];

describe('MarketPage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (dashboardApi.getOverview as any).mockResolvedValue(mockOverviewData);
        (marketApi.getDeclarations as any).mockResolvedValue(mockDeclarationsData);
        (competitorsApi.getActive as any).mockResolvedValue(mockCompetitorsData);
    });

    it('повинен рендерити заголовок і вкладки', async () => {
        render(<MarketPage />);
        
        expect(await screen.findByText(' инок')).toBeInTheDocument();
        expect(screen.getAllByText('Огляд ринку').length).toBeGreaterThan(0);
        expect(screen.getByText('Декларації')).toBeInTheDocument();
        expect(screen.getByText('Конкуренти')).toBeInTheDocument();
        expect(screen.getByText('Митниця')).toBeInTheDocument();
    });

    it('повинен завантажувати і відображати дані огляду', async () => {
        render(<MarketPage />);
        
        // Перевіряємо дані з моків
        expect(await screen.findByText(/15[\s\xa0]400/)).toBeInTheDocument();
        expect(screen.getByText('$120.0M')).toBeInTheDocument();
        expect(screen.getByText(/3[\s\xa0]200/)).toBeInTheDocument();
        
        // Перевіряємо топ продукти
        expect(screen.getByText('Телефони')).toBeInTheDocument();
        expect(screen.getByText('Автомобілі')).toBeInTheDocument();
    });

    it('повинен перемикати на вкладку "Декларації" та завантажувати дані', async () => {
        render(<MarketPage />);
        
        const declarationsTab = screen.getByRole('button', { name: /Декларації/i });
        fireEvent.click(declarationsTab);

        // Перевіряємо заголовок вкладки
        expect(await screen.findByText('Реєстр митних декларацій')).toBeInTheDocument();
        
        // Перевіряємо дані з моків
        expect(await screen.findByText('Company A')).toBeInTheDocument();
        expect(screen.getByText('UA12345')).toBeInTheDocument();
        expect(screen.getByText('Company B')).toBeInTheDocument();
    });

    it('повинен перемикати на вкладку "Конкуренти" та завантажувати дані', async () => {
        render(<MarketPage />);
        
        const competitorsTab = screen.getByRole('button', { name: /Конкуренти/i });
        fireEvent.click(competitorsTab);

        expect(await screen.findByText('Топ конкурентів на ринку')).toBeInTheDocument();
        
        // Перевіряємо дані конкурентів
        expect(await screen.findByText('Competitor X')).toBeInTheDocument();
        expect(screen.getByText('Competitor Y')).toBeInTheDocument();
    });

    it('повинен перемикати на вкладку "Митниця" та відображати графік', async () => {
        render(<MarketPage />);
        
        const customsTab = screen.getByRole('button', { name: /Митниця/i });
        fireEvent.click(customsTab);

        expect(await screen.findByText('Динаміка ЗЕД')).toBeInTheDocument();
        // Перевіряємо, що графік з echarts відрендерився
        expect(screen.getByTestId('echarts-mock')).toBeInTheDocument();
    });
});
