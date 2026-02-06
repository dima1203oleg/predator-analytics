import React, { ReactNode } from 'react';
import { RoleGuard } from './RoleGuard';
import { UserRole } from '../../config/roles';

interface PremiumGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export const PremiumGuard: React.FC<PremiumGuardProps> = ({
  children,
  fallback,
  showUpgrade = true
}) => {
  return (
    <RoleGuard
      allowedRoles={[UserRole.CLIENT_PREMIUM]}
      showUpgrade={showUpgrade}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};
