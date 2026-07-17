/* ─────────────────────────────────────────────────────────
 * AdminLayout — Classic Enterprise Shell
 * Чистий корпоративний стиль: GitHub/Linear/Vercel.
 * Повністю відокремлений від тактичного Predator UI.
 * ───────────────────────────────────────────────────────── */
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, Activity, GitBranch,
  ChevronLeft, ChevronRight, Shield, Bell, Settings, LogOut,
  Moon, Sun, Cpu, Brain, LineChart, Search, Database, UploadCloud,
  HardDrive, Box, TestTube, Bot, ShieldAlert, Zap, Dna, UserCircle,
  Globe, CreditCard, Network, Layers, Languages, Sparkles
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

interface NavItem {
  path: string;
  label: string;
  Icon: any;
  badgeCount?: number;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    category: 'nav.system_control',
    items: [
      { path: '/admin/mission-control', label: 'nav.mission_control', Icon: Activity },
      { path: '/admin/data-hub', label: 'nav.data_hub', Icon: Database },
    ]
  },
  {
    category: 'nav.intelligence_routing',
    items: [
      { path: '/admin/model-lab', label: 'nav.model_lab', Icon: Brain },
      { path: '/admin/factory', label: 'nav.factory', Icon: Bot },
      { path: '/admin/agent-control', label: 'nav.agent_control', Icon: Bot },
      { path: '/admin/routing-matrix', label: 'nav.routing_matrix', Icon: Network },
      { path: '/admin/domain-knowledge', label: 'nav.domain_knowledge', Icon: Layers },
    ]
  },
  {
    category: 'nav.operations_testing',
    items: [
      { path: '/admin/sandbox', label: 'nav.sandbox', Icon: Box },
      { path: '/admin/security', label: 'nav.security', Icon: ShieldAlert },
    ]
  }
];

