import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import { AdminGuard } from './components/guards/AdminGuard';
import { useAppStore } from './store/useAppStore';
import { useUser } from './context/UserContext';
import { UserRole } from './config/roles';

import { LoadingSkeleton } from './components/LoadingSkeleton';

// ─── AdminHub (System Command Center) ────────────────────────────────────────
const AdminHub = lazy(() => import('./pages/admin/AdminHub'));

// Lazy loaded views
const SearchPage = lazy(() => import('./features/search/SearchPage'));
const CasesView = lazy(() => import('./features/intelligence/CasesView'));
const MonitoringView = lazy(() => import('./features/dashboard/MonitoringView'));
const SecurityView = lazy(() => import('./features/platform/SecurityView'));
const PredictiveNexusView = lazy(() => import('./features/ai/PredictiveNexusView'));
const AgentsView = lazy(() => import('./features/platform/AgentsView'));
const DeploymentView = lazy(() => import('./features/platform/DeploymentView'));
const SettingsView = lazy(() => import('./features/platform/SettingsView'));
const ClientSegmentView = lazy(() => import('./features/clients/ClientSegmentView'));
const ClientsHubView = lazy(() => import('./features/clients/ClientsHubView'));
const SovereignGovernanceDashboard = lazy(() => import('./components/super/SovereignGovernanceDashboard'));
const DatasetStudio = lazy(() => import('./features/platform/DatasetStudio'));
const ComplianceView = lazy(() => import('./features/intelligence/ComplianceView'));
const CustomsIntelligenceView = lazy(() => import('./features/intelligence/CustomsIntelligenceView'));
const ExecutiveBriefView = lazy(() => import('./features/dashboard/ExecutiveBriefView'));
const KnowledgeEngineeringView = lazy(() => import('./features/ai/KnowledgeEngineeringView'));
const ComponentsRegistryView = lazy(() => import('./features/platform/ComponentsRegistryView'));
const TendersView = lazy(() => import('./features/osint/TendersView'));
const MaritimeView = lazy(() => import('./features/osint/MaritimeView'));
const RegistriesView = lazy(() => import('./features/osint/RegistriesView'));
const GraphAnalyticsPage = lazy(() => import('./features/intelligence/GraphAnalyticsPage'));
const ReportBuilderPage = lazy(() => import('./features/reports/ReportBuilderPage'));
const AMLScoringView = lazy(() => import('./features/intelligence/AMLScoringView'));

// Premium Commercial Views
const CustomsIntelligencePremium = lazy(() => import('./features/intelligence/CustomsIntelligencePremium'));
const RiskScoringPremium = lazy(() => import('./features/intelligence/RiskScoringPremium'));
const SupplierDiscoveryPremium = lazy(() => import('./features/intelligence/SupplierDiscoveryPremium'));
const TradeFlowMapPremium = lazy(() => import('./features/intelligence/TradeFlowMapPremium'));
const PriceComparisonPremium = lazy(() => import('./features/intelligence/PriceComparisonPremium'));
const CargoManifestPremium = lazy(() => import('./features/intelligence/CargoManifestPremium'));
const ApiDocumentationView = lazy(() => import('./features/reports/ApiDocumentationView'));
const SanctionsScreening = lazy(() => import('./features/intelligence/SanctionsScreening'));
const AIInsightsHub = lazy(() => import('./features/ai/AIInsightsHub'));
const SovereignObserverView = lazy(() => import('./features/dashboard/SovereignObserverView'));
const DataIngestionHub = lazy(() => import('./features/platform/DataIngestionHub'));

// Клієнтський арсенал — Газета та Компромат
const NewspaperView = lazy(() => import('./features/newspaper/NewspaperView'));
const PowerStructureView = lazy(() => import('./features/newspaper/PowerStructureView'));
const SupplyChainAnalyticsView = lazy(() => import('./features/supply-chain/SupplyChainAnalyticsView'));

// Canonical v4.2.0 Pages
const MarketPage = lazy(() => import('./pages/MarketPage'));
const CommandHub = lazy(() => import('./pages/CommandHub'));
const MarketHub = lazy(() => import('./pages/MarketHub'));
const SearchHub = lazy(() => import('./pages/SearchHub'));
const OSINTHub = lazy(() => import('./pages/OSINTHub'));
const FinancialHub = lazy(() => import('./pages/FinancialHub'));
const AIHub = lazy(() => import('./pages/AIHub'));
const SystemHub = lazy(() => import('./pages/SystemHub'));


const FactoryStudio = lazy(() => import('./features/factory/FactoryStudio'));
const SystemFactoryView = lazy(() => import('./features/factory/SystemFactoryView'));
const AIControlPlane = lazy(() => import('./features/ai/AIControlPlane'));
const FinancialDashboardPage = lazy(() => import('./features/analytics/FinancialDashboard'));
const RealTimeMonitor = lazy(() => import('./features/monitoring/RealTimeMonitor'));
const NetworkGraph = lazy(() => import('./features/network/NetworkGraph'));
const DueDiligence = lazy(() => import('./features/diligence/DueDiligence'));
const ForecastingEngine = lazy(() => import('./features/ai/ForecastView'));

