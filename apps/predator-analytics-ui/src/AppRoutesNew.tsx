import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

// Core Views - Immediate imports for main pages
import ActivityView from './views/ActivityView';
import DashboardView from './views/DashboardView';
import IntelligenceView from './views/IntelligenceView';
import OmniscienceView from './views/OmniscienceView';

// Lazy loaded views - Named exports need .then() mapping
const SearchView = lazy(() => import('./views/SearchView').then(m => ({ default: m.SearchView })));
const GraphView = lazy(() => import('./views/GraphView').then(m => ({ default: m.GraphView })));

// Lazy loaded views - Default exports
const ParsersView = lazy(() => import('./views/ParsersView'));
const AnalyticsView = lazy(() => import('./views/AnalyticsView'));
const CasesView = lazy(() => import('./views/CasesView'));
const DatabasesView = lazy(() => import('./views/DatabasesView'));
const MonitoringView = lazy(() => import('./views/MonitoringView'));
const SecurityView = lazy(() => import('./views/SecurityView'));
const LLMView = lazy(() => import('./views/LLMView'));
const DataView = lazy(() => import('./views/DataView'));
const AgentsView = lazy(() => import('./views/AgentsView'));
const DeploymentView = lazy(() => import('./views/DeploymentView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const SovereignGovernanceDashboard = lazy(() => import('./components/super/SovereignGovernanceDashboard'));
const DatasetStudio = lazy(() => import('./views/DatasetStudio'));
const SuperIntelligenceView = lazy(() => import('./views/SuperIntelligenceView'));
const EvolutionView = lazy(() => import('./views/EvolutionView'));
const ComplianceView = lazy(() => import('./views/ComplianceView'));
const CustomsIntelligenceView = lazy(() => import('./views/CustomsIntelligenceView'));
const DocumentsView = lazy(() => import('./views/DocumentsView'));
const NasView = lazy(() => import('./views/NasView'));
const SearchConsole = lazy(() => import('./views/SearchConsole'));
const DashboardBuilderView = lazy(() => import('./views/DashboardBuilderView'));
const CompetitorIntelligenceView = lazy(() => import('./views/CompetitorIntelligenceView'));
const ExecutiveBriefView = lazy(() => import('./views/ExecutiveBriefView'));
const EntityGraphView = lazy(() => import('./views/EntityGraphView'));
const PremiumHubView = lazy(() => import('./views/PremiumHubView'));
const KnowledgeEngineeringView = lazy(() => import('./views/KnowledgeEngineeringView'));
const AutonomyDashboard = lazy(() => import('./views/AutonomyDashboard'));
const ComponentsRegistryView = lazy(() => import('./views/ComponentsRegistryView'));

// Premium Commercial Views
const CustomsIntelligencePremium = lazy(() => import('./views/CustomsIntelligencePremium'));
const DashboardBuilderPremium = lazy(() => import('./views/DashboardBuilderPremium'));
const MarketAnalyticsPremium = lazy(() => import('./views/MarketAnalyticsPremium'));
const RiskScoringPremium = lazy(() => import('./views/RiskScoringPremium'));
const SupplierDiscoveryPremium = lazy(() => import('./views/SupplierDiscoveryPremium'));
const TradeFlowMapPremium = lazy(() => import('./views/TradeFlowMapPremium'));
const AdvancedChartsPremium = lazy(() => import('./views/AdvancedChartsPremium'));
const AlertCenterPremium = lazy(() => import('./views/AlertCenterPremium'));
const PriceComparisonPremium = lazy(() => import('./views/PriceComparisonPremium'));
const MobileCommandCenter = lazy(() => import('./views/MobileCommandCenter'));
const ApiDocumentationView = lazy(() => import('./views/ApiDocumentationView'));
const RealTimeDashboard = lazy(() => import('./views/RealTimeDashboard'));
const WidgetLibrary = lazy(() => import('./views/WidgetLibrary'));
const SanctionsScreening = lazy(() => import('./views/SanctionsScreening'));
const AIInsightsHub = lazy(() => import('./views/AIInsightsHub'));
const ReportGenerator = lazy(() => import('./views/ReportGenerator'));
const SubscriptionManagement = lazy(() => import('./views/SubscriptionManagement'));
const IntegrationHub = lazy(() => import('./views/IntegrationHub'));
const DataExportCenter = lazy(() => import('./views/DataExportCenter'));
const SovereignObserverView = lazy(() => import('./views/SovereignObserverView'));
const UserAnalyticsDashboard = lazy(() => import('./views/UserAnalyticsDashboard'));
const SystemVerificationSuite = lazy(() => import('./views/SystemVerificationSuite'));
const DataIngestionHub = lazy(() => import('./views/DataIngestionHub'));
const ScenarioModeling = lazy(() => import('./views/ScenarioModeling'));

const DatasetsPage = lazy(() => import('./views/datasets/DatasetsPage'));



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
            <div className="text-emerald-400 font-mono text-xs tracking-[0.5em] animate-pulse mb-1">QUANTUM LINK ESTABLISHED</div>
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

  return (
    <MainLayout>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
          {/* Main Routes */}
          <Route path="/" element={<OmniscienceView />} />
          <Route path="/overview" element={<DashboardView />} />
          <Route path="/news" element={<ActivityView />} />
          <Route path="/trends" element={<ActivityView />} />

          {/* Discovery Routes */}
          <Route path="/search" element={<SearchView />} />
          <Route path="/search-v2" element={<SearchConsole />} />
          <Route path="/documents" element={<DocumentsView />} />
          <Route path="/cases" element={<CasesView />} />
          <Route path="/graph" element={<GraphView />} />

          {/* Data Management */}
          <Route path="/parsers" element={<ParsersView />} />
          <Route path="/ingestion" element={<DataIngestionHub />} />
          <Route path="/data-hub" element={<DataIngestionHub />} />
          <Route path="/data" element={<DataView />} />
          <Route path="/databases" element={<DatabasesView />} />
          <Route path="/datasets" element={<DatasetStudio />} />

          <Route path="/datasets-manager" element={<DatasetsPage />} />


          {/* Analytics & Intelligence */}
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/dashboards" element={<MonitoringView />} />
          <Route path="/intelligence" element={<IntelligenceView />} />
          <Route path="/customs-intel" element={<CustomsIntelligenceView />} />
          <Route path="/llm" element={<LLMView />} />
          <Route path="/llm/nas" element={<NasView />} />
          <Route path="/agents" element={<AgentsView />} />
          <Route path="/super" element={<SuperIntelligenceView />} />
          <Route path="/evolution" element={<EvolutionView />} />

          {/* Premium Routes */}
          <Route path="/premium" element={<PremiumHubView />} />
          <Route path="/premium-hub" element={<PremiumHubView />} />
          <Route path="/builder" element={<DashboardBuilderView />} />
          <Route path="/competitor-intel" element={<CompetitorIntelligenceView />} />
          <Route path="/morning-brief" element={<ExecutiveBriefView />} />
          <Route path="/entity-graph" element={<EntityGraphView />} />
          <Route path="/knowledge" element={<KnowledgeEngineeringView />} />
          <Route path="/autonomy" element={<AutonomyDashboard />} />
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
          <Route path="/reports" element={<ReportGenerator />} />
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
          <Route path="/governance" element={<SovereignGovernanceDashboard />} />
          <Route path="/security" element={<SecurityView />} />
          <Route path="/deployment" element={<DeploymentView />} />
          <Route path="/settings" element={<SettingsView />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AnimatePresence>
      </Suspense>
    </MainLayout>
  );
};
