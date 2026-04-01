/**
 * 📊 Business Scenarios Component
 * 
 * Готові процеси для швидкого запуску бізнес-операцій.
 * Імпорт товару, перевірка контрагента, аналіз ринку перед закупівлею.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  TrendingUp,
  Activity,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RotateCw,
  Pause,
  X,
  ListTodo,
  FileText,
  Users,
  Building2,
  Ship,
  Shield,
  Zap,
  BarChart3,
  MoreVertical,
  History,
  Star,
  Filter,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Types
interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  estimatedTime: string;
  steps: ScenarioStep[];
  popularity: number;
  lastRun?: string;
}

interface ScenarioStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: string;
  result?: string;
  module: string;
}

interface ActiveScenario {
  id: string;
  scenarioId: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  currentStep: number;
  startedAt: string;
  estimatedEnd?: string;
  steps: ScenarioStep[];
  result?: {
    status: 'success' | 'warning' | 'error';
    message: string;
    data?: Record<string, any>;
  };
}

// Mock Data
const SCENARIOS: Scenario[] = [
  {
    id: 'sc-001',
    name: 'Імпорт товару',
    description: 'Повний процес імпорту: перевірка контрагента, митне оформлення, логістика та контроль поставки',
    icon: 'Package',
    category: 'Торгівля',
    estimatedTime: '15-20 хв',
    popularity: 95,
    steps: [
      { id: 's1', name: 'Перевірка контрагента', description: 'Аналіз компанії-постачальника', status: 'pending', module: 'diligence' },
      { id: 's2', name: 'Санкційна перевірка', description: 'Перевірка санкційних списків', status: 'pending', module: 'sanctions' },
      { id: 's3', name: 'Митне оформлення', description: 'Підготовка декларації', status: 'pending', module: 'customs' },
      { id: 's4', name: 'Логістика', description: 'Планування маршруту', status: 'pending', module: 'logistics' },
      { id: 's5', name: 'Контроль поставки', description: 'Моніторинг доставки', status: 'pending', module: 'tracking' },
    ],
  },
  {
    id: 'sc-002',
    name: 'Перевірка контрагента',
    description: 'Комплексний аналіз компанії перед угодою: фінанси, репутація, ризики, бенефіціари',
    icon: 'Search',
    category: 'Ризики',
    estimatedTime: '5-10 хв',
    popularity: 88,
    steps: [
      { id: 's1', name: 'Базові дані', description: 'Реєстраційні дані', status: 'pending', module: 'registries' },
      { id: 's2', name: 'Фінансовий аналіз', description: 'Оцінка платоспроможності', status: 'pending', module: 'finance' },
      { id: 's3', name: 'Санкції', description: 'Перевірка списків', status: 'pending', module: 'sanctions' },
      { id: 's4', name: 'Граф звʼязків', description: 'Бенефіціари та афілійовані особи', status: 'pending', module: 'entity-graph' },
    ],
  },
  {
    id: 'sc-003',
    name: 'Аналіз ринку перед закупівлею',
    description: 'Оцінка цін, постачальників, умов ринку та прогноз попиту',
    icon: 'TrendingUp',
    category: 'Аналітика',
    estimatedTime: '20-30 хв',
    popularity: 72,
    steps: [
      { id: 's1', name: 'Аналіз цін', description: 'Порівняння цін на ринку', status: 'pending', module: 'price-compare' },
      { id: 's2', name: 'Огляд постачальників', description: 'Пошук альтернатив', status: 'pending', module: 'suppliers' },
      { id: 's3', name: 'Прогноз попиту', description: 'ML-прогноз потреби', status: 'pending', module: 'forecast' },
      { id: 's4', name: 'Ризик-оцінка', description: 'Оцінка ринкових ризиків', status: 'pending', module: 'risk' },
    ],
  },
  {
    id: 'sc-004',
    name: 'Автоматичний звіт з митниці',
    description: 'Щоденний звіт про декларації, статуси та оновлення',
    icon: 'Activity',
    category: 'Звіти',
    estimatedTime: '2-3 хв',
    popularity: 65,
    steps: [
      { id: 's1', name: 'Збір даних', description: 'Актуальні декларації', status: 'pending', module: 'customs-api' },
      { id: 's2', name: 'Аналіз', description: 'Обробка та групування', status: 'pending', module: 'analytics' },
      { id: 's3', name: 'Генерація звіту', description: 'Формування PDF/Excel', status: 'pending', module: 'reports' },
    ],
  },
];

const ACTIVE_SCENARIOS: ActiveScenario[] = [
  {
    id: 'as-001',
    scenarioId: 'sc-001',
    name: 'Імпорт товару',
    status: 'running',
    progress: 60,
    currentStep: 3,
    startedAt: '2024-03-20 10:30',
    estimatedEnd: '2024-03-20 10:50',
    steps: [
      { id: 's1', name: 'Перевірка контрагента', description: 'Аналіз компанії-постачальника', status: 'completed', duration: '3 хв', result: 'Ризик: низький', module: 'diligence' },
      { id: 's2', name: 'Санкційна перевірка', description: 'Перевірка санкційних списків', status: 'completed', duration: '1 хв', result: 'Збігів не знайдено', module: 'sanctions' },
      { id: 's3', name: 'Митне оформлення', description: 'Підготовка декларації', status: 'running', module: 'customs' },
      { id: 's4', name: 'Логістика', description: 'Планування маршруту', status: 'pending', module: 'logistics' },
      { id: 's5', name: 'Контроль поставки', description: 'Моніторинг доставки', status: 'pending', module: 'tracking' },
    ],
  },
  {
    id: 'as-002',
    scenarioId: 'sc-002',
    name: 'Перевірка контрагента',
    status: 'completed',
    progress: 100,
    currentStep: 4,
    startedAt: '2024-03-20 09:15',
    estimatedEnd: '2024-03-20 09:22',
    steps: [
      { id: 's1', name: 'Базові дані', description: 'Реєстраційні дані', status: 'completed', duration: '1 хв', module: 'registries' },
      { id: 's2', name: 'Фінансовий аналіз', description: 'Оцінка платоспроможності', status: 'completed', duration: '2 хв', module: 'finance' },
      { id: 's3', name: 'Санкції', description: 'Перевірка списків', status: 'completed', duration: '1 хв', module: 'sanctions' },
      { id: 's4', name: 'Граф звʼязків', description: 'Бенефіціари', status: 'completed', duration: '3 хв', module: 'entity-graph' },
    ],
    result: {
      status: 'warning',
      message: 'Знайдено попередження: компанія має судові спори',
      data: { riskScore: 45, sanctions: false, courtCases: 2 },
    },
  },
];

// Components
const ScenarioCard: React.FC<{
  scenario: Scenario;
  onRun: (scenario: Scenario) => void;
  onViewDetails: (scenario: Scenario) => void;
}> = ({ scenario, onRun, onViewDetails }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl text-cyan-400">
                {scenario.icon === 'Package' && <Package className="w-6 h-6" />}
                {scenario.icon === 'Search' && <Search className="w-6 h-6" />}
                {scenario.icon === 'TrendingUp' && <TrendingUp className="w-6 h-6" />}
                {scenario.icon === 'Activity' && <Activity className="w-6 h-6" />}
              </div>
              <div>
                <CardTitle className="text-lg text-white group-hover:text-cyan-400 transition-colors">
                  {scenario.name}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {scenario.category} • {scenario.estimatedTime}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-slate-800 text-slate-300">
              <Star className="w-3 h-3 mr-1 text-amber-400" /> {scenario.popularity}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <p className="text-slate-300 text-sm mb-4">{scenario.description}</p>
          
          <div className="space-y-2">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Кроки сценарію</div>
            <div className="flex flex-wrap gap-2">
              {scenario.steps.map((step, idx) => (
                <div key={step.id} className="flex items-center text-xs text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] mr-1.5">
                    {idx + 1}
                  </div>
                  {step.name}
                  {idx < scenario.steps.length - 1 && <ChevronRight className="w-3 h-3 mx-1 text-slate-600" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">{scenario.steps.length} кроків</div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(scenario)}
              className="text-slate-400 hover:text-white"
            >
              Деталі
            </Button>
            <Button
              size="sm"
              onClick={() => onRun(scenario)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Play className="w-4 h-4 mr-1" /> Запустити
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const ActiveScenarioCard: React.FC<{
  scenario: ActiveScenario;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
}> = ({ scenario, onPause, onResume, onStop }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                scenario.status === 'running' ? 'bg-amber-500/20 text-amber-400' :
                scenario.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                scenario.status === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-slate-700 text-slate-400'
              }`}>
                {scenario.status === 'running' && <Loader2 className="w-5 h-5 animate-spin" />}
                {scenario.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                {scenario.status === 'error' && <AlertCircle className="w-5 h-5" />}
                {scenario.status === 'paused' && <Pause className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-lg text-white">{scenario.name}</CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  {scenario.status === 'running' ? `Крок ${scenario.currentStep} з ${scenario.steps.length}` :
                   scenario.status === 'completed' ? 'Завершено' :
                   scenario.status === 'error' ? 'Помилка' : 'Призупинено'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {scenario.status === 'running' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPause(scenario.id)}
                  className="text-amber-400 hover:text-amber-300"
                >
                  <Pause className="w-4 h-4 mr-1" /> Пауза
                </Button>
              )}
              {scenario.status === 'paused' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResume(scenario.id)}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Play className="w-4 h-4 mr-1" /> Продовжити
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStop(scenario.id)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Прогрес</span>
              <span className="text-sm font-medium text-white">{scenario.progress}%</span>
            </div>
            <Progress value={scenario.progress} className="h-2" />
          </div>

          <div className="space-y-2">
            {scenario.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  step.status === 'running' ? 'bg-amber-500/10 border border-amber-500/30' :
                  step.status === 'completed' ? 'bg-emerald-500/10' :
                  step.status === 'error' ? 'bg-red-500/10' :
                  'bg-slate-800/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step.status === 'completed' ? 'bg-emerald-500/30 text-emerald-400' :
                  step.status === 'running' ? 'bg-amber-500/30 text-amber-400' :
                  step.status === 'error' ? 'bg-red-500/30 text-red-400' :
                  'bg-slate-700 text-slate-500'
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                   step.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   step.status === 'error' ? <AlertCircle className="w-4 h-4" /> :
                   idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{step.name}</div>
                  {step.result && (
                    <div className="text-xs text-slate-400">{step.result}</div>
                  )}
                </div>
                {step.duration && (
                  <div className="text-xs text-slate-500">{step.duration}</div>
                )}
              </div>
            ))}
          </div>

          {scenario.result && (
            <div className={`p-4 rounded-lg ${
              scenario.result.status === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' :
              scenario.result.status === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
              'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {scenario.result.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {scenario.result.status === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
                {scenario.result.status === 'error' && <X className="w-5 h-5 text-red-400" />}
                <span className={`font-medium ${
                  scenario.result.status === 'success' ? 'text-emerald-400' :
                  scenario.result.status === 'warning' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {scenario.result.status === 'success' ? 'Успішно завершено' :
                   scenario.result.status === 'warning' ? 'Завершено з попередженням' :
                   'Помилка виконання'}
                </span>
              </div>
              <p className="text-sm text-slate-300">{scenario.result.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
export const BusinessScenarios: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [runningScenarios, setRunningScenarios] = useState<ActiveScenario[]>(ACTIVE_SCENARIOS);

  const handleRunScenario = (scenario: Scenario) => {
    const newActive: ActiveScenario = {
      id: `as-${Date.now()}`,
      scenarioId: scenario.id,
      name: scenario.name,
      status: 'running',
      progress: 0,
      currentStep: 1,
      startedAt: new Date().toLocaleString('uk-UA'),
      steps: scenario.steps.map(s => ({ ...s, status: s.id === scenario.steps[0].id ? 'running' : 'pending' })),
    };
    setRunningScenarios([newActive, ...runningScenarios]);
    setActiveTab('active');
  };

  const handleViewDetails = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsDetailsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📊 Бізнес-сценарії</h1>
            <p className="text-slate-400">Готові процеси для швидкого запуску бізнес-операцій</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <History className="w-4 h-4 mr-2" /> Історія
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <RotateCw className="w-4 h-4 mr-2" /> Створити сценарій
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-slate-800">
              <ListTodo className="w-4 h-4 mr-2" /> Сценарії
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-slate-800">
              <Activity className="w-4 h-4 mr-2" /> Активні
              {runningScenarios.length > 0 && (
                <Badge className="ml-2 bg-cyan-500 text-white">{runningScenarios.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-slate-800">
              <FileText className="w-4 h-4 mr-2" /> Шаблони
            </TabsTrigger>
          </TabsList>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SCENARIOS.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onRun={handleRunScenario}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </TabsContent>

          {/* Active Tab */}
          <TabsContent value="active" className="space-y-6">
            {runningScenarios.length === 0 ? (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-8 text-center">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-xl font-semibold text-white mb-2">Немає активних сценаріїв</h3>
                  <p className="text-slate-400 mb-6">Запустіть сценарій з вкладки "Сценарії"</p>
                  <Button
                    onClick={() => setActiveTab('scenarios')}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    Перейти до сценаріїв
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {runningScenarios.map((scenario) => (
                  <ActiveScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    onPause={(id) => console.log('Pause', id)}
                    onResume={(id) => console.log('Resume', id)}
                    onStop={(id) => setRunningScenarios(runningScenarios.filter(s => s.id !== id))}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Шаблони сценаріїв</h3>
                <p className="text-slate-400 mb-6">Використовуйте готові шаблони або створіть власні</p>
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Створити шаблон
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedScenario?.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedScenario?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-slate-800 text-slate-300">{selectedScenario?.category}</Badge>
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {selectedScenario?.estimatedTime}
                </span>
                <span className="text-sm text-slate-400 flex items-center gap-1">
                  <ListTodo className="w-4 h-4" /> {selectedScenario?.steps.length} кроків
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Кроки виконання</h4>
                <div className="space-y-2">
                  {selectedScenario?.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center text-xs text-cyan-400 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm text-white">{step.name}</div>
                        <div className="text-xs text-slate-400">{step.description}</div>
                        <Badge variant="outline" className="mt-1 text-xs border-slate-700 text-slate-500">
                          {step.module}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
                className="border-slate-700 text-slate-300"
              >
                Закрити
              </Button>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={() => {
                  setIsDetailsOpen(false);
                  if (selectedScenario) handleRunScenario(selectedScenario);
                }}
              >
                <Play className="w-4 h-4 mr-2" /> Запустити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BusinessScenarios;
