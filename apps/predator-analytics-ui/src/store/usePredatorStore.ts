import { create } from 'zustand'

export interface SynapticNode {
  id: string;
  label: string;
  group: 'core' | 'forge' | 'ai_agent' | 'data_stream';
  val: number;
  color: string;
}

export interface SynapticLink {
  source: string;
  target: string;
  value: number;
}

interface PredatorState {
  coreState: 'idle' | 'processing' | 'forging';
  isHammerStriking: boolean;
  forgeImpactTrigger: number;
  /** Чи відображати систему іскор у VoidForge */
  showSparks: boolean;
  logs: string[];
  graphData: {
    nodes: SynapticNode[];
    links: SynapticLink[];
  };
  hoveredNode: SynapticNode | null;

  setHoveredNode: (node: SynapticNode | null) => void;
  setCoreState: (state: 'idle' | 'processing' | 'forging') => void;
  triggerHammerStrike: () => void;
  registerImpact: () => void;
  addLog: (message: string) => void;
  addSynapticNode: (node: SynapticNode, linkToId?: string) => void;
  resetGraph: () => void;
  /** Перемикач видимості іскор */
  toggleSparks: () => void;
}

export const usePredatorStore = create<PredatorState>()((set, get) => ({
  coreState: 'idle',
  isHammerStriking: false,
  forgeImpactTrigger: 0,
  showSparks: true,
  logs: [
    '[SYS_INIT] Аналітичне Ядро PREDATOR v7.0 Активовано.',
    '[SYS_STANDBY] Когнітивні операції готові.'
  ],
  graphData: {
    nodes: [
      { id: 'core_prime', label: 'КВАНТОВИЙ МОЗОК', group: 'core', val: 18, color: '#b06aff' },
      { id: 'forge_nexus', label: 'ФІЗИЧНИЙ РУШІЙ', group: 'forge', val: 12, color: '#00f0ff' },
      { id: 'neo4j_graph', label: 'NEO4J (Граф)', group: 'data_stream', val: 10, color: '#ffb700' },
      { id: 'clickhouse', label: 'CLICKHOUSE (OLAP)', group: 'data_stream', val: 14, color: '#00e5ff' },
      { id: 'postgres', label: 'POSTGRESQL (SSOT)', group: 'data_stream', val: 8, color: '#3b82f6' },
      { id: 'qdrant', label: 'QDRANT (Векторна БД)', group: 'data_stream', val: 10, color: '#ec4899' },
      { id: 'opensearch', label: 'OPENSEARCH (Пошук)', group: 'data_stream', val: 9, color: '#10b981' },
      { id: 'kafka', label: 'REDPANDA (Потоки)', group: 'data_stream', val: 11, color: '#f97316' },
      { id: 'redis', label: 'REDIS (Кеш)', group: 'data_stream', val: 6, color: '#ef4444' },
      { id: 'minio', label: 'MINIO (Сховище)', group: 'data_stream', val: 7, color: '#f59e0b' },
      { id: 'llm_pool', label: 'NEMOTRON MOE', group: 'ai_agent', val: 16, color: '#b06aff' },
      { id: 'vision_agent', label: 'VISION QA АГЕНТ', group: 'ai_agent', val: 9, color: '#8b5cf6' },
      { id: 'coder_agent', label: 'QWEN-CODER АГЕНТ', group: 'ai_agent', val: 12, color: '#8b5cf6' },
    ],
    links: [
      { source: 'core_prime', target: 'llm_pool', value: 4.0 },
      { source: 'core_prime', target: 'vision_agent', value: 2.0 },
      { source: 'core_prime', target: 'coder_agent', value: 3.0 },
      { source: 'forge_nexus', target: 'core_prime', value: 3.5 },
      { source: 'forge_nexus', target: 'redis', value: 1.5 },
      { source: 'kafka', target: 'clickhouse', value: 3.0 },
      { source: 'kafka', target: 'neo4j_graph', value: 2.5 },
      { source: 'kafka', target: 'opensearch', value: 2.0 },
      { source: 'postgres', target: 'core_prime', value: 1.5 },
      { source: 'minio', target: 'vision_agent', value: 2.0 },
      { source: 'llm_pool', target: 'qdrant', value: 4.0 },
      { source: 'llm_pool', target: 'neo4j_graph', value: 3.5 },
      { source: 'coder_agent', target: 'clickhouse', value: 2.5 },
      { source: 'clickhouse', target: 'neo4j_graph', value: 1.0 },
      { source: 'opensearch', target: 'qdrant', value: 1.5 },
    ]
  },
  hoveredNode: null,

  setHoveredNode: (node) => set({ hoveredNode: node }),

  setCoreState: (state) => {
    set({ coreState: state });
    get().addLog(`[ЗМІНА_СТАНУ] Перехід в режим: ${state.toUpperCase()}`);
  },

  triggerHammerStrike: () => {
    if (get().isHammerStriking) return;
    set({ isHammerStriking: true, coreState: 'forging' });
    get().addLog('[РУШІЙ] Кінетичний імпульс заряджено. Запуск гравітаційного зсуву.');
    
    setTimeout(() => {
      set({ isHammerStriking: false });
      get().registerImpact();
    }, 800);
  },

  registerImpact: () => {
    set((state) => ({ 
      forgeImpactTrigger: state.forgeImpactTrigger + 1,
      coreState: 'processing'
    }));
    get().addLog('[РУШІЙ] Удар успішний. Вивільнення теплової енергії та частинок.');
  },

  addLog: (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      logs: [`[${timestamp}] ${message}`, ...state.logs.slice(0, 49)]
    }));
  },

  addSynapticNode: (node, linkToId) => {
    set((state) => {
      const updatedNodes = [...state.graphData.nodes, node];
      const updatedLinks = [...state.graphData.links];
      const targetId = linkToId || 'core_prime';
      updatedLinks.push({ source: targetId, target: node.id, value: Math.random() * 2 + 1 });
      return { graphData: { nodes: updatedNodes, links: updatedLinks } };
    });
    get().addLog(`[МЕРЕЖА] Вузол ${node.label} успішно інтегровано.`);
  },

  resetGraph: () => {
    set({
      graphData: {
        nodes: [{ id: 'core_prime', label: 'ЯДРО PRIME', group: 'core', val: 12, color: '#ffb700' }],
        links: []
      }
    });
    get().addLog('[МЕРЕЖА] Топологію перевантажено.');
  },

  toggleSparks: () => {
    set((state) => ({ showSparks: !state.showSparks }));
  }
}));
