/**
 * 💳 BillingDashboard Premium V2 — Панель білінгу з монетизацією
 * Тарифні плани, використання, рахунки та аналітика доходу
 * ТЗ 11.3 | Python 3.12 | 100% Українська
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Check,
  X,
  AlertCircle,
  Download,
  BarChart3,
  Settings,
  Zap,
  Users,
  Calendar,
  ChevronRight,
  Clock,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============ ТИПИ ============

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: 'USD' | 'UAH';
  period: 'месяц' | 'год';
  description: string;
  features: Array<{ name: string; included: boolean }>;
  limits: { scenarios_per_month: number; api_calls: number; storage_gb: number };
  color: string;
  popular: boolean;
}

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  plan: string;
  type: 'subscription' | 'usage' | 'custom';
}

// ============ MOCK-ДАНІ ============

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Базовий',
    price: 299,
    currency: 'USD',
    period: 'месяц',
    description: 'Для стартапів і малого бізнесу',
    features: [
      { name: '10 запусків/місяц', included: true },
      { name: '1000 API запитів', included: true },
      { name: '10 GB сховище', included: true },
      { name: 'Email підтримка', included: true },
      { name: 'AI-рекомендації', included: false },
      { name: 'Конструктор сценаріїв', included: false },
    ],
    limits: { scenarios_per_month: 10, api_calls: 1000, storage_gb: 10 },
    color: 'from-blue-600/20 border-blue-500/30',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Про',
    price: 999,
    currency: 'USD',
    period: 'месяц',
    description: 'Для растущих компаний',
    features: [
      { name: '100 запусків/місяц', included: true },
      { name: '10K API запитів', included: true },
      { name: '100 GB сховище', included: true },
      { name: 'Пріоритетна підтримка', included: true },
      { name: 'AI-рекомендації', included: true },
      { name: 'Конструктор сценаріїв', included: true },
    ],
    limits: { scenarios_per_month: 100, api_calls: 10000, storage_gb: 100 },
    color: 'from-purple-600/20 border-purple-500/30',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Корпоративний',
    price: null,
    currency: 'USD',
    period: 'месяц',
    description: 'Для великих організацій',
    features: [
      { name: 'Невмежені запуски', included: true },
      { name: 'Невмежені API запити', included: true },
      { name: 'Невмежене сховище', included: true },
      { name: '24/7 Dedic. Support', included: true },
      { name: 'AI-рекомендації', included: true },
      { name: 'Конструктор сценаріїв', included: true },
    ],
    limits: { scenarios_per_month: -1, api_calls: -1, storage_gb: -1 },
    color: 'from-amber-600/20 border-amber-500/30',
    popular: false,
  },
];

const USAGE_METRICS: UsageMetric[] = [
  { name: 'Запуски сценаріїв', used: 87, limit: 100, unit: 'шт' },
  { name: 'API запити', used: 8432, limit: 10000, unit: 'запит' },
  { name: 'Сховище даних', used: 45.3, limit: 100, unit: 'GB' },
];

const INVOICES: Invoice[] = [
  {
    id: 'INV-001',
    date: '2026-04-01',
    amount: 999,
    status: 'paid',
    plan: 'Pro',
    type: 'subscription',
  },
  {
    id: 'INV-002',
    date: '2026-03-15',
    amount: 450,
    status: 'paid',
    plan: 'Pro + Usage',
    type: 'usage',
  },
  {
    id: 'INV-003',
    date: '2026-03-01',
    amount: 999,
    status: 'paid',
    plan: 'Pro',
    type: 'subscription',
  },
];

const REVENUE_DATA = [
  { month: 'Січень', revenue: 2450, forecast: 2450 },
  { month: 'Лютий', revenue: 3100, forecast: 3100 },
  { month: 'Березень', revenue: 4200, forecast: 4500 },
  { month: 'Квітень', revenue: 5600, forecast: 6200 },
];

// ============ КОМПОНЕНТ ============

export const BillingDashboardPremiumV2: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<string>('pro');
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'usage' | 'invoices' | 'analytics'>('overview');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            💳 Панель білінгу
          </h1>
          <p className="text-slate-400 text-lg">
            Управління тарифами, використанням та фінансуванням
          </p>
        </motion.div>

        {/* ===== ОСНОВНІ МЕТРИКИ ===== */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Поточний план', value: 'Pro', icon: CreditCard, color: 'purple' },
            { label: 'Вартість/місяц', value: '$999', icon: DollarSign, color: 'emerald' },
            { label: 'Дні до продовження', value: '23', icon: Calendar, color: 'cyan' },
            { label: 'Авт. платіж', value: '✓ Активна', icon: Zap, color: 'amber' },
          ].map((metric, idx) => {
            const Icon = metric.icon;
            const colorMap: Record<string, string> = {
              purple: 'from-purple-600/20 border-purple-500/30 text-purple-400',
              emerald: 'from-emerald-600/20 border-emerald-500/30 text-emerald-400',
              cyan: 'from-cyan-600/20 border-cyan-500/30 text-cyan-400',
              amber: 'from-amber-600/20 border-amber-500/30 text-amber-400',
            };

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-lg border bg-gradient-to-br ${colorMap[metric.color]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-sm text-slate-400 mb-1">{metric.label}</p>
                <p className="text-2xl font-black text-white">{metric.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ===== ТАБС ===== */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/40">
              <TabsTrigger value="overview">Огляд</TabsTrigger>
              <TabsTrigger value="plans">Плани</TabsTrigger>
              <TabsTrigger value="usage">Використання</TabsTrigger>
              <TabsTrigger value="invoices">Рахунки</TabsTrigger>
              <TabsTrigger value="analytics">Аналітика</TabsTrigger>
            </TabsList>

            {/* ===== TAB: OVERVIEW ===== */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div variants={itemVariants} className="p-6 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-purple-500/10">
                <h3 className="text-2xl font-bold text-white mb-4">✨ Поточний план: Pro</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {USAGE_METRICS.map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-300">{metric.name}</p>
                        <span className="text-sm font-bold text-white">{metric.used} / {metric.limit} {metric.unit}</span>
                      </div>
                      <Progress value={(metric.used / metric.limit) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
                <Button className="mt-4 gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Оновити план
                </Button>
              </motion.div>
            </TabsContent>

            {/* ===== TAB: PLANS ===== */}
            <TabsContent value="plans" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-lg border bg-gradient-to-br ${plan.color} relative`}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-3 -right-3 bg-emerald-600 text-white">Популярний</Badge>
                    )}

                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-slate-400 mb-4">{plan.description}</p>

                    {plan.price ? (
                      <div className="mb-4">
                        <span className="text-4xl font-black text-white">${plan.price}</span>
                        <span className="text-slate-400">/{plan.period}</span>
                      </div>
                    ) : (
                      <div className="mb-4 text-xl font-bold text-slate-300">Зв'язатися з отримати пропозицію</div>
                    )}

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-slate-600" />
                          )}
                          <span className={feature.included ? '' : 'line-through opacity-50'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={currentPlan === plan.id ? 'default' : 'outline'}
                    >
                      {currentPlan === plan.id ? '✓ Поточний план' : 'Вибрати'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* ===== TAB: USAGE ===== */}
            <TabsContent value="usage" className="space-y-6">
              <div className="space-y-4">
                {USAGE_METRICS.map((metric, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white">{metric.name}</h4>
                      <span className="text-sm font-bold text-cyan-400">
                        {((metric.used / metric.limit) * 100).toFixed(0)}% використано
                      </span>
                    </div>
                    <Progress value={(metric.used / metric.limit) * 100} className="h-3 mb-2" />
                    <p className="text-xs text-slate-400">
                      {metric.used} з {metric.limit} {metric.unit}
                    </p>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* ===== TAB: INVOICES ===== */}
            <TabsContent value="invoices" className="space-y-4">
              {INVOICES.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{invoice.id}</p>
                      <p className="text-sm text-slate-400">{invoice.date} • {invoice.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">${invoice.amount}</p>
                      <Badge
                        variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {invoice.status === 'paid' ? '✓ Оплачено' : 'На розгляді'}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            {/* ===== TAB: ANALYTICS ===== */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/40">
                <h3 className="text-lg font-bold text-white mb-4">Доходи та прогноз</h3>
                <div className="space-y-3">
                  {REVENUE_DATA.map((data) => (
                    <div key={data.month} className="flex items-center gap-4">
                      <span className="text-sm text-slate-400 w-20">{data.month}</span>
                      <div className="flex-1">
                        <div className="flex gap-1">
                          <div
                            className="h-6 bg-emerald-600 rounded"
                            style={{ width: `${(data.revenue / 6000) * 100}%` }}
                          />
                          <div
                            className="h-6 bg-slate-600/50 rounded"
                            style={{ width: `${(data.forecast / 6000) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white w-16">${data.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ===== FOOTER ===== */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/40 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-cyan-400" />
            <p className="text-sm text-slate-400">
              Наступне списання: <span className="font-bold text-white">1 травня 2026</span>
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Налаштування платежу
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BillingDashboardPremiumV2;
