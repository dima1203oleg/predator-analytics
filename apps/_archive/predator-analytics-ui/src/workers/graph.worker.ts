/* ─────────────────────────────────────────────────────────
 * 🔧 Graph Web Worker — d3-force-3d simulation
 * Винесена в окремий потік, щоб не блокувати main thread.
 * Protocol: INIT → TICK → UPDATE_NODES → STOP
 * ───────────────────────────────────────────────────────── */
import {
    forceSimulation,
    forceManyBody,
    forceLink,
    forceCenter,
} from 'd3-force-3d';
// @ts-ignore
import { forceCollide } from 'd3-force-3d';

interface WorkerNode {
    id: string;
    x: number;
    y: number;
    z: number;
    value: number;
}

interface WorkerEdge {
    source: string;
    target: string;
    weight: number;
}

type InMessage =
    | { type: 'INIT'; nodes: WorkerNode[]; edges: WorkerEdge[] }
    | { type: 'UPDATE_NODES'; nodes: WorkerNode[] }
    | { type: 'STOP' };

type OutMessage =
    | { type: 'TICK'; nodes: WorkerNode[]; alpha: number }
    | { type: 'DONE' };

let simulation: ReturnType<typeof forceSimulation> | null = null;

self.onmessage = (event: MessageEvent<InMessage>) => {
    const msg = event.data;

    switch (msg.type) {
        case 'INIT': {
            if (simulation) {
                simulation.stop();
            }

            const nodes = msg.nodes.map(n => ({ ...n }));
            const edges = msg.edges.map(e => ({ ...e }));

            simulation = forceSimulation(nodes)
                .force('charge', forceManyBody().strength(-120))
                .force('link', forceLink(edges).id((d: WorkerNode) => d.id).distance(50).strength((e: WorkerEdge) => e.weight))
                .force('center', forceCenter(0, 0, 0))
                .force('collide', forceCollide().radius((d: WorkerNode) => Math.sqrt(d.value) * 4))
                .alphaDecay(0.02)
                .on('tick', () => {
                    const out: OutMessage = {
                        type: 'TICK',
                        nodes: nodes.map(n => ({
                            id: n.id,
                            x: n.x ?? 0,
                            y: n.y ?? 0,
                            z: n.z ?? 0,
                            value: n.value,
                        })),
                        alpha: simulation?.alpha() ?? 0,
                    };
                    self.postMessage(out);
                })
                .on('end', () => {
                    const out: OutMessage = { type: 'DONE' };
                    self.postMessage(out);
                });

            break;
        }

        case 'UPDATE_NODES': {
            // Гаряче оновлення вузлів без перезапуску симуляції
            if (simulation) {
                simulation.alpha(0.3).restart();
            }
            break;
        }

        case 'STOP': {
            if (simulation) {
                simulation.stop();
                simulation = null;
            }
            break;
        }
    }
};
