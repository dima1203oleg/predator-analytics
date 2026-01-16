import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UnifiedLayout } from './components/layout/UnifiedLayout';
import { RoleGuard } from './components/guards/RoleGuard';
import { PremiumGuard } from './components/guards/PremiumGuard';
import { AdminGuard } from './components/guards/AdminGuard';
import { UserRole } from './config/roles';
import { useRole } from './context/RoleContext';

// Lazy load components
// Client
const Overview = React.lazy(() => import('./components/client/Overview').then(module => ({ default: module.Overview })));
const Search = React.lazy(() => import('./components/client/Search').then(module => ({ default: module.Search })));
const Trends = React.lazy(() => import('./components/client/Trends').then(module => ({ default: module.Trends })));
const Newspaper = React.lazy(() => import('./components/client/Newspaper').then(module => ({ default: module.Newspaper })));
const Reports = React.lazy(() => import('./components/client/Reports').then(module => ({ default: module.Reports })));
const Profile = React.lazy(() => import('./components/client/Profile').then(module => ({ default: module.Profile })));

// Premium
const Dashboards = React.lazy(() => import('./components/premium/Dashboards').then(module => ({ default: module.Dashboards })));
const VisualAnalytics = React.lazy(() => import('./components/premium/VisualAnalytics').then(module => ({ default: module.VisualAnalytics })));
const Relations = React.lazy(() => import('./components/premium/Relations').then(module => ({ default: module.Relations })));
const Timelines = React.lazy(() => import('./components/premium/Timelines').then(module => ({ default: module.Timelines })));
const OpenSearch = React.lazy(() => import('./components/premium/OpenSearch').then(module => ({ default: module.OpenSearch })));

// Admin
const SystemStatus = React.lazy(() => import('./components/admin/SystemStatus').then(module => ({ default: module.SystemStatus })));
const Infrastructure = React.lazy(() => import('./components/admin/Infrastructure').then(module => ({ default: module.Infrastructure })));
const Services = React.lazy(() => import('./components/admin/Services').then(module => ({ default: module.Services })));
const Models = React.lazy(() => import('./components/admin/Models').then(module => ({ default: module.Models })));
const UsersRoles = React.lazy(() => import('./components/admin/UsersRoles').then(module => ({ default: module.UsersRoles })));
const Jurisdictions = React.lazy(() => import('./components/admin/Jurisdictions').then(module => ({ default: module.Jurisdictions })));
const SOM = React.lazy(() => import('./components/admin/SOM').then(module => ({ default: module.SOMAdmin })));
const AuditLogs = React.lazy(() => import('./components/admin/AuditLogs').then(module => ({ default: module.AuditLogs })));
const E3Dashboard = React.lazy(() => import('./components/admin/EternalEvolutionDashboard').then(module => ({ default: module.EternalEvolutionDashboard })));
const Evolution = React.lazy(() => import('./components/admin/Evolution').then(module => ({ default: module.EvolutionAdmin })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-[50vh]">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const { role, isAdmin } = useRole();

  return (
    <UnifiedLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Default Redirect based on Role */}
          <Route
            path="/"
            element={<Navigate to={isAdmin ? "/admin/e3" : "/overview"} replace />}
          />

          {/* CLIENT ROUTES (Restricted from Admin for full isolation) */}
          <Route path="/overview" element={<RoleGuard allowedRoles={[UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM]}><Overview /></RoleGuard>} />
          <Route path="/search" element={<RoleGuard allowedRoles={[UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM]}><Search /></RoleGuard>} />
          <Route path="/trends" element={<RoleGuard allowedRoles={[UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM]}><Trends /></RoleGuard>} />
          <Route path="/newspaper" element={<RoleGuard allowedRoles={[UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM]}><Newspaper /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard allowedRoles={[UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM]}><Reports /></RoleGuard>} />
          <Route path="/profile" element={<RoleGuard allowedRoles={[UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM]}><Profile /></RoleGuard>} />

          {/* PREMIUM ROUTES */}
          <Route path="/dashboards" element={<PremiumGuard><Dashboards /></PremiumGuard>} />
          <Route path="/analytics" element={<PremiumGuard><VisualAnalytics /></PremiumGuard>} />
          <Route path="/relations" element={<PremiumGuard><Relations /></PremiumGuard>} />
          <Route path="/timelines" element={<PremiumGuard><Timelines /></PremiumGuard>} />
          <Route path="/opensearch" element={<PremiumGuard><OpenSearch /></PremiumGuard>} />

          {/* ADMIN ROUTES */}
          <Route path="/admin/e3" element={<AdminGuard><E3Dashboard /></AdminGuard>} />
          <Route path="/admin/evolution" element={<AdminGuard><Evolution /></AdminGuard>} />
          <Route path="/admin/som" element={<AdminGuard><SOM /></AdminGuard>} />
          <Route path="/admin/status" element={<AdminGuard><SystemStatus /></AdminGuard>} />
          <Route path="/admin/infra" element={<AdminGuard><Infrastructure /></AdminGuard>} />
          <Route path="/admin/services" element={<AdminGuard><Services /></AdminGuard>} />
          <Route path="/admin/models" element={<AdminGuard><Models /></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard><UsersRoles /></AdminGuard>} />
          <Route path="/admin/jurisdictions" element={<AdminGuard><Jurisdictions /></AdminGuard>} />
          <Route path="/admin/audit" element={<AdminGuard><AuditLogs /></AdminGuard>} />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to={isAdmin ? "/admin/e3" : "/overview"} replace />}
          />
        </Routes>
      </Suspense>
    </UnifiedLayout>
  );
};
