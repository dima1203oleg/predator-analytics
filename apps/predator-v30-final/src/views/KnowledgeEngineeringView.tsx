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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow, Shield, Users, GitBranch, Activity,
  Scale, FileText, UserCheck, DollarSign,
  Settings, Zap, RefreshCw
} from 'lucide-react';

// Import sub-components
import { ReviewQueue } from '../components/review/ReviewQueue';
import { ExplainabilityPanel } from '../components/explain/ExplainabilityPanel';
import { DataQualityDashboard } from '../components/quality/DataQualityDashboard';

// Tab configuration for 9 layers
const KNOWLEDGE_TABS = [
  { id: 'workflow', label: 'Workflow FSM', icon: Workflow, description: 'State Machine & Orchestration' },
  { id: 'quality', label: 'Data Quality', icon: Shield, description: 'DQ Engine & Validation' },
  { id: 'entities', label: 'Entity Resolution', icon: Users, description: 'Dedupe & Matching' },
  { id: 'versioning', label: 'Versioning', icon: GitBranch, description: 'Data Versions & Reprocessing' },
  { id: 'observability', label: 'Observability', icon: Activity, description: 'Data Metrics & Pipeline Health' },
  { id: 'rules', label: 'Rules Engine', icon: Scale, description: 'Business Rules & Policies' },
  { id: 'explain', label: 'Explainability', icon: FileText, description: 'Audit Trail & Decisions' },
  { id: 'human', label: 'Human Review', icon: UserCheck, description: 'Human-in-the-Loop Queue' },
  { id: 'costs', label: 'Cost Governor', icon: DollarSign, description: 'Budgets & Rate Limits' },
];

export const KnowledgeEngineeringView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quality');

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
            entityName="TOV ROMASHKA"
            decision="High Risk"
            riskScore={78}
          />
        );

      case 'workflow':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Pipeline State Machine</h3>
            <div className="grid grid-cols-6 gap-2">
              {['CREATED', 'SOURCE_CHECKED', 'INGESTED', 'PARSED', 'VALIDATED',
                'TRANSFORMED', 'ENTITIES_RESOLVED', 'LOADED', 'GRAPH_BUILT',
                'INDEXED', 'VECTORIZED', 'READY'].map((state, i) => (
                <motion.div
                  key={state}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg text-center text-xs font-bold uppercase ${
                    state === 'READY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                    state === 'VALIDATED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {state.replace('_', ' ')}
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <p className="text-slate-400 text-sm">
                FSM manages state transitions. Parallel stages allowed.
                Rollback supported on FAILED.
              </p>
            </div>
          </div>
        );

      case 'entities':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Entity Resolution Engine</h3>
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-emerald-400 font-bold">Potential Match</span>
                  <span className="text-lg font-bold text-white">87%</span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1 p-3 bg-blue-500/20 rounded-lg text-center">
                    <p className="text-blue-400 text-xs uppercase">Entity A</p>
                    <p className="text-white font-medium">TOV ROMASHKA</p>
                  </div>
                  <RefreshCw size={20} className="text-cyan-400" />
                  <div className="flex-1 p-3 bg-blue-500/20 rounded-lg text-center">
                    <p className="text-blue-400 text-xs uppercase">Entity B</p>
                    <p className="text-white font-medium">ROMASHKA LLC</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">Same address</span>
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">Same director</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Rules Engine</h3>
            <div className="space-y-3">
              {[
                { id: 'fraud_round', name: 'Suspicious round amounts', category: 'fraud', enabled: true },
                { id: 'sanctions_country', name: 'Sanctioned country', category: 'sanctions', enabled: true },
                { id: 'duplicate_decl', name: 'Duplicate declaration', category: 'quality', enabled: true },
                { id: 'hs_mismatch', name: 'Invalid HS code', category: 'customs', enabled: false },
              ].map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <h4 className="text-white font-medium">{rule.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      rule.category === 'fraud' ? 'bg-rose-500/20 text-rose-400' :
                      rule.category === 'sanctions' ? 'bg-amber-500/20 text-amber-400' :
                      rule.category === 'customs' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {rule.category}
                    </span>
                  </div>
                  <button
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      rule.enabled ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                    aria-label={`Toggle ${rule.name}`}
                  >
                    <motion.div
                      animate={{ x: rule.enabled ? 24 : 0 }}
                      className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Cost & Load Governor</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { resource: 'LLM API', used: 12.45, limit: 50, color: 'emerald' },
                { resource: 'Embeddings', used: 3.20, limit: 20, color: 'blue' },
                { resource: 'Scraping', used: 1.80, limit: 10, color: 'amber' },
                { resource: 'Telegram', used: 0, limit: 5, color: 'cyan' },
              ].map(item => (
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
                    Limit: ${item.limit}/day
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6 text-center">
            <Settings size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Section in development</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Zap size={28} className="text-white" />
          </div>
          Knowledge Engineering
        </h1>
        <p className="text-slate-400 mt-2 ml-16">
          9 critical layers of knowledge formation system
        </p>
      </div>

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
              className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-500/50 text-white'
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
