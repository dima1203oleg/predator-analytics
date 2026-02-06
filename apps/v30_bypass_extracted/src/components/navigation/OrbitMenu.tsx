
import React from 'react';
import { motion } from 'framer-motion';
import {
  Home, Search, Database, Bot, Shield, Settings, Activity,
  BrainCircuit, Eye, Rocket, BarChart3, Zap, FileText, Sparkles,
  Lock, ChevronRight, Crown, Layers
} from 'lucide-react';
import { TabView } from '../../types';
import { useUser, UserRole } from '../../context/UserContext';
import { useShell, UIShell } from '../../context/ShellContext';

// ============================================================================
// COMMAND SPACE NAVIGATION SYSTEM
// ============================================================================

export interface NavZone {
  id: string;
  title: string;
  titleUk: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  requiredRole?: UserRole;
  items: NavItem[];
}

export interface NavItem {
  id: TabView;
  label: string;
  icon: React.ReactNode;
  description?: string;
  requiredRole?: UserRole;
  badge?: string;
  isNew?: boolean;
  isLive?: boolean;
}

// ============================================================================
// NAVIGATION STRUCTURE - НОВА АРХІТЕКТУРА
// 5 основних зон для платних клієнтів + технічні для операторів
// ============================================================================

export const NAVIGATION_ZONES: NavZone[] = [
  // ========================================
  // ОСНОВНІ ЗОНИ (для платних клієнтів)
  // ========================================
  {
    id: 'core',
    title: 'ГОЛОВНЕ',
    titleUk: 'ГОЛОВНЕ',
    icon: <Home size={18} />,
    color: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    items: [
      {
        id: TabView.OVERVIEW,
        label: 'Огляд',
        icon: <Home size={18} />,
        description: 'Загальна картина системи',
        isLive: true,
      },
      {
        id: TabView.CASES,
        label: 'Кейси',
        icon: <FileText size={18} />,
        description: 'Виявлені ситуації',
        badge: '5',
      },
      {
        id: TabView.ANALYSIS,
        label: 'Аналіз',
        icon: <Search size={18} />,
        description: 'Візуалізація зв\'язків',
      },
      {
        id: TabView.ACTIVITY,
        label: 'Журнал',
        icon: <Activity size={18} />,
        description: 'Що відбувалось',
      },
    ],
  },

  // ========================================
  // ДОСЛІДЖЕННЯ (для аналітиків)
  // ========================================
  {
    id: 'discovery',
    title: 'ДОСЛІДЖЕННЯ',
    titleUk: 'ДОСЛІДЖЕННЯ',
    icon: <Search size={18} />,
    color: 'from-purple-500 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    items: [
      {
        id: TabView.SEARCH,
        label: 'Пошук',
        icon: <Search size={18} />,
        description: 'Пошук по всіх джерелах',
      },
      {
        id: TabView.DOCUMENTS,
        label: 'Документи',
        icon: <FileText size={18} />,
        description: 'Колекції та файли',
      },
      {
        id: TabView.DATA,
        label: 'Джерела даних',
        icon: <Database size={18} />,
        description: 'Статус підключень',
      },
    ],
  },

  // ========================================
  // ІНТЕЛЕКТ (AI функції)
  // ========================================
  {
    id: 'intelligence',
    title: 'ІНТЕЛЕКТ',
    titleUk: 'ІНТЕЛЕКТ',
    icon: <BrainCircuit size={18} />,
    color: 'from-amber-500 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    items: [
      {
        id: TabView.OMNISCIENCE,
        label: 'Всевидяче Око',
        icon: <Eye size={18} />,
        description: 'Командний центр AI',
        isLive: true,
      },
      {
        id: TabView.AGENTS,
        label: 'Агенти',
        icon: <Bot size={18} />,
        description: 'Рій AI-агентів',
      },
    ],
  },

  // ========================================
  // ОПЕРАЦІЇ (для операторів)
  // ========================================
  {
    id: 'operations',
    title: 'ОПЕРАЦІЇ',
    titleUk: 'ОПЕРАЦІЇ',
    icon: <Layers size={18} />,
    color: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    requiredRole: UserRole.OPERATOR,
    items: [
      {
        id: TabView.SYSTEM_HEALTH,
        label: 'Моніторинг',
        icon: <Activity size={18} />,
        description: 'Стан системи',
        isLive: true,
      },
      {
        id: TabView.DATABASES,
        label: 'Бази Даних',
        icon: <Database size={18} />,
        description: 'Сховища та індекси',
      },
      {
        id: TabView.DEPLOYMENT,
        label: 'DevOps',
        icon: <Rocket size={18} />,
        description: 'CI/CD та розгортання',
      },
      {
        id: TabView.LLM,
        label: 'LLM Студія',
        icon: <BrainCircuit size={18} />,
        description: 'Моделі та тренування',
      },
    ],
  },

  // ========================================
  // СИСТЕМА (для командирів)
  // ========================================
  {
    id: 'system',
    title: 'СИСТЕМА',
    titleUk: 'СИСТЕМА',
    icon: <Settings size={18} />,
    color: 'from-slate-500 to-slate-600',
    glowColor: 'rgba(100, 116, 139, 0.3)',
    requiredRole: UserRole.COMMANDER,
    items: [
      {
        id: TabView.SECURITY,
        label: 'Безпека',
        icon: <Shield size={18} />,
        description: 'WAF та захист',
      },
      {
        id: TabView.SETTINGS,
        label: 'Налаштування',
        icon: <Settings size={18} />,
        description: 'Конфігурація платформи',
      },
    ],
  },
];

