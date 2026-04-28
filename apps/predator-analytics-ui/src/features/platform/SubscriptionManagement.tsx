/**
 * 💳 Subscription Management
 *
 * Управління підписками та тарифами
 * Billing, upgrade, downgrade
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  CreditCard,
  Check,
  X,
  Zap,
  Shield,
  Building2,
  Users,
  Star,
  ChevronRight,
  Download,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  Globe,
  Brain,
  BarChart3,
  Bell,
  FileText,
  Sparkles,
  Lock,
  Unlock,
  ArrowUp,
  Gift,
  AlertCircle
} from 'lucide-react';

import { UserRole } from '../../config/roles';

type PlanId = UserRole | 'government' | 'enterprise'; // Maintain alignment with existing mock logic while using enum values

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  color: string;
  icon: React.ElementType;
  features: { name: string; included: boolean }[];
  popular?: boolean;
  current?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
}

// ========================
// Mock Data
// ========================

const plans: Plan[] = [
  {
    id: UserRole.CLIENT_BASIC,
    name: 'Free',
    price: 0,
    currency: 'USD',
    period: '/міс',
    description: 'Базовий доступ для ознайомлення',
    color: 'slate',
    icon: Package,
    features: [
      { name: 'Базовий пошук', included: true },
      { name: '100 запитів/день', included: true },
      { name: 'Історія 30 днів', included: true },
      { name: 'API доступ', included: false },
      { name: 'Експорт даних', included: false },
      { name: 'AI Insights', included: false },
      { name: 'Real-time дані', included: false },
      { name: 'Підтримка', included: false },
    ]
  },
  {
    id: 'business' as PlanId, // Specific mock category, not directly a base role
    name: 'Business',
    price: 299,
    currency: 'USD',
    period: '/міс',
    description: 'Для малого та середнього бізнесу',
    color: 'cyan',
    icon: Building2,
    features: [
      { name: '� озширений пошук', included: true },
      { name: '5,000 запитів/день', included: true },
      { name: 'Історія 1 рік', included: true },
      { name: 'API доступ', included: true },
      { name: 'Експорт PDF/Excel', included: true },
      { name: 'AI Insights', included: true },
      { name: 'Real-time дані', included: false },
      { name: 'Email підтримка', included: true },
    ],
    current: true
  },
  {
    id: 'government',
    name: 'Government',
    price: 499,
    currency: 'USD',
    period: '/міс',
    description: 'Для державних структур та compliance',
    color: 'purple',
    icon: Shield,
    features: [
      { name: 'Повний пошук', included: true },
      { name: 'Необмежені запити', included: true },
      { name: 'Історія 5 років', included: true },
      { name: 'API доступ', included: true },
      { name: 'Всі формати експорту', included: true },
      { name: 'AI Insights + � изики', included: true },
      { name: 'Real-time дані', included: true },
      { name: 'Пріоритетна підтримка', included: true },
    ]
  },
  {
    id: UserRole.CLIENT_PREMIUM,
    name: 'Premium',
    price: 999,
    currency: 'USD',
    period: '/міс',
    description: 'Максимальні можливості для enterprise',
    color: 'amber',
    icon: Crown,
    popular: true,
    features: [
      { name: 'Все з Government', included: true },
      { name: 'Кастомні дашборди', included: true },
      { name: 'White-label рішення', included: true },
      { name: 'Dedicated API', included: true },
      { name: 'Власні ML моделі', included: true },
      { name: 'Advanced AI', included: true },
      { name: 'SLA 99.9%', included: true },
      { name: 'Dedicated менеджер', included: true },
    ]
  },
];

const invoices: Invoice[] = [
  { id: '1', date: '2026-02-01', amount: 299, status: 'paid', description: 'Business Plan - Лютий 2026' },
  { id: '2', date: '2026-01-01', amount: 299, status: 'paid', description: 'Business Plan - Січень 2026' },
  { id: '3', date: '2025-12-01', amount: 299, status: 'paid', description: 'Business Plan - Грудень 2025' },
];

const usageMetrics: UsageMetric[] = [
  { name: 'API запити', used: 3245, limit: 5000, unit: '/день' },
  { name: 'Експорти', used: 45, limit: 100, unit: '/міс' },
  { name: 'Звіти', used: 12, limit: 50, unit: '/міс' },
  { name: 'Алерти', used: 8, limit: 25, unit: 'активних' },
];

// ========================
// Components
// ========================

const PlanCard: React.FC<{ plan: Plan; onSelect: () => void }> = ({ plan, onSelect }) => {
  const Icon = plan.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`
        relative p-6 rounded-2xl border transition-all
        ${plan.popular ? 'border-amber-500/50 bg-amber-500/5' :
          plan.current ? 'border-cyan-500/50 bg-cyan-500/5' :
          'border-white/5 bg-slate-900/60'}
      `}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-black rounded-full">
          ПОПУЛЯ� НИЙ
        </div>
      )}

      {plan.current && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-black text-xs font-black rounded-full">
          ПОТОЧНИЙ
        </div>
      )}

      <div className="text-center mb-6">
        <div className={`inline-flex p-3 rounded-xl bg-${plan.color}-500/20 mb-4`}>
          <Icon className={`text-${plan.color}-400`} size={28} />
        </div>
        <h3 className="text-xl font-black text-white">{plan.name}</h3>
        <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-black text-white">${plan.price}</span>
        <span className="text-slate-500">{plan.period}</span>
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            {feature.included ? (
              <Check className="text-emerald-400" size={16} />
            ) : (
              <X className="text-slate-600" size={16} />
            )}
            <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
              {feature.name}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onSelect}
        disabled={plan.current}
        className={`
          w-full py-3 rounded-xl font-bold text-sm transition-colors
          ${plan.current ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
            plan.popular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90' :
            `bg-${plan.color}-500/20 text-${plan.color}-400 hover:bg-${plan.color}-500/30`}
        `}
      >
        {plan.current ? 'Поточний план' : plan.price > 299 ? 'Upgrade' : 'Обрати план'}
      </button>
    </motion.div>
  );
};

const UsageBar: React.FC<{ metric: UsageMetric }> = ({ metric }) => {
  const percentage = (metric.used / metric.limit) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-white">{metric.name}</span>
        <span className={`text-sm ${isNearLimit ? 'text-amber-400' : 'text-slate-400'}`}>
          {metric.used.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full rounded-full ${
            isNearLimit ? 'bg-gradient-to-r from-amber-500 to-amber-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
          }`}
        />
      </div>
      {isNearLimit && (
        <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
          <AlertCircle size={12} />
          Близько до ліміту
        </p>
      )}
    </div>
  );
};

// ========================
// Main Component
// ========================

const SubscriptionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'usage' | 'billing'>('plans');
  const currentPlan = plans.find(p => p.current);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <Crown className="text-amber-400" />
              Підписка та тарифи
            </h1>
            <p className="text-slate-500 mt-1">
              Управління вашим планом та платежами
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentPlan && (
              <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl">
                <span className="text-sm text-slate-400">Поточний план: </span>
                <span className="font-bold text-cyan-400">{currentPlan.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { id: 'plans', label: 'Тарифні плани', icon: Crown },
            { id: 'usage', label: 'Використання', icon: BarChart3 },
            { id: 'billing', label: 'Платежі', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                activeTab === tab.id ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => console.log('Select plan:', plan.id)}
              />
            ))}
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usageMetrics.map((metric, i) => (
                <UsageBar key={i} metric={metric} />
              ))}
            </div>

            <div className="p-6 bg-slate-900/40 border border-white/5 rounded-xl">
              <h3 className="font-bold text-white mb-4">Період використання</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Початок періоду</span>
                <span className="text-white">1 лютого 2026</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Кінець періоду</span>
                <span className="text-white">28 лютого 2026</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500">Днів залишилось</span>
                <span className="text-cyan-400">25 днів</span>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Payment Method */}
            <div className="p-6 bg-slate-900/60 border border-white/5 rounded-xl">
              <h3 className="font-bold text-white mb-4">Спосіб оплати</h3>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-xl">
                  <CreditCard className="text-cyan-400" size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">Visa •••• 4242</p>
                  <p className="text-sm text-slate-500">Термін дії: 12/28</p>
                </div>
                <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">
                  Змінити
                </button>
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h3 className="font-bold text-white mb-4">Історія платежів</h3>
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center gap-4 p-4 bg-slate-900/60 border border-white/5 rounded-xl">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Check className="text-emerald-400" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm">{invoice.description}</p>
                      <p className="text-xs text-slate-500">{new Date(invoice.date).toLocaleDateString('uk')}</p>
                    </div>
                    <span className="font-bold text-white">${invoice.amount}</span>
                    <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white" title="Завантажити">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Promo Banner */}
        <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Gift className="text-amber-400" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">Upgrade зараз та отримай 20% знижку!</h3>
              <p className="text-sm text-amber-400/80">Пропозиція діє до кінця місяця</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-xl">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
