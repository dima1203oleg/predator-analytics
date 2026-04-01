/**
 * Customer Lifecycle Tracker
 * Відслідковує: Demo → First Result → Save → Subscribe → Automate → Scale
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  TrendingUp,
  Save,
  Zap,
  Clock,
  Rocket,
  ChevronRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

export type LifecycleStage = 'demo' | 'first_result' | 'save' | 'subscribe' | 'automate' | 'scale';

export interface CustomerLifecycle {
  currentStage: LifecycleStage;
  stages: Array<{
    id: LifecycleStage;
    label: string;
    description: string;
    icon: React.ReactNode;
    completed: boolean;
    current: boolean;
    action?: string;
  }>;
  progress: number; // 0-100
  estimatedValue?: number; // в гривнях
}

const LIFECYCLE_STAGES: Array<{
  id: LifecycleStage;
  label: string;
  description: string;
  icon: React.ReactNode;
  tip: string;
}> = [
  {
    id: 'demo',
    label: 'Демо',
    description: 'Тестування платформи',
    icon: <Play className="w-5 h-5" />,
    tip: '2 хвилини навчання',
  },
  {
    id: 'first_result',
    label: 'Перший результат',
    description: 'Первий аналіз & economia',
    icon: <TrendingUp className="w-5 h-5" />,
    tip: 'Value screen з результатом',
  },
  {
    id: 'save',
    label: 'Зберегти',
    description: 'Сценарій для повторного використання',
    icon: <Save className="w-5 h-5" />,
    tip: 'Скласти библиотеку сценаріїв',
  },
  {
    id: 'subscribe',
    label: 'Підписатися',
    description: 'Розширити можливості',
    icon: <Zap className="w-5 h-5" />,
    tip: 'Pro/Enterprise план',
  },
  {
    id: 'automate',
    label: 'Автоматизувати',
    description: 'Регулярні запуски',
    icon: <Clock className="w-5 h-5" />,
    tip: 'Щомісячний аналіз',
  },
  {
    id: 'scale',
    label: 'Масштабувати',
    description: 'Конструктор & інтеграції',
    icon: <Rocket className="w-5 h-5" />,
    tip: 'Enterprise режим',
  },
];

interface CustomerLifecycleProps {
  currentStage?: LifecycleStage;
  onStageComplete?: (stage: LifecycleStage) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const CustomerLifecycleTracker: React.FC<CustomerLifecycleProps> = ({
  currentStage = 'demo',
  onStageComplete,
  showActions = true,
  compact = false,
}) => {
  const [completed, setCompleted] = useState<LifecycleStage[]>([]);
  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.id === currentStage);

  // Calculate progress
  const progress = Math.round(((currentStageIndex + 1) / LIFECYCLE_STAGES.length) * 100);

  // Estimated value calculation
  const estimatedValue = currentStageIndex >= 1 ? 340000 : 0; // Show after first result

  const handleCompleteStage = (stageId: LifecycleStage) => {
    if (!completed.includes(stageId)) {
      setCompleted([...completed, stageId]);
    }
    onStageComplete?.(stageId);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Прогрес</span>
          <span className="text-sm font-bold text-cyan-400">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-slate-500 mt-1">
          Стадія: <span className="text-cyan-400 font-medium">{LIFECYCLE_STAGES[currentStageIndex]?.label}</span>
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-violet-400" />
            Ваш шлях зростання
          </CardTitle>
          <CardDescription className="text-slate-400">
            Від демонстрації до масштабування
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Загальний прогрес</span>
              <span className="text-2xl font-bold text-violet-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Value Realization */}
          {estimatedValue > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <p className="text-sm text-slate-400 mb-1">Очікувана вартість</p>
              <p className="text-2xl font-bold text-emerald-400">
                {estimatedValue.toLocaleString('uk-UA')} ₴
              </p>
              <p className="text-xs text-emerald-300 mt-1">
                На основі вашого першого результату
              </p>
            </motion.div>
          )}

          {/* Lifecycle Stages */}
          <div className="space-y-4">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const isCompleted = completed.includes(stage.id);
              const isCurrent = stage.id === currentStage;
              const isUpcoming = idx > currentStageIndex;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Circle */}
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                      className={cn(
                        'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                        isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : '',
                        isCurrent ? 'bg-violet-500/20 border-violet-500 text-violet-400 ring-2 ring-violet-500/50' : '',
                        isUpcoming ? 'bg-slate-700/30 border-slate-600 text-slate-500' : ''
                      )}
                    >
                      {isCompleted || isCurrent ? (
                        isCurrent ? stage.icon : <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4
                            className={cn(
                              'font-semibold text-lg',
                              isCompleted || isCurrent ? 'text-white' : 'text-slate-400'
                            )}
                          >
                            {stage.label}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">{stage.description}</p>
                        </div>
                        {isCurrent && (
                          <Badge className="bg-violet-600 text-white border-0">Зараз</Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-emerald-600 text-white border-0">✓ Готово</Badge>
                        )}
                      </div>

                      {/* Tip */}
                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        💡 {stage.tip}
                      </p>

                      {/* Action Button */}
                      {showActions && isCurrent && !isCompleted && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mt-3"
                        >
                          <Button
                            onClick={() => handleCompleteStage(stage.id)}
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                          >
                            Перейти далі
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </motion.div>
                      )}

                      {/* Next Step Preview */}
                      {isCurrent && idx < LIFECYCLE_STAGES.length - 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                        >
                          <p className="text-xs font-medium text-slate-300 mb-1">Наступний крок:</p>
                          <p className="text-sm text-slate-400">{LIFECYCLE_STAGES[idx + 1]?.label}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <div className="ml-6 w-0.5 h-6 bg-gradient-to-b from-slate-700 to-slate-800 my-2" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20"
          >
            <h4 className="font-semibold text-white mb-2">Готові розпочати?</h4>
            <p className="text-sm text-slate-400 mb-4">
              Стартуйте з демо-режиму, отримайте перший результат і просувайтеся далі за своїм темпом.
            </p>
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              <Play className="w-4 h-4 mr-2" />
              Запустити демо
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CustomerLifecycleTracker;