// ============================================================================
// ORBIT MENU COMPONENT (Collapsible Sidebar)
// ============================================================================

interface OrbitMenuProps {
  activeTab: TabView;
  onNavigate: (tab: TabView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const OrbitMenu: React.FC<OrbitMenuProps> = ({
  activeTab,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { canAccess, user } = useUser();
  const { currentShell } = useShell();

  // Define which zones are visible for each Shell
  const shellVisibility: Record<UIShell, string[]> = {
    [UIShell.EXPLORER]: ['core', 'discovery', 'intelligence'],
    [UIShell.OPERATOR]: ['core', 'operations', 'intelligence', 'discovery'],
    [UIShell.COMMANDER]: ['core', 'system', 'intelligence', 'operations'],
  };

  return (
    <nav className={`flex flex-col gap-2 py-4 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-3'}`}>
      {NAVIGATION_ZONES.map((zone) => {
        // 1. Check Shell Visibility (Interface adaptation)
        // If the current shell doesn't include this zone, hide it to reduce clutter
        if (!shellVisibility[currentShell]?.includes(zone.id)) {
          return null;
        }

        // 2. Check Role Access (Security)
        if (zone.requiredRole && !canAccess(zone.requiredRole)) {
          return null;
        }

        return (
          <div key={zone.id} className="mb-2">
            {/* Zone Header */}
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${zone.color}`}
                  style={{ boxShadow: `0 0 8px ${zone.glowColor}` }}
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  {zone.titleUk}
                </span>
              </div>
            )}

            {/* Zone Items */}
            <div className="space-y-1">
              {zone.items.map((item) => {
                // Check item-level access
                const hasAccess = !item.requiredRole || canAccess(item.requiredRole);
                const isActive = activeTab === item.id;

                if (!hasAccess && !canAccess(UserRole.OPERATOR)) {
                  return null; // Don't show locked items to explorers
                }

                return (
                  <motion.button
                    key={item.id}
                    whileHover={hasAccess ? { x: 4 } : undefined}
                    whileTap={hasAccess ? { scale: 0.98 } : undefined}
                    onClick={() => hasAccess && onNavigate(item.id)}
                    disabled={!hasAccess}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                      ${isActive
                        ? `bg-gradient-to-r ${zone.color} text-white shadow-lg`
                        : hasAccess
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          : 'text-slate-600 cursor-not-allowed opacity-50'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    style={isActive ? { boxShadow: `0 4px 20px ${zone.glowColor}` } : undefined}
                  >
                    {/* Icon */}
                    <span className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                      {item.icon}
                    </span>

                    {/* Label */}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium truncate">
                          {item.label}
                        </span>

                        {/* Badges */}
                        {item.isLive && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className={isActive ? 'text-white/80' : 'text-emerald-500'}>Прямий Ефір</span>
                          </span>
                        )}
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded">
                            НОВИЙ
                          </span>
                        )}
                        {!hasAccess && (
                          <Lock size={14} className="text-slate-600" />
                        )}
                      </>
                    )}

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-white/50"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

// ============================================================================
// QUICK ACTIONS BAR
// ============================================================================

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  color: string;
}

interface QuickActionsBarProps {
  onOpenSearch: () => void;
  onOpenCommands: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  onOpenSearch,
  onOpenCommands,
}) => {
  const actions: QuickAction[] = [
    {
      id: 'search',
      label: 'Пошук',
      icon: <Search size={16} />,
      shortcut: '⌘K',
      action: onOpenSearch,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'command',
      label: 'Команди',
      icon: <Zap size={16} />,
      shortcut: '⌘J',
      action: onOpenCommands,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="flex gap-2 p-2 bg-slate-900/50 border-t border-slate-800">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.action}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition-colors group"
        >
          <span className="text-slate-400 group-hover:text-white transition-colors">
            {action.icon}
          </span>
          <span className="text-xs font-medium text-slate-400 group-hover:text-white">
            {action.label}
          </span>
          {action.shortcut && (
            <span className="text-[10px] text-slate-600 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
              {action.shortcut}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

// ============================================================================
// USER PROFILE BADGE
// ============================================================================

interface UserBadgeProps {
  collapsed?: boolean;
  onClick?: () => void;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ collapsed, onClick }) => {
  const { user, isCommander, isOperator } = useUser();

  if (!user) return null;

  const roleConfig = {
    commander: { label: 'КОМАНДИР', color: 'from-amber-500 to-orange-500', icon: <Crown size={12} /> },
    operator: { label: 'ОПЕРАТОР', color: 'from-blue-500 to-cyan-500', icon: <Shield size={12} /> },
    explorer: { label: 'ДОСЛІДНИК', color: 'from-slate-500 to-slate-600', icon: <Search size={12} /> },
  };

  const config = isCommander
    ? roleConfig.commander
    : isOperator
      ? roleConfig.operator
      : roleConfig.explorer;

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white font-bold shadow-lg`}
      >
        {user.avatar || user.name.charAt(0)}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 rounded-xl transition-all group"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white font-bold shadow-lg`}>
        {user.avatar || user.name.charAt(0)}
      </div>
      <div className="flex-1 text-left">
        <div className="text-sm font-bold text-white">{user.name}</div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {config.icon}
          {config.label}
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
    </button>
  );
};

export default OrbitMenu;
