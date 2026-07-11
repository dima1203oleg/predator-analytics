/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Єдиний Zustand Store
 * Центральний стан просторової когнітивної системи
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ─── Типи когнітивного стану ─────────────────────────────────────────────────

/** Режим камери — визначає спосіб сприйняття простору */
export type CameraMode = 'CLOSE_FACE' | 'HALF_BODY' | 'FULL_BODY' | 'PRESENTATION' | 'DEEP_DIVE' | 'OVERVIEW';

/** Режим взаємодії з системою (Interface Mode) */
export type InteractionMode = 'COMMUNICATION' | 'ANALYTICS' | 'OSINT' | 'DOCUMENTS' | 'INVESTIGATION';

/** Стан когнітивного процесу AI */
export type CognitiveState = 'DORMANT' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'PROCESSING';

/** Рівень занурення користувача */
export type ImmersionLevel = 'OBSERVER' | 'OPERATOR' | 'CONDUCTOR';

/** Рівень загрози (впливає на атмосферу) */
export type ThreatLevel = 0 | 1 | 2 | 3 | 4 | 5;

/** Просторовий вузол графа даних */
export interface SpatialNode {
  id: string;
  label: string;
  type: 'COMPANY' | 'PERSON' | 'TRANSACTION' | 'DOCUMENT' | 'RISK' | 'CLUSTER';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  risk: number;       // 0..1
  mass: number;       // впливає на гравітацію
  energy: number;     // 0..1 рівень активності
  connections: number;
}

/** Просторове ребро графа */
export interface SpatialEdge {
  id: string;
  source: string;
  target: string;
  weight: number;     // 0..1
  type: 'OWNERSHIP' | 'TRANSACTION' | 'RELATION' | 'RISK_LINK';
  energy: number;     // 0..1 активність потоку
}

/** Шар Z-пам'яті */
export interface MemoryLayer {
  id: string;
  query: string;
  timestamp: number;
  depth: number;      // Z-позиція
  nodeIds: string[];
  opacity: number;    // 0..1
}

/** Думка AI (для візуалізації потоку свідомості) */
export interface ThoughtNode {
  id: string;
  text: string;
  position: [number, number, number];
  intensity: number;
  lifetime: number;
  cluster: string;
}

// ─── Інтерфейс Store ─────────────────────────────────────────────────────────

interface CommandState {
  // ── Когнітивний двигун (Layer 2) ──
  cognitiveState: CognitiveState;
  thoughtNodes: ThoughtNode[];
  aiSpeechText: string;

  // ── Двигун реальності (Layer 1) ──
  nodes: SpatialNode[];
  edges: SpatialEdge[];
  threatLevel: ThreatLevel;
  focusedNodeId: string | null;
  graphEnergy: number;          // загальна енергія системи 0..1

  // ── Двигун сприйняття (Layer 3) ──
  cameraMode: CameraMode;
  cameraTarget: [number, number, number];
  cameraPosition: [number, number, number];
  memoryLayers: MemoryLayer[];
  currentDepth: number;         // Z-позиція камери у пам'яті

  // ── Шар взаємодії (Layer 4) ──
  interactionMode: InteractionMode;
  immersionLevel: ImmersionLevel;
  cursorWorld: [number, number, number];
  voiceActive: boolean;
  commandInput: string;
  businessContext: string | null;

  // ── Системний стан ──
  fps: number;
  idleTime: number;             // секунди без активності
  isDarkMatter: boolean;        // режим сну (idle mode)
  systemReady: boolean;

  // ── Дії когнітивного двигуна ──
  setCognitiveState: (s: CognitiveState) => void;
  addThought: (t: Omit<ThoughtNode, 'id'>) => void;
  clearThoughts: () => void;
  setAiSpeechText: (text: string) => void;

  // ── Дії двигуна реальності ──
  setNodes: (nodes: SpatialNode[]) => void;
  setEdges: (edges: SpatialEdge[]) => void;
  updateNodePositions: (positions: Float32Array) => void;
  setThreatLevel: (level: ThreatLevel) => void;
  setFocusedNode: (id: string | null) => void;
  setGraphEnergy: (e: number) => void;

  // ── Дії двигуна сприйняття ──
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setCameraPosition: (pos: [number, number, number]) => void;
  pushMemoryLayer: (layer: Omit<MemoryLayer, 'id' | 'depth'>) => void;
  setCurrentDepth: (d: number) => void;

  // ── Дії шару взаємодії ──
  setInteractionMode: (mode: InteractionMode) => void;
  setImmersionLevel: (level: ImmersionLevel) => void;
  setCursorWorld: (pos: [number, number, number]) => void;
  setVoiceActive: (active: boolean) => void;
  setCommandInput: (input: string) => void;
  setBusinessContext: (ctx: string | null) => void;

