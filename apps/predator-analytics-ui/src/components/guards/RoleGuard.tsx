import React, { ReactNode } from 'react';
import { useRole } from '../../context/RoleContext';
import { UserRole } from '../../config/roles';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import { AccessDenied } from '../shared/AccessDenied';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
  showUpgrade?: boolean; // Якщо true, покаже UpgradePrompt для Terminal юзерів замість простого fallback
  minLevel?: 'terminal' | 'pro' | 'sovereign' | 'core'; // Мінімальний рівень доступу
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showUpgrade = false,
  minLevel,
}) => {
  const { role: currentRole, isTerminal, isPro, isSovereign, isCore } = useRole();

  // Перевірка за мінімальним рівнем доступу
  if (minLevel) {
    const hasAccess =
      (minLevel === 'terminal' && (isTerminal || isPro || isSovereign || isCore)) ||
      (minLevel === 'pro' && (isPro || isSovereign || isCore)) ||
      (minLevel === 'sovereign' && (isSovereign || isCore)) ||
      (minLevel === 'core' && isCore);

    if (!hasAccess) {
      // Terminal користувачі бачать UpgradePrompt для апгрейду
      if (showUpgrade && isTerminal) {
        return <UpgradePrompt requiredRole={minLevel === 'sovereign' ? UserRole.SOVEREIGN : UserRole.PRO} />;
      }
      
      // Pro користувачі бачать UpgradePrompt для апгрейду до Sovereign
      if (showUpgrade && isPro && minLevel === 'sovereign') {
        return <UpgradePrompt requiredRole={UserRole.SOVEREIGN} />;
      }

      if (fallback) {
        return <>{fallback}</>;
      }

      return <AccessDenied />;
    }
  }

  // Перевірка за списком дозволених ролей
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    // Спеціальний кейс: якщо юзер Terminal або Pro, а ми хочемо запропонувати апгрейд
    if (showUpgrade && (isTerminal || isPro) && !isCore) {
      return <UpgradePrompt requiredRole={allowedRoles[0]} />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return <AccessDenied />;
  }

  return <>{children}</>;
};
