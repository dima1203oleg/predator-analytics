import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import { AdminGuard } from './components/guards/AdminGuard';
import { RoleGuard } from './components/guards/RoleGuard';
import { useAppStore } from './store/useAppStore';
import { useUser } from './context/UserContext';
import { UserRole, resolveUserRole } from './config/roles';

import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorBoundary } from './components/ErrorBoundary';

// ─── AdminHub (System Command Center) ────────────────────────────────────────
const AdminHub = lazy(() => import('./pages/admin/AdminHub'));
const DatabaseCommandCenter = lazy(() => import('./features/admin/DatabaseCommandCenter'));
const UtosDashboard = lazy(() => import('./pages/diagnostics/UtosDashboard'));
const AdvDvsDashboard = lazy(() => import('./pages/diagnostics/AdvDvsDashboard').then(m => ({ default: m.AdvDvsDashboard })));

// ─── Client Nexus (WRAITH-3D) ────────────────────────────────────────
import WraithNexus from './features/nexus/WraithNexus';

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
const ModelingHub = lazy(() => import('./pages/ModelingHub'));


const FactoryStudio = lazy(() => import('./features/factory/FactoryStudio'));
const SystemFactoryView = lazy(() => import('./features/factory/SystemFactoryView'));
const AIControlPlane = lazy(() => import('./features/ai/AIControlPlane'));
const FinancialDashboardPage = lazy(() => import('./features/analytics/FinancialDashboard'));
const RealTimeMonitor = lazy(() => import('./features/monitoring/RealTimeMonitor'));
const NetworkGraph = lazy(() => import('./features/network/NetworkGraph'));
const DueDiligence = lazy(() => import('./features/diligence/DueDiligence'));
const ForecastingEngine = lazy(() => import('./features/ai/ForecastView'));

// ✅ Бізнес-розвідувальні модулі v61.0-ELITE
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

// AURUM OBSIDIAN Style Guide
const AurumShowcase          = lazy(() => import('./components/ui/AurumShowcase'));

// ✅ Нові модулі v59.0-NEXUS (Фаза 3)
const DecisionsJournal      = lazy(() => import('./features/decisions/DecisionsJournal'));
const AlertCenterView       = lazy(() => import('./features/alerts/AlertCenterView'));
const TimelineBuilderView   = lazy(() => import('./features/investigation/TimelineBuilderView'));
const EntityResolverView    = lazy(() => import('./features/analytics/EntityResolverView'));
const ScenarioModelingView  = lazy(() => import('./features/ai/ScenarioModelingView'));

// ✅ Стратегічні модулі v61.0-ELITE (Tornado Insights)
const TornadoInsightsShell  = lazy(() => import('./components/dimensional/shells/TornadoInsightsShell'));
const StrategicScenarioView = lazy(() => import('./features/dashboard/StrategicScenarioView'));

// ✅ OMNIVERSE v70.0 (Data Agnostic OS)
const OmniverseHub = lazy(() => import('./features/omniverse/OmniverseHub'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-slate-950 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] " />
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
        <div className="text-emerald-400 font-mono text-xs tracking-[0.5em]  mb-1">КВАНТОВИЙ ЗВ'ЯЗОК ВСТАНОВЛЕНО</div>
        <div className="text-white font-black text-2xl tracking-tighter flex gap-1">
          {["P", "R", "E", "D", "A", "T", "O", "R"].map((char, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
              className=""
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

const PremiumOnly = ({ children }: { children: ReactNode }) => (
  <RoleGuard minLevel="pro" showUpgrade>
    {children}
  </RoleGuard>
);

const GuardedCommandHub = () => {
  const routeLocation = useLocation();
  const tab = new URLSearchParams(routeLocation.search).get('tab');
  return ['risk', 'observer', 'warroom'].includes(tab ?? '')
    ? <PremiumOnly><CommandHub /></PremiumOnly>
    : <CommandHub />;
};

const GuardedSearchHub = () => {
  const routeLocation = useLocation();
  const tab = new URLSearchParams(routeLocation.search).get('tab');
  return ['newspaper', 'registries'].includes(tab ?? '')
    ? <PremiumOnly><SearchHub /></PremiumOnly>
    : <SearchHub />;
};

const GuardedAIHub = () => {
  const routeLocation = useLocation();
  const tab = new URLSearchParams(routeLocation.search).get('tab');
  return ['agents', 'hypothesis', 'knowledge'].includes(tab ?? '')
    ? <PremiumOnly><AIHub /></PremiumOnly>
    : <AIHub />;
};

const GuardedModelingHub = () => {
  const routeLocation = useLocation();
  const tab = new URLSearchParams(routeLocation.search).get('tab');
  return ['simulation', 'forecast'].includes(tab ?? '')
    ? <PremiumOnly><ModelingHub /></PremiumOnly>
    : <ModelingHub />;
};

export const AppRoutesNew = () => {
  const location = useLocation();
  const { user } = useUser();
  const effectiveRole = resolveUserRole(user?.role);
  const isAdmin = effectiveRole === UserRole.CORE;

  // ─── ADMIN TREE (/admin/*) ────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <AdminLayout>
        <Suspense fallback={<LoadingSkeleton />}>
          <ErrorBoundary>
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

              {/* Database Command Center */}
              <Route
                path="/admin/database-command-center"
                element={
                  <AdminGuard>
                    <DatabaseCommandCenter />
                  </AdminGuard>
                }
              />

              {/* ADV-DVS Diagnostic Center */}
              <Route
                path="/admin/adv-dvs"
                element={
                  <AdminGuard>
                    <AdvDvsDashboard />
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

              <Route path="/api-docs"          element={<ApiDocumentationView />} />
              <Route path="/reports"           element={<Navigate to="/admin/command?tab=infra" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/admin/command?tab=infra" replace />} />
            </Routes>
          </ErrorBoundary>
        </Suspense>
      </AdminLayout>
    );
  }

  // ─── CLIENT TREE (всі ролі крім admin) ───────────────────────────────────
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ErrorBoundary>
        <Routes location={location} key={location.pathname}>
          <Route path="/*" element={<WraithNexus />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
};
