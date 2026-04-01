import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Download, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BillingPlan {
  id: string;
  name: string;
  tier: 'basic' | 'pro' | 'enterprise';
  price: number;
  currency: string;
  period: 'month' | 'year';
  features: string[];
  limits: { runs: number; api_calls: number; support: string };
  status: 'active' | 'pending' | 'expired';
}

interface SavingsRecord {
  id: string;
  date: string;
  scenario: string;
  savings: number;
  commission: number; // % from savings
  status: 'verified' | 'pending' | 'disputed';
  invoiceUrl?: string;
}

interface UsageMetrics {
  runsUsed: number;
  runsLimit: number;
  apiCallsUsed: number;
  apiCallsLimit: number;
  monthlySpend: number;
  estimatedSavings: number;
  commissionEarned: number;
}

const MOCK_PLAN: BillingPlan = {
  id: 'pro-001',
  name: 'Professional Plan',
  tier: 'pro',
  price: 499,
  currency: 'USD',
  period: 'month',
  features: [
    'До 100 сценаріїв на місяць',
    '5% комісія від економії',
    'Пріоритетна підтримка',
    'Експорт звітів у PDF',
    'Кастомні дашборди',
    'API доступ',
  ],
  limits: { runs: 100, api_calls: 10000, support: '24/7' },
  status: 'active',
};

const MOCK_SAVINGS: SavingsRecord[] = [
  {
    id: 'sav-001',
    date: '2026-03-28',
    scenario: 'Оптимізація закупівлі електроніки',
    savings: 150000,
    commission: 7500,
    status: 'verified',
    invoiceUrl: '#',
  },
  {
    id: 'sav-002',
    date: '2026-03-25',
    scenario: 'Аналіз постачальника',
    savings: 85000,
    commission: 4250,
    status: 'verified',
    invoiceUrl: '#',
  },
  {
    id: 'sav-003',
    date: '2026-03-22',
    scenario: 'Оптимізація логістики',
    savings: 120000,
    commission: 0,
    status: 'pending',
  },
];

