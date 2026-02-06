import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RedButton } from './RedButton';

/**
 * ═══════════════════════════════════════════════════════════════
 * SOM DASHBOARD - Sovereign Observer Module Monitor
 * Predator Analytics v28-S
 *
 * Центральна панель моніторингу конституційного гіпервізора
 * ═══════════════════════════════════════════════════════════════
 */

interface Anomaly {
  id: string;
  type: string;
  component_id: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  description: string;
  detected_at: string;
  auto_remediation_eligible: boolean;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  ring_level: 'inner' | 'middle' | 'outer';
  status: string;
  risk_score: number;
  created_at: string;
}

interface SOMStatus {
  active: boolean;
  operational: boolean;
  ring_level: string;
  emergency_level: number | null;
  pending_proposals: number;
  total_anomalies: number;
  last_analysis: string | null;
  uptime_seconds: number;
  analysis_count: number;
}

interface ComponentHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, number>;
}

const API_BASE = '/api/v1/som';

const severityColors = {
  info: '#3b82f6',
  warning: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const ringColors = {
  inner: '#22c55e',
  middle: '#f59e0b',
  outer: '#ef4444',
};

export const SOMDashboard: React.FC = () => {
  const [status, setStatus] = useState<SOMStatus | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [components, setComponents] = useState<ComponentHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, anomaliesRes, proposalsRes, topologyRes] = await Promise.all([
        fetch(`${API_BASE}/status`),
        fetch(`${API_BASE}/anomalies?limit=10`),
        fetch(`${API_BASE}/proposals?status=pending`),
        fetch(`${API_BASE}/topology`),
      ]);

      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }
      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalies(data.anomalies || []);
      }
      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        setProposals(data.proposals || []);
      }
      if (topologyRes.ok) {
        const data = await topologyRes.json();
        setComponents(data.nodes || []);
      }

      setError(null);
    } catch (err) {
      setError('Помилка підключення до SOM');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleEmergencyActivate = async (level: 1 | 2 | 3, code: string) => {
    const response = await fetch(`${API_BASE}/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        confirmation_code: code,
        operator_id: 'admin',
      }),
    });
    if (response.ok) {
      await fetchData();
    }
  };

  const handleEmergencyDeactivate = async () => {
    const response = await fetch(`${API_BASE}/emergency?operator_id=admin`, {
      method: 'DELETE',
    });
    if (response.ok) {
      await fetchData();
    }
  };

  const triggerAnalysis = async () => {
    await fetch(`${API_BASE}/analyze`, { method: 'POST' });
    await fetchData();
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}г ${mins}хв`;
  };

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        ⏳ Завантаження SOM Dashboard...
      </div>
    );
  }

  return (
    <div className="som-dashboard">
      <style>{`
        .som-dashboard {
          padding: 24px;
          background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
          min-height: 100vh;
          color: #f8fafc;
        }

        .som-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .som-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .som-title h1 {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .som-title .version {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 24px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge.operational {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-badge.emergency {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .som-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .som-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .som-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .som-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .metric-item {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 12px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #f8fafc;
        }

        .metric-label {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .anomaly-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .anomaly-item {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 3px solid;
        }

        .anomaly-icon {
          font-size: 20px;
        }

        .anomaly-info {
          flex: 1;
        }

        .anomaly-info h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #f8fafc;
        }

        .anomaly-info p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #94a3b8;
        }

        .proposal-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .proposal-item {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 12px;
          border-left: 3px solid;
        }

        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .proposal-title {
          font-size: 14px;
          font-weight: 600;
          color: #f8fafc;
        }

        .ring-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .proposal-description {
          font-size: 13px;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .proposal-actions {
          display: flex;
          gap: 8px;
        }

        .proposal-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .proposal-btn.approve {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .proposal-btn.approve:hover {
          background: #22c55e;
          color: white;
        }

        .proposal-btn.reject {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .proposal-btn.reject:hover {
          background: #ef4444;
          color: white;
        }

        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        .component-item {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 10px;
          text-align: center;
        }

        .component-status {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 6px;
        }

        .component-status.healthy { background: #22c55e; }
        .component-status.degraded { background: #f59e0b; }
        .component-status.unhealthy { background: #ef4444; }

        .component-name {
          font-size: 13px;
          color: #f8fafc;
          margin-top: 8px;
        }

        .analyze-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .analyze-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .red-button-section {
          margin-top: 24px;
        }
      `}</style>

      {/* Header */}
      <div className="som-header">
        <div className="som-title">
          <span style={{ fontSize: 36 }}>🏛️</span>
          <div>
            <h1>Sovereign Observer Module</h1>
            <span className="version">v28.0-S</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="analyze-btn" onClick={triggerAnalysis}>
            🔍 Запустити аналіз
          </button>

          {status && (
            <div className={`status-badge ${status.emergency_level ? 'emergency' : 'operational'}`}>
              {status.emergency_level ? (
                <>🚨 ЕКСТРЕНИЙ РЕЖИМ</>
              ) : (
                <>{status.operational ? '✅ Операційний' : '⚠️ Деградований'}</>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, marginBottom: 20, color: '#fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Metrics */}
      <div className="som-grid">
        <motion.div className="som-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="som-card-header">
            <div className="som-card-title">📊 Метрики системи</div>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value">{status?.analysis_count || 0}</div>
              <div className="metric-label">Аналізів виконано</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{status?.total_anomalies || 0}</div>
              <div className="metric-label">Аномалій виявлено</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{status?.pending_proposals || 0}</div>
              <div className="metric-label">Очікують схвалення</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{status ? formatUptime(status.uptime_seconds) : '-'}</div>
              <div className="metric-label">Час роботи</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="som-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="som-card-header">
            <div className="som-card-title">🔧 Компоненти</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {components.filter(c => c.status === 'healthy').length}/{components.length} healthy
            </div>
          </div>
          <div className="component-grid">
            {components.map(comp => (
              <div key={comp.id} className="component-item">
                <span className={`component-status ${comp.status}`}></span>
                <div className="component-name">{comp.name}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="som-grid">
        {/* Anomalies */}
        <motion.div
          className="som-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="som-card-header">
            <div className="som-card-title">⚠️ Аномалії</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {anomalies.filter(a => a.severity === 'critical').length} критичних
            </div>
          </div>
          <div className="anomaly-list">
            {anomalies.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                ✅ Аномалій не виявлено
              </div>
            ) : (
              anomalies.map(anomaly => (
                <div
                  key={anomaly.id}
                  className="anomaly-item"
                  style={{ borderColor: severityColors[anomaly.severity] }}
                >
                  <span className="anomaly-icon">
                    {anomaly.severity === 'critical' ? '🔴' :
                     anomaly.severity === 'high' ? '🟠' :
                     anomaly.severity === 'warning' ? '🟡' : '🔵'}
                  </span>
                  <div className="anomaly-info">
                    <h4>{anomaly.type}</h4>
                    <p>{anomaly.description}</p>
                  </div>
                  {anomaly.auto_remediation_eligible && (
                    <span style={{ fontSize: 12, color: '#22c55e' }}>🔄 Auto-fix</span>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Proposals */}
        <motion.div
          className="som-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="som-card-header">
            <div className="som-card-title">📋 Пропозиції</div>
          </div>
          <div className="proposal-list">
            {proposals.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                Немає очікуючих пропозицій
              </div>
            ) : (
              proposals.map(proposal => (
                <div
                  key={proposal.id}
                  className="proposal-item"
                  style={{ borderColor: ringColors[proposal.ring_level] }}
                >
                  <div className="proposal-header">
                    <span className="proposal-title">{proposal.title}</span>
                    <span
                      className="ring-badge"
                      style={{
                        background: `${ringColors[proposal.ring_level]}20`,
                        color: ringColors[proposal.ring_level]
                      }}
                    >
                      {proposal.ring_level} ring
                    </span>
                  </div>
                  <div className="proposal-description">{proposal.description}</div>
                  <div className="proposal-actions">
                    <button className="proposal-btn approve">✓ Схвалити</button>
                    <button className="proposal-btn reject">✗ Відхилити</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Red Button Section */}
      <div className="red-button-section">
        <RedButton
          onActivate={handleEmergencyActivate}
          onDeactivate={handleEmergencyDeactivate}
          currentEmergencyLevel={status?.emergency_level || null}
        />
      </div>
    </div>
  );
};

export default SOMDashboard;
