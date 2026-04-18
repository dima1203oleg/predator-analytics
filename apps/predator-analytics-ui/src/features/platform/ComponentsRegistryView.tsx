/**
 * Predator v45 | Neural Analytics- Реєстр Компонентів (CU-PIE Engine Managed)
 *
 * Component Utilization & Pipeline Integrity Engine
 * Відображає реальний статус 200+ компонентів, базуючись на їх фактичному залученні в пайплайнах.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Component, Cpu,
  Globe,
  Info,
  Search,
  Shield,
  Workflow,
  XCircle
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { CATEGORIES, COMPONENT_REGISTRY, PredatorComponent, SYSTEM_STATS } from '@/config/componentRegistry';
import { componentsLocales as t } from '@/locales/uk/autonomy';

export const ComponentsRegistryView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use the pre-calculated stats from the registry
  const stats = SYSTEM_STATS;

  const filteredCategories = useMemo(() => {
    const categories = Object.values(CATEGORIES);
    const result = categories.map(cat => ({
      ...cat,
      components: COMPONENT_REGISTRY.filter(c => c.category === cat.id)
    })).filter(cat => selectedCategory === 'all' || cat.id === selectedCategory);

    return result;
  }, [selectedCategory]);

  const getStatusIcon = (status: PredatorComponent['status']) => {
    if (status.health === 'degraded') return <AlertTriangle size={14} className="text-amber-400" />;
    if (status.health === 'offline') return <XCircle size={14} className="text-amber-400" />;

    // Healthy logic: must be used to be fully green
    if (status.used) return <CheckCircle size={14} className="text-emerald-400" />;
    return <Info size={14} className="text-blue-400" />; // Idle but declared
  };

  const getUsageBadge = (status: PredatorComponent['status']) => {
    if (!status.deployed) return <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded">НЕ ВСТАНОВЛЕНО</span>;
    if (status.used) return <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">АКТИВНИЙ В ПАЙПЛАЙНІ</span>;
    return <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">ОЧІКУВАННЯ / IDLE</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div
              className="p-5 rounded-3xl bg-gradient-to-br from-purple-500 to-yellow-600 shadow-2xl shadow-purple-500/20"
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cpu size={36} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">CU-PIE Registry</h1>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Activity size={16} className="text-emerald-400" />
                <span className="text-white font-bold">Component Utilization & Pipeline Integrity Engine</span>
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-5 py-2 bg-slate-700/50 rounded-xl">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">КОМПОНЕНТИ</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2">
              <span className="text-2xl font-bold text-emerald-400">{stats.active}</span>
              <span className="text-xs font-bold text-emerald-500/70 uppercase tracking-wider">АКТИВНІ</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2">
              <span className="text-2xl font-bold text-amber-400">{stats.unused}</span>
              <span className="text-xs font-bold text-amber-500/70 uppercase tracking-wider">В ОЧІКУВАННІ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex gap-4 mb-8 sticky top-4 z-50">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-md" />
          <div className="relative flex items-center bg-slate-900/90 border border-slate-700/50 rounded-2xl backdrop-blur-xl">
            <Search size={20} className="absolute left-4 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук компонентів, ролей або пайплайнів..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="relative group min-w-[250px]">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-md" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-full relative z-10 appearance-none bg-slate-900/90 border border-slate-700/50 rounded-2xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer"
          >
            <option value="all">Всі Шари</option>
            {Object.values(CATEGORIES).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Categories Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3 mb-8">
        {Object.values(CATEGORIES).map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count = COMPONENT_REGISTRY.filter(c => c.category === cat.id).length;
          return (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden p-3 rounded-2xl text-center transition-all border ${isSelected
                ? `bg-slate-800 border-${cat.color}-500 shadow-lg shadow-${cat.color}-500/20`
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                }`}
            >
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-10`} />
              )}
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${isSelected ? `bg-${cat.color}-500 text-white` : `bg-slate-700/50 text-${cat.color}-400`
                }`}>
                <Icon size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-300 truncate uppercase tracking-wide mb-1">
                {cat.name.split(' ')[0]}
              </div>
              <div className={`text-lg font-black ${isSelected ? `text-${cat.color}-400` : 'text-slate-500'}`}>
                {count}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredCategories.map(category => {
            const Icon = category.icon;
            const filteredComponents = category.components.filter(comp =>
              searchQuery === '' ||
              comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              comp.roles.some(r => r.includes(searchQuery.toLowerCase()))
            );

            if (filteredComponents.length === 0) return null;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 rounded-[32px] overflow-hidden"
              >
                {/* Category Header */}
                <div className="p-6 border-b border-slate-700/30 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${category.gradient} shadow-lg shadow-${category.color}-500/20`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{category.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                        <span className="text-sm text-slate-400 font-medium">
                          {category.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full bg-${category.color}-500/10 border border-${category.color}-500/20 text-${category.color}-400 text-sm font-bold`}>
                    ШАР: {filteredComponents[0]?.layer.toUpperCase()}
                  </div>
                </div>

                {/* Components Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredComponents.map((comp, idx) => {
                    const [isExpanded, setIsExpanded] = useState(false);

                    return (
                      <motion.div
                        key={comp.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`group relative bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-slate-800/80 hover:border-slate-600 ${isExpanded ? 'col-span-1 md:col-span-2 row-span-2 bg-slate-800 border-cyan-500/50 z-10' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${category.color}-500/10 text-${category.color}-400 group-hover:bg-${category.color}-500 group-hover:text-white transition-colors`}>
                              <Component size={18} />
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {comp.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                  {comp.version}
                                </div>
                                {getUsageBadge(comp.status)}
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            {getStatusIcon(comp.status)}
                            {comp.status.used && comp.status.health === 'healthy' && (
                              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20" />
                            )}
                          </div>
                        </div>

                        <p className={`text-sm text-slate-400 leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-2 h-10'}`}>
                          {comp.description}
                        </p>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-slate-700/50 space-y-3"
                          >
                            {/* Roles */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {comp.roles.map(role => (
                                <span key={role} className="text-[10px] bg-slate-900/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">
                                  {role}
                                </span>
                              ))}
                            </div>

                            {/* Pipeline Usage Breakdown */}
                            {comp.status.used ? (
                              <div className="bg-slate-900/50 p-3 rounded-xl border border-emerald-500/20">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-2">
                                  <Workflow size={12} />
                                  <span>Активне Використання</span>
                                </div>
                                <div className="space-y-1">
                                  {comp.used_in.map((u, i) => (
                                    <div key={i} className="flex justify-between text-[10px]">
                                      <span className="text-white">{u.pipelineId}</span>
                                      <span className="text-slate-500 font-mono">Етап: {u.stageId}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-900/50 p-3 rounded-xl border border-amber-500/20">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                                  <AlertTriangle size={12} />
                                  <span>Нульова Утилізація</span>
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  Компонент визначено, але не підключено до жодного активного пайплайну даних. Рекомендовано до видалення або активації.
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${comp.license.includes('Apache') ? 'bg-emerald-500/10 text-emerald-400' :
                                comp.license.includes('MIT') ? 'bg-blue-500/10 text-blue-400' :
                                  'bg-slate-700/50 text-slate-400'
                                }`}>
                                {comp.license}
                              </span>

                            </div>

                            <button className="w-full py-2 bg-slate-700/30 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                              <Globe size={12} />
                              Документація
                            </button>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                          {/* Required For Tags */}
                          <div className="flex -space-x-1 overflow-hidden max-w-[80%]">
                            {comp.required_for.map((req, r_idx) => (
                              <div key={req} className="w-4 h-4 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[8px] text-white" title={`Required for: ${req}`}>
                                {req[0].toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Stats & Copyright */}
      <div className="mt-12">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-3xl col-span-2 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-4">{t.license.title}</h3>
              <div className="space-y-4">
                {[
                  { label: 'Apache 2.0', val: 62, color: 'bg-emerald-500' },
                  { label: 'MIT', val: 28, color: 'bg-blue-500' },
                  { label: 'GPL/AGPL', val: 8, color: 'bg-purple-500' }
                ].map(l => (
                  <div key={l.label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">{l.label}</span>
                      <span className="text-white">{l.val}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${l.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${l.val}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-500/10 blur-3xl" />
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-purple-700 p-6 rounded-3xl col-span-2 text-white flex items-center justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">Open Source Power</h3>
              <p className="opacity-90 max-w-sm text-sm leading-relaxed text-yellow-100">
                Predator v45 | Neural Analyticsпобудований на плечах гігантів. <br />
                200+ компонентів інтегровано в єдину екосистему.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-yellow-500 flex items-center justify-center">
                      <Globe size={14} className="text-white" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-bold pl-2">+150 Contributors</span>
              </div>
            </div>
            <div className="relative z-10">
              <Cpu size={80} className="text-white/20 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Legal Footer */}
        <div className="text-center py-6 border-t border-slate-800/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={16} className="text-slate-500" />
            <span className="text-sm font-bold text-slate-400">Ліцензія та Авторське Право</span>
          </div>
          <p className="text-slate-500 text-sm">
            Програмний комплекс "Predator v45 | Neural Analytics" є інтелектуальною власністю.
          </p>
          <p className="text-slate-400 font-medium mt-1">
            Власник: <span className="text-white">Кізима Дмитро Миколайович</span> (12.03.1985 р.н.)
          </p>
          <p className="text-slate-600 text-xs mt-2 font-mono">
            © 2024-2026 All Rights Reserved • Patent Pending
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComponentsRegistryView;
