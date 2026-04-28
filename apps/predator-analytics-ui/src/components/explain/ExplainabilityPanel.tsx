import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Scale, GitBranch, Search, Shield, AlertTriangle,
  ArrowRight, CheckCircle, Layers, Database, Link2,
  FileText, Activity, ChevronDown
} from 'lucide-react';

interface ExplanationFactor {
  type: 'rule' | 'graph' | 'semantic' | 'data';
  id?: string;
  description: string;
  weight: number;
  evidence?: string;
}

interface GraphPath {
  nodes: Array<{
    id: string;
    type: string;
    name: string;
  }>;
  relationship: string;
  weight: number;
}

interface Explanation {
  id: string;
  entity_id: string;
  decision_type: string;
  confidence: number;
  factors: ExplanationFactor[];
  graph_paths?: GraphPath[];
  timestamp: string;
}

interface ExplainabilityPanelProps {
  entityId: string;
  entityName: string;
  decision: string;
  riskScore?: number;
  explanation?: Explanation;
}

const FACTOR_ICONS: Record<string, any> = {
  rule: Shield,
  graph: GitBranch,
  semantic: Brain,
  data: Database,
};

const FACTOR_COLORS: Record<string, string> = {
  rule: 'cyan',
  graph: 'pink',
  semantic: 'indigo',
  data: 'emerald',
};

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  entityId,
  entityName,
  decision,
  riskScore = 0,
  explanation,
}) => {
  // Mock explanation if not provided
  const mockExplanation: Explanation = explanation || {
    id: 'exp-001',
    entity_id: entityId,
    decision_type: decision,
    confidence: 0.87,
    factors: [
      {
        type: 'rule',
        id: 'fraud_round_numbers',
        description: 'Спрацювало правило: Підозрілі круглі суми',
        weight: 0.3,
        evidence: 'Сума $500,000.00 є кратною 100k'
      },
      {
        type: 'graph',
        description: 'Зв\'язок у графі: Компанія пов\'язана з 3 компаніями з попередніми порушеннями',
        weight: 0.25,
        evidence: '2-hop зв\'язок через спільного директора'
      },
      {
        type: 'semantic',
        description: 'Семантична схожість з підозрілими деклараціями',
        weight: 0.2,
        evidence: 'cosine similarity: 0.89'
      },
      {
        type: 'data',
        description: 'Історія: 5 попередніх декларацій з аномаліями',
        weight: 0.12,
      }
    ],
    graph_paths: [
      {
        nodes: [
          { id: 'c1', type: 'company', name: 'ТОВ " ОМАШКА"' },
          { id: 'p1', type: 'person', name: 'Іванов І.І.' },
          { id: 'c2', type: 'company', name: 'ПП "ФІКУС"' },
        ],
        relationship: 'HAS_DIRECTOR → IS_DIRECTOR_OF',
        weight: 0.8
      },
      {
        nodes: [
          { id: 'c1', type: 'company', name: 'ТОВ " ОМАШКА"' },
          { id: 'a1', type: 'address', name: 'вул. Хрещатик 1' },
          { id: 'c3', type: 'company', name: 'ТОВ "ТЮЛЬПАН"' },
        ],
        relationship: 'REGISTERED_AT → REGISTERED_AT',
        weight: 0.6
      }
    ],
    timestamp: new Date().toISOString()
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'rose';
    if (score >= 50) return 'amber';
    if (score >= 20) return 'yellow';
    return 'emerald';
  };

  const riskColor = getRiskColor(riskScore);

  return (
    <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <Brain size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ПОЯСНЕННЯ  ІШЕННЯ</h2>
              <p className="text-sm text-slate-400">Explainability Layer</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-${riskColor}-500/20 border border-${riskColor}-500/30`}>
            <Activity size={18} className={`text-${riskColor}-400`} />
            <span className={`text-lg font-bold text-${riskColor}-400`}>{riskScore}</span>
            <span className="text-sm text-slate-400">Risk Score</span>
          </div>
        </div>

        {/* Entity Info */}
        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase">Сутність</span>
              <h3 className="text-lg font-bold text-white">{entityName}</h3>
              <span className="text-xs text-slate-500 font-mono">{entityId}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase"> ішення</span>
              <p className={`text-lg font-bold text-${riskColor}-400`}>{decision}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Впевненість системи
          </span>
          <span className="text-2xl font-bold text-white">
            {(mockExplanation.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${mockExplanation.confidence * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* Factors */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Scale size={16} />
            Фактори рішення
          </h4>

          <div className="space-y-3">
            {mockExplanation.factors.map((factor, index) => {
              const Icon = FACTOR_ICONS[factor.type] || FileText;
              const color = FACTOR_COLORS[factor.type] || 'slate';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${color}-500/20 flex-shrink-0`}>
                      <Icon size={18} className={`text-${color}-400`} />
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase text-${color}-400`}>
                          {factor.type === 'rule' ? 'Правило' :
                           factor.type === 'graph' ? 'Граф' :
                           factor.type === 'semantic' ? 'Семантика' : 'Дані'}
                        </span>
                        <span className="text-sm font-bold text-white">
                          +{(factor.weight * 100).toFixed(0)} балів
                        </span>
                      </div>

                      <p className="text-slate-300 mt-1">{factor.description}</p>

                      {factor.evidence && (
                        <p className="text-xs text-slate-500 mt-2 font-mono">
                          📎 {factor.evidence}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Weight Bar */}
                  <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.weight * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      className={`h-full bg-${color}-500 rounded-full`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Graph Paths */}
        {mockExplanation.graph_paths && mockExplanation.graph_paths.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <GitBranch size={16} />
              Шляхи у графі
            </h4>

            <div className="space-y-4">
              {mockExplanation.graph_paths.map((path, index) => (
                <div key={index} className="bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {path.nodes.map((node, nodeIndex) => (
                      <React.Fragment key={node.id}>
                        <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${
                          node.type === 'company' ? 'bg-blue-500/20' :
                          node.type === 'person' ? 'bg-emerald-500/20' :
                          'bg-amber-500/20'
                        }`}>
                          <span className={`text-[10px] uppercase ${
                            node.type === 'company' ? 'text-blue-400' :
                            node.type === 'person' ? 'text-emerald-400' :
                            'text-amber-400'
                          }`}>
                            {node.type}
                          </span>
                          <span className="text-xs text-white font-medium whitespace-nowrap">
                            {node.name}
                          </span>
                        </div>

                        {nodeIndex < path.nodes.length - 1 && (
                          <ArrowRight size={16} className="text-slate-600 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">
                      {path.relationship}
                    </span>
                    <span className={`text-xs font-bold ${
                      path.weight > 0.7 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      Вага: {(path.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
          <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText size={16} />
            Підсумок
          </h4>
          <p className="text-slate-300">
            Система прийняла рішення "<strong>{decision}</strong>" на основі аналізу{' '}
            {mockExplanation.factors.length} факторів з загальною впевненістю{' '}
            <strong>{(mockExplanation.confidence * 100).toFixed(0)}%</strong>.
            {mockExplanation.graph_paths && mockExplanation.graph_paths.length > 0 && (
              <> Виявлено {mockExplanation.graph_paths.length} релевантних зв'язків у графі знань.</>
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          Explanation ID: {mockExplanation.id}
        </span>
        <span className="text-xs text-slate-500">
          {new Date(mockExplanation.timestamp).toLocaleString('uk-UA')}
        </span>
      </div>
    </div>
  );
};

export default ExplainabilityPanel;