// ✅ Бізнес-розвідувальні модулі v58.2-WRAITH
const FinancialSigintView    = lazy(() => import('./features/intelligence/FinancialSigintView'));
const UBOMapView             = lazy(() => import('./features/intelligence/UBOMapView'));
const GeopoliticalRadarView  = lazy(() => import('./features/intelligence/GeopoliticalRadarView'));
const MATargetScannerView    = lazy(() => import('./features/intelligence/MATargetScannerView'));
const PortfolioRiskView      = lazy(() => import('./features/dashboard/PortfolioRiskView'));
const HypothesisEngineView   = lazy(() => import('./features/ai/HypothesisEngineView'));
const ConversationIntelView  = lazy(() => import('./features/osint/ConversationIntelView'));
const MarketEntryView        = lazy(() => import('./features/intelligence/MarketEntryView'));
const WarRoomView            = lazy(() => import('./features/dashboard/WarRoomView'));
const SovereignIntelHub      = lazy(() => import('./features/ai/SovereignIntelHub'));

// ✅ Нові модулі v59.0-NEXUS (Фаза 3)
const DecisionsJournal      = lazy(() => import('./features/decisions/DecisionsJournal'));
const AlertCenterView       = lazy(() => import('./features/alerts/AlertCenterView'));
const TimelineBuilderView   = lazy(() => import('./features/investigation/TimelineBuilderView'));
const EntityResolverView    = lazy(() => import('./features/analytics/EntityResolverView'));
const ScenarioModelingView  = lazy(() => import('./features/ai/ScenarioModelingView'));

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

  // ─── ADMIN TREE (/admin/*) ────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <AdminLayout>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes location={location} key={location.pathname}>
            {/* Кореневий редірект → System Command Center */}
            <Route path="/" element={<Navigate to="/admin/command?tab=infra" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/command?tab=infra" replace />} />

            {/* System Command Center */}
            <Route
              path="/admin/command"
              element={
                <AdminGuard>
                  <AdminHub />
                </AdminGuard>
              }
            />

            {/* Legacy системні маршрути → AdminHub таби */}
            <Route path="/system"            element={<Navigate to="/admin/command?tab=infra"      replace />} />
            <Route path="/monitoring"        element={<Navigate to="/admin/command?tab=infra"      replace />} />
            <Route path="/monitoring/realtime" element={<Navigate to="/admin/command?tab=infra"    replace />} />
            <Route path="/ingestion"         element={<Navigate to="/admin/command?tab=dataops"    replace />} />
            <Route path="/security"          element={<Navigate to="/admin/command?tab=security"   replace />} />
            <Route path="/deployment"        element={<Navigate to="/admin/command?tab=gitops"     replace />} />
            <Route path="/governance"        element={<Navigate to="/admin/command?tab=gitops"     replace />} />
            <Route path="/system-factory"    element={<Navigate to="/admin/command?tab=factory"    replace />} />
            <Route path="/datasets"          element={<Navigate to="/admin/command?tab=datasets"    replace />} />
            <Route path="/factory-studio"    element={<Navigate to="/admin/command?tab=factory"    replace />} />
            <Route path="/knowledge"         element={<Navigate to="/admin/command?tab=knowledge"   replace />} />
            <Route path="/scenarios"         element={<Navigate to="/admin/command?tab=scenarios"   replace />} />
            <Route path="/agents"            element={<Navigate to="/admin/command?tab=agents-ops" replace />} />
            <Route path="/components"        element={<Navigate to="/admin/command?tab=infra"      replace />} />
            <Route path="/settings"          element={<Navigate to="/admin/command?tab=settings"   replace />} />
            <Route path="/admin/ai-control"  element={<Navigate to="/admin/command?tab=models" replace />} />

            {/* Публічні маршрути доступні для адміна */}
            <Route path="/api-docs"          element={<ApiDocumentationView />} />
            <Route path="/reports"           element={<ReportBuilderPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin/command?tab=infra" replace />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    );
  }

  // ─── CLIENT TREE (всі ролі крім admin) ───────────────────────────────────
  return (
    <MainLayout>
      <Suspense fallback={<LoadingSkeleton />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* 1. КОМАНДНИЙ ЦЕНТР (GOLD HUB) */}
            <Route path="/" element={<Navigate to="/command?tab=board" replace />} />
            <Route path="/command" element={<CommandHub />} />
            <Route path="/morning-brief" element={<Navigate to="/command?tab=brief" replace />} />
            <Route path="/portfolio-risk" element={<Navigate to="/command?tab=risk" replace />} />
            <Route path="/newspaper" element={<Navigate to="/search?tab=newspaper" replace />} />
            <Route path="/som" element={<Navigate to="/command?tab=observer" replace />} />
            <Route path="/war-room" element={<Navigate to="/command?tab=warroom" replace />} />

            {/* 2. ТОРГОВА РОЗВІДКА (AMBER HUB) */}
            <Route path="/market" element={<MarketHub />} />
            <Route path="/customs-intel" element={<Navigate to="/market?tab=customs" replace />} />
            <Route path="/trade-map" element={<Navigate to="/market?tab=flows" replace />} />
            <Route path="/suppliers" element={<Navigate to="/market?tab=suppliers" replace />} />
            <Route path="/customs-premium" element={<CustomsIntelligencePremium />} />
            <Route path="/price-compare" element={<Navigate to="/market?tab=price" replace />} />
            <Route path="/cargo-manifest" element={<CargoManifestPremium />} />
            <Route path="/trade-flow-map" element={<Navigate to="/market?tab=flows" replace />} />
            <Route path="/geopolitical-radar" element={<GeopoliticalRadarView />} />
            <Route path="/supply-chain" element={<SupplyChainAnalyticsView />} />
            <Route path="/maritime" element={<MaritimeView />} />
            <Route path="/tenders" element={<TendersView />} />

            {/* 3. РОЗВІДКА СУБ'ЄКТІВ (WARN HUB) */}
            <Route path="/search" element={<SearchHub />} />
            <Route path="/registries" element={<Navigate to="/search?tab=registries" replace />} />
            <Route path="/documents" element={<Navigate to="/search?tab=documents" replace />} />
            <Route path="/diligence" element={<Navigate to="/osint?tab=diligence" replace />} />
            <Route path="/diligence/:ueid" element={<DueDiligence />} />
            <Route path="/ubo-map" element={<Navigate to="/osint?tab=ubo" replace />} />
            <Route path="/graph" element={<Navigate to="/osint?tab=graph" replace />} />
            <Route path="/risk-scoring" element={<RiskScoringPremium />} />
            <Route path="/sanctions" element={<Navigate to="/osint?tab=sanctions" replace />} />
            <Route path="/osint" element={<OSINTHub />} />
            <Route path="/aml" element={<Navigate to="/financial?tab=aml" replace />} />
            <Route path="/network/:ueid" element={<NetworkGraph />} />
            <Route path="/cases" element={<CasesView />} />
            <Route path="/power-structure" element={<PowerStructureView />} />
            <Route path="/compliance" element={<ComplianceView />} />

            {/* 4. ФІНАНСОВА РОЗВІДКА (EMERALD HUB) */}
            <Route path="/financial" element={<FinancialHub />} />
            <Route path="/swift-monitor" element={<Navigate to="/financial?tab=swift" replace />} />
            <Route path="/offshore-detector" element={<Navigate to="/financial?tab=offshore" replace />} />
            <Route path="/asset-freeze-tracker" element={<Navigate to="/financial?tab=assets" replace />} />
            <Route path="/financials/:ueid" element={<FinancialDashboardPage />} />
            <Route path="/portfolio-analysis" element={<PortfolioRiskView />} />

            {/* 5. AI НЕКСУС (BLUE HUB) */}
            <Route path="/nexus" element={<AIHub />} />
            <Route path="/agents" element={<Navigate to="/nexus?tab=agents" replace />} />
            <Route path="/ai-hypothesis" element={<Navigate to="/nexus?tab=hypothesis" replace />} />
            <Route path="/ai-insights" element={<Navigate to="/nexus?tab=insights" replace />} />
            <Route path="/knowledge" element={<Navigate to="/nexus?tab=knowledge" replace />} />
            <Route path="/oracle" element={<Navigate to="/nexus?tab=oracle" replace />} />
            <Route path="/forecast/:ueid" element={<ForecastingEngine />} />
            <Route path="/conversation-intel" element={<ConversationIntelView />} />
            <Route path="/hypothesis-engine" element={<Navigate to="/nexus?tab=hypothesis" replace />} />
            <Route path="/scenarios" element={<ScenarioModelingView />} />

            {/* Нові модулі v59.0-NEXUS */}
            <Route path="/decisions" element={<DecisionsJournal />} />
            <Route path="/alerts" element={<AlertCenterView />} />
            <Route path="/timeline" element={<TimelineBuilderView />} />
            <Route path="/entity-resolver" element={<EntityResolverView />} />

            {/* 6. СИСТЕМНЕ ЯДРО (тільки для client-ролей) */}
            <Route path="/system" element={<SystemHub />} />
            <Route path="/monitoring" element={<Navigate to="/system?tab=monitoring" replace />} />
            <Route path="/settings" element={<Navigate to="/system?tab=settings" replace />} />
            <Route path="/api-docs" element={<ApiDocumentationView />} />
            <Route path="/reports" element={<ReportBuilderPage />} />

            {/* Клієнтські маршрути */}
            <Route path="/clients" element={<ClientsHubView />} />
            <Route path="/clients/:segment" element={<ClientSegmentView />} />

            {/* Блокування адмін-зони для не-адмінів */}
            <Route path="/admin/*" element={<Navigate to="/" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </MainLayout>
  );
};
