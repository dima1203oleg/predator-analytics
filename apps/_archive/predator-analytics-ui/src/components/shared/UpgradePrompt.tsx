import { Button } from '@/components/ui/button';
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Star, Shield, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useUser, SubscriptionTier } from '../../context/UserContext';
import { UserRole, ROLE_CAPABILITIES } from '../../config/roles';
import { cn } from '@/lib/utils';

// ─── Типи ────────────────────────────────────────────────────────────────────

interface UpgradePromptProps {
  /** Назва функції (відображається у заголовку) */
  featureName?: string;
  /** Короткий опис переваги функції */
  featureBenefit?: string;
  /** Необхідна роль для доступу */
  requiredRole?: UserRole;
  /** Назва функції (зворотна сумісність) */
  title?: string;
  /** Опис (зворотна сумісність) */
  description?: string;
}

// ─── Конфігурація планів ──────────────────────────────────────────────────────

const PLAN_CONFIG: Record<string, {
  planName: string;
  planBadge: string;
  accentHex: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  glowHex: string;
  features: string[];
  icon: React.ElementType;
}> = {
  [UserRole.PRO]: {
    planName: 'PREDATOR Pro',
    planBadge: 'PRO',
    accentHex: '#f59e0b',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-500/25',
    bgClass: 'bg-amber-500/5',
    glowHex: 'rgba(245,158,11,0.12)',
    features: [
      'Граф зв\'язків до 5 рівнів вглиб',
      'Карта бенефіціарів (UBO) та структура власності',
      'Митна розвідка та аналіз декларацій',
      'AML-моніторинг та виявлення схем',
      'AI Конструктор звітів (PDF/PPTX/HTML)',
      'Суверенний Оракул — LLM-синтез',
    ],
    icon: Star,
  },
  [UserRole.SOVEREIGN]: {
    planName: 'PREDATOR Sovereign',
    planBadge: 'SOVEREIGN',
    accentHex: '#e11d48',
    accentClass: 'text-rose-400',
    borderClass: 'border-rose-500/25',
    bgClass: 'bg-rose-500/5',
    glowHex: 'rgba(225,29,72,0.12)',
    features: [
      'Безлімітна глибина графа зв\'язків',
      'Деанонімізація та доступ до сирих даних',
      'SWIFT-монітор транскордонних транзакцій',
      'Трекер заморожених та конфіскованих активів',
      'Геополітичний радар загроз (L7)',
      'WAR-GAMING сценарії та Прогностичний Нексус',
    ],
    icon: Shield,
  },
};

// ─── Компонент ────────────────────────────────────────────────────────────────

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  featureName,
  featureBenefit,
  requiredRole = UserRole.PRO,
  title,
  description,
}) => {
  const { role } = useRole();
  const { updateTier } = useUser();

  // Визначаємо конфіг на основі необхідної ролі
  const planKey = requiredRole === UserRole.SOVEREIGN ? UserRole.SOVEREIGN : UserRole.PRO;
  const config = PLAN_CONFIG[planKey] ?? PLAN_CONFIG[UserRole.PRO];
  const PlanIcon = config.icon;

  // Назва з урахуванням зворотної сумісності
  const displayTitle = featureName ?? title;
  const displayDescription = featureBenefit ?? description;

  const handleUpgradeDemo = () => {
    if (confirm(`Підтвердити перехід на ${config.planName}?`)) {
      updateTier(SubscriptionTier.PRO);
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[480px] p-8">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative max-w-md w-full rounded-2xl border overflow-hidden',
          config.borderClass,
          config.bgClass,
        )}
        style={{
          boxShadow: `0 0 80px ${config.glowHex}, 0 8px 48px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Фоновий radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${config.glowHex} 0%, transparent 65%)`,
          }}
        />

        {/* Верхня акцентна лінія */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${config.accentHex}80 50%, transparent 100%)`,
          }}
        />

        <div className="relative z-10 p-8">
          {/* Іконка + Бейдж */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className={cn(
                'flex items-center justify-center w-14 h-14 rounded-xl border relative overflow-hidden shrink-0',
                config.borderClass,
                config.bgClass,
              )}
            >
              <PlanIcon className={cn('w-7 h-7', config.accentClass)} />
              {/* Замок-оверлей */}
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-slate-950/90 rounded-full border border-white/10">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className={cn('text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 opacity-70', config.accentClass)}>
                Потрібен рівень доступу
              </div>
              <span
                className={cn(
                  'inline-block text-xs font-black px-2.5 py-1 rounded-lg border',
                  config.accentClass,
                  config.borderClass,
                  config.bgClass,
                )}
              >
                {config.planBadge}
              </span>
            </div>
          </div>

          {/* Заголовок */}
          <h2 className="text-xl font-bold text-white leading-tight mb-2">
            {displayTitle
              ? `«${displayTitle}» — ${config.planName}`
              : `Ця функція доступна у ${config.planName}`}
          </h2>

          {displayDescription && (
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">{displayDescription}</p>
          )}

          {/* Переваги */}
          <div className="mb-6">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] mb-3">
              Що входить у {config.planName}:
            </div>
            <div className="space-y-2">
              {config.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-2.5"
                >
                  <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0 opacity-80', config.accentClass)} />
                  <span className="text-sm text-slate-300 leading-snug">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA кнопки */}
          <div className="flex items-center gap-3">
            <Button variant="cyber"
              type="button"
              onClick={handleUpgradeDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white text-slate-950 hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Zap className="w-4 h-4" />
              Перейти на {config.planName}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button variant="cyber"
              type="button"
              className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:border-white/20 hover:text-white transition-all duration-200"
            >
              Дізнатися більше
            </Button>
          </div>

          {/* Підпис */}
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-600">
            <TrendingUp className="w-3 h-3" />
            <span>Використовується провідними аналітичними командами України</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradePrompt;