const BREADCRUMB: Record<string, string> = {};
NAV_CATEGORIES.forEach(cat => {
  cat.items.forEach(item => {
    BREADCRUMB[item.path] = item.label;
  });
});

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const { t, i18n } = useTranslation('admin');
  
  // Theme state: default is dark (classic dark), can toggle to light
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('admin-theme') === 'light';
  });

  const toggleTheme = () => {
    setIsLight(prev => {
      const next = !prev;
      localStorage.setItem('admin-theme', next ? 'light' : 'dark');
      return next;
    });
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'uk' ? 'en' : 'uk';
    i18n.changeLanguage(nextLang);
  };

  const breadcrumbKey = BREADCRUMB[location.pathname];
  const breadcrumb = breadcrumbKey ? t(breadcrumbKey) : 'Admin';

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  return (
    <div className={`admin-shell flex ${isLight ? 'admin-theme-light' : ''}`} style={{ height: '100vh', overflow: 'hidden' }}>

      {/* ─── SIDEBAR ─── */}
      <aside
        className="admin-sidebar"
        style={{
          width: collapsed ? '4rem' : '15rem',
          minWidth: collapsed ? '4rem' : '15rem',
          transition: 'width 200ms ease, min-width 200ms ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="admin-sidebar-header">
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="admin-sidebar-brand">{t('layout.brand')}</div>
              <div className="admin-sidebar-sub">{t('layout.subtitle')}</div>
            </div>
          )}
          <Button variant="cyber"
            onClick={() => setCollapsed(!collapsed)}
            className="admin-collapse-btn"
            title={collapsed ? t('layout.expand') : t('layout.collapse')}
            style={{ marginLeft: collapsed ? 'auto' : undefined, marginRight: collapsed ? 'auto' : undefined }}
          >
            {collapsed
              ? <ChevronRight size={14} />
              : <ChevronLeft  size={14} />
            }
          </Button>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_CATEGORIES.map((cat, idx) => (
            <div key={cat.category} style={{ marginBottom: idx < NAV_CATEGORIES.length - 1 ? '0.5rem' : 0 }}>
              {!collapsed && (
                <div className="admin-sidebar-section-label">{t(cat.category)}</div>
              )}
              {collapsed && idx > 0 && <div style={{ height: 1, background: 'var(--a-border)', margin: '0.5rem 1rem' }} />}
              
              {cat.items.map(({ path, label, Icon, badgeCount }) => {
                const isActive = location.pathname === path;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/admin'}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? t(label) : undefined}
                    style={{ justifyContent: collapsed ? 'center' : undefined, padding: collapsed ? '0.5rem' : undefined }}
                  >
                    <Icon size={16} className="admin-nav-link-icon" style={{ flexShrink: 0 }} />
                    {!collapsed && (
                      <>
                        <span className="admin-nav-link-label">{t(label)}</span>
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <span className="admin-nav-badge">{badgeCount}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Divider */}
          {!collapsed && (
            <div style={{ margin: '0.5rem 0' }}>
              <div className="admin-sidebar-section-label">{t('nav.settings')}</div>
            </div>
          )}

          <NavLink
            to="/admin/settings"
            className="admin-nav-link"
            title={collapsed ? t('nav.settings') : undefined}
            style={{ justifyContent: collapsed ? 'center' : undefined, padding: collapsed ? '0.5rem' : undefined }}
          >
            <Settings size={16} className="admin-nav-link-icon" style={{ flexShrink: 0 }} />
            {!collapsed && <span className="admin-nav-link-label">{t('nav.settings')}</span>}
          </NavLink>
        </nav>

        {/* Footer — User info */}
        <div
          className="admin-sidebar-footer"
          style={{ justifyContent: collapsed ? 'center' : undefined }}
        >
          <div className="admin-sidebar-avatar" title={user?.name ?? 'Admin'}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="admin-sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name ?? 'Admin'}
                </div>
                <div className="admin-sidebar-user-role">
                  {user?.role?.toUpperCase() ?? t('layout.admin_role')}
                </div>
              </div>
              <Button variant="cyber"
                onClick={logout}
                title={t('layout.logout')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--a-text-muted)',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--a-red)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--a-text-muted)')}
              >
                <LogOut size={15} />
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Topbar */}
        <div className="admin-topbar">
          {/* Breadcrumb */}
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Shield size={14} style={{ color: 'var(--a-text-muted)' }} />
            <span className="admin-breadcrumb-sep">/</span>
            <span>{t('layout.breadcrumb_root')}</span>
            <span className="admin-breadcrumb-sep">/</span>
            <span className="admin-breadcrumb-current">{breadcrumb}</span>
          </nav>

          {/* Right actions */}
          <div className="admin-topbar-actions">
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#16A34A',
                boxShadow: '0 0 0 2px rgba(22,163,74,0.2)',
                flexShrink: 0,
                display: 'inline-block',
              }} />
              <span style={{ fontSize: '0.6875rem', color: 'var(--a-text-muted)', fontWeight: 600 }}>
                {t('layout.system_online')}
              </span>
            </div>

            <div style={{ width: 1, height: 18, background: 'var(--a-border)', margin: '0 0.25rem' }} />

            {/* Language Toggle */}
            <Button variant="cyber"
              onClick={toggleLanguage}
              title={i18n.language === 'uk' ? 'Switch to English' : 'Перемкнути на Українську'}
              style={{
                background: 'none', border: '1px solid var(--a-border)',
                borderRadius: '6px', padding: '0.35rem 0.5rem',
                cursor: 'pointer', color: 'var(--a-text-sec)',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                transition: 'all 150ms ease', fontSize: '0.75rem', fontWeight: 600
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--a-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Languages size={15} />
              {i18n.language === 'uk' ? 'UK' : 'EN'}
            </Button>

            {/* Theme Toggle */}
            <Button variant="cyber"
              onClick={toggleTheme}
              title={isLight ? t('layout.theme_dark') : t('layout.theme_light')}
              style={{
                background: 'none', border: '1px solid var(--a-border)',
                borderRadius: '6px', padding: '0.35rem',
                cursor: 'pointer', color: 'var(--a-text-sec)',
                display: 'flex', alignItems: 'center',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--a-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              {isLight ? <Moon size={15} /> : <Sun size={15} />}
            </Button>

            {/* Notification stub */}
            <Button variant="cyber"
              title={t('layout.notifications')}
              style={{
                background: 'none', border: '1px solid var(--a-border)',
                borderRadius: '6px', padding: '0.35rem',
                cursor: 'pointer', color: 'var(--a-text-sec)',
                display: 'flex', alignItems: 'center',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--a-bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Bell size={15} />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--a-bg)' }}>
          {children}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
