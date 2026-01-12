
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, FileText, User, Search, Database,
  AlertCircle, CheckCircle, AlertTriangle, Bot, Zap,
  Filter, RefreshCw, ChevronDown, Eye
} from 'lucide-react';
import { useAgents } from '../context/AgentContext';

// ============================================================================
// PREDATOR ACTIVITY VIEW - ЖУРНАЛ ПОДІЙ
// Простий хронологічний список: що відбувалось
// ============================================================================

type EventType = 'case' | 'data' | 'user' | 'ai' | 'system' | 'security';
type EventLevel = 'info' | 'success' | 'warning' | 'error';

interface ActivityEvent {
  id: string;
  type: EventType;
  level: EventLevel;
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
  metadata?: Record<string, any>;
}

// Конфігурація типів подій
const EVENT_TYPE_CONFIG = {
  case: {
    icon: FileText,
    label: 'Кейс',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30'
  },
  data: {
    icon: Database,
    label: 'Дані',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30'
  },
  user: {
    icon: User,
    label: 'Користувач',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30'
  },
  ai: {
    icon: Bot,
    label: 'AI',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30'
  },
  system: {
    icon: Zap,
    label: 'Система',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30'
  },
  security: {
    icon: AlertCircle,
    label: 'Безпека',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30'
  },
};

