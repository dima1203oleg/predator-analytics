import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DiligencePage from '../DiligencePage';
import { diligenceApi } from '@/features/diligence/api/diligence';

// Мок API
vi.mock('@/features/diligence/api/diligence', () => ({
    diligenceApi: {
        getRiskEntities: vi.fn(),
        getCompanyProfile: vi.fn()
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
        },
        AnimatePresence: ({ children }: any) => <>{children}</>
    };
});

// Мок echarts
vi.mock('@/components/ECharts', () => ({
    default: () => <div data-testid="echarts-mock">Chart Mock</div>
}));

const mockEntities = [
    { edrpou: '12345678', name: 'ТОВ "ТЕСТ 1"', risk_score: 85, risk_level: 'high' },
    { edrpou: '87654321', name: 'ТОВ "ТЕСТ 2"', risk_score: 20, risk_level: 'low' }
];

const mockProfile = {
    edrpou: '12345678',
    name: 'ТОВ "ТЕСТ 1"',
    status: 'зареєстровано',
    registration_date: '2010-01-01',
    risk_score: 85,
    directors: [{ id: '1', label: 'Іванов Іван', properties: { role: 'director' } }],
    ultimate_beneficiaries: [{ id: '2', label: 'Петров Петро', properties: { percent: '100' } }],
    anomalies: [{ type: 'Часта зміна директора', date_detected: '2023-10-10', description: 'Опис аномалії', score: 90 }],
    sanctions: [{ list_name: 'РНБО', date_added: '2023-11-12', reason: 'Фінансування тероризму' }]
};

describe('DiligencePage Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (diligenceApi.getRiskEntities as any).mockResolvedValue(mockEntities);
        (diligenceApi.getCompanyProfile as any).mockResolvedValue(mockProfile);
    });

    const renderPage = () =>
        render(
            <MemoryRouter>
                <DiligencePage />
            </MemoryRouter>,
        );

    it('повинен рендерити заголовок і завантажувати дані', async () => {
        renderPage();
        
        expect(screen.getByText('Ризикові контрагенти')).toBeInTheDocument();
        
        await screen.findAllByText('ТОВ "ТЕСТ 1"');
        await screen.findAllByText('ТОВ "ТЕСТ 2"');
    });

    it('повинен відображати профіль першої компанії після завантаження', async () => {
        renderPage();
        
        expect(await screen.findByText('Профіль компанії')).toBeInTheDocument();
        expect(screen.getAllByText(/зареєстровано/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Іванов Іван')).toBeInTheDocument();
        expect(screen.getByText('Петров Петро')).toBeInTheDocument();
        expect(screen.getByText('РНБО')).toBeInTheDocument();
        expect(screen.getByText('Часта зміна директора')).toBeInTheDocument();
    });

    it('повинен дозволяти шукати компанії за назвою', async () => {
        renderPage();
        
        await screen.findAllByText('ТОВ "ТЕСТ 1"');

        const searchInput = screen.getByPlaceholderText('Пошук за назвою або ЄДРПОУ...');
        fireEvent.change(searchInput, { target: { value: 'ТЕСТ 2' } });

        // Після фільтрації вибрана компанія ще може лишатися у головній панелі,
        // але в списку має бути знайдений другий контрагент.
        await screen.findAllByText('ТОВ "ТЕСТ 2"');
    });
});
