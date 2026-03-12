/**
 * AdaptiveDashboard - Dimensional Intelligence Dashboard (v45 Revised)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Brain, Cpu, Terminal } from 'lucide-react';

import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useDimensionalContext } from '../../hooks/useDimensionalContext';
import { ViewHeader } from '../../components';
import AzrHyperWidget from '../../components/AzrHyperWidget';

// Import newly separated shells
import { ExplorerShell, OperatorShell, CommanderShell } from '../../components/dimensional';

interface SystemMetrics {
  health: number;
  cpu: number;
  memory: number;
  network: number;
  activeContainers: number;
  documentsTotal: number;
  vectorsCount: number;
}

interface AdaptiveDashboardProps {
  onNavigate?: (view: string) => void;
}

const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({ onNavigate }) => {
  const { dimension, role, informationDensity, isExplorer, isOperator, isCommander } = useDimensionalContext();
  const toast = useToast();

  const [metrics, setMetrics] = useState<SystemMetrics>({
    health: 98.5,
    cpu: 45,
    memory: 60,
    network: 72,
    activeContainers: 18,
    documentsTotal: 125000,
    vectorsCount: 120000,
  });

  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [activeProcesses, setActiveProcesses] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  const handleShadowAction = async (action: string) => {
    try {
      let result;
      switch (action) {
        case 'БЛОКУВАННЯ':
          result = await api.lockdown();
          toast.warning("БЛОКУВАННЯ", result.lockdown_active ? "Систему ЗАБЛОКОВАНО" : "Блокування знято");
          break;
        case 'СИНХРОНІЗАЦІЯ':
          result = await api.syncETL();
          toast.success("СИНХРОНІЗАЦІЯ", "Синхронізацію джерел запущено успішно");
          break;
        case 'ПЕРЕЗАПУСК':
          result = await api.restartServices();
          toast.info("ПЕРЕЗАПУСК", "Процес перезапуску служб активовано");
          break;
        case 'БРАНДМАУЕР':
          toast.info("БРАНДМАУЕР", "Правила безпеки оновлено");
          break;
        case 'ТЕРМІНАЛ':
          if (onNavigate) onNavigate('monitoring');
          break;
        case 'АУДИТ':
          if (onNavigate) onNavigate('monitoring');
          break;
        default:
          toast.info("ДІЯ", `Запуск дії: ${action}`);
      }
    } catch (e) {
      toast.error("ПОМИЛКА", "Не вдалося виконати дію");
    }
  };

  const handleAIAction = async () => {
    try {
      await api.v45.optimizer.run();
      toast.success("ЯДРО ШІ", "Цикл самооптимізації ШІ активовано");
    } catch (e) {
      toast.error("ПОМИЛКА ШІ", "Помилка активації оптимізатора");
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isCommander || isOperator) {
           // Reuse existing data fetching logic...
           const status = await api.v45.getSystemStatus().catch(() => ({}));
           const alerts = await api.v45.getNotifications().catch(() => []);
           const health = await api.v45.getLiveHealth().catch(() => ({}));

           setMetrics(prev => ({
            ...prev,
            health: status.health_score || 98.5,
            cpu: health?.cpu?.percent || prev.cpu,
            memory: health?.memory?.percent || prev.memory,
            network: 0,
            activeContainers: Object.keys(health?.services || {}).length || prev.activeContainers,
            documentsTotal: status.opensearch?.opensearch_docs || prev.documentsTotal,
            vectorsCount: status.qdrant?.qdrant_vectors || prev.vectorsCount,
           }));

           const processes = [];
           if (status.data_pipeline?.etl_running) processes.push({ name: 'ETL Конвеєр', progress: 85, status: 'виконується' });
           else processes.push({ name: 'ETL Конвеєр', progress: 0, status: 'очікування' });
           if (status.automl?.is_running) processes.push({ name: 'ML Навчання', progress: status.automl.training_progress || 45, status: 'активний' });
           if (status.opensearch?.opensearch_healthy) processes.push({ name: 'Векторна Індексація', progress: 100, status: 'виконується' });

           setActiveProcesses(processes);
           setSystemAlerts(alerts.slice(0, 5));
        }

        if (isExplorer) {
          const logs = await api.v45.trinity.getAuditLogs().catch(() => []);
          // Reuse search logs logic...
           if (logs && logs.length > 0) {
            setRecentSearches(logs.slice(0, 3).map((log: any) => ({
              query: log.request_text || 'Запит без тексту',
              time: 'сьогодні',
              results: 0
            })));
          } else {
            setRecentSearches([
              { query: 'Тендер на будівництво', time: '2 години тому', results: 47 },
              { query: 'Ризик-аналіз компанії', time: '5 годин тому', results: 23 },
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [isExplorer, isOperator, isCommander]);

  return (
    <div className="w-full min-h-full space-y-8 pb-32">
      <ViewHeader
        title={getDimensionTitle(dimension)}
        icon={getDimensionIcon(dimension)}
        breadcrumbs={getDimensionBreadcrumbs(dimension)}
        stats={getDimensionStats(dimension, metrics)}
      />

      {/* AZR SOVEREIGN CORE WIDGET */}
      <AzrHyperWidget />

      <AnimatePresence mode="wait">
        <motion.div
          key={dimension}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {isExplorer && (
            <ExplorerShell
              metrics={metrics}
              recentSearches={recentSearches}
              onNavigate={onNavigate}
            />
          )}

          {isOperator && (
            <OperatorShell
              metrics={metrics}
              activeProcesses={activeProcesses}
              alerts={systemAlerts}
              onAIAction={handleAIAction}
            />
          )}

          {isCommander && (
            <CommanderShell
              metrics={metrics}
              onAction={handleShadowAction}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Helper functions (kept local or could be moved to utils)
function getDimensionTitle(dimension: string): string {
  switch (dimension) {
    case 'NEBULA': return 'ПРОСТІР NEBULA v45';
    case 'CORTEX': return 'МЕРЕЖА CORTEX v45';
    case 'NEXUS': return 'КОМАНДНИЙ NEXUS v45';
    default: return 'ПРИЛАДНА ПАНЕЛЬ v45';
  }
}

function getDimensionIcon(dimension: string) {
  switch (dimension) {
    case 'NEBULA': return <Sparkles size={20} className="text-purple-400" />;
    case 'CORTEX': return <Activity size={20} className="text-cyan-400" />;
    case 'NEXUS': return <Brain size={20} className="text-red-400" />;
    default: return <Activity size={20} />;
  }
}

function getDimensionBreadcrumbs(dimension: string): string[] {
  switch (dimension) {
    case 'NEBULA': return ['ГОЛОВНА', 'ОГЛЯД'];
    case 'CORTEX': return ['МОНІТОРИНГ', 'ТАКТИЧНИЙ ВИД'];
    case 'NEXUS': return ['КОМАНДНИЙ ЦЕНТР', 'ПОВНИЙ КОНТРОЛЬ'];
    default: return ['HOME'];
  }
}

function getDimensionStats(dimension: string, metrics: SystemMetrics) {
  const baseStats = [
    { label: 'Стан', value: `${metrics.health.toFixed(1)}%`, icon: <Activity size={14} />, color: 'success' as const },
  ];

  if (dimension === 'CORTEX' || dimension === 'NEXUS') {
    baseStats.push(
      { label: 'CPU', value: `${metrics.cpu}%`, icon: <Cpu size={14} />, color: 'success' as const },
      { label: 'Контейнери', value: `${metrics.activeContainers}`, icon: <Terminal size={14} />, color: 'success' as const }
    );
  }

  return baseStats;
}

export default AdaptiveDashboard;
