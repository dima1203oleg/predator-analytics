import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileCode, Link2, Shield, User } from 'lucide-react';

interface ProvenanceEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  actor_id: string;
  actor_type: 'user' | 'system' | 'ai';
  resource_id: string;
  resource_type: string;
  action: string;
  input_hash: string;
  output_hash?: string;
  metadata?: Record<string, any>;
  parent_event_id?: string;
}

interface ProvenanceCardProps {
  event: ProvenanceEvent;
  showLineage?: boolean;
  onViewDetails?: (eventId: string) => void;
}

const actorTypeConfig = {
  user: {
    icon: <User className="h-4 w-4" />,
    label: 'Користувач',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
  },
  system: {
    icon: <FileCode className="h-4 w-4" />,
    label: 'Система',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
  },
  ai: {
    icon: <Shield className="h-4 w-4" />,
    label: 'AI',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400'
  }
};

const eventTypeLabels: Record<string, string> = {
  data_ingested: 'Дані завантажено',
  data_transformed: 'Дані трансформовано',
  data_enriched: 'Дані збагачено',
  data_accessed: 'Доступ до даних',
  ai_query: 'AI запит',
  ai_response: 'AI відповідь',
  export: 'Експорт',
  delete: 'Видалення'
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'щойно';
  if (diffMins < 60) return `${diffMins}хв тому`;
  if (diffHours < 24) return `${diffHours}год тому`;
  if (diffDays < 7) return `${diffDays}д тому`;

  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncateHash(hash: string, length: number = 8): string {
  return hash.substring(0, length) + '...' + hash.substring(hash.length - 4);
}

export function ProvenanceCard({
  event,
  showLineage = false,
  onViewDetails
}: ProvenanceCardProps) {
  const actorConfig = actorTypeConfig[event.actor_type];
  const eventLabel = eventTypeLabels[event.event_type] || event.event_type;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {eventLabel}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatTimestamp(event.timestamp)}</span>
            </div>
          </div>
          <Badge className={actorConfig.color}>
            <span className="flex items-center gap-1">
              {actorConfig.icon}
              {actorConfig.label}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Description */}
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{event.action}</span>
            {' на ресурсі '}
            <code className="px-1 py-0.5 rounded bg-muted text-xs">
              {event.resource_type}:{event.resource_id}
            </code>
          </p>
        </div>

        {/* Data Integrity Hashes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Вхідні дані (hash)</p>
            <code className="block p-2 rounded bg-background text-xs font-mono border">
              {truncateHash(event.input_hash)}
            </code>
          </div>
          {event.output_hash && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Вихідні дані (hash)</p>
              <code className="block p-2 rounded bg-background text-xs font-mono border">
                {truncateHash(event.output_hash)}
              </code>
            </div>
          )}
        </div>

        {/* Lineage */}
        {showLineage && event.parent_event_id && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Пов'язано з подією
              </p>
              <code className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                {event.parent_event_id}
              </code>
            </div>
          </div>
        )}

        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <details className="group">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Додаткова інформація ({Object.keys(event.metadata).length})
            </summary>
            <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-1">
              {Object.entries(event.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">{key}:</span>
                  <span className="text-foreground font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Криптографічно захищено</span>
          </div>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(event.event_id)}
              className="text-primary hover:underline font-medium"
            >
              Детальніше →
            </button>
          )}
        </div>

        {/* Event ID */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground font-mono">
            Event ID: {event.event_id}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
