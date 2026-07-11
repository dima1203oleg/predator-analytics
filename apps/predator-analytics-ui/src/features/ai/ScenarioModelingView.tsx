/**
 * ScenarioModelingView — War-gaming & Стратегічне моделювання.
 * Симуляція загроз та наслідків на базі Horizon Engine.
 * War-gaming Horizon v63.0-ELITE.
 */

import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Database,
  FlaskConical,
  GitBranch,
  Globe,
  Layers,
  Play,
  Plus,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { intelligenceApi } from '@/services/api';

// ─── Типи ────────────────────────────────────────────────────────────────────

type ScenarioStatus = 'draft' | 'running' | 'completed' | 'failed';
type ScenarioCategory = 'market' | 'risk' | 'aml' | 'geopolitical';

interface ScenarioParam {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
}

interface ScenarioResult {
  metric: string;
  baseline: number;
  projected: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  impact: 'positive' | 'negative' | 'neutral';
}

interface Scenario {
  id: string;
  name: string;
  category: ScenarioCategory;
  status: ScenarioStatus;
  description: string;
  params: ScenarioParam[];
  results?: ScenarioResult[];
  confidence?: number;
  createdAt: string;
}

// ─── Конфігурація категорій ───────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ScenarioCategory, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  market: { label: 'Ринок', color: 'text-rose-400 bg-cyan-500/10 border-cyan-500/25', icon: TrendingUp },
  risk: { label: 'Ризик', color: 'text-rose-400 bg-cyan-500/10 border-cyan-500/25', icon: AlertTriangle },
  aml: { label: 'AML', color: 'text-orange-400 bg-orange-500/10 border-orange-500/25', icon: Shield },
  geopolitical: { label: 'Геополітика', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25', icon: Globe },
};

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string }> = {
  draft: { label: 'Чернетка', color: 'text-white/40' },
  running: { label: 'Виконується...', color: 'text-rose-400' },
  completed: { label: 'Завершено', color: 'text-emerald-400' },
  failed: { label: 'Помилка', color: 'text-rose-400' },
};

// ─── Компонент результату ─────────────────────────────────────────────────────

function ResultRow({ result }: { result: ScenarioResult }) {
  const delta = result.projected - result.baseline;
  const deltaPercent = result.baseline !== 0 ? ((delta / result.baseline) * 100).toFixed(1) : '—';
  const TrendIcon = result.trend === 'up' ? TrendingUp : result.trend === 'down' ? TrendingDown : Activity;
  const trendColor =
    result.impact === 'positive' ? 'text-emerald-400' :
    result.impact === 'negative' ? 'text-rose-400' : 'text-white/50';

  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className="flex-1 text-sm text-white/60">{result.metric}</span>
      <span className="w-24 text-right text-sm font-mono text-white/40">{result.baseline} {result.unit}</span>
      <span className="w-24 text-right text-sm font-mono font-bold text-white/80">{result.projected} {result.unit}</span>
      <div className={`w-28 flex items-center justify-end gap-1 ${trendColor}`}>
        <TrendIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">
          {delta > 0 ? '+' : ''}{deltaPercent}%
        </span>
      </div>
    </div>
  );
}

// ─── Компонент сценарію ───────────────────────────────────────────────────────

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [expanded, setExpanded] = useState(scenario.status === 'completed');
  const category = CATEGORY_CONFIG[scenario.category];
  const status = STATUS_CONFIG[scenario.status];
  const CategoryIcon = category.icon;

  return (
    <div className="border border-white/[0.07] rounded-xl overflow-hidden bg-white/[0.01]">
      <Button variant="cyber"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${category.color}`}>
          <CategoryIcon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/90">{scenario.name}</h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${category.color}`}>
              {category.label}
            </span>
          </div>
          <p className="text-xs text-white/40 mt-0.5 truncate">{scenario.description}</p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {scenario.confidence !== undefined && (
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-rose-400">{scenario.confidence}%</div>
              <div className="text-[10px] text-white/30">впевненість</div>
            </div>
          )}
          <div className={`text-xs ${status.color}`}>{status.label}</div>
          <div className="text-white/20">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </Button>

      {expanded && (
        <div className="border-t border-white/[0.05] p-4 space-y-4">
          {/* Параметри */}
          <div>
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-3">Параметри моделювання</div>
            <div className="grid grid-cols-2 gap-3">
              {scenario.params.map((param) => (
                <div key={param.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/50">{param.label}</label>
                    <span className="text-xs font-mono text-white/80 font-bold">
                      {param.value} {param.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    value={param.value}
                    readOnly
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-rose-500"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 font-mono">
                    <span>{param.min}</span>
                    <span>{param.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Результати */}
          {scenario.results && scenario.results.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">Прогнозні результати</div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="flex items-center gap-4 pb-2 border-b border-white/[0.06] text-[10px] font-bold text-white/30 uppercase">
                  <span className="flex-1">Метрика</span>
                  <span className="w-24 text-right">Базова</span>
                  <span className="w-24 text-right">Прогноз</span>
                  <span className="w-28 text-right">Дельта</span>
                </div>
                {scenario.results.map((result) => (
                  <ResultRow key={result.metric} result={result} />
                ))}
              </div>
            </div>
          )}

          {scenario.status === 'draft' && (
            <Button variant="cyber" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-sm text-rose-400 hover:bg-cyan-500/20 transition-colors">
              <Play className="w-4 h-4" />
              Запустити симуляцію
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

export const ScenarioModelingView: React.FC = () => {
  const [scenarios, setScenarios] = React.useState<Scenario[]>([]);

  React.useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await intelligenceApi.getScenarios();
        if (data && Array.isArray(data)) {
          setScenarios(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchScenarios();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">War-gaming & Стратегічне Моделювання</h1>
            <p className="text-xs text-white/40 mt-0.5">
              Horizon Engine · Powered by GLM-5.1 + Nemotron
            </p>
          </div>
        </div>

        <Button variant="cyber" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-xs text-rose-400 hover:bg-cyan-500/10 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Новий сценарій
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Всього сценаріїв', value: scenarios.length, color: 'text-white/60', icon: GitBranch },
          { label: 'Завершені', value: scenarios.filter(s => s.status === 'completed').length, color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Серед. впевненість', value: scenarios.length ? `${Math.round(scenarios.reduce((acc, s) => acc + (s.confidence || 0), 0) / scenarios.length)}%` : '0%', color: 'text-rose-400', icon: Sparkles },
          { label: 'Чернетки', value: scenarios.filter(s => s.status === 'draft').length, color: 'text-rose-400', icon: FlaskConical },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* AI-плашка */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/[0.04] border border-cyan-500/[0.12]">
        <BrainCircuit className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <p className="text-xs text-rose-400/70">
          ШІ-сценарії генеруються GLM-5.1 (Lead Architect) та верифікуються Nemotron-30B.
          Результати мають рекомендаційний характер.
        </p>
      </div>

      {/* Сценарії */}
      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>
    </div>
  );
};

export default ScenarioModelingView;
