/**
 * 📊 Execution Center - Business View
 * 
 * Центр виконання сценаріїв для бізнес-користувачів.
 * Статуси, прогрес, результати без технічних деталей.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Square,
  RefreshCw,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  MoreVertical,
  Eye,
  Download,
  Share2,
  Star,
  Zap,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUsageStats } from '@/hooks/useUserExperience';

// Types
interface ScenarioExecution {
  id: string;
  name: string;
  type: 'procurement' | 'diligence' | 'market' | 'risk';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startedAt: string;
  estimatedEnd?: string;
  completedAt?: string;
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

interface QuickStats {
  activeScenarios: number;
  completedToday: number;
  totalSavings: number;
  avgExecutionTime: string;
}

// Mock data
const MOCK_EXECUTIONS: ScenarioExecution[] = [
  {
    id: 'exec-001',
    name: 'Оптимізація закупівель електрогенераторів',
    type: 'procurement',
    status: 'completed',
    progress: 100,
    startedAt: '2024-03-20 10:30',
    completedAt: '2024-03-20 10:35',
    result: {
      savings: 250000,
      confidence: 78,
      recommendations: 3,
      riskLevel: 'low',
    },
    priority: 'high',
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
    name: 'Щотижневий моніторинг постачальників',
    type: 'risk',
    status: 'failed',
    progress: 45,
    startedAt: '2024-03-20 09:00',
    error: 'Недоступний зовнішній API санкційних списків',
    priority: 'medium',
    recurring: true,
    nextRun: '2024-03-27 09:00',
  },
];

const MOCK_STATS: QuickStats = {
  activeScenarios: 2,
  completedToday: 5,
  totalSavings: 750000,
  avgExecutionTime: '3.5 хв',
};

// Components
const StatusIcon: React.FC<{ status: ScenarioExecution['status'] }> = ({ status }) => {
  const icons = {
    queued: <Clock className="w-5 h-5 text-slate-400" />,
    running: <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />,
    completed: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    failed: <AlertCircle className="w-5 h-5 text-red-400" />,
    paused: <Pause className="w-5 h-5 text-slate-400" />,
  };

  return icons[status];
};

const StatusBadge: React.FC<{ status: ScenarioExecution['status'] }> = ({ status }) => {
  const styles = {
    queued: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    running: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-300 border-red-500/30',
    paused: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  const labels = {
    queued: 'В черзі',
    running: 'Виконується',
    completed: 'Завершено',
    failed: 'Помилка',
    paused: 'Призупинено',
  };

  return (
    <Badge className={styles[status]}>
      {labels[status]}
    </Badge>
  );
};

const TypeIcon: React.FC<{ type: ScenarioExecution['type'] }> = ({ type }) => {
  const icons = {
    procurement: <TrendingDown className="w-4 h-4 text-cyan-400" />,
    diligence: <Target className="w-4 h-4 text-emerald-400" />,
    market: <BarChart3 className="w-4 h-4 text-violet-400" />,
    risk: <AlertCircle className="w-4 h-4 text-red-400" />,
  };

  const labels = {
    procurement: 'Закупівлі',
    diligence: 'Перевірка',
    market: 'Ринок',
    risk: 'Ризики',
  };

  return (
    <div className="flex items-center gap-2">
      {icons[type]}
      <span className="text-sm text-slate-300">{labels[type]}</span>
    </div>
  );
};

const ExecutionCard: React.FC<{
  execution: ScenarioExecution;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onView: (id: string) => void;
}> = ({ execution, onPause, onResume, onStop, onRestart, onView }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon status={execution.status} />
            <h3 className="text-lg font-semibold text-white">{execution.name}</h3>
            <StatusBadge status={execution.status} />
            {execution.priority === 'high' && (
              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                Високий пріоритет
              </Badge>
            )}
            {execution.recurring && (
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                Повторюється
              </Badge>
            )}
          </div>
          <TypeIcon type={execution.type} />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-slate-800 border-slate-700">
            <DropdownMenuItem onClick={() => onView(execution.id)} className="text-slate-300">
              <Eye className="w-4 h-4 mr-2" />
              Переглянути результат
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Завантажити звіт
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300">
              <Share2 className="w-4 h-4 mr-2" />
              Поділитися
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      {execution.status !== 'queued' && execution.status !== 'failed' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Прогрес</span>
            <span className="text-sm text-slate-300">{execution.progress}%</span>
          </div>
          <Progress value={execution.progress} className="h-2" />
        </div>
      )}

      {/* Timing */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>Старт: {new Date(execution.startedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {execution.estimatedEnd && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Завершення: {new Date(execution.estimatedEnd).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        {execution.completedAt && (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Завершено: {new Date(execution.completedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Result */}
      {execution.result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {execution.result.savings?.toLocaleString('uk-UA')} ₴
              </div>
              <div className="text-sm text-slate-400">Економія</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-cyan-400">
                {execution.result.confidence}%
              </div>
              <div className="text-sm text-slate-400">Точність</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-violet-400">
                {execution.result.recommendations}
              </div>
              <div className="text-sm text-slate-400">Рекомендації</div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {execution.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Помилка виконання</span>
          </div>
          <p className="text-red-200 text-sm mt-1">{execution.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {execution.recurring && execution.nextRun && (
            <span>Наступний запуск: {new Date(execution.nextRun).toLocaleDateString('uk-UA')}</span>
          )}
        </div>
        <div className="flex gap-2">
          {execution.status === 'running' && (
            <Button variant="outline" size="sm" onClick={() => onPause(execution.id)} className="border-slate-700 text-slate-300">
              <Pause className="w-4 h-4 mr-1" />
              Пауза
            </Button>
          )}
          {execution.status === 'paused' && (
            <Button variant="outline" size="sm" onClick={() => onResume(execution.id)} className="border-slate-700 text-slate-300">
              <Play className="w-4 h-4 mr-1" />
              Продовжити
            </Button>
          )}
          {(execution.status === 'queued' || execution.status === 'running' || execution.status === 'paused') && (
            <Button variant="outline" size="sm" onClick={() => onStop(execution.id)} className="border-red-700 text-red-400">
              <Square className="w-4 h-4 mr-1" />
              Зупинити
            </Button>
          )}
          {execution.status === 'failed' && (
            <Button variant="outline" size="sm" onClick={() => onRestart(execution.id)} className="border-slate-700 text-slate-300">
              <RefreshCw className="w-4 h-4 mr-1" />
              Перезапустити
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatsCards: React.FC<{ stats: QuickStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.activeScenarios}</div>
            <div className="text-sm text-slate-400">Активні сценарії</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.completedToday}</div>
            <div className="text-sm text-slate-400">Завершено сьогодні</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.totalSavings.toLocaleString('uk-UA')} ₴
            </div>
            <div className="text-sm text-slate-400">Загальна економія</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.avgExecutionTime}</div>
            <div className="text-sm text-slate-400">Середній час</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Main Component
export const ExecutionCenter: React.FC = () => {
  const [executions, setExecutions] = useState<ScenarioExecution[]>(MOCK_EXECUTIONS);
  const [activeTab, setActiveTab] = useState('active');
  const [stats] = useState<QuickStats>(MOCK_STATS);
  const { recordScenarioRun, recordSavings } = useUsageStats();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setExecutions(prev => prev.map(exec => {
        if (exec.status === 'running' && exec.progress < 100) {
          const newProgress = Math.min(exec.progress + Math.random() * 10, 100);
          if (newProgress === 100) {
            recordScenarioRun();
            if (exec.result?.savings) {
              recordSavings(exec.result.savings);
            }
            return {
              ...exec,
              progress: 100,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
            };
          }
          return { ...exec, progress: newProgress };
        }
        return exec;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [recordScenarioRun, recordSavings]);

  const handlePause = (id: string) => {
    setExecutions(prev => prev.map(exec => 
      exec.id === id ? { ...exec, status: 'paused' as const } : exec
    ));
  };

  const handleResume = (id: string) => {
    setExecutions(prev => prev.map(exec => 
      exec.id === id ? { ...exec, status: 'running' as const } : exec
    ));
  };

  const handleStop = (id: string) => {
    setExecutions(prev => prev.filter(exec => exec.id !== id));
  };

  const handleRestart = (id: string) => {
    setExecutions(prev => prev.map(exec => 
      exec.id === id ? { 
        ...exec, 
        status: 'queued' as const, 
        progress: 0,
        error: undefined,
        startedAt: new Date().toISOString()
      } : exec
    ));
  };

  const handleView = (id: string) => {
    console.log('View execution:', id);
  };

  const filteredExecutions = executions.filter(exec => {
    switch (activeTab) {
      case 'active':
        return exec.status === 'running' || exec.status === 'queued' || exec.status === 'paused';
      case 'completed':
        return exec.status === 'completed';
      case 'failed':
        return exec.status === 'failed';
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">📊 Центр виконання</h1>
            <p className="text-slate-400">
              Моніторинг та управління бізнес-сценаріями
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Звіт
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Новий сценарій
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-slate-800">
              Активні ({executions.filter(e => e.status === 'running' || e.status === 'queued' || e.status === 'paused').length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-slate-800">
              Завершені ({executions.filter(e => e.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="failed" className="data-[state=active]:bg-slate-800">
              Помилки ({executions.filter(e => e.status === 'failed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <AnimatePresence>
              {filteredExecutions.map(execution => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onView={handleView}
                />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <AnimatePresence>
              {filteredExecutions.map(execution => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onView={handleView}
                />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="failed" className="space-y-4">
            <AnimatePresence>
              {filteredExecutions.map(execution => (
                <ExecutionCard
                  key={execution.id}
                  execution={execution}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onView={handleView}
                />
              ))}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExecutionCenter;
