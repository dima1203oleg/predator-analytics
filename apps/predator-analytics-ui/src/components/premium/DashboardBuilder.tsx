/**
 * 🎯 Interactive Dashboard Builder - PREDATOR PRO
 *
 * Drag-and-drop dashboard customization з AI-рекомендаціями
 * Дозволяє користувачам створювати персоналізовані дашборди
 */

import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Settings,
  Save,
  Eye,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Users,
  DollarSign,
  Package,
  Globe,
  Radio,
  FileText,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'map' | 'feed' | 'alert';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  icon: any;
  color: string;
}

const AVAILABLE_WIDGETS: Widget[] = [
  { id: 'w_sales', type: 'chart', title: 'Динаміка Продажів', size: 'large', icon: BarChart3, color: 'from-blue-600 to-indigo-600' },
  { id: 'w_active', type: 'metric', title: 'Активні Сесії', size: 'small', icon: Activity, color: 'from-emerald-500 to-green-600' },
  { id: 'w_geo', type: 'map', title: 'Географія Трафіку', size: 'large', icon: Globe, color: 'from-indigo-900 to-blue-900' },
  { id: 'w_rev', type: 'metric', title: 'Виручка (MRR)', size: 'small', icon: DollarSign, color: 'from-amber-500 to-orange-600' },
  { id: 'w_risks', type: 'chart', title: 'Аналіз  изиків', size: 'medium', icon: TrendingUp, color: 'from-rose-600 to-red-700' },
  { id: 'w_users', type: 'table', title: 'Топ Користувачі', size: 'medium', icon: Users, color: 'from-violet-600 to-purple-600' },
  { id: 'w_orders', type: 'metric', title: 'Замовлення', size: 'small', icon: Package, color: 'from-cyan-500 to-blue-500' },
  { id: 'w_perf', type: 'chart', title: 'Продуктивність', size: 'medium', icon: Zap, color: 'from-yellow-400 to-orange-500' },
  { id: 'w_news', type: 'feed', title: 'Стрічка Подій', size: 'medium', icon: FileText, color: 'from-slate-700 to-slate-600' },
  { id: 'w_alerts', type: 'alert', title: 'Системні Сповіщення', size: 'full', icon: AlertTriangle, color: 'from-red-900/50 to-red-800/50' }
];

