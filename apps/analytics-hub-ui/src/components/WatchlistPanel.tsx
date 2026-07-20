/**
 * WatchlistPanel — Панель безперервного моніторингу сутностей.
 *
 * Функції:
 * - Відображення списку об'єктів під спостереженням
 * - Badge з кількістю непрочитаних алертів
 * - Перегляд та фільтрація алертів за severity
 * - Додавання/видалення об'єктів зі спостереження
 * - Кольорова індикація ризику для кожного об'єкта
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Eye, Bell, AlertTriangle, ShieldAlert, Info, 
  Trash2, Plus, RefreshCw, CheckCircle, X,
  TrendingUp, Briefcase, Scale, Bitcoin, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../api';

interface WatchlistItem {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_name: string;
  frequency: string;
  is_active: boolean;
  last_scan_at: string | null;
  last_risk_score: number | null;
  notes: string;
  tags: string[];
  unread_alerts: number;
  created_at: string;
}

interface WatchlistAlert {
  id: string;
  watchlist_item_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  details: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
}

interface AlertStats {
  unread_total: number;
  critical_unread: number;
  high_unread: number;
  medium_unread: number;
  total: number;
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  critical: { color: '#ff4444', bg: 'rgba(255,68,68,0.15)', icon: <ShieldAlert size={16} />, label: 'Критичний' },
  high: { color: '#ff8c00', bg: 'rgba(255,140,0,0.15)', icon: <AlertTriangle size={16} />, label: 'Високий' },
  medium: { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', icon: <Bell size={16} />, label: 'Середній' },
  low: { color: '#00bfff', bg: 'rgba(0,191,255,0.15)', icon: <Info size={16} />, label: 'Низький' },
  info: { color: '#888', bg: 'rgba(136,136,136,0.15)', icon: <Info size={16} />, label: 'Інфо' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  risk_change: <TrendingUp size={14} />,
  sanctions_hit: <ShieldAlert size={14} />,
  new_court_case: <Scale size={14} />,
  tax_debt_change: <Briefcase size={14} />,
  blockchain_activity: <Bitcoin size={14} />,
  media_mention: <Globe size={14} />,
};

function getRiskColor(score: number | null): string {
  if (score === null) return '#555';
  if (score >= 80) return '#ff4444';
  if (score >= 60) return '#ff8c00';
  if (score >= 40) return '#ffd700';
  if (score >= 20) return '#00bfff';
  return '#00e676';
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Ще не скановано';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} хв тому`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} год тому`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} д тому`;
}

interface WatchlistPanelProps {
  onSelectEntity?: (entityId: string) => void;
}

export function WatchlistPanel({ onSelectEntity }: WatchlistPanelProps) {
  const [activeView, setActiveView] = useState<'watchlist' | 'alerts'>('watchlist');
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({ unread_total: 0, critical_unread: 0, high_unread: 0, medium_unread: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, alertsRes, statsRes] = await Promise.all([
        apiFetch('/api/v1/watchlist'),
        apiFetch(`/api/v1/watchlist/alerts?limit=50${severityFilter ? `&severity=${severityFilter}` : ''}`),
        apiFetch('/api/v1/watchlist/alerts/stats'),
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.warn('Watchlist fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [severityFilter]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Оновлення кожні 30с
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRemove = async (itemId: string) => {
    try {
      await apiFetch(`/api/v1/watchlist/${itemId}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (e) {
      console.error('Remove error:', e);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    try {
      await apiFetch(`/api/v1/watchlist/alerts/${alertId}/read`, { method: 'POST' });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      setStats(prev => ({ ...prev, unread_total: Math.max(0, prev.unread_total - 1) }));
    } catch (e) {
      console.error('Mark read error:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/v1/watchlist/alerts/read-all', { method: 'POST' });
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setStats(prev => ({ ...prev, unread_total: 0, critical_unread: 0, high_unread: 0, medium_unread: 0 }));
    } catch (e) {
      console.error('Mark all read error:', e);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(10,12,20,0.95)', color: '#e0e0e0',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Заголовок */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(20,25,40,0.9), rgba(30,35,55,0.9))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Eye size={20} style={{ color: '#00e5ff' }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Моніторинг</span>
          {stats.unread_total > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                background: stats.critical_unread > 0 ? '#ff4444' : '#ff8c00',
                color: '#fff', borderRadius: 10, padding: '2px 8px',
                fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center',
              }}
            >
              {stats.unread_total}
            </motion.span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setActiveView('watchlist')}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
              background: activeView === 'watchlist' ? 'rgba(0,229,255,0.2)' : 'transparent',
              color: activeView === 'watchlist' ? '#00e5ff' : '#888',
            }}
          >
            Об'єкти ({items.length})
          </button>
          <button
            onClick={() => setActiveView('alerts')}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, transition: 'all 0.2s',
              background: activeView === 'alerts' ? 'rgba(255,140,0,0.2)' : 'transparent',
              color: activeView === 'alerts' ? '#ff8c00' : '#888',
              position: 'relative',
            }}
          >
            Алерти
            {stats.unread_total > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#ff4444', borderRadius: '50%',
                width: 8, height: 8,
              }} />
            )}
          </button>
        </div>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <AnimatePresence mode="wait">
          {activeView === 'watchlist' ? (
            <motion.div
              key="watchlist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <Eye size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 14 }}>Список моніторингу порожній</p>
                  <p style={{ fontSize: 12, color: '#555' }}>
                    Додайте компанію або особу для безперервного спостереження
                  </p>
                </div>
              ) : (
                items.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8, padding: '12px 14px',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                    onClick={() => onSelectEntity?.(item.entity_id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{item.entity_name}</span>
                          {item.unread_alerts > 0 && (
                            <span style={{
                              background: '#ff4444', color: '#fff', borderRadius: 10,
                              padding: '1px 6px', fontSize: 10, fontWeight: 700,
                            }}>
                              {item.unread_alerts}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: '#888' }}>
                            {item.entity_type === 'company' ? '🏢' : item.entity_type === 'person' ? '👤' : '₿'}
                            {' '}{item.entity_id}
                          </span>
                          <span style={{ fontSize: 11, color: '#666' }}>
                            {formatTimeAgo(item.last_scan_at)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.last_risk_score !== null && (
                          <div style={{
                            background: getRiskColor(item.last_risk_score) + '22',
                            color: getRiskColor(item.last_risk_score),
                            borderRadius: 6, padding: '2px 8px',
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {Math.round(item.last_risk_score)}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: '#666', padding: 4,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {/* Severity фільтри */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                {['critical', 'high', 'medium', 'low'].map(sev => {
                  const conf = SEVERITY_CONFIG[sev];
                  return (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(severityFilter === sev ? null : sev)}
                      style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 11,
                        border: `1px solid ${severityFilter === sev ? conf.color : 'rgba(255,255,255,0.1)'}`,
                        background: severityFilter === sev ? conf.bg : 'transparent',
                        color: severityFilter === sev ? conf.color : '#888',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {conf.label}
                    </button>
                  );
                })}
                {stats.unread_total > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      marginLeft: 'auto', padding: '4px 10px', borderRadius: 12,
                      fontSize: 11, border: '1px solid rgba(0,229,255,0.3)',
                      background: 'transparent', color: '#00e5ff', cursor: 'pointer',
                    }}
                  >
                    <CheckCircle size={12} style={{ marginRight: 4 }} />
                    Прочитати всі
                  </button>
                )}
              </div>

              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <Bell size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ fontSize: 14 }}>Алертів немає</p>
                  <p style={{ fontSize: 12, color: '#555' }}>
                    Алерти з'являться автоматично при виявленні змін
                  </p>
                </div>
              ) : (
                alerts.map(alert => {
                  const sevConf = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        background: alert.is_read ? 'rgba(255,255,255,0.02)' : sevConf.bg,
                        border: `1px solid ${alert.is_read ? 'rgba(255,255,255,0.05)' : sevConf.color + '33'}`,
                        borderLeft: `3px solid ${sevConf.color}`,
                        borderRadius: 8, padding: '12px 14px',
                        opacity: alert.is_read ? 0.6 : 1,
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      whileHover={{ opacity: 1 }}
                      onClick={() => {
                        if (!alert.is_read) handleMarkRead(alert.id);
                        onSelectEntity?.(alert.entity_id);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ color: sevConf.color }}>{sevConf.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{alert.title}</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, margin: 0 }}>
                            {alert.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                            <span style={{ fontSize: 10, color: '#666' }}>
                              {new Date(alert.created_at).toLocaleString('uk-UA')}
                            </span>
                            <span style={{
                              fontSize: 10, color: '#888',
                              background: 'rgba(255,255,255,0.05)',
                              padding: '1px 6px', borderRadius: 4,
                            }}>
                              {alert.entity_name}
                            </span>
                          </div>
                        </div>
                        {!alert.is_read && (
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: sevConf.color, flexShrink: 0, marginTop: 4,
                          }} />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WatchlistPanel;
