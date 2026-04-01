import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, type ReactNode } from 'react';
import { CreditCard, Lock, ShieldAlert } from 'lucide-react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useUser } from './context/UserContext';
import { getRoleDisplayName, UserRole } from './config/roles';
import { getNavigationAccessState } from './config/navigation';

import { LoadingSkeleton } from './components/LoadingSkeleton';
import ActivityView from './features/dashboard/ActivityView';
import DashboardView from './features/dashboard/DashboardView';
import IntelligenceView from './features/intelligence/IntelligenceView';
import MvpCommandCenter from './pages/MvpCommandCenter';

// Lazy loaded views - Named exports need .then() mapping
const SearchView = lazy(() => import('./features/osint/SearchView').then(m => ({ default: m.SearchView })));
const GraphView = lazy(() => import('./features/intelligence/GraphView').then(m => ({ default: m.GraphView })));

// Lazy loaded views - Default exports
const ParsersView = lazy(() => import('./features/platform/ParsersView'));
const AnalyticsView = lazy(() => import('./features/intelligence/AnalyticsView'));
const CasesView = lazy(() => import('./features/intelligence/CasesView'));
const DatabasesView = lazy(() => import('./features/platform/DatabasesView'));
const MonitoringView = lazy(() => import('./features/dashboard/MonitoringView'));
const OmniscienceView = lazy(() => import('./features/dashboard/OmniscienceView'));
const SecurityView = lazy(() => import('./features/platform/SecurityView'));
const LLMView = lazy(() => import('./features/ai/LLMView'));
const DataView = lazy(() => import('./features/platform/DataView'));
const AgentsView = lazy(() => import('./features/platform/AgentsView'));
const DeploymentView = lazy(() => import('./features/platform/DeploymentView'));
const SettingsView = lazy(() => import('./features/platform/SettingsView'));
const SRView = lazy(() => import('./features/platform/SRView'));
const ClientSegmentView = lazy(() => import('./features/clients/ClientSegmentView'));
const ClientsHubView = lazy(() => import('./features/clients/ClientsHubView'));
const SovereignGovernanceDashboard = lazy(() => import('./components/super/SovereignGovernanceDashboard'));
const DatasetStudio = lazy(() => import('./features/platform/DatasetStudio'));
const SuperIntelligenceView = lazy(() => import('./features/ai/SuperIntelligenceView'));
const EvolutionView = lazy(() => import('./features/intelligence/EvolutionView'));
const ComplianceView = lazy(() => import('./features/intelligence/ComplianceView'));
const CustomsIntelligenceView = lazy(() => import('./features/intelligence/CustomsIntelligenceView'));
const DocumentsView = lazy(() => import('./features/osint/DocumentsView'));
const NasView = lazy(() => import('./features/ai/NasView'));
const SearchConsole = lazy(() => import('./features/osint/SearchConsole'));
const DashboardBuilderView = lazy(() => import('./features/dashboard/DashboardBuilderView'));
const CompetitorIntelligenceView = lazy(() => import('./features/intelligence/CompetitorIntelligenceView'));
const ExecutiveBriefView = lazy(() => import('./features/dashboard/ExecutiveBriefView'));
const EntityGraphView = lazy(() => import('./features/intelligence/EntityGraphView'));
const PremiumHubView = lazy(() => import('./features/intelligence/PremiumHubView'));
const KnowledgeEngineeringView = lazy(() => import('./features/ai/KnowledgeEngineeringView'));
const DecisionIntelligenceView = lazy(() => import('./features/decision').then(m => ({ default: m.DecisionIntelligenceView })));
const AutonomyDashboard = lazy(() => import('./features/platform/AutonomyDashboard'));
const ComponentsRegistryView = lazy(() => import('./features/platform/ComponentsRegistryView'));
const PipelineManagerView = lazy(() => import('./features/platform/PipelineManagerView'));
const EntityRadarView = lazy(() => import('./features/intelligence/EntityRadarView'));
const TendersView = lazy(() => import('./features/osint/TendersView'));
const DataGovView = lazy(() => import('./features/osint/DataGovView'));
const MaritimeView = lazy(() => import('./features/osint/MaritimeView'));
const RegistriesView = lazy(() => import('./features/osint/RegistriesView'));
const GraphAnalyticsPage = lazy(() => import('./features/intelligence/GraphAnalyticsPage'));
const ReportBuilderPage = lazy(() => import('./features/reports/ReportBuilderPage'));
const AMLScoringView = lazy(() => import('./features/intelligence/AMLScoringView'));


