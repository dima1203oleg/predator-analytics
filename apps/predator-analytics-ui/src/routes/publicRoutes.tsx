import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

const PublicGateway = lazy(() => import('../features/auth/PublicGateway').then(m => ({ default: m.PublicGateway })));

export const renderPublicRoutes = () => {
  return (
    <>
      <Route path="/auth/*" element={<PublicGateway />} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </>
  );
};
