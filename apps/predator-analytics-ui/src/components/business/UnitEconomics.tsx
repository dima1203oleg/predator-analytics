/**
 * 💰 Фінанси / Unit-економіка Component
 * 
 * Фінансовий контроль та unit-економіка бізнес-процесів.
 * Відображає бюджети, витрати, економію, CPA, ROI по модулях, LTV/CAC.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  LineChart,
  Landmark,
  Users,
  Activity,
  Clock,
  Package,
  Cpu,
  Globe,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Filter,
  Download,
  Target,
  Zap,
  Wallet,
  Receipt,
  Calculator,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface BudgetItem {
  id: string;
  category: string;
  planned: number;
  actual: number;
  variance: number;
  status: 'under' | 'on_track' | 'over';
}

interface ModuleROI {
  id: string;
  name: string;
  type: 'agent' | 'integration' | 'feature' | 'module';
  cost: number;
  revenue: number;
  savings: number;
  roi: number;
  usageCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface CostPerAction {
  action: string;
  category: string;
  count: number;
  totalCost: number;
  cpa: number;
  trend: number; // percentage change
}

interface LTVCAC {
  segment: string;
  customers: number;
  ltv: number;
  cac: number;
  ratio: number;
  paybackPeriod: number; // months
  trend: 'improving' | 'stable' | 'worsening';
}

// Mock data
const MOCK_BUDGETS: BudgetItem[] = [
  { id: 'b1', category: 'Інфраструктура та хмара', planned: 15000, actual: 14200, variance: -5.3, status: 'under' },
  { id: 'b2', category: 'API та зовнішні сервіси', planned: 8000, actual: 8750, variance: 9.4, status: 'over' },
  { id: 'b3', category: 'Ліцензії ШІ-моделей', planned: 12000, actual: 11800, variance: -1.7, status: 'on_track' },
  { id: 'b4', category: 'Персонал (аналітики)', planned: 45000, actual: 45000, variance: 0, status: 'on_track' },
  { id: 'b5', category: 'Маркетинг та продажі', planned: 10000, actual: 6500, variance: -35.0, status: 'under' },
];

const MOCK_MODULE_ROI: ModuleROI[] = [
  { id: 'm1', name: 'Агент перевірки контрагентів', type: 'agent', cost: 2400, revenue: 0, savings: 45000, roi: 1775, usageCount: 1247, trend: 'up' },
  { id: 'm2', name: 'Інтеграція з митницею', type: 'integration', cost: 3600, revenue: 0, savings: 28000, roi: 678, usageCount: 892, trend: 'up' },
  { id: 'm3', name: 'Модуль прогнозування', type: 'feature', cost: 4800, revenue: 15000, savings: 8000, roi: 479, usageCount: 534, trend: 'stable' },
  { id: 'm4', name: 'Автоматичний імпорт', type: 'module', cost: 5200, revenue: 25000, savings: 12000, roi: 712, usageCount: 678, trend: 'up' },
  { id: 'm5', name: 'OSINT-агент', type: 'agent', cost: 1800, revenue: 0, savings: 22000, roi: 1122, usageCount: 945, trend: 'up' },
];

const MOCK_CPA: CostPerAction[] = [
  { action: 'Перевірка контрагента', category: 'Дiligence', count: 1247, totalCost: 892, cpa: 0.72, trend: -12 },
  { action: 'Генерація звіту', category: 'Reports', count: 534, totalCost: 213, cpa: 0.40, trend: -8 },
  { action: 'Запуск ШІ-агента', category: 'AI', count: 892, totalCost: 445, cpa: 0.50, trend: -15 },
  { action: 'API запит (customs)', category: 'Integration', count: 5678, totalCost: 340, cpa: 0.06, trend: -5 },
  { action: 'Експорт даних', category: 'Data', count: 234, totalCost: 47, cpa: 0.20, trend: -20 },
];

const MOCK_LTV_CAC: LTVCAC[] = [
  { segment: 'Enterprise', customers: 12, ltv: 125000, cac: 15000, ratio: 8.3, paybackPeriod: 3, trend: 'improving' },
  { segment: 'Mid-market', customers: 45, ltv: 45000, cac: 6500, ratio: 6.9, paybackPeriod: 4, trend: 'improving' },
  { segment: 'SMB', customers: 156, ltv: 12000, cac: 2800, ratio: 4.3, paybackPeriod: 6, trend: 'stable' },
  { segment: 'Startup', customers: 89, ltv: 8500, cac: 3200, ratio: 2.7, paybackPeriod: 8, trend: 'worsening' },
];

// Components
const MetricCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, change, trend, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                {trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                {trend === 'neutral' && <Minus className="w-4 h-4" />}
                {change}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const BudgetProgress: React.FC<{ item: BudgetItem }> = ({ item }) => {
  const percentage = (item.actual / item.planned) * 100;
  const isOver = item.status === 'over';
  const isUnder = item.status === 'under';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{item.category}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            isOver ? 'text-red-400' : isUnder ? 'text-emerald-400' : 'text-slate-300'
          }`}>
            ${item.actual.toLocaleString()} / ${item.planned.toLocaleString()}
          </span>
          <Badge className={`text-xs ${
            isOver ? 'bg-red-500/20 text-red-400' : isUnder ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
          }`}>
            {item.variance > 0 ? '+' : ''}{item.variance}%
          </Badge>
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${
          isOver ? 'bg-red-900' : isUnder ? 'bg-emerald-900' : 'bg-slate-800'
        }`}
      />
    </div>
  );
};

const ROICard: React.FC<{ module: ModuleROI }> = ({ module }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              module.type === 'agent' ? 'bg-blue-500/20 text-blue-400' :
              module.type === 'integration' ? 'bg-violet-500/20 text-violet-400' :
              module.type === 'feature' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-amber-500/20 text-amber-400'
            }`}>
              {module.type === 'agent' && <Cpu className="w-5 h-5" />}
              {module.type === 'integration' && <Globe className="w-5 h-5" />}
              {module.type === 'feature' && <Zap className="w-5 h-5" />}
              {module.type === 'module' && <Package className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-medium text-white">{module.name}</h4>
              <p className="text-xs text-slate-400 capitalize">{module.type}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{module.roi}%</div>
            <div className="text-xs text-slate-500">ROI</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
          <div>
            <div className="text-slate-400">Витрати</div>
            <div className="text-white font-medium">${module.cost.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-400">Економія</div>
            <div className="text-emerald-400 font-medium">+${module.savings.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-400">Використань</div>
            <div className="text-white font-medium">{module.usageCount.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Badge className={`text-xs ${
            module.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
            module.trend === 'down' ? 'bg-red-500/20 text-red-400' :
            'bg-slate-700 text-slate-300'
          }`}>
            {module.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
            {module.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
            {module.trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
            {module.trend === 'up' ? 'Зростає' : module.trend === 'down' ? 'Падає' : 'Стабільно'}
          </Badge>
          <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
            Деталі <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Main Component
export const UnitEconomics: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const totalBudget = useMemo(() => MOCK_BUDGETS.reduce((acc, b) => acc + b.planned, 0), []);
  const totalActual = useMemo(() => MOCK_BUDGETS.reduce((acc, b) => acc + b.actual, 0), []);
  const totalSavings = useMemo(() => MOCK_MODULE_ROI.reduce((acc, m) => acc + m.savings, 0), []);
  const avgROI = useMemo(() => 
    Math.round(MOCK_MODULE_ROI.reduce((acc, m) => acc + m.roi, 0) / MOCK_MODULE_ROI.length), 
  []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">💰 Фінанси / Unit-економіка</h1>
            <p className="text-slate-400">Фінансовий контроль та економіка бізнес-процесів</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-800">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="week">Цей тиждень</SelectItem>
                <SelectItem value="month">Цей місяць</SelectItem>
                <SelectItem value="quarter">Цей квартал</SelectItem>
                <SelectItem value="year">Цей рік</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="w-4 h-4 mr-2" /> Експорт
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Загальні витрати"
            value={`$${totalActual.toLocaleString()}`}
            change={`${((totalActual / totalBudget - 1) * 100).toFixed(1)}% від бюджету`}
            trend={totalActual > totalBudget ? 'down' : 'up'}
            icon={<Wallet className="w-6 h-6 text-blue-400" />}
            color="bg-blue-500/20"
          />
          <MetricCard
            title="Зекономлено"
            value={`$${totalSavings.toLocaleString()}`}
            change="+24% vs минулий місяць"
            trend="up"
            icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
            color="bg-emerald-500/20"
          />
          <MetricCard
            title="Середній ROI"
            value={`${avgROI}%`}
            change="+18% vs минулий місяць"
            trend="up"
            icon={<Percent className="w-6 h-6 text-amber-400" />}
            color="bg-amber-500/20"
          />
          <MetricCard
            title="Середній CPA"
            value="$0.45"
            change="-12% оптимізація"
            trend="up"
            icon={<Calculator className="w-6 h-6 text-cyan-400" />}
            color="bg-cyan-500/20"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800">
              <PieChart className="w-4 h-4 mr-2" /> Огляд
            </TabsTrigger>
            <TabsTrigger value="budgets" className="data-[state=active]:bg-slate-800">
              <Landmark className="w-4 h-4 mr-2" /> Бюджети
            </TabsTrigger>
            <TabsTrigger value="roi" className="data-[state=active]:bg-slate-800">
              <LineChart className="w-4 h-4 mr-2" /> ROI по модулях
            </TabsTrigger>
            <TabsTrigger value="cpa" className="data-[state=active]:bg-slate-800">
              <Activity className="w-4 h-4 mr-2" /> Вартість дії
            </TabsTrigger>
            <TabsTrigger value="ltv" className="data-[state=active]:bg-slate-800">
              <Users className="w-4 h-4 mr-2" /> LTV / CAC
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Budget Summary */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-blue-400" />
                    Бюджети
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Виконання бюджету за категоріями
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_BUDGETS.map((item) => (
                    <BudgetProgress key={item.id} item={item} />
                  ))}
                </CardContent>
              </Card>

              {/* Top ROI Modules */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Топ ROI
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Найефективніші модулі за ROI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_MODULE_ROI.slice(0, 4).map((module, index) => (
                    <div key={module.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-white">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-sm text-white">{module.name}</div>
                          <div className="text-xs text-slate-400">{module.usageCount.toLocaleString()} використань</div>
                        </div>
                      </div>
                      <div className="text-emerald-400 font-semibold">{module.roi}%</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Savings Summary */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/20 rounded-xl">
                      <Receipt className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Агрегована економія</h3>
                      <p className="text-slate-400">Завдяки автоматизації та оптимізації процесів</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-400">${totalSavings.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">З початку року</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budgets Tab */}
          <TabsContent value="budgets">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Деталізація бюджетів</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Категорія</TableHead>
                      <TableHead className="text-slate-400 text-right">Заплановано</TableHead>
                      <TableHead className="text-slate-400 text-right">Фактично</TableHead>
                      <TableHead className="text-slate-400 text-right">Відхилення</TableHead>
                      <TableHead className="text-slate-400 text-center">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_BUDGETS.map((item) => (
                      <TableRow key={item.id} className="border-slate-800">
                        <TableCell className="text-white">{item.category}</TableCell>
                        <TableCell className="text-right text-slate-300">
                          ${item.planned.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-white font-medium">
                          ${item.actual.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${
                          item.variance > 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {item.variance > 0 ? '+' : ''}{item.variance}%
                        </TableCell>
                        <TableCell className="text-center">
                          {item.status === 'on_track' && (
                            <Badge className="bg-emerald-500/20 text-emerald-400">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> В нормі
                            </Badge>
                          )}
                          {item.status === 'over' && (
                            <Badge className="bg-red-500/20 text-red-400">
                              <AlertCircle className="w-3 h-3 mr-1" /> Перевитрата
                            </Badge>
                          )}
                          {item.status === 'under' && (
                            <Badge className="bg-blue-500/20 text-blue-400">
                              <Target className="w-3 h-3 mr-1" /> Економія
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Tab */}
          <TabsContent value="roi">
            <div className="grid grid-cols-2 gap-6">
              {MOCK_MODULE_ROI.map((module) => (
                <ROICard key={module.id} module={module} />
              ))}
            </div>
          </TabsContent>

          {/* CPA Tab */}
          <TabsContent value="cpa">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Вартість дії (CPA)</CardTitle>
                <CardDescription className="text-slate-400">
                  Розрахунок вартості кожної автоматизованої дії
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Дія</TableHead>
                      <TableHead className="text-slate-400">Категорія</TableHead>
                      <TableHead className="text-slate-400 text-right">Кількість</TableHead>
                      <TableHead className="text-slate-400 text-right">Загальна вартість</TableHead>
                      <TableHead className="text-slate-400 text-right">CPA</TableHead>
                      <TableHead className="text-slate-400 text-center">Тренд</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_CPA.map((item) => (
                      <TableRow key={item.action} className="border-slate-800">
                        <TableCell className="text-white">{item.action}</TableCell>
                        <TableCell className="text-slate-400">{item.category}</TableCell>
                        <TableCell className="text-right text-slate-300">
                          {item.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          ${item.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-white font-medium">
                          ${item.cpa.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs ${
                            item.trend < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {item.trend > 0 ? '+' : ''}{item.trend}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LTV/CAC Tab */}
          <TabsContent value="ltv">
            <div className="grid grid-cols-2 gap-6">
              {MOCK_LTV_CAC.map((segment) => (
                <Card key={segment.segment} className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{segment.segment}</CardTitle>
                      <Badge className={`${
                        segment.trend === 'improving' ? 'bg-emerald-500/20 text-emerald-400' :
                        segment.trend === 'stable' ? 'bg-slate-700 text-slate-300' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {segment.trend === 'improving' ? 'Покращується' : 
                         segment.trend === 'stable' ? 'Стабільно' : 'Погіршується'}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-400">
                      {segment.customers} клієнтів
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">LTV</div>
                        <div className="text-xl font-bold text-white">${segment.ltv.toLocaleString()}</div>
                      </div>
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">CAC</div>
                        <div className="text-xl font-bold text-white">${segment.cac.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div>
                        <div className="text-sm text-slate-400">LTV/CAC Ratio</div>
                        <div className={`text-lg font-bold ${
                          segment.ratio >= 3 ? 'text-emerald-400' : 
                          segment.ratio >= 1 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {segment.ratio.toFixed(1)}x
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Окупність</div>
                        <div className="text-lg font-bold text-white">{segment.paybackPeriod} міс</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {segment.ratio >= 3 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Здорова економіка</span>
                        </>
                      ) : segment.ratio >= 1 ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-amber-400">Потребує уваги</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Критична ситуація</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnitEconomics;
