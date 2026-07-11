/**
 * FlowBuilderTool — PREDATOR Analytics v63.0-ELITE
 *
 * AG-UI Tool для CopilotKit: AI будує React Flow граф за описом.
 * Автоматична генерація вузлів і ребер для OSINT Shadow Map.
 */
import React, { type FC, lazy, Suspense, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { EntityNodeData, EntityType } from '../../flow/nodes/EntityNode';

// Lazy-load React Flow (важкий компонент)
const PredatorFlowCanvas = lazy(() =>
  import('../../flow/PredatorFlowCanvas')
);

/** Спрощений опис сутності від AI */
export interface AIEntity {
  id: string;
  name: string;
  type: EntityType;
  riskScore?: number;
  country?: string;
  status?: 'active' | 'sanctioned' | 'dissolved' | 'monitoring';
}

/** Спрощений опис зв'язку від AI */
export interface AIRelation {
  source: string;
  target: string;
  label: string;
  weight?: number;
}

/** Параметри, які AI передає для побудови графа */
export interface FlowBuilderParams {
  entities: AIEntity[];
  relations: AIRelation[];
  title?: string;
}

/**
 * Автоматичне розташування вузлів (простий force-directed layout)
 */
function autoLayout(entities: AIEntity[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cols = Math.ceil(Math.sqrt(entities.length));

  entities.forEach((e, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(e.id, {
      x: 100 + col * 300 + (Math.random() * 50 - 25),
      y: 100 + row * 200 + (Math.random() * 30 - 15),
    });
  });

  return positions;
}

/**
 * Конвертація AI-параметрів у React Flow nodes/edges
 */
function buildFlowElements(params: FlowBuilderParams): { nodes: Node[]; edges: Edge[] } {
  const positions = autoLayout(params.entities);

  const nodes: Node[] = params.entities.map((e) => ({
    id: e.id,
    type: 'entity',
    position: positions.get(e.id) || { x: 0, y: 0 },
    data: {
      label: e.name,
      type: e.type,
      riskScore: e.riskScore,
      country: e.country,
      status: e.status,
    } satisfies EntityNodeData,
  }));

  const edges: Edge[] = params.relations.map((r, i) => ({
    id: `ai-edge-${i}`,
    source: r.source,
    target: r.target,
    type: 'animated',
    label: r.label,
    data: { weight: r.weight ?? 1 },
  }));

  return { nodes, edges };
}

/**
 * Компонент для рендерингу графа, побудованого AI
 */
export const GeneratedFlow: FC<{ params: FlowBuilderParams }> = ({ params }) => {
  const { nodes, edges } = useMemo(() => buildFlowElements(params), [params]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-slate-950">
      {params.title && (
        <div className="border-b border-white/[0.04] px-4 py-2">
          <h3 className="text-xs font-semibold text-slate-300">{params.title}</h3>
        </div>
      )}
      <div className="h-[400px]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-xs text-slate-600">
              Завантаження графу...
            </div>
          }
        >
          <PredatorFlowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            mode="osint"
          />
        </Suspense>
      </div>
    </div>
  );
};
