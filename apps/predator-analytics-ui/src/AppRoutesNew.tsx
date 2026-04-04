import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useAppStore } from './store/useAppStore';
import { useUser } from './context/UserContext';
import { UserRole } from './config/roles';

import { LoadingSkeleton } from './components/LoadingSkeleton';
import ActivityView from './features/dashboard/ActivityView';
import DashboardView from './features/dashboard/DashboardView';
import IntelligenceView from './features/intelligence/IntelligenceView';
import OmniscienceView from './features/dashboard/OmniscienceView';
import PredatorV24 from './pages/PredatorV24';

// Lazy loaded views - Named exports need .then() mapping
const SearchPage = lazy(() => import('./features/search/SearchPage'));
const GraphView = lazy(() => import('./features/intelligence/GraphView').then(m => ({ default: m.GraphView })));

// Lazy loaded views - Default exports
const ParsersView = lazy(() => import('./features/platform/ParsersView'));
const AnalyticsView = lazy(() => import('./features/intelligence/AnalyticsView'));
const CasesView = lazy(() => import('./features/intelligence/CasesView'));
const DatabasesView = lazy(() => import('./features/platform/DatabasesView'));
const MonitoringView = lazy(() => import('./features/dashboard/MonitoringView'));
const SecurityView = lazy(() => import('./features/platform/SecurityView'));
const LLMView = lazy(() => import('./features/ai/LLMView'));
const PredictiveNexusView = lazy(() => import('./features/ai/PredictiveNexusView'));
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
const ZradaControlView = lazy(() => import('./features/intelligence/ZradaControlView'));

// Клієнтський арсенал — Газета та Компромат
const NewspaperView = lazy(() => import('./features/newspaper/NewspaperView'));
const ComprompatPersonView = lazy(() => import('./features/newspaper/ComprompatPersonView'));
const FirmDossierView = lazy(() => import('./features/newspaper/FirmDossierView'));
const PowerStructureView = lazy(() => import('./features/newspaper/PowerStructureView'));
const SupplyChainAnalyticsView = lazy(() => import('./features/supply-chain/SupplyChainAnalyticsView'));

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
  const { user } = useUser();
  const effectiveRole = user?.role || UserRole.CLIENT_BASIC;
  const isAdmin = effectiveRole === UserRole.ADMIN;
  const onlyAdmin = (element: JSX.Element) => (isAdmin ? element : <Navigate to="/" replace />);

  return (
    <MainLayout>
      <Suspense fallback={<LoadingSkeleton />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* 🎯 CANONICAL v4.2.0 MODES */}
            <Route path="/" element={<PredatorV24 />} />
            <Route path="/predator-v24" element={<PredatorV24 />} />
            <Route path="/overview" element={<DashboardView />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/diligence" element={<DiligencePage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/company/:id/cers" element={<CompanyCERSDashboard />} />
            <Route path="/clients" element={<ClientsHubView />} />
            <Route path="/clients/:segment" element={<ClientSegmentView />} />

            {/* Legacy Dashboard Routes */}
            <Route path="/omni" element={<OmniscienceView />} />
            <Route path="/news" element={<ActivityView />} />
            <Route path="/trends" element={<ActivityView />} />

            {/* Discovery Routes */}
            <Route path="/search" element={<SearchPage />} />
            <Route path="/search-v2" element={<SearchConsole />} />
            <Route path="/documents" element={<DocumentsView />} />
            <Route path="/cases" element={<CasesView />} />
            <Route path="/graph" element={<GraphAnalyticsPage />} />
            <Route path="/tenders" element={<TendersView />} />
            <Route path="/datagov" element={<DataGovView />} />
            <Route path="/maritime" element={<MaritimeView />} />
            <Route path="/registries" element={<RegistriesView />} />

            {/* Data Management */}
            <Route path="/parsers" element={onlyAdmin(<ParsersView />)} />
            <Route path="/ingestion" element={onlyAdmin(<DataIngestionHub />)} />
            <Route path="/data-hub" element={onlyAdmin(<DataIngestionHub />)} />
            <Route path="/data" element={onlyAdmin(<DataView />)} />
            <Route path="/databases" element={onlyAdmin(<DatabasesView />)} />
            <Route path="/datasets" element={onlyAdmin(<DatasetStudio />)} />
            <Route path="/sr" element={effectiveRole === UserRole.ADMIN ? <SRView /> : <Navigate to="/overview" replace />} />
            <Route path="/azr" element={effectiveRole === UserRole.ADMIN ? <SRView /> : <Navigate to="/overview" replace />} />

            <Route path="/datasets-manager" element={onlyAdmin(<DatasetsPage />)} />


            {/* Analytics & Intelligence */}
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/dashboards" element={<MonitoringView />} />
            <Route path="/intelligence" element={<IntelligenceView />} />
            <Route path="/customs-intel" element={<CustomsIntelligenceView />} />
            <Route path="/nexus" element={<PredictiveNexusView />} />
            <Route path="/forecast-view" element={<ForecastView />} />
            <Route path="/aml" element={<AMLScoringView />} />
            <Route path="/llm" element={onlyAdmin(<LLMView />)} />
            <Route path="/llm/nas" element={onlyAdmin(<NasView />)} />
            <Route path="/agents" element={<AgentsView />} />
            <Route path="/pipeline" element={onlyAdmin(<PipelineManagerView />)} />
            <Route path="/training" element={onlyAdmin(<ModelTrainingView />)} />
            <Route path="/engines" element={onlyAdmin(<EnginesView />)} />
            <Route path="/llm/prompts" element={onlyAdmin(<SystemPromptsView />)} />
            <Route path="/super" element={onlyAdmin(<SuperIntelligenceView />)} />
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
            <Route path="/factory-studio" element={onlyAdmin(<FactoryStudio />)} />
            <Route path="/system-factory" element={onlyAdmin(<SystemFactoryView />)} />
            <Route path="/components" element={onlyAdmin(<ComponentsRegistryView />)} />

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

            {/* Admin & System */}
            <Route path="/admin" element={<MonitoringView />} />
            <Route path="/compliance" element={<ComplianceView />} />
            <Route path="/monitoring" element={<MonitoringView />} />
            <Route path="/referral-control" element={<ReferralControlView />} />
            <Route path="/zrada-control" element={<ZradaControlView />} />
            <Route path="/admin/ai-control" element={onlyAdmin(<AIControlPlane />)} />
            <Route path="/admin/security" element={<SovereignGovernanceDashboard />} />
            <Route path="/governance" element={onlyAdmin(<SovereignGovernanceDashboard />)} />
            <Route path="/security" element={<SecurityView />} />
            <Route path="/deployment" element={onlyAdmin(<DeploymentView />)} />
            <Route path="/settings" element={<SettingsView />} />

            {/* Клієнтський арсенал — нові маршрути v56.1.4 */}
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
