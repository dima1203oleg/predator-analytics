import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, CheckCircle, XCircle, Clock,
  MessageSquare, Link2, GitMerge, Flag, Filter,
  ChevronRight, Eye, Edit3, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { api } from '../../services/api';

// Task Types
type TaskType = 'entity_merge' | 'false_positive' | 'rule_feedback' | 'sanctions_review' | 'export_control_review';
type Priority = 'critical' | 'high' | 'normal' | 'low';
type Status = 'pending' | 'assigned' | 'completed' | 'rejected';

interface ReviewTask {
  id: string;
  task_type: TaskType;
  priority: Priority;
  status: Status;
  entity_id: string;
  entity_type: string;
  created_at: string;
  context: {
    entity_name?: string;
    matched_entity_name?: string;
    confidence?: number;
    rule_id?: string;
    rule_name?: string;
    flags?: string[];
    evidence?: Array<{ type: string; value: string }>;
  };
  suggestion: {
    action: string;
    reason: string;
    confidence: number;
  };
}

const PRIORITY_CONFIG: Record<Priority, { color: string; label: string; icon: any }> = {
  critical: { color: 'rose', label: 'К� ИТИЧНИЙ', icon: AlertTriangle },
  high: { color: 'amber', label: 'ВИСОКИЙ', icon: Flag },
  normal: { color: 'blue', label: 'ЗВИЧАЙНИЙ', icon: Clock },
  low: { color: 'slate', label: 'НИЗЬКИЙ', icon: Clock },
};

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: any; description: string }> = {
  entity_merge: {
    label: 'Злиття сутностей',
    icon: GitMerge,
    description: 'Система вважає, що це одна сутність'
  },
  false_positive: {
    label: 'Хибне спрацювання',
    icon: XCircle,
    description: 'Правило спрацювало помилково'
  },
  rule_feedback: {
    label: 'Зворотній зв\'язок правила',
    icon: MessageSquare,
    description: 'Потрібен огляд роботи правила'
  },
  sanctions_review: {
    label: 'Санкційний огляд',
    icon: AlertTriangle,
    description: 'Потенційне порушення санкцій'
  },
  export_control_review: {
    label: 'Експортний контроль',
    icon: Flag,
    description: 'Товар подвійного призначення'
  },
};

