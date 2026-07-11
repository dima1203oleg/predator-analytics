/**
 * FlowAnalytics — PREDATOR Analytics v63.0-ELITE
 *
 * Сторінка "Аналітика потоків" з React Flow canvas.
 * Перемикач між режимами: OSINT Shadow Map / Funnel Builder / Customer Journey.
 */
import { Button } from '@/components/ui/button';
import React, { useState, useMemo, type FC, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import type { Node, Edge } from '@xyflow/react';
import type { FlowMode } from '../components/flow/PredatorFlowCanvas';

// Lazy-load React Flow canvas (важкий компонент)
const PredatorFlowCanvas = lazy(() =>
  import('../components/flow/PredatorFlowCanvas')
);

/**
 * Демо-дані OSINT Shadow Map
 */
const OSINT_NODES: Node[] = [
  {
    id: 'c1',
    type: 'entity',
    position: { x: 400, y: 50 },
    data: {
      label: 'ТОВ "Імпорт-Груп"',
      entityType: 'company',
      riskScore: 78,
      country: '🇺🇦 Україна',
      status: 'monitoring',
      sparklineData: [20, 35, 45, 30, 55, 70, 85, 78],
    },
  },
  {
    id: 'p1',
    type: 'entity',
    position: { x: 100, y: 250 },
    data: {
      label: 'Іванов О.П.',
      entityType: 'person',
      riskScore: 45,
      country: '🇺🇦 Київ',
      status: 'active',
    },
  },
  {
    id: 'o1',
    type: 'entity',
    position: { x: 700, y: 250 },
    data: {
      label: 'Sunrise Holdings Ltd',
      entityType: 'offshore',
      riskScore: 92,
      country: '🇨🇾 Кіпр',
      status: 'sanctioned',
      sparklineData: [90, 88, 95, 92, 91, 94, 92],
    },
  },
  {
    id: 'u1',
    type: 'entity',
    position: { x: 400, y: 450 },
    data: {
      label: 'Smith J.R.',
      entityType: 'ubo',
      riskScore: 85,
      country: '🇬🇧 Лондон',
      status: 'monitoring',
    },
  },
  {
    id: 'a1',
    type: 'entity',
    position: { x: 100, y: 450 },
    data: {
      label: 'вул. Хрещатик, 1',
      entityType: 'address',
      country: '🇺🇦 Київ',
    },
  },
];

const OSINT_EDGES: Edge[] = [
  { id: 'e1', source: 'c1', target: 'p1', type: 'animated', label: 'Директор', data: { weight: 2 } },
  { id: 'e2', source: 'c1', target: 'o1', type: 'animated', label: 'Власник 75%', data: { weight: 3 } },
  { id: 'e3', source: 'o1', target: 'u1', type: 'animated', label: 'UBO', data: { weight: 4 } },
  { id: 'e4', source: 'p1', target: 'a1', type: 'animated', label: 'Реєстрація', data: { weight: 1 } },
  { id: 'e5', source: 'u1', target: 'a1', type: 'animated', label: 'Адреса', data: { weight: 1 } },
];

/**
 * Демо-дані Воронки конверсії
 */
const FUNNEL_NODES: Node[] = [
  {
    id: 'f1', type: 'funnel', position: { x: 200, y: 0 },
    data: { label: 'Реєстрація декларації', count: 15420, percentage: 100, stageIndex: 0, totalStages: 5 },
  },
  {
    id: 'f2', type: 'funnel', position: { x: 200, y: 150 },
    data: { label: 'Автоматична перевірка', count: 12850, percentage: 83.3, stageIndex: 1, totalStages: 5 },
  },
  {
    id: 'f3', type: 'funnel', position: { x: 200, y: 300 },
    data: { label: 'Ризик-скоринг (CERS)', count: 8920, percentage: 57.8, stageIndex: 2, totalStages: 5 },
  },
  {
    id: 'f4', type: 'funnel', position: { x: 200, y: 450 },
    data: { label: 'Ручна інспекція', count: 2340, percentage: 15.2, stageIndex: 3, totalStages: 5 },
  },
  {
    id: 'f5', type: 'funnel', position: { x: 200, y: 600 },
    data: { label: 'Випуск товару', count: 14200, percentage: 92.1, stageIndex: 4, totalStages: 5 },
  },
];

const FUNNEL_EDGES: Edge[] = [
  { id: 'fe1', source: 'f1', target: 'f2', type: 'animated', label: '83.3%', data: { weight: 3 } },
  { id: 'fe2', source: 'f2', target: 'f3', type: 'animated', label: '69.4%', data: { weight: 2.5 } },
  { id: 'fe3', source: 'f3', target: 'f4', type: 'animated', label: '26.2%', data: { weight: 1.5 } },
  { id: 'fe4', source: 'f3', target: 'f5', type: 'animated', label: '92.1%', data: { weight: 3 } },
];

const MODE_CONFIGS: Record<FlowMode, { nodes: Node[]; edges: Edge[] }> = {
  osint: { nodes: OSINT_NODES, edges: OSINT_EDGES },
  funnel: { nodes: FUNNEL_NODES, edges: FUNNEL_EDGES },
  journey: { nodes: OSINT_NODES, edges: OSINT_EDGES }, // placeholder
};

/**
 * Сторінка Flow Analytics
 */
const FlowAnalytics: FC = () => {
  const [mode, setMode] = useState<FlowMode>('osint');
  const config = useMemo(() => MODE_CONFIGS[mode], [mode]);

  const modes: { key: FlowMode; label: string; icon: string }[] = [
    { key: 'osint', label: 'OSINT Shadow Map', icon: '🕵️' },
    { key: 'funnel', label: 'Воронка', icon: '📊' },
    { key: 'journey', label: 'Шлях клієнта', icon: '🗺️' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-slate-950/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-200">
            Аналітика потоків
          </h1>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
            React Flow
          </span>
        </div>

        {/* Перемикач режимів */}
        <div className="flex gap-1 rounded-lg bg-slate-900/80 p-1">
          {modes.map((m) => (
            <Button variant="cyber"
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                mode === m.key
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span>{m.icon}</span>
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <span className="text-xs text-slate-500">Завантаження графу...</span>
              </div>
            </div>
          }
        >
          <PredatorFlowCanvas
            key={mode}
            initialNodes={config.nodes}
            initialEdges={config.edges}
            mode={mode}
            className="h-full"
          />
        </Suspense>
      </div>
    </div>
  );
};

export default FlowAnalytics;