  // ── Системні дії ──
  setFPS: (fps: number) => void;
  tickIdle: (delta: number) => void;
  resetIdle: () => void;
  setDarkMatter: (active: boolean) => void;
  setSystemReady: (ready: boolean) => void;
}

// ─── Store Implementation ────────────────────────────────────────────────────

export const useCommandStore = create<CommandState>()(
  subscribeWithSelector((set, get) => ({
    // Початковий стан
    cognitiveState: 'DORMANT',
    thoughtNodes: [],
    aiSpeechText: '',

    nodes: [],
    edges: [],
    threatLevel: 0,
    focusedNodeId: null,
    graphEnergy: 0,

    cameraMode: 'OVERVIEW',
    cameraTarget: [0, 0, 0],
    cameraPosition: [0, 5, 20],
    memoryLayers: [],
    currentDepth: 0,

    immersionLevel: 'OBSERVER',
    interactionMode: 'COMMUNICATION',
    cursorWorld: [0, 0, 0],
    voiceActive: false,
    commandInput: '',
    businessContext: null,

    fps: 60,
    idleTime: 0,
    isDarkMatter: false,
    systemReady: false,

    // ── Когнітивний двигун ──
    setCognitiveState: (s) => set({ cognitiveState: s }),
    addThought: (t) => set((state) => ({
      thoughtNodes: [
        ...state.thoughtNodes.slice(-30), // максимум 30 думок
        { ...t, id: crypto.randomUUID() },
      ],
    })),
    clearThoughts: () => set({ thoughtNodes: [] }),
    setAiSpeechText: (text) => set({ aiSpeechText: text }),

    // ── Двигун реальності ──
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    updateNodePositions: (positions) => set((state) => {
      const nodes = [...state.nodes];
      for (let i = 0; i < nodes.length && i * 3 + 2 < positions.length; i++) {
        nodes[i] = {
          ...nodes[i],
          x: positions[i * 3],
          y: positions[i * 3 + 1],
          z: positions[i * 3 + 2],
        };
      }
      return { nodes };
    }),
    setThreatLevel: (level) => set({ threatLevel: level }),
    setFocusedNode: (id) => set({ focusedNodeId: id }),
    setGraphEnergy: (e) => set({ graphEnergy: Math.max(0, Math.min(1, e)) }),

    // ── Двигун сприйняття ──
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setCameraTarget: (target) => set({ cameraTarget: target }),
    setCameraPosition: (pos) => set({ cameraPosition: pos }),
    pushMemoryLayer: (layer) => set((state) => ({
      memoryLayers: [
        ...state.memoryLayers,
        {
          ...layer,
          id: crypto.randomUUID(),
          depth: state.memoryLayers.length * -15,
        },
      ],
    })),
    setCurrentDepth: (d) => set({ currentDepth: d }),

    // ── Шар взаємодії ──
    setInteractionMode: (mode) => set({ interactionMode: mode }),
    setImmersionLevel: (level) => set({ immersionLevel: level }),
    setCursorWorld: (pos) => set({ cursorWorld: pos }),
    setVoiceActive: (active) => set({ voiceActive: active }),
    setCommandInput: (input) => set({ commandInput: input }),
    setBusinessContext: (ctx) => set({ businessContext: ctx }),

    // ── Системні ──
    setFPS: (fps) => set({ fps }),
    tickIdle: (delta) => set((state) => {
      const newIdle = state.idleTime + delta;
      // Автоматичний перехід в Dark Matter після 120 секунд
      if (newIdle > 120 && !state.isDarkMatter) {
        return { idleTime: newIdle, isDarkMatter: true };
      }
      return { idleTime: newIdle };
    }),
    resetIdle: () => set({ idleTime: 0, isDarkMatter: false }),
    setDarkMatter: (active) => set({ isDarkMatter: active }),
    setSystemReady: (ready) => set({ systemReady: ready }),
  }))
);

// ─── Оптимізовані селектори ──────────────────────────────────────────────────

export const useCognitiveState = () => useCommandStore((s) => ({
  cognitive: s.cognitiveState,
  speechText: s.aiSpeechText,
}));

export const useGraphState = () => useCommandStore((s) => ({
  nodes: s.nodes,
  edges: s.edges,
  focusedNodeId: s.focusedNodeId,
  energy: s.graphEnergy,
}));

export const useCameraState = () => useCommandStore((s) => ({
  mode: s.cameraMode,
  target: s.cameraTarget,
  position: s.cameraPosition,
}));

export const useAtmosphereState = () => useCommandStore((s) => ({
  threatLevel: s.threatLevel,
  isDarkMatter: s.isDarkMatter,
  graphEnergy: s.graphEnergy,
}));
