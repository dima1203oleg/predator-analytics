import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import LegacyAdminLayout from './components/layout/AdminLayout';
import { useUser } from './context/UserContext';
import { UserRole, resolveUserRole } from './config/roles';

import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorBoundary } from './components/ErrorBoundary';

import { renderAdminRoutes } from './routes/adminRoutes';
import { renderClientRoutes } from './routes/clientRoutes';
import { renderPublicRoutes } from './routes/publicRoutes';
import { CyberCommandLayout } from './components/cyber/CyberCommandLayout';

const CyberDashboard = lazy(() => import('./components/dashboard/CyberDashboard'));
const OmniscienceView = lazy(() => import('./features/dashboard/OmniscienceView'));
const DataIngestionTerminal = lazy(() => import('./features/platform/components/DataIngestionTerminal').then(m => ({ default: m.DataIngestionTerminal })));
const UniverseView = lazy(() => import('./pages/UniverseView'));

// Next-Gen Admin Pages
import { AdminLayout } from './admin/components/AdminLayout';
import { Dashboard as AdminDashboard } from './admin/pages/Dashboard';
import { Users as AdminUsers } from './admin/pages/Users';
import { AuditLog as AdminAuditLog } from './admin/pages/AuditLog';
import { SystemHealth as AdminSystemHealth } from './admin/pages/SystemHealth';
import { AiControlCenter } from './admin/pages/AiControlCenter';
import { AvatarsCenter } from './admin/pages/AvatarsCenter';
import { ForecastingCenter } from './admin/pages/ForecastingCenter';
import { OsintCenter } from './admin/pages/OsintCenter';
import { AutoTrainingCenter } from './admin/pages/AutoTrainingCenter';
import { DatasetsCenter } from './admin/pages/DatasetsCenter';
import { DataIntelligenceHub } from './admin/pages/DataIntelligenceHub';
import { TestingCenter } from './admin/pages/TestingCenter';
import { ModulesCenter } from './admin/pages/ModulesCenter';
import { StorageCenter } from './admin/pages/StorageCenter';
import { SecurityCenter } from './admin/pages/SecurityCenter';
import { PerformanceCenter } from './admin/pages/PerformanceCenter';
import { AutomationCenter } from './admin/pages/AutomationCenter';
import { MissionControl } from './admin/pages/MissionControl';
import { SandboxCenter } from './admin/pages/SandboxCenter';
import { CostIntelligenceCenter } from './admin/pages/CostIntelligenceCenter';
import { DataRoutingMatrix } from './admin/pages/DataRoutingMatrix';
import { DomainKnowledgeSystem } from './admin/pages/DomainKnowledgeSystem';
const DigitalTwinView = lazy(() => import('./features/modeling/DigitalTwinView'));
const FlowAnalytics = lazy(() => import('./pages/FlowAnalytics'));
const SystemFactoryView = lazy(() => import('./features/factory/SystemFactoryView'));
const AIStudioPage = lazy(() => import('./pages/AIStudioPage'));

// Next-Gen Spatial Interface
import { OmniscienceV2 } from './user/pages/OmniscienceV2';
import { EliteCommandDashboard } from './features/elite-command/EliteCommandDashboard';
import { CommandCenter } from './components/PredatorScene/CommandCenter';
import { VoidForgeScene } from './components/VoidForge/VoidForgeScene';

