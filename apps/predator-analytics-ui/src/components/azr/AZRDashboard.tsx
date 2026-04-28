/**
 *   AZR v32 Dashboard Widget
 * Real-time monitoring for Sovereign Autonomous Response Engine
 *
 * Features:
 * - Health score visualization
 * - OODA cycle status
 * - Experience memory stats
 * - Anomaly detection alerts
 * - Chaos engineering status
 */

import React, { useEffect, useState, useCallback } from 'react';
import './AZRDashboard.css';

interface HealthBreakdown {
  cpu: number;
  memory: number;
  disk: number;
  api: number;
  db: number;
  ai: number;
}

interface ExperienceStats {
  total_experiences: number;
  blacklisted_actions: number;
  success_patterns: Record<string, number>;
  failure_patterns: Record<string, number>;
}

interface Anomaly {
  metric: string;
  current_value: number;
  expected_range: [number, number];
  z_score: number;
  severity: 'high' | 'medium';
}

interface AZRStatus {
  engine: string;
  engine_version: string;
  is_running: boolean;
  is_frozen: boolean;
  cycle_count: number;
  health_score: number;
  health_details: HealthBreakdown;
  metrics: {
    total_executed: number;
    total_blocked: number;
    total_rollbacks: number;
    constitutional_violations: number;
  };
  experience: ExperienceStats;
  capabilities: string[];
  status_emoji: string;
  message_uk: string;
  risk_level: string;
}

interface AnomalyStatus {
  anomalies: Anomaly[];
  trends: Record<string, string>;
  history_size: number;
}

const API_BASE = '/api/azr';

