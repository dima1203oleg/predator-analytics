/**
 * Scenario Builder — No-Code Automation
 * Drag-and-drop scenario creation with AI suggestions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Grid2x2,
  Zap,
  Play,
  Save,
  Copy,
  Trash2,
  Settings,
  ChevronRight,
  Workflow,
  Lightbulb,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils/cn';

interface ScenarioStep {
  id: string;
  type: 'input' | 'process' | 'decision' | 'output';
  name: string;
  description: string;
  params?: Record<string, any>;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: ScenarioStep[];
  lastModified: string;
  runs: number;
  avgTime: string;
  isPinned: boolean;
}

const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: 'scen-001',
    name: 'Оптимізація закупівель',
    description: 'Знайти найкращого постачальника з найменшою ціною',
    category: 'Procurement',
    steps: [
      { id: '1', type: 'input', name: 'Введення товару', description: 'Назва + характеристики' },
      { id: '2', type: 'process', name: 'Аналіз ринку', description: 'Пошук на 10k+ постачальників' },
      { id: '3', type: 'decision', name: 'Фільтр ризику', description: 'Санкції, репутація' },
      { id: '4', type: 'output', name: 'Рекомендація', description: 'Top 3 з економією' },
    ],
    lastModified: 'Сьогодні, 14:30',
    runs: 247,
    avgTime: '2m 15s',
    isPinned: true,
  },
  {
    id: 'scen-002',
    name: 'Перевірка контрагента',
    description: 'Deep due diligence з ризик-скорингом',
    category: 'Risk',
    steps: [
      { id: '1', type: 'input', name: 'УНП компанії', description: 'Or business name' },
      { id: '2', type: 'process', name: 'Graph search', description: 'Шухляди, бенефіціари' },
      { id: '3', type: 'process', name: 'Санкційна перевірка', description: 'EU, US, UA lists' },
      { id: '4', type: 'output', name: 'Risk score', description: '0-100 + детали' },
    ],
    lastModified: 'Вчора, 11:20',
    runs: 89,
    avgTime: '3m 45s',
    isPinned: false,
  },
  {
    id: 'scen-003',
    name: 'Аналіз ринку',
    description: 'Тренди, ціни, можливості на 30 днів',
    category: 'Market',
    steps: [
      { id: '1', type: 'input', name: 'Категорія товарів', description: 'Виберіть сегмент' },
      { id: '2', type: 'process', name: 'Завантаження даних', description: 'Customs + suppliers' },
      { id: '3', type: 'process', name: 'ML forecast', description: '30-day predictions' },
      { id: '4', type: 'output', name: 'Дашборд', description: 'Charts + CSV export' },
    ],
    lastModified: '3 дні тому',
    runs: 412,
    avgTime: '1m 30s',
    isPinned: false,
  },
];

const AVAILABLE_STEPS = [
  { type: 'input', label: '📥 Input', color: 'bg-blue-500/20 border-blue-500/30' },
  { type: 'process', label: '⚙️ Process', color: 'bg-cyan-500/20 border-cyan-500/30' },
  { type: 'decision', label: '🔀 Decision', color: 'bg-amber-500/20 border-amber-500/30' },
  { type: 'output', label: '📤 Output', color: 'bg-emerald-500/20 border-emerald-500/30' },
];

export const ScenarioBuilder: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [scenarios, setScenarios] = useState(PREDEFINED_SCENARIOS);

  const togglePin = (id: string) => {
    setScenarios(
      scenarios.map((s) =>
        s.id === id ? { ...s, isPinned: !s.isPinned } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Конструктор сценаріїв</h1>
        <p className="text-xl text-slate-400">
          Створюйте складні автоматизовані потоки без коду
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white h-10">
          <Plus className="w-5 h-5 mr-2" /> Новий сценарій
        </Button>
        <Button variant="outline" className="border-slate-700 h-10">
          <Copy className="w-5 h-5 mr-2" /> Дублювати
        </Button>
        <Button variant="outline" className="border-slate-700 h-10">
          <BarChart3 className="w-5 h-5 mr-2" /> Шаблони
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="templates">Шаблони (3)</TabsTrigger>
          <TabsTrigger value="custom">Мої сценарії (12)</TabsTrigger>
          <TabsTrigger value="builder">Конструктор</TabsTrigger>
        </TabsList>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario, idx) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedScenario(scenario)}
                className="cursor-pointer group"
              >
                <Card className="bg-slate-900/50 border-slate-800 hover:border-cyan-500/50 transition-all group-hover:shadow-lg group-hover:shadow-cyan-500/10">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg group-hover:text-cyan-400 transition-colors">
                          {scenario.name}
                        </CardTitle>
                        <Badge className="mt-2 bg-blue-600 text-white text-xs">
                          {scenario.category}
                        </Badge>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(scenario.id);
                        }}
                        className="text-slate-400 hover:text-amber-400"
                      >
                        ⭐
                      </motion.button>
                    </div>
                    <CardDescription className="text-slate-400">
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Step Flow Preview */}
                    <div className="flex items-center gap-1">
                      {scenario.steps.map((step, i) => (
                        <React.Fragment key={step.id}>
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {i + 1}
                          </div>
                          {i < scenario.steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-800/50 rounded p-2 text-center">
                        <p className="text-slate-500">Запусків</p>
                        <p className="text-white font-bold">{scenario.runs}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2 text-center">
                        <p className="text-slate-500">Час</p>
                        <p className="text-white font-bold">{scenario.avgTime}</p>
                      </div>
                      <div className="bg-slate-800/50 rounded p-2 text-center">
                        <p className="text-slate-500">Обновлено</p>
                        <p className="text-white font-bold text-xs">
                          {scenario.lastModified.split(',')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs">
                        <Play className="w-3 h-3 mr-1" /> Запустити
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-700 h-8">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* CUSTOM TAB */}
        <TabsContent value="custom" className="space-y-3 mt-4">
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-white text-lg font-semibold mb-2">Немає власних сценаріїв</h3>
            <p className="text-slate-400 mb-6">
              Почніть з готових шаблонів або створіть свій власний
            </p>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-5 h-5 mr-2" /> Створити сценарій
            </Button>
          </div>
        </TabsContent>

        {/* BUILDER TAB */}
        <TabsContent value="builder" className="mt-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Workflow className="w-6 h-6 text-violet-400" />
                Drag & Drop конструктор
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Steps */}
              <div>
                <h4 className="text-white font-semibold mb-3">Доступні блоки</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AVAILABLE_STEPS.map((step) => (
                    <motion.div
                      key={step.type}
                      whileHover={{ scale: 1.05 }}
                      draggable
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-move text-center',
                        'transition-all hover:shadow-lg',
                        step.color
                      )}
                    >
                      <p className="text-sm font-medium text-white">{step.label}</p>
                      <p className="text-xs text-slate-400 mt-1">Перетягніть сюди</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Ваш сценарій</h4>
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">
                      Перетягніть блоки сюди для створення сценарію
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Save className="w-4 h-4 mr-2" /> Зберегти сценарій
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Play className="w-4 h-4 mr-2" /> Тестувати
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Suggestions */}
      <Card className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-violet-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-violet-400" />
            AI рекомендації
          </CardTitle>
          <CardDescription className="text-slate-400">
            На основі ваших попередніх запусків
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              'Додайте фільтр по рівню довіри (> 75%)',
              'Включіть санкційну перевірку перед рекомендацією',
              'Запустіть цей сценарій щомісячно',
            ].map((suggestion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 rounded-lg bg-slate-800/50 flex items-start gap-3"
              >
                <Zap className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{suggestion}</p>
                <Button size="sm" variant="ghost" className="ml-auto text-violet-400 hover:text-violet-300">
                  Додати
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioBuilder;
