/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Просторовий Граф (Web Worker)
 *
 * Переносить обчислення фізики (d3-force-3d) в окремий потік для
 * забезпечення 60 FPS рендерингу в головному потоці.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';

let simulation: any = null;

self.onmessage = (event: MessageEvent) => {
  const { type, nodes, edges } = event.data;

  if (type === 'INIT') {
    if (simulation) {
      simulation.stop();
    }

    // Створюємо мапи для швидкого доступу
    const nodesById = new Map();
    const simNodes = nodes.map((n: any) => {
      const node = { ...n };
      nodesById.set(n.id, node);
      return node;
    });

    const simEdges = edges.map((e: any) => ({
      source: e.source,
      target: e.target,
      weight: e.weight
    }));

    // Ініціалізація симуляції
    simulation = forceSimulation(simNodes)
      .numDimensions(3)
      .force('charge', forceManyBody().strength((d: any) => -120 * d.mass))
      .force('link', forceLink(simEdges).id((d: any) => d.id).distance(3).strength((d: any) => 0.004 * d.weight))
      .force('center', forceCenter(0, 0, 0))
      .alphaDecay(0.02)
      .velocityDecay(0.08); // Еквівалент DAMPING 0.92

    simulation.on('tick', () => {
      // Формуємо масив позицій для відправки
      // Структура: [x0, y0, z0, x1, y1, z1, ...]
      const positions = new Float32Array(simNodes.length * 3);
      for (let i = 0; i < simNodes.length; i++) {
        positions[i * 3] = simNodes[i].x;
        positions[i * 3 + 1] = simNodes[i].y;
        positions[i * 3 + 2] = simNodes[i].z;
      }

      // Відправляємо дані з Transferable Objects для нульової вартості копіювання
      (self as any).postMessage({ type: 'TICK', positions }, [positions.buffer]);
    });
  } else if (type === 'STOP') {
    if (simulation) simulation.stop();
  }
};
