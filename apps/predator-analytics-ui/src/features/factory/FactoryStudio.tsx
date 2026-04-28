/**
 * PREDATOR Factory Studio — Візуальна панель для Knowledge Map
 * 
 * Показує:
 * - Всі виявлені паттерни
 * - Золоті Патерни (найкращі практики)
 * - Статистику
 * - Форму для тесту інгестії
 * - Статус нейронного тренування
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Star,
  TrendingUp,
  Database,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';
import { factoryApi } from '@/services/api/factory';
import { PipelineTable } from './components/PipelineTable';
import { TrainingChart } from './components/TrainingChart';
import { KnowledgeMapGraph } from './components/KnowledgeMapGraph';

export default function FactoryStudio() {
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge-map' | 'patterns' | 'training' | 'test'>('overview');
  const queryClient = useQueryClient();

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: stats, isLoading: isStatsLoading, error: statsError } = useQuery({
    queryKey: ['factory', 'stats'],
    queryFn: factoryApi.getStats,
    refetchInterval: 30000,
  });

  const { data: patterns = [], isLoading: isPatternsLoading } = useQuery({
    queryKey: ['factory', 'patterns', 'all'],
    queryFn: factoryApi.getPatterns,
  });

  const { data: trainingStatus, refetch: refetchTrainingStatus } = useQuery({
    queryKey: ['factory', 'training', 'status'],
    queryFn: factoryApi.getTrainingStatus,
    refetchInterval: (query) => ((query.state.data as any)?.status === 'TRAINING' ? 5000 : false),
  });

  const { data: trainingStats = [] as any[] } = useQuery({
    queryKey: ['factory', 'training', 'stats'],
    queryFn: factoryApi.getTrainingStats,
    refetchInterval: (query) => {
      const state = queryClient.getQueryState(['factory', 'training', 'status']);
      return (state?.data as any)?.status === 'TRAINING' ? 5000 : false;
    },
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const startTraining = useMutation({
    mutationFn: () => factoryApi.startTraining(),
    onSuccess: () => refetchTrainingStatus(),
  });

  const stopTraining = useMutation({
    mutationFn: () => factoryApi.stopTraining(),
    onSuccess: () => refetchTrainingStatus(),
  });

  const [testForm, setTestForm] = useState({
    run_id: `test-${Date.now()}`,
    component: 'backend',
    coverage: 95,
    pass_rate: 98,
    performance: 92,
    chaos_resilience: 88,
    business_kpi: 85,
  });
  const [testResult, setTestResult] = useState<any>(null);

  const testIngestMutation = useMutation({
    mutationFn: (payload: any) => factoryApi.ingest(payload),
    onSuccess: (data) => {
      setTestResult(data);
      queryClient.invalidateQueries({ queryKey: ['factory'] });
    },
    onError: (e: any) => {
      setTestResult({ error: e.response?.data?.detail || e.message });
    }
  });

  const handleTestIngest = () => {
    setTestResult(null);
    const payload = {
      run_id: testForm.run_id,
      component: testForm.component,
      metrics: {
        coverage: testForm.coverage,
        pass_rate: testForm.pass_rate,
        performance: testForm.performance,
        chaos_resilience: testForm.chaos_resilience,
        business_kpi: testForm.business_kpi,
      },
      changes: {
        modified: ['src/main.py', 'tests/integration.py'],
        added: ['docs/factory.md'],
      },
      timestamp: new Date().toISOString(),
      branch: 'main',
      commit_sha: 'abc123def456',
    };
    testIngestMutation.mutate(payload);
  };

  const loading = isStatsLoading || isPatternsLoading;
  const error = statsError ? (statsError as Error).message : null;

  return (
    <PageTransition>
      <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
        {/* Background Effects */}
        <AdvancedBackground />
        <CyberGrid opacity={0.05} />

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 h-full w-full flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
            <ViewHeader
              title="Студія Фабрики"
              subtitle="Карта Знань, Патерни та Тренування Моделей"
              icon={Zap}
            />
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 border-b border-white/5 bg-black/20 backdrop-blur-lg">
            <div className="flex items-center gap-4 pb-4 overflow-x-auto no-scrollbar">
              {(['overview', 'knowledge-map', 'patterns', 'training', 'test'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                    activeTab === tab
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  )}
                >
                  {tab === 'overview'
                    ? '📊 Огляд'
                    : tab === 'knowledge-map'
                    ? '🕸️ Карта Знань'
                    : tab === 'patterns'
                    ? '⭐ Золоті Патерни'
                    : tab === 'training'
                    ? '�  Тренування'
                    : '🧪 Тест'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading && activeTab === 'overview' ? (
              <div className="flex items-center justify-center h-full">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                  <RefreshCw className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={16} />
                  {error}
                </div>
              </div>
            ) : activeTab === 'overview' && stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stats Cards */}
                {[
                  {
                    icon: Database,
                    label: 'Всього Патернів',
                    value: stats.total_patterns,
                    color: 'yellow',
                  },
                  {
                    icon: Star,
                    label: 'Золоті Патерни',
                    value: stats.gold_patterns,
                    color: 'amber',
                  },
                  {
                    icon: TrendingUp,
                    label: 'Середня Оцінка',
                    value: `${stats.avg_score.toFixed(1)}%`,
                    color: 'emerald',
                  },
                  {
                    icon: Zap,
                    label: 'Запусків',
                    value: stats.total_runs,
                    color: 'violet',
                  },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-lg p-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-${stat.color}-400 text-xs font-bold uppercase`}>
                          {stat.label}
                        </div>
                        <div className="text-2xl font-bold text-white mt-2">
                          {stat.value}
                        </div>
                      </div>
                      <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : activeTab === 'knowledge-map' ? (
              <KnowledgeMapGraph patterns={patterns} />
            ) : activeTab === 'patterns' ? (
              <PipelineTable data={patterns} />
            ) : activeTab === 'training' ? (
              <div className="space-y-6">
                 {/* Training Header / Controls */}
                 <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-6">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                         <BrainCircuit className="text-yellow-400" /> Нейронне Тренування Фабрики
                      </h3>
                      <p className="text-slate-400 text-sm mt-1">Тренування моделі розпізнавання патернів на кодовій базі</p>
                    </div>
                    <div>
                       {trainingStatus?.status === 'TRAINING' ? (
                          <button 
                            onClick={() => stopTraining.mutate()}
                            disabled={stopTraining.isPending}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                          >
                             <StopCircle className="w-5 h-5" /> Зупинити Тренування
                          </button>
                       ) : (
                          <button 
                            onClick={() => startTraining.mutate()}
                            disabled={startTraining.isPending}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                          >
                             <PlayCircle className="w-5 h-5" /> Почати Тренування
                          </button>
                       )}
                    </div>
                 </div>
                 
                 {/* Status indicator */}
                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                       <div className="text-xs text-slate-400 uppercase font-bold">Статус</div>
                       <div className="text-lg font-bold text-white mt-1">
                          {trainingStatus?.status === 'TRAINING' ? (
                             <span className="text-yellow-400 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" /> В процесі...
                             </span>
                          ) : trainingStatus?.status === 'COMPLETED' ? (
                             <span className="text-emerald-400 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Завершено
                             </span>
                          ) : (
                             <span className="text-slate-400">Очікування (IDLE)</span>
                          )}
                       </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                       <div className="text-xs text-slate-400 uppercase font-bold">Активна Модель</div>
                       <div className="text-lg font-bold text-white mt-1">{trainingStatus?.activeModel || '—'}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                       <div className="text-xs text-slate-400 uppercase font-bold">Прогрес</div>
                       <div className="text-lg font-bold text-yellow-400 mt-1">{trainingStatus?.progress || 0}%</div>
                    </div>
                 </div>

                 {/* Chart */}
                 <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h4 className="text-sm font-bold text-slate-300 mb-4">Епохи Тренування (Метрики)</h4>
                    {trainingStats.length > 0 ? (
                      <TrainingChart data={trainingStats} />
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-slate-500">
                         Немає даних для графіка.
                      </div>
                    )}
                 </div>
              </div>
            ) : activeTab === 'test' ? (
              <div className="max-w-2xl">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">🧪 Тестова Інгестія</h3>

                  <div className="space-y-4">
                    {/* Form Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">
                          ID Запуску
                        </label>
                        <input
                          type="text"
                          value={testForm.run_id}
                          onChange={(e) =>
                            setTestForm({ ...testForm, run_id: e.target.value })
                          }
                          className="w-full mt-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">
                          Компонент
                        </label>
                        <select
                          value={testForm.component}
                          onChange={(e) =>
                            setTestForm({ ...testForm, component: e.target.value })
                          }
                          className="w-full mt-2 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                        >
                          <option value="backend">Бекенд</option>
                          <option value="web_ui">Веб Інтерфейс</option>
                          <option value="api">API</option>
                          <option value="analytics">Аналітика</option>
                          <option value="core">Ядро</option>
                        </select>
                      </div>
                    </div>

                    {/* Metrics Sliders */}
                    {['coverage', 'pass_rate', 'performance', 'chaos_resilience', 'business_kpi'].map(
                      (metric) => (
                        <div key={metric}>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-400 uppercase font-bold">
                              {metric === 'coverage' ? 'Покриття' : 
                               metric === 'pass_rate' ? '� івень Проходження' :
                               metric === 'performance' ? 'Продуктивність' :
                               metric === 'chaos_resilience' ? 'Стійкість до Хаосу' :
                               'Бізнес KPI'}
                            </label>
                            <span className="text-sm text-yellow-400 font-bold">
                              {(testForm as any)[metric]}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(testForm as any)[metric]}
                            onChange={(e) =>
                              setTestForm({
                                ...testForm,
                                [metric]: parseInt(e.target.value),
                              })
                            }
                            className="w-full mt-2 accent-yellow-500"
                          />
                        </div>
                      )
                    )}

                    {/* Button */}
                    <button
                      onClick={handleTestIngest}
                      disabled={testIngestMutation.isPending}
                      className={cn(
                        'w-full mt-6 py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2',
                        testIngestMutation.isPending
                          ? 'bg-slate-700'
                          : 'bg-yellow-600 hover:bg-yellow-500'
                      )}
                    >
                      <Send size={16} />
                      {testIngestMutation.isPending ? 'Надсилаю...' : 'Надіслати � езультат'}
                    </button>

                    {/* Result */}
                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'mt-4 p-4 rounded-lg border',
                          testResult.status === 'created'
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : testResult.error 
                              ? 'bg-red-500/10 border-red-500/20'
                              : 'bg-rose-500/10 border-rose-500/20'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {testResult.status === 'created' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : testResult.error ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                          )}
                          <div className="text-sm font-bold text-white">
                            {testResult.status === 'created'
                              ? `Патерн Створено! (Оцінка: ${testResult.score})`
                              : testResult.error || testResult.reason}
                          </div>
                        </div>
                        {testResult.correlation_id && (
                          <div className="text-xs text-slate-400 mt-2">
                            ID: {testResult.correlation_id}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
