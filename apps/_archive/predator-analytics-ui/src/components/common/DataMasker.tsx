/**
 * DataMasker - Компонент для Dynamic Redaction
 * 
 * Реалізація Sovereign Access Fabric (SAF) для маскування даних на UI рівні.
 * Автоматично маскує дані відповідно до рівня доступу користувача та контексту.
 */

import React, { ReactNode, useMemo } from 'react';
import { useRole } from '../../context/RoleContext';
import { useAccess, type ResourceAttributes } from '../../context/AccessContext';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Типи маскування ───────────────────────────────────────────────────────

export type MaskingLevel = 'none' | 'partial' | 'full';

export interface DataMaskerProps {
  children: ReactNode;
  data: any;
  dataType: 'financial' | 'personal' | 'identifier' | 'contact' | 'address' | 'custom';
  sensitivity?: 'public' | 'internal' | 'confidential' | 'restricted' | 'sovereign';
  customMasking?: (data: any, level: MaskingLevel) => ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

// ─── Утиліти маскування ─────────────────────────────────────────────────────

const maskFinancial = (value: any, level: MaskingLevel): string => {
  if (level === 'none') return value;
  
  if (typeof value === 'number') {
    if (level === 'partial') {
      // Показуємо діапазон: $10K-$50K замість точної суми
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M+`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K+`;
      return `$${value.toFixed(0)}+`;
    }
    return '***'; // full masking
  }
  
  if (typeof value === 'string') {
    if (level === 'partial') {
      // Часткове маскування: $***,***.**
      return value.replace(/\d(?=\d{3})/g, '*');
    }
    return '***'; // full masking
  }
  
  return '***';
};

const maskPersonal = (value: any, level: MaskingLevel): string => {
  if (level === 'none' || !value) return value;
  
  if (typeof value !== 'string') return '***';
  
  if (level === 'partial') {
    // Часткове маскування: Іванов І. І. або І*** І. І.
    const parts = value.split(' ');
    if (parts.length >= 2) {
      const firstName = parts[0];
      const maskedFirstName = firstName.length > 3 
        ? firstName.charAt(0) + '*'.repeat(firstName.length - 1) 
        : firstName;
      return `${maskedFirstName} ${parts.slice(1).join(' ')}`;
    }
    return value.charAt(0) + '*'.repeat(value.length - 1);
  }
  
  return '***'; // full masking
};

const maskIdentifier = (value: any, level: MaskingLevel): string => {
  if (level === 'none' || !value) return value;
  
  if (typeof value !== 'string') return '***';
  
  if (level === 'partial') {
    // Часткове маскування: 1234567890 → 123****7890
    if (value.length > 6) {
      return value.substring(0, 3) + '****' + value.substring(value.length - 4);
    }
    return '*'.repeat(value.length);
  }
  
  return '***'; // full masking
};

const maskContact = (value: any, level: MaskingLevel): string => {
  if (level === 'none' || !value) return value;
  
  if (typeof value !== 'string') return '***';
  
  if (level === 'partial') {
    // Часткове маскування: +380501234567 → +380****34567
    if (value.includes('@')) {
      // Email: user@example.com → u***@example.com
      const [local, domain] = value.split('@');
      const maskedLocal = local.charAt(0) + '***';
      return `${maskedLocal}@${domain}`;
    }
    // Телефон
    if (value.length > 6) {
      return value.substring(0, value.length - 4) + '****';
    }
    return '*'.repeat(value.length);
  }
  
  return '***'; // full masking
};

const maskAddress = (value: any, level: MaskingLevel): string => {
  if (level === 'none' || !value) return value;
  
  if (typeof value !== 'string') return '***';
  
  if (level === 'partial') {
    // Часткове маскування: вулиця, номер, місто → вулиця, ***, місто
    const parts = value.split(', ');
    if (parts.length >= 2) {
      parts[1] = '***';
      return parts.join(', ');
    }
    return value.charAt(0) + '*'.repeat(value.length - 1);
  }
  
  return '***'; // full masking
};

// ─── Компонент ─────────────────────────────────────────────────────────────

export const DataMasker: React.FC<DataMaskerProps> = ({
  children,
  data,
  dataType,
  sensitivity = 'internal',
  customMasking,
  showUpgradePrompt = true,
  className,
}) => {
  const { isTerminal, isPro, isSovereign, isCore } = useRole();
  const { evaluateAccess } = useAccess();

  // Визначення атрибутів ресурсу для ABAC
  const resourceAttributes: ResourceAttributes = useMemo(() => ({
    sensitivity,
    dataClassification: sensitivity === 'sovereign' ? 'top-secret' : 
                        sensitivity === 'restricted' ? 'secret' :
                        sensitivity === 'confidential' ? 'classified' : 'unclassified',
    requiresGeolocation: sensitivity === 'sovereign',
    requiresMinThreatLevel: sensitivity === 'sovereign' ? 'high' : 
                          sensitivity === 'restricted' ? 'medium' : undefined,
  }), [sensitivity]);

  // Оцінка доступу через ABAC
  const accessDecision = useMemo(() => {
    return evaluateAccess(resourceAttributes);
  }, [evaluateAccess, resourceAttributes]);

  // Визначення рівня маскування на основі ролі та рішення ABAC
  const maskingLevel: MaskingLevel = useMemo(() => {
    // Core має повний доступ
    if (isCore) return 'none';
    
    // Sovereign має повний доступ, якщо ABAC дозволяє
    if (isSovereign && accessDecision.allowed) return 'none';
    
    // Pro має частковий доступ
    if (isPro) {
      if (accessDecision.redactionLevel === 'full') return 'full';
      return 'partial';
    }
    
    // Terminal має мінімальний доступ
    if (isTerminal) {
      if (sensitivity === 'public') return 'none';
      return 'full';
    }
    
    return 'full';
  }, [isCore, isSovereign, isPro, isTerminal, accessDecision, sensitivity]);

  // Маскування даних
  const maskedData = useMemo(() => {
    if (maskingLevel === 'none') return data;
    
    if (customMasking) {
      return customMasking(data, maskingLevel);
    }

    switch (dataType) {
      case 'financial':
        return maskFinancial(data, maskingLevel);
      case 'personal':
        return maskPersonal(data, maskingLevel);
      case 'identifier':
        return maskIdentifier(data, maskingLevel);
      case 'contact':
        return maskContact(data, maskingLevel);
      case 'address':
        return maskAddress(data, maskingLevel);
      default:
        return '***';
    }
  }, [data, maskingLevel, dataType, customMasking]);

  // Якщо дані повністю замасковані і показуємо prompt для апгрейду
  if (maskingLevel === 'full' && showUpgradePrompt && !accessDecision.allowed) {
    return (
      <div className={cn('relative group', className)}>
        <div className="flex items-center gap-2 text-slate-400">
          <Lock className="h-4 w-4" />
          <span className="text-sm">
            {accessDecision.reason || 'Дані обмежені для вашого рівня доступу'}
          </span>
        </div>
        {accessDecision.upgradeRequired && (
          <div className="mt-2 text-xs text-rose-400">
            Потрібен апгрейд до {accessDecision.upgradeRequired === 'pro' ? 'Pro' : 'Sovereign'}
          </div>
        )}
      </div>
    );
  }

  // Якщо дані частково замасковані
  if (maskingLevel === 'partial') {
    return (
      <div className={cn('relative group inline-flex items-center gap-2', className)}>
        <span className="text-slate-300">{maskedData}</span>
        <div className="flex items-center gap-1 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <EyeOff className="h-3 w-3" />
          <span>Частковий доступ</span>
        </div>
      </div>
    );
  }

  // Повний доступ
  return <span className={className}>{children}</span>;
};

// ─── Хук для маскування даних ───────────────────────────────────────────────

export const useDataMasking = () => {
  const { isTerminal, isPro, isSovereign, isCore } = useRole();
  const { evaluateAccess } = useAccess();

  const maskData = (
    data: any,
    dataType: DataMaskerProps['dataType'],
    sensitivity: DataMaskerProps['sensitivity'] = 'internal'
  ): any => {
    const resourceAttributes: ResourceAttributes = {
      sensitivity,
      dataClassification: sensitivity === 'sovereign' ? 'top-secret' : 
                          sensitivity === 'restricted' ? 'secret' :
                          sensitivity === 'confidential' ? 'classified' : 'unclassified',
      requiresGeolocation: sensitivity === 'sovereign',
    };

    const accessDecision = evaluateAccess(resourceAttributes);

    if (isCore) return data;
    if (isSovereign && accessDecision.allowed) return data;
    if (isPro && accessDecision.redactionLevel !== 'full') {
      // Часткове маскування для Pro
      switch (dataType) {
        case 'financial':
          return maskFinancial(data, 'partial');
        case 'personal':
          return maskPersonal(data, 'partial');
        case 'identifier':
          return maskIdentifier(data, 'partial');
        case 'contact':
          return maskContact(data, 'partial');
        case 'address':
          return maskAddress(data, 'partial');
        default:
          return '***';
      }
    }

    // Full masking для Terminal або коли заблоковано
    return '***';
  };

  return { maskData };
};

// ─── Компонент для відображення статусу доступу ─────────────────────────────

export const AccessStatusIndicator: React.FC<{
  sensitivity?: DataMaskerProps['sensitivity'];
  className?: string;
}> = ({ sensitivity = 'internal', className }) => {
  const { evaluateAccess } = useAccess();
  const { isCore, isSovereign, isPro, isTerminal } = useRole();

  const resourceAttributes: ResourceAttributes = {
    sensitivity,
    dataClassification: sensitivity === 'sovereign' ? 'top-secret' : 
                        sensitivity === 'restricted' ? 'secret' :
                        sensitivity === 'confidential' ? 'classified' : 'unclassified',
    requiresGeolocation: sensitivity === 'sovereign',
  };

  const accessDecision = evaluateAccess(resourceAttributes);

  if (isCore) {
    return (
      <div className={cn('flex items-center gap-2 text-emerald-400', className)}>
        <ShieldAlert className="h-4 w-4" />
        <span className="text-xs">Повний доступ (Core)</span>
      </div>
    );
  }

  if (isSovereign && accessDecision.allowed) {
    return (
      <div className={cn('flex items-center gap-2 text-emerald-400', className)}>
        <Eye className="h-4 w-4" />
        <span className="text-xs">Повний доступ (Sovereign)</span>
      </div>
    );
  }

  if (isPro && accessDecision.redactionLevel !== 'full') {
    return (
      <div className={cn('flex items-center gap-2 text-amber-400', className)}>
        <EyeOff className="h-4 w-4" />
        <span className="text-xs">Частковий доступ (Pro)</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-rose-400', className)}>
      <Lock className="h-4 w-4" />
      <span className="text-xs">Обмежений доступ</span>
    </div>
  );
};
