/**
 * PREDATOR Knowledge Engineering View
 *
 * Unified view for the 9 critical layers:
 * 1. Workflow / State Machine
 * 2. Data Quality Engine
 * 3. Entity Resolution
 * 4. Data Versioning
 * 5. Data Observability
 * 6. Rules Engine
 * 7. Explainability & Audit
 * 8. Human-in-the-Loop
 * 9. Cost Governor
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import {
  Workflow, Shield, Users, GitBranch, Activity,
  Scale, FileText, UserCheck, DollarSign,
  Settings, Zap, RefreshCw, Database, Globe, Server
} from 'lucide-react';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { ViewHeader } from '@/components/ViewHeader';

// Import sub-components
import { ReviewQueue } from '@/components/review/ReviewQueue';
import { ExplainabilityPanel } from '@/components/explain/ExplainabilityPanel';
import { DataQualityDashboard } from '@/components/quality/DataQualityDashboard';

// Tab configuration for 9 layers
const KNOWLEDGE_TABS = [
  { id: 'workflow', label: 'Воркфлоу FSM', icon: Workflow, description: 'Машина станів та оркестрація' },
  { id: 'quality', label: 'Якість Даних', icon: Shield, description: 'DQ Engine та валідація' },
  { id: 'entities', label: 'Вирішення Сутностей', icon: Users, description: 'Дедуплікація та матчинг' },
  { id: 'versioning', label: 'Версіонування', icon: GitBranch, description: 'Версії даних та репроцесинг' },
  { id: 'observability', label: 'Обсервабіліті', icon: Activity, description: 'Метрики та здоров’я пайплайнів' },
  { id: 'rules', label: 'Машина Правил', icon: Scale, description: 'Бізнес-правила та політики' },
  { id: 'explain', label: 'Пояснюваність', icon: FileText, description: 'Аудит та обґрунтування рішень' },
  { id: 'human', label: '� учна Перевірка', icon: UserCheck, description: 'Черга ручної перевірки (HITL)' },
  { id: 'costs', label: 'Контроль Витрат', icon: DollarSign, description: 'Бюджети та ліміти' },
];

export const KnowledgeEngineeringView: React.FC = () => {
  const { isOffline, nodeSource } = useBackendStatus();
  const [activeTab, setActiveTab] = useState('quality');
  const [rules, setRules] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOffline) {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'Knowledge_Engineering',
          message: 'ПОМИЛКА ЗВ’ЯЗКУ З ІНЖЕНЕ� НИМ КОНТУ� ОМ (KNOWLEDGE_OFFLINE). Активовано локальний кеш правил.',
          severity: 'warning',
          timestamp: new Date().toISOString(),
          code: 'KNOWLEDGE_OFFLINE'
        }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('predator-error', {
        detail: {
          service: 'Knowledge_Engineering',
          message: 'ІНЖЕНЕ� НИЙ КОНТУ�  СИНХ� ОНІЗОВАНО (KNOWLEDGE_SUCCESS). Дані валідації актуальні.',
          severity: 'info',
          timestamp: new Date().toISOString(),
          code: 'KNOWLEDGE_SUCCESS'
        }
      }));
    }
  }, [isOffline]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesData, costsData] = await Promise.all([
          api.premium.getRules(),
          api.premium.getCosts()
        ]);
        setRules(rulesData);
        setCosts(costsData);
      } catch (err) {
        console.error("Failed to fetch knowledge engineering data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'quality':
        return <DataQualityDashboard jobId="demo-job-123" />;

      case 'human':
        return <ReviewQueue />;

      case 'explain':
        return (
          <ExplainabilityPanel
            entityId="comp-123"
            entityName="ТОВ � ОМАШКА"
            decision="Високий � изик"
            riskScore={78}
          />
        );

      case 'workflow':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Машина Станів Пайплайну</h3>
            <div className="grid grid-cols-6 gap-2">
              {['СТВО� ЕНО', 'ДЖЕ� ЕЛО_ПЕ� ЕВІ� ЕНО', 'ІНГЕСТІЯ', 'ПА� СИНГ', 'ВАЛІДАЦІЯ',
                'Т� АНСФО� МАЦІЯ', 'ОБ’ЄКТИ_ВИ� ІШЕНІ', 'ЗАВАНТАЖЕНО', 'Г� АФ_ПОБУДОВАНО',
                'ІНДЕКСОВАНО', 'ВЕКТО� ОВАНО', 'ГОТОВО'].map((state, i) => (
                  <motion.div
                    key={state}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-3 rounded-lg text-center text-xs font-bold uppercase ${state === 'ГОТОВО' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' :
                      state === 'ВАЛІДАЦІЯ' ? 'bg-rose-900/40 text-rose-300 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                  >
                    {state.replace('_', ' ')}
                  </motion.div>
                ))}
            </div>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <p className="text-slate-400 text-sm">
                FSM керує переходами станів. Дозволені паралельні етапи.
                Підтримка відкату при ПОМИЛЦІ.
              </p>
            </div>
          </div>
        );

      case 'entities':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <Users className="text-rose-500" />
              Двигун Вирішення Сутностей (Entity Resolution)
            </h3>

            <div className="space-y-6">
              {/* Match Card */}
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-black block mb-1 tracking-widest">� ейтинг Довіри</span>
                    <span className="text-4xl font-black text-rose-500">94.2%</span>
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-10 items-center relative z-10">
                  <div className="flex-1 w-full p-6 bg-slate-950/50 rounded-2xl border border-rose-500/20">
                    <span className="text-[10px] text-rose-400 uppercase font-black tracking-[0.2em] block mb-3">Об'єкт А (Тір 1/2)</span>
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight">ТОВ "� ОМАШКА ІНВЕСТ"</h4>
                    <p className="text-xs text-slate-500 mt-2 font-mono">ЄД� ПОУ: 12345678</p>
                    <div className="mt-4 flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold border border-rose-500/20 uppercase">ТО� ГОВІ ДАНІ АКТИВНІ</span>
                      <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[9px] font-bold border border-yellow-500/20 uppercase">� ЕЄСТ�  ВЕ� ИФІКОВАНО</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30">
                      <RefreshCw size={32} className="text-rose-400 animate-spin-slow" />
                    </div>
                    <span className="text-[10px] text-rose-400 font-black uppercase tracking-[0.3em]">CROSS-FUSION</span>
                  </div>

                  <div className="flex-1 w-full p-6 bg-slate-950/50 rounded-2xl border border-yellow-500/20">
                    <span className="text-[10px] text-yellow-400 uppercase font-black tracking-[0.2em] block mb-3">Об'єкт Б (Тір 3)</span>
                    <h4 className="text-xl font-bold text-white uppercase tracking-tight">ROMASHKA INVESTMENT LLC</h4>
                    <p className="text-xs text-slate-500 mt-2 font-mono">LEI: 549300V55...</p>
                    <div className="mt-4 flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-900/20 text-rose-300 text-[9px] font-bold border border-rose-500/20 uppercase">OSINT П� ОФІЛЬ ЗБІГАЄТЬСЯ</span>
                    </div>
                  </div>
                </div>

                {/* 3-Tier Proof Breakdown */}
                <div className="mt-10 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3 text-rose-400">
                      <Zap size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">1️⃣ Тір: Економічні Потоки</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Збіг адрес доставки та вантажоодержувачів у митних деклараціях (Customs/Logistics Fusion)</p>
                  </div>

                  <div className="p-5 bg-yellow-500/5 rounded-2xl border border-yellow-500/20 hover:bg-yellow-500/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3 text-yellow-400">
                      <Database size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">2️⃣ Тір: Інституційні � еєстри</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Ідентичний склад бенефіціарів у реєстрах ЄД�  та зв'язок через судові провадження (Court/EDR Match)</p>
                  </div>

                  <div className="p-5 bg-rose-900/20 rounded-2xl border border-rose-500/20 hover:bg-rose-900/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3 text-rose-300">
                      <Globe size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wider">3️⃣ Тір: Контексний OSINT</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Афіліація через спільні контактні дані у Telegram витоках та медіа-згадках у розслідуваннях</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button className="px-6 py-2 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm hover:text-white transition-colors uppercase tracking-widest">Немає Збігу</button>
                <button className="px-6 py-2 bg-gradient-to-r from-rose-600 to-rose-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 uppercase tracking-widest">Об'єднати Сутності</button>
              </div>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Машина Правил (Rules Engine)</h3>
            <div className="space-y-3">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-800 animate-pulse rounded-xl" />)
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div>
                      <h4 className="text-white font-medium">{rule.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${rule.category === 'fraud' ? 'bg-rose-500/20 text-rose-400' :
                        rule.category === 'sanctions' ? 'bg-rose-500/20 text-rose-400' :
                          rule.category === 'customs' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-slate-700 text-slate-400'
                        }`}>
                        {rule.category}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${rule.enabled ? 'bg-rose-500' : 'bg-slate-600'
                        }`}
                      aria-label={`Перемкнути ${rule.name}`}
                    >
                      <motion.div
                        animate={{ x: rule.enabled ? 24 : 0 }}
                        className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Контроль Витрат та Навантаження</h3>
            <div className="grid grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-800 animate-pulse rounded-xl" />)
              ) : (
                costs.map(item => (
                  <div key={item.resource} className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">{item.resource}</span>
                      <span className="text-white font-bold">${item.used.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.used / item.limit) * 100}%` }}
                        className={`h-full bg-${item.color}-500`}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ліміт: ${item.limit}/день
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6 text-center">
            <Settings size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">� озділ у розробці</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <ViewHeader
        title="Інженерія Знань"
        subtitle="9 критичних рівнів формування знань економічного інтелекту"
        icon={<Zap size={20} className="text-white" />}
        breadcrumbs={['ШІ', 'ІНЖЕНЕ� ІЯ ЗНАНЬ']}
        stats={[
          { label: 'ДЖЕ� ЕЛО', value: nodeSource, icon: <Server size={14} />, color: isOffline ? 'warning' : 'gold' },
          { label: '� ІВЕНЬ', value: KNOWLEDGE_TABS.find(t => t.id === activeTab)?.label || '...', icon: <Database size={14} />, color: 'primary' },
          { label: 'П� АВИЛА', value: rules.length.toString(), icon: <Scale size={14} />, color: 'success' },
        ]}
      />

      {/* Tab Navigation */}
      <div className="grid grid-cols-9 gap-2 mb-6">
        {KNOWLEDGE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${isActive
                ? 'bg-gradient-to-br from-rose-500/30 to-rose-900/30 border-2 border-rose-500/50 text-white'
                : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-tight">
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default KnowledgeEngineeringView;
