/**
 * 🔴 Real-time Event Monitor
 * Live feed від Kafka + WebSocket streaming
 * Показує реальні оновлення компаній у real-time
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Zap, Filter, Pause, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface RealTimeEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'updated' | 'deleted' | 'status_changed';
  company: {
    name: string;
    ueid: string;
    region: string;
  };
  changes?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
}

interface EventFilter {
  type: 'all' | 'created' | 'updated' | 'deleted' | 'status_changed';
  severity: 'all' | 'info' | 'warning' | 'critical';
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export const RealTimeMonitor: React.FC = () => {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<EventFilter>({
    type: 'all',
    severity: 'all'
  });
  const [eventCount, setEventCount] = useState({ total: 0, active: 0 });

  // ──────────────────────────────────────────────────────────────
  // WebSocket Connection
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/api/v1/stream/realtime');

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newEvent: RealTimeEvent = {
              id: data.id || Date.now().toString(),
              timestamp: new Date().toISOString(),
              type: data.type || 'updated',
              company: data.company || { name: 'Unknown', ueid: '', region: '' },
              changes: data.changes,
              severity: determineSeverity(data.type, data.changes)
            };

            if (!isPaused) {
              setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
              setEventCount((prev) => ({
                ...prev,
                total: prev.total + 1
              }));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('❌ WebSocket disconnected');
          setIsConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        return ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        return null;
      }
    };

    const ws = connectWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, [isPaused]);

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────

  const determineSeverity = (type: string, changes?: Record<string, any>) => {
    if (type === 'deleted') return 'critical';
    if (type === 'status_changed') return 'warning';
    if (changes?.['status'] === 'liquidated') return 'critical';
    return 'info';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return '✨';
      case 'updated':
        return '🔄';
      case 'deleted':
        return '🔴';
      case 'status_changed':
        return '⚠️';
      default:
        return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'from-red-900 to-red-800 border-red-700';
      case 'warning':
        return 'from-yellow-900 to-yellow-800 border-yellow-700';
      default:
        return 'from-blue-900 to-blue-800 border-blue-700';
    }
  };

  const filterEvents = () => {
    return events.filter((event) => {
      if (filter.type !== 'all' && event.type !== filter.type) return false;
      if (filter.severity !== 'all' && event.severity !== filter.severity) return false;
      return true;
    });
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  const filteredEvents = filterEvents();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          🔴 Real-time Monitoring
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
        </h1>
        <p className="text-gray-400">
          Live event stream від CERS реєстру (останні 100 подій)
        </p>
      </div>

      {/* Status Card */}
      <Card variant="highlight" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Статус з'єднання</p>
            <p className="text-2xl font-bold text-white flex items-center gap-2">
              {isConnected ? (
                <>
                  <span className="text-green-400">✅</span> Connected
                </>
              ) : (
                <>
                  <span className="text-red-400">❌</span> Disconnected
                </>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Всього подій</p>
            <p className="text-2xl font-bold text-indigo-400">{eventCount.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Активних подій</p>
            <p className="text-2xl font-bold text-blue-400">{filteredEvents.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Статус</p>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${
                isPaused
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPaused ? (
                <>
                  <Play size={18} /> Resume
                </>
              ) : (
                <>
                  <Pause size={18} /> Pause
                </>
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Filter size={20} /> Фільтри
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Тип подіі</label>
            <select
              value={filter.type}
              onChange={(e) =>
                setFilter({ ...filter, type: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="all">Усі типи</option>
              <option value="created">✨ Created</option>
              <option value="updated">🔄 Updated</option>
              <option value="deleted">🔴 Deleted</option>
              <option value="status_changed">⚠️ Status Changed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Важливість</label>
            <select
              value={filter.severity}
              onChange={(e) =>
                setFilter({ ...filter, severity: e.target.value as any })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            >
              <option value="all">Усі рівні</option>
              <option value="info">ℹ️ Info</option>
              <option value="warning">⚠️ Warning</option>
              <option value="critical">🔴 Critical</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Events Feed */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <Zap className="mx-auto mb-3 text-gray-500" size={32} />
            <p className="text-gray-400">Немає подій для відображення</p>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card
              key={event.id}
              variant="default"
              className={`p-4 bg-gradient-to-r ${getSeverityColor(event.severity)}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl pt-1">{getEventIcon(event.type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{event.company.name}</h3>
                      <p className="text-sm text-gray-300">{event.company.ueid}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-300">
                        {new Date(event.timestamp).toLocaleTimeString('uk-UA')}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-200">
                      <span className="font-bold">Тип:</span> {event.type}
                    </p>
                    <p className="text-sm text-gray-200">
                      <span className="font-bold">Регіон:</span> {event.company.region}
                    </p>

                    {event.changes && Object.keys(event.changes).length > 0 && (
                      <div className="mt-2 p-2 bg-black/30 rounded">
                        <p className="text-xs font-bold text-gray-300 mb-1">Змінено:</p>
                        {Object.entries(event.changes).map(([key, value]) => (
                          <p key={key} className="text-xs text-gray-200">
                            • <span className="font-mono">{key}</span>: {String(value)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="text-2xl">
                  {event.severity === 'critical' ? (
                    <span className="text-red-400">🔴</span>
                  ) : event.severity === 'warning' ? (
                    <span className="text-yellow-400">⚠️</span>
                  ) : (
                    <span className="text-blue-400">ℹ️</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Alert
          type="warning"
          title="⚠️ Немає з'єднання"
          message="WebSocket відключено. Спроба переконнекту кожні 3 секунди..."
        />
      )}
    </div>
  );
};

export default RealTimeMonitor;

