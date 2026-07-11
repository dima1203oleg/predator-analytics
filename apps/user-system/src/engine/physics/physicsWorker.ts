// Physics Engine Worker for Spatial Data Force-Directed Layout
import { worker } from 'threads';

interface Node {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  force: [number, number, number];
}

interface Edge {
  from: string;
  to: string;
  strength: number;
}

interface SimulationParameters {
  forceStrength?: number;
  repulsionStrength?: number;
  centerGravity?: number;
  damping?: number;
}

class PhysicsSimulation {
  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private parameters: SimulationParameters = {};
  private running: boolean = false;
  private animationFrame: number | null = null;

  init(nodes: Node[], edges: Edge[], params: SimulationParameters = {}) {
    this.nodes = nodes;
    this.edges = edges;
    this.parameters = {
      forceStrength: 0.05,
      repulsionStrength: 50,
      centerGravity: 0.001,
      damping: 0.9,
      ...params
    };
  }

  computeStep() {
    // Reset forces
    this.nodes.forEach(node => {
      node.force = [0, 0, 0];
    });

    // Repulsion forces (Coulomb's law)
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[j].position[0] - this.nodes[i].position[0];
        const dy = this.nodes[j].position[1] - this.nodes[i].position[1];
        const dz = this.nodes[j].position[2] - this.nodes[i].position[2];
        const distSq = dx * dx + dy * dy + dz * dz || 1;
        const dist = Math.sqrt(distSq);
        const force = this.parameters.repulsionStrength! / distSq;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        this.nodes[i].force[0] -= fx;
        this.nodes[i].force[1] -= fy;
        this.nodes[i].force[2] -= fz;

        this.nodes[j].force[0] += fx;
        this.nodes[j].force[1] += fy;
        this.nodes[j].force[2] += fz;
      }
    }

    // Attraction forces (Hooke's law for edges)
    this.edges.forEach(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        const dx = toNode.position[0] - fromNode.position[0];
        const dy = toNode.position[1] - fromNode.position[1];
        const dz = toNode.position[2] - fromNode.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

        const stretch = dist - 1;
        const force = stretch * this.parameters.forceStrength! * edge.strength;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        fromNode.force[0] += fx;
        fromNode.force[1] += fy;
        fromNode.force[2] += fz;

        toNode.force[0] -= fx;
        toNode.force[1] -= fy;
        toNode.force[2] -= fz;
      }
    });

    // Center gravity force
    this.nodes.forEach(node => {
      const distFromCenter = Math.sqrt(node.position[0] ** 2 + node.position[1] ** 2 + node.position[2] ** 2) || 1;
      node.force[0] -= node.position[0] * this.parameters.centerGravity!;
      node.force[1] -= node.position[1] * this.parameters.centerGravity!;
      node.force[2] -= node.position[2] * this.parameters.centerGravity!;
    });

    // Apply forces and update positions
    this.nodes.forEach(node => {
      node.velocity[0] += node.force[0];
      node.velocity[1] += node.force[1];
      node.velocity[2] += node.force[2];

      node.velocity[0] *= this.parameters.damping!;
      node.velocity[1] *= this.parameters.damping!;
      node.velocity[2] *= this.parameters.damping!;

      node.position[0] += node.velocity[0];
      node.position[1] += node.velocity[1];
      node.position[2] += node.velocity[2];
    });
  }

  getNodes() {
    return this.nodes;
  }
}

// Create worker instance
const simulation = new PhysicsSimulation();

worker(({ type, nodes, edges, parameters, id }: any) => {
  if (type === 'init') {
    simulation.init(nodes, edges, parameters);
    return { type: 'init', id };
  }

  if (type === 'compute') {
    simulation.computeStep();
    return {
      type: 'compute',
      nodes: simulation.getNodes(),
      id
    };
  }

  if (type === 'stop') {
    if (simulation.animationFrame) {
      cancelAnimationFrame(simulation.animationFrame);
    }
    return { type: 'stop', id };
  }

  return { type: 'error', error: 'Unknown message type', id };
});
