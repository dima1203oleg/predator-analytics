/**
 * AI Activity Logs Component v45.0
 *
 * Real-time AI activity and system logs display.
 * Features:
 * - Live log streaming
 * - Log filtering by type/agent
 * - Search functionality
 * - Export capability
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, RefreshCw, Filter, AlertCircle, CheckCircle, Info, Zap } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success' | 'debug';
  source: string;
  agent?: string;
  message: string;
  metadata?: Record<string, any>;
}

interface AIActivityLogsProps {
  maxLogs?: number;
  autoScroll?: boolean;
}

export const AIActivityLogs: React.FC<AIActivityLogsProps> = ({
  maxLogs = 100,
  autoScroll = true
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to AI Stream WebSocket
  useEffect(() => {
    if (isPaused) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v45/ws/ai/stream`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        addLog({
          id: `sys-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'success',
          source: 'system',
          message: 'Підключено до AI Stream WebSocket'
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'health_update') {
            addLog({
              id: `health-${Date.now()}`,
              timestamp: data.timestamp,
              level: data.health === 'critical' ? 'error' : data.health === 'degraded' ? 'warning' : 'info',
              source: 'health',
              message: `Health Status: ${data.health?.toUpperCase()}`,
              metadata: { agents: data.agents, metrics: data.metrics }
            });
          } else if (data.type === 'agent_action') {
            addLog({
              id: `agent-${Date.now()}`,
              timestamp: data.timestamp,
              level: 'info',
              source: 'agent',
              agent: data.agent,
              message: `${data.agent}: ${data.action}`,
              metadata: data
            });
          } else if (data.type === 'error') {
            addLog({
              id: `error-${Date.now()}`,
              timestamp: data.timestamp,
              level: 'error',
              source: 'system',
              message: data.message
            });
          }
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      wsRef.current.onerror = () => {
        addLog({
          id: `err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          source: 'system',
          message: 'WebSocket помилка з\'єднання'
        });
      };

      wsRef.current.onclose = () => {
        addLog({
          id: `close-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'warning',
          source: 'system',
          message: 'WebSocket з\'єднання закрито'
        });
      };

    } catch (e) {
      console.error('Failed to connect to WS:', e);
    }

    return () => {
      wsRef.current?.close();
    };
  }, [isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isPaused]);

  const addLog = (log: LogEntry) => {
    setLogs(prev => {
      const newLogs = [...prev, log];
      return newLogs.slice(-maxLogs);
    });
  };

  // Add demo logs for testing
  useEffect(() => {
    const demoLogs: LogEntry[] = [
      { id: '1', timestamp: new Date().toISOString(), level: 'info', source: 'orchestrator', message: 'SuperIntelligence Orchestrator ініціалізовано' },
      { id: '2', timestamp: new Date().toISOString(), level: 'success', source: 'agent', agent: 'SIGINT', message: 'SIGINT агент готовий до роботи' },
      { id: '3', timestamp: new Date().toISOString(), level: 'success', source: 'agent', agent: 'HUMINT', message: 'HUMINT агент готовий до роботи' },
      { id: '4', timestamp: new Date().toISOString(), level: 'success', source: 'agent', agent: 'TECHINT', message: 'TECHINT агент готовий до роботи' },
      { id: '5', timestamp: new Date().toISOString(), level: 'success', source: 'agent', agent: 'CYBINT', message: 'CYBINT агент готовий до роботи' },
      { id: '6', timestamp: new Date().toISOString(), level: 'success', source: 'agent', agent: 'OSINT', message: 'OSINT агент готовий до роботи' },
      { id: '7', timestamp: new Date().toISOString(), level: 'info', source: 'llm', message: 'LLM Router підключено (Groq → Gemini → Ollama)' },
      { id: '8', timestamp: new Date().toISOString(), level: 'info', source: 'healing', message: 'Self-Healing Controller активовано' },
    ];
    setLogs(demoLogs);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle size={14} className="text-red-400" />;
      case 'warning': return <AlertCircle size={14} className="text-yellow-400" />;
      case 'success': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'debug': return <Zap size={14} className="text-purple-400" />;
      default: return <Info size={14} className="text-blue-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'border-l-red-500 bg-red-500/5';
      case 'warning': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'success': return 'border-l-emerald-500 bg-emerald-500/5';
      case 'debug': return 'border-l-purple-500 bg-purple-500/5';
      default: return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  const exportLogs = () => {
    const content = filteredLogs.map(log =>
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700  h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="font-semibold text-lg">AI Activity Logs</h3>
            <p className="text-slate-400 text-sm">{filteredLogs.length} записів</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук..."
              className="pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-48"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">Всі</option>
            <option value="info">Info</option>
            <option value="success">Успіх</option>
            <option value="warning">Warning</option>
            <option value="error">Помилка</option>
            <option value="debug">Debug</option>
          </select>

          {/* Pause/Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg transition-colors ${
              isPaused
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
            }`}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>

          {/* Export */}
          <button
            onClick={exportLogs}
            className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 transition-colors"
            title="Export logs"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
        <AnimatePresence initial={false}>
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 rounded-lg border-l-4 ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start gap-3">
                {getLevelIcon(log.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-slate-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString('uk-UA')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-400 uppercase">
                      {log.source}
                    </span>
                    {log.agent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
                        {log.agent}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-200 break-words">{log.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>

      {/* Footer Status */}
      <div className="p-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>
          {isPaused ? '⏸️ Призупинено' : '🟢 Live streaming'}
        </span>
        <span>
          Max: {maxLogs} logs
        </span>
      </div>
    </div>
  );
};

export default AIActivityLogs;