const MOCK_USAGE: UsageMetrics = {
  runsUsed: 67,
  runsLimit: 100,
  apiCallsUsed: 7234,
  apiCallsLimit: 10000,
  monthlySpend: 499,
  estimatedSavings: 2850000,
  commissionEarned: 142500,
};

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'savings' | 'invoices'>('overview');
  const [showUpgradePath, setShowUpgradePath] = useState(false);

  const runProgress = (MOCK_USAGE.runsUsed / MOCK_USAGE.runsLimit) * 100;
  const apiProgress = (MOCK_USAGE.apiCallsUsed / MOCK_USAGE.apiCallsLimit) * 100;
  const roiPercentage = MOCK_PLAN.price > 0 ? Math.round((MOCK_USAGE.estimatedSavings / MOCK_PLAN.price) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div className="max-w-7xl mx-auto space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-black text-white mb-2">💰 Дашборд білінгу</h1>
          <p className="text-slate-400 max-w-2xl">
            Управління плануванням, моніторинг вживаних ресурсів, отримана економія та комісійні від результатів.
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Spend */}
          <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Поточна витрата</p>
                  <p className="text-3xl font-bold text-cyan-300">${MOCK_USAGE.monthlySpend}</p>
                </div>
                <CreditCard className="w-8 h-8 text-cyan-400 opacity-20" />
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{MOCK_PLAN.name}</Badge>
            </CardContent>
          </Card>

          {/* Estimated Savings */}
          <Card className="border-emerald-700/50 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Оцінена економія</p>
                  <p className="text-3xl font-bold text-emerald-300">
                    {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(MOCK_USAGE.estimatedSavings)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400 opacity-20" />
              </div>
              <p className="text-xs text-emerald-400">ROI: {roiPercentage}x</p>
            </CardContent>
          </Card>

          {/* Commission Earned */}
          <Card className="border-violet-700/50 bg-violet-950/20 hover:bg-violet-950/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Комісія отримана</p>
                  <p className="text-3xl font-bold text-violet-300">
                    {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(MOCK_USAGE.commissionEarned)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-violet-400 opacity-20" />
              </div>
              <p className="text-xs text-violet-400">5% від результатів</p>
            </CardContent>
          </Card>

          {/* Next Renewal */}
          <Card className="border-amber-700/50 bg-amber-950/20 hover:bg-amber-950/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Наступне поновлення</p>
                  <p className="text-2xl font-bold text-amber-300">28 квітня</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400 opacity-20" />
              </div>
              <Button size="sm" className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white">
                Управління
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Meters */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Використання запусків
              </CardTitle>
              <CardDescription>Сценарії запущені цього місяця</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {MOCK_USAGE.runsUsed} з {MOCK_USAGE.runsLimit}
                  </span>
                  <span className="text-sm font-semibold text-cyan-400">{Math.round(runProgress)}%</span>
                </div>
                <Progress value={runProgress} className="h-2" />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUpgradePath(!showUpgradePath)}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {runProgress > 80 ? '💡 Рекомендація: апгрейд плану' : '✓ Все в нормі'}
              </motion.button>
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400" />
                API виклики
              </CardTitle>
              <CardDescription>REST & WebSocket запити</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-slate-400">
                    {MOCK_USAGE.apiCallsUsed.toLocaleString('uk-UA')} з {MOCK_USAGE.apiCallsLimit.toLocaleString('uk-UA')}
                  </span>
                  <span className="text-sm font-semibold text-violet-400">{Math.round(apiProgress)}%</span>
                </div>
                <Progress value={apiProgress} className="h-2" />
              </div>
              <p className="text-xs text-slate-500">Рейт-лімітування: 100 req/sec</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-3 border-b border-slate-700/50">
          {(['overview', 'plans', 'savings', 'invoices'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'overview' && '📊 Огляд'}
              {tab === 'plans' && '💳 Плани'}
              {tab === 'savings' && '💰 Економія'}
              {tab === 'invoices' && '📄 Рахунки'}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'savings' && (
            <motion.div key="savings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader>
                  <CardTitle>Записи про економію</CardTitle>
                  <CardDescription>Верифіковані та очікуючі результати</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_SAVINGS.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-lg border border-slate-700/30 bg-slate-700/20 hover:bg-slate-700/40 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{record.scenario}</h3>
                          <p className="text-sm text-slate-400 mt-1">{record.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">
                            +{new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(record.savings)}
                          </p>
                          <p className="text-xs text-slate-400">Комісія: {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(record.commission)}</p>
                        </div>
                        <div className="ml-4">
                          {record.status === 'verified' ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Верифікована
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex gap-1">
                              <Clock className="w-3 h-3" />
                              Очікує
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['basic', 'pro', 'enterprise'].map((tier, idx) => (
                  <motion.div key={tier} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}>
                    <Card
                      className={`border-slate-700/50 relative overflow-hidden transition-all ${
                        MOCK_PLAN.tier === tier ? 'ring-2 ring-cyan-500 bg-slate-800/60' : 'bg-slate-800/40 hover:bg-slate-800/50'
                      }`}
                    >
                      {MOCK_PLAN.tier === tier && (
                        <div className="absolute top-0 right-0 bg-cyan-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                          АКТИВНИЙ
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="capitalize">{tier === 'basic' ? 'Basic' : tier === 'pro' ? 'Professional' : 'Enterprise'}</CardTitle>
                        <div className="mt-2">
                          <p className="text-3xl font-bold text-white">
                            {tier === 'basic' ? '$99' : tier === 'pro' ? '$499' : 'Кастом'}
                          </p>
                          <p className="text-sm text-slate-400">/місяць</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {MOCK_PLAN.features.slice(0, 3).map((feature) => (
                            <li key={feature} className="text-sm text-slate-300 flex gap-2">
                              <span className="text-emerald-400">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`w-full ${
                            MOCK_PLAN.tier === tier ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {MOCK_PLAN.tier === tier ? 'Поточний план' : 'Перейти'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div key="invoices" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Рахунки та платежі</CardTitle>
                      <CardDescription>Історія біллінгу та завантажень</CardDescription>
                    </div>
                    <Button size="sm" className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                      <Download className="w-4 h-4" />
                      Експорт
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-lg border border-slate-700/30 bg-slate-700/10 flex items-center justify-between hover:bg-slate-700/30 transition-all group cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white">Рахунок #{i + 1}</p>
                          <p className="text-sm text-slate-400">2026-{String(4 - i).padStart(2, '0')}-{String(30 - i * 5).padStart(2, '0')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">$499</p>
                          <p className="text-xs text-emerald-400">Сплачено</p>
                        </div>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          PDF
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upgrade Banner */}
        <AnimatePresence>
          {showUpgradePath && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-cyan-900/20 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cyan-300">🚀 Рекомендація: Апгрейд на Enterprise</h3>
                  <p className="text-sm text-slate-400 mt-1">Ви використовуєте 67% запусків. Enterprise план має необмежені запуски й персональну підтримку.</p>
                </div>
                <Button className="bg-cyan-600 hover:bg-cyan-700">Дізнатися більше</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
