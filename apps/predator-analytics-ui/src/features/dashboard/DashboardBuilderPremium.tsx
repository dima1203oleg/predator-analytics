/**
 * 💼 Business Intelligence Dashboard Builder
 *
 * Дозволяє клієнтам створювати власні дашборди
 * з drag-and-drop віджетами
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  Settings,
  Download,
  Share2,
  Trash2,
  Move,
  BarChart3,
  PieChart,
  TrendingUp,
  Map,
  Users,
  Package,
  DollarSign,
  Globe,
  Building2,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  Layout,
  Grid3X3,
  Maximize2,
  Minimize2,
  RefreshCw,
  Save,
  FileText,
  Bell,
  Target,
  Lock
} from 'lucide-react';

// ========================
// Types
// ========================

interface Widget {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'map' | 'list' | 'trend';
  title: string;
  icon: typeof BarChart3;
  size: 'small' | 'medium' | 'large';
  color: string;
  config: Record<string, unknown>;
  premium?: boolean;
}

interface DashboardConfig {
  id: string;
  name: string;
  widgets: Widget[];
  layout: 'grid' | 'freeform';
  shared: boolean;
}

// ========================
// Widget Templates
// ========================

const widgetTemplates: Omit<Widget, 'id'>[] = [
  {
    type: 'kpi',
    title: 'Загальний імпорт',
    icon: Package,
    size: 'small',
    color: 'cyan',
    config: { metric: 'total_import', format: 'currency' }
  },
  {
    type: 'chart',
    title: 'Динаміка імпорту',
    icon: TrendingUp,
    size: 'medium',
    color: 'purple',
    config: { chartType: 'line', period: 'month' }
  },
  {
    type: 'chart',
    title: 'ТОП Країни',
    icon: PieChart,
    size: 'medium',
    color: 'emerald',
    config: { chartType: 'pie', groupBy: 'country' }
  },
  {
    type: 'list',
    title: 'ТОП Імпортери',
    icon: Building2,
    size: 'medium',
    color: 'amber',
    config: { sortBy: 'volume', limit: 10 }
  },
  {
    type: 'map',
    title: 'Геокарта торгівлі',
    icon: Globe,
    size: 'large',
    color: 'blue',
    config: { mapType: 'flow' },
    premium: true
  },
  {
    type: 'table',
    title: 'Останні декларації',
    icon: FileText,
    size: 'large',
    color: 'slate',
    config: { columns: ['company', 'product', 'value', 'date'] }
  },
  {
    type: 'kpi',
    title: 'Ризик-скор',
    icon: Target,
    size: 'small',
    color: 'amber',
    config: { metric: 'risk_score' },
    premium: true
  },
  {
    type: 'trend',
    title: 'AI Прогноз',
    icon: Sparkles,
    size: 'medium',
    color: 'violet',
    config: { model: 'forecast' },
    premium: true
  },
];

// ========================
// Widget Component
// ========================

interface WidgetCardProps {
  widget: Widget;
  onRemove: (id: string) => void;
  onSettings: (id: string) => void;
  isEditing: boolean;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ widget, onRemove, onSettings, isEditing }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3'
  };

  const heightClasses = {
    small: 'h-32',
    medium: 'h-64',
    large: 'h-80'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        ${sizeClasses[widget.size]}
        relative group
        bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden
        ${isEditing ? 'cursor-move' : ''}
        ${isExpanded ? 'fixed inset-4 z-50 !col-span-full' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          {isEditing && (
            <div className="cursor-move text-slate-600 hover:text-slate-400">
              <Move size={16} />
            </div>
          )}
          <div className={`p-2 rounded-lg bg-${widget.color}-500/20`}>
            <widget.icon size={16} className={`text-${widget.color}-400`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {widget.title}
              {widget.premium && (
                <Crown size={12} className="text-amber-400" />
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            title={isExpanded ? 'Згорнути' : 'Розгорнути'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={() => onSettings(widget.id)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            title="Налаштування"
          >
            <Settings size={14} />
          </button>
          {isEditing && (
            <button
              onClick={() => onRemove(widget.id)}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-colors"
              title="Видалити"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 ${heightClasses[widget.size]}`}>
        {widget.type === 'kpi' && (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-4xl font-black text-white">$847M</p>
            <p className={`text-sm text-${widget.color}-400 mt-2`}>+12.4% за місяць</p>
          </div>
        )}

        {widget.type === 'chart' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="text-slate-600 mx-auto mb-2" size={48} />
              <p className="text-slate-500 text-sm">Графік {widget.title}</p>
            </div>
          </div>
        )}

        {widget.type === 'list' && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                    {i}
                  </span>
                  <span className="text-sm text-slate-300">Компанія #{i}</span>
                </div>
                <span className="text-sm font-bold text-white">${(100 - i * 15)}M</span>
              </div>
            ))}
          </div>
        )}

        {widget.type === 'map' && (
          <div className="h-full flex items-center justify-center bg-slate-800/30 rounded-xl">
            <div className="text-center">
              <Globe className="text-slate-600 mx-auto mb-2" size={64} />
              <p className="text-slate-500">Інтерактивна карта</p>
            </div>
          </div>
        )}

        {widget.type === 'table' && (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                  <th className="pb-2">Компанія</th>
                  <th className="pb-2">Товар</th>
                  <th className="pb-2">Сума</th>
                  <th className="pb-2">Дата</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 text-slate-300">ТОВ "Компанія {i}"</td>
                    <td className="py-2 text-slate-400">Товар {i}</td>
                    <td className="py-2 text-white font-bold">${i * 125}K</td>
                    <td className="py-2 text-slate-500">0{i}.01.2026</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {widget.type === 'trend' && (
          <div className="h-full flex flex-col items-center justify-center">
            <Sparkles className="text-violet-400 mb-4" size={48} />
            <p className="text-lg font-bold text-white">AI Прогноз</p>
            <p className="text-sm text-slate-400 mt-2">Зростання імпорту на 15% до кінця кварталу</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ========================
// Widget Picker Modal
// ========================

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (widget: Omit<Widget, 'id'>) => void;
  isPremium: boolean;
}

const WidgetPicker: React.FC<WidgetPickerProps> = ({ isOpen, onClose, onAdd, isPremium }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">Додати віджет</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {widgetTemplates.map((template, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (template.premium && !isPremium) return;
                onAdd(template);
                onClose();
              }}
              className={`
                relative p-4 rounded-xl text-left transition-all
                ${template.premium && !isPremium
                  ? 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                  : `bg-${template.color}-500/10 border border-${template.color}-500/30 hover:bg-${template.color}-500/20`}
              `}
            >
              {template.premium && !isPremium && (
                <div className="absolute top-2 right-2">
                  <Lock size={14} className="text-amber-400" />
                </div>
              )}
              {template.premium && isPremium && (
                <div className="absolute top-2 right-2">
                  <Crown size={14} className="text-amber-400" />
                </div>
              )}

              <template.icon className={`text-${template.color}-400 mb-3`} size={24} />
              <p className="font-bold text-white text-sm">{template.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {template.size === 'small' ? 'Компактний' :
                 template.size === 'medium' ? 'Середній' : 'Великий'}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ========================
// Main Dashboard Builder
// ========================

const DashboardBuilderPremium: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([
    { ...widgetTemplates[0], id: '1' },
    { ...widgetTemplates[1], id: '2' },
    { ...widgetTemplates[2], id: '3' },
    { ...widgetTemplates[3], id: '4' },
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [dashboardName, setDashboardName] = useState('Мій дашборд');
  const [isPremium] = useState(true);

  const addWidget = useCallback((template: Omit<Widget, 'id'>) => {
    const newWidget: Widget = {
      ...template,
      id: `widget-${Date.now()}`
    };
    setWidgets(prev => [...prev, newWidget]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleSettings = useCallback((id: string) => {
    // Open settings modal
    console.log('Settings for widget:', id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                  <Layout className="text-white" size={20} />
                </div>
                <div>
                  <input
                    type="text"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    className="text-lg font-black text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-500/50 rounded px-2 -ml-2"
                  />
                  <p className="text-xs text-slate-500">Dashboard Builder • {widgets.length} віджетів</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Layout Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-white/5">
                <button className="p-2 rounded-md bg-white/10 text-white">
                  <Grid3X3 size={16} />
                </button>
                <button className="p-2 rounded-md text-slate-500 hover:text-white">
                  <Layout size={16} />
                </button>
              </div>

              {/* Actions */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all
                  ${isEditing
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
                `}
              >
                <Settings size={16} />
                {isEditing ? 'Готово' : 'Редагувати'}
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700">
                <Share2 size={16} />
                Поділитися
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm">
                <Save size={16} />
                Зберегти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar (when editing) */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-3">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-sm"
                >
                  <Plus size={16} />
                  Додати віджет
                </motion.button>

                <div className="h-6 w-px bg-white/10" />

                <button className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm">
                  <RefreshCw size={14} />
                  Скинути
                </button>

                <button className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm">
                  <Download size={14} />
                  Імпорт шаблону
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 mb-6">
              <Layout className="text-slate-600" size={48} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Дашборд порожній</h2>
            <p className="text-slate-500 mb-6">Додайте віджети для візуалізації даних</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsEditing(true);
                setShowPicker(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold"
            >
              <Plus size={18} />
              Додати перший віджет
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {widgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  onRemove={removeWidget}
                  onSettings={handleSettings}
                  isEditing={isEditing}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Widget Picker Modal */}
      <AnimatePresence>
        <WidgetPicker
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onAdd={addWidget}
          isPremium={isPremium}
        />
      </AnimatePresence>
    </div>
  );
};

export default DashboardBuilderPremium;
