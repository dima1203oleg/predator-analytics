/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Просторовий Граф Даних
 *
 * Force-directed граф з 3D вузлами як фізичними об'єктами,
 * динамічними енергетичними з'єднаннями, GLSL-рендерингом.
 * Фізика обчислюється у головному потоці (Web Worker у наступній ітерації).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, useEffect, memo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCommandStore, type SpatialNode, type SpatialEdge } from '../store/useCommandStore';
import { nodeVertexShader, nodeFragmentShader } from '../shaders/spatialShaders';
import { NodeMaterializer } from './NodeMaterializer';
import { audioFeedback } from '../interaction/AudioFeedback';

// ─── Конфігурація фізики ─────────────────────────────────────────────────────

const REPULSION = 120;
const ATTRACTION = 0.004;
const CENTER_GRAVITY = 0.002;
const DAMPING = 0.92;
const DT = 0.016;

// ─── Типи вузлів → кольори та розміри ────────────────────────────────────────

const NODE_CONFIG: Record<string, { color: number; size: number; shape: 'sphere' | 'octahedron' | 'box' }> = {
  COMPANY:     { color: 0x00f0ff, size: 0.5,  shape: 'octahedron' },
  PERSON:      { color: 0x00ff88, size: 0.35, shape: 'sphere' },
  TRANSACTION: { color: 0xffaa00, size: 0.25, shape: 'box' },
  DOCUMENT:    { color: 0x8844ff, size: 0.3,  shape: 'box' },
  RISK:        { color: 0xff3300, size: 0.45, shape: 'octahedron' },
  CLUSTER:     { color: 0x0066ff, size: 0.6,  shape: 'sphere' },
};

// ─── Утилітна функція отримання токена (єдина точка, HR-06) ─────────────────

function getAuthToken(): string {
  // Порядок пріоритетів: sessionStorage (основний після логіну) → VITE_STATIC_TOKEN (fallback для dev)
  return (
    sessionStorage.getItem('predator_auth_token') ||
    localStorage.getItem('predator_auth_token') ||
    (import.meta.env.VITE_STATIC_TOKEN as string) ||
    ''
  );
}

// ─── Отримання реальних даних з бекенду ──────────────────────────────────────

async function fetchRealGraph(): Promise<{ nodes: SpatialNode[]; edges: SpatialEdge[] }> {
  try {
    const token = getAuthToken();
    const response = await fetch('/api/v1/graph/summary', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!response.ok) return { nodes: [], edges: [] };
    const summary = await response.json();
    if (!summary || !summary.nodes) return { nodes: [], edges: [] };

    const validTypes = ['COMPANY', 'PERSON', 'TRANSACTION', 'DOCUMENT', 'RISK', 'CLUSTER'];
    
    const nodes: SpatialNode[] = summary.nodes.map((n: any, i: number) => {
      let nType = n.type?.toUpperCase() || 'COMPANY';
      if (!validTypes.includes(nType)) nType = 'COMPANY';
      
      return {
        id: n.id || `node_${i}`,
        label: n.label || 'Невідомо',
        type: nType as SpatialNode['type'],
        x: (Math.random() - 0.5) * 15,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 15,
        vx: 0,
        vy: 0,
        vz: 0,
        risk: (n.riskScore || 0) / 100,
        mass: 1 + Math.random() * 2,
        energy: 0.3 + Math.random() * 0.7,
        connections: n.connections || 0,
      };
    });

    // Використовуємо реальні зв'язки, якщо вони є
    const edges: SpatialEdge[] = summary.links?.length > 0 
      ? summary.links.map((l: any, i: number) => ({
          id: l.id || `edge_${i}`,
          source: l.source,
          target: l.target,
          weight: l.weight || 0.5,
          type: (l.type?.toUpperCase() as SpatialEdge['type']) || 'RELATION',
          energy: 0.5,
        }))
      : [];

    return { nodes, edges };
  } catch (err) {
    console.error('Failed to fetch real graph:', err);
    return { nodes: [], edges: [] };
  }
}

// ─── Один Просторовий Вузол ──────────────────────────────────────────────────


