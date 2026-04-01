/**
 * 🏗️ ScenarioBuilderPremium V2 — Конструктор сценаріїв з наглядом
 * Drag-and-drop конструктор з live превью результатів
 * ТЗ 11.3 | Python 3.12 | 100% Українська
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Eye,
  Play,
  Save,
  Copy,
  Share2,
  ChevronDown,
  ChevronUp,
  Zap,
  Package,
  DollarSign,
  Shield,
  TrendingDown,
  Clock,
  Filter,
  Settings,
  GitBranch,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ============ ТИПИ ============

interface ScenarioStep {
  id: string;
  type: 'input' | 'filter' | 'calculate' | 'validate' | 'output';
  label: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: ScenarioStep[];
  category: 'procurement' | 'risk' | 'customs' | 'logistics' | 'custom';
}

// ============ MOCK-ДАНІ ============

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Оптимізація закупівель',
    description: 'Найти найдешевшого постачальника з мінімальним ризиком',
    icon: '🛒',
    category: 'procurement',
    steps: [
      { id: 's1', type: 'input', label: 'Вхідні дані товару', config: { field: 'product_name' }, enabled: true },
      { id: 's2', type: 'filter', label: 'Фільтр по країні', config: { field: 'country', value: 'China' }, enabled: true },
      { id: 's3', type: 'calculate', label: 'Розрахунок цін', config: { include_logistics: true }, enabled: true },
      { id: 's4', type: 'validate', label: 'Перевірка санкцій', config: { check_sanctions: true }, enabled: true },
      { id: 's5', type: 'output', label: 'Результат', config: { format: 'full' }, enabled: true },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Аудит контрагента',
    description: 'Повна перевірка контрагента на ризики та комплаєнс',
    icon: '🔍',
    category: 'risk',
    steps: [
      { id: 's1', type: 'input', label: 'EDRPOU', config: { field: 'edrpou' }, enabled: true },
      { id: 's2', type: 'filter', label: 'Санкційні списки', config: { lists: ['eu', 'usa', 'ukraine'] }, enabled: true },
      { id: 's3', type: 'filter', label: 'Реєстри банкротств', config: { check_bankruptcy: true }, enabled: true },
      { id: 's4', type: 'calculate', label: 'Risk Score', config: { algorithm: 'ml' }, enabled: true },
      { id: 's5', type: 'output', label: 'Звіт', config: { format: 'full' }, enabled: true },
    ],
  },
];

const STEP_TYPES = [
  { value: 'input', label: 'Вхідні дані', icon: '📥' },
  { value: 'filter', label: 'Фільтр', icon: '🔎' },
  { value: 'calculate', label: 'Розрахунок', icon: '🧮' },
  { value: 'validate', label: 'Перевірка', icon: '✓' },
  { value: 'output', label: 'Результат', icon: '📤' },
];

// ============ КОМПОНЕНТ ============

export const ScenarioBuilderPremiumV2: React.FC = () => {
  const [scenarioName, setScenarioName] = useState('Новий сценарій');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(SCENARIO_TEMPLATES[0].id);
  const [steps, setSteps] = useState<ScenarioStep[]>(SCENARIO_TEMPLATES[0].steps);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const currentTemplate = useMemo(
    () => SCENARIO_TEMPLATES.find(t => t.id === selectedTemplate),
    [selectedTemplate]
  );

  const handleAddStep = () => {
    const newStep: ScenarioStep = {
      id: `step-${Date.now()}`,
      type: 'filter',
      label: 'Новий крок',
      config: {},
      enabled: true,
    };
    setSteps([...steps, newStep]);
  };

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleToggleStep = (id: string) => {
    setSteps(
      steps.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getStepColor = (type: string) => {
    const colors: Record<string, string> = {
      input: 'from-blue-600/20 border-blue-500/30 text-blue-200',
      filter: 'from-cyan-600/20 border-cyan-500/30 text-cyan-200',
      calculate: 'from-purple-600/20 border-purple-500/30 text-purple-200',
      validate: 'from-emerald-600/20 border-emerald-500/30 text-emerald-200',
      output: 'from-amber-600/20 border-amber-500/30 text-amber-200',
    };
    return colors[type] || colors.input;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <motion.div
        className="max-w-6xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ===== ЗАГОЛОВОК ===== */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                🏗️ Конструктор сценаріїв
              </h1>
              <p className="text-slate-400 text-lg mt-2">
                Створюйте складні сценарії аналізу drag-and-drop інтерфейсом
              </p>
            </div>
          </div>
        </motion.div>

        {/* ===== НАЗВА СЦЕНАРІЮ ===== */}
        <motion.div variants={itemVariants} className="flex gap-4">
          <Input
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="Назва сценарію..."
            className="flex-1 text-lg font-bold bg-slate-800/50 border-slate-700"
          />
          <div className="flex gap-2">
            <Button className="gap-2">
              <Save className="w-4 h-4" />
              Зберегти
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== КОНСТРУКТОР (ЛІВА КОЛОНКА) ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* ВИБІР ШАБЛОНУ */}
            <motion.div variants={itemVariants} className="space-y-3">
              <h3 className="text-lg font-bold text-white">Шаблони</h3>
              <div className="grid grid-cols-2 gap-2">
                {SCENARIO_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setSteps(template.steps);
                    }}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedTemplate === template.id
                        ? 'bg-violet-500/20 border-violet-500/50'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    <p className="text-sm font-bold text-white">{template.icon} {template.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* КРОКИ СЦЕНАРІЮ */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Кроки ({steps.length})</h3>
                <Button size="sm" variant="outline" className="gap-2" onClick={handleAddStep}>
                  <Plus className="w-4 h-4" />
                  Додати крок
                </Button>
              </div>

              <div className="space-y-2">
                {steps.map((step, idx) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border bg-gradient-to-r ${getStepColor(step.type)} ${!step.enabled ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">#{idx + 1}</span>
                          <input
                            type="text"
                            value={step.label}
                            onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[idx].label = e.target.value;
                              setSteps(newSteps);
                            }}
                            className="font-bold text-white bg-transparent border-b border-white/20 focus:border-white/50 outline-none px-2"
                          />
                          <Badge variant="secondary" className="text-xs">
                            {STEP_TYPES.find(t => t.value === step.type)?.label}
                          </Badge>
                        </div>

                        {/* Config Details */}
                        {expandedStep === step.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-slate-400 mt-2 space-y-1"
                          >
                            {Object.entries(step.config).map(([key, value]) => (
                              <p key={key}>
                                <span className="text-slate-300">{key}:</span> {JSON.stringify(value)}
                              </p>
                            ))}
                          </motion.div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {expandedStep === step.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="checkbox"
                          checked={step.enabled}
                          onChange={() => handleToggleStep(step.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ===== ПРЕВЬЮ (ПРАВА КОЛОНКА) ===== */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Превью
                </h3>
                <Button size="sm" variant="outline" className="gap-1">
                  <Play className="w-4 h-4" />
                  Запустити
                </Button>
              </div>

              {/* EXECUTION SUMMARY */}
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/40 space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">КРОКІВ ДО ВИКОНАННЯ</p>
                  <p className="text-2xl font-black text-emerald-400">{steps.filter(s => s.enabled).length}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500 mb-2">ПОСЛІДОВНІСТЬ</p>
                  {steps.filter(s => s.enabled).map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-cyan-400">{idx + 1}</span>
                      <span>{step.label}</span>
                      {idx < steps.filter(s => s.enabled).length - 1 && (
                        <ChevronDown className="w-3 h-3 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>

                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4" />
                  Запустити сценарій
                </Button>
              </div>

              {/* EXPECTED RESULTS */}
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-800/40 space-y-3">
                <p className="text-sm font-bold text-white">Очікуваний результат</p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Рекомендація постачальника
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-500" />
                    Розрахунок економії
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    Оцінка ризику
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ScenarioBuilderPremiumV2;
