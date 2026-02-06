/**
 * OpenSearch Dashboards Embedded Component
 *
 * Інтегрує OpenSearch Dashboards безпосередньо в UI платформи
 * для аналітики метрик запитів, латенсі, помилок.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  AlertTriangle,
  Activity,
  Search,
  Clock
} from 'lucide-react';

interface OpenSearchDashboardsEmbedProps {
  dashboardId?: string;
  height?: number;
  title?: string;
  showHeader?: boolean;
}

const DASHBOARDS_BASE_URL = '/opensearch-dashboards';

// Predefined dashboard IDs
const DASHBOARDS = {
  SEARCH_ANALYTICS: 'search-analytics',
  SYSTEM_METRICS: 'system-metrics',
  ERROR_LOGS: 'error-logs',
  LATENCY_OVERVIEW: 'latency-overview',
  CUSTOM: 'custom'
};

export const OpenSearchDashboardsEmbed: React.FC<OpenSearchDashboardsEmbedProps> = ({
  dashboardId = DASHBOARDS.SEARCH_ANALYTICS,
  height = 600,
  title = 'Аналітика OpenSearch',
  showHeader = true
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const dashboardUrl = `${DASHBOARDS_BASE_URL}/app/dashboards#/view/${dashboardId}?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))`;

  useEffect(() => {
    // Check if OpenSearch Dashboards is accessible
    const checkDashboards = async () => {
      try {
        const response = await fetch(`${DASHBOARDS_BASE_URL}/api/status`, {
          method: 'GET',
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('OpenSearch Dashboards недоступний');
        }
        setError(null);
      } catch (err) {
        setError('OpenSearch Dashboards недоступний. Перевірте підключення.');
      } finally {
        setIsLoading(false);
      }
    };

    checkDashboards();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    // Force iframe reload
    const iframe = document.getElementById('opensearch-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const openInNewTab = () => {
    window.open(dashboardUrl.replace('embed=true&', ''), '_blank');
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[var(--bg-primary)]'
    : 'relative';

  return (
    <motion.div
      className={`${containerClass} rounded-xl  border border-[var(--border-primary)]`}
      layout
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-[var(--text-primary)]">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Clock className="w-3 h-3" />
                <span>Оновлено: {lastRefresh.toLocaleTimeString('uk-UA')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dashboard Selector */}
            <select
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm border border-[var(--border-secondary)]"
              defaultValue={dashboardId}
            >
              <option value={DASHBOARDS.SEARCH_ANALYTICS}>📊 Аналітика Пошуку</option>
              <option value={DASHBOARDS.SYSTEM_METRICS}>📈 Метрики Системи</option>
              <option value={DASHBOARDS.ERROR_LOGS}>⚠️ Журнал Помилок</option>
              <option value={DASHBOARDS.LATENCY_OVERVIEW}>⏱️ Затримки</option>
            </select>

            {/* Actions */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="Оновити"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFullscreen}
              className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title={isFullscreen ? 'Згорнути' : 'На весь екран'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openInNewTab}
              className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="Відкрити в новій вкладці"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ height: isFullscreen ? 'calc(100vh - 60px)' : height }} className="relative">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)] gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-[var(--text-secondary)] text-center max-w-md">
                {error}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium"
              >
                Спробувати знову
              </motion.button>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-secondary)] gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
                <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-500" />
              </div>
              <p className="text-[var(--text-secondary)]">Завантаження аналітики...</p>
            </motion.div>
          ) : (
            <motion.iframe
              id="opensearch-iframe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={dashboardUrl}
              className="w-full h-full border-0"
              title="OpenSearch Dashboards"
              onLoad={() => setIsLoading(false)}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Search className="w-3 h-3" />
            <span>Запитів сьогодні: <strong className="text-[var(--text-primary)]">1,234</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Avg Latency: <strong className="text-green-500">45ms</strong></span>
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Помилок: <strong className="text-orange-500">0.02%</strong></span>
          </span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          Powered by OpenSearch Dashboards
        </span>
      </div>
    </motion.div>
  );
};

export default OpenSearchDashboardsEmbed;
