import { Suspense } from 'react';
import { Routes, useLocation, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import { useUser } from './context/UserContext';
import { UserRole, resolveUserRole } from './config/roles';

import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorBoundary } from './components/ErrorBoundary';

import { renderAdminRoutes } from './routes/adminRoutes';
import { renderClientRoutes } from './routes/clientRoutes';
import { renderPublicRoutes } from './routes/publicRoutes';

export const AppRoutesNew = () => {
  const location = useLocation();
  const { user } = useUser();
  const effectiveRole = resolveUserRole(user?.role);
  const isAdmin = effectiveRole === UserRole.CORE;

  // ─── PUBLIC TREE (/auth/*) ────────────────────────────────────────────────
  if (!user && !location.pathname.startsWith('/auth')) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!user || location.pathname.startsWith('/auth')) {
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

  // ─── ADMIN TREE (/admin/*) ────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <AdminLayout>
        <Suspense fallback={<LoadingSkeleton />}>
          <ErrorBoundary>
            <Routes location={location} key={location.pathname}>
              {renderAdminRoutes()}
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
          {renderClientRoutes()}
        </Routes>
      </ErrorBoundary>
    </Suspense>
  );
};
