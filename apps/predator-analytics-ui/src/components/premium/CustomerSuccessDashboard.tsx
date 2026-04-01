import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingDown,
  Heart,
  AlertTriangle,
  Zap,
  MessageSquare,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CustomerHealth {
  id: string;
  name: string;
  company: string;
  health: number; // 0-100
  status: 'healthy' | 'at-risk' | 'critical';
  churnRisk: number; // 0-100
  lastActivity: string;
  value: number; // MRR
  usage: number; // %
}

const MOCK_CUSTOMERS: CustomerHealth[] = [
  {
    id: 'cust-1',
    name: 'Марія Іванова',
    company: 'ТОВ Логіст Україна',
    health: 92,
    status: 'healthy',
    churnRisk: 5,
    lastActivity: '2 години тому',
    value: 4500,
    usage: 87,
  },
  {
    id: 'cust-2',
    name: 'Сергій Петренко',
    company: 'ПАТ Імпорт Plus',
    health: 48,
    status: 'at-risk',
    churnRisk: 72,
    lastActivity: '5 днів тому',
    value: 2200,
    usage: 23,
  },
  {
    id: 'cust-3',
    name: 'Алексей Козлов',
    company: 'ООО Трейдинг Київ',
    health: 15,
    status: 'critical',
    churnRisk: 94,
    lastActivity: '12 днів тому',
    value: 1800,
    usage: 5,
  },
];

const MOCK_ACTIONS = [
  { id: 'act-1', customer: 'ПАТ Імпорт Plus', action: 'Перевірити контрагента', type: 'feature_not_used' },
  { id: 'act-2', customer: 'ООО Трейдинг Київ', action: 'Переговорити про план', type: 'churn_risk' },
  { id: 'act-3', customer: 'ТОВ Логіст Україна', action: 'Пропозиція Enterprise', type: 'upsell' },
];

export default function CustomerSuccessDashboard() {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHealth | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'healthy' | 'at-risk' | 'critical'>('all');

  const filtered = MOCK_CUSTOMERS.filter((c) => activeFilter === 'all' || c.status === activeFilter);

  const healthyCount = MOCK_CUSTOMERS.filter((c) => c.status === 'healthy').length;
  const atRiskCount = MOCK_CUSTOMERS.filter((c) => c.status === 'at-risk').length;
  const criticalCount = MOCK_CUSTOMERS.filter((c) => c.status === 'critical').length;
  const totalMRR = MOCK_CUSTOMERS.reduce((acc, c) => acc + c.value, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'emerald';
      case 'at-risk':
        return 'amber';
      case 'critical':
        return 'rose';
      default:
        return 'slate';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return '🟢 Здоров\'я';
      case 'at-risk':
        return '🟡 На ризику';
      case 'critical':
        return '🔴 Критично';
      default:
        return 'Невідомо';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
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
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-rose-400" />
            <h1 className="text-4xl font-black text-white">❤️ Дашборд успіху клієнтів</h1>
          </div>
          <p className="text-slate-400">Здоров\'я клієнтів, ризик відпливу, можливості апгрейду та утримання.</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-emerald-700/50 bg-emerald-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Здорові клієнти</p>
              <p className="text-3xl font-bold text-emerald-400">{healthyCount}</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((healthyCount / MOCK_CUSTOMERS.length) * 100)}% портфеля</p>
            </CardContent>
          </Card>

          <Card className="border-amber-700/50 bg-amber-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">На ризику</p>
              <p className="text-3xl font-bold text-amber-400">{atRiskCount}</p>
              <p className="text-xs text-slate-500 mt-1">Потребують уваги</p>
            </CardContent>
          </Card>

          <Card className="border-rose-700/50 bg-rose-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Критично</p>
              <p className="text-3xl font-bold text-rose-400">{criticalCount}</p>
              <p className="text-xs text-slate-500 mt-1">Дія потрібна</p>
            </CardContent>
          </Card>

          <Card className="border-cyan-700/50 bg-cyan-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Всього MRR</p>
              <p className="text-3xl font-bold text-cyan-400">
                {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalMRR)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Щомісячний дохід</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex gap-2 flex-wrap">
          {(['all', 'healthy', 'at-risk', 'critical'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {filter === 'all' && '📋 Усі'}
              {filter === 'healthy' && '🟢 Здорові'}
              {filter === 'at-risk' && '🟡 На ризику'}
              {filter === 'critical' && '🔴 Критично'}
            </button>
          ))}
        </motion.div>

        {/* Customer Cards */}
        <motion.div variants={itemVariants} className="space-y-4">
          {filtered.map((customer, idx) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="cursor-pointer"
              onClick={() => setSelectedCustomer(customer)}
            >
              <Card
                className={`border-${getStatusColor(customer.status)}-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all group`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">
                          {customer.name}
                        </h3>
                        <Badge
                          className={`bg-${getStatusColor(customer.status)}-500/20 text-${getStatusColor(
                            customer.status
                          )}-300 border-${getStatusColor(customer.status)}-500/30`}
                        >
                          {getStatusLabel(customer.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{customer.company}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-cyan-400">
                        {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(
                          customer.value
                        )}
                      </p>
                      <p className="text-xs text-slate-500">Місячна вартість</p>
                    </div>
                  </div>

                  {/* Health Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Здоров\'я</span>
                        <span className={`font-bold text-${getStatusColor(customer.status)}-400`}>{customer.health}%</span>
                      </div>
                      <Progress value={customer.health} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Ризик</span>
                        <span className="font-bold text-amber-400">{customer.churnRisk}%</span>
                      </div>
                      <Progress value={customer.churnRisk} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Використання</span>
                        <span className="font-bold text-cyan-400">{customer.usage}%</span>
                      </div>
                      <Progress value={customer.usage} className="h-1.5" />
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Остання активність: {customer.lastActivity}
                    </div>
                    <Button size="sm" className="gap-1 bg-cyan-600 hover:bg-cyan-700">
                      <MessageSquare className="w-3 h-3" />
                      Зв\'язатися
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Items */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {MOCK_ACTIONS.map((action, idx) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-3">
                    {action.type === 'churn_risk' && <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
                    {action.type === 'feature_not_used' && <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
                    {action.type === 'upsell' && <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="font-semibold text-white">{action.customer}</p>
                      <p className="text-sm text-slate-400 mt-1">{action.action}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full gap-2 bg-violet-600 hover:bg-violet-700">
                    <CheckCircle className="w-4 h-4" />
                    Виконати дію
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