export const AppRoutesNew = () => {
  const location = useLocation();
  const { user } = useUser();
  const effectiveRole = resolveUserRole(user?.role);
  const isAdmin = effectiveRole === UserRole.CORE;

  if (!user && !location.pathname.startsWith('/auth') && location.pathname !== '/elite-command' && location.pathname !== '/predator' && location.pathname !== '/void-forge' && location.pathname !== '/ingestion' && location.pathname !== '/universe' && location.pathname !== '/') {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if ((!user || location.pathname.startsWith('/auth')) && location.pathname !== '/elite-command' && location.pathname !== '/predator' && location.pathname !== '/void-forge' && location.pathname !== '/ingestion' && location.pathname !== '/universe' && location.pathname !== '/') {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <ErrorBoundary>
          <Routes location={location} key={location.pathname}>
            {renderPublicRoutes()}
          </Routes>
        </ErrorBoundary>
      </Suspense>
    );
  }

  // ─── CYBER & OMNISCIENCE ROUTES (Всі авторизовані + bypass) ──────────────────────
  if (location.pathname === '/' || location.pathname === '/command' || location.pathname === '/cyber' || location.pathname === '/dashboard' || location.pathname === '/omniscience' || location.pathname === '/omniscience-v2' || location.pathname === '/universe' || location.pathname === '/elite-command' || location.pathname === '/predator' || location.pathname === '/void-forge' || location.pathname === '/ingestion' || location.pathname === '/flow-analytics') {
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <ErrorBoundary>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/command" replace />} />
            <Route path="/command" element={<CommandCenter />} />
            <Route path="/cyber" element={<Navigate to="/command" replace />} />
            <Route path="/dashboard" element={<Navigate to="/command" replace />} />
            <Route path="/omniscience" element={
              <CyberCommandLayout>
                <OmniscienceView />
              </CyberCommandLayout>
            } />
            <Route path="/omniscience-v2" element={<OmniscienceV2 />} />
            <Route path="/universe" element={<UniverseView />} />
            <Route path="/elite-command" element={<Navigate to="/command" replace />} />
            <Route path="/predator" element={<CommandCenter />} />
            <Route path="/void-forge" element={<VoidForgeScene />} />
            <Route path="/flow-analytics" element={<FlowAnalytics />} />
            <Route path="/ingestion" element={
              <CyberCommandLayout>
                <DataIngestionTerminal />
              </CyberCommandLayout>
            } />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    );
  }

  // ─── NEXT-GEN ADMIN TREE (/admin/*) ────────────────────────────────────────────────
  if (isAdmin && (location.pathname.startsWith('/admin') || location.pathname === '/')) {
    return (
      <AdminLayout>
        <Suspense fallback={<LoadingSkeleton />}>
          <ErrorBoundary>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/admin/mission-control" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/mission-control" replace />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/audit" element={<AdminAuditLog />} />
              <Route path="/admin/health" element={<AdminSystemHealth />} />
              <Route path="/admin/digital-twin" element={<DigitalTwinView />} />
              
              <Route path="/admin/model-lab" element={<AiControlCenter />} />
              <Route path="/admin/agent-control" element={<AvatarsCenter />} />
              <Route path="/admin/forecasting" element={<ForecastingCenter />} />
              <Route path="/admin/osint" element={<OsintCenter />} />
              <Route path="/admin/auto-training" element={<AutoTrainingCenter />} />
              <Route path="/admin/datasets" element={<DatasetsCenter />} />
              <Route path="/admin/data-hub" element={<DataIntelligenceHub />} />
              <Route path="/admin/testing" element={<TestingCenter />} />
              <Route path="/admin/sandbox" element={<SandboxCenter />} />
              <Route path="/admin/modules" element={<ModulesCenter />} />
              <Route path="/admin/storage" element={<StorageCenter />} />
              <Route path="/admin/security" element={<SecurityCenter />} />
              <Route path="/admin/performance" element={<PerformanceCenter />} />
              <Route path="/admin/automation" element={<AutomationCenter />} />
              <Route path="/admin/mission-control" element={<MissionControl />} />
              <Route path="/admin/cost-intelligence" element={<CostIntelligenceCenter />} />
              <Route path="/admin/routing-matrix" element={<DataRoutingMatrix />} />
              <Route path="/admin/domain-knowledge" element={<DomainKnowledgeSystem />} />
              <Route path="/admin/factory" element={<SystemFactoryView />} />
              <Route path="/admin/ai-studio" element={<AIStudioPage />} />
              
              <Route path="*" element={<Navigate to="/admin" replace />} />
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
        <CyberCommandLayout>
          <Routes location={location} key={location.pathname}>
            {renderClientRoutes()}
          </Routes>
        </CyberCommandLayout>
      </ErrorBoundary>
    </Suspense>
  );
};