const EVENT_LEVEL_CONFIG = {
  info: { icon: Activity, color: 'text-slate-400' },
  success: { icon: CheckCircle, color: 'text-emerald-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  error: { icon: AlertCircle, color: 'text-red-400' },
};

// ============================================================================
// КОМПОНЕНТ: КАРТКА ПОДІЇ
// ============================================================================

interface EventCardProps {
  event: ActivityEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const typeConfig = EVENT_TYPE_CONFIG[event.type];
  const levelConfig = EVENT_LEVEL_CONFIG[event.level];
  const TypeIcon = typeConfig.icon;

  // Форматування часу
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Щойно';
    if (minutes < 60) return `${minutes} хв тому`;
    if (hours < 24) return `${hours} год тому`;

    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4"
    >
      {/* Часова лінія */}
      <div className="flex flex-col items-center">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${typeConfig.bg} ${typeConfig.border} border
        `}>
          <TypeIcon size={18} className={typeConfig.color} />
        </div>
        <div className="w-px flex-1 bg-slate-800 my-2" />
      </div>

      {/* Контент */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              {event.level !== 'info' && (
                <span className={`${levelConfig.color}`}>
                  <levelConfig.icon size={12} />
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-white">
              {event.title}
            </h4>
            {event.description && (
              <p className="text-xs text-slate-400 mt-1">
                {event.description}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-500 font-mono">
              {formatTime(event.timestamp)}
            </div>
            {event.actor && (
              <div className="text-[10px] text-slate-600 mt-0.5">
                {event.actor}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// ФІЛЬТРИ
// ============================================================================

interface EventFiltersProps {
  activeType: EventType | 'all';
  onTypeChange: (type: EventType | 'all') => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({ activeType, onTypeChange }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onTypeChange('all')}
        className={`
          px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0
          ${activeType === 'all'
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:text-slate-300'}
        `}
      >
        Всі події
      </button>

      {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => {
        const config = EVENT_TYPE_CONFIG[type];
        const Icon = config.icon;

        return (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0
              ${activeType === type
                ? `${config.bg} ${config.color} ${config.border} border`
                : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:text-slate-300'}
            `}
          >
            <Icon size={14} />
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// ГОЛОВНИЙ КОМПОНЕНТ
// ============================================================================

const ActivityView: React.FC = () => {
  const { logs } = useAgents();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<EventType | 'all'>('all');

  // Завантаження подій
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);

      // Демо-дані
      const demoEvents: ActivityEvent[] = [
        {
          id: 'e1',
          type: 'case',
          level: 'warning',
          title: 'Завершено аналіз ТОВ "Буд-Імперія"',
          description: 'Створено новий кейс #2847. Рівень ризику: КРИТИЧНО (87%)',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          actor: 'AI Аналітик'
        },
        {
          id: 'e2',
          type: 'data',
          level: 'success',
          title: 'Оновлено санкційні списки НБУ',
          description: 'Імпортовано 1,247 нових записів',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          actor: 'Система'
        },
        {
          id: 'e3',
          type: 'user',
          level: 'info',
          title: 'Олег створив запит на перевірку',
          description: 'Об\'єкт: ФОП Ковальчук О.О.',
          timestamp: new Date(Date.now() - 1000 * 60 * 32),
          actor: 'Олег Петренко'
        },
        {
          id: 'e4',
          type: 'ai',
          level: 'success',
          title: 'AI завершив обробку документів',
          description: 'Оброблено 45 документів, виявлено 3 аномалії',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          actor: 'Predator AI'
        },
        {
          id: 'e5',
          type: 'case',
          level: 'success',
          title: 'Кейс #2841 архівовано',
          description: 'ФОП Сидоренко — перевірка завершена без зауважень',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          actor: 'Олег Петренко'
        },
        {
          id: 'e6',
          type: 'system',
          level: 'info',
          title: 'Планове оновлення системи',
          description: 'Версія 22.4.1 успішно встановлена',
          timestamp: new Date(Date.now() - 1000 * 60 * 90),
          actor: 'Система'
        },
        {
          id: 'e7',
          type: 'security',
          level: 'warning',
          title: 'Невдала спроба входу',
          description: 'IP: 185.xxx.xxx.42 — заблоковано на 30 хвилин',
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          actor: 'WAF'
        },
        {
          id: 'e8',
          type: 'data',
          level: 'info',
          title: 'Синхронізація з Реєстром Мін\'юсту',
          description: 'Останнє оновлення: успішно',
          timestamp: new Date(Date.now() - 1000 * 60 * 180),
          actor: 'Система'
        },
      ];

      // Додаємо логи агентів
      const agentEvents: ActivityEvent[] = logs.slice(0, 5).map((log, idx) => ({
        id: `agent-${idx}`,
        type: 'ai' as EventType,
        level: 'info' as EventLevel,
        title: log,
        timestamp: new Date(Date.now() - 1000 * 60 * (idx * 5 + 10)),
        actor: 'Агент'
      }));

      setEvents([...demoEvents, ...agentEvents].sort((a, b) =>
        b.timestamp.getTime() - a.timestamp.getTime()
      ));
      setLoading(false);
    };

    loadEvents();
  }, [logs]);

  // Фільтрація
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter(e => e.type === activeFilter);
  }, [events, activeFilter]);

  // Групування по дням
  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: ActivityEvent[] } = {};

    filteredEvents.forEach(event => {
      const dateKey = event.timestamp.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return groups;
  }, [filteredEvents]);

  return (
    <div className="min-h-screen pb-24 md:pb-8 animate-in fade-in duration-500">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Журнал Подій
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Хронологія всіх дій та змін у системі
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-700 transition-all"
        >
          <RefreshCw size={14} />
          Оновити
        </button>
      </div>

      {/* Фільтри */}
      <div className="mb-6">
        <EventFilters activeType={activeFilter} onTypeChange={setActiveFilter} />
      </div>

      {/* Список подій */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity size={48} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">
            Подій не знайдено
          </h3>
          <p className="text-sm text-slate-500">
            У цій категорії поки немає записів
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              {/* Дата */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-sm font-bold text-slate-400">
                  {date}
                </div>
                <div className="flex-1 h-px bg-slate-800" />
                <div className="text-xs text-slate-600">
                  {dayEvents.length} подій
                </div>
              </div>

              {/* Події дня */}
              <div className="space-y-0">
                <AnimatePresence>
                  {dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityView;