export const AZRDashboard: React.FC = () => {
  const [status, setStatus] = useState<AZRStatus | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'health' | 'experience' | 'chaos'>('overview');

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, anomalyRes] = await Promise.all([
        fetch(`${API_BASE}/status`),
        fetch(`${API_BASE}/anomalies`)
      ]);

      if (!statusRes.ok) throw new Error('Failed to fetch AZR status');

      const statusData = await statusRes.json();
      setStatus(statusData);

      if (anomalyRes.ok) {
        const anomalyData = await anomalyRes.json();
        setAnomalies(anomalyData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFreeze = async () => {
    if (!confirm(' ️ Зупинити AZR Engine? Це заморозить всі автономні процеси.')) return;

    try {
      const res = await fetch(`${API_BASE}/freeze`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Freeze failed:', err);
    }
  };

  const handleUnfreeze = async () => {
    try {
      const res = await fetch(`${API_BASE}/unfreeze`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Unfreeze failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="azr-dashboard azr-loading">
        <div className="azr-spinner" />
        <span>Завантаження AZR v32...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="azr-dashboard azr-error">
        <span className="azr-error-icon">❌</span>
        <span>{error}</span>
        <button onClick={fetchData}>Повторити</button>
      </div>
    );
  }

  if (!status) return null;

  const healthPercent = Math.round(status.health_score);
  const healthColor = healthPercent > 80 ? '#10b981' : healthPercent > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="azr-dashboard">
      {/* Header */}
      <div className="azr-header">
        <div className="azr-title">
          <span className="azr-icon"> </span>
          <div>
            <h2>AZR Engine {status.engine_version}</h2>
            <span className="azr-status-badge" data-running={status.is_running} data-frozen={status.is_frozen}>
              {status.status_emoji} {status.message_uk}
            </span>
          </div>
        </div>

        <div className="azr-controls">
          {status.is_frozen ? (
            <button className="azr-btn azr-btn-unfreeze" onClick={handleUnfreeze}>
              ♻️  озморозити
            </button>
          ) : (
            <button className="azr-btn azr-btn-freeze" onClick={handleFreeze}>
              🛑 Заморозити
            </button>
          )}
        </div>
      </div>

      {/* Health Score Ring */}
      <div className="azr-health-section">
        <div className="azr-health-ring" style={{ '--health-color': healthColor, '--health-percent': healthPercent } as React.CSSProperties}>
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="azr-ring-bg" />
            <circle
              cx="50" cy="50" r="45"
              className="azr-ring-progress"
              strokeDasharray={`${healthPercent * 2.83} ${283}`}
            />
          </svg>
          <div className="azr-health-value">
            <span className="azr-health-number">{healthPercent}</span>
            <span className="azr-health-label">Health</span>
          </div>
        </div>

        <div className="azr-metrics-grid">
          <div className="azr-metric">
            <span className="azr-metric-value">{status.cycle_count}</span>
            <span className="azr-metric-label">Циклів</span>
          </div>
          <div className="azr-metric">
            <span className="azr-metric-value">{status.metrics.total_executed}</span>
            <span className="azr-metric-label">Виконано</span>
          </div>
          <div className="azr-metric">
            <span className="azr-metric-value">{status.metrics.total_blocked}</span>
            <span className="azr-metric-label">Заблоковано</span>
          </div>
          <div className="azr-metric">
            <span className="azr-metric-value">{status.metrics.total_rollbacks}</span>
            <span className="azr-metric-label">Відкатів</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="azr-tabs">
        <button
          className={`azr-tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          📊 Огляд
        </button>
        <button
          className={`azr-tab ${selectedTab === 'health' ? 'active' : ''}`}
          onClick={() => setSelectedTab('health')}
        >
          💊 Здоров'я
        </button>
        <button
          className={`azr-tab ${selectedTab === 'experience' ? 'active' : ''}`}
          onClick={() => setSelectedTab('experience')}
        >
          📚 Досвід
        </button>
        <button
          className={`azr-tab ${selectedTab === 'chaos' ? 'active' : ''}`}
          onClick={() => setSelectedTab('chaos')}
        >
          🎲 Хаос
        </button>
      </div>

      {/* Tab Content */}
      <div className="azr-tab-content">
        {selectedTab === 'overview' && (
          <div className="azr-overview">
            {/* Capabilities */}
            <div className="azr-capabilities">
              <h4>⚡ Можливості</h4>
              <div className="azr-capability-list">
                {status.capabilities.map((cap, idx) => (
                  <span key={idx} className="azr-capability-badge">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Anomalies Alert */}
            {anomalies && anomalies.anomalies.length > 0 && (
              <div className="azr-anomalies-alert">
                <h4> ️ Виявлені Аномалії</h4>
                {anomalies.anomalies.map((anomaly, idx) => (
                  <div key={idx} className={`azr-anomaly-item azr-severity-${anomaly.severity}`}>
                    <span className="azr-anomaly-metric">{anomaly.metric}</span>
                    <span className="azr-anomaly-value">{anomaly.current_value.toFixed(1)}</span>
                    <span className="azr-anomaly-zscore">Z: {anomaly.z_score.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trends */}
            {anomalies && Object.keys(anomalies.trends).length > 0 && (
              <div className="azr-trends">
                <h4>📈 Тренди</h4>
                <div className="azr-trend-list">
                  {Object.entries(anomalies.trends).map(([metric, trend]) => (
                    <div key={metric} className="azr-trend-item">
                      <span className="azr-trend-metric">{metric}</span>
                      <span className={`azr-trend-direction azr-trend-${trend.toLowerCase()}`}>
                        {trend === 'INCREASING' ? '📈' : trend === 'DECREASING' ? '📉' : '➡️'}
                        {trend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'health' && (
          <div className="azr-health-details">
            {Object.entries(status.health_details).map(([key, value]) => (
              <div key={key} className="azr-health-bar-container">
                <div className="azr-health-bar-label">
                  <span className="azr-health-bar-name">
                    {key === 'cpu' ? '🖥️ CPU' :
                     key === 'memory' ? '💾 Memory' :
                     key === 'disk' ? '💿 Disk' :
                     key === 'api' ? '🌐 API' :
                     key === 'db' ? '🗄️ Database' :
                     key === 'ai' ? '🤖 AI Models' : key}
                  </span>
                  <span className="azr-health-bar-value">{Math.round(value)}%</span>
                </div>
                <div className="azr-health-bar">
                  <div
                    className="azr-health-bar-fill"
                    style={{
                      width: `${value}%`,
                      backgroundColor: value > 80 ? '#10b981' : value > 50 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTab === 'experience' && (
          <div className="azr-experience">
            <div className="azr-experience-stats">
              <div className="azr-exp-stat">
                <span className="azr-exp-value">{status.experience.total_experiences}</span>
                <span className="azr-exp-label">Записів досвіду</span>
              </div>
              <div className="azr-exp-stat">
                <span className="azr-exp-value">{status.experience.blacklisted_actions}</span>
                <span className="azr-exp-label">Заблоковано назавжди</span>
              </div>
            </div>

            {Object.keys(status.experience.success_patterns).length > 0 && (
              <div className="azr-patterns">
                <h4>✅ Успішні Патерни</h4>
                <div className="azr-pattern-list">
                  {Object.entries(status.experience.success_patterns).map(([pattern, count]) => (
                    <div key={pattern} className="azr-pattern-item azr-pattern-success">
                      <span>{pattern}</span>
                      <span className="azr-pattern-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(status.experience.failure_patterns).length > 0 && (
              <div className="azr-patterns">
                <h4>❌ Невдалі Патерни</h4>
                <div className="azr-pattern-list">
                  {Object.entries(status.experience.failure_patterns).map(([pattern, count]) => (
                    <div key={pattern} className="azr-pattern-item azr-pattern-failure">
                      <span>{pattern}</span>
                      <span className="azr-pattern-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'chaos' && (
          <div className="azr-chaos">
            <div className="azr-chaos-status">
              <span className="azr-chaos-icon">🎲</span>
              <div className="azr-chaos-info">
                <h4>Chaos Engineering</h4>
                <p>Тестування відмовостійкості шляхом ін'єкції контрольованих збоїв</p>
              </div>
            </div>

            <div className="azr-chaos-controls">
              <button className="azr-btn azr-btn-chaos" onClick={() => fetch(`${API_BASE}/chaos/enable`, { method: 'POST' })}>
                ⚡ Увімкнути
              </button>
              <button className="azr-btn azr-btn-chaos-off" onClick={() => fetch(`${API_BASE}/chaos/disable`, { method: 'POST' })}>
                🛡️ Вимкнути
              </button>
            </div>

            <div className="azr-chaos-scenarios">
              <h4>Доступні сценарії:</h4>
              <ul>
                <li>💻 CPU Spike - Симуляція високого навантаження</li>
                <li>💾 Memory Pressure - Тиск на пам'ять</li>
                <li>🌐 Network Latency - Затримка мережі 500ms</li>
                <li>🗄️ DB Timeout - Таймаут бази даних</li>
                <li> ️ API Error - Випадкові помилки API</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="azr-footer">
        <span className="azr-risk"> івень ризику: {status.risk_level}</span>
        <span className="azr-violations">
          ⚖️ Порушень Конституції: {status.metrics.constitutional_violations}
        </span>
      </div>
    </div>
  );
};

export default AZRDashboard;
