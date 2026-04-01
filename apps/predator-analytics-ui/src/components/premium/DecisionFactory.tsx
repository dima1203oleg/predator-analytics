import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Trash2,
  Play,
  Save,
  Share2,
  Settings,
  Workflow,
  Database,
  Code,
  GitBranch,
  Clock,
  BarChart3,
  Repeat2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'integration';
  name: string;
  config: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'paused';
  created: string;
  runs: number;
  avgTime: number; // seconds
}

const MOCK_TEMPLATES = [
  {
    id: 'tmpl-1',
    name: 'Автоматична перевірка постачальника',
    description: 'При додаванні нового постачальника → перевірка в санкціях → рейтинг → відправка звіту',
    runs: 234,
    avgTime: 12,
    icon: '✅',
  },
  {
    id: 'tmpl-2',
    name: 'Моніторинг ціни & сповіщення',
    description: 'Щодня о 9:00 → перевірка цін → порівняння з попередніми → відправити email якщо змінилось > 5%',
    runs: 1856,
    avgTime: 3,
    icon: '📊',
  },
  {
    id: 'tmpl-3',
    name: 'Тригер: Економія > 100k грн',
    description: 'Коли сценарій знайшов економію > 100k → запитати клієнта → видати рахунок → відправити звіт',
    runs: 67,
    avgTime: 45,
    icon: '💰',
  },
];

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Щоденна ринкова розвідка',
    description: 'Збирає цены, тренди та інсайти щоб показати аналітикам',
    steps: [
      { id: 's1', type: 'trigger', name: 'Щодня о 7:00', config: {} },
      { id: 's2', type: 'action', name: 'Оновити ринкові дані', config: {} },
      { id: 's3', type: 'action', name: 'Розрахувати тренди', config: {} },
      { id: 's4', type: 'integration', name: 'Відправити на дашборд', config: {} },
    ],
    status: 'active',
    created: '2026-02-15',
    runs: 456,
    avgTime: 8,
  },
  {
    id: 'wf-2',
    name: 'Перевірка нових угод',
    description: 'Кожна нова угода проходить комплексну перевірку перед підписанням',
    steps: [
      { id: 's1', type: 'trigger', name: 'Нова угода отримана', config: {} },
      { id: 's2', type: 'action', name: 'Запустити контрагента-check', config: {} },
      { id: 's3', type: 'condition', name: 'Ризик < 30?', config: {} },
      { id: 's4', type: 'action', name: 'Надіслати на затвердження', config: {} },
    ],
    status: 'active',
    created: '2026-01-20',
    runs: 234,
    avgTime: 25,
  },
];

const STEP_TYPES = [
  { id: 'trigger', name: 'Тригер', icon: Zap, color: 'cyan', desc: 'Запускає робочий процес' },
  { id: 'condition', name: 'Умова', icon: GitBranch, color: 'violet', desc: 'Логічна розгалуження' },
  { id: 'action', name: 'Дія', icon: Workflow, color: 'emerald', desc: 'Виконує сценарій' },
  { id: 'integration', name: 'Інтеграція', icon: Code, color: 'amber', desc: 'Підключить зовнішні сервіси' },
];