interface ReviewQueueProps {
  userId?: string;
  onTaskComplete?: (taskId: string, decision: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  userId,
  onTaskComplete
}) => {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ReviewTask | null>(null);
  const [filter, setFilter] = useState<Priority | 'all'>('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockTasks: ReviewTask[] = [
      {
        id: 'task-001',
        task_type: 'entity_merge',
        priority: 'high',
        status: 'pending',
        entity_id: 'comp-123',
        entity_type: 'company',
        created_at: new Date().toISOString(),
        context: {
          entity_name: 'ТОВ "� ОМАШКА"',
          matched_entity_name: 'ROMASHKA LLC',
          confidence: 0.87,
          evidence: [
            { type: 'address', value: 'Однакова адреса реєстрації' },
            { type: 'director', value: 'Той самий директор: Іванов І.І.' }
          ]
        },
        suggestion: {
          action: 'merge',
          reason: 'Висока ймовірність що це одна компанія',
          confidence: 0.87
        }
      },
      {
        id: 'task-002',
        task_type: 'sanctions_review',
        priority: 'critical',
        status: 'pending',
        entity_id: 'decl-456',
        entity_type: 'declaration',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        context: {
          entity_name: 'Декларація #UA-2024-78901',
          rule_id: 'sanctions_entity_match',
          rule_name: 'SDN List Match',
          confidence: 0.92,
          flags: ['sdn_match', 'sanctions_violation']
        },
        suggestion: {
          action: 'block',
          reason: 'Експортер співпадає з SDN списком на 92%',
          confidence: 0.92
        }
      },
      {
        id: 'task-003',
        task_type: 'false_positive',
        priority: 'normal',
        status: 'pending',
        entity_id: 'decl-789',
        entity_type: 'declaration',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        context: {
          entity_name: 'Декларація #UA-2024-45678',
          rule_id: 'fraud_round_numbers',
          rule_name: 'Підозрілі круглі суми',
        },
        suggestion: {
          action: 'dismiss',
          reason: 'Сума $100,000 - можливо легітимна',
          confidence: 0.45
        }
      }
    ];

    setTasks(mockTasks);
    setLoading(false);
  }, []);

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.priority === filter);

  const handleDecision = async (taskId: string, decision: 'approve' | 'reject' | 'modify') => {
    // In production: call API
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'completed' as Status } : t
    ));
    setSelectedTask(null);
    onTaskComplete?.(taskId, decision);
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Щойно';
    if (hours < 24) return `${hours} год. тому`;
    return `${Math.floor(hours / 24)} дн. тому`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Users size={24} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ЧЕ� ГА НА ОГЛЯД</h2>
              <p className="text-sm text-slate-400">Human-in-the-Loop</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm font-bold">
              {tasks.filter(t => t.priority === 'critical' && t.status === 'pending').length} критичних
            </span>
            <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm">
              {tasks.filter(t => t.status === 'pending').length} всього
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          {(['all', 'critical', 'high', 'normal'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                filter === f
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {f === 'all' ? 'Всі' : PRIORITY_CONFIG[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Завантаження...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <p className="text-slate-400">Немає завдань на огляд</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const typeConfig = TASK_TYPE_CONFIG[task.task_type];
            const PriorityIcon = priorityConfig.icon;
            const TypeIcon = typeConfig.icon;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-all ${
                  selectedTask?.id === task.id ? 'bg-slate-800' : ''
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-start gap-4">
                  {/* Priority indicator */}
                  <div className={`p-2 rounded-lg bg-${priorityConfig.color}-500/20 flex-shrink-0`}>
                    <PriorityIcon size={20} className={`text-${priorityConfig.color}-400`} />
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded bg-${priorityConfig.color}-500/20 text-${priorityConfig.color}-400`}>
                        {priorityConfig.label}
                      </span>
                      <span className="text-xs text-slate-500">{typeConfig.label}</span>
                    </div>

                    <h4 className="text-white font-medium truncate">
                      {task.context.entity_name}
                    </h4>

                    {task.context.matched_entity_name && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <Link2 size={14} />
                        <span>→ {task.context.matched_entity_name}</span>
                        <span className={`font-mono text-xs ${
                          (task.context.confidence || 0) > 0.8 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {((task.context.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                      {getTimeAgo(task.created_at)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={20} className="text-slate-600 flex-shrink-0" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-${PRIORITY_CONFIG[selectedTask.priority].color}-500/20`}>
                    {React.createElement(TASK_TYPE_CONFIG[selectedTask.task_type].icon, {
                      size: 24,
                      className: `text-${PRIORITY_CONFIG[selectedTask.priority].color}-400`
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {TASK_TYPE_CONFIG[selectedTask.task_type].label}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {TASK_TYPE_CONFIG[selectedTask.task_type].description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Entity Info */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Сутність
                  </h4>
                  <p className="text-lg text-white font-medium">
                    {selectedTask.context.entity_name}
                  </p>

                  {selectedTask.context.matched_entity_name && (
                    <div className="mt-3 flex items-center gap-2">
                      <GitMerge size={16} className="text-cyan-400" />
                      <span className="text-slate-400">Можливий збіг:</span>
                      <span className="text-white">{selectedTask.context.matched_entity_name}</span>
                    </div>
                  )}
                </div>

                {/* Confidence */}
                {selectedTask.suggestion.confidence !== undefined && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Впевненість системи
                    </h4>
                    <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          selectedTask.suggestion.confidence > 0.8 ? 'bg-emerald-500' :
                          selectedTask.suggestion.confidence > 0.5 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedTask.suggestion.confidence * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-right text-sm text-slate-400 mt-1">
                      {(selectedTask.suggestion.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                )}

                {/* Evidence */}
                {selectedTask.context.evidence && selectedTask.context.evidence.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Докази
                    </h4>
                    <div className="space-y-2">
                      {selectedTask.context.evidence.map((ev, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs text-slate-500 uppercase">{ev.type}</span>
                            <p className="text-slate-300">{ev.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestion */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">
                    � екомендація системи
                  </h4>
                  <p className="text-white">{selectedTask.suggestion.reason}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-slate-800 flex gap-3">
                <button
                  onClick={() => handleDecision(selectedTask.id, 'approve')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors"
                >
                  <ThumbsUp size={18} />
                  Підтвердити
                </button>

                <button
                  onClick={() => handleDecision(selectedTask.id, 'modify')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors"
                >
                  <Edit3 size={18} />
                  Змінити
                </button>

                <button
                  onClick={() => handleDecision(selectedTask.id, 'reject')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-colors"
                >
                  <ThumbsDown size={18} />
                  Відхилити
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewQueue;
