/**
 * Execution Center V2 — Business-Ready Scenario Monitoring
 * Для бізнес-користувачів: безпідписки розумні метрики, без технічних логів
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  MoreVertical,
  Eye,
  Download,
  Share2,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Edit2,
  Repeating,
  Target,
  BarChart3,
  Bolt,
  CheckSquare2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

interface Execution {
  id: string;
  name: string;
  type: 'procurement' | 'diligence' | 'market' | 'risk';
  status: 'queued' | 'running' | 'success' | 'failed' | 'partial';
  progress: number;
  startedAt: string;
  completedAt?: string;
  estimatedEnd?: string;
  result?: {
    savings?: number;
    confidence?: number;
    recommendations?: number;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  error?: string;
  priority: 'low' | 'medium' | 'high';
  recurring?: boolean;
  nextRun?: string;
}

const MOCK_EXECUTIONS: Execution[] = [
  {
    id: 'exec-001',
    name: 'Оптимізація закупівель електрогенераторів',
    type: 'procurement',
    status: 'success',
    progress: 100,
    startedAt: '2024-03-20 10:30',
    completedAt: '2024-03-20 10:35',
    result: { savings: 250000, confidence: 78, recommendations: 3, riskLevel: 'low' },
    priority: 'high',
    recurring: true,
    nextRun: '2024-04-20 10:30',
  },
  {
    id: 'exec-002',
    name: 'Перевірка постачальника TechCorp Ltd',
    type: 'diligence',
    status: 'running',
    progress: 65,
    startedAt: '2024-03-20 11:15',
    estimatedEnd: '2024-03-20 11:20',
    priority: 'medium',
  },
  {
    id: 'exec-003',
    name: 'Аналіз ринку будівельних матеріалів',
    type: 'market',
    status: 'queued',
    progress: 0,
    startedAt: '2024-03-20 11:18',
    priority: 'low',
  },
  {
    id: 'exec-004',
    name: 'Оцінка ризику контрагента',
    type: 'risk',
    status: 'success',
    progress: 100,
    startedAt: '2024-03-20 09:00',
    completedAt: '2024-03-20 09:08',
    result: { savings: 0, confidence: 92, recommendations: 1, riskLevel: 'medium' },
    priority: 'high',
  },
];

const QUICK_STATS = {
  activeScenarios: 2,
  completedToday: 8,
  totalSavings: 2150000,
  avgExecutionTime: '4m 30s',
};

const getStatusIcon = (status: Execution['status']) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-rose-400" />;
    case 'running':
      return <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />;
    case 'queued':
      return <Clock className="w-5 h-5 text-amber-400" />;
    default:
      return <Activity className="w-5 h-5 text-slate-400" />;
  }
};

const getStatusLabel = (status: Execution['status']) => {
  switch (status) {
    case 'success':
      return 'Успішно';
    case 'failed':
      return 'Помилка';
    case 'running':
      return 'В процесі';
    case 'queued':
      return 'В черзі';
    default:
      return 'Невідомо';
  }
};

const getTypeColor = (type: Execution['type']) => {
  switch (type) {
    case 'procurement':
      return 'bg-blue-500/20 text-blue-300';
    case 'diligence':
      return 'bg-purple-500/20 text-purple-300';
    case 'market':
      return 'bg-cyan-500/20 text-cyan-300';
    case 'risk':
      return 'bg-rose-500/20 text-rose-300';
    default:
      return 'bg-slate-500/20 text-slate-300';
  }
};

const getTypeLabel = (type: Execution['type']) => {
  switch (type) {
    case 'procurement':
      return '🛒 Закупівлі';
    case 'diligence':
      return '🔍 Перевірка';
    case 'market':
      return '📊 Ринок';
    case 'risk':
      return '⚠️ Ризик';
    default:
      return 'Невідомо';
  }
};

export const ExecutionCenterV2: React.FC = () => {
  const [executions, setExecutions] = useState<Execution[]>(MOCK_EXECUTIONS);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const totalSavings = executions
    .filter((e) => e.result?.savings)
    .reduce((sum, e) => sum + (e.result?.savings || 0), 0);

  const successCount = executions.filter((e) => e.status === 'success').length;
  const failureCount = executions.filter((e) => e.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Центр виконання</h1>
        <p className="text-xl text-slate-400">
          Моніторинг сценаріїв, результати та наступні кроки
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Загальна економія</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(totalSavings / 1000000).toFixed(1)}M ₴
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {successCount} успішних сценаріїв
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Активних сценаріїв</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{QUICK_STATS.activeScenarios}</div>
          <div className="text-xs text-slate-500 mt-1">Зараз виконуються</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Завершено сьогодні</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{QUICK_STATS.completedToday}</div>
          <div className="text-xs text-slate-500 mt-1">100% успішно</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Середній час</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{QUICK_STATS.avgExecutionTime}</div>
          <div className="text-xs text-slate-500 mt-1">За виконання</div>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Сценарії виконання
          </CardTitle>
          <CardDescription className="text-slate-400">
            Активні, заплановані та історія запусків
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="active">Активні (2)</TabsTrigger>
              <TabsTrigger value="scheduled">Заплановані (3)</TabsTrigger>
              <TabsTrigger value="history">Історія (15)</TabsTrigger>
            </TabsList>

            {/* ACTIVE TAB */}
            <TabsContent value="active" className="space-y-4 mt-4">
              <AnimatePresence>
                {executions
                  .filter((e) => e.status === 'running' || e.status === 'queued')
                  .map((execution, idx) => (
                    <motion.div
                      key={execution.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        'p-4 rounded-lg border',
                        execution.status === 'running'
                          ? 'bg-cyan-500/5 border-cyan-500/30'
                          : 'bg-amber-500/5 border-amber-500/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(execution.status)}
                          <div>
                            <h4 className="font-medium text-white">{execution.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">
                              {getTypeLabel(execution.type)} • {execution.startedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(execution.type)}>
                            {getStatusLabel(execution.status)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" /> Показати деталі
                              </DropdownMenuItem>
                              {execution.status === 'running' && (
                                <DropdownMenuItem>
                                  <Pause className="w-4 h-4 mr-2" /> Паузувати
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" /> Завантажити
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Прогрес</span>
                          <span className="text-white font-medium">{execution.progress}%</span>
                        </div>
                        <Progress value={execution.progress} className="h-2" />
                        {execution.estimatedEnd && (
                          <p className="text-xs text-slate-500">
                            Очікуваний кінець: {execution.estimatedEnd}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </TabsContent>

            {/* SCHEDULED TAB */}
            <TabsContent value="scheduled" className="space-y-4 mt-4">
              {executions
                .filter((e) => e.recurring && e.nextRun)
                .map((execution, idx) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Repeating className="w-5 h-5 text-violet-400 mt-1" />
                        <div>
                          <h4 className="font-medium text-white">{execution.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">
                              Наступний запуск: {execution.nextRun}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-slate-700">
                        <Edit2 className="w-4 h-4 mr-1" /> Редагувати
                      </Button>
                    </div>
                  </motion.div>
                ))}
            </TabsContent>

            {/* HISTORY TAB */}
            <TabsContent value="history" className="space-y-3 mt-4">
              {executions
                .filter((e) => e.status === 'success' || e.status === 'failed')
                .map((execution, idx) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedExecution(execution);
                      setShowDetails(true);
                    }}
                    className="p-3 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <h5 className="text-sm font-medium text-white">{execution.name}</h5>
                          <p className="text-xs text-slate-500">{execution.completedAt}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {execution.result?.savings ? (
                          <div className="text-sm font-bold text-emerald-400">
                            +{(execution.result.savings / 1000).toFixed(0)}k ₴
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {getStatusLabel(execution.status)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          {selectedExecution && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(selectedExecution.status)}
                  {selectedExecution.name}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {getTypeLabel(selectedExecution.type)} • {selectedExecution.startedAt}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">
                    Статус
                  </label>
                  <Badge className={getTypeColor(selectedExecution.type)}>
                    {getStatusLabel(selectedExecution.status)}
                  </Badge>
                </div>

                {/* Results */}
                {selectedExecution.result && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedExecution.result.savings && (
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Економія</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {(selectedExecution.result.savings / 1000).toFixed(0)}k ₴
                        </p>
                      </div>
                    )}
                    {selectedExecution.result.confidence && (
                      <div className="bg-slate-800/50 p-3 rounded-lg">
                        <p className="text-xs text-slate-400 mb-1">Довіра</p>
                        <p className="text-lg font-bold text-cyan-400">
                          {selectedExecution.result.confidence}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Steps */}
                {selectedExecution.result && (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Bolt className="w-4 h-4" /> Наступні кроки
                    </h4>
                    <div className="space-y-2">
                      <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white justify-start">
                        <CheckSquare2 className="w-4 h-4 mr-2" /> Застосувати рекомендацію
                      </Button>
                      <Button variant="outline" className="w-full border-slate-700 justify-start">
                        <Share2 className="w-4 h-4 mr-2" /> Поділитися результатом
                      </Button>
                      <Button variant="outline" className="w-full border-slate-700 justify-start">
                        <RefreshCw className="w-4 h-4 mr-2" /> Запустити знову
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Закрити
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExecutionCenterV2;
