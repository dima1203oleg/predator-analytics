import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, ExternalLink, Info, ThumbsDown, ThumbsUp } from 'lucide-react';
import React from 'react';

interface Source {
  id: string;
  type: string;
  title: string;
  snippet: string;
  confidence: number;
  url?: string;
}

interface Explanation {
  summary: string;
  reasoning_steps: string[];
  limitations: string[];
  suggestions?: string[];
}

interface AIResponseProps {
  answer: string;
  sources: Source[];
  confidenceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  explanation: Explanation;
  queryId: string;
  modelUsed: string;
  processingTimeMs: number;
  tokenCount?: number;
  isStreaming?: boolean;
  onFeedback?: (queryId: string, feedbackType: 'positive' | 'negative') => void;
}

const confidenceConfig = {
  high: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  medium: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  low: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800'
  }
};

export function AIResponse({
  answer,
  sources,
  confidenceScore,
  confidenceLevel,
  explanation,
  queryId,
  modelUsed,
  processingTimeMs,
  tokenCount,
  isStreaming = false,
  onFeedback
}: AIResponseProps) {
  const config = confidenceConfig[confidenceLevel];
  const [feedbackGiven, setFeedbackGiven] = React.useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (type: 'positive' | 'negative') => {
    if (onFeedback && !feedbackGiven) {
      onFeedback(queryId, type);
      setFeedbackGiven(type);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={confidenceLevel === 'high' ? 'default' : 'secondary'}
              className={`${config.textColor} ${config.bgColor} border ${config.borderColor}`}
            >
              Впевненість: {(confidenceScore * 100).toFixed(0)}%
            </Badge>

            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute left-0 top-6 z-50 hidden group-hover:block w-72 p-3 bg-popover border rounded-lg shadow-lg">
                <p className="text-sm text-muted-foreground">{explanation.summary}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{processingTimeMs}ms</span>
            {tokenCount && <span>{tokenCount} токенів</span>}
            <span className="capitalize">{modelUsed}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Main Answer */}
        <div className="prose dark:prose-invert max-w-none">
          {isStreaming ? (
            <p className="animate-pulse leading-relaxed">
              {answer}
              <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse">▊</span>
            </p>
          ) : (
            <p className="leading-relaxed text-foreground">{answer}</p>
          )}
        </div>

        {/* Confidence Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">� івень впевненості</span>
            <span className={`capitalize ${config.textColor}`}>{confidenceLevel === 'high' ? 'Високий' : confidenceLevel === 'medium' ? 'Середній' : 'Низький'}</span>
          </div>
          <Progress value={confidenceScore * 100} className="h-2" indicatorClassName={config.color} />
        </div>

        {/* Sources - MANDATORY */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Джерела перевірки ({sources.length})
          </h4>
          <div className="grid gap-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{source.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {(source.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                      {source.snippet}
                    </p>
                  </div>
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Переглянути джерело
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reasoning Steps */}
        {explanation.reasoning_steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Логіка аналізу</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {explanation.reasoning_steps.map((step, i) => (
                <li key={i} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Limitations Warning */}
        {explanation.limitations.length > 0 && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  Обмеження відповіді
                </p>
                <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                  {explanation.limitations.map((lim, i) => (
                    <li key={i} className="leading-relaxed">{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {explanation.suggestions && explanation.suggestions.length > 0 && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  � екомендації
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  {explanation.suggestions.map((sug, i) => (
                    <li key={i} className="leading-relaxed">{sug}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Buttons */}
        {onFeedback && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <span className="text-xs text-muted-foreground">Чи була відповідь корисною?</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback('positive')}
                disabled={feedbackGiven !== null}
                className={`p-2 rounded-md transition-colors ${
                  feedbackGiven === 'positive'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                    : 'hover:bg-muted'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFeedback('negative')}
                disabled={feedbackGiven !== null}
                className={`p-2 rounded-md transition-colors ${
                  feedbackGiven === 'negative'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    : 'hover:bg-muted'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground font-mono">
            Query ID: {queryId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