interface SpatialNodeMeshProps {
  node: SpatialNode;
  isFocused: boolean;
  onFocus: (id: string) => void;
}

const SpatialNodeMesh = memo(function SpatialNodeMesh({ node, isFocused, onFocus }: SpatialNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const targetScale = useRef(1.0);
  const config = NODE_CONFIG[node.type] ?? NODE_CONFIG['COMPANY'];

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    audioFeedback.playSelect();
    targetScale.current = 2.0; // Click impulse
    onFocus(node.id);
  }, [node.id, onFocus]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!isFocused) {
      audioFeedback.playHover(node.type);
    }
    document.body.style.cursor = 'pointer';
    targetScale.current = 1.2; // Hover grow
  }, [node.type, isFocused]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'auto';
    targetScale.current = 1.0;
  }, []);

  useFrame((state) => {
    if (!matRef.current) return;

    matRef.current.uniforms['uTime'].value = state.clock.elapsedTime;
    matRef.current.uniforms['uRisk'].value = node.risk;
    matRef.current.uniforms['uEnergy'].value = node.energy;
    matRef.current.uniforms['uFocused'].value = isFocused ? 1.0 : 0.0;

    if (meshRef.current) {
      // Плавне переміщення до позиції з фізики
      meshRef.current.position.lerp(
        new THREE.Vector3(node.x, node.y, node.z),
        0.1
      );
      // Легка ротація
      meshRef.current.rotation.y += 0.003 * node.energy;

      // Мікро-анімація масштабу (hover / click)
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current),
        0.2
      );

      // Загасання імпульсу від кліку
      if (targetScale.current > 1.2) {
        targetScale.current -= 0.08;
      }
    }
  });

  const geometry = useMemo(() => {
    switch (config.shape) {
      case 'octahedron': return <octahedronGeometry args={[config.size, 1]} />;
      case 'box': return <boxGeometry args={[config.size, config.size, config.size]} />;
      default: return <sphereGeometry args={[config.size, 16, 16]} />;
    }
  }, [config.shape, config.size]);

  return (
    <NodeMaterializer delay={Math.random() * 500} status={node.risk > 0.8 ? 'unknown' : (node.risk > 0.5 ? 'partial' : 'confirmed')}>
      <mesh
        ref={meshRef}
        position={[node.x, node.y, node.z]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {geometry}
        <shaderMaterial
          ref={matRef}
          vertexShader={nodeVertexShader}
          fragmentShader={nodeFragmentShader}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={{
            uTime:      { value: 0 },
            uRisk:      { value: node.risk },
            uEnergy:    { value: node.energy },
            uFocused:   { value: 0 },
            uBaseColor: { value: new THREE.Color(config.color) },
          }}
        />
      </mesh>

      {/* Мітка вузла — видима тільки при фокусі або наближенні */}
      {isFocused && (
        <Billboard position={[node.x, node.y + config.size + 0.4, node.z]}>
          <Text
            fontSize={0.22}
            color="#00f0ff"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {node.label}
          </Text>
        </Billboard>
      )}
    </NodeMaterializer>
  );
});

// ─── Просторові Ребра ────────────────────────────────────────────────────────

interface SpatialEdgeLinesProps {
  edges: SpatialEdge[];
  nodeMap: Map<string, SpatialNode>;
}

import { edgeVertexShader, edgeFragmentShader } from '../shaders/spatialShaders';

// ... inside SpatialEdgeLines ...

