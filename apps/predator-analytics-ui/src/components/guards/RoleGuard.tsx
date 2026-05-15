import React, { ReactNode } from 'react';
import { useRole } from '../../context/RoleContext';
import { UserRole } from '../../config/roles';
import { UpgradePrompt } from '../shared/UpgradePrompt';
import { AccessDenied } from '../shared/AccessDenied';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  showUpgrade?: boolean; // Якщо true, покаже UpgradePrompt для PROMO юзерів замість простого fallback
  minLevel?: 'promo' | 'pro' | 'vip' | 'admin'; // Мінімальний рівень доступу
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showUpgrade = false,
  minLevel,
}) => {
  const { role, isPromo, isPro, isVIP, isAdmin } = useRole();

  // Перевірка за мінімальним рівнем доступу
  if (minLevel) {
    const hasAccess =
      (minLevel === 'promo' && (isPromo || isPro || isVIP || isAdmin)) ||
      (minLevel === 'pro' && (isPro || isVIP || isAdmin)) ||
      (minLevel === 'vip' && (isVIP || isAdmin)) ||
      (minLevel === 'admin' && isAdmin);

    if (!hasAccess) {
      // PROMO користувачі бачать UpgradePrompt для апгрейду до PRO/VIP
      if (showUpgrade && isPromo) {
        return <UpgradePrompt />;
      }

      if (fallback) {
        return <>{fallback}</>;
      }

      return <AccessDenied />;
    }
  }

  // Перевірка за списком дозволених ролей
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Спеціальний кейс: якщо юзер PROMO, а ми хочемо запропонувати апгрейд
    if (showUpgrade && isPromo && (allowedRoles.includes(UserRole.PRO) || allowedRoles.includes(UserRole.VIP))) {
      return <UpgradePrompt />;
    }

    // Легасі-аліаси для зворотної сумісності
    if (showUpgrade && role === UserRole.CLIENT_BASIC && allowedRoles.includes(UserRole.CLIENT_PREMIUM)) {
      return <UpgradePrompt />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return <AccessDenied />;
  }

  return <>{children}</>;
};