export const DashboardBuilder: React.FC<{ onSave?: (config: any) => void }> = ({ onSave }) => {
  const [activeWidgets, setActiveWidgets] = useState<Widget[]>([
    AVAILABLE_WIDGETS[0],
    AVAILABLE_WIDGETS[1],
    AVAILABLE_WIDGETS[2],
    AVAILABLE_WIDGETS[3]
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);

  const addWidget = (widget: Widget) => {
    // Clone custom object to allow duplicates with unique IDs
    const newWidget = { ...widget, id: `${widget.id}_${Date.now()}` };
    setActiveWidgets([...activeWidgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setActiveWidgets(activeWidgets.filter(w => w.id !== id));
  };

  const getWidgetSize = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      case 'full': return 'col-span-4';
      default: return 'col-span-1';
    }
  };

  const handleSave = () => {
    if (onSave) onSave({ widgets: activeWidgets });
    setIsEditMode(false);
  };

  return (
    <div className="space-y-8 min-h-screen">
      {/* --- Control Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Конструктор Дашборду</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">PRO MODE</span>
               <p className="text-xs text-slate-500">Створіть свій ідеальний робочий простір</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAIRecommendations(!showAIRecommendations)}
            className="hidden md:flex px-4 py-2.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl text-purple-300 font-bold items-center gap-2 hover:bg-purple-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Помічник</span>
          </motion.button>

          <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block" />

          {isEditMode ? (
             <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Зберегти</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditMode(true)}
              className="px-6 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold flex items-center gap-2 hover:bg-slate-700 hover:border-slate-600 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Змінити</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* --- AI Assistance Section --- */}
      <AnimatePresence>
        {showAIRecommendations && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40 border border-purple-500/30 rounded-3xl p-6 relative">
              <div className="absolute inset-0 bg-noise opacity-10" />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  AI Аналіз:рекомендовані віджети
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {[
                      { title: 'Моніторинг Аномалій', reason: 'Виявлено нетипову активність у вхідних даних', icon: AlertTriangle, color: 'from-amber-600 to-red-600' },
                      { title: 'Прогноз Навантаження', reason: 'Очікується пік навантаження через 2 години', icon: Activity, color: 'from-cyan-600 to-blue-600' }
                   ].map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 hover:border-purple-500/50 transition-colors cursor-pointer"
                      >
                         <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${rec.color}`}>
                              <rec.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                               <div className="font-bold text-white text-sm">{rec.title}</div>
                               <div className="text-xs text-slate-400 mt-1">{rec.reason}</div>
                               <button className="text-purple-400 text-xs font-bold mt-2 hover:text-purple-300">
                                  + Додати на дашборд
                               </button>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Widget Library (Drawer) --- */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 bg-slate-900/30 p-6 rounded-3xl border border-dashed border-slate-700"
          >
             <div className="col-span-full mb-2 flex items-center gap-2 text-slate-400 text-sm font-medium">
                <Plus size={16} /> Перетягніть або клікніть, щоб додати віджет
             </div>
             {AVAILABLE_WIDGETS.map((widget) => (
               <motion.button
                 key={widget.id}
                 whileHover={{ scale: 1.05, y: -2 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => addWidget(widget)}
                 className={`relative overflow-hidden group bg-gradient-to-br ${widget.color} rounded-2xl p-4 text-white text-left shadow-lg hover:shadow-2xl transition-all h-24 flex flex-col justify-between`}
               >
                 <div className="absolute right-0 top-0 p-2 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    <Plus className="w-5 h-5" />
                 </div>
                 <widget.icon className="w-6 h-6 opacity-80" />
                 <div className="font-bold text-xs shadow-black/50 drop-shadow-md">{widget.title}</div>
               </motion.button>
             ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GRID LAYOUT --- */}
      <Reorder.Group
        axis="y"
        values={activeWidgets}
        onReorder={setActiveWidgets}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
      >
        {activeWidgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            className={`${getWidgetSize(widget.size)} relative`}
          >
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`h-full min-h-[180px] bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-600 transition-all shadow-xl ${isEditMode ? 'cursor-move ring-2 ring-transparent hover:ring-cyan-500/50' : ''}`}
            >
              {/* Background Gradient Spot */}
              <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${widget.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

              {/* Edit Controls */}
              {isEditMode && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors z-20"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}

              {/* Content Header */}
              <div className="flex items-start justify-between relative z-10 mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${widget.color} shadow-lg shadow-black/20`}>
                       <widget.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight">{widget.title}</h3>
                 </div>

                 {/* Live Indicator Mockup */}
                 {!isEditMode && (
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-500">LIVE</span>
                   </div>
                 )}
              </div>

              {/* Mock Content Visualization */}
              <div className="relative z-10 w-full h-[calc(100%-60px)] rounded-2xl bg-black/20 border border-white/5 flex items-center justify-center overflow-hidden">
                  {widget.type === 'chart' && (
                     <div className="w-full h-full flex items-end justify-between px-4 pb-4 gap-1">
                        {[40, 70, 45, 90, 60, 80, 50, 95].map((h, i) => (
                           <motion.div
                              key={i}
                              className={`w-full rounded-t-md bg-gradient-to-t ${widget.color} opacity-80`}
                              initial={{ height: '10%' }}
                              animate={{ height: `${h}%` }}
                              transition={{ duration: 1, delay: i * 0.1, repeat: Infinity, repeatType: 'reverse', repeatDelay: 2 }}
                           />
                        ))}
                     </div>
                  )}

                  {widget.type === 'metric' && (
                     <div className="text-center">
                        <div className="text-4xl font-black text-white tracking-tighter">
                           { Math.floor(Math.random() * 5000) + 1200 }
                        </div>
                        <div className={`text-sm font-bold mt-1 flex items-center justify-center gap-1 ${Math.random() > 0.3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {Math.random() > 0.3 ? <TrendingUp size={14}/> : <TrendingUp size={14} className="rotate-180" />}
                           { (Math.random() * 10).toFixed(1) }%
                        </div>
                     </div>
                  )}

                  {widget.type === 'map' && (
                     <div className="w-full h-full opacity-30 flex items-center justify-center">
                        <Globe className="w-24 h-24 text-blue-400 animate-pulse" />
                     </div>
                  )}

                  {(widget.type === 'table' || widget.type === 'feed') && (
                     <div className="w-full h-full p-4 space-y-2">
                        {[1,2,3].map(i => (
                           <div key={i} className="flex items-center gap-3 pb-2 border-b border-white/5 last:border-0">
                              <div className="w-8 h-8 rounded-full bg-white/10" />
                              <div className="flex-1 space-y-1">
                                 <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                                 <div className="h-2 w-1/3 bg-white/5 rounded-full" />
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* --- Empty State --- */}
      {activeWidgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-bounce">
             <LayoutDashboard className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2"> обочий простір порожній</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
             Ваш дашборд готовий до наповнення. Натисніть кнопку "Змінити", щоб додати перші метрики.
          </p>
          <button
            onClick={() => setIsEditMode(true)}
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-white font-bold shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/50 transition-all transform hover:scale-105"
          >
            Створити Дашборд
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardBuilder;