// Premium Commercial Views
const CustomsIntelligencePremium = lazy(() => import('./features/intelligence/CustomsIntelligencePremium'));
const DashboardBuilderPremium = lazy(() => import('./features/dashboard/DashboardBuilderPremium'));
const MarketAnalyticsPremium = lazy(() => import('./features/intelligence/MarketAnalyticsPremium'));
const RiskScoringPremium = lazy(() => import('./features/intelligence/RiskScoringPremium'));
const SupplierDiscoveryPremium = lazy(() => import('./features/intelligence/SupplierDiscoveryPremium'));
const TradeFlowMapPremium = lazy(() => import('./features/intelligence/TradeFlowMapPremium'));
const AdvancedChartsPremium = lazy(() => import('./features/intelligence/AdvancedChartsPremium'));
const AlertCenterPremium = lazy(() => import('./features/platform/AlertCenterPremium'));
const PriceComparisonPremium = lazy(() => import('./features/intelligence/PriceComparisonPremium'));
const MobileCommandCenter = lazy(() => import('./features/dashboard/MobileCommandCenter'));
const ApiDocumentationView = lazy(() => import('./features/reports/ApiDocumentationView'));
const RealTimeDashboard = lazy(() => import('./features/dashboard/RealTimeDashboard'));
const WidgetLibrary = lazy(() => import('./features/platform/WidgetLibrary'));
const SanctionsScreening = lazy(() => import('./features/intelligence/SanctionsScreening'));
const AIInsightsHub = lazy(() => import('./features/ai/AIInsightsHub'));
const ReportGenerator = lazy(() => import('./features/reports/ReportGenerator'));
const SubscriptionManagement = lazy(() => import('./features/platform/SubscriptionManagement'));
const IntegrationHub = lazy(() => import('./features/platform/IntegrationHub'));
const DataExportCenter = lazy(() => import('./features/platform/DataExportCenter'));
const SovereignObserverView = lazy(() => import('./features/dashboard/SovereignObserverView'));
const UserAnalyticsDashboard = lazy(() => import('./features/platform/UserAnalyticsDashboard'));
const SystemVerificationSuite = lazy(() => import('./features/dashboard/SystemVerificationSuite'));
const DataIngestionHub = lazy(() => import('./features/platform/DataIngestionHub'));
const ScenarioModeling = lazy(() => import('./features/intelligence/ScenarioModeling'));
const ForecastView = lazy(() => import('./features/ai/ForecastView'));
const ReferralControlView = lazy(() => import('./features/intelligence/ReferralControlView'));

// Клієнтський арсенал — Газета та Компромат
const NewspaperView = lazy(() => import('./features/newspaper/NewspaperView'));
const ComprompatPersonView = lazy(() => import('./features/newspaper/ComprompatPersonView'));
const FirmDossierView = lazy(() => import('./features/newspaper/FirmDossierView'));
const PowerStructureView = lazy(() => import('./features/newspaper/PowerStructureView'));
const SupplyChainAnalyticsView = lazy(() => import('./features/supply-chain/SupplyChainAnalyticsView'));
const ProcurementOptimizer = lazy(() => import('./components/business/ProcurementOptimizer'));
const BillingManager = lazy(() => import('./components/billing/BillingManager'));
const ExecutionCenter = lazy(() => import('./components/execution/ExecutionCenter'));
const EmptyState = lazy(() => import('./components/empty-state/EmptyState'));

// ТЗ 11.1 Premium Components - New imports
const ExecutionCenterV2 = lazy(() => import('./components/execution/ExecutionCenterV2'));
const MarketIntelligencePremium = lazy(() => import('./components/premium/MarketIntelligencePremium'));
const SupplierDiscoveryPremiumView = lazy(() => import('./components/premium/SupplierDiscoveryPremium'));
const ScenarioBuilderView = lazy(() => import('./components/premium/ScenarioBuilder'));
const RiskDashboardView = lazy(() => import('./components/premium/RiskDashboard'));

// Canonical v4.2.0 Pages
const MarketPage = lazy(() => import('./pages/MarketPage'));
const ForecastPage = lazy(() => import('./pages/ForecastPage'));
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const DiligencePage = lazy(() => import('./pages/DiligencePage'));
const CompanyCERSDashboard = lazy(() => import('./pages/CompanyCERSDashboard'));

