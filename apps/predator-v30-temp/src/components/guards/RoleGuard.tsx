import React, { ReactNode } from 'react';
import { useRole } from '../../context/RoleContext';
import { UserRole } from '../../config/roles';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import { AccessDenied } from '../shared/AccessDenied';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  showUpgrade?: boolean; // Якщо true, покаже UpgradePrompt для Basic юзерів замість простого fallback
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showUpgrade = false,
}) => {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    // Спеціальний кейс: якщо юзер Basic, а ми хочемо запропонувати апгрейд
    if (showUpgrade && role === UserRole.CLIENT_BASIC && allowedRoles.includes(UserRole.CLIENT_PREMIUM)) {
      return <UpgradePrompt />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // Default fallback based on denying admins vs clients
    return <AccessDenied />;
  }

  return <>{children}</>;
};