const SpatialEdgeLines = memo(function SpatialEdgeLines({ edges, nodeMap }: SpatialEdgeLinesProps) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, colors, progresses } = useMemo(() => {
    const positions = new Float32Array(edges.length * 6);
    const colors = new Float32Array(edges.length * 6);
    const progresses = new Float32Array(edges.length * 2);

    const edgeColors: Record<string, THREE.Color> = {
      OWNERSHIP:   new THREE.Color(0x00f0ff),
      TRANSACTION: new THREE.Color(0xff007f), // Updated to cyber pink
      RELATION:    new THREE.Color(0x00ff88),
      RISK_LINK:   new THREE.Color(0xff3300),
    };

    edges.forEach((edge, i) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const idx = i * 6;
      positions[idx] = source.x;
      positions[idx + 1] = source.y;
      positions[idx + 2] = source.z;
      positions[idx + 3] = target.x;
      positions[idx + 4] = target.y;
      positions[idx + 5] = target.z;

      const c = edgeColors[edge.type] ?? edgeColors['RELATION'];
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
      colors[idx + 3] = c.r;
      colors[idx + 4] = c.g;
      colors[idx + 5] = c.b;

      // Progress for shaders (0 at source, 1 at target)
      progresses[i * 2] = 0.0;
      progresses[i * 2 + 1] = 1.0;
    });

    return { positions, colors, progresses };
  }, [edges, nodeMap]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (!linesRef.current) return;

    const posAttr = linesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    edges.forEach((edge, i) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) return;

      const idx = i * 6;
      arr[idx] = source.x;
      arr[idx + 1] = source.y;
      arr[idx + 2] = source.z;
      arr[idx + 3] = target.x;
      arr[idx + 4] = target.y;
      arr[idx + 5] = target.z;
    });

    posAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aProgress" args={[progresses, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={edgeVertexShader}
        fragmentShader={edgeFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uEnergy: { value: 1.0 }
        }}
      />
    </lineSegments>
  );
});

// ─── Force-directed фізика (inline — для прототипу) ──────────────────────────

function useWorkerSimulation(nodes: SpatialNode[], edges: SpatialEdge[]) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (nodes.length === 0) return;

    // Створюємо Web Worker
    workerRef.current = new Worker(new URL('./GraphWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TICK') {
        const positions = e.data.positions as Float32Array;
        // Оновлюємо позиції вузлів in-place
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].x = positions[i * 3];
          nodes[i].y = positions[i * 3 + 1];
          nodes[i].z = positions[i * 3 + 2];
        }
      }
    };

    // Надсилаємо дані у Worker (перетворюємо масиви для уникнення проблем з клонуванням)
    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({ ...e }));
    workerRef.current.postMessage({ type: 'INIT', nodes: simNodes, edges: simEdges });

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
      }
    };
  }, [nodes, edges]);
}

// ─── Головний компонент графа ────────────────────────────────────────────────

function SpatialGraphInner() {
  const nodes = useCommandStore((s) => s.nodes);
  const edges = useCommandStore((s) => s.edges);
  const focusedNodeId = useCommandStore((s) => s.focusedNodeId);
  const setFocusedNode = useCommandStore((s) => s.setFocusedNode);

  // Ініціалізація даних з бекенду
  useEffect(() => {
    if (nodes.length === 0) {
      fetchRealGraph().then(({ nodes: realNodes, edges: realEdges }) => {
        useCommandStore.getState().setNodes(realNodes);
        useCommandStore.getState().setEdges(realEdges);
      });
    }
  }, []);

  // Побудова Map для швидкого пошуку
  const nodeMap = useMemo(() => {
    const map = new Map<string, SpatialNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Фізична симуляція
  useWorkerSimulation(nodes, edges);

  // Фокусування на вузлі → камера рухається
  const handleFocus = useCallback((id: string) => {
    const node = nodeMap.get(id);
    if (!node) return;

    setFocusedNode(id);

    // Перемістити камеру до вузла
    useCommandStore.getState().setCameraTarget([node.x, node.y, node.z]);
    useCommandStore.getState().setCameraMode('DEEP_DIVE');

    // AI реагує
    useCommandStore.getState().setCognitiveState('THINKING');
  }, [nodeMap, setFocusedNode]);

  return (
    <group>
      {/* Ребра */}
      <SpatialEdgeLines edges={edges} nodeMap={nodeMap} />

      {/* Вузли */}
      {nodes.map((node) => (
        <SpatialNodeMesh
          key={node.id}
          node={node}
          isFocused={node.id === focusedNodeId}
          onFocus={handleFocus}
        />
      ))}
    </group>
  );
}

export const SpatialGraph = memo(SpatialGraphInner);
