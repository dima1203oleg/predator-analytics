import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PremiumHubView from '../PremiumHubView';
import React from 'react';
import { UserRole } from '@/config/roles';
import { useAppStore } from '@/store/useAppStore';

// ─── MOCKS ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return new Proxy(actual, {
        get: (target, prop) => {
            if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
                return (props: any) => <span data-testid={`icon-${prop.toLowerCase()}`} {...props} />;
            }
            return target[prop];
        }
    });
});

vi.mock('@/store/useAppStore', () => ({
    useAppStore: () => ({
        userRole: 'analyst',
        persona: 'TITAN',
        setPersona: vi.fn()
    }),
    InterlinkPersona: {}
}));

vi.mock('@/hooks/useBackendStatus', () => ({
    useBackendStatus: () => ({
        isOffline: false,
        nodeSource: 'NVIDIA_PRIMARY'
    })
}));

vi.mock('@/components/AdvancedBackground', () => ({ AdvancedBackground: () => <div data-testid="advanced-bg" /> }));
vi.mock('@/components/CyberGrid', () => ({ CyberGrid: () => <div data-testid="cyber-grid" /> }));
vi.mock('@/components/ViewHeader', () => ({
    ViewHeader: ({ title, stats, badges }: any) => (
        <div data-testid="view-header">
            <div data-testid="header-title">{title}</div>
            <div data-testid="stats-list">{stats?.map((s: any) => s.label).join(', ')}</div>
            <div data-testid="badges-list">{badges?.map((b: any) => b.label).join(', ')}</div>
        </div>
    )
}));

// Mock leaf widgets
vi.mock('@/components/premium/LiveIntelligenceAlerts', () => ({ LiveIntelligenceAlerts: () => <div data-testid="live-alerts" /> }));
vi.mock('@/components/premium/IntelligenceTicker', () => ({ IntelligenceTicker: () => <div data-testid="intel-ticker" /> }));
vi.mock('@/components/GlobalSearchOverlay', () => ({ GlobalSearchOverlay: () => <div data-testid="search-overlay" /> }));
vi.mock('@/components/premium/Dossier360Explorer', () => ({ Dossier360Explorer: () => <div data-testid="dossier-explorer" /> }));
vi.mock('@/components/premium/PredatorChatWidget', () => ({ PredatorChatWidget: () => <div data-testid="predator-chat" /> }));
vi.mock('@/components/premium/ExecutiveBriefingWidget', () => ({ ExecutiveBriefingWidget: () => <div data-testid="exec-briefing" /> }));
vi.mock('@/components/premium/SmartCalculatorWidget', () => ({ SmartCalculatorWidget: () => <div data-testid="smart-calc" /> }));
vi.mock('@/components/premium/CustomsAnalyticsWidgets', () => ({ 
    HSCodeAnalyticsWidget: () => <div data-testid="hscode-widget" />,
    CompetitorRadarWidget: () => <div data-testid="competitor-radar" />,
    RiskScoreWidget: () => <div data-testid="risk-score-widget" />
}));
vi.mock('@/components/premium/SupplyChainRadarWidget', () => ({ SupplyChainRadarWidget: () => <div data-testid="supply-chain-radar" /> }));
vi.mock('@/components/premium/CompetitorWarBoardWidget', () => ({ CompetitorWarBoardWidget: () => <div data-testid="war-board" /> }));
vi.mock('@/components/premium/TacticalVoiceCommWidget', () => ({ TacticalVoiceCommWidget: () => <div data-testid="voice-comm" /> }));
vi.mock('@/components/premium/NeuralAutomationWidget', () => ({ NeuralAutomationWidget: () => <div data-testid="automation-widget" /> }));
vi.mock('@/components/premium/SignalsFeedWidget', () => ({ SignalsFeedWidget: () => <div data-testid="signals-feed" /> }));
vi.mock('@/components/premium/AIInsightsPanel', () => ({ AIInsightsPanel: () => <div data-testid="ai-insights" /> }));
vi.mock('@/components/premium/TradeSankeyWidget', () => ({ TradeSankeyWidget: () => <div data-testid="sankey-widget" /> }));
vi.mock('@/components/layout/PageTransition', () => ({ PageTransition: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/ui/badge', () => ({ Badge: ({ children, className }: any) => <div className={className}>{children}</div> }));

// ─── TESTS ───────────────────────────────────────────────────────────────────

describe('PremiumHubView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('відображає інтерфейс преміум-хабу та завантажує віджети TITAN', () => {
        render(<PremiumHubView />);
        
        expect(screen.getByText(/П ЕМІУМ/i)).toBeInTheDocument();
        expect(screen.getByText(/TITAN/i)).toBeInTheDocument();
        expect(screen.getByTestId('live-alerts')).toBeInTheDocument();
        expect(screen.getByTestId('exec-briefing')).toBeInTheDocument();
    });

    it('ініціює PREMIUM_SUCCESS при активації хабу', async () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<PremiumHubView />);
        
        await waitFor(() => {
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        code: 'PREMIUM_SUCCESS'
                    })
                })
            );
        });
    });

    it('відображає HolographicAccessGate для базових користувачів', () => {
        vi.mocked(useAppStore).mockReturnValue({
            userRole: UserRole.CLIENT_BASIC,
            persona: 'TITAN',
            setPersona: vi.fn()
        } as any);

        render(<PremiumHubView />);
        
        expect(screen.getByText(/ДОСТУП ОБМЕЖЕНО/i)).toBeInTheDocument();
        expect(screen.getByText(/ ИНКОВИЙ ТИТАН/i)).toBeInTheDocument();
    });

    it('перемикає вкладки хабу (Tactical, Analytics)', () => {
        render(<PremiumHubView />);
        
        // Tactical tab
        const tacticalTab = screen.getByText(/ТАКТИКА/i);
        fireEvent.click(tacticalTab);
        expect(screen.getByTestId('supply-chain-radar')).toBeInTheDocument();
        expect(screen.getByTestId('war-board')).toBeInTheDocument();

        // Analytics tab
        const analyticsTab = screen.getByText(/АНАЛІТИКА/i);
        fireEvent.click(analyticsTab);
        expect(screen.getByTestId('ai-insights')).toBeInTheDocument();
    });

    it('відображає MIRROR_NODE в автономному режимі', () => {
        vi.mock('@/hooks/useBackendStatus', () => ({
            useBackendStatus: () => ({ 
                isOffline: true, 
                nodeSource: 'MIRROR_CLUSTER'
            })
        }));

        render(<PremiumHubView />);
        
        expect(screen.getByText(/MIRROR_NODE/i)).toBeInTheDocument();
    });
});
