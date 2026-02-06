import React, { ReactNode } from 'react';
import { RoleGuard } from './RoleGuard';
import { UserRole } from '../../config/roles';
import { AccessDenied } from '../shared/AccessDenied';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback = <AccessDenied message="Ця секція доступна тільки адміністраторам системи." />
}) => {
  return (
    <RoleGuard
      allowedRoles={[UserRole.ADMIN]}
      showUpgrade={false}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};