const DatasetsPage = lazy(() => import('./features/platform/datasets/DatasetsPage'));
const AutoFactoryView = lazy(() => import('./features/ai/AutoFactoryView'));
const ModelTrainingView = lazy(() => import('./features/ai/ModelTrainingView'));
const EnginesView = lazy(() => import('./features/ai/EnginesView'));
const FactorsView = lazy(() => import('./features/factors/FactorsView'));
const FactoryStudio = lazy(() => import('./features/factory/FactoryStudio'));
const SystemFactoryView = lazy(() => import('./features/factory/SystemFactoryView'));
const SystemPromptsView = lazy(() => import('./features/ai/SystemPromptsView'));
const AIControlPlane = lazy(() => import('./features/ai/AIControlPlane'));


const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-slate-950 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] animate-pulse" />
    <div className="flex flex-col items-center gap-6 relative z-10">
      <div className="relative">
        <div className="w-24 h-24 border-2 border-emerald-500/20 rounded-full" />
        <div className="absolute inset-0 w-24 h-24 border-t-2 border-emerald-400 rounded-full animate-spin" />
        <div className="absolute inset-2 w-20 h-20 border-r-2 border-cyan-400 rounded-full animate-spin [animation-duration:3s]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full animate-ping" />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-emerald-400 font-mono text-xs tracking-[0.5em] animate-pulse mb-1">КВАНТОВИЙ ЗВ'ЯЗОК ВСТАНОВЛЕНО</div>
        <div className="text-white font-black text-2xl tracking-tighter flex gap-1">
          {["P", "R", "E", "D", "A", "T", "O", "R"].map((char, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
    {/* Background Grid */}
    <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
  </div>
);

export const AppRoutesNew = () => {
  const location = useLocation();
  const { canonicalRole, canonicalTier } = useUser();
  const effectiveRole = canonicalRole || UserRole.VIEWER;
  const tierLabel = canonicalTier === 'enterprise' ? 'Корпоративний' : canonicalTier === 'pro' ? 'Про' : 'Базовий';

  const AccessFallback = ({ state }: { state: 'upgrade' | 'forbidden' }) => (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-[32px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,17,29,0.96),rgba(5,13,23,0.96))] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.38)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/[0.08] bg-white/[0.04]">
          {state === 'upgrade' ? (
            <CreditCard className="h-7 w-7 text-cyan-300" />
          ) : (
            <ShieldAlert className="h-7 w-7 text-rose-300" />
          )}
        </div>

        <h2 className="mt-6 text-3xl font-black text-white">
          {state === 'upgrade'
            ? 'Цей сценарій недоступний на поточному тарифі'
            : 'Поточна роль не має доступу до цього сценарію'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          {state === 'upgrade'
            ? `Ваша роль "${getRoleDisplayName(canonicalRole)}" підтримує цей напрямок, але тариф "${tierLabel}" не включає потрібні можливості.`
            : `Роль "${getRoleDisplayName(canonicalRole)}" не входить до контуру доступу для цього маршруту.`}
        </p>

        <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-black/20 p-4 text-sm leading-6 text-slate-300">
          Доступ у Predator Analytics визначається як <span className="font-bold text-white">Роль ∩ тариф</span>.
          Це означає, що маршрут має бути дозволений і роллю, і тарифом одночасно.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {state === 'upgrade' && (
            <Link
              to="/billing"
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              <CreditCard className="h-4 w-4" />
              Перейти до тарифів
            </Link>
          )}
          <Link
            to="/getting-started"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            <Lock className="h-4 w-4" />
            Відкрити швидкий старт
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15"
          >
            Повернутись до командного центру
          </Link>
        </div>
      </div>
    </div>
  );

  const ProtectedNavigationRoute = ({
    path,
    children,
  }: {
    path: string;
    children: ReactNode;
  }) => {
    const accessState = getNavigationAccessState(path, canonicalRole, canonicalTier);

    if (accessState === 'upgrade' || accessState === 'forbidden') {
      return <AccessFallback state={accessState} />;
    }

    return <>{children}</>;
  };

  return (
    <MainLayout>
      <Suspense fallback={<LoadingSkeleton />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* 🎯 CANONICAL v4.2.0 MODES */}
            <Route path="/" element={<MvpCommandCenter />} />
            <Route path="/predator-v24" element={<MvpCommandCenter />} />
            <Route path="/overview" element={<DashboardView />} />
            <Route path="/market" element={<ProtectedNavigationRoute path="/market"><MarketPage /></ProtectedNavigationRoute>} />
            <Route path="/forecast" element={<ProtectedNavigationRoute path="/forecast"><ForecastPage /></ProtectedNavigationRoute>} />
            <Route path="/diligence" element={<ProtectedNavigationRoute path="/diligence"><DiligencePage /></ProtectedNavigationRoute>} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/company/:id/cers" element={<CompanyCERSDashboard />} />
            <Route path="/clients" element={<ClientsHubView />} />
            <Route path="/clients/:segment" element={<ClientSegmentView />} />
            <Route
              path="/getting-started"
              element={
                <EmptyState
                  type="no-data"
                  onStartDemo={() => (window.location.href = '/procurement-optimizer')}
                  onUploadData={() => (window.location.href = '/billing')}
                  onConnectAPI={() => (window.location.href = '/billing')}
                />
              }
            />
            <Route
              path="/demo-completed"
              element={
                <EmptyState
                  type="demo-completed"
                  onStartDemo={() => (window.location.href = '/procurement-optimizer')}
                  onUploadData={() => (window.location.href = '/billing')}
                />
              }
            />

            {/* Legacy Dashboard Routes */}
            <Route path="/omni" element={<OmniscienceView />} />
            <Route path="/news" element={<ActivityView />} />
            <Route path="/trends" element={<ActivityView />} />

            {/* Discovery Routes */}
            <Route path="/search" element={<SearchView />} />
            <Route path="/search-v2" element={<SearchConsole />} />
            <Route path="/documents" element={<DocumentsView />} />
            <Route path="/cases" element={<CasesView />} />
            <Route path="/graph" element={<GraphAnalyticsPage />} />
            <Route path="/tenders" element={<TendersView />} />
            <Route path="/datagov" element={<DataGovView />} />
            <Route path="/maritime" element={<MaritimeView />} />
            <Route path="/registries" element={<RegistriesView />} />

            {/* Data Management */}
            <Route path="/parsers" element={<ParsersView />} />
            <Route path="/ingestion" element={<DataIngestionHub />} />
            <Route path="/data-hub" element={<DataIngestionHub />} />
            <Route path="/data" element={<DataView />} />
            <Route path="/databases" element={<DatabasesView />} />
            <Route path="/datasets" element={<DatasetStudio />} />
            <Route path="/sr" element={effectiveRole === UserRole.ADMIN ? <SRView /> : <Navigate to="/overview" replace />} />
            <Route path="/azr" element={effectiveRole === UserRole.ADMIN ? <SRView /> : <Navigate to="/overview" replace />} />

            <Route path="/datasets-manager" element={<DatasetsPage />} />


            {/* Analytics & Intelligence */}
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/dashboards" element={<MonitoringView />} />
            <Route path="/intelligence" element={<IntelligenceView />} />
            <Route path="/decision-intelligence" element={<DecisionIntelligenceView />} />
            <Route path="/customs-intel" element={<CustomsIntelligenceView />} />
            <Route path="/forecast-view" element={<ForecastView />} />
            <Route path="/aml" element={<AMLScoringView />} />
            <Route path="/llm" element={<LLMView />} />
            <Route path="/llm/nas" element={<NasView />} />
            <Route path="/agents" element={<AgentsView />} />
            <Route path="/pipeline" element={<PipelineManagerView />} />
            <Route path="/training" element={<ModelTrainingView />} />
            <Route path="/engines" element={<EnginesView />} />
            <Route path="/llm/prompts" element={<SystemPromptsView />} />
            <Route path="/super" element={<SuperIntelligenceView />} />
            <Route path="/evolution" element={<EvolutionView />} />

            {/* Premium Routes */}
            <Route path="/premium" element={<PremiumHubView />} />
            <Route path="/premium-hub" element={<PremiumHubView />} />
            <Route path="/builder" element={<DashboardBuilderView />} />
            <Route path="/competitor-intel" element={<CompetitorIntelligenceView />} />
            <Route path="/competitor-radar" element={<EntityRadarView />} />
            <Route path="/morning-brief" element={<ExecutiveBriefView />} />

            <Route path="/entity-graph" element={<GraphAnalyticsPage />} />
            <Route path="/knowledge" element={<KnowledgeEngineeringView />} />
            <Route path="/autonomy" element={effectiveRole === UserRole.ADMIN ? <AutonomyDashboard /> : <Navigate to="/overview" replace />} />
            <Route path="/factory" element={<FactorsView />} />
            <Route path="/factory-studio" element={<FactoryStudio />} />
            <Route path="/system-factory" element={<SystemFactoryView />} />
            <Route path="/components" element={<ComponentsRegistryView />} />

            {/* Premium Commercial Intelligence */}
            <Route path="/customs-premium" element={<CustomsIntelligencePremium />} />
            <Route path="/builder-premium" element={<DashboardBuilderPremium />} />
            <Route path="/market-analytics" element={<MarketAnalyticsPremium />} />
            <Route path="/risk-scoring" element={<RiskScoringPremium />} />
            <Route path="/suppliers" element={<SupplierDiscoveryPremium />} />
            <Route path="/trade-map" element={<TradeFlowMapPremium />} />
            <Route path="/charts" element={<AdvancedChartsPremium />} />
            <Route path="/alerts" element={<AlertCenterPremium />} />
            <Route path="/price-compare" element={<PriceComparisonPremium />} />
            <Route path="/mobile" element={<MobileCommandCenter />} />
            <Route path="/api-docs" element={<ApiDocumentationView />} />
            <Route path="/realtime" element={<RealTimeDashboard />} />
            <Route path="/widgets" element={<WidgetLibrary />} />
            <Route path="/sanctions" element={<SanctionsScreening />} />
            <Route path="/ai-insights" element={<AIInsightsHub />} />
            <Route path="/reports" element={<ReportBuilderPage />} />
            <Route path="/subscription" element={<SubscriptionManagement />} />
            <Route path="/integrations" element={<IntegrationHub />} />
            <Route path="/export" element={<DataExportCenter />} />
            <Route path="/som" element={<SovereignObserverView />} />
            <Route path="/user-analytics" element={<UserAnalyticsDashboard />} />
            <Route path="/verify-system" element={<SystemVerificationSuite />} />
            <Route path="/modeling" element={<ScenarioModeling />} />
            <Route
              path="/procurement-optimizer"
              element={
                <ProtectedNavigationRoute path="/procurement-optimizer">
                  <ProcurementOptimizer />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/scenario/import"
              element={
                <ProtectedNavigationRoute path="/scenario/import">
                  <ProcurementOptimizer />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/scenario/counterparty"
              element={
                <ProtectedNavigationRoute path="/scenario/counterparty">
                  <DiligencePage />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/scenario/market"
              element={
                <ProtectedNavigationRoute path="/scenario/market">
                  <MarketPage />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/scenario-progress"
              element={
                <ProtectedNavigationRoute path="/scenario-progress">
                  <ExecutionCenter />
                </ProtectedNavigationRoute>
              }
            />
            <Route path="/execution-center" element={<Navigate to="/scenario-progress" replace />} />
            <Route
              path="/billing"
              element={
                <ProtectedNavigationRoute path="/billing">
                  <BillingManager />
                </ProtectedNavigationRoute>
              }
            />

            {/* ТЗ 11.1 Premium Components - New Routes */}
            <Route
              path="/execution-center-v2"
              element={
                <ProtectedNavigationRoute path="/execution-center-v2">
                  <ExecutionCenterV2 />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/market-intelligence"
              element={
                <ProtectedNavigationRoute path="/market-intelligence">
                  <MarketIntelligencePremium />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/supplier-discovery-v2"
              element={
                <ProtectedNavigationRoute path="/supplier-discovery-v2">
                  <SupplierDiscoveryPremiumView />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/scenario-builder"
              element={
                <ProtectedNavigationRoute path="/scenario-builder">
                  <ScenarioBuilderView />
                </ProtectedNavigationRoute>
              }
            />
            <Route
              path="/risk-dashboard"
              element={
                <ProtectedNavigationRoute path="/risk-dashboard">
                  <RiskDashboardView />
                </ProtectedNavigationRoute>
              }
            />

            {/* Admin & System */}
            <Route path="/admin" element={<MonitoringView />} />
            <Route path="/compliance" element={<ComplianceView />} />
            <Route path="/monitoring" element={<MonitoringView />} />
            <Route path="/referral-control" element={<ReferralControlView />} />
            <Route path="/admin/ai-control" element={<AIControlPlane />} />
            <Route path="/admin/security" element={<SovereignGovernanceDashboard />} />
            <Route path="/governance" element={<SovereignGovernanceDashboard />} />
            <Route path="/security" element={<SecurityView />} />
            <Route path="/deployment" element={<DeploymentView />} />
            <Route path="/settings" element={<SettingsView />} />

            {/* Клієнтський арсенал — нові маршрути v55.1 */}
            <Route path="/newspaper" element={<NewspaperView />} />
            <Route path="/compromat-person" element={<ComprompatPersonView />} />
            <Route path="/compromat-firm" element={<FirmDossierView />} />
            <Route path="/power-structure" element={<PowerStructureView />} />
            <Route path="/supply-chain" element={<SupplyChainAnalyticsView />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </MainLayout>
  );
};
