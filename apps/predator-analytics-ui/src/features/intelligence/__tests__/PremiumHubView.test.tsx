import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PremiumHubView from '../PremiumHubView';
import React from 'react';
import { useAppStore } from '@/store/useAppStore';

// Mock high-level components to avoid deep rendering issues
vi.mock('@/components/AdvancedBackground', () => ({
    AdvancedBackground: () => <div data-testid="advanced-background" />
}));

vi.mock('@/components/CyberGrid', () => ({
    CyberGrid: ({ color }: any) => <div data-testid="cyber-grid" data-color={color} />
}));

vi.mock('@/components/layout/PageTransition', () => ({
    PageTransition: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, icon, breadcrumbs, stats }: any) => (
        <div data-testid="view-header">
            {title}
            <div data-testid="breadcrumbs">{breadcrumbs?.join(' > ')}</div>
            <div data-testid="stats-count">{stats?.length}</div>
        </div>
    )
}));

// Mock all internal widgets to speed up and simplify
vi.mock('@/components/premium/LiveIntelligenceAlerts', () => ({
    LiveIntelligenceAlerts: ({ persona }: any) => <div data-testid="live-alerts">{persona}</div>
}));

vi.mock('@/components/premium/IntelligenceTicker', () => ({
    IntelligenceTicker: () => <div data-testid="intelligence-ticker" />
}));

vi.mock('@/components/GlobalSearchOverlay', () => ({
    GlobalSearchOverlay: ({ isOpen }: any) => isOpen ? <div data-testid="global-search-overlay" /> : null
}));

vi.mock('@/components/premium/Dossier360Explorer', () => ({
    Dossier360Explorer: ({ isOpen }: any) => isOpen ? <div data-testid="dossier-explorer" /> : null
}));

vi.mock('@/components/premium/PredatorChatWidget', () => ({
    PredatorChatWidget: () => <div data-testid="predator-chat" />
}));

// Mock the widgets in overview
vi.mock('@/components/premium/ExecutiveBriefingWidget', () => ({
    ExecutiveBriefingWidget: ({ persona }: any) => <div data-testid="executive-briefing">{persona}</div>
}));

vi.mock('@/components/premium/SmartCalculatorWidget', () => ({
    SmartCalculatorWidget: ({ persona }: any) => <div data-testid="smart-calculator">{persona}</div>
}));

vi.mock('@/components/premium/CustomsAnalyticsWidgets', () => ({
    HSCodeAnalyticsWidget: ({ persona }: any) => <div data-testid="hscode-analytics">{persona}</div>,
    CompetitorRadarWidget: ({ persona }: any) => <div data-testid="competitor-radar">{persona}</div>,
    RiskScoreWidget: ({ persona }: any) => <div data-testid="risk-score">{persona}</div>,
}));

// Mock store
vi.mock('@/store/useAppStore', () => ({
    useAppStore: vi.fn(),
}));

describe('PremiumHubView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        (useAppStore as any).mockReturnValue({
            userRole: 'analyst',
            persona: 'TITAN',
            setPersona: vi.fn(),
        });
    });

    it('повинен відображати HolographicAccessGate, якщо роль "client"', async () => {
        (useAppStore as any).mockReturnValue({
            userRole: 'client',
            persona: 'TITAN',
            setPersona: vi.fn(),
        });

        render(<PremiumHubView />);
        expect(await screen.findByText(/ACCESS/i)).toBeInTheDocument();
        expect(screen.getByText(/RESTRICTED/i)).toBeInTheDocument();
    });

    it('повинен відображати основний контент Хаба для аналітика', () => {
        render(<PremiumHubView />);
        
        // Використовуємо getAllByText бо слово PREMIUM є в заголовку та в хлібних крихтах
        expect(screen.getAllByText(/PREMIUM/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/TITAN/i).length).toBeGreaterThan(0);
        expect(screen.getByTestId('view-header')).toBeInTheDocument();
        expect(screen.getByTestId('live-alerts')).toHaveTextContent('TITAN');
    });

    it('повинен перемикати персони (TITAN -> INQUISITOR)', async () => {
        const setPersona = vi.fn();
        (useAppStore as any).mockReturnValue({
            userRole: 'analyst',
            persona: 'TITAN',
            setPersona,
        });

        render(<PremiumHubView />);
        
        // Шукаємо кнопку саме в перемикачі персон
        const inqBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('INQUISITOR'));
        
        await act(async () => {
            fireEvent.click(inqBtn!);
        });
        
        expect(setPersona).toHaveBeenCalledWith('INQUISITOR');
    });

    it('повинен перемикати вкладки (Overview -> Tactical)', async () => {
        render(<PremiumHubView />);
        
        const tacticalBtn = screen.getByText('ТАКТИКА');
        await act(async () => {
            fireEvent.click(tacticalBtn);
        });
        
        // Перевіримо що кнопка стала активною (має отримати колір відповідно до TITAN - amber)
        expect(tacticalBtn.closest('button')).toHaveClass('text-amber-400');
    });

    it('повинен відкривати глобальний пошук при натисканні Cmd+K або кнопки', async () => {
        render(<PremiumHubView />);
        
        // Шукаємо кнопку з іконкою пошуку
        const searchBtn = screen.getAllByRole('button').find(b => b.querySelector('.lucide-search'));
        
        if (searchBtn) {
            await act(async () => {
                fireEvent.click(searchBtn);
            });
            expect(screen.getByTestId('global-search-overlay')).toBeInTheDocument();
        }

        // Тест Hotkey
        await act(async () => {
            fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
        });
        expect(screen.getByTestId('global-search-overlay')).toBeInTheDocument();
    });

    it('повинен відображати інсайти відповідно до персони', () => {
        (useAppStore as any).mockReturnValue({
            userRole: 'analyst',
            persona: 'SOVEREIGN',
            setPersona: vi.fn(),
        });

        render(<PremiumHubView />);
        
        expect(screen.getByText(/МАКРО-СУВЕРЕН/i)).toBeInTheDocument();
        // В SOVEREIGN є інсайт про ОАЕ
        expect(screen.getByText(/товарообігу з ОАЕ/i)).toBeInTheDocument();
    });
});
