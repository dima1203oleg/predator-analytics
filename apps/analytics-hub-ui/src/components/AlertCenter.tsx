/**
 * AlertCenter — Центр сповіщень для Predictive Alerts.
 *
 * Відображає:
 * - Popup notification badge у header
 * - Dropdown з останніми алертами
 * - Click → перехід до WatchlistPanel / Entity 360°
 * - Real-time оновлення через polling (30s)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, ShieldAlert, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../api';

interface QuickAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  entity_name: string;
  created_at: string;
  is_read: boolean;
}

interface AlertCenterProps {
  onOpenWatchlist?: () => void;
  onSelectEntity?: (entityId: string) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ff4444',
  high: '#ff8c00',
  medium: '#ffd700',
  low: '#00bfff',
  info: '#888',
};

const SEVERITY_ICONS: Record<string, React.ReactNode> = {
  critical: <ShieldAlert size={14} />,
  high: <AlertTriangle size={14} />,
  medium: <Bell size={14} />,
  low: <Info size={14} />,
  info: <Info size={14} />,
};

export function AlertCenter({ onOpenWatchlist, onSelectEntity }: AlertCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<QuickAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, statsRes] = await Promise.all([
        apiFetch('/api/v1/watchlist/alerts?limit=10&unread_only=true'),
        apiFetch('/api/v1/watchlist/alerts/stats'),
      ]);

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setUnreadCount(stats.unread_total || 0);
        setCriticalCount(stats.critical_unread || 0);
      }
    } catch {
      // Тихий фейл — watchlist таблиці можуть ще не існувати
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Закриття dropdown при кліку поза ним
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      await apiFetch(`/api/v1/watchlist/alerts/${alertId}/read`, { method: 'POST' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Тихий фейл
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none', borderRadius: 8,
          padding: '8px 10px', cursor: 'pointer',
          color: unreadCount > 0 ? '#ff8c00' : '#888',
          transition: 'all 0.2s',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: 2, right: 2,
              background: criticalCount > 0 ? '#ff4444' : '#ff8c00',
              color: '#fff', borderRadius: 10,
              padding: '0px 5px', fontSize: 9, fontWeight: 700,
              minWidth: 14, textAlign: 'center', lineHeight: '16px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '100%', right: 0,
              width: 380, maxHeight: 480, overflowY: 'auto',
              background: 'rgba(15,18,30,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, marginTop: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
              zIndex: 9999,
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>
                Сповіщення
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={onOpenWatchlist}
                  style={{
                    background: 'rgba(0,229,255,0.1)', border: 'none',
                    borderRadius: 6, padding: '4px 10px', fontSize: 11,
                    color: '#00e5ff', cursor: 'pointer',
                  }}
                >
                  Показати всі
                </button>
              )}
            </div>

            {/* Alerts List */}
            <div style={{ padding: '8px' }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#555' }}>
                  <CheckCircle size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p style={{ fontSize: 13 }}>Немає нових сповіщень</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      cursor: 'pointer', transition: 'background 0.2s',
                      borderLeft: `2px solid ${SEVERITY_COLORS[alert.severity]}`,
                      marginBottom: 4,
                    }}
                    whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <span style={{ color: SEVERITY_COLORS[alert.severity], marginTop: 2, flexShrink: 0 }}>
                      {SEVERITY_ICONS[alert.severity]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, fontWeight: 600, color: '#ddd', margin: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {alert.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0 0' }}>
                        {alert.entity_name} · {new Date(alert.created_at).toLocaleString('uk-UA', {
                          hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(alert.id); }}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#555', padding: 2, flexShrink: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AlertCenter;
