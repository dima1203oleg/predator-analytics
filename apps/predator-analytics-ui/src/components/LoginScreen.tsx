import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgePercent,
  Building2,
  CheckCircle2,
  CreditCard,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { UserRole } from '../config/roles';
import { SubscriptionTier, useUser } from '../context/UserContext';

interface LoginScreenProps {
  onLogin: () => void;
  isLocked?: boolean;
}

interface DemoPreset {
  role: UserRole;
  title: string;
  persona: string;
  description: string;
  tier: SubscriptionTier;
  icon: React.ElementType;
  benefits: string[];
}

const rolePresets: DemoPreset[] = [
  {
    role: UserRole.SUPPLY_CHAIN,
    title: 'Закупівлі та логістика',
    persona: 'Менеджер із закупівель',
    description: 'Швидкий старт для оптимізації імпорту, вибору постачальника та зниження логістичних витрат.',
    tier: SubscriptionTier.BASIC,
    icon: Target,
    benefits: ['Ключовий сценарій закупівель', 'Демо-режим за 2 хвилини', 'Бізнес-представлення центру виконання'],
  },
  {
    role: UserRole.BUSINESS,
    title: 'Бізнес-керівник',
    persona: 'Власник або операційний керівник',
    description: 'Контроль економії, сценаріїв масштабування та прозора монетизація через тариф і % від результату.',
    tier: SubscriptionTier.PRO,
    icon: Building2,
    benefits: ['Value screen і ROI', 'Збереження сценаріїв', 'Billing і підтвердження економії'],
  },
  {
    role: UserRole.ANALYST,
    title: 'Аналітик',
    persona: 'Дослідник ринку та ризиків',
    description: 'Розвідка, верифікація контрагентів, пояснюваність AI та розширені сценарії аналізу.',
    tier: SubscriptionTier.PRO,
    icon: Radar,
    benefits: ['Розвідка і diligence', 'Пояснення рекомендацій', 'Ринкові сценарії та сигнали'],
  },
  {
    role: UserRole.ADMIN,
    title: 'Адміністратор',
    persona: 'Технічний власник платформи',
    description: 'Керування системним контуром, інтеграціями, ролями та enterprise-функціями.',
    tier: SubscriptionTier.ENTERPRISE,
    icon: ShieldCheck,
    benefits: ['Системний контур', 'Розширені інтеграції', 'Повний доступ до enterprise-модулів'],
  },
];

