import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { AdminGuard } from '../components/guards/AdminGuard';

const AdminHub = lazy(() => import('../pages/admin/AdminHub'));
const DatabaseCommandCenter = lazy(() => import('../features/admin/DatabaseCommandCenter'));
const AdvDvsDashboard = lazy(() => import('../pages/diagnostics/AdvDvsDashboard').then(m => ({ default: m.AdvDvsDashboard })));
const CognitiveInterface = lazy(() => import('../features/cognitive/CognitiveInterface'));
const ApiDocumentationView = lazy(() => import('../features/reports/ApiDocumentationView'));
const UploadDataset = lazy(() => import('../features/platform/components/UploadDataset').then(m => ({ default: m.UploadDataset })));
const CyberDashboard = lazy(() => import('../components/dashboard/CyberDashboard'));
const GraphAnalyticsPage = lazy(() => import('../pages/GraphAnalyticsPage'));

export const renderAdminRoutes = () => {
  return (
    <>
      <Route path="/" element={<Navigate to="/admin/command?tab=infra" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/command?tab=infra" replace />} />

      <Route path="/admin/command" element={<AdminGuard><AdminHub /></AdminGuard>} />
      <Route path="/admin/database-command-center" element={<AdminGuard><DatabaseCommandCenter /></AdminGuard>} />
      <Route path="/admin/adv-dvs" element={<AdminGuard><AdvDvsDashboard /></AdminGuard>} />
      <Route path="/command" element={<CyberDashboard />} />
      <Route path="/graph" element={<AdminGuard><GraphAnalyticsPage /></AdminGuard>} />

      <Route path="/cognitive" element={<CognitiveInterface />} />

      <Route path="/system" element={<Navigate to="/admin/command?tab=infra" replace />} />
      <Route path="/monitoring" element={<Navigate to="/admin/command?tab=infra" replace />} />
      <Route path="/monitoring/realtime" element={<Navigate to="/admin/command?tab=infra" replace />} />
      <Route path="/ingestion" element={<UploadDataset />} />
      <Route path="/security" element={<Navigate to="/admin/command?tab=security" replace />} />
      <Route path="/deployment" element={<Navigate to="/admin/command?tab=gitops" replace />} />
      <Route path="/governance" element={<Navigate to="/admin/command?tab=gitops" replace />} />
      <Route path="/system-factory" element={<Navigate to="/admin/command?tab=factory" replace />} />
      <Route path="/datasets" element={<Navigate to="/admin/command?tab=datasets" replace />} />
      <Route path="/factory-studio" element={<Navigate to="/admin/command?tab=factory" replace />} />
      <Route path="/knowledge" element={<Navigate to="/admin/command?tab=knowledge" replace />} />
      <Route path="/scenarios" element={<Navigate to="/admin/command?tab=scenarios" replace />} />
      <Route path="/agents" element={<Navigate to="/admin/command?tab=agents-ops" replace />} />
      <Route path="/components" element={<Navigate to="/admin/command?tab=infra" replace />} />
      <Route path="/settings" element={<Navigate to="/admin/command?tab=settings" replace />} />
      <Route path="/admin/ai-control" element={<Navigate to="/admin/command?tab=models" replace />} />

      <Route path="/api-docs" element={<ApiDocumentationView />} />
      <Route path="/reports" element={<Navigate to="/admin/command?tab=infra" replace />} />

      <Route path="*" element={<Navigate to="/admin/command?tab=infra" replace />} />
    </>
  );
};
