/**
 * Workflow Control Panel v45.0
 *
 * UI for managing Temporal workflows.
 * Features:
 * - Start self-improvement workflow
 * - Start self-healing workflow
 * - Monitor workflow status
 * - View workflow history
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

interface Workflow {
  id: string;
  type: 'self-improvement' | 'self-healing';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  result?: any;
}

export const WorkflowControlPanel: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [workflowType, setWorkflowType] = useState<'self-improvement' | 'self-healing'>('self-improvement');
  const [healingComponent, setHealingComponent] = useState('all');
  const [improvementReason, setImprovementReason] = useState('manual');

  // Fetch workflow statuses
  useEffect(() => {
    const fetchStatuses = async () => {
      // In a real implementation, this would fetch from backend
      // For now, we just update any running workflows
      const updatedWorkflows = await Promise.all(
        workflows.map(async (wf) => {
          if (wf.status === 'running') {
            try {
              const status = await api.ai.workflow.getStatus(wf.id);
              return { ...wf, status: status.status };
            } catch (e) {
              return wf;
            }
          }
          return wf;
        })
      );
      setWorkflows(updatedWorkflows);
    };

    const interval = setInterval(fetchStatuses, 10000);
    return () => clearInterval(interval);
  }, [workflows]);

  const handleStartWorkflow = async () => {
    setIsStarting(workflowType);

    try {
      let result;

      if (workflowType === 'self-improvement') {
        result = await api.ai.workflow.startSelfImprovement(improvementReason);
      } else {
        result = await api.ai.workflow.startSelfHealing(healingComponent);
      }

      const newWorkflow: Workflow = {
        id: result.workflow_id,
        type: workflowType,
        status: 'running',
        startedAt: new Date().toISOString(),
      };

      setWorkflows(prev => [newWorkflow, ...prev]);
      setShowNewWorkflow(false);

    } catch (error) {
      console.error('Failed to start workflow:', error);
    } finally {
      setIsStarting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'self-improvement' ? ' ' : '🏥';
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 ">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚙️</span>
          <div>
            <h3 className="font-semibold text-lg">Workflow Control</h3>
            <p className="text-slate-400 text-sm">Temporal Workflows</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNewWorkflow(!showNewWorkflow)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
        >
          {showNewWorkflow ? '✕ Закрити' : '+ Новий Workflow'}
        </motion.button>
      </div>

      {/* New Workflow Form */}
      <AnimatePresence>
        {showNewWorkflow && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-700"
          >
            <div className="p-4 space-y-4">
              <h4 className="font-medium text-slate-300">Запустити новий Workflow</h4>

              {/* Type Selection */}
              <div className="flex gap-3">
                <button
                  onClick={() => setWorkflowType('self-improvement')}
                  className={`flex-1 p-4 rounded-lg border transition-all ${
                    workflowType === 'self-improvement'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-2xl mb-2"> </div>
                  <div className="font-medium">Self-Improvement</div>
                  <div className="text-xs opacity-70">Оптимізація AI</div>
                </button>

                <button
                  onClick={() => setWorkflowType('self-healing')}
                  className={`flex-1 p-4 rounded-lg border transition-all ${
                    workflowType === 'self-healing'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-900/50 border-slate-600 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-2xl mb-2">🏥</div>
                  <div className="font-medium">Self-Healing</div>
                  <div className="text-xs opacity-70">Відновлення системи</div>
                </button>
              </div>

              {/* Type-specific options */}
              {workflowType === 'self-improvement' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Причина запуску</label>
                  <select
                    value={improvementReason}
                    onChange={(e) => setImprovementReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="manual">Manual trigger</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="anomaly">Anomaly detected</option>
                    <option value="performance">Performance degradation</option>
                  </select>
                </div>
              )}

              {workflowType === 'self-healing' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Компонент для відновлення</label>
                  <select
                    value={healingComponent}
                    onChange={(e) => setHealingComponent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="all">All components</option>
                    <option value="database">Database</option>
                    <option value="redis">Redis</option>
                    <option value="llm">LLM Router</option>
                    <option value="agents">Agents</option>
                    <option value="kafka">Kafka</option>
                    <option value="qdrant">Qdrant</option>
                  </select>
                </div>
              )}

              {/* Start Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartWorkflow}
                disabled={isStarting !== null}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isStarting ? '⏳ Запуск...' : '🚀 Запустити Workflow'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflows List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-3">📭</div>
            <p>Немає активних workflows</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <motion.div
              key={workflow.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedWorkflow(workflow)}
              className="p-4 bg-slate-900/50 rounded-lg border border-slate-600 cursor-pointer hover:border-slate-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTypeIcon(workflow.type)}</span>
                  <div>
                    <div className="font-medium capitalize">
                      {workflow.type.replace('-', ' ')}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {workflow.id.substring(0, 8)}...
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                  {getStatusIcon(workflow.status)} {workflow.status.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-500">
                Started: {new Date(workflow.startedAt).toLocaleString('uk-UA')}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Workflow Detail Modal */}
      <AnimatePresence>
        {selectedWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSelectedWorkflow(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-lg w-full mx-4"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                {getTypeIcon(selectedWorkflow.type)}
                {selectedWorkflow.type.replace('-', ' ').toUpperCase()}
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Workflow ID:</span>
                  <span className="font-mono">{selectedWorkflow.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedWorkflow.status)}`}>
                    {selectedWorkflow.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Started:</span>
                  <span>{new Date(selectedWorkflow.startedAt).toLocaleString('uk-UA')}</span>
                </div>
                {selectedWorkflow.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed:</span>
                    <span>{new Date(selectedWorkflow.completedAt).toLocaleString('uk-UA')}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedWorkflow(null)}
                className="mt-6 w-full py-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
              >
                Закрити
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowControlPanel;