export default function DecisionFactory() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates' | 'builder'>('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Workflow className="w-8 h-8 text-violet-400" />
              <h1 className="text-4xl font-black text-white">⚙️ Фабрика рішень</h1>
            </div>
            <Button
              className="gap-2 bg-violet-600 hover:bg-violet-700"
              onClick={() => setIsCreating(!isCreating)}
            >
              <Plus className="w-4 h-4" />
              Новий робочий процес
            </Button>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Збирай, тестуй та автоматизуй складні бізнес-сценарії без коду. Запускай по розкладу або за подіями.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Активні процеси</p>
              <p className="text-3xl font-bold text-cyan-400">{MOCK_WORKFLOWS.filter((w) => w.status === 'active').length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Всього запусків</p>
              <p className="text-3xl font-bold text-emerald-400">
                {MOCK_WORKFLOWS.reduce((acc, w) => acc + w.runs, 0).toLocaleString('uk-UA')}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Середній час</p>
              <p className="text-3xl font-bold text-violet-400">
                {Math.round(MOCK_WORKFLOWS.reduce((acc, w) => acc + w.avgTime, 0) / MOCK_WORKFLOWS.length)}s
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/40">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400">Доступних шаблонів</p>
              <p className="text-3xl font-bold text-amber-400">{MOCK_TEMPLATES.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-3 border-b border-slate-700/50">
          {(['workflows', 'templates', 'builder'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'workflows' && '📋 Робочі процеси'}
              {tab === 'templates' && '🎯 Шаблони'}
              {tab === 'builder' && '🎨 Конструктор'}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'workflows' && (
            <motion.div key="workflows" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {isCreating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 rounded-lg border border-violet-500/30 bg-violet-950/20"
                >
                  <div className="flex gap-3 mb-4">
                    <Input
                      placeholder="Назва нового процесу..."
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                    <Button
                      className="gap-2 bg-violet-600 hover:bg-violet-700"
                      onClick={() => {
                        setIsCreating(false);
                        setNewWorkflowName('');
                      }}
                    >
                      <Play className="w-4 h-4" />
                      Створити
                    </Button>
                  </div>
                  <p className="text-sm text-slate-400">Або виберіть шаблон нижче щоб почати швидше</p>
                </motion.div>
              )}

              <div className="space-y-4">
                {MOCK_WORKFLOWS.map((workflow, idx) => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all cursor-pointer group"
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">
                                {workflow.name}
                              </h3>
                              <Badge
                                className={`${
                                  workflow.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}
                              >
                                {workflow.status === 'active' ? '🟢 Активний' : '🟡 Паузований'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{workflow.description}</p>

                            {/* Steps preview */}
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                              {workflow.steps.map((step, sidx) => (
                                <div key={step.id} className="flex items-center gap-2">
                                  <div className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-300">
                                    {step.name}
                                  </div>
                                  {sidx < workflow.steps.length - 1 && (
                                    <div className="text-slate-600">→</div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Repeat2 className="w-4 h-4" />
                                {workflow.runs} запусків
                              </div>
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                ~{workflow.avgTime}s середній час
                              </div>
                              <div className="text-slate-500">Створено {workflow.created}</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-violet-400 hover:text-violet-300">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_TEMPLATES.map((template, idx) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all cursor-pointer group h-full flex flex-col">
                      <CardContent className="pt-6 flex-1 flex flex-col">
                        <div className="text-4xl mb-3">{template.icon}</div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4 flex-1">{template.description}</p>

                        <div className="space-y-2 mb-4 pt-4 border-t border-slate-700/30">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Запусків:</span>
                            <span className="text-emerald-400">{template.runs}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Середній час:</span>
                            <span className="text-cyan-400">~{template.avgTime}s</span>
                          </div>
                        </div>

                        <Button className="w-full gap-2 bg-violet-600 hover:bg-violet-700 group-hover:shadow-lg group-hover:shadow-violet-900/50 transition-all">
                          <Plus className="w-4 h-4" />
                          Використати шаблон
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-slate-700/50 bg-slate-800/40">
                <CardHeader>
                  <CardTitle>Драг & Дроп конструктор</CardTitle>
                  <CardDescription>Виберіть кроки з лівої сторони і перетягніть на полотно</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Step Palette */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-white mb-4">Доступні кроки:</h3>
                      {STEP_TYPES.map((step) => {
                        const Icon = step.icon;
                        return (
                          <motion.div
                            key={step.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            draggable
                            className={`p-3 rounded-lg border-2 border-dashed border-${step.color}-500/50 bg-${step.color}-950/20 hover:bg-${step.color}-950/40 cursor-grab active:cursor-grabbing transition-all`}
                          >
                            <Icon className={`w-5 h-5 text-${step.color}-400 mb-2`} />
                            <p className={`font-semibold text-${step.color}-300 text-sm`}>{step.name}</p>
                            <p className="text-xs text-slate-400">{step.desc}</p>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Canvas */}
                    <div className="lg:col-span-3">
                      <div className="border-2 border-dashed border-slate-700/50 rounded-lg p-8 min-h-[400px] bg-slate-950/40 flex items-center justify-center">
                        <div className="text-center text-slate-500">
                          <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="mb-2">Перетягніть кроки сюди</p>
                          <p className="text-sm">Побудуй свій робочий процес</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6 justify-end">
                        <Button variant="outline">Скасувати</Button>
                        <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
                          <Save className="w-4 h-4" />
                          Зберегти процес
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
