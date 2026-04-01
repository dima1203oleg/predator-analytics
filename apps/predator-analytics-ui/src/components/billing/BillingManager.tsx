/**
 * 💳 Billing & Monetization Component
 * 
 * Управління тарифними планами, лімітами та монетизацією.
 * Підписки, % від економії, оплата за дії (CPA).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Star,
  Crown,
  Building,
  Zap,
  TrendingUp,
  CheckCircle2,
  X,
  AlertCircle,
  Info,
  DollarSign,
  Target,
  Users,
  Shield,
  Clock,
  ArrowRight,
  Loader2,
  Download,
  History,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: 'UAH' | 'USD';
  period: 'month' | 'year';
  features: string[];
  limits: {
    scenariosPerMonth: number;
    apiCallsPerDay: number;
    storageGB: number;
    customReports: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
  };
  popular?: boolean;
  enterprise?: boolean;
}

interface UsageMetrics {
  scenariosUsed: number;
  scenariosLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  storageUsed: number;
  storageLimit: number;
  daysUntilReset: number;
  savingsGenerated: number; // total savings from recommendations
  savingsThisMonth: number;
}

interface SavingsTransaction {
  id: string;
  date: string;
  amount: number;
  currency: 'UAH' | 'USD';
  percentage: number;
  scenario: string;
  status: 'pending' | 'confirmed' | 'disputed';
  verified: boolean;
}

// Mock data
const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2499,
    currency: 'UAH',
    period: 'month',
    features: [
      '5 запусків сценаріїв на місяць',
      'Базові звіти та аналітика',
      'Обмежена історія даних',
      'Email підтримка',
    ],
    limits: {
      scenariosPerMonth: 5,
      apiCallsPerDay: 100,
      storageGB: 1,
      customReports: false,
      prioritySupport: false,
      whiteLabel: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12499,
    currency: 'UAH',
    period: 'month',
    popular: true,
    features: [
      '50 запусків сценаріїв на місяць',
      'Розширена аналітика та дашборди',
      'Кастомні звіти',
      'Пріоритетна підтримка',
      'Інтеграція з CRM/ERP',
      'Експорт даних',
    ],
    limits: {
      scenariosPerMonth: 50,
      apiCallsPerDay: 1000,
      storageGB: 10,
      customReports: true,
      prioritySupport: true,
      whiteLabel: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    currency: 'USD',
    period: 'month',
    enterprise: true,
    features: [
      'Необмежені запуски сценаріїв',
      'Конструктор рішень',
      'Оркестрація інтеграцій',
      'On‑premise розгортання',
      'Персональний менеджер',
      'SLA гарантії',
      'White label можливості',
      'Кастомні інтеграції',
    ],
    limits: {
      scenariosPerMonth: -1, // unlimited
      apiCallsPerDay: -1,
      storageGB: -1,
      customReports: true,
      prioritySupport: true,
      whiteLabel: true,
    },
  },
];

const MOCK_USAGE: UsageMetrics = {
  scenariosUsed: 3,
  scenariosLimit: 5,
  apiCallsUsed: 45,
  apiCallsLimit: 100,
  storageUsed: 0.3,
  storageLimit: 1,
  daysUntilReset: 12,
  savingsGenerated: 750000,
  savingsThisMonth: 125000,
};

const MOCK_SAVINGS: SavingsTransaction[] = [
  {
    id: 'sav-001',
    date: '2024-03-20',
    amount: 250000,
    currency: 'UAH',
    percentage: 15.5,
    scenario: 'Оптимізація закупівель електрогенераторів',
    status: 'confirmed',
    verified: true,
  },
  {
    id: 'sav-002',
    date: '2024-03-18',
    amount: 180000,
    currency: 'UAH',
    percentage: 12.3,
    scenario: 'Перевірка постачальника комп’ютерної техніки',
    status: 'confirmed',
    verified: true,
  },
  {
    id: 'sav-003',
    date: '2024-03-15',
    amount: 95000,
    currency: 'UAH',
    percentage: 8.7,
    scenario: 'Аналіз ринку будівельних матеріалів',
    status: 'pending',
    verified: false,
  },
];

// Components
const PlanCard: React.FC<{
  plan: BillingPlan;
  currentPlanId: string;
  onSelectPlan: (planId: string) => void;
}> = ({ plan, currentPlanId, onSelectPlan }) => {
  const isCurrentPlan = plan.id === currentPlanId;
  const isUpgrade = plan.limits.scenariosPerMonth > BILLING_PLANS.find(p => p.id === currentPlanId)?.limits.scenariosPerMonth!;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative rounded-xl border-2 p-6 ${
        plan.popular ? 'border-cyan-500 bg-cyan-500/5' :
        plan.enterprise ? 'border-amber-500 bg-amber-500/5' :
        'border-slate-700 bg-slate-900/50'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-cyan-500 text-white px-3 py-1">
            <Star className="w-4 h-4 mr-1" />
            Найпопулярніший
          </Badge>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3 bg-gradient-to-br from-cyan-500 to-blue-500">
          {plan.id === 'basic' && <CreditCard className="w-6 h-6 text-white" />}
          {plan.id === 'pro' && <Crown className="w-6 h-6 text-white" />}
          {plan.id === 'enterprise' && <Building className="w-6 h-6 text-white" />}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
        {!plan.enterprise ? (
          <div>
            <div className="text-3xl font-bold text-white">
              {plan.price.toLocaleString('uk-UA')} {plan.currency}
            </div>
            <div className="text-slate-400">
              на {plan.period === 'month' ? 'місяць' : 'рік'}
            </div>
          </div>
        ) : (
          <div className="text-xl font-semibold text-amber-400">
            Індивідуально
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={() => onSelectPlan(plan.id)}
        disabled={isCurrentPlan}
        className={`w-full ${
          isCurrentPlan
            ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
            : plan.popular
            ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
            : plan.enterprise
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-white'
        }`}
      >
        {isCurrentPlan ? 'Поточний план' : 
         isUpgrade ? 'Оновити' : 
         plan.enterprise ? 'Зв’язатися з нами' : 'Обрати план'}
      </Button>
    </motion.div>
  );
};

const UsageDashboard: React.FC<{
  usage: UsageMetrics;
  currentPlan: BillingPlan;
}> = ({ usage, currentPlan }) => (
  <div className="space-y-6">
    {/* Quick Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Target className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Сценарії</div>
              <div className="text-lg font-semibold text-white">
                {usage.scenariosUsed}/{usage.scenariosLimit === -1 ? '∞' : usage.scenariosLimit}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Економія цього місяця</div>
              <div className="text-lg font-semibold text-emerald-400">
                {usage.savingsThisMonth.toLocaleString('uk-UA')} ₴
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">API виклики</div>
              <div className="text-lg font-semibold text-white">
                {usage.apiCallsUsed}/{usage.apiCallsLimit === -1 ? '∞' : usage.apiCallsLimit}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">До оновлення</div>
              <div className="text-lg font-semibold text-amber-400">
                {usage.daysUntilReset} днів
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Usage Progress */}
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Використання лімітів</CardTitle>
        <CardDescription className="text-slate-400">
          Поточне використання ресурсів вашого плану
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-300">Сценарії цього місяця</span>
            <span className="text-sm text-slate-400">
              {usage.scenariosUsed}/{usage.scenariosLimit === -1 ? '∞' : usage.scenariosLimit}
            </span>
          </div>
          <Progress 
            value={usage.scenariosLimit === -1 ? 0 : (usage.scenariosUsed / usage.scenariosLimit) * 100}
            className="h-2"
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-300">API виклики сьогодні</span>
            <span className="text-sm text-slate-400">
              {usage.apiCallsUsed}/{usage.apiCallsLimit === -1 ? '∞' : usage.apiCallsLimit}
            </span>
          </div>
          <Progress 
            value={usage.apiCallsLimit === -1 ? 0 : (usage.apiCallsUsed / usage.apiCallsLimit) * 100}
            className="h-2"
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-300">Сховище даних</span>
            <span className="text-sm text-slate-400">
              {usage.storageUsed}GB/{usage.storageLimit === -1 ? '∞' : usage.storageLimit}GB
            </span>
          </div>
          <Progress 
            value={usage.storageLimit === -1 ? 0 : (usage.storageUsed / usage.storageLimit) * 100}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  </div>
);

