import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Database, FileText, XCircle } from 'lucide-react';
import React from 'react';

type IngestionStage =
  | 'uploaded'
  | 'validating'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'ready'
  | 'failed';

interface IngestionProgressProps {
  jobId: string;
  fileName: string;
  fileSize: number;
  stage: IngestionStage;
  progressPercent: number;
  currentItem: number;
  totalItems: number;
  message: string;
  startedAt: string;
  updatedAt: string;
  error?: string;
  estimatedTimeRemaining?: number;
}

const stageConfig: Record<IngestionStage, { label: string; icon: React.ReactNode; color: string }> = {
  uploaded: {
    label: 'Завантажено',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-600'
  },
  validating: {
    label: 'Перевірка',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-blue-600'
  },
  parsing: {
    label: 'Обробка',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-purple-600'
  },
  chunking: {
    label: 'Розбиття',
    icon: <Database className="h-4 w-4" />,
    color: 'text-purple-600'
  },
  embedding: {
    label: 'Індексація (AI)',
    icon: <Database className="h-4 w-4" />,
    color: 'text-indigo-600'
  },
  indexing: {
    label: 'Фінальна індексація',
    icon: <Database className="h-4 w-4" />,
    color: 'text-indigo-600'
  },
  ready: {
    label: 'Готово',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600'
  },
  failed: {
    label: 'Помилка',
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600'
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}с`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}хв`;
  return `${Math.round(seconds / 3600)}год`;
}

export function IngestionProgressMonitor({
  jobId,
  fileName,
  fileSize,
  stage,
  progressPercent,
  currentItem,
  totalItems,
  message,
  startedAt,
  updatedAt,
  error,
  estimatedTimeRemaining
}: IngestionProgressProps) {
  const config = stageConfig[stage];
  const isComplete = stage === 'ready';
  const isFailed = stage === 'failed';
  const isProcessing = !isComplete && !isFailed;

  const elapsedTime = React.useMemo(() => {
    const start = new Date(startedAt).getTime();
    const now = new Date(updatedAt).getTime();
    return Math.floor((now - start) / 1000);
  }, [startedAt, updatedAt]);

  return (
    <Card className={`w-full p-6 ${isFailed ? 'border-red-300 dark:border-red-800' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{fileName}</h3>
            {isComplete && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Готово
              </Badge>
            )}
            {isFailed && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Помилка
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1 animate-spin" />
                В процесі
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatBytes(fileSize)} • Розпочато {formatDuration(elapsedTime)} тому
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className={`font-medium flex items-center gap-2 ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
          <span className="text-muted-foreground">
            {progressPercent.toFixed(1)}%
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-3"
          indicatorClassName={isFailed ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-primary'}
        />
      </div>

      {/* Status Message */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {message}
          {totalItems > 0 && (
            <span className="ml-2 font-mono text-xs">
              ({currentItem.toLocaleString()} / {totalItems.toLocaleString()})
            </span>
          )}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Виникла помилка
              </p>
              <p className="text-xs text-red-800 dark:text-red-200 font-mono">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stage Timeline */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-4">
          {Object.entries(stageConfig).filter(([key]) => key !== 'failed').map(([key, cfg], index) => {
            const stageKey = key as IngestionStage;
            const stages: IngestionStage[] = ['uploaded', 'validating', 'parsing', 'chunking', 'embedding', 'indexing', 'ready'];
            const currentIndex = stages.indexOf(stage);
            const thisIndex = stages.indexOf(stageKey);
            const isPast = thisIndex < currentIndex;
            const isCurrent = thisIndex === currentIndex;

            return (
              <div
                key={key}
                className={`flex items-center gap-1 ${
                  isPast ? 'text-green-600' : isCurrent ? cfg.color : 'text-muted-foreground/50'
                }`}
              >
                {isPast ? <CheckCircle className="h-3 w-3" /> : cfg.icon}
                <span className="hidden sm:inline">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && isProcessing && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>~{formatDuration(estimatedTimeRemaining)} залишилось</span>
          </div>
        )}
      </div>

      {/* Job ID */}
      <div className="mt-2 pt-2 border-t">
        <p className="text-xs text-muted-foreground font-mono">
          Job ID: {jobId}
        </p>
      </div>
    </Card>
  );
}