const tierLabels: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'Базовий',
  [SubscriptionTier.BASIC]: 'Базовий',
  [SubscriptionTier.PRO]: 'Про',
  [SubscriptionTier.ENTERPRISE]: 'Корпоративний',
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLocked = false }) => {
  const { setUser } = useUser();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPPLY_CHAIN);

  const selectedPreset = useMemo(
    () => rolePresets.find((preset) => preset.role === selectedRole) ?? rolePresets[0],
    [selectedRole],
  );

  const handleDemoLogin = (preset: DemoPreset) => {
    flushSync(() => {
      setUser({
        id: `${preset.role}-demo-user`,
        name:
          preset.role === UserRole.SUPPLY_CHAIN
            ? 'Олена Коваль'
            : preset.role === UserRole.BUSINESS
            ? 'Ігор Мельник'
            : preset.role === UserRole.ANALYST
            ? 'Марія Данилюк'
            : 'Адміністратор PREDATOR',
        email: `${preset.role}@predator.demo`,
        role: preset.role,
        tier: preset.tier,
        tenant_id: 'demo-tenant',
        tenant_name: 'Predator Analytics Demo',
        last_login: new Date().toISOString(),
        data_sectors: ['customs', 'sanctions', 'market', 'logistics'],
      });
    });

    onLogin();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030b15] px-6 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(3,10,18,0.98))]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:68px_68px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-8 xl:grid-cols-[minmax(0,1.1fr)_480px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col justify-between rounded-[36px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,18,30,0.92),rgba(4,13,22,0.92))] p-8 shadow-[0_28px_90px_rgba(2,6,23,0.4)]"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-200">
                Predator Analytics
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                ТЗ 11.1
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                UX від результату
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              Платформа для оптимізації закупівель імпортера, перевірки контрагентів і керування економією.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Новий стартовий контур побудований навколо результату: демо-режим, екран цінності,
              execution center, рольовий доступ і прозора модель монетизації.
            </p>

            {isLocked && (
              <div className="mt-6 rounded-[24px] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm leading-6 text-rose-100">
                Поточну сесію заблоковано. Повторно оберіть роль демо-користувача для входу.
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
                    <Sparkles className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Aha moment до 3 хвилин</div>
                    <div className="mt-1 text-sm text-slate-400">Швидкий старт без довгого онбордингу.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
                    <BadgePercent className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">% від економії</div>
                    <div className="mt-1 text-sm text-slate-400">Верифікація через інвойси або ERP.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
                    <Workflow className="h-5 w-5 text-violet-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Job-based виконання</div>
                    <div className="mt-1 text-sm text-slate-400">queued → running → success / failed / partial.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10">
                    <CreditCard className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Роль ∩ тариф</div>
                    <div className="mt-1 text-sm text-slate-400">Доступ формується перетином ролі та тарифу.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/[0.08] bg-black/20 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
                <Users className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <div className="text-lg font-black text-white">Що доступно після входу</div>
                <div className="mt-1 text-sm text-slate-400">Командний центр, demo-сценарії, центр виконання, білінг і нова навігація з 6 секцій.</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Ключовий сценарій</div>
                <div className="mt-2 text-base font-bold text-white">Оптимізація закупівель</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Value screen</div>
                <div className="mt-2 text-base font-bold text-white">250 000 ₴ потенційної економії</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Explainability</div>
                <div className="mt-2 text-base font-bold text-white">Топ-3 фактори рекомендації</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-[36px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(6,17,29,0.96),rgba(5,13,23,0.96))] p-6 shadow-[0_26px_80px_rgba(2,6,23,0.34)]"
        >
          <div className="rounded-[28px] border border-emerald-400/18 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Демо-вхід не використовує реальні дані клієнта. Ви заходите в ізольований MVP-контур для перевірки UX і сценаріїв.
          </div>

          <div className="mt-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300/80">
              Оберіть роль
            </div>
            <h2 className="mt-2 text-3xl font-black text-white">Вхід у демо-контур</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Оберіть роль, щоб одразу потрапити у відповідний сценарний контекст без старих технодемок і зайвого шуму.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {rolePresets.map((preset) => {
              const isActive = preset.role === selectedRole;

              return (
                <button
                  key={preset.role}
                  type="button"
                  onClick={() => setSelectedRole(preset.role)}
                  className={`
                    w-full rounded-[24px] border p-4 text-left transition-all duration-200
                    ${isActive ? 'border-cyan-400/30 bg-cyan-500/10 shadow-[0_18px_40px_rgba(14,165,233,0.08)]' : 'border-white/[0.08] bg-black/20 hover:border-white/[0.14] hover:bg-white/[0.04]'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isActive ? 'border-cyan-400/20 bg-cyan-500/10' : 'border-white/[0.08] bg-white/[0.04]'}`}>
                      <preset.icon className={`h-5 w-5 ${isActive ? 'text-cyan-300' : 'text-slate-300'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-black text-white">{preset.title}</div>
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                          {tierLabels[preset.tier]}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-300">{preset.persona}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-400">{preset.description}</div>
                    </div>
                    {isActive && <CheckCircle2 className="mt-1 h-5 w-5 text-cyan-300" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/[0.08] bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Обраний контур</div>
                <div className="mt-2 text-xl font-black text-white">{selectedPreset.persona}</div>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-100">
                {tierLabels[selectedPreset.tier]}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {selectedPreset.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleDemoLogin(selectedPreset)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Увійти як демо-користувач
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginScreen;