const SavingsTracker: React.FC<{
  savings: SavingsTransaction[];
}> = ({ savings }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">Відстеження економії</h3>
      <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
        <Download className="w-4 h-4 mr-2" />
        Завантажити звіт
      </Button>
    </div>

    <Alert className="bg-emerald-500/10 border-emerald-500/30">
      <Info className="w-4 h-4 text-emerald-400" />
      <AlertDescription className="text-emerald-200">
        <strong>Модель % від економії:</strong> Ви платите лише 5% від підтвердженої економії. 
        Підтвердження через завантаження інвойсів або ручна верифікація.
      </AlertDescription>
    </Alert>

    <div className="space-y-3">
      {savings.map((transaction) => (
        <Card key={transaction.id} className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium text-white">{transaction.scenario}</h4>
                  <Badge className={
                    transaction.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-300' :
                    transaction.status === 'pending' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }>
                    {transaction.status === 'confirmed' ? 'Підтверджено' :
                     transaction.status === 'pending' ? 'Очікує' : 'Спір'}
                  </Badge>
                  {transaction.verified && (
                    <Shield className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  {new Date(transaction.date).toLocaleDateString('uk-UA')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-emerald-400">
                  {transaction.amount.toLocaleString('uk-UA')} {transaction.currency}
                </div>
                <div className="text-sm text-slate-400">
                  {transaction.percentage}% економії
                </div>
                {transaction.status === 'pending' && (
                  <Button variant="outline" size="sm" className="mt-2 border-slate-700 text-slate-300">
                    Підтвердити
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Main Component
export const BillingManager: React.FC = () => {
  const [currentPlanId, setCurrentPlanId] = useState('basic');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [usage] = useState<UsageMetrics>(MOCK_USAGE);
  const [savings] = useState<SavingsTransaction[]>(MOCK_SAVINGS);

  const currentPlan = BILLING_PLANS.find(p => p.id === currentPlanId)!;

  const handleSelectPlan = (planId: string) => {
    if (planId === 'enterprise') {
      // Handle enterprise contact
      window.open('mailto:enterprise@predator.analytics?subject=Enterprise Plan Inquiry');
      return;
    }
    
    setSelectedPlanId(planId);
    setShowUpgradeDialog(true);
  };

  const handleConfirmUpgrade = () => {
    // Simulate payment processing
    setCurrentPlanId(selectedPlanId!);
    setShowUpgradeDialog(false);
    setSelectedPlanId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">💳 Тарифний план та білінг</h1>
            <p className="text-slate-400">
              Управління підпискою, лімітами та відстеження економії
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30 px-4 py-2">
              <Crown className="w-4 h-4 mr-1" />
              {currentPlan.name}
            </Badge>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Settings className="w-4 h-4 mr-2" />
              Налаштування
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
              Огляд
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-slate-800">
              Тарифні плани
            </TabsTrigger>
            <TabsTrigger value="savings" className="data-[state=active]:bg-slate-800">
              Економія
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-800">
              Історія
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <UsageDashboard usage={usage} currentPlan={currentPlan} />
          </TabsContent>

          <TabsContent value="plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BILLING_PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlanId={currentPlanId}
                  onSelectPlan={handleSelectPlan}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="savings">
            <SavingsTracker savings={savings} />
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <History className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Історія платежів</h3>
                <p className="text-slate-400 mb-6">
                  Детальна історія всіх транзакцій та підписок
                </p>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  Завантажити історію
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upgrade Confirmation Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200">
            <DialogHeader>
              <DialogTitle className="text-white">Підтвердження оновлення</DialogTitle>
              <DialogDescription className="text-slate-400">
                Ви обираєте перехід на тарифний план {BILLING_PLANS.find(p => p.id === selectedPlanId)?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedPlanId && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-white">Новий тариф:</span>
                    <span className="text-cyan-400 font-semibold">
                      {BILLING_PLANS.find(p => p.id === selectedPlanId)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">Вартість:</span>
                    <span className="text-white font-semibold">
                      {BILLING_PLANS.find(p => p.id === selectedPlanId)?.price.toLocaleString('uk-UA')} {
                        BILLING_PLANS.find(p => p.id === selectedPlanId)?.currency
                      }/міс
                    </span>
                  </div>
                </div>
              )}

              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  Оновлення вступить в силу негайно. Зміни будуть відображені у вашому наступному платежі.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="border-slate-700 text-slate-300">
                Скасувати
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-white" onClick={handleConfirmUpgrade}>
                <CreditCard className="w-4 h-4 mr-2" />
                Оплатити оновлення
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BillingManager;
