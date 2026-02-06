/**
 * PREDATOR Premium Dashboard Builder - Main Component
 * Головний конструктор дашбордів з drag & drop та AI-рекомендаціями
 * Повна українська локалізація
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Save, Share2, Download, Settings, Trash2, Layers,
  Eye, EyeOff, Lock, Unlock, Undo, Redo, Copy,
  Maximize2, Play, Pause, RefreshCw, Sparkles,
  Layout, PanelLeft, PanelLeftClose, ChevronDown,
  Crown, Loader2, FileText, ArrowRight
} from 'lucide-react';
import {
  WidgetConfig, WidgetData, DashboardTemplate, SavedDashboard,
  PersonaType, PERSONA_TEMPLATES, AIRecommendation, WidgetType, DataSource
} from './types';
import { WidgetPalette } from './WidgetPalette';
import { WidgetRenderer } from './WidgetRenderer';
import { cn } from '../../../utils/cn';
import { useAppStore } from '../../../store/useAppStore';
import { ViewHeader } from '../../ViewHeader';
import { premiumLocales } from '../../../locales/uk/premium';

interface DashboardBuilderProps {
  initialDashboard?: SavedDashboard;
  onSave?: (dashboard: SavedDashboard) => void;
}

// Generate unique ID
const generateId = () => `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Mock data generator for widgets with LOCALIZED DATA
const generateMockData = (type: WidgetType): any => {
  switch (type) {
    case 'kpi_card':
      return { value: '$1.2M', trend: 12, subValue: premiumLocales.dashboardBuilder.mockData.vsLastMonth };
    case 'gauge':
      return { value: 78, max: 100 };
    case 'area_chart':
    case 'line_chart':
      return {
        series: [
          { name: 'Січ', value: 4000 },
          { name: 'Лют', value: 3000 },
          { name: 'Бер', value: 5000 },
          { name: 'Кві', value: 4500 },
          { name: 'Тра', value: 6000 },
          { name: 'Чер', value: 5500 }
        ]
      };
    case 'bar_chart':
      return {
        series: [
          { name: premiumLocales.dashboardBuilder.mockData.categories.electronics, value: 4000 },
          { name: premiumLocales.dashboardBuilder.mockData.categories.transport, value: 3000 },
          { name: premiumLocales.dashboardBuilder.mockData.categories.products, value: 2000 },
          { name: premiumLocales.dashboardBuilder.mockData.categories.chemistry, value: 2780 }
        ]
      };
    case 'pie_chart':
      return {
        series: [
          { name: premiumLocales.dashboardBuilder.mockData.operations.import, value: 400 },
          { name: premiumLocales.dashboardBuilder.mockData.operations.export, value: 300 },
          { name: premiumLocales.dashboardBuilder.mockData.operations.transit, value: 200 },
          { name: premiumLocales.dashboardBuilder.mockData.operations.reexport, value: 100 }
        ]
      };
    case 'radar_chart':
      return {
        series: [
          { subject: premiumLocales.dashboardBuilder.mockData.subjects.risk, value: 80 },
          { subject: premiumLocales.dashboardBuilder.mockData.subjects.volume, value: 65 },
          { subject: premiumLocales.dashboardBuilder.mockData.subjects.value, value: 90 },
          { subject: premiumLocales.dashboardBuilder.mockData.subjects.frequency, value: 70 },
          { subject: premiumLocales.dashboardBuilder.mockData.subjects.compliance, value: 85 }
        ]
      };
    case 'table':
      return {
        columns: ['ID', premiumLocales.dashboardBuilder.mockData.table.company, premiumLocales.dashboardBuilder.mockData.subjects.value, premiumLocales.dashboardBuilder.mockData.table.status],
        rows: [
          { ID: '001', [premiumLocales.dashboardBuilder.mockData.table.company]: 'Альфа Корп', [premiumLocales.dashboardBuilder.mockData.subjects.value]: '$120K', [premiumLocales.dashboardBuilder.mockData.table.status]: premiumLocales.dashboardBuilder.mockData.table.active },
          { ID: '002', [premiumLocales.dashboardBuilder.mockData.table.company]: 'Бета ТОВ', [premiumLocales.dashboardBuilder.mockData.subjects.value]: '$85K', [premiumLocales.dashboardBuilder.mockData.table.status]: premiumLocales.dashboardBuilder.mockData.table.pending },
          { ID: '003', [premiumLocales.dashboardBuilder.mockData.table.company]: 'Гамма Інк', [premiumLocales.dashboardBuilder.mockData.subjects.value]: '$200K', [premiumLocales.dashboardBuilder.mockData.table.status]: premiumLocales.dashboardBuilder.mockData.table.active }
        ]
      };
    default:
      return { series: [] };
  }
};

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialDashboard,
  onSave
}) => {
  const { persona, userRole } = useAppStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // State
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialDashboard?.widgets || []);
  const [widgetData, setWidgetData] = useState<Record<string, WidgetData>>({});
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [showPalette, setShowPalette] = useState(true);
  const [dashboardName, setDashboardName] = useState(initialDashboard?.name || premiumLocales.dashboardBuilder.mockData.newDashboard);
  const [isSaving, setIsSaving] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [history, setHistory] = useState<WidgetConfig[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Premium check
  const isPremium = userRole === 'admin' || userRole === 'premium';

  // Load AI recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      setIsGeneratingAI(true);
      try {
        // Simulate AI recommendations based on persona
        await new Promise(resolve => setTimeout(resolve, 1500));

        const recommendations: AIRecommendation[] = [
          {
            id: 'rec_1',
            widgetType: 'area_chart',
            title: 'Тренд митних надходжень',
            description: 'Візуалізація динаміки митних платежів за останні 12 місяців',
            reasoning: 'На основі вашої персони та історії запитів',
            dataSource: 'customs_registry',
            confidence: 0.92,
            priority: 'high'
          },
          {
            id: 'rec_2',
            widgetType: 'pie_chart',
            title: 'Структура імпорту',
            description: 'Розподіл імпорту за категоріями товарів',
            reasoning: 'Часто переглядаєте дані про категорії',
            dataSource: 'customs_registry',
            confidence: 0.85,
            priority: 'medium'
          },
          {
            id: 'rec_3',
            widgetType: 'network_graph',
            title: 'Зв\'язки компаній',
            description: 'Мережа бенефіціарів та пов\'язаних осіб',
            reasoning: 'Рекомендовано для розслідувань',
            dataSource: 'beneficial_owners',
            confidence: 0.78,
            priority: 'high'
          }
        ];

        setAiRecommendations(recommendations);
      } catch (error) {
        console.error('Failed to load AI recommendations:', error);
      } finally {
        setIsGeneratingAI(false);
      }
    };

    loadRecommendations();
  }, [persona]);

  // Load widget data
  const loadWidgetData = useCallback(async (widgetId: string, config: WidgetConfig) => {
    setWidgetData(prev => ({
      ...prev,
      [widgetId]: { loading: true, data: null }
    }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      const data = generateMockData(config.type);

      setWidgetData(prev => ({
        ...prev,
        [widgetId]: {
          loading: false,
          data,
          lastUpdated: new Date().toISOString()
        }
      }));
    } catch (error) {
      setWidgetData(prev => ({
        ...prev,
        [widgetId]: {
          loading: false,
          error: premiumLocales.common.loadError,
          data: null
        }
      }));
    }
  }, []);

  // Add widget
  const handleAddWidget = useCallback((type: WidgetType, dataSource?: DataSource) => {
    const newWidget: WidgetConfig = {
      id: generateId(),
      type,
      title: `${premiumLocales.dashboardBuilder.canvas.newWidget} ${premiumLocales.dashboardBuilder.widgetTypes[type] || type}`,
      dataSource: dataSource || 'customs_registry',
      position: { x: Math.random() * 400, y: Math.random() * 200 },
      size: { width: 4, height: 3 },
      style: {
        colorScheme: 'amber',
        variant: 'holographic',
        animation: true,
        transparency: 0.8
      }
    };

    setWidgets(prev => {
      const newWidgets = [...prev, newWidget];
      // Save to history
      setHistory(h => [...h.slice(0, historyIndex + 1), newWidgets]);
      setHistoryIndex(i => i + 1);
      return newWidgets;
    });

    // Load data for new widget
    loadWidgetData(newWidget.id, newWidget);
  }, [historyIndex, loadWidgetData]);

  // Delete widget
  const handleDeleteWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const newWidgets = prev.filter(w => w.id !== widgetId);
      setHistory(h => [...h.slice(0, historyIndex + 1), newWidgets]);
      setHistoryIndex(i => i + 1);
      return newWidgets;
    });
    setSelectedWidget(null);
  }, [historyIndex]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(i => i - 1);
      setWidgets(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      setWidgets(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Save dashboard
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dashboard: SavedDashboard = {
        id: initialDashboard?.id || generateId(),
        name: dashboardName,
        userId: 'current_user',
        persona: persona as PersonaType,
        widgets,
        createdAt: initialDashboard?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        views: initialDashboard?.views || 0
      };

      // Simulate API save
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSave?.(dashboard);
    } catch (error) {
      console.error('Failed to save dashboard:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load template
  const handleLoadTemplate = (template: DashboardTemplate) => {
    setWidgets(template.widgets);
    setDashboardName(template.name);
    setShowTemplates(false);

    // Load data for all widgets
    template.widgets.forEach(widget => {
      loadWidgetData(widget.id, widget);
    });
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      widgets.forEach(widget => {
        if (widget.refreshInterval) {
          loadWidgetData(widget.id, widget);
        }
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, widgets, loadWidgetData]);

  // Initial data load
  useEffect(() => {
    widgets.forEach(widget => {
      if (!widgetData[widget.id]) {
        loadWidgetData(widget.id, widget);
      }
    });
  }, [widgets, widgetData, loadWidgetData]);

  const personaTemplates = PERSONA_TEMPLATES[persona as PersonaType] || PERSONA_TEMPLATES.TITAN;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <ViewHeader
        title={premiumLocales.dashboardBuilder.title.toUpperCase().replace(/ /g, '_')}
        icon={<Layout size={20} className="text-amber-400" />}
        breadcrumbs={premiumLocales.dashboardBuilder.breadcrumbs}
        stats={[
          { label: premiumLocales.dashboardBuilder.stats.widgets, value: widgets.length.toString(), icon: <Layers size={14} />, color: 'primary' },
          { label: premiumLocales.dashboardBuilder.modes.mode, value: isEditing ? premiumLocales.dashboardBuilder.modes.edit : premiumLocales.dashboardBuilder.modes.view, icon: isEditing ? <Settings size={14} /> : <Eye size={14} />, color: 'primary' }
        ]}
      />

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              showPalette
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
            title={premiumLocales.dashboardBuilder.toolbar.widgetPalette}
          >
            {showPalette ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          <div className="h-6 w-px bg-white/10" />

          {/* Dashboard name */}
          <input
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            className="bg-transparent text-lg font-black text-white focus:outline-none border-b-2 border-transparent focus:border-amber-500 transition-colors"
            placeholder={premiumLocales.dashboardBuilder.toolbar.dashboardNamePlaceholder}
          />

          <div className="h-6 w-px bg-white/10" />

          {/* Templates */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <FileText size={14} />
              {premiumLocales.dashboardBuilder.toolbar.templates}
              <ChevronDown size={14} />
            </button>

            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-80 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
                >
                  <div className="p-4 border-b border-white/5">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                      {premiumLocales.dashboardBuilder.toolbar.templatesFor} {persona}
                    </div>
                  </div>
                  <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                    {personaTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="w-full p-3 text-left rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                            <Layout size={14} className="text-amber-500" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-white">{template.name}</div>
                            <div className="text-[9px] text-slate-500">{template.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-30"
            title={premiumLocales.dashboardBuilder.toolbar.undo}
          >
            <Undo size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-30"
            title={premiumLocales.dashboardBuilder.toolbar.redo}
          >
            <Redo size={16} />
          </button>

          <div className="h-6 w-px bg-white/10" />

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "p-2.5 rounded-xl border transition-all flex items-center gap-2",
              autoRefresh
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
            title={premiumLocales.dashboardBuilder.toolbar.autoRefresh}
          >
            {autoRefresh ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Edit/View toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              isEditing
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            )}
            title={isEditing ? premiumLocales.dashboardBuilder.toolbar.viewMode : premiumLocales.dashboardBuilder.toolbar.editMode}
          >
            {isEditing ? <Unlock size={16} /> : <Lock size={16} />}
          </button>

          <div className="h-6 w-px bg-white/10" />

          {/* Share */}
          <button
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            title={premiumLocales.dashboardBuilder.toolbar.share}
          >
            <Share2 size={16} />
          </button>

          {/* Export */}
          <button
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
            title={premiumLocales.dashboardBuilder.toolbar.export}
          >
            <Download size={16} />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-amber-900/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {premiumLocales.dashboardBuilder.toolbar.save}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Widget Palette */}
        <AnimatePresence>
          {showPalette && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-white/5 overflow-hidden"
            >
              <div className="w-80 h-full p-4">
                <WidgetPalette
                  onAddWidget={handleAddWidget}
                  recommendations={aiRecommendations}
                  userPlan={isPremium ? 'premium' : 'free'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950/50" ref={canvasRef}>
          {widgets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6 max-w-lg"
              >
                <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-12 h-12 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                    {premiumLocales.dashboardBuilder.canvas.startBuilding}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {premiumLocales.dashboardBuilder.canvas.selectWidgets}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleAddWidget('kpi_card')}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    {premiumLocales.dashboardBuilder.canvas.addKpi}
                  </button>
                  <button
                    onClick={() => handleAddWidget('area_chart')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                  >
                    {premiumLocales.dashboardBuilder.canvas.addChart}
                  </button>
                </div>

                {/* AI Quick Recommendations */}
                {aiRecommendations.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2 justify-center">
                      <Sparkles size={14} />
                      {premiumLocales.dashboardBuilder.canvas.aiQuickRec}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {aiRecommendations.slice(0, 3).map(rec => (
                        <button
                          key={rec.id}
                          onClick={() => handleAddWidget(rec.widgetType, rec.dataSource)}
                          className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] font-bold text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-2"
                        >
                          {rec.title}
                          <ArrowRight size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 auto-rows-min">
              {widgets.map((widget) => (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "relative group",
                    `col-span-${Math.min(widget.size.width, 12)}`,
                    widget.size.height === 1 ? 'h-24' :
                    widget.size.height === 2 ? 'h-48' :
                    widget.size.height === 3 ? 'h-72' :
                    widget.size.height === 4 ? 'h-96' : 'h-[480px]'
                  )}
                  style={{
                    gridColumn: `span ${Math.min(widget.size.width, 12)}`
                  }}
                  onClick={() => setSelectedWidget(widget.id)}
                >
                  {/* Selection indicator */}
                  {selectedWidget === widget.id && isEditing && (
                    <div className="absolute -inset-1 border-2 border-amber-500 rounded-[28px] pointer-events-none z-10" />
                  )}

                  {/* Edit controls */}
                  {isEditing && (
                    <div className="absolute -top-3 -right-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clone widget
                          const clone = { ...widget, id: generateId(), position: { x: widget.position.x + 20, y: widget.position.y + 20 } };
                          setWidgets(prev => [...prev, clone]);
                          loadWidgetData(clone.id, clone);
                        }}
                        className="p-1.5 bg-slate-900 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                        title={premiumLocales.dashboardBuilder.canvas.duplicate}
                      >
                        <Copy size={12} className="text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWidget(widget.id);
                        }}
                         className="p-1.5 bg-rose-900 border border-rose-500/30 rounded-lg hover:bg-rose-800 transition-colors"
                        title={premiumLocales.dashboardBuilder.canvas.delete}
                      >
                        <Trash2 size={12} className="text-rose-400" />
                      </button>
                    </div>
                  )}

                  <WidgetRenderer
                    config={widget}
                    data={widgetData[widget.id] || { loading: true, data: null }}
                    onRefresh={() => loadWidgetData(widget.id, widget)}
                    isEditing={isEditing && selectedWidget === widget.id}
                  />
                </motion.div>
              ))}

              {/* Add Widget Card */}
              {isEditing && (
                <motion.button
                  onClick={() => setShowPalette(true)}
                  className="col-span-4 h-48 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                    <Plus size={24} className="text-slate-500 group-hover:text-amber-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-amber-500">
                    {premiumLocales.dashboardBuilder.palette.addWidget}
                  </span>
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Premium Upgrade Banner (for non-premium users) */}
      {!isPremium && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-amber-900/90 to-orange-900/90 border border-amber-500/30 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-4"
          >
            <div className="p-2 bg-amber-500/20 rounded-full">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase">{premiumLocales.dashboardBuilder.paywall.upgradeTitle}</div>
              <div className="text-[10px] text-amber-300/70">{premiumLocales.dashboardBuilder.paywall.accessAllData}</div>
            </div>
            <button className="px-4 py-2 bg-amber-500 text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-colors">
              {premiumLocales.common.upgrade}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardBuilder;
